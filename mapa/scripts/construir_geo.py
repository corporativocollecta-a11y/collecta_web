"""
Contornos de estados/regiones para el mapa coroplético: une las divisiones de primer nivel de Natural Earth
(ne_10m_admin_1_states_provinces, dominio público) en las regiones que usa cada vista y las simplifica.

Fuente: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson
        → data/fuentes/naturalearth/admin1_10m.geojson

Uso:
  python scripts/construir_geo.py
Salida: data/geo/<cc>.js → window.GEO_SUB.<CC> (GeoJSON con propiedad "id" = clave de región de la vista)
"""
import json
import re
import unicodedata
from pathlib import Path

from shapely.geometry import mapping, shape
from shapely.ops import unary_union

RAIZ = Path(__file__).resolve().parent.parent
NE = RAIZ / "data" / "fuentes" / "naturalearth" / "admin1_10m.geojson"
SALIDA = RAIZ / "data" / "geo"

# Tolerancia de simplificación en grados (países grandes admiten más)
TOLERANCIA = {"US": 0.03, "CA": 0.05, "AU": 0.04, "BR": 0.03, "MX": 0.015, "JP": 0.01, "PH": 0.01, "IT": 0.01,
              "FR": 0.01, "ES": 0.01, "PL": 0.01, "TR": 0.012, "EC": 0.01, "CO": 0.015, "PE": 0.015, "CL": 0.02,
              "NL": 0.005, "BE": 0.005, "PT": 0.008, "GR": 0.01, "NZ": 0.01, "KR": 0.008, "GT": 0.008, "CR": 0.008, "HN": 0.008}

# Claves ISO 3166-2 de Natural Earth → región de la vista, cuando no coinciden por nombre ni por código
MANUAL = {
    "CR": {"CR-SJ": "1", "CR-A": "2", "CR-C": "3", "CR-H": "4", "CR-G": "5", "CR-P": "6", "CR-L": "7"},
    "GT": {"GT-QZ": "09"},
    "NZ": {f"NZ-{c}": n for c, n in (("NTL", "01"), ("AUK", "02"), ("WKO", "03"), ("BOP", "04"), ("GIS", "05"), ("HKB", "06"),
                                      ("TKI", "07"), ("MWT", "08"), ("WGN", "09"), ("WTC", "12"), ("CAN", "13"), ("OTA", "14"),
                                      ("STL", "15"), ("TAS", "16"), ("NSN", "17"), ("MBH", "18"))},
    "KR": {f"KR-{c}": n for c, n in (("11", "11"), ("26", "21"), ("27", "22"), ("28", "23"), ("29", "24"), ("30", "25"),
                                      ("31", "26"), ("50", "29"), ("41", "31"), ("42", "32"), ("43", "33"), ("44", "34"),
                                      ("45", "35"), ("46", "36"), ("47", "37"), ("48", "38"), ("49", "39"))},
    "NL": {f"NL-{c}": f"PV{n}" for c, n in (("GR", 20), ("FR", 21), ("DR", 22), ("OV", 23), ("FL", 24), ("GE", 25), ("UT", 26),
                                              ("NH", 27), ("ZH", 28), ("ZE", 29), ("NB", 30), ("LI", 31))},
    # Portugal: las regiones NUTS II 2024 no siguen los límites de distrito; contorno aproximado por distrito
    "PT": {"PT-16": "PT11", "PT-03": "PT11", "PT-13": "PT11", "PT-17": "PT11", "PT-04": "PT11",
           "PT-01": "PT19", "PT-18": "PT19", "PT-09": "PT19", "PT-06": "PT19", "PT-05": "PT19", "PT-10": "PT19",
           "PT-14": "PT1D", "PT-11": "PT1A", "PT-15": "PT1B", "PT-12": "PT1C", "PT-07": "PT1C", "PT-02": "PT1C",
           "PT-08": "PT15", "PT-20": "PT20", "PT-30": "PT30"},
    "GR": {"GR-A": "EL51", "GR-B": "EL52", "GR-69": "EL52", "GR-C": "EL53", "GR-D": "EL54", "GR-E": "EL61", "GR-F": "EL62",
           "GR-G": "EL63", "GR-H": "EL64", "GR-J": "EL65", "GR-A1": "EL30", "GR-K": "EL41", "GR-L": "EL42", "GR-M": "EL43"},
    "MX": {"MX-DIF": "09", "MX-CMX": "09", "MX-MEX": "15", "MX-COA": "05", "MX-MIC": "16", "MX-VER": "30"},
    "CL": {"CL-RM": "13", "CL-LI": "06", "CL-AI": "11", "CL-MA": "12", "CL-BI": "08", "CL-NB": "16",
           "CL-AR": "09", "CL-LR": "14", "CL-LL": "10", "CL-VS": "05", "CL-CO": "04", "CL-AT": "03",
           "CL-AN": "02", "CL-TA": "01", "CL-AP": "15", "CL-ML": "07"},
    "CO": {"CO-DC": "11", "CO-CUN": "25", "CO-SAP": "88", "CO-VAC": "76", "CO-NSA": "54"},
    "PE": {"PE-LMA": "15", "PE-LIM": "15", "PE-CAL": "07"},
    "AU": {"AU-NSW": "1", "AU-VIC": "2", "AU-QLD": "3", "AU-SA": "4", "AU-WA": "5", "AU-TAS": "6", "AU-NT": "7",
           "AU-ACT": "8"},
    "PL": {"PL-DS": "02", "PL-KP": "04", "PL-LU": "06", "PL-LB": "08", "PL-LD": "10", "PL-MA": "12", "PL-MZ": "14",
           "PL-OP": "16", "PL-PK": "18", "PL-PD": "20", "PL-PM": "22", "PL-SL": "24", "PL-SK": "26", "PL-WN": "28",
           "PL-WP": "30", "PL-ZP": "32"},
}
# Países donde Natural Earth trae provincias/departamentos: se agrupan por su campo "region" (o por código)
POR_REGION = {
    "ES": {"andalucia": "01", "aragon": "02", "asturias": "03", "principado de asturias": "03", "islas baleares": "04",
           "illes balears": "04", "canary is.": "05", "canarias": "05", "cantabria": "06", "castilla y leon": "07",
           "castilla-la mancha": "08", "cataluna": "09", "catalunya": "09", "valenciana": "10",
           "comunidad valenciana": "10", "extremadura": "11", "galicia": "12", "madrid": "13",
           "comunidad de madrid": "13", "murcia": "14", "region de murcia": "14", "foral de navarra": "15",
           "navarra": "15", "pais vasco": "16", "la rioja": "17", "ceuta": "18", "melilla": "19"},
    "IT": {"piemonte": "ITC1", "valle d'aosta": "ITC2", "liguria": "ITC3", "lombardia": "ITC4",
           "trentino-alto adige": "ITDA", "trentino-south tyrol": "ITDA", "veneto": "ITD3",
           "friuli-venezia giulia": "ITD4", "emilia-romagna": "ITD5", "toscana": "ITE1", "umbria": "ITE2",
           "marche": "ITE3", "lazio": "ITE4", "abruzzo": "ITF1", "molise": "ITF2", "campania": "ITF3",
           "apulia": "ITF4", "puglia": "ITF4", "basilicata": "ITF5", "calabria": "ITF6", "sicily": "ITG1",
           "sicilia": "ITG1", "sardegna": "ITG2", "sardinia": "ITG2"},
    "FR": {"ile-de-france": "11", "centre-val de loire": "24", "centre": "24", "bourgogne-franche-comte": "27",
           "normandie": "28", "hauts-de-france": "32", "grand est": "44", "pays de la loire": "52",
           "bretagne": "53", "nouvelle-aquitaine": "75", "occitanie": "76", "auvergne-rhone-alpes": "84",
           "provence-alpes-cote-d'azur": "93", "corse": "94", "guadeloupe": "971", "martinique": "972",
           "guyane francaise": "973", "la reunion": "974", "reunion": "974", "mayotte": "976"},
    "PH": {"PH-15": "CAR", "PH-01": "R01", "PH-02": "R02", "PH-03": "R03", "PH-40": "R4A", "PH-41": "R4B",
           "PH-05": "R05", "PH-06": "R06", "PH-07": "R07", "PH-08": "R08", "PH-09": "R09", "PH-10": "R10",
           "PH-11": "R11", "PH-12": "R12", "PH-13": "R13", "PH-14": "BARMM", "PH-00": "NCR"},
}
# Filipinas: la Región de la Isla de Negros (2024) agrupa provincias de las regiones VI y VII
PH_NIR = {"negros occidental", "negros oriental", "siquijor"}


def norm(s):
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"\b(departamento|provincia|region|regiao|estado|state|province|prefecture|de|del|d\.c\.|the)\b", " ", s)
    return re.sub(r"[^a-z0-9]+", "", s)


def regiones_vista(cc):
    if cc == "MX":
        t = (RAIZ / "data" / "estados.js").read_text(encoding="utf-8")
        return {m[0]: m[1] for m in re.findall(r'id:\s*"(\d+)".*?nombre:\s*"([^"]+)"', t)}
    t = (RAIZ / "data" / f"sub_{cc.lower()}.js").read_text(encoding="utf-8")
    t = t[t.index(f"window.SUBNACIONAL.{cc} ="):]
    d = json.loads(t[t.index("=") + 1:].strip().rstrip(";"))
    return {k: v["nombre"] for k, v in d["regiones"].items()}


def asignar(cc, p, vista, por_nombre):
    iso = p["iso_3166_2"] or ""
    if cc == "CO" and norm(p["name"]) == "bogota":   # comparte código ISO con Cundinamarca
        return "11"
    if cc in MANUAL and iso in MANUAL[cc]:
        return MANUAL[cc][iso]
    if cc == "PH":
        if norm(p["name"]) in {norm(x) for x in PH_NIR}:
            return "NIR"
        if p["region_cod"] in POR_REGION["PH"]:
            return POR_REGION["PH"][p["region_cod"]]
        if "manila" in norm(p["region"]) or "capital" in norm(p["region"]) or "ncr" in norm(p["region"]):
            return "NCR"
        return None
    if cc in POR_REGION:
        claves = POR_REGION[cc]
        for campo in ("region", "name"):
            r = unicodedata.normalize("NFKD", str(p[campo] or "")).encode("ascii", "ignore").decode().lower().strip()
            if r in claves:
                return claves[r]
        return None
    suf = iso.split("-")[-1]
    if suf in vista:
        return suf
    for campo in ("name", "name_es", "name_alt", "name_local", "name_en", "woe_name", "gn_name"):
        for v in str(p[campo] or "").split("|"):
            if norm(v) in por_nombre:
                return por_nombre[norm(v)]
    return None


def main():
    ne = json.loads(NE.read_text(encoding="utf-8"))
    SALIDA.mkdir(parents=True, exist_ok=True)
    for cc, tol in TOLERANCIA.items():
        vista = regiones_vista(cc)
        por_nombre = {norm(n): k for k, n in vista.items()}
        grupos, sueltos = {}, []
        for f in ne["features"]:
            p = f["properties"]
            if p["iso_a2"] != cc:
                continue
            r = asignar(cc, p, vista, por_nombre)
            if r is None or r not in vista:
                sueltos.append(f"{p['name']} ({p['iso_3166_2']}, {p['region']})")
                continue
            grupos.setdefault(r, []).append(shape(f["geometry"]))
        faltan = [f"{k}:{n}" for k, n in vista.items() if k not in grupos]
        feats = []
        for r, geoms in grupos.items():
            g = unary_union([x.buffer(0) for x in geoms]).simplify(tol, preserve_topology=True)
            geo = json.loads(json.dumps(mapping(g)), parse_float=lambda x: round(float(x), 3))
            feats.append({"type": "Feature", "properties": {"id": r}, "geometry": geo})
        destino = SALIDA / f"{cc.lower()}.js"
        destino.write_text(
            "// Contornos: Natural Earth admin-1 10m (dominio público), unidos y simplificados por scripts/construir_geo.py\n"
            "window.GEO_SUB = window.GEO_SUB || {};\n"
            f"window.GEO_SUB.{cc} = {json.dumps({'type': 'FeatureCollection', 'features': feats}, separators=(',', ':'))};\n",
            encoding="utf-8")
        print(f"{cc}: {len(feats)}/{len(vista)} regiones, {destino.stat().st_size / 1e3:.0f} kB"
              + (f"\n   sin forma: {faltan}" if faltan else "") + (f"\n   sin asignar: {sueltos}" if sueltos else ""))


def paises():
    """Países (Natural Earth admin-0 50m) con su código M49 como id, para las vistas Latinoamérica y Mundo."""
    ne = json.loads((NE.parent / "admin0_50m.geojson").read_text(encoding="utf-8"))
    feats = []
    for f in ne["features"]:
        p = f["properties"]
        n3 = p["ISO_N3"] if p["ISO_N3"] not in ("-99", None) else p["ISO_N3_EH"]
        if n3 in ("-99", None) or p["ADMIN"] == "Antarctica":
            continue
        g = shape(f["geometry"]).buffer(0).simplify(0.06, preserve_topology=True)
        geo = json.loads(json.dumps(mapping(g)), parse_float=lambda x: round(float(x), 2))
        feats.append({"type": "Feature", "properties": {"id": str(int(n3)).zfill(3)}, "geometry": geo})
    destino = SALIDA / "paises.js"
    destino.write_text(
        "// Contornos: Natural Earth admin-0 50m (dominio público); id = código M49, scripts/construir_geo.py\n"
        f"window.GEO_PAISES = {json.dumps({'type': 'FeatureCollection', 'features': feats}, separators=(',', ':'))};\n",
        encoding="utf-8")
    print(f"países: {len(feats)}, {destino.stat().st_size / 1e3:.0f} kB")


if __name__ == "__main__":
    main()
    paises()

"""
Vista Filipinas: producción por región de la Philippine Statistics Authority (PSA OpenSTAT, API PxWeb sin clave)
y población del Censo 2024 (POPCEN). Comercio con FAOSTAT mediante el motor común.

Fuentes (https://openstat.psa.gov.ph/PXWeb/api/v1/en/DB/2E/CS/…):
  - 0072E4EVCP2.px  Fruit Crops: Volume of Production, by Region, Province, Quarter, Semester (t).
  - 0082E4EVCP3.px  Vegetables and Root Crops: Volume of Production (t).
  - Población: Censo de Población 2024 (tabla de OpenSTAT, 1A), total por región.

Uso:
  python scripts/procesar_psa.py [año=2025]
Salida: data/sub_ph.js → window.SUBNACIONAL.PH
"""
import json
import re
import sys
import urllib.request
from pathlib import Path

from subnacional_comun import escribir_pais, fao_bruto, resumen

RAIZ = Path(__file__).resolve().parent.parent
CACHE = RAIZ / "data" / "fuentes" / "psa"
BASE = "https://openstat.psa.gov.ph/PXWeb/api/v1/en/DB/"
UA = "Mozilla/5.0"   # el API rechaza el agente por defecto de Python

# Región (texto PSA sin puntos iniciales) → (id, nombre corto, lat, lon del centro regional)
REGIONES = {
    "CORDILLERA ADMINISTRATIVE REGION (CAR)": ("CAR", "Cordillera (CAR)", 16.41, 120.60),
    "REGION I (ILOCOS REGION)": ("R01", "Ilocos", 16.62, 120.32),
    "REGION II (CAGAYAN VALLEY)": ("R02", "Valle de Cagayán", 17.61, 121.73),
    "REGION III (CENTRAL LUZON)": ("R03", "Luzón Central", 15.03, 120.69),
    "REGION IV-A (CALABARZON)": ("R4A", "Calabarzon", 14.10, 121.08),
    "MIMAROPA REGION": ("R4B", "Mimaropa", 13.41, 121.18),
    "REGION V (BICOL REGION)": ("R05", "Bícol", 13.14, 123.74),
    "REGION VI (WESTERN VISAYAS)": ("R06", "Bisayas Occidental", 10.72, 122.56),
    "NEGROS ISLAND REGION (NIR)": ("NIR", "Isla de Negros (NIR)", 10.40, 122.95),
    "REGION VII (CENTRAL VISAYAS)": ("R07", "Bisayas Central", 10.32, 123.89),
    "REGION VIII (EASTERN VISAYAS)": ("R08", "Bisayas Oriental", 11.24, 125.00),
    "REGION IX (ZAMBOANGA PENINSULA)": ("R09", "Península de Zamboanga", 7.83, 123.43),
    "REGION X (NORTHERN MINDANAO)": ("R10", "Mindanao del Norte", 8.48, 124.65),
    "REGION XI (DAVAO REGION)": ("R11", "Dávao", 7.07, 125.61),
    "REGION XII (SOCCSKSARGEN)": ("R12", "Soccsksargen", 6.50, 124.85),
    "REGION XIII (CARAGA)": ("R13", "Caraga", 8.95, 125.54),
    "BANGSAMORO AUTONOMOUS REGION IN MUSLIM MINDANAO": ("BARMM", "Bangsamoro (BARMM)", 7.22, 124.25),
    "NATIONAL CAPITAL REGION (NCR)": ("NCR", "Metro Manila (NCR)", 14.60, 120.98),
}

# producto del mapa → (tabla, [cultivos PSA])
FRUTAS, HORT = "2E/CS/0072E4EVCP2.px", "2E/CS/0082E4EVCP3.px"
PRODUCTOS = {
    "platano": (FRUTAS, ["Banana"]), "mango": (FRUTAS, ["Mango"]), "pina": (FRUTAS, ["Pineapple"]),
    "papaya": (FRUTAS, ["Papaya"]), "aguacate": (FRUTAS, ["Avocado"]), "limon": (FRUTAS, ["Calamansi"]),
    "naranja": (FRUTAS, ["Orange", "Dalandan"]), "sandia": (FRUTAS, ["Watermelon"]), "melon": (FRUTAS, ["Melon"]),
    "jitomate": (HORT, ["Tomato"]), "cebolla": (HORT, ["Onion, mature bulb"]), "papa": (HORT, ["Potato"]),
    "chile": (HORT, ["Pepper"]), "berenjena": (HORT, ["Eggplant"]), "zanahoria": (HORT, ["Carrot"]),
    "lechuga": (HORT, ["Lettuce"]), "brocoli": (HORT, ["Broccoli", "Cauliflower"]),
    "calabacita": (HORT, ["Squash fruit"]), "esparrago": (HORT, ["Asparagus"]),
}
NOMBRES = {"limon": "Calamansi (limón filipino)", "naranja": "Naranja y dalandan", "brocoli": "Brócoli y coliflor"}
NOTAS = {
    "platano": "Plátano de todas las variedades (cavendish de exportación, saba, lakatan, latundan y otras).",
    "limon": "Calamansi, el cítrico ácido de Filipinas; su comercio es el de limones y limas de la FAO.",
    "naranja": "Naranja y dalandan (la naranja local).",
    "brocoli": "Brócoli y coliflor juntos, como la partida de la FAO.",
    "chile": "Pimiento morrón y chile largo (finger pepper).",
    "mango": "Carabao (el mango filipino), piko, indio y otros. La FAO agrupa mango, guayaba y mangostán.",
}


def pxweb(tabla, consulta, nombre):
    archivo = CACHE / nombre
    if not archivo.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(BASE + tabla, data=json.dumps(consulta).encode(),
                                     headers={"Content-Type": "application/json", "User-Agent": UA})
        with urllib.request.urlopen(req, timeout=300) as r:
            archivo.write_bytes(r.read())
    return json.loads(archivo.read_text(encoding="utf-8-sig"))


def region(texto):
    """Texto de región de PSA sin puntos, notas al pie ("1/") ni sufijo "(BARMM)"."""
    t = re.sub(r"\s+\d+/\*?$", "", texto.strip(".").strip()).upper()
    t = t.replace(" (BARMM)", "")
    return REGIONES.get(t)


def meta(tabla):
    with urllib.request.urlopen(urllib.request.Request(BASE + tabla, headers={"User-Agent": UA}), timeout=120) as r:
        return json.loads(r.read())


def produccion(tabla, cultivos, anio):
    m = meta(tabla)
    var = {v["code"]: v for v in m["variables"]}
    geo = var["Geolocation"]
    codigos_geo = [c for c, t in zip(geo["values"], geo["valueTexts"])
                   if t.startswith("..") and not t.startswith("....") and region(t)]
    anios = var["Year"]
    codigo_anio = anios["values"][anios["valueTexts"].index(str(anio))]   # el API usa el índice, no el texto
    crop = var["Crop"]
    codigos_crop = [c for c, t in zip(crop["values"], crop["valueTexts"]) if t in cultivos]
    assert len(codigos_crop) == len(cultivos), (cultivos, crop["valueTexts"][:5])
    per = var["Period"]
    anual = per["values"][per["valueTexts"].index("Annual")]
    consulta = {"query": [
        {"code": "Crop", "selection": {"filter": "item", "values": codigos_crop}},
        {"code": "Geolocation", "selection": {"filter": "item", "values": codigos_geo}},
        {"code": "Year", "selection": {"filter": "item", "values": [codigo_anio]}},
        {"code": "Period", "selection": {"filter": "item", "values": [anual]}},
    ], "response": {"format": "json"}}
    d = pxweb(tabla, consulta, f"{tabla.split('/')[-1]}_{'_'.join(codigos_crop)}_{anio}.json")
    textos = dict(zip(geo["values"], geo["valueTexts"]))
    orden = [c["code"] for c in d["columns"]]
    out = {}
    for fila in d["data"]:
        k = dict(zip(orden, fila["key"]))
        v = fila["values"][0]
        if v not in ("..", "-", ".", ""):
            rid = region(textos[k["Geolocation"]])[0]
            out[rid] = out.get(rid, 0) + float(v)
    return out


def poblacion():
    """Censo de Población 2024 por región (tabla de OpenSTAT); busca la tabla en el árbol 1A."""
    archivo = CACHE / "popcen2024_regiones.json"
    if archivo.exists():
        return json.loads(archivo.read_text(encoding="utf-8"))
    raise SystemExit("Falta data/fuentes/psa/popcen2024_regiones.json: población por región del Censo 2024 (tabla "
                     "1A/PO_2024/0211A6DAPG0.px), con la Negros Island Region devuelta a Bisayas Occidental y Central")


def main(anio=2025):
    pob = poblacion()
    extra = {}
    datos = {
        "codigo": "PH", "m49": "608", "pais": "Filipinas", "nivel": "región", "nivelPlural": "regiones", "femenino": True,
        "anio": anio, "anioPoblacion": 2024,
        "fuente": f"PSA OpenSTAT producción de cultivos {anio}, PSA Censo de Población 2024, FAOSTAT",
        "fuenteCorta": f"PSA {anio}",
        "metodo": "Producción anual por región de la Philippine Statistics Authority (suma de trimestres), sin estimaciones "
                  "propias. Población del Censo de Población 2024.",
        "limites": [[4.5, 116.8], [21.2, 126.8]],
        "regiones": {rid: {"nombre": n, "lat": la, "lon": lo, "pob": pob.get(rid)} for (rid, n, la, lo) in REGIONES.values()},
        "productos": {},
    }
    for clave, (tabla, cultivos) in PRODUCTOS.items():
        reg = produccion(tabla, cultivos, anio)
        if not reg:
            print("  (sin datos:", clave, ")")
            continue
        datos["productos"][clave] = {
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            **({"nota": NOTAS[clave]} if clave in NOTAS else {}),
            "fuenteProduccion": "PSA", "anioProduccion": anio,
            "nacional": round(sum(reg.values())), "ha": 0,
            "regiones": {r: [round(t), 0] for r, t in reg.items() if t > 0},
            **({"comercio": extra[clave]["comercio"]} if clave in extra else {}),
        }
    destino = escribir_pais(datos)
    print(f"-> {destino.name} ({destino.stat().st_size / 1e3:.0f} kB) · población {sum(pob.values()):,}")
    resumen(datos)


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 2025)

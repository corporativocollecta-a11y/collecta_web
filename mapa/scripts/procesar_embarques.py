"""
Embarques semanales por origen (USDA AMS, reporte 1662 National Shipping Point Trends) para el mapa de embarques y el
pronóstico: cuánto sale cada semana de cada zona productora de EE. UU. (Salinas, Imperial, Yuma, Florida…), de cada
cruce con México (Texas, Nogales, Otay Mesa, Calexico/San Luis) y de cada puerto de importación (por país de origen).

Entrada: data/fuentes/usda/ams/1662_<año>-<mes>.json.gz (scripts/descargar_historia_ams.py). Cada reporte semanal trae
tres semanas; se toma la más reciente (week1), que es la semana anterior a la fecha del reporte (igual que procesar_ams.py).
Unidad del USDA: 1,000 cwt = 45.36 t.

Salida: data/embarques.js → window.EMBARQUES (carga diferida desde js/embarques.js)
  semanas: ["AAAA-MM-DD", …] (lunes de cada semana), origenes: {id: [nombre, lat, lon, tipo, estado]},
  productos: {clave: {id: [índice de la primera semana, [t por semana…]]}}
  tipo: "eua" (zona productora de EE. UU.), "mx" (cruce de México), "imp" (puerto de importación), "mixto".
Uso: python scripts/procesar_embarques.py
"""
import glob
import gzip
import json
import sys
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from procesar_ams import CWT_T, PRODUCTOS, VOLUMEN_EXTRA, VOLUMEN_MX  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
FUENTE = RAIZ / "data" / "fuentes" / "usda" / "ams"

# id → (nombre, lat, lon, tipo, estado o país)
ORIGENES = {
    "mx_tx": ("Cruces por Texas (Pharr, Laredo…)", 26.20, -98.23, "mx", "TX"),
    "mx_nog": ("Cruce de Nogales", 31.34, -110.94, "mx", "AZ"),
    "mx_otay": ("Cruce de Otay Mesa", 32.55, -116.94, "mx", "CA"),
    "mx_cal": ("Cruces de Calexico y San Luis", 32.60, -115.10, "mx", "CA"),
    "mx_var": ("Cruces de México (varios)", 29.5, -106.4, "mx", "—"),
    "ca_salinas": ("Salinas-Watsonville", 36.68, -121.66, "eua", "CA"),
    "ca_sjv": ("Valle de San Joaquín", 36.75, -119.77, "eua", "CA"),
    "ca_kern": ("Kern", 35.37, -119.02, "eua", "CA"),
    "ca_santamaria": ("Santa María", 34.95, -120.44, "eua", "CA"),
    "ca_oxnard": ("Oxnard", 34.20, -119.18, "eua", "CA"),
    "ca_imperial": ("Imperial y Coachella", 32.85, -115.57, "eua", "CA"),
    "ca_sur": ("Sur y centro de California", 34.10, -117.30, "eua", "CA"),
    "ca_costa": ("Costa central de California", 35.28, -120.66, "eua", "CA"),
    "ca_norte": ("Norte de California", 38.58, -121.49, "eua", "CA"),
    "az_oeste": ("Yuma y oeste de Arizona", 32.69, -114.63, "eua", "AZ"),
    "wa_yakima": ("Yakima y Wenatchee", 46.60, -120.51, "eua", "WA"),
    "wa_columbia": ("Cuenca del Columbia (WA-OR)", 46.23, -119.10, "eua", "WA"),
    "wa_wallawalla": ("Walla Walla", 46.06, -118.34, "eua", "WA"),
    "id_upper": ("Idaho (Upper Valley, Twin Falls)", 43.20, -113.80, "eua", "ID"),
    "id_malheur": ("Idaho y Malheur (OR)", 43.66, -116.80, "eua", "ID"),
    "co_sanluis": ("Valle de San Luis", 37.57, -105.99, "eua", "CO"),
    "co": ("Colorado", 39.55, -105.78, "eua", "CO"),
    "wi": ("Wisconsin", 44.50, -89.57, "eua", "WI"),
    "mi": ("Míchigan", 43.30, -84.50, "eua", "MI"),
    "mn_nd": ("Valle del Río Rojo (MN-ND)", 47.90, -96.90, "eua", "MN"),
    "mn": ("Minnesota", 45.30, -93.90, "eua", "MN"),
    "ne": ("Nebraska", 41.50, -99.90, "eua", "NE"),
    "ny": ("Nueva York", 42.90, -76.00, "eua", "NY"),
    "ne_eng": ("Nueva Inglaterra", 43.50, -71.50, "eua", "MA"),
    "fl_sur": ("Sur de Florida", 26.10, -80.40, "eua", "FL"),
    "fl_centro": ("Centro y sur de Florida", 27.80, -81.70, "eua", "FL"),
    "fl_oeste": ("Oeste de Florida y Carolina del Sur", 29.50, -82.50, "eua", "FL"),
    "ga_sur": ("Sur de Georgia", 31.30, -83.50, "eua", "GA"),
    "ga_vidalia": ("Vidalia", 32.22, -82.41, "eua", "GA"),
    "nc": ("Carolina del Norte", 35.50, -78.30, "eua", "NC"),
    "sc": ("Carolina del Sur", 33.90, -81.20, "eua", "SC"),
    "va_este": ("Costa este de Virginia y Delmarva", 37.70, -75.70, "eua", "VA"),
    "tn_va": ("Este de Tennessee", 36.20, -83.50, "eua", "TN"),
    "apalache": ("Distrito Apalache (MD, PA, VA, WV)", 39.50, -78.00, "eua", "PA"),
    "tx_rgv": ("Valle bajo del Río Bravo", 26.20, -97.90, "eua", "TX"),
    "tx_hereford": ("Hereford-High Plains", 34.82, -102.40, "eua", "TX"),
    "tx_sur": ("Sur de Texas (Winter Garden, Laredo)", 28.70, -99.80, "eua", "TX"),
    "tx": ("Texas", 31.00, -99.00, "eua", "TX"),
    "nm_sur": ("Sur de Nuevo México", 32.30, -106.80, "eua", "NM"),
    "in_il": ("Suroeste de Indiana y sureste de Illinois", 38.40, -87.60, "eua", "IN"),
    "mo_se": ("Sureste de Misuri", 36.80, -89.80, "eua", "MO"),
    "ar_se": ("Sureste de Arkansas", 33.70, -91.40, "eua", "AR"),
    "ms": ("Misisipi", 32.70, -89.70, "eua", "MS"),
    "al": ("Alabama", 32.80, -86.80, "eua", "AL"),
    "la": ("Luisiana", 30.90, -92.00, "eua", "LA"),
    "ut": ("Utah", 40.30, -111.70, "eua", "UT"),
    "me": ("Aroostook (Maine)", 46.70, -68.00, "eua", "ME"),
    "az": ("Arizona", 33.40, -112.00, "eua", "AZ"),
    "ks": ("Kansas", 38.50, -98.30, "eua", "KS"),
    "nj": ("Sur de Nueva Jersey", 39.50, -74.90, "eua", "NJ"),
    "ca_delta": ("Delta de Stockton", 38.00, -121.40, "eua", "CA"),
    "or_wa": ("Oregón y Washington", 45.50, -122.70, "eua", "OR"),
    "bc": ("Columbia Británica (Canadá) por Washington", 49.00, -122.75, "imp", "Canadá"),
    "imp_fl": ("Importaciones por el sur de Florida", 25.80, -80.25, "imp", "FL"),
    "imp_phl": ("Importaciones por Filadelfia y Nueva York", 39.90, -75.14, "imp", "PA"),
    "imp_socal": ("Importaciones por el sur de California", 33.75, -118.25, "imp", "CA"),
    "imp_este": ("Importaciones por la costa este", 38.50, -76.00, "imp", "—"),
}

# Reglas en orden: la primera que coincide gana (los distritos que mezclan California/Arizona con cruces de México
# van a "mixto" en Calexico/Imperial para no inflar a México ni a EE. UU.)
REGLAS = [
    ("MEXICO CROSSINGS THROUGH NOGALES", "mx_nog"), ("MEXICO CROSSINGS THROUGH OTAY", "mx_otay"),
    ("MEXICO CROSSINGS THROUGH CALEXICO", "mx_cal"), ("MEXICO CROSSINGS THROUGH SOUTHERN CALIFORNIA AND SAN LUIS", "mx_cal"),
    ("MEXICO CROSSINGS THROUGH ARIZONA, CALIFORNIA AND TEXAS", "mx_var"), ("MEXICO CROSSINGS THROUGH SOUTH TEXAS", "mx_tx"),
    ("MEXICO CROSSINGS THROUGH TEXAS", "mx_tx"),
    ("MEXICO CROSSINGS", "mixto"),
    ("BRITISH COLUMBIA", "bc"),
    ("PORTS OF ENTRY SOUTH FLORIDA", "imp_fl"), ("PORT OF ENTRY MIAMI", "imp_fl"), ("IMPORTS THROUGH MIAMI", "imp_fl"),
    ("PORTS OF ENTRY MIAMI, PHILADELPHIA", "imp_phl"), ("PHILADELPHIA", "imp_phl"),
    ("SOUTHERN CALIFORNIA", "imp_socal"), ("LOS ANGELES AREA", "imp_socal"),
    ("EAST COAST", "imp_este"),
    ("SALINAS", "ca_salinas"), ("KERN", "ca_kern"), ("SANTA MARIA", "ca_santamaria"), ("OXNARD", "ca_oxnard"),
    ("SAN JOAQUIN", "ca_sjv"), ("ATWATER", "ca_sjv"), ("COACHELLA", "ca_imperial"), ("IMPERIAL", "ca_imperial"),
    ("CENTRAL COAST CALIFORNIA", "ca_costa"), ("CALIFORNIA COAST", "ca_costa"), ("NORTHERN CALIFORNIA", "ca_norte"),
    ("SOUTH AND CENTRAL DISTRICT CALIFORNIA", "ca_sur"), ("SOUTH DISTRICT CALIFORNIA", "ca_sur"),
    ("CENTRAL DISTRICT CALIFORNIA", "ca_sur"), ("CENTRAL AND SOUTHERN CALIFORNIA", "ca_sur"),
    ("WESTERN ARIZONA", "az_oeste"),
    ("YAKIMA VALLEY AND WENATCHEE", "wa_yakima"), ("WALLA WALLA", "wa_wallawalla"), ("COLUMBIA BASIN", "wa_columbia"),
    ("UPPER VALLEY", "id_upper"), ("MALHEUR", "id_malheur"), ("SAN LUIS VALLEY", "co_sanluis"), ("COLORADO", "co"),
    ("WISCONSIN", "wi"), ("MICHIGAN", "mi"), ("RED RIVER", "mn_nd"), ("MINNESOTA", "mn"), ("NEBRASKA", "ne"),
    ("NEW YORK", "ny"), ("NEW ENGLAND", "ne_eng"),
    ("FLORIDA WEST", "fl_oeste"), ("NORTH FLORIDA AND SOUTH GEORGIA", "ga_sur"), ("SOUTH FLORIDA", "fl_sur"),
    ("FLORIDA SOUTH", "fl_sur"), ("FLORIDA", "fl_centro"),
    ("VIDALIA", "ga_vidalia"), ("GEORGIA", "ga_sur"), ("NORTH CAROLINA", "nc"), ("SOUTH CAROLINA", "sc"),
    ("EASTERN SHORE VIRGINIA", "va_este"), ("DELAWARE", "va_este"), ("TENNESSEE", "tn_va"), ("APPALACHIAN", "apalache"),
    ("LOWER RIO GRANDE", "tx_rgv"), ("HEREFORD", "tx_hereford"), ("WINTER GARDEN", "tx_sur"), ("SOUTH TEXAS", "tx_sur"),
    ("TEXAS", "tx"), ("NEW MEXICO", "nm_sur"), ("INDIANA", "in_il"), ("MISSOURI", "mo_se"), ("ARKANSAS", "ar_se"),
    ("MISSISSIPPI", "ms"), ("ALABAMA", "al"), ("LOUISIANA", "la"), ("UTAH", "ut"), ("OREGON AND WASHINGTON", "or_wa"),
    ("AROOSTOOK", "me"), ("NEW JERSEY", "nj"), ("STOCKTON", "ca_delta"), ("ARIZONA", "az"), ("KANSAS", "ks"),
]
ORIGENES["mixto"] = ("Imperial, oeste de Arizona y cruces de Calexico/San Luis (mezclados)", 32.75, -115.2, "mixto", "CA")

# Nombres en inglés (la versión en inglés del mapa los usa tal cual)
NOMBRES_EN = {
    "mx_tx": "Crossings through Texas (Pharr, Laredo…)", "mx_nog": "Nogales crossing", "mx_otay": "Otay Mesa crossing",
    "mx_cal": "Calexico and San Luis crossings", "mx_var": "Mexico crossings (several)", "ca_salinas": "Salinas-Watsonville",
    "ca_sjv": "San Joaquin Valley", "ca_kern": "Kern", "ca_santamaria": "Santa Maria", "ca_oxnard": "Oxnard",
    "ca_imperial": "Imperial and Coachella", "ca_sur": "Southern and central California", "ca_costa": "California central coast",
    "ca_norte": "Northern California", "az_oeste": "Yuma and western Arizona", "wa_yakima": "Yakima and Wenatchee",
    "wa_columbia": "Columbia Basin (WA-OR)", "wa_wallawalla": "Walla Walla", "id_upper": "Idaho (Upper Valley, Twin Falls)",
    "id_malheur": "Idaho and Malheur (OR)", "co_sanluis": "San Luis Valley", "co": "Colorado", "wi": "Wisconsin", "mi": "Michigan",
    "mn_nd": "Red River Valley (MN-ND)", "mn": "Minnesota", "ne": "Nebraska", "ny": "New York", "ne_eng": "New England",
    "fl_sur": "South Florida", "fl_centro": "Central and south Florida", "fl_oeste": "West Florida and South Carolina",
    "ga_sur": "South Georgia", "ga_vidalia": "Vidalia", "nc": "North Carolina", "sc": "South Carolina",
    "va_este": "Virginia Eastern Shore and Delmarva", "tn_va": "Eastern Tennessee", "apalache": "Appalachian district (MD, PA, VA, WV)",
    "tx_rgv": "Lower Rio Grande Valley", "tx_hereford": "Hereford-High Plains", "tx_sur": "South Texas (Winter Garden, Laredo)",
    "tx": "Texas", "nm_sur": "Southern New Mexico", "in_il": "SW Indiana and SE Illinois", "mo_se": "Southeast Missouri",
    "ar_se": "Southeast Arkansas", "ms": "Mississippi", "al": "Alabama", "la": "Louisiana", "ut": "Utah", "or_wa": "Oregon and Washington",
    "me": "Aroostook (Maine)", "nj": "South New Jersey", "ca_delta": "Stockton Delta", "az": "Arizona", "ks": "Kansas", "bc": "British Columbia (Canada) via Washington",
    "imp_fl": "Imports through South Florida", "imp_phl": "Imports through Philadelphia and New York",
    "imp_socal": "Imports through Southern California", "imp_este": "Imports through the East Coast",
    "mixto": "Imperial, western Arizona and Calexico/San Luis crossings (combined)",
}


def origen(distrito):
    d = (distrito or "").upper()
    if d in ("UNITED STATES", "VARIOUS US SHIPPING POINTS", ""):
        return None   # agregados nacionales sin ubicación
    if "MEXICO CROSSINGS" in d and not d.startswith("MEXICO"):
        return "mixto"   # zona de EE. UU. mezclada con cruces de México en la misma cifra
    importacion = " IMPORTS" in d or d.startswith("IMPORTS")
    for patron, id_ in REGLAS:
        if patron in d and (id_.startswith("imp_") == importacion or id_.startswith("mx_") or id_ in ("bc", "mixto")):
            return id_
    return None


def pais_importacion(distrito):
    d = (distrito or "").upper()
    return d.split(" IMPORTS")[0].strip().title() if " IMPORTS" in d else None


def main():
    comm = {}
    for k, cs in PRODUCTOS.items():
        for c in cs:
            comm.setdefault(c, k)
    for k, cs in list(VOLUMEN_MX.items()) + list(VOLUMEN_EXTRA.items()):
        for c in cs:
            comm[c] = k
    vol = defaultdict(lambda: defaultdict(lambda: defaultdict(float)))   # k → origen → lunes → t
    sin_ubicar = defaultdict(float)
    paises = defaultdict(lambda: defaultdict(float))   # origen de importación → país → t (para nombrar el puerto)
    for f in sorted(glob.glob(str(FUENTE / "1662_*.json.gz"))):
        for r in json.load(gzip.open(f, "rt", encoding="utf-8")):
            k = comm.get(r.get("commodity"))
            if not k:
                continue
            try:
                t = float(r["shipments_week1"]) * CWT_T
            except (TypeError, ValueError):
                continue
            o = origen(r.get("district"))
            if not o:
                sin_ubicar[r.get("district")] += t
                continue
            m, d, a = map(int, r["report_date"].split("/"))
            lunes = date(a, m, d) - timedelta(days=7)
            lunes -= timedelta(days=lunes.weekday())
            vol[k][o][lunes] += t
            p = pais_importacion(r.get("district"))
            if p:
                paises[o][p] += t
    todas = sorted({s for k in vol.values() for o in k.values() for s in o})
    primero, ultimo = todas[0], todas[-1]
    semanas, s = [], primero
    while s <= ultimo:
        semanas.append(s)
        s += timedelta(days=7)
    idx = {s: i for i, s in enumerate(semanas)}
    productos = {}
    for k, os_ in vol.items():
        productos[k] = {}
        for o, serie in os_.items():
            if sum(serie.values()) < 45:   # menos de una unidad del USDA en todo el periodo
                continue
            i0, i1 = idx[min(serie)], idx[max(serie)]
            productos[k][o] = [i0, [round(serie.get(semanas[i], 0)) for i in range(i0, i1 + 1)]]
    usados = {o for k in productos.values() for o in k}
    # [nombre, lat, lon, tipo, estado, nombre en inglés, países de origen (puertos)]
    origenes = {o: list(ORIGENES[o]) + [NOMBRES_EN[o]] for o in sorted(usados)}
    for o in origenes:   # los puertos llevan sus principales países de origen
        if paises.get(o):
            origenes[o].append([p for p, _ in sorted(paises[o].items(), key=lambda x: -x[1])[:4]])
    salida = {"generado": date.today().isoformat(), "fuente": "USDA AMS Market News, National Shipping Point Trends (1662)", "unidad": "t",
              "semanas": [s.isoformat() for s in semanas], "origenes": origenes, "productos": productos}
    destino = RAIZ / "data" / "embarques.js"
    destino.write_text(
        "// Generado por scripts/procesar_embarques.py — USDA AMS, embarques semanales por origen (reporte 1662)\n"
        f"window.EMBARQUES = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"{semanas[0]} a {semanas[-1]} · {len(semanas)} semanas · {len(productos)} productos · {len(origenes)} orígenes · "
          f"{destino.stat().st_size / 1e3:.0f} kB")
    print("Sin ubicar (t):", {d: round(t) for d, t in sorted(sin_ubicar.items(), key=lambda x: -x[1])[:5]})


if __name__ == "__main__":
    main()

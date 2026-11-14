"""
Etapa 2 de la vista Estados Unidos: producción por estado (USDA NASS), población (Census Bureau)
y comercio con el mundo y con México (FAOSTAT) para los productos del mapa.

Requiere antes:
  - scripts/filtrar_nass.py  → data/fuentes/usda/nass_frutas_hortalizas.tsv
  - data/fuentes/usda/NST-EST2025-ALLDATA.csv  (Census Bureau, estimaciones de población por estado)
    https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/state/totals/NST-EST2025-ALLDATA.csv
  - data/fuentes/usda/censo2022_frutas_hortalizas.tsv: superficie por estado del Censo Agropecuario 2022 de USDA
    (qs.census2022.txt.gz filtrado a frutas y hortalizas, nivel estatal, en acres)
  - data/global.js y data/global_comercio.js (scripts/procesar_faostat.py global, procesar_faostat_bilateral.py global)

Uso:
  python scripts/procesar_usda.py [año=2025]

Salida: data/sub_us.js → window.SUBNACIONAL.US (formato común, ver scripts/subnacional_comun.py)
Método:
  - Producción: series de NASS de MERCADO FRESCO cuando existen (comparables con el comercio de producto fresco).
    NASS solo encuesta a los estados productores principales y reserva ("(D)") muchas cifras estatales de mercado fresco.
    Reparto por estado: (1) cifra publicada por NASS; (2) el resto del total nacional se reparte entre los demás
    estados según su superficie de mercado fresco (o en producción) del Censo Agropecuario 2022; cada estado queda
    marcado como publicado o estimado.
  - Productos sin encuesta estatal de NASS: producción nacional de FAOSTAT, sin desglose por estado.
  - Comercio: FAOSTAT para los productos que la FAO separa; para los añadidos en noviembre de 2026 (col, kale, ejote,
    espinaca, apio, alcachofa, betabel), UN Comtrade con EE. UU. como reportante (anual, API pública). Col y kale
    reparten la subpartida 070490 en proporción a su producción NASS; betabel lleva toda la 070690 (incluye rábano).
    Elote y calabaza no tienen subpartida propia (070999 y 070993, esta asignada a calabacita): sin comercio.
  - Consumo aparente = producción + importación − exportación (FAOSTAT); por persona con la población del Census.
  - Abasto desde México: exportación de México a EE. UU. (matriz bilateral de FAOSTAT, reportada por México).
Solo usa la biblioteca estándar de Python.
"""
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

from subnacional_comun import anio_comercio, escribir_pais, produccion_fao, resumen

RAIZ = Path(__file__).resolve().parent.parent
USDA = RAIZ / "data" / "fuentes" / "usda"

A_TONELADAS = {"CWT": 0.0453592, "TONS": 0.907185, "LB": 0.000453592}
ACRE_HA = 0.404686

# producto del mapa → series SHORT_DESC de NASS (se suman) y producto de cosecha para la superficie
SERIES = {
    "jitomate": (["TOMATOES, IN THE OPEN, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT"], "TOMATOES"),
    "chile": (["PEPPERS, BELL, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT",
               "PEPPERS, CHILE, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT"], "PEPPERS"),
    "aguacate": (["AVOCADOS, FRESH MARKET - PRODUCTION, MEASURED IN TONS"], "AVOCADOS"),
    "limon": (["LEMONS, FRESH MARKET - PRODUCTION, MEASURED IN TONS"], "LEMONS"),
    "naranja": (["ORANGES, FRESH MARKET - PRODUCTION, MEASURED IN TONS"], "ORANGES"),
    "papa": (["POTATOES - PRODUCTION, MEASURED IN CWT"], "POTATOES"),
    "cebolla": (["ONIONS, DRY, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT"], "ONIONS"),
    "brocoli": (["BROCCOLI, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT"], "BROCCOLI"),
    "coliflor": (["CAULIFLOWER, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT"], "CAULIFLOWER"),
    "fresa": (["STRAWBERRIES, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT"], "STRAWBERRIES"),
    "pepino": (["CUCUMBERS, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT"], "CUCUMBERS"),
    "manzana": (["APPLES, FRESH MARKET - PRODUCTION, MEASURED IN LB"], "APPLES"),
    "calabacita": (["SQUASH, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT"], "SQUASH"),
    "zanahoria": (["CARROTS, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT"], "CARROTS"),
    "lechuga": (["LETTUCE, HEAD, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT",
                 "LETTUCE, LEAF, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT",
                 "LETTUCE, ROMAINE, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT"], "LETTUCE"),
    "papaya": (["PAPAYAS, FRESH MARKET - PRODUCTION, MEASURED IN LB"], "PAPAYAS"),
    "uva": (["GRAPES, FRESH MARKET - PRODUCTION, MEASURED IN TONS"], "GRAPES"),
    "toronja": (["GRAPEFRUIT, FRESH MARKET - PRODUCTION, MEASURED IN TONS"], "GRAPEFRUIT"),
    "pera": (["PEARS, FRESH MARKET - PRODUCTION, MEASURED IN TONS"], "PEARS"),
    "durazno": (["PEACHES, FRESH MARKET - PRODUCTION, MEASURED IN TONS",
                 "NECTARINES, FRESH MARKET - PRODUCTION, MEASURED IN TONS"], "PEACHES"),
    "arandano": (["BLUEBERRIES, TAME, FRESH MARKET - PRODUCTION, MEASURED IN LB",
                  "BLUEBERRIES, WILD, FRESH MARKET - PRODUCTION, MEASURED IN LB",
                  "RASPBERRIES, FRESH MARKET - PRODUCTION, MEASURED IN LB"], "BLUEBERRIES"),
    "esparrago": (["ASPARAGUS, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT"], "ASPARAGUS"),
    "nuez": (["PECANS, UTILIZED, IN SHELL - PRODUCTION, MEASURED IN LB"], "PECANS"),
    # NASS ya publica sandía y melón por estado (antes solo FAOSTAT nacional)
    "sandia": (["MELONS, WATERMELON, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT"], "MELONS, WATERMELON"),
    "melon": (["MELONS, CANTALOUP, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT",
               "MELONS, HONEYDEW, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT"], "MELONS, CANTALOUP"),
    # Hortalizas añadidas al mapa en noviembre de 2026 (las que NASS encuesta por estado)
    "elote": (["SWEET CORN, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT"], "SWEET CORN"),
    "col": (["CABBAGE, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT"], "CABBAGE"),
    "ejote": (["BEANS, SNAP, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT"], "BEANS"),
    "espinaca": (["SPINACH, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT"], "SPINACH"),
    "apio": (["CELERY, UTILIZED - PRODUCTION, MEASURED IN CWT"], "CELERY"),   # el de mercado fresco es confidencial (D)
    "calabaza": (["PUMPKINS, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT"], "PUMPKINS"),
    "alcachofa": (["ARTICHOKES, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT"], "ARTICHOKES"),
    "betabel": (["BEETS, FRESH MARKET, UTILIZED - PRODUCTION, MEASURED IN CWT"], "BEETS"),
    "kale": (["GREENS, KALE, UTILIZED - PRODUCTION, MEASURED IN CWT"], "GREENS"),   # el de mercado fresco es confidencial (D)
}
SOLO_FAO = ["platano", "mango", "pina", "berenjena"]  # sin encuesta estatal de NASS
# Comercio de UN Comtrade (EE. UU. reportante) para productos que FAOSTAT no separa
COMTRADE_EUA = {"col": ["070490"], "kale": ["070490"], "ejote": ["070820"], "espinaca": ["070970"], "apio": ["070940"],
                "alcachofa": ["070991"], "betabel": ["070690"]}
COMPARTIDAS_EUA = {"070490": ["col", "kale"]}   # se reparte en proporción a la producción NASS
NOMBRES = {"arandano": "Berries (arándano y frambuesa)"}
# Superficie del Censo Agropecuario 2022 usada como llave de reparto por estado
CENSO = {
    "jitomate": ["TOMATOES, IN THE OPEN, FRESH MARKET - ACRES HARVESTED"],
    "chile": ["PEPPERS, BELL, FRESH MARKET - ACRES HARVESTED", "PEPPERS, CHILE, FRESH MARKET - ACRES HARVESTED"],
    "aguacate": ["AVOCADOS - ACRES BEARING"], "limon": ["LEMONS - ACRES BEARING"], "naranja": ["ORANGES - ACRES BEARING"],
    "papa": ["POTATOES - ACRES HARVESTED"], "cebolla": ["ONIONS, DRY, FRESH MARKET - ACRES HARVESTED"],
    "brocoli": ["BROCCOLI, FRESH MARKET - ACRES HARVESTED"], "coliflor": ["CAULIFLOWER, FRESH MARKET - ACRES HARVESTED"],
    "fresa": ["STRAWBERRIES - ACRES BEARING"], "pepino": ["CUCUMBERS, FRESH MARKET - ACRES HARVESTED"],
    "manzana": ["APPLES - ACRES BEARING"], "calabacita": ["SQUASH, FRESH MARKET - ACRES HARVESTED"],
    "zanahoria": ["CARROTS, FRESH MARKET - ACRES HARVESTED"], "lechuga": ["LETTUCE, FRESH MARKET - ACRES HARVESTED"],
    "papaya": ["PAPAYAS - ACRES BEARING"], "uva": ["GRAPES - ACRES BEARING"], "toronja": ["GRAPEFRUIT - ACRES BEARING"],
    "pera": ["PEARS - ACRES BEARING"], "durazno": ["PEACHES - ACRES BEARING"],
    "arandano": ["BLUEBERRIES - ACRES BEARING", "RASPBERRIES - ACRES BEARING"],
    "esparrago": ["ASPARAGUS, FRESH MARKET - ACRES HARVESTED"], "nuez": ["PECANS - ACRES BEARING"],
    "sandia": ["MELONS, WATERMELON, FRESH MARKET - ACRES HARVESTED"],
    "melon": ["MELONS, CANTALOUP, FRESH MARKET - ACRES HARVESTED", "MELONS, HONEYDEW, FRESH MARKET - ACRES HARVESTED"],
    "berenjena": ["EGGPLANT, FRESH MARKET - ACRES HARVESTED"],
    "elote": ["SWEET CORN, FRESH MARKET - ACRES HARVESTED"], "col": ["CABBAGE, HEAD, FRESH MARKET - ACRES HARVESTED"],
    "ejote": ["BEANS, SNAP, FRESH MARKET - ACRES HARVESTED"], "espinaca": ["SPINACH, FRESH MARKET - ACRES HARVESTED"],
    "apio": ["CELERY, FRESH MARKET - ACRES HARVESTED"], "calabaza": ["PUMPKINS, FRESH MARKET - ACRES HARVESTED"],
    "alcachofa": ["ARTICHOKES, FRESH MARKET - ACRES HARVESTED"], "betabel": ["BEETS, FRESH MARKET - ACRES HARVESTED"],
    "kale": ["GREENS, KALE, FRESH MARKET - ACRES HARVESTED"],
    # piña: sin llave estatal (la superficie de Hawái es confidencial en el censo y el reparto quedaría sesgado)
}


def censo_por_estado():
    """clave → estado → hectáreas (Censo Agropecuario 2022)."""
    serie_a_clave = defaultdict(list)
    for k, ss in CENSO.items():
        for s in ss:
            serie_a_clave[s].append(k)
    ha = defaultdict(lambda: defaultdict(float))
    with open(USDA / "censo2022_frutas_hortalizas.tsv", encoding="utf-8") as f:
        for r in csv.DictReader(f, delimiter="\t"):
            if r["AGG_LEVEL_DESC"] != "STATE":
                continue
            v = num(r["VALUE"])
            for k in serie_a_clave.get(r["SHORT_DESC"], []):
                if v:
                    ha[k][r["STATE_ALPHA"]] += v * ACRE_HA
    return ha


def repartir(nacional, publicados, llave):
    """Estados publicados tal cual; el resto del total nacional, en proporción a la llave (superficie del censo)."""
    resto = max(0.0, nacional - sum(publicados.values()))
    candidatos = {e: v for e, v in llave.items() if e not in publicados and e in ESTADOS and v > 0}
    suma = sum(candidatos.values())
    salida = {e: [round(t), 0] for e, t in publicados.items() if e in ESTADOS and t > 0}  # 0 = publicado
    if suma > 0 and resto > 0:
        for e, v in candidatos.items():
            t = resto * v / suma
            if t >= 1:
                salida[e] = [round(t), 1]  # 1 = estimado con el censo
    return salida
NOTAS = {
    "papa": "NASS no separa papa fresca de la de proceso: la producción incluye papa para industria.",
    "brocoli": "El comercio de la FAO agrupa brócoli y coliflor; aquí se asigna todo a brócoli.",
    "coliflor": "Su comercio está dentro de la partida de brócoli de la FAO; sin datos de comercio propios.",
    "arandano": "Arándano y frambuesa se agrupan porque la FAO registra su comercio junto (partidas 552, 547 y 558).",
    "durazno": "Incluye nectarina.",
    "nuez": "Nuez pecanera con cáscara; el comercio de la FAO para nuez no está en este mapa.",
    "naranja": "Solo naranja para consumo en fresco; la mayor parte de la naranja de Florida va a jugo.",
    "manzana": "Solo manzana para consumo en fresco.",
    "elote": "Elote (maíz dulce) de mercado fresco. Sin comercio: el SA lo agrupa en 070999 ('las demás hortalizas'); el consumo aparente es solo la producción.",
    "calabaza": "Calabaza madura (pumpkins) de mercado fresco. Sin comercio propio: la subpartida 070993 está asignada a calabacita.",
    "col": "Comercio estimado: la subpartida 070490 (coles, colinabo, kale) se reparte entre col y kale según la producción NASS (UN Comtrade, reporte de EE. UU.).",
    "kale": "Producción total (fresco y proceso): NASS reserva la de mercado fresco. Comercio estimado: parte de la subpartida 070490, repartida con la col según la producción NASS (UN Comtrade).",
    "betabel": "Comercio de la subpartida 070690, que incluye rábano, salsifí y apionabo (UN Comtrade, reporte de EE. UU.).",
    "ejote": "Ejote (snap beans) de mercado fresco. Comercio: subpartida 070820 (UN Comtrade, reporte de EE. UU.).",
    "espinaca": "Comercio: subpartida 070970 (UN Comtrade, reporte de EE. UU.).",
    "apio": "Producción total (fresco y proceso): NASS reserva la de mercado fresco. Comercio: subpartida 070940 (UN Comtrade, reporte de EE. UU.).",
    "alcachofa": "Comercio: subpartida 070991 (UN Comtrade, reporte de EE. UU.).",
    "sandia": "Producción de mercado fresco por estado de USDA NASS.",
    "melon": "Melón chino y gota de miel de mercado fresco (USDA NASS).",
}

# Estados: clave → (nombre en español, lat, lon del centro de población aproximado)
ESTADOS = {
    "AL": ("Alabama", 32.8, -86.8), "AK": ("Alaska", 61.2, -149.9), "AZ": ("Arizona", 33.5, -112.0),
    "AR": ("Arkansas", 35.0, -92.4), "CA": ("California", 36.2, -119.6), "CO": ("Colorado", 39.6, -105.0),
    "CT": ("Connecticut", 41.6, -72.7), "DE": ("Delaware", 39.2, -75.5), "DC": ("Distrito de Columbia", 38.9, -77.0),
    "FL": ("Florida", 27.8, -81.6), "GA": ("Georgia", 33.3, -84.0), "HI": ("Hawái", 21.1, -157.5),
    "ID": ("Idaho", 43.6, -115.4), "IL": ("Illinois", 41.3, -88.4), "IN": ("Indiana", 39.8, -86.3),
    "IA": ("Iowa", 41.9, -93.1), "KS": ("Kansas", 38.4, -97.1), "KY": ("Kentucky", 37.8, -85.3),
    "LA": ("Luisiana", 30.7, -91.4), "ME": ("Maine", 44.3, -69.8), "MD": ("Maryland", 39.1, -76.8),
    "MA": ("Massachusetts", 42.3, -71.4), "MI": ("Míchigan", 42.9, -84.2), "MN": ("Minnesota", 45.2, -93.6),
    "MS": ("Misisipi", 32.6, -89.7), "MO": ("Misuri", 38.4, -92.2), "MT": ("Montana", 46.7, -110.4),
    "NE": ("Nebraska", 41.2, -97.4), "NV": ("Nevada", 36.9, -116.5), "NH": ("Nuevo Hampshire", 43.0, -71.5),
    "NJ": ("Nueva Jersey", 40.4, -74.4), "NM": ("Nuevo México", 34.6, -106.3), "NY": ("Nueva York", 41.5, -74.6),
    "NC": ("Carolina del Norte", 35.6, -79.4), "ND": ("Dakota del Norte", 47.4, -99.3), "OH": ("Ohio", 40.5, -82.7),
    "OK": ("Oklahoma", 35.6, -97.0), "OR": ("Oregón", 44.7, -122.6), "PA": ("Pensilvania", 40.5, -77.0),
    "RI": ("Rhode Island", 41.8, -71.5), "SC": ("Carolina del Sur", 34.0, -81.2), "SD": ("Dakota del Sur", 44.0, -98.5),
    "TN": ("Tennessee", 35.8, -86.4), "TX": ("Texas", 30.9, -97.4), "UT": ("Utah", 40.5, -111.9),
    "VT": ("Vermont", 44.1, -72.8), "VA": ("Virginia", 37.8, -77.8), "WA": ("Washington", 47.3, -121.6),
    "WV": ("Virginia Occidental", 38.8, -80.8), "WI": ("Wisconsin", 43.7, -89.4), "WY": ("Wyoming", 42.3, -106.4),
}
FIPS = {"01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT", "10": "DE", "11": "DC",
        "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY",
        "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT",
        "31": "NE", "32": "NV", "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
        "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
        "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI", "56": "WY"}


def num(v):
    v = (v or "").strip().replace(",", "")
    try:
        return float(v)
    except ValueError:
        return None  # (D) confidencial, (NA), (Z)…


def comtrade_eua(anio, codigos, flujo):
    """Respuesta anual de UN Comtrade (EE. UU. reportante) para unas subpartidas, con caché."""
    import time
    import urllib.request
    cache = RAIZ / "data" / "fuentes" / "comtrade" / f"eua_A_{anio}_{'_'.join(codigos)}_{flujo}.json"
    if cache.exists():
        return json.loads(cache.read_text(encoding="utf-8"))
    url = (f"https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=842&period={anio}&cmdCode={','.join(codigos)}"
           f"&flowCode={flujo}&partner2Code=0&customsCode=C00&motCode=0")
    for intento in range(5):
        try:
            d = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=120))
            if d.get("error"):
                raise RuntimeError(d["error"])
            cache.parent.mkdir(parents=True, exist_ok=True)
            cache.write_text(json.dumps(d), encoding="utf-8")
            time.sleep(2)
            return d
        except Exception as e:   # límite de frecuencia de la API pública
            print(f"  Comtrade {codigos} {flujo}: {e}; reintento")
            time.sleep(15 * (intento + 1))
    raise SystemExit(f"No se pudo descargar Comtrade {codigos} {flujo}")


def comercio_eua(anio, codigos, f=1.0):
    """Comercio de EE. UU. en el formato de subnacional_comun.comercio (toneladas y US$, socios principales)."""
    paises = leer_js("global.js", "GLOBAL")["paises"]
    iso = lambda c: paises.get(c, {}).get("iso") or c

    def socios(flujo):
        tot, por = [0.0, 0.0], {}
        for r in comtrade_eua(anio, codigos, flujo).get("data", []):
            t = (r.get("netWgt") or (r.get("qty") if (r.get("qtyUnitAbbr") or "").lower() == "kg" else 0) or 0) / 1000 * f
            usd = (r.get("primaryValue") or 0) / 1000 * f   # miles de US$, como los valores de FAOSTAT
            c = str(r["partnerCode"]).zfill(3)
            if c == "000":
                tot = [tot[0] + t, tot[1] + usd]
            else:
                x = por.setdefault(c, [0.0, 0.0])
                x[0] += t
                x[1] += usd
        if not tot[0]:
            tot = [sum(v[0] for v in por.values()), sum(v[1] for v in por.values())]
        return tot, sorted(por.items(), key=lambda x: -x[1][0])
    (imp, iusd), llegan = socios("M")
    (exp, eusd), salen = socios("X")
    mx_in, mx_out = dict(llegan).get("484", [0, 0]), dict(salen).get("484", [0, 0])
    return {"exp": round(exp), "imp": round(imp), "expUSD": round(eusd), "impUSD": round(iusd),
            "origenes": [[c, iso(c), round(v[0]), round(v[1])] for c, v in llegan[:6]],
            "destinos": [[c, iso(c), round(v[0]), round(v[1])] for c, v in salen[:6]],
            "desdeMX": [round(mx_in[0]), round(mx_in[1])], "haciaMX": [round(mx_out[0]), round(mx_out[1])],
            "fuente": "UN Comtrade (reporte de EE. UU.)"}


def leer_js(nombre, variable):
    t = (RAIZ / "data" / nombre).read_text(encoding="utf-8")
    return json.loads(t[t.index("{"):t.rindex("}") + 1])


def main(anio=2025):
    # --- población 2025 (Census) ---
    pob, pob_ref = {}, None
    with open(USDA / "NST-EST2025-ALLDATA.csv", encoding="latin-1") as f:
        for r in csv.DictReader(f):
            col = f"POPESTIMATE{anio}" if f"POPESTIMATE{anio}" in r else "POPESTIMATE2025"
            pob_ref = col[-4:]
            if r["SUMLEV"] == "040" and r["STATE"].zfill(2) in FIPS:
                pob[FIPS[r["STATE"].zfill(2)]] = int(r[col])
    pob_nac = sum(pob.values())

    # --- producción y superficie (NASS) ---
    prod = defaultdict(lambda: defaultdict(float))      # clave → estado|"US" → t
    area = defaultdict(lambda: defaultdict(float))      # clave → estado|"US" → ha
    anios_con_dato = defaultdict(set)
    serie_a_clave = {s: k for k, (ss, _) in SERIES.items() for s in ss}
    cultivo_area = {c: k for k, (_, c) in SERIES.items()}
    with open(USDA / "nass_frutas_hortalizas.tsv", encoding="utf-8") as f:
        for r in csv.DictReader(f, delimiter="\t"):
            if r["REFERENCE_PERIOD_DESC"] != "YEAR":
                continue
            lugar = "US" if r["AGG_LEVEL_DESC"] == "NATIONAL" else r["STATE_ALPHA"]
            v = num(r["VALUE"])
            if v is None:
                continue
            clave = serie_a_clave.get(r["SHORT_DESC"])
            if clave and r["STATISTICCAT_DESC"] == "PRODUCTION":
                anios_con_dato[clave].add(int(r["YEAR"]))
                if int(r["YEAR"]) == anio:
                    prod[clave][lugar] += v * A_TONELADAS[r["UNIT_DESC"]]
            elif r["STATISTICCAT_DESC"] == "AREA HARVESTED" and r["UNIT_DESC"] == "ACRES" and int(r["YEAR"]) == anio:
                k = cultivo_area.get(r["COMMODITY_DESC"])
                if k and r["SHORT_DESC"].startswith(r["COMMODITY_DESC"] + " - AREA HARVESTED") or \
                   (k and r["SHORT_DESC"] in (f"{r['COMMODITY_DESC']}, IN THE OPEN - AREA HARVESTED, MEASURED IN ACRES",
                                               f"{r['COMMODITY_DESC']}, BEARING - AREA HARVESTED, MEASURED IN ACRES")):
                    area[k][lugar] += v * ACRE_HA

    ha_censo = censo_por_estado()

    # --- salida en el formato común (el comercio lo agrega scripts/subnacional_comun.py) ---
    datos = {
        "codigo": "US", "m49": "840", "pais": "Estados Unidos", "nivel": "estado", "nivelPlural": "estados",
        "anio": anio, "anioPoblacion": int(pob_ref),
        "fuente": f"USDA NASS {anio}, Censo Agropecuario 2022, Census Bureau {pob_ref}, FAOSTAT",
        "fuenteCorta": f"USDA NASS {anio}",
        "metodo": "Producción de mercado fresco de USDA NASS. NASS reserva muchas cifras estatales: el resto del total "
                  "nacional se reparte según la superficie del Censo Agropecuario 2022 (marcado como estimado).",
        "limites": [[21.5, -124.5], [49.5, -67]],
        "regiones": {e: {"nombre": n, "lat": la, "lon": lo, "pob": pob.get(e)} for e, (n, la, lo) in ESTADOS.items()},
        "productos": {},
    }
    for clave in list(SERIES) + SOLO_FAO:
        if clave in SERIES:
            publicados = {e: t for e, t in prod[clave].items() if e not in ("US", "OT") and t > 0}
            nacional = prod[clave].get("US") or sum(publicados.values())
            ha = area[clave].get("US", 0)
            fuente = "NASS"
            if not nacional:
                continue
        else:
            nacional, ha = produccion_fao("840", clave)
            if not nacional:
                continue
            publicados, fuente = {}, "FAOSTAT"
        datos["productos"][clave] = {
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            **({"nota": NOTAS[clave]} if clave in NOTAS else {}),
            "fuenteProduccion": fuente,
            "anioProduccion": anio if fuente == "NASS" else anio_comercio(),
            "nacional": round(nacional), "ha": round(ha),
            "regiones": repartir(nacional, publicados, ha_censo.get(clave, {})),
        }
    # Comercio de Comtrade para los productos que FAOSTAT no separa (año del comercio de FAOSTAT, para comparar)
    anio_c = anio
    for clave, codigos in COMTRADE_EUA.items():
        if clave not in datos["productos"]:
            continue
        compartida = next((g for g, ks in COMPARTIDAS_EUA.items() if g in codigos), None)
        f = 1.0
        if compartida:
            base = {k: datos["productos"].get(k, {}).get("nacional", 0) for k in COMPARTIDAS_EUA[compartida]}
            f = base[clave] / (sum(base.values()) or 1)
        datos["productos"][clave]["comercio"] = comercio_eua(anio_c, codigos, f)
    destino = escribir_pais(datos, sin_comercio=("coliflor", "nuez", "elote", "calabaza"))
    print(f"→ {destino.name} ({destino.stat().st_size / 1e3:.0f} kB) · población {pob_ref}: {pob_nac:,}")
    resumen(datos)


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 2025)

"""
Precios de mayoreo en Canadá (Toronto y Montreal) por origen, para comparar el producto mexicano con el de otros países
y con el mayoreo de EE. UU. Escribe data/precios_canada.js → window.PRECIOS_CANADA.

Fuente: Agriculture and Agri-Food Canada, InfoHort, "Daily Wholesale Prices Report (2023-2027)" (datos abiertos,
https://od-do.agr.gc.ca/DailyWholesalePrices2327_PrixDeGrossistesQuotidiens2327.csv.zip, se actualiza a diario).
Cada fila: fecha, mercado, producto, variedad, país y provincia/estado de origen, precio mínimo y máximo en dólares
canadienses por empaque, y peso del empaque. Es el precio que piden los mayoristas a las tiendas (no incluye tratos).

Precio por kg = (mín + máx) / 2 ÷ (cantidad × peso del empaque); se descartan empaques sin peso (por pieza o por
volumen; en aguacate se usa la caja estándar de 25 lb para las de 32 a 84 piezas), orgánicos y cotizaciones fuera de 1/3–3× la mediana del producto (errores de captura o empaques raros).
Dólares canadienses → US$ con el promedio mensual de la Reserva Federal (H.10, DEXCAUS, vía FRED).

Flete estimado de México a Toronto y Montreal: tarifa por km de los fletes refrigerados del USDA desde McAllen y
Nogales a las ciudades del este (data/precios_eua.js, fletes) × distancia en línea recta al destino; no incluye el
cruce a Canadá ni su aduana. Es un orden de magnitud.

Uso: python scripts/procesar_precios_canada.py [--sin-descargar]
"""
import argparse
import csv
import io
import json
import math
import re
import statistics
import sys
import time
import urllib.request
import zipfile
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FUENTE = RAIZ / "data" / "fuentes" / "canada_precios"
ZIP = FUENTE / "h2327.zip"
URL = "https://od-do.agr.gc.ca/DailyWholesalePrices2327_PrixDeGrossistesQuotidiens2327.csv.zip"
FRED = FUENTE / "fred_dexcaus.csv"
DESTINO = RAIZ / "data" / "precios_canada.js"

A_KG = {"lbs": 0.45359237, "lb": 0.45359237, "oz": 0.028349523, "gr": 0.001, "g": 0.001, "kg": 1.0}
MERCADOS = {"Wholesale-Toronto": "Toronto", "Wholesale-Montreal": "Montreal"}
CIUDADES = {"Toronto": (43.65, -79.38), "Montreal": (45.50, -73.57)}

# Producto del mapa → (producto de InfoHort, variedades que entran, descripción). Se elige la variedad que más se
# parece a la referencia del USDA (p. ej. jitomate saladette = Roma de campo; chile = pimiento verde).
PRODUCTOS = {
    "jitomate": ("Tomatoes", r"Field-Roma", "Roma de campo"),
    "chile": ("Peppers", r"Field-Green", "pimiento morrón verde de campo"),
    "aguacate": ("Avocados", r"Hass|Unspecified", "Hass"),
    "limon": ("Limes", r"Unspecified", "limón persa"),
    "naranja": ("Oranges", r"Navel-Unspecified|Valencia-Unspecified", "Navel y Valencia"),
    "platano": ("Bananas", r"Unspecified|Chiquita-Dole|Del Monte|Cabana", "plátano"),
    "mango": ("Mangoes", r"Ataulfo|Kent|Haden|Tommy Atkins|Unspecified", "Ataulfo, Kent, Haden y Tommy"),
    "papa": ("Potatoes", r"White|Russet|Red|Yellow", "blanca, russet, roja y amarilla"),
    "cebolla": ("Onions", r"White|Yellow|Red", "blanca, amarilla y morada"),
    "brocoli": ("Broccoli", r"Crown|Green", "brócoli"),
    "fresa": ("Strawberries", r"Field|Field-Driscoll", "fresa de campo"),
    "pepino": ("Cucumbers", r"Field|Field-Dill|G\.H\.-Long English", "pepino de campo e invernadero (largo)"),
    "manzana": ("Apples", r".*", "todas las variedades"),
    "calabacita": ("Zucchini", r"Field-Green|Field-Yellow|Field-Gray", "verde, amarilla y gris (calabacita mexicana)"),
    "zanahoria": ("Carrots", r"Unspecified|Jumbo", "zanahoria"),
    "lechuga": ("Lettuce", r"Field-Head/Iceberg", "iceberg"),
    "sandia": ("Melons", r"Watermelon-.*", "sandía"),
    "melon": ("Melons", r"Cantaloupes|Honeydew", "chino y gota de miel"),
    "papaya": ("Papaya", r"Unspecified", "papaya"),
    "pina": ("Pineapples", r"Unspecified|Golden", "piña"),
    "uva": ("Grapes (Table)", r".*", "uva de mesa"),
    "toronja": ("Grapefruit", r".*", "toronja"),
    "pera": ("Pears", r"Bartlett|D'Anjou|Bosc", "Bartlett, D'Anjou y Bosc"),
    "durazno": ("Peaches", r"Unspecified|White", "durazno"),
    "arandano": ("Blueberries", r"Unspecified", "arándano"),
    "berenjena": ("Eggplant", r"Unspecified|G\.H\.-Italian|Field-Italian", "berenjena"),
    "coliflor": ("Cauliflower", r"White", "blanca"),
    "esparrago": ("Asparagus", r"Green", "verde"),
    "frambuesa": ("Raspberries", r"Field-Red", "roja"),
    "zarzamora": ("Blackberries", r"Unspecified", "zarzamora"),
    "guayaba": ("Guava", r".*", "guayaba"),
}
# No se comparan con el mayoreo de EE. UU.: "peso" = InfoHort no publica el peso de la caja (se supone); "variedad" =
# la variedad cotizada en Canadá no es la referencia del USDA (cebolla blanca contra amarilla en costal; pepino de
# invernadero contra pepino de campo)
NO_COMPARABLE = {"aguacate": "peso", "cebolla": "variedad", "pepino": "variedad"}
# descripción de la variedad en inglés (la vista en inglés no la traduce por plantillas)
VARIEDAD_EN = {"jitomate": "field Roma", "chile": "green field bell pepper", "aguacate": "Hass", "limon": "Persian lime",
    "naranja": "Navel and Valencia", "platano": "banana", "mango": "Ataulfo, Kent, Haden and Tommy", "papa": "white, russet, red and yellow",
    "cebolla": "white, yellow and red", "brocoli": "broccoli", "fresa": "field strawberry", "pepino": "field and greenhouse (long English) cucumber",
    "manzana": "all varieties", "calabacita": "green, yellow and gray (Mexican) zucchini", "zanahoria": "carrot", "lechuga": "iceberg",
    "sandia": "watermelon", "melon": "cantaloupe and honeydew", "papaya": "papaya", "pina": "pineapple", "uva": "table grape",
    "toronja": "grapefruit", "pera": "Bartlett, D'Anjou and Bosc", "durazno": "peach", "arandano": "blueberry", "berenjena": "eggplant",
    "coliflor": "white", "esparrago": "green", "frambuesa": "red", "zarzamora": "blackberry", "guayaba": "guava"}
# país de origen (ISO2 de InfoHort) → nombre en el mapa
PAISES = {"MX": "México", "US": "EE. UU.", "CA": "Canadá", "PE": "Perú", "CL": "Chile", "GT": "Guatemala", "CR": "Costa Rica",
          "CO": "Colombia", "EC": "Ecuador", "HN": "Honduras", "DO": "República Dominicana", "ES": "España", "NL": "Países Bajos",
          "MA": "Marruecos", "ZA": "Sudáfrica", "NZ": "Nueva Zelanda", "AR": "Argentina", "BR": "Brasil", "IT": "Italia",
          "CN": "China", "IL": "Israel", "TR": "Turquía", "IN": "India", "TH": "Tailandia", "VN": "Vietnam", "PH": "Filipinas",
          "AU": "Australia", "FR": "Francia", "BE": "Bélgica", "PA": "Panamá", "NI": "Nicaragua", "SV": "El Salvador",
          "JM": "Jamaica", "UY": "Uruguay", "EG": "Egipto", "PT": "Portugal", "GR": "Grecia", "JP": "Japón", "KR": "Corea del Sur"}


def descargar():
    """El archivo 2023-2027 pesa ~18 MB comprimido: se baja de nuevo si tiene más de 5 días."""
    FUENTE.mkdir(parents=True, exist_ok=True)
    if ZIP.exists() and time.time() - ZIP.stat().st_mtime < 5 * 86400:
        return
    for intento in range(3):
        try:
            datos = urllib.request.urlopen(URL, timeout=600).read()
            zipfile.ZipFile(io.BytesIO(datos)).testzip()
            ZIP.write_bytes(datos)
            return
        except Exception as e:   # noqa: BLE001 — red: se reintenta
            print(f"  intento {intento + 1}: {e}")
            time.sleep(20)
    if not ZIP.exists():
        sys.exit("No se pudo descargar el reporte de InfoHort")


def tipo_cambio():
    """{AAAA-MM: CAD por US$} (promedio mensual de DEXCAUS)."""
    hoy = date.today()
    if not FRED.exists() or time.time() - FRED.stat().st_mtime > 5 * 86400:
        url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id=DEXCAUS&cosd=2023-01-01&coed={hoy.isoformat()}"
        try:
            FRED.write_bytes(urllib.request.urlopen(url, timeout=120).read())
        except Exception as e:   # noqa: BLE001 — sin red se usa el archivo anterior
            if not FRED.exists():
                raise
            print(f"  FRED sin respuesta ({e}); se usa el archivo anterior")
    meses = defaultdict(list)
    with open(FRED, encoding="utf-8") as f:
        for r in list(csv.reader(f))[1:]:
            if r[1] not in ("", "."):
                meses[r[0][:7]].append(float(r[1]))
    return {m: sum(v) / len(v) for m, v in meses.items()}


def kg_empaque(r):
    # Aguacate: InfoHort da piezas por caja sin peso; las cajas de 32 a 84 piezas son la caja estándar de dos capas,
    # 25 lb (la referencia del USDA). Las de 20–24 piezas (una capa) se descartan.
    if r["CmdtyEn_PrdtAn"] == "Avocados":
        m = re.match(r"Ctn (\d+)$", r["PkgTypeEn_EmpqtgAn"] or "")
        return 25 * A_KG["lbs"] if m and 32 <= int(m.group(1)) <= 84 else None
    u = A_KG.get((r["UnitMsrEn_QteUnitAn"] or "").strip().lower())
    try:
        peso = float(r["PkgWt_PdsPqt"])
    except ValueError:
        return None
    try:
        cant = float(r["PkgQty_QtePqt"]) if r["PkgQty_QtePqt"] else 1.0
    except ValueError:
        cant = 1.0
    return cant * peso * u if u and peso > 0 else None


def leer(tc):
    """Cotizaciones útiles: (clave, fecha, mercado, país, US$/kg)."""
    por_comm = defaultdict(list)
    for k, (comm, var, _) in PRODUCTOS.items():
        por_comm[comm].append((k, re.compile(rf"^(?:{var})$")))
    ultimo_tc = tc[max(tc)]
    filas = []
    with zipfile.ZipFile(ZIP) as z, z.open(z.namelist()[0]) as fb:
        for r in csv.DictReader(io.TextIOWrapper(fb, encoding="utf-8-sig")):
            reglas = por_comm.get(r["CmdtyEn_PrdtAn"])
            mercado = MERCADOS.get(r["CentreEn_CentreAn"])
            if not reglas or not mercado:
                continue
            var = r["VrtyEn_VrteAn"]
            if "organic" in var.lower():
                continue
            kg = kg_empaque(r)
            if not kg:
                continue
            try:
                cad = (float(r["LowPrice_PrixMin"]) + float(r["HighPrice_PrixMax"])) / 2
            except ValueError:
                continue
            usd = cad / kg / tc.get(r["Date"][:7], ultimo_tc)
            for k, rx in reglas:
                if rx.match(var):
                    filas.append((k, r["Date"], mercado, r["Cntry_Pays"] or "??", usd))
    return filas


def mediana(v):
    return round(statistics.median(v), 2) if v else None


def fletes_estimados():
    """US$/kg de México a Toronto y Montreal con la tarifa por km de los fletes del USDA a las ciudades del este."""
    t = (RAIZ / "data" / "precios_eua.js").read_text(encoding="utf-8")
    E = json.JSONDecoder().raw_decode(t[t.index("{"):])[0]
    F, cruces = E.get("fletes") or {}, E.get("cruces") or {}
    if not F.get("rutas"):
        return {}
    ciudades = {**E.get("mercados", {}), **E.get("ciudadesFlete", {})}

    def km(a, b):
        la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
        h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
        return 6371 * 2 * math.asin(math.sqrt(h))

    salida = {}
    for ciudad, coord in CIUDADES.items():
        mejor = None
        for cruce, rutas in F["rutas"].items():
            if cruce not in cruces:
                continue
            o = (cruces[cruce]["lat"], cruces[cruce]["lon"])
            # tarifa por km de las rutas largas (más de 2,000 km en línea recta) desde ese cruce
            tasas = [v[0] / km(o, (ciudades[c]["lat"], ciudades[c]["lon"])) for c, v in rutas.items()
                     if c in ciudades and v and v[0] and km(o, (ciudades[c]["lat"], ciudades[c]["lon"])) > 2000]
            if not tasas:
                continue
            usd = statistics.median(tasas) * km(o, coord)
            if not mejor or usd < mejor[0]:
                mejor = (usd, cruce, round(km(o, coord)))
        if mejor:
            salida[ciudad] = {"usdKg": round(mejor[0] / F["cargaKg"], 3), "cruce": mejor[1], "km": mejor[2]}
    return salida


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sin-descargar", action="store_true")
    a = ap.parse_args()
    if not a.sin_descargar:
        descargar()
    tc = tipo_cambio()
    filas = leer(tc)
    ultima = max(f[1] for f in filas)
    desde = (date.fromisoformat(ultima) - timedelta(days=364)).isoformat()
    por_k = defaultdict(list)
    for f in filas:
        por_k[f[0]].append(f)
    productos = {}
    for k, fs in por_k.items():
        med = statistics.median(x[4] for x in fs)
        fs = [x for x in fs if med / 3 <= x[4] <= med * 3]   # empaques raros o errores de captura
        anio = [x for x in fs if x[1] >= desde]
        if len(anio) < 30:
            continue
        mx = [x[4] for x in anio if x[3] == "MX"]
        otros = [x[4] for x in anio if x[3] != "MX"]
        mercados = {}
        for m in MERCADOS.values():
            fm = [x for x in anio if x[2] == m]
            if fm:
                pmx = [x[4] for x in fm if x[3] == "MX"]
                mercados[m] = [mediana(pmx), len(pmx), round(len(pmx) / len(fm), 3), mediana([x[4] for x in fm])]
        # estacionalidad con todos los años (2023 en adelante): mediana por mes y parte de cotizaciones mexicanas
        mes_mx, mes_otros, mes_n, mes_nmx = defaultdict(list), defaultdict(list), defaultdict(int), defaultdict(int)
        for x in fs:
            m = int(x[1][5:7]) - 1
            mes_n[m] += 1
            if x[3] == "MX":
                mes_mx[m].append(x[4])
                mes_nmx[m] += 1
            else:
                mes_otros[m].append(x[4])
        # competidores del último año: parte de las cotizaciones y precio mediano
        por_pais = defaultdict(list)
        for x in anio:
            por_pais[x[3]].append(x[4])
        rivales = sorted(([PAISES.get(p, p), round(len(v) / len(anio), 3), mediana(v)] for p, v in por_pais.items()),
                         key=lambda r: -r[1])[:6]
        comm, _, desc = PRODUCTOS[k]
        productos[k] = {
            "mercancia": comm, "variedad": desc, "variedadEn": VARIEDAD_EN.get(k, desc), "n": len(anio), "nMX": len(mx),
            "precioMX": mediana(mx), "precioOtros": mediana(otros), "precio": mediana([x[4] for x in anio]),
            "mercados": mercados,
            "mensualMX": [mediana(mes_mx[m]) if len(mes_mx[m]) >= 5 else None for m in range(12)],
            "mensualOtros": [mediana(mes_otros[m]) if len(mes_otros[m]) >= 5 else None for m in range(12)],
            "parteMes": [round(mes_nmx[m] / mes_n[m], 3) if mes_n[m] else None for m in range(12)],
            "rivales": rivales,
        }
        if k in NO_COMPARABLE:
            productos[k]["noComparable"] = NO_COMPARABLE[k]
    ult_tc = sorted(tc)[-12:]
    salida = {
        "generado": date.today().isoformat(), "desde": desde, "hasta": ultima, "historiaDesde": min(f[1] for f in filas),
        "fuente": "Agriculture and Agri-Food Canada, InfoHort: Daily Wholesale Prices (Toronto y Montreal)",
        "cadPorUsd": {"valor": round(sum(tc[m] for m in ult_tc) / len(ult_tc), 4), "fuente": "Reserva Federal (H.10, DEXCAUS), promedio de 12 meses"},
        "fletes": fletes_estimados(),
        "productos": productos,
    }
    DESTINO.write_text("// Generado por scripts/procesar_precios_canada.py — mayoreo en Toronto y Montreal (InfoHort, AAFC), US$/kg\n"
                       f"window.PRECIOS_CANADA = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"{len(productos)} productos, {salida['desde']} a {salida['hasta']} -> {DESTINO} ({DESTINO.stat().st_size // 1024} kB)")
    for k, p in sorted(productos.items(), key=lambda kv: -kv[1]["nMX"]):
        print(f"  {k:11s} n={p['n']:5d} MX={p['nMX']:4d} MX US${p['precioMX']}  otros US${p['precioOtros']}  {p['rivales'][:3]}")
    print("  fletes:", salida["fletes"])


if __name__ == "__main__":
    main()

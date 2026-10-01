"""
Precios de mayoreo de Estados Unidos (USDA AMS Market News) para la vista de EE. UU.:
  - Mercados terminales: precio mediano por ciudad, por origen (México, estados de EE. UU., otros países) y por mes.
  - Frontera: precio FOB del producto mexicano al cruzar por Nogales (Arizona), McAllen (Texas) y Otay Mesa (California),
    y volumen semanal que cruza de México por cada paso (reporte 1662, National Shipping Point Trends, 1,000 cwt = 45.36 t).
Lee lo que baja scripts/descargar_ams.py (data/fuentes/usda/ams/) y escribe data/precios_eua.js → window.PRECIOS_EUA.

Método:
  - Precio de cada cotización = punto medio del rango "mostly" (el más frecuente) o, si no hay, del rango bajo–alto.
  - Se excluye lo orgánico. Para comparar entre ciudades, orígenes y meses se usa un solo empaque por producto:
    el más cotizado cuyo peso se conoce (peso escrito en el empaque o peso estándar del USDA para cajas por
    volumen, p. ej. manzana en charola 40 lb). Precio en US$/kg = precio por empaque / kg del empaque.
  - Los porcentajes de origen son proporción de cotizaciones, no de volumen.

Uso:
  python scripts/procesar_ams.py [año=2025]
"""
import gzip
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from statistics import median

sys.path.insert(0, str(Path(__file__).resolve().parent))
from descargar_ams import FRONTERA, TERMINALES  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
FUENTE = RAIZ / "data" / "fuentes" / "usda" / "ams"
LB = 0.45359237

# producto de la vista → mercancías de AMS
PRODUCTOS = {
    "jitomate": ["Tomatoes", "Tomatoes, Plum Type"], "chile": ["Peppers, Bell Type", "Peppers, Jalapeno"],
    "aguacate": ["Avocados"], "limon": ["Limes", "Lemons"], "naranja": ["Oranges"], "papa": ["Potatoes"],
    "cebolla": ["Onions, Dry"], "brocoli": ["Broccoli"], "coliflor": ["Cauliflower"], "fresa": ["Strawberries"],
    "pepino": ["Cucumbers"], "manzana": ["Apples"], "calabacita": ["Squash, Zucchini", "Squash, Yellow Straightneck"],
    "zanahoria": ["Carrots"], "lechuga": ["Lettuce, Iceberg", "Lettuce, Romaine"], "uva": ["Grapes"],
    "toronja": ["Grapefruit"], "pera": ["Pears"], "durazno": ["Peaches", "Nectarines"],
    "arandano": ["Blueberries", "Raspberries"], "esparrago": ["Asparagus"], "sandia": ["Watermelons"],
    "melon": ["Cantaloupes", "Honeydews"], "platano": ["Bananas"], "mango": ["Mangoes"], "pina": ["Pineapples"],
    "berenjena": ["Eggplant"],
}
NOMBRE_MERCANCIA = {
    "Tomatoes": "tomate bola", "Tomatoes, Plum Type": "tomate saladette", "Peppers, Bell Type": "pimiento morrón",
    "Peppers, Jalapeno": "chile jalapeño", "Limes": "limón persa", "Lemons": "limón amarillo",
    "Squash, Zucchini": "calabacita", "Squash, Yellow Straightneck": "calabaza amarilla",
    "Lettuce, Iceberg": "lechuga iceberg", "Lettuce, Romaine": "lechuga romana", "Peaches": "durazno",
    "Nectarines": "nectarina", "Blueberries": "arándano", "Raspberries": "frambuesa", "Cantaloupes": "melón chino",
    "Honeydews": "melón gota de miel",
}
# Peso neto estándar (lb) de cajas que el USDA cotiza por volumen y no por peso
ESTANDAR = {
    ("Apples", "cartons tray pack"): 40, ("Apples", "cartons cell pack"): 40,
    ("Pears", "4/5 bushel cartons"): 44, ("Oranges", "4/5 bushel cartons"): 40,
    ("Grapefruit", "4/5 bushel cartons"): 40, ("Cucumbers", "1 1/9 bushel cartons"): 55,
    ("Peppers, Bell Type", "1 1/9 bushel cartons"): 28, ("Eggplant", "1 1/9 bushel cartons"): 33,
    ("Squash, Zucchini", "1/2 bushel cartons"): 21, ("Squash, Yellow Straightneck", "1/2 bushel cartons"): 21,
    ("Peppers, Jalapeno", "1 1/9 bushel cartons"): 25, ("Avocados", "cartons 2 layer"): 25,
    ("Cantaloupes", "1/2 cartons"): 40, ("Lettuce, Iceberg", "cartons"): 50,
}
MIN_COTIZACIONES = 200   # un empaque con menos cotizaciones no sirve de referencia
MERCADOS = {  # ciudad → (nombre, lat, lon, estado)
    "Atlanta": ("Atlanta", 33.75, -84.39, "GA"), "Baltimore": ("Baltimore", 39.29, -76.61, "MD"),
    "Boston": ("Boston", 42.36, -71.06, "MA"), "Chicago": ("Chicago", 41.88, -87.63, "IL"),
    "Columbia": ("Columbia", 34.00, -81.03, "SC"), "Detroit": ("Detroit", 42.33, -83.05, "MI"),
    "Los Angeles": ("Los Ángeles", 34.05, -118.24, "CA"), "Miami": ("Miami", 25.76, -80.19, "FL"),
    "New York": ("Nueva York", 40.81, -73.88, "NY"), "Philadelphia": ("Filadelfia", 39.95, -75.17, "PA"),
    "Asheville": ("Asheville", 35.60, -82.55, "NC"),
}
CRUCES = {"Nogales": ("Nogales, Arizona", 31.34, -110.94), "McAllen": ("McAllen, Texas", 26.20, -98.23),
          "Otay Mesa": ("Otay Mesa, California", 32.55, -116.94), "Calexico": ("Calexico y San Luis", 32.67, -115.50)}
# Volumen semanal que cruza de México (reporte 1662, National Shipping Point Trends): unidades de 1,000 cwt
CWT_T = 100 * LB * 1000 / 1000   # 1,000 cwt = 100,000 lb = 45.36 t
VOLUMEN_EXTRA = {"jitomate": ["Tomatoes, Grape Type", "Tomatoes, Cherry"], "chile": ["Peppers, Other"]}
# Productos de la vista México → mercancías del reporte de volumen (para ver por dónde y cuándo cruza cada uno)
VOLUMEN_MX = {
    "jitomate": ["Tomatoes", "Tomatoes, Plum Type", "Tomatoes, Grape Type", "Tomatoes, Cherry"],
    "chile": ["Peppers, Bell Type", "Peppers, Other", "Peppers, Mixed Mini Sweet Types"], "aguacate": ["Avocados"],
    "limon": ["Limes", "Lemons"], "naranja": ["Oranges"], "mango": ["Mangoes"], "cebolla": ["Onions, Dry"],
    "brocoli": ["Broccoli"], "fresa": ["Strawberries"], "pepino": ["Cucumbers"], "tomate_verde": ["Tomatillos"],
    "calabacita": ["Squash, Zucchini", "Squash, Grey", "Squash, Yellow Straightneck"], "zanahoria": ["Carrots"],
    "lechuga": ["Lettuce, Iceberg"], "sandia": ["Watermelons"], "melon": ["Cantaloupes", "Honeydews"],
    "papaya": ["Papaya"], "pina": ["Pineapples"], "uva": ["Grapes"], "toronja": ["Grapefruit"], "berenjena": ["Eggplant"],
    "esparrago": ["Asparagus"], "arandano": ["Blueberries"], "frambuesa": ["Raspberries"], "zarzamora": ["Blackberries"],
}
ESTADOS_EN = {
    "Alabama": "Alabama", "Alaska": "Alaska", "Arizona": "Arizona", "Arkansas": "Arkansas", "California": "California",
    "Colorado": "Colorado", "Connecticut": "Connecticut", "Delaware": "Delaware", "Florida": "Florida", "Georgia": "Georgia",
    "Hawaii": "Hawái", "Idaho": "Idaho", "Illinois": "Illinois", "Indiana": "Indiana", "Iowa": "Iowa", "Kansas": "Kansas",
    "Kentucky": "Kentucky", "Louisiana": "Luisiana", "Maine": "Maine", "Maryland": "Maryland", "Massachusetts": "Massachusetts",
    "Michigan": "Míchigan", "Minnesota": "Minnesota", "Mississippi": "Misisipi", "Missouri": "Misuri", "Montana": "Montana",
    "Nebraska": "Nebraska", "Nevada": "Nevada", "New Hampshire": "Nuevo Hampshire", "New Jersey": "Nueva Jersey",
    "New Mexico": "Nuevo México", "New York": "Nueva York", "North Carolina": "Carolina del Norte",
    "North Dakota": "Dakota del Norte", "Ohio": "Ohio", "Oklahoma": "Oklahoma", "Oregon": "Oregón",
    "Pennsylvania": "Pensilvania", "Rhode Island": "Rhode Island", "South Carolina": "Carolina del Sur",
    "South Dakota": "Dakota del Sur", "Tennessee": "Tennessee", "Texas": "Texas", "Utah": "Utah", "Vermont": "Vermont",
    "Virginia": "Virginia", "Washington": "Washington", "West Virginia": "Virginia Occidental", "Wisconsin": "Wisconsin",
    "Wyoming": "Wyoming",
}
PAISES_EN = {
    "Mexico": "México", "Canada": "Canadá", "Chile": "Chile", "Peru": "Perú", "Guatemala": "Guatemala",
    "Honduras": "Honduras", "Costa Rica": "Costa Rica", "Ecuador": "Ecuador", "Colombia": "Colombia",
    "Netherlands": "Países Bajos", "Spain": "España", "Argentina": "Argentina", "New Zealand": "Nueva Zelanda",
    "China": "China", "Dominican Republic": "República Dominicana", "Brazil": "Brasil", "Italy": "Italia",
    "South Africa": "Sudáfrica", "Morocco": "Marruecos", "Israel": "Israel", "Nicaragua": "Nicaragua",
    "Jamaica": "Jamaica", "El Salvador": "El Salvador", "Panama": "Panamá", "Uruguay": "Uruguay",
    "Australia": "Australia", "Egypt": "Egipto", "Belgium": "Bélgica", "France": "Francia", "Japan": "Japón",
    "Korea": "Corea", "Thailand": "Tailandia", "Vietnam": "Vietnam", "India": "India", "Philippines": "Filipinas",
}


def kg_empaque(comm, pk):
    if not pk:
        return None
    p = pk.lower()
    if (comm, pk) in ESTANDAR:
        return ESTANDAR[(comm, pk)] * LB
    m = re.search(r"(\d+)\s+(\d+(?:\.\d+)?)-(lb|oz)\b", p)   # "cartons 12 3-lb film bags", "flats 12 6-oz cups"
    if m:
        u = LB if m.group(3) == "lb" else LB / 16
        return int(m.group(1)) * float(m.group(2)) * u
    m = re.search(r"(\d+(?:\.\d+)?)\s*kg", p)
    if m:
        return float(m.group(1))
    m = re.search(r"(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*lb", p)
    if m:
        return (float(m.group(1)) + float(m.group(2))) / 2 * LB
    m = re.search(r"(\d+(?:\.\d+)?)\s*lb", p)
    if m:
        return float(m.group(1)) * LB
    return None


def precio(r):
    for a, b in (("mostly_low_price", "mostly_high_price"), ("low_price", "high_price")):
        try:
            lo, hi = float(r[a]), float(r[b])
            if lo > 0 and hi > 0:
                return (lo + hi) / 2
        except (TypeError, ValueError):
            continue
    return None


def origen(o):
    o = (o or "").strip()
    if not o or o in ("N/A", "None"):
        return None, "sin dato"
    if "mexico" in o.lower():
        return "mx", "México"
    partes = [x.strip() for x in o.split("-")]
    if all(x in ESTADOS_EN for x in partes):
        return "eua", " y ".join(ESTADOS_EN[x] for x in partes)
    return "otro", PAISES_EN.get(o, o)


def leer(slugs, anio):
    for s in slugs:
        for f in sorted(FUENTE.glob(f"{s}_{anio}-*.json.gz")):
            with gzip.open(f, "rt", encoding="utf-8") as fh:
                yield from json.load(fh)


def mes(fecha):
    return int(fecha.split("/")[0]) - 1


def med(v):
    return round(median(v), 2) if v else None


def mensual(obs):
    por = defaultdict(list)
    for m, p in obs:
        por[m].append(p)
    return [med(por[i]) for i in range(12)]


def cruce_de(distrito):
    d = distrito.upper()
    # Solo distritos exclusivamente de cruces: otros mezclan producción de California o Arizona con lo que cruza
    if not d.startswith("MEXICO CROSSINGS"):
        return None
    if "NOGALES" in d:
        return "Nogales"
    if "OTAY" in d:
        return "Otay Mesa"
    if "CALEXICO" in d or "SAN LU" in d:
        return "Calexico"
    if "ARIZONA, CALIFORNIA AND TEXAS" in d:
        return "Varios"
    if "TEXAS" in d:
        return "McAllen"
    return "Varios"


def volumen_frontera(anio, comm_a_prod):
    """Toneladas por producto, cruce y mes. Cada reporte semanal trae 3 semanas: se toma la más reciente (week1),
    que corresponde a la semana anterior a la fecha del reporte."""
    from datetime import date, timedelta
    vol = defaultdict(lambda: {"cruces": Counter(), "mensual": [0.0] * 12})
    for f in sorted(FUENTE.glob(f"1662_{anio}-*.json.gz")):
        with gzip.open(f, "rt", encoding="utf-8") as fh:
            filas = json.load(fh)
        for r in filas:
            k = comm_a_prod.get(r["commodity"])
            cr = cruce_de(r.get("district") or "")
            if not k or not cr:
                continue
            try:
                u = float(r["shipments_week1"])
            except (TypeError, ValueError):
                continue
            m, d, a = map(int, r["report_date"].split("/"))
            semana = date(a, m, d) - timedelta(days=7)
            if semana.year != anio:
                continue
            for kk in (k if isinstance(k, list) else [k]):
                vol[kk]["cruces"][cr] += u * CWT_T
                vol[kk]["mensual"][semana.month - 1] += u * CWT_T
    return vol


def formato_volumen(v):
    return {"total": round(sum(v["cruces"].values())), "cruces": {c: round(t) for c, t in v["cruces"].most_common()},
            "mensual": [round(t) for t in v["mensual"]]}


ORIGEN_IMPORT = {"PERU": "Perú", "CHILE": "Chile", "CENTRAL AMERICA": "Centroamérica", "GUATEMALA": "Guatemala",
                 "CARIBBEAN": "Caribe", "SOUTH AMERICA": "Sudamérica", "BRAZIL": "Brasil", "ARGENTINA": "Argentina",
                 "BRAZIL, ECUADOR AND PERU": "Brasil, Ecuador y Perú", "GREECE AND ITALY": "Grecia e Italia",
                 "NEW ZEALAND": "Nueva Zelanda", "COLOMBIA": "Colombia", "ECUADOR": "Ecuador", "COSTA RICA": "Costa Rica",
                 "HONDURAS": "Honduras", "SOUTH AFRICA": "Sudáfrica", "SPAIN": "España", "MOROCCO": "Marruecos"}


def calendario(anio, comm_a_prod):
    """Toneladas por mes según su procedencia: producción de EE. UU. (distritos del país), México (cruces) y otras
    importaciones (puertos de entrada, por región de origen). Los distritos que mezclan California/Arizona con cruces
    de México se omiten. Base para las ventanas comerciales."""
    from datetime import date, timedelta
    cal = defaultdict(lambda: {"eua": [0.0] * 12, "mx": [0.0] * 12, "otros": defaultdict(lambda: [0.0] * 12)})
    for f in sorted(FUENTE.glob(f"1662_{anio}-*.json.gz")):
        with gzip.open(f, "rt", encoding="utf-8") as fh:
            filas = json.load(fh)
        for r in filas:
            k = comm_a_prod.get(r["commodity"])
            if not k:
                continue
            try:
                u = float(r["shipments_week1"]) * CWT_T
            except (TypeError, ValueError):
                continue
            m, d, a = map(int, r["report_date"].split("/"))
            semana = date(a, m, d) - timedelta(days=7)
            if semana.year != anio:
                continue
            i = semana.month - 1
            dist = (r.get("district") or "").upper()
            if dist.startswith("MEXICO CROSSINGS"):
                cal[k]["mx"][i] += u
            elif " IMPORTS" in dist:
                origen = dist.split(" IMPORTS")[0].strip()
                cal[k]["otros"][ORIGEN_IMPORT.get(origen, origen.title())][i] += u
            elif "MEXICO" not in dist:
                cal[k]["eua"][i] += u
    return {k: {"eua": [round(x) for x in v["eua"]], "mx": [round(x) for x in v["mx"]],
                "otros": {o: [round(x) for x in s] for o, s in sorted(v["otros"].items(), key=lambda x: -sum(x[1]))}}
            for k, v in cal.items() if sum(v["eua"]) + sum(v["mx"]) > 0}


def tipo_cambio(anio):
    """Promedio anual de pesos por dólar (Reserva Federal, serie H.10 DEXMXUS, vía FRED; CSV público)."""
    import csv
    import urllib.request
    ruta = RAIZ / "data" / "fuentes" / f"fred_dexmxus_{anio}.csv"
    if not ruta.exists():
        url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id=DEXMXUS&cosd={anio}-01-01&coed={anio}-12-31"
        ruta.write_bytes(urllib.request.urlopen(url, timeout=60).read())
    with open(ruta, encoding="utf-8") as f:
        v = [float(r[1]) for r in list(csv.reader(f))[1:] if r[1] not in ("", ".")]
    return round(sum(v) / len(v), 2)


CARGA_KG = 40000 * LB   # carga típica de un tráiler refrigerado: 40,000 lb (18.1 t)
CIUDADES_FLETE = {"Dallas": ("Dallas", 32.78, -96.80, "TX")}   # destinos del reporte de fletes sin mercado terminal activo


def fletes(anio):
    """Tarifa por camión (US$ por carga) de cada cruce de México a cada ciudad: mediana anual y por mes (todas las
    mercancías). Reporte 2375, National Truck Rate Report; "South Texas" se asigna al cruce de Texas (McAllen)."""
    datos = defaultdict(lambda: defaultdict(list))
    for f in sorted(FUENTE.glob(f"2375_{anio}-*.json.gz")):
        with gzip.open(f, "rt", encoding="utf-8") as fh:
            filas = json.load(fh)
        for r in filas:
            d = (r.get("district") or "").upper()
            if not d.startswith("MEXICO CROSSINGS"):
                continue
            cruce = "Nogales" if "NOGALES" in d else "McAllen" if "TEXAS" in d else None
            p = precio(r)
            fecha = r.get("report_Date") or r.get("report_date")
            if cruce and p and fecha and r.get("destination_city"):
                datos[cruce][r["destination_city"]].append((mes(fecha), p))
    return {"cargaKg": round(CARGA_KG), "rutas": {c: {ciudad: [round(median([p for _, p in v])), len(v), mensual(v)]
                                                     for ciudad, v in ciudades.items() if len(v) >= 20}
                                                 for c, ciudades in datos.items()}}


def main(anio=2025):
    comm_a_prod = {c: k for k, cs in PRODUCTOS.items() for c in cs}
    # --- mercados terminales ---
    term = defaultdict(list)   # producto → [(comm, pk, ciudad, tipo, origen, mes, precio)]
    for ciudad, slugs in TERMINALES.items():
        for r in leer(slugs, anio):
            k = comm_a_prod.get(r["commodity"])
            if not k or r.get("organic") == "Y":
                continue
            p = precio(r)
            if p is None:
                continue
            tipo, nom = origen(r.get("origin"))
            term[k].append((r["commodity"], r["package"], ciudad, tipo, nom, mes(r["report_date"]), p))
    # --- frontera (Phoenix: cruces de México por Nogales y McAllen) ---
    fron = defaultdict(list)   # sin origen: el distrito dice por dónde cruza el producto mexicano
    for r in leer(FRONTERA, anio):
        k = comm_a_prod.get(r["commodity"])
        d = (r.get("district") or "").lower()
        if not k or "mexico" not in d or r.get("organic") == "Y":
            continue
        cruce = ("Nogales" if "nogales" in d or "arizona" in d else "Otay Mesa" if "otay" in d or "california" in d
                 else "McAllen" if "texas" in d else None)
        p = precio(r)
        if cruce and p is not None:
            fron[k].append((r["commodity"], r.get("pkg") or r.get("package"), cruce, mes(r["report_date"]), p))

    vol = volumen_frontera(anio, {**comm_a_prod, **{c: k for k, cs in VOLUMEN_EXTRA.items() for c in cs}})
    salida = {"anio": anio, "unidad": "US$/kg", "fuente": f"USDA AMS Market News {anio}",
              "mercados": {c: {"nombre": n, "lat": la, "lon": lo, "estado": e} for c, (n, la, lo, e) in MERCADOS.items()},
              "cruces": {c: {"nombre": n, "lat": la, "lon": lo} for c, (n, la, lo) in CRUCES.items()},
              "productos": {}}
    for k in PRODUCTOS:
        filas = term.get(k, [])
        cuenta = Counter((c, pk) for c, pk, *_ in filas if kg_empaque(c, pk))
        cuenta_mx = Counter((c, pk) for c, pk, _, t, *_ in filas if t == "mx" and kg_empaque(c, pk))
        parte_mx = sum(1 for f in filas if f[3] == "mx") / len(filas) if filas else 0
        # Si el producto mexicano pesa en el mercado, la referencia es su empaque más cotizado
        if parte_mx >= 0.15 and cuenta_mx:
            cuenta = Counter({ck: cuenta[ck] for ck, _ in cuenta_mx.most_common(1)})
        cuenta = Counter({ck: n for ck, n in cuenta.items() if n >= MIN_COTIZACIONES})
        prod = {}
        if cuenta:
            (comm, pk), _ = cuenta.most_common(1)[0]
            kg = kg_empaque(comm, pk)
            sel = [(ci, t, o, m, p / kg) for c, pkk, ci, t, o, m, p in filas if c == comm and pkk == pk]
            por_ciudad = defaultdict(list)
            mx_ciudad = Counter()
            por_origen = defaultdict(list)
            tipo_de = {}
            for ci, t, o, m, p in sel:
                por_ciudad[ci].append(p)
                mx_ciudad[ci] += t == "mx"
                por_origen[o].append(p)
                tipo_de[o] = t
            n = len(sel)
            mx = [p for _, t, _, _, p in sel if t == "mx"]
            cuenta_origen = Counter(f[4] for f in filas)
            tipo_todas = {f[4]: f[3] for f in filas}
            prod = {
                "mercancia": NOMBRE_MERCANCIA.get(comm, comm), "empaque": pk, "kgEmpaque": round(kg, 2),
                "precio": med([p for *_, p in sel]), "n": n,
                # ciudad → [precio mediano, cotizaciones, parte de cotizaciones de origen mexicano]
                "mercados": {ci: [med(v), len(v), round(mx_ciudad[ci] / len(v), 3)] for ci, v in por_ciudad.items() if len(v) >= 10},
                # ciudad → 12 medianas mensuales (para "la mejor ciudad cada mes" en js/precios_eua.js)
                "mercadosMes": {ci: mensual([(m, p) for cc, _, _, m, p in sel if cc == ci]) for ci, v in por_ciudad.items() if len(v) >= 10},
                # origen → [precio en el empaque de referencia (si hay ≥ 5 cotizaciones), parte de TODAS las cotizaciones]
                "origenes": [[o, med(por_origen[o]) if len(por_origen[o]) >= 5 else None, round(c / len(filas), 3), tipo_todas[o]]
                             for o, c in cuenta_origen.most_common(9) if o != "sin dato"][:8],
                "mx": {"parte": round(parte_mx, 3), "precio": med(mx)},
                "mensual": {"todos": mensual([(m, p) for _, _, _, m, p in sel]),
                            "mx": mensual([(m, p) for _, t, _, m, p in sel if t == "mx"]),
                            "eua": mensual([(m, p) for _, t, _, m, p in sel if t == "eua"])},
            }
        ff = fron.get(k, [])
        cf = Counter({ck: n for ck, n in Counter((c, pk) for c, pk, *_ in ff if kg_empaque(c, pk)).items() if n >= 50})
        if cf:
            (comm, pk), _ = cf.most_common(1)[0]
            kg = kg_empaque(comm, pk)
            sel = [(cr, m, p / kg) for c, pkk, cr, m, p in ff if c == comm and pkk == pk]
            por = defaultdict(list)
            for cr, _, p in sel:
                por[cr].append(p)
            prod["frontera"] = {"mercancia": NOMBRE_MERCANCIA.get(comm, comm), "empaque": pk, "kgEmpaque": round(kg, 2),
                                "precio": med([p for *_, p in sel]), "n": len(sel),
                                "cruces": {cr: [med(v), len(v)] for cr, v in por.items()},
                                "crucesMes": {cr: mensual([(m, p) for c2, m, p in sel if c2 == cr]) for cr in por},
                                "mensual": mensual([(m, p) for _, m, p in sel])}
        v = vol.get(k)
        if v and sum(v["cruces"].values()) > 0:
            prod["volumen"] = formato_volumen(v)
        if prod:
            salida["productos"][k] = prod
    # Volumen por producto de la vista México (una mercancía puede servir a un solo producto)
    vol_mx = volumen_frontera(anio, {c: k for k, cs in VOLUMEN_MX.items() for c in cs})
    salida["mexico"] = {k: formato_volumen(v) for k, v in vol_mx.items() if sum(v["cruces"].values()) > 0}
    # Calendario de abasto de EE. UU. por mes y procedencia (claves de la vista México)
    salida["calendario"] = calendario(anio, {c: k for k, cs in VOLUMEN_MX.items() for c in cs})
    salida["tipoCambio"] = {"valor": tipo_cambio(anio), "fuente": f"Reserva Federal (H.10, DEXMXUS), promedio {anio}"}
    salida["fletes"] = fletes(anio)
    salida["ciudadesFlete"] = {c: {"nombre": n, "lat": la, "lon": lo, "estado": e} for c, (n, la, lo, e) in CIUDADES_FLETE.items()}
    destino = RAIZ / "data" / "precios_eua.js"
    destino.write_text(
        f"// Generado por scripts/procesar_ams.py · USDA AMS Market News {anio} (mercados terminales y frontera)\n"
        f"window.PRECIOS_EUA = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"-> {destino.name} ({destino.stat().st_size / 1e3:.0f} kB)")
    for k, p in salida["productos"].items():
        f = p.get("frontera")
        print(f"  {k:10} {p.get('mercancia', '—'):20} {str(p.get('empaque', '—'))[:28]:28} "
              f"{p.get('precio') or 0:6.2f} $/kg n={p.get('n', 0):5} MX {p.get('mx', {}).get('parte', 0):4.0%} "
              f"| frontera {(f or {}).get('precio') or 0:5.2f} ({(f or {}).get('empaque', '—')}, n={(f or {}).get('n', 0)})"
              f" | cruza {p.get('volumen', {}).get('total', 0):>9,} t")
    faltan = [k for k in PRODUCTOS if k not in salida["productos"]]
    if faltan:
        print("  sin precios:", faltan)


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 2025)

"""
Precio al consumidor en EE. UU.: precio promedio de oferta en supermercados (USDA AMS, "Weekly Grocery Store Specialty
Crops Feature Activity", reporte 3324), semanal, nacional y por región (Noreste, Medio Oeste, Sureste, Centro Sur,
Suroeste, Noroeste). Base del gráfico "Precio al consumidor en EE. UU." (js/graficos.js, mismo diseño).

Qué es: el precio promedio ponderado por número de tiendas de los anuncios de oferta de la semana (no el precio de
anaquel de todos los días): sirve para seguir el nivel y las promociones, con su número de tiendas como intensidad.

Método:
  - Descarga por mes (caché en data/fuentes/usda/retail/3324_<año>-<mes>.json.gz; el mes en curso se renueva).
  - Producto de referencia: (mercancía, variedad, presentación) convencional con más tiendas anunciando en el año
    (nacional). Precio de la semana = el nacional de esa referencia; banda = mínimo y máximo de las regiones.
  - Por región (selector): la misma referencia en cada región con al menos 10 semanas.
  - US$/kg cuando la presentación dice su peso ("per lb", "2 lb bag", "10 oz package"); "each", "bunch", "pint": solo
    precio por pieza.
Salida: data/consumidor_eua.js → window.CONSUMIDOR_EUA (carga diferida).

Uso:
  python scripts/procesar_consumidor_eua.py [año=año actual]
  python scripts/procesar_consumidor_eua.py listar     (mercancías del reporte, para el mapeo)
"""
import base64
import datetime
import gzip
import json
import re
import statistics
import sys
import time
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CACHE = RAIZ / "data" / "fuentes" / "usda" / "retail"
URL = "https://marsapi.ams.usda.gov/services/v1.2/reports/3324/Report%20Details?q="
LB, OZ = 0.45359237, 0.028349523
REGIONES = {"Northeast": "Noreste", "Midwest": "Medio Oeste", "Southeast": "Sureste", "Southcentral": "Centro sur",
            "Southwest": "Suroeste", "Northwest": "Noroeste"}
MIN_SEMANAS = 10

# producto del mapa → mercancías del reporte de supermercados
PRODUCTOS = {   # "Mercancía|VARIEDAD" limita a esa variedad (sin distinguir mayúsculas)
    "jitomate": ["Tomatoes"], "chile": ["Peppers (Bell Type)"], "aguacate": ["Avocados"], "limon": ["Limes"],
    "naranja": ["Oranges"], "platano": ["Bananas"], "mango": ["Mangoes"], "papa": ["Potatoes"], "cebolla": ["Onions, Dry"],
    "brocoli": ["Broccoli"], "coliflor": ["Cauliflower"], "fresa": ["Strawberries"], "pepino": ["Cucumbers"],
    "manzana": ["Apples"], "calabacita": ["Squash|ZUCCHINI", "Squash|YELLOW", "Squash|GREY"], "zanahoria": ["Carrots"],
    "lechuga": ["Lettuce|ICEBERG", "Lettuce|ROMAINE"], "sandia": ["Watermelons"], "melon": ["Cantaloupes", "Honeydews"],
    "papaya": ["Papaya"], "pina": ["Pineapples"], "uva": ["Grapes"], "toronja": ["Grapefruit"], "pera": ["Pears"],
    "durazno": ["Peaches", "Nectarines"], "arandano": ["Blueberries"], "frambuesa": ["Raspberries"],
    "zarzamora": ["Blackberries"], "esparrago": ["Asparagus"], "berenjena": ["Eggplant"], "elote": ["Corn-Sweet"],
    "col": ["Cabbage"], "ejote": ["Beans|GREEN"], "cilantro": ["Cilantro"],
    "calabaza": ["Squash|BUTTERNUT", "Squash|ACORN", "Squash|SPAGHETTI", "Squash|KABOCHA", "Squash|BUTTERCUP", "Pumpkins"],
    "col_bruselas": ["Brussels Sprouts"], "rabano": ["Radishes"], "apio": ["Celery"], "espinaca": ["Spinach"],
    "betabel": ["Beets"], "poro": ["Leeks"], "perejil": ["Plain Parsley", "Curly Parsley"], "kale": ["Kale"],
    "alcachofa": ["Artichokes"], "tomate_verde": ["Tomatillos"], "cebollin": ["Onions, Green"],
    "col_china": ["Chinese Cabbage"], "bok_choy": ["Bok Choy"], "nopal": ["Cactus Leaf (Nopales)"],
}


# Variedades con el mismo nombre que en la frontera y los mercados (scripts/procesar_frontera_diaria.py, VARIANTES), para
# el selector del gráfico y para que la cadena compare la misma variedad. "Mercancía|=VARIEDAD": variedad exacta.
VARIEDADES = {
    "jitomate": [("Saladette", "Tomatoes|=Plum Type (Roma)"), ("Bola", "Tomatoes|=VINE RIPES"), ("Uva", "Tomatoes|=GRAPE TYPE")],
    "calabacita": [("Italiana (zucchini)", "Squash|=Zucchini"), ("Gris", "Squash|=GREY"),
                   ("Amarilla", "Squash|=Yellow Crookneck/Straightneck")],
    "calabaza": [("Kabocha", "Squash|=Kabocha"), ("Butternut", "Squash|=Butternut"), ("Spaghetti", "Squash|=Spaghetti"),
                 ("Bellota (acorn)", "Squash|=Acorn")],
    "limon": [("Persa", "Limes"), ("Amarillo", "Lemons")],
}
VARIEDAD_ES = {"VINE RIPES - ON THE VINE": "en racimo", "VINE RIPES": "bola (vine ripe)", "PLUM TYPE (ROMA)": "saladette (roma)",
               "GRAPE TYPE": "uva", "CHERRY TYPE": "cherry", "VINE RIPES - HEIRLOOM VARIETIES": "heirloom", "RED": "rojo",
               "GREEN": "verde", "YELLOW": "amarillo", "ORANGE": "naranja", "ASSORTED COLORS": "colores surtidos",
               "ICEBERG": "orejona (iceberg)", "ROMAINE": "romana", "ROMAINE (HEARTS)": "romana (corazones)",
               "ZUCCHINI": "italiana (zucchini)", "GREY": "gris", "YELLOW CROOKNECK/STRAIGHTNECK": "amarilla",
               "BUTTERNUT": "butternut", "KABOCHA": "kabocha", "ACORN": "bellota (acorn)", "SPAGHETTI": "spaghetti",
               "HASS": "hass", "NAVEL": "navel", "VALENCIA": "valencia", "RUSSET": "russet", "RED SKIN": "roja",
               "YELLOW SKIN": "amarilla", "WHITE": "blanca", "SEEDLESS": "sin semilla", "RED SEEDLESS": "roja sin semilla",
               "GREEN SEEDLESS": "verde sin semilla", "MINI SEEDLESS": "mini sin semilla", "PIE TYPE": "para pay"}


def variedad_es(var):
    if var in (None, "", "N/A"):
        return ""
    return VARIEDAD_ES.get(var.upper(), var.lower())


def coincide(r, entrada):
    comm, _, var = entrada.partition("|")
    if r["commodity"] != comm:
        return False
    if var.startswith("="):
        return (r.get("variety") or "").lower() == var[1:].lower()
    return not var or var.lower() in (r.get("variety") or "").lower()


def producto_de(r, mapa):
    for clave, entradas in mapa.items():
        for e in entradas:
            comm, _, var = e.partition("|")
            if r["commodity"] == comm and (not var or var.lower() in (r.get("variety") or "").lower()):
                return clave
    return None


def clave_api():
    import os
    if os.environ.get("USDA_AMS_API_KEY"):
        return os.environ["USDA_AMS_API_KEY"].strip()
    return re.search(r"^USDA_AMS_API_KEY=(.+)$", (RAIZ / ".env").read_text(encoding="utf-8"), re.M).group(1).strip()


def bajar(anio, mes, auth):
    ruta = CACHE / f"3324_{anio}-{mes:02d}.json.gz"
    hoy = datetime.date.today()
    if ruta.exists() and (anio, mes) != (hoy.year, hoy.month):
        with gzip.open(ruta, "rt", encoding="utf-8") as f:
            return json.load(f)
    fin = [31, 29 if anio % 4 == 0 else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes - 1]
    q = urllib.parse.quote(f"report_begin_date={mes:02d}/01/{anio}:{mes:02d}/{fin}/{anio}")
    for intento in range(5):
        try:
            d = json.load(urllib.request.urlopen(urllib.request.Request(URL + q, headers={"Authorization": auth}), timeout=300))
            filas = [{k: r.get(k) for k in ("commodity", "variety", "size", "region", "organic", "store_count",
                                            "wtd_avg_price", "report_begin_date", "report_end_date")}
                     for r in d.get("results", [])]
            CACHE.mkdir(parents=True, exist_ok=True)
            with gzip.open(ruta, "wt", encoding="utf-8") as f:
                json.dump(filas, f, separators=(",", ":"))
            return filas
        except Exception as e:   # MARS corta a veces: reintento con espera
            print(f"  {anio}-{mes:02d}: {e}; reintento")
            time.sleep(10 * (intento + 1))
    return []


def kg_de(size):
    s = (size or "").lower()
    if s.startswith("per lb"):
        return LB
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?)\s*)?(lb|pound|oz|kg)\b", s)
    if not m:
        return None
    # rango ("8-10 oz", "1-1.5 lb"): el punto medio
    n, u = (float(m.group(1)) + float(m.group(2) or m.group(1))) / 2, m.group(3)
    return n * (LB if u in ("lb", "pound") else OZ if u == "oz" else 1)


def filas_anio(anio, auth):
    hoy = datetime.date.today()
    out = []
    for mes in range(1, 13):
        if (anio, mes) > (hoy.year, hoy.month):
            break
        out += bajar(anio, mes, auth)
    return out


def agregar(filas):
    """El reporte separa invernadero y campo abierto (campo environment) en filas con la misma mercancía, variedad,
    presentación, región y semana: se juntan en un precio ponderado por número de tiendas (todas las tiendas)."""
    grupos = defaultdict(list)
    for r in filas:
        grupos[(r["commodity"], r["variety"], r["size"], r["region"], r["report_end_date"])].append(r)
    out = []
    for g in grupos.values():
        n = sum(r["store_count"] or 0 for r in g)
        precio = (sum(r["wtd_avg_price"] * (r["store_count"] or 0) for r in g) / n) if n else statistics.mean(
            r["wtd_avg_price"] for r in g)
        out.append({**g[0], "wtd_avg_price": precio, "store_count": n})
    return out


def semana(r):
    return datetime.datetime.strptime(r["report_end_date"], "%m/%d/%Y").strftime("%m-%d")


def referencia(fs):
    """Presentación de referencia: la de más tiendas anunciando (nacional); si no trae peso y otra sí (US$/kg posible)
    con al menos la mitad de tiendas que la primera, esa otra."""
    tiendas = Counter()
    for r in fs:
        if r["region"] == "National":
            tiendas[(r["commodity"], r["variety"], r["size"])] += r["store_count"] or 0
    if not tiendas:
        return None
    orden = tiendas.most_common()
    primera = orden[0]
    if kg_de(primera[0][2]):
        return primera[0]
    return next((c for c, n in orden if kg_de(c[2]) and n >= primera[1] / 2), primera[0])


def ficha(fs, anio, nombre=None):
    ref = referencia(fs)
    if not ref:
        return None
    sel = [r for r in fs if (r["commodity"], r["variety"], r["size"]) == ref]
    nac = {semana(r): r for r in sel if r["region"] == "National"}
    reg = defaultdict(list)
    for r in sel:
        if r["region"] in REGIONES:
            reg[semana(r)].append(r["wtd_avg_price"])
    dias = []
    for md in sorted(nac):
        pr = nac[md]["wtd_avg_price"]
        vs = reg.get(md, []) + [pr]
        dias.append([md, round(pr, 2), round(min(vs), 2), round(max(vs), 2)])
    if len(dias) < MIN_SEMANAS:
        return None
    cada = {}
    for en, es in REGIONES.items():
        dr = [[semana(r), round(r["wtd_avg_price"], 2), round(r["wtd_avg_price"], 2), round(r["wtd_avg_price"], 2)]
              for r in sorted(sel, key=semana) if r["region"] == en]
        if len(dr) >= MIN_SEMANAS:
            cada[es] = {"dias": dr, "demanda": [], "volSemana": {}}
    comm, var, size = ref
    kg = kg_de(size)
    out = {"anio": anio, "mercancia": comm, "presentacion": variedad_es(var), "empaque": size,
           "kgEmpaque": round(kg, 4) if kg else None, "cruces": {"Nacional": len(dias)}, "dias": dias, "demanda": [],
           "volSemana": {}, "tiendas": [nac[md]["store_count"] or 0 for md in sorted(nac)],
           **({"porCruce": cada} if len(cada) > 1 else {})}
    if nombre:
        out["nombre"] = nombre
    return out


def producto(filas, k, anio):
    principal = ficha([r for r in filas if producto_de(r, {k: PRODUCTOS[k]})], anio)
    if not principal:
        return None
    prod = dict(principal)
    variantes = [v for v in (ficha([r for r in filas if coincide(r, e)], anio, nombre=n) for n, e in VARIEDADES.get(k, []))
                 if v]
    if len(variantes) > 1:
        clave = lambda v: (v["mercancia"], v["presentacion"], v["empaque"])
        if all(clave(v) != clave(principal) for v in variantes):
            etq = f" ({principal['presentacion']})" if principal["presentacion"] else ""
            variantes.insert(0, {**principal, "nombre": "Más anunciada" + etq})
        prod["variantes"] = variantes
        prod["varOmision"] = next(j for j, v in enumerate(variantes) if clave(v) == clave(principal))
    return prod


def main(anio=None):
    anio = anio or datetime.date.today().year
    auth = "Basic " + base64.b64encode((clave_api() + ":").encode()).decode()

    def limpio(a):
        return agregar([r for r in filas_anio(a, auth) if r.get("organic") == "No" and r.get("wtd_avg_price")])
    filas = limpio(anio)
    if len(sys.argv) > 1 and sys.argv[1] == "listar":
        for c, n in Counter(r["commodity"] for r in filas if r["region"] == "National").most_common():
            print(f"{n:6d}  {c}")
        return
    # De enero a marzo el año en curso aún no junta 10 semanas: respaldo con el año anterior (como los demás gráficos)
    respaldo = datetime.date.today() < datetime.date(anio, 4, 1)
    anterior = limpio(anio - 1) if respaldo else []
    salida = {"generado": datetime.date.today().isoformat(), "anio": anio,
              "fuente": "USDA AMS, Weekly Grocery Store Specialty Crops Feature Activity (3324)", "productos": {}}
    for k in PRODUCTOS:
        prod = producto(filas, k, anio) or (producto(anterior, k, anio - 1) if respaldo else None)
        if not prod:
            continue
        salida["productos"][k] = prod
        for v in prod.get("variantes", [prod]):
            kg, d = v["kgEmpaque"], v["dias"]
            print(f"  {k:12s} {(v.get('nombre') or '')[:22]:22s} {v['mercancia'][:18]:18s} {v['presentacion'][:16]:16s} "
                  f"{v['empaque'][:18]:18s} {len(d):3d} sem {v['anio']} · {len(v.get('porCruce', {}))} reg · "
                  f"último ${d[-1][1]:.2f}{' · ' + str(round(d[-1][1] / kg, 2)) + ' US$/kg' if kg else ''}")
    destino = RAIZ / "data" / "consumidor_eua.js"
    destino.write_text(
        f"// Generado por scripts/procesar_consumidor_eua.py · USDA AMS, precio de oferta en supermercados de EE. UU. {anio}\n"
        f"window.CONSUMIDOR_EUA = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"-> {destino} ({destino.stat().st_size / 1024:.0f} kB), {len(salida['productos'])} productos")
    # Índice pequeño (carga inmediata): qué productos tienen precio al consumidor antes de bajar el archivo diferido
    (RAIZ / "data" / "consumidor_eua_indice.js").write_text(
        f"// Generado por scripts/procesar_consumidor_eua.py · productos con precio al consumidor en EE. UU. · \"generado\":\"{salida['generado']}\"\n"
        f"window.CONSUMIDOR_EUA_PRODUCTOS = {json.dumps(sorted(salida['productos']))};\n", encoding="utf-8")


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else None)

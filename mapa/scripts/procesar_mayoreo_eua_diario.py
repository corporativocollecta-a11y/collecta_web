"""
Precio diario de mayoreo en los mercados terminales de EE. UU. (USDA AMS Market News: Atlanta, Baltimore, Boston,
Chicago, Columbia, Detroit, Los Ángeles, Miami, Nueva York, Filadelfia y Asheville) durante el año, por producto y
variedad. Base del gráfico "Precio de mayoreo en EE. UU." (js/graficos.js, mismo diseño que el precio en la frontera).

Método:
  - Precio de cada cotización = punto medio del rango "mostly" o, si no hay, del bajo–alto (como procesar_ams.py); sin
    orgánicos. Un solo empaque de referencia por producto (mercancía + empaque): el más cotizado de origen mexicano con
    peso conocido si tiene al menos la mitad de cotizaciones que el más cotizado de origen mexicano; si el producto casi
    no llega de México, el más cotizado de todos los orígenes (y la serie principal es de todos los orígenes).
  - Precio del día = mediana de las cotizaciones del día (ciudades, tamaños y variedades del mismo empaque); banda =
    percentiles 10 y 90. Días con al menos 2 cotizaciones.
  - Serie principal: origen México en todos los mercados. "porCruce": la misma por ciudad (cada una con al menos 20
    días). "porOrigen": EE. UU., otros países y todos los orígenes en todos los mercados, mismo empaque.
  - Variedades: las mismas de scripts/procesar_frontera_diaria.py (VARIANTES) cuando el mercado las cotiza.
  - Cambio de año igual que el precio en la frontera (año anterior completo solo en enero–marzo).
  - Sin volumen ni demanda (los mercados terminales no los publican por cotización).
Salida: un archivo por producto, data/mayoreo_eua_<producto>.js (carga diferida al abrir la sección).

Uso:
  python scripts/procesar_mayoreo_eua_diario.py [año=año actual]
"""
import datetime
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
from statistics import median

sys.path.insert(0, str(Path(__file__).resolve().parent))
from descargar_ams import TERMINALES  # noqa: E402
from procesar_ams import MERCADOS, PRODUCTOS, kg_empaque, leer, origen, precio  # noqa: E402
from procesar_frontera_diaria import EXTRA, NOMBRES as NOMBRES_FRONTERA, VARIANTES  # noqa: E402

NOMBRES = {**NOMBRES_FRONTERA, "Potatoes": "papa", "Onions, Dry": "cebolla", "Apples": "manzana", "Grapefruit": "toronja",
           "Pears": "pera", "Bananas": "plátano", "Oranges": "naranja", "Peaches": "durazno", "Nectarines": "nectarina",
           "Cantaloupes": "melón chino", "Lemons": "limón amarillo"}

RAIZ = Path(__file__).resolve().parent.parent
MIN_DIAS = 20
MIN_COTIZACIONES_DIA = 2
ORIGENES = {"eua": "EE. UU.", "otro": "Otros países"}


def percentil(v, q):
    v = sorted(v)
    i = (len(v) - 1) * q
    a, b = int(i), min(int(i) + 1, len(v) - 1)
    return v[a] + (v[b] - v[a]) * (i - a)


def cotizaciones(anio, comm_a_prod):
    """producto → [(mercancía, empaque, ciudad, tipo de origen 'mx'|'eua'|'otro', fecha ISO, precio)]"""
    filas = defaultdict(list)
    for ciudad, slugs in TERMINALES.items():
        nombre = MERCADOS[ciudad][0]
        for r in leer(slugs, anio):
            k = comm_a_prod.get(r.get("commodity"))
            if not k or r.get("organic") == "Y":
                continue
            p = precio(r)
            tipo, _ = origen(r.get("origin"))
            if p is None or not tipo:
                continue
            m, d, a = r["report_date"].split("/")
            filas[k].append((r["commodity"], r.get("package"), nombre, tipo, f"{a}-{m}-{d}", p))
    return filas


def empaque(fs):
    """(mercancía, empaque) de referencia y si la serie principal es de origen México"""
    mx = Counter(f[:2] for f in fs if f[3] == "mx")
    todos = Counter(f[:2] for f in fs)
    base, es_mx = (mx, True) if mx and mx.most_common(1)[0][1] >= MIN_DIAS * 2 else (todos, False)
    if not base:
        return None, False
    top, n_top = base.most_common(1)[0]
    con_peso = [(c, n) for c, n in base.most_common() if kg_empaque(*c)]
    return (con_peso[0][0] if con_peso and con_peso[0][1] >= n_top / 2 else top), es_mx


def serie(fs):
    por_dia = defaultdict(list)
    for f in fs:
        por_dia[f[4]].append(f[5])
    return [[fecha[5:], round(median(v), 2), round(percentil(v, 0.1), 2), round(percentil(v, 0.9), 2)]
            for fecha, v in sorted(por_dia.items()) if len(v) >= MIN_COTIZACIONES_DIA]


def ficha(cotiz, anio, respaldo, filtro=None, nombre=None):
    for a in ([anio, anio - 1] if respaldo else [anio]):
        fs = [f for f in cotiz[a] if filtro is None or f[0] == filtro]
        clave, es_mx = empaque(fs)
        if not clave:
            continue
        fs = [f for f in fs if f[:2] == clave]
        base = [f for f in fs if f[3] == "mx"] if es_mx else fs
        dias = serie(base)
        if len(dias) >= MIN_DIAS:
            break
    else:
        return None
    comm, pk = clave
    kg = kg_empaque(comm, pk)
    ciudades = Counter(f[2] for f in base)
    out = {"anio": a, "mercancia": NOMBRES.get(comm, comm), "empaque": pk, "presentacion": "",
           "kgEmpaque": round(kg, 2) if kg else None, "origenBase": "México" if es_mx else "Todos los orígenes",
           "cruces": dict(ciudades.most_common()), "dias": dias, "demanda": [], "volSemana": {}}
    if nombre:
        out["nombre"] = nombre
    cada = {}
    for c in ciudades:
        dc = serie([f for f in base if f[2] == c])
        if len(dc) >= MIN_DIAS:
            cada[c] = {"dias": dc, "demanda": [], "volSemana": {}}
    if len(cada) > 1:
        out["porCruce"] = dict(sorted(cada.items(), key=lambda x: -len(x[1]["dias"])))
    otros = {}
    if es_mx:
        for t, etq in ORIGENES.items():
            do = serie([f for f in fs if f[3] == t])
            if len(do) >= MIN_DIAS:
                otros[etq] = {"dias": do, "cruces": dict(Counter(f[2] for f in fs if f[3] == t).most_common())}
        dt = serie(fs)
        if len(dt) >= MIN_DIAS:
            otros["Todos los orígenes"] = {"dias": dt, "cruces": dict(Counter(f[2] for f in fs).most_common())}
    if otros:
        out["porOrigen"] = otros
    return out


def main(anio=None):
    anio = anio or datetime.date.today().year
    respaldo = datetime.date.today() < datetime.date(anio, 4, 1)
    productos = {**PRODUCTOS, **{k: v for k, v in EXTRA.items() if k not in PRODUCTOS}}
    comm_a_prod = {c: k for k, cs in productos.items() for c in cs}
    comm_a_prod.update({c: k for k, vs in VARIANTES.items() for c, _ in vs})
    cotiz = {a: cotizaciones(a, comm_a_prod) for a in (anio, anio - 1)}
    hoy = datetime.date.today().isoformat()
    escritos = []
    for viejo in (RAIZ / "data").glob("mayoreo_eua_*.js"):
        viejo.unlink()   # un producto que deja de tener datos no debe quedarse con su archivo viejo
    for k in dict.fromkeys([*productos, *VARIANTES]):
        c = {a: cotiz[a].get(k, []) for a in cotiz}
        principal = ficha(c, anio, respaldo)
        if not principal:
            continue
        prod = dict(principal)
        variantes = []
        for comm, nombre in VARIANTES.get(k, []):
            v = ficha(c, anio, respaldo, comm, nombre)
            if v:
                variantes.append(v)
        if len(variantes) > 1:
            prod["variantes"] = variantes
            # la de omisión es la variedad que coincide con la referencia del producto
            prod["varOmision"] = next((j for j, v in enumerate(variantes) if v["mercancia"] == principal["mercancia"]
                                       and v["empaque"] == principal["empaque"]), 0)
        destino = RAIZ / "data" / f"mayoreo_eua_{k}.js"
        destino.write_text(
            f"// Generado por scripts/procesar_mayoreo_eua_diario.py · USDA AMS, mercados terminales de EE. UU. {anio}\n"
            "window.MAYOREO_EUA = window.MAYOREO_EUA || { productos: {} };\n"
            f"Object.assign(window.MAYOREO_EUA, {{\"anio\":{anio},\"generado\":\"{hoy}\"}});\n"   # formato que lee publicar_web.py
            f"window.MAYOREO_EUA.productos[{json.dumps(k)}] = {json.dumps(prod, ensure_ascii=False, separators=(',', ':'))};\n",
            encoding="utf-8")
        escritos.append(destino)
        for v in variantes or [prod]:
            print(f"  {k:12s} {(v.get('nombre') or '')[:16]:16s} {v['mercancia'][:18]:18s} {str(v['empaque'])[:26]:26s} "
                  f"{v['origenBase'][:7]:7s} {len(v['dias']):3d} días {v['anio']} · ciudades {len(v.get('porCruce', {})):2d} · "
                  f"orígenes {', '.join(v.get('porOrigen', {}))} · último ${v['dias'][-1][1]:.2f}")
    # Índice pequeño (se carga con el mapa): qué productos tienen serie, para mostrar la sección sin bajar cada archivo
    indice = RAIZ / "data" / "mayoreo_eua_indice.js"
    claves = [f.stem.replace("mayoreo_eua_", "") for f in escritos]
    indice.write_text(
        "// Generado por scripts/procesar_mayoreo_eua_diario.py · productos con precio diario en los mercados terminales de EE. UU.\n"
        f"window.MAYOREO_EUA_INDICE = {json.dumps({'anio': anio, 'generado': hoy, 'productos': claves}, separators=(',', ':'))};\n",
        encoding="utf-8")
    total = sum(f.stat().st_size for f in escritos)
    print(f"-> {len(escritos)} archivos data/mayoreo_eua_*.js ({total / 1024:.0f} kB en total)")


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else None)

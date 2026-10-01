"""
Motor común de las vistas por país (regiones subnacionales).

Cada país tiene su propio script de datos (procesar_usda.py, procesar_ibge.py, …) que obtiene producción y
población por región desde su fuente oficial y llama a `escribir_pais(...)`. Este módulo agrega el comercio
del país con FAOSTAT (mundial, 2024) y escribe data/sub_<codigo>.js con un formato común:

window.SUBNACIONAL[<codigo>] = {
  codigo, m49, pais, nivel, nivelPlural, anio, anioPoblacion, anioComercio, fuente, metodo, limites,
  regiones:  {id: {nombre, lat, lon, pob}},
  productos: {clave: {nombre?, nota?, fuenteProduccion, anioProduccion, nacional, ha,
                      regiones: {id: [toneladas, 0 = publicado | 1 = estimado]},
                      comercio: {exp, imp, expUSD, impUSD, origenes, destinos, desdeMX, haciaMX}}}
}
origenes / destinos: [[m49, iso2, toneladas, miles de USD], …]  (matriz bilateral de FAOSTAT, reportada por el exportador)
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def leer_js(nombre):
    t = (RAIZ / "data" / nombre).read_text(encoding="utf-8")
    return json.loads(t[t.index("{"):t.rindex("}") + 1])


_G = _GC = None


def comercio(m49, clave):
    """Comercio del país para un producto del mapa, con FAOSTAT (TCL para totales, matriz para socios)."""
    global _G, _GC
    if _G is None:
        _G, _GC = leer_js("global.js"), leer_js("global_comercio.js")
    fao = _G["productos"].get(clave, {}).get("datos", {}).get(m49)
    if not fao:
        return None
    iso = lambda c: _G["paises"].get(c, {}).get("iso") or c
    flujos = _GC["productos"].get(clave, [])
    llegan = sorted([f for f in flujos if f[1] == m49], key=lambda f: -f[2])
    salen = sorted([f for f in flujos if f[0] == m49], key=lambda f: -f[3])
    mx_in = next((f for f in llegan if f[0] == "484"), None)
    mx_out = next((f for f in salen if f[1] == "484"), None)
    return {
        "exp": round(fao[2]), "imp": round(fao[3]), "expUSD": round(fao[4]), "impUSD": round(fao[5]),
        "origenes": [[f[0], iso(f[0]), round(f[2]), round(f[3])] for f in llegan[:6]],
        "destinos": [[f[1], iso(f[1]), round(f[2]), round(f[3])] for f in salen[:6]],
        "desdeMX": [round(mx_in[2]), round(mx_in[3])] if mx_in else [0, 0],
        "haciaMX": [round(mx_out[2]), round(mx_out[3])] if mx_out else [0, 0],
    }


def produccion_fao(m49, clave):
    """[toneladas, hectáreas] nacionales de FAOSTAT (para productos sin dato oficial por región o en otras unidades)."""
    global _G, _GC
    if _G is None:
        _G, _GC = leer_js("global.js"), leer_js("global_comercio.js")
    d = _G["productos"].get(clave, {}).get("datos", {}).get(m49)
    return (d[0], d[1]) if d else (0, 0)


def fao_bruto(m49, items, anio="2024"):
    """Producción y comercio de FAOSTAT para cultivos que no están en global.js (cereza, kiwi, mandarina…),
    leídos de los archivos brutos mundiales (data/fuentes/faostat, versión NOFLAG). Se guarda una caché por país.
    items: {clave del mapa: código de producto FAO}. Devuelve {clave: {"prod", "comercio"}}."""
    import csv
    import io
    import zipfile
    carpeta = RAIZ / "data" / "fuentes" / "faostat"
    cache = carpeta / f"cache_{m49}_{anio}.json"
    datos = json.loads(cache.read_text(encoding="utf-8")) if cache.exists() else {}
    faltan = {c for c in items.values() if c not in datos}
    if faltan:
        for archivo in ("Production_Crops_Livestock_E_All_Data.zip", "Trade_CropsLivestock_E_All_Data.zip"):
            z = zipfile.ZipFile(carpeta / archivo)
            nombre = next(n for n in z.namelist() if n.endswith("_NOFLAG.csv"))
            lector = csv.reader(io.TextIOWrapper(z.open(nombre), encoding="latin-1"))
            cab = next(lector)
            ix = {c: i for i, c in enumerate(cab)}
            for fila in lector:
                if fila[ix["Area Code (M49)"]].strip("'") != m49 or fila[ix["Item Code"]] not in faltan:
                    continue
                clave = {"Production": "prod", "Export quantity": "exp", "Import quantity": "imp",
                         "Export value": "expUSD", "Import value": "impUSD"}.get(fila[ix["Element"]])
                if clave:
                    datos.setdefault(fila[ix["Item Code"]], {})[clave] = round(float(fila[ix[f"Y{anio}"]] or 0))
        for c in faltan:
            datos.setdefault(c, {})
        cache.write_text(json.dumps(datos), encoding="utf-8")
    salida = {}
    for clave, codigo in items.items():
        d = datos.get(codigo, {})
        salida[clave] = {
            "prod": d.get("prod", 0),
            "comercio": {"exp": d.get("exp", 0), "imp": d.get("imp", 0), "expUSD": d.get("expUSD", 0),
                         "impUSD": d.get("impUSD", 0), "origenes": [], "destinos": [], "desdeMX": [0, 0], "haciaMX": [0, 0]}
            if any(k in d for k in ("exp", "imp")) else None,
        }
    return salida


def anio_comercio():
    global _G, _GC
    if _G is None:
        _G, _GC = leer_js("global.js"), leer_js("global_comercio.js")
    return _G["anio"]


def escribir_pais(datos, sin_comercio=()):
    """Completa el comercio de cada producto y escribe data/sub_<codigo>.js."""
    m49 = datos["m49"]
    for clave, p in datos["productos"].items():
        if "comercio" not in p:
            p["comercio"] = None if clave in sin_comercio else comercio(m49, clave)
    datos.setdefault("anioComercio", anio_comercio())
    codigo = datos["codigo"]
    destino = RAIZ / "data" / f"sub_{codigo.lower()}.js"
    destino.write_text(
        f"// Generado por scripts ({datos['fuente']}) con el motor común scripts/subnacional_comun.py\n"
        "window.SUBNACIONAL = window.SUBNACIONAL || {};\n"
        f"window.SUBNACIONAL.{codigo} = {json.dumps(datos, ensure_ascii=False, separators=(',', ':'))};\n",
        encoding="utf-8",
    )
    return destino


def resumen(datos):
    """Imprime un resumen por producto (para revisar en consola)."""
    pob = sum(r.get("pob") or 0 for r in datos["regiones"].values())
    print(f"{datos['pais']}: {len(datos['regiones'])} {datos['nivelPlural']}, población {pob:,}, {len(datos['productos'])} productos")
    for k, p in datos["productos"].items():
        c = p.get("comercio") or {}
        imp = max(c.get("imp", 0), sum(o[2] for o in c.get("origenes", [])))
        cons = p["nacional"] + imp - c.get("exp", 0)
        lider = max(p["regiones"].items(), key=lambda x: x[1][0])[0] if p["regiones"] else "—"
        pub = sum(1 for v in p["regiones"].values() if v[1] == 0)
        print(f"  {k:11s} {p['fuenteProduccion']:9s} {p['nacional']:>12,.0f} t · {len(p['regiones']):>3} reg. ({pub} publ.) líder {lider:>6} · "
              f"autosuf {p['nacional'] / cons * 100 if cons > 0 else 0:6.0f}% · importado {imp / cons * 100 if cons > 0 else 0:5.1f}%")

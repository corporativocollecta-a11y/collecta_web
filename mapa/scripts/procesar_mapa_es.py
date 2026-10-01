"""
Vista España: producción por comunidad autónoma del Ministerio de Agricultura, Pesca y Alimentación (MAPA) y
población del INE. Comercio con FAOSTAT mediante el motor común (scripts/subnacional_comun.py).

Fuentes:
  - MAPA, "Superficies y producciones anuales de cultivos" (Reglamento CE 543/2009), tablas globales en Excel con
    la base de datos provincial (hoja BD_…): hortalizas, frutales no cítricos, cítricos y viñedo del año (provisional);
    patata del año anterior (último publicado).
    https://www.mapa.gob.es/es/estadistica/temas/estadisticas-agrarias/agricultura/superficies-producciones-anuales-cultivos
  - INE, Estadística Continua de Población, tabla 56940 (población residente por comunidad autónoma, 1 de enero).
  - Plátano de Canarias: no viene en esas tablas; la producción nacional de FAOSTAT se asigna a Canarias (estimado).

Uso:
  python scripts/procesar_mapa_es.py [año=2025]
Salida: data/sub_es.js → window.SUBNACIONAL.ES
"""
import json
import sys
import urllib.request
from pathlib import Path

import openpyxl

from subnacional_comun import escribir_pais, produccion_fao, resumen

RAIZ = Path(__file__).resolve().parent.parent
CACHE = RAIZ / "data" / "fuentes" / "mapa_es"
BASE = ("https://www.mapa.gob.es/dam/mapa/contenido/estadisticas/temas/estadisticas-agrarias/2.agricultura/"
        "3.-superficies-y-producciones-anuales/reglamento-n--543-2009/")
# archivo → (año que contiene, variable de producción)
ARCHIVOS = {
    "re1_hortalizas_formato_tabla_global-0": "PCOH",            # producción cosechada
    "re1_frutales_no_citricos_formato_tabla_global-0": "PRTR",  # producción recolectada total
    "re1__citricos_formato_tabla_global-0": "PRTR",
    "re1_vinedo_formato_tabla_global-0": "PTRE",               # producción total recolectada
    "re1_tuberculos_formato_tabla_global-0": "PRCO",           # producción cosechada (patata, año anterior)
}
HO, NC, CI, VI, TU = list(ARCHIVOS)

# producto del mapa → [(archivo, código de cultivo MAPA)]
PRODUCTOS = {
    "jitomate": [(HO, "HO2500")], "chile": [(HO, "HO2610"), (HO, "HO2620")], "cebolla": [(HO, "HO4210")],
    "zanahoria": [(HO, "HO4500")], "lechuga": [(HO, "HO1400")], "fresa": [(HO, "HO6000")],
    "brocoli": [(HO, "HO3210")], "coliflor": [(HO, "HO3220")], "pepino": [(HO, "HO2330"), (HO, "HO2340")],
    "berenjena": [(HO, "HO2400")], "esparrago": [(HO, "HO1200")], "sandia": [(HO, "HO2100")],
    "melon": [(HO, "HO2200")], "calabacita": [(HO, "HO2310"), (HO, "HO2320")],
    "papa": [(TU, "TH1100")],
    "manzana": [(NC, "NC1100")], "pera": [(NC, "NC1200")],
    "durazno": [(NC, "NC2100"), (NC, "NC2200"), (NC, "NC2700"), (NC, "NC2800")],
    "aguacate": [(NC, "NC3300")], "mango": [(NC, "NC3516")], "papaya": [(NC, "NC3518")],
    "arandano": [(NC, "NC4300"), (NC, "NC4200")],
    "naranja": [(CI, "CI1000")], "mandarina": [(CI, "CI3000")], "limon": [(CI, "CI4000")], "toronja": [(CI, "CI6000")],
    "uva": [(VI, "VI1200")],
    "platano": [],   # FAOSTAT → Canarias
}
NOMBRES = {"arandano": "Berries (arándano y frambuesa)", "chile": "Pimiento y guindilla"}
NOTAS = {
    "jitomate": "Incluye el tomate para industria (sobre todo en Extremadura), como la FAO.",
    "chile": "Pimiento y guindilla, de campo e invernadero.",
    "pepino": "Pepino y pepinillo.",
    "calabacita": "Calabaza y calabacín.",
    "durazno": "Melocotón, nectarina, paraguayo y platerina.",
    "uva": "Solo uva de mesa (sin la de vinificación).",
    "papa": "Dato del año anterior: es el último que publica el MAPA para la patata.",
    "platano": "Plátano de Canarias: el MAPA no lo incluye en estas tablas. Se asigna a Canarias la producción nacional de FAOSTAT (estimado).",
    "mandarina": "Su comercio no está en este mapa: el balance supone que lo producido se consume en el país, pero España exporta gran parte.",
}

# Provincia (código INE) → comunidad autónoma (código INE)
PROV_CCAA = {
    **{p: "01" for p in (4, 11, 14, 18, 21, 23, 29, 41)}, **{p: "02" for p in (22, 44, 50)}, 33: "03", 7: "04",
    35: "05", 38: "05", 39: "06", **{p: "07" for p in (5, 9, 24, 34, 37, 40, 42, 47, 49)},
    **{p: "08" for p in (2, 13, 16, 19, 45)}, **{p: "09" for p in (8, 17, 25, 43)}, **{p: "10" for p in (3, 12, 46)},
    6: "11", 10: "11", **{p: "12" for p in (15, 27, 32, 36)}, 28: "13", 30: "14", 31: "15",
    **{p: "16" for p in (1, 20, 48)}, 26: "17", 51: "18", 52: "19",
}
CCAA = {  # código INE → (nombre, nombre en la tabla del INE, lat, lon)
    "01": ("Andalucía", "Andalucía", 37.39, -5.98), "02": ("Aragón", "Aragón", 41.65, -0.88),
    "03": ("Asturias", "Asturias, Principado de", 43.36, -5.85), "04": ("Illes Balears", "Balears, Illes", 39.57, 2.65),
    "05": ("Canarias", "Canarias", 28.30, -15.90), "06": ("Cantabria", "Cantabria", 43.46, -3.80),
    "07": ("Castilla y León", "Castilla y León", 41.65, -4.72), "08": ("Castilla-La Mancha", "Castilla - La Mancha", 39.86, -4.02),
    "09": ("Cataluña", "Cataluña", 41.39, 2.17), "10": ("Comunitat Valenciana", "Comunitat Valenciana", 39.47, -0.38),
    "11": ("Extremadura", "Extremadura", 38.92, -6.34), "12": ("Galicia", "Galicia", 42.88, -8.54),
    "13": ("Comunidad de Madrid", "Madrid, Comunidad de", 40.42, -3.70), "14": ("Región de Murcia", "Murcia, Región de", 37.99, -1.13),
    "15": ("Navarra", "Navarra, Comunidad Foral de", 42.81, -1.64), "16": ("País Vasco", "País Vasco", 42.85, -2.67),
    "17": ("La Rioja", "Rioja, La", 42.47, -2.45), "18": ("Ceuta", "Ceuta", 35.89, -5.32), "19": ("Melilla", "Melilla", 35.29, -2.94),
}


def base_mapa(archivo, variable):
    """{código de cultivo: {provincia: toneladas}} y el año, desde la hoja BD_ (con caché JSON)."""
    cache = CACHE / f"{archivo}.{variable}.json"
    if cache.exists():
        d = json.loads(cache.read_text(encoding="utf-8"))
        return d["datos"], d["anio"]
    ruta = CACHE / f"{archivo}.xlsx"
    if not ruta.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(BASE + archivo + ".xlsx", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=600) as r:
            ruta.write_bytes(r.read())
    wb = openpyxl.load_workbook(ruta, read_only=True, data_only=True)
    # El año está en el título de la primera hoja: "…: Análisis provincial detallado , 2025"
    anio = None
    for fila in wb.worksheets[0].iter_rows(max_row=4, values_only=True):
        for c in fila:
            if c and "detallado" in str(c):
                anio = int(str(c).rsplit(",", 1)[1].strip())
    hoja = next(w for w in wb.worksheets if w.title.startswith("BD"))
    datos = {}
    for r in hoja.iter_rows(min_row=2, values_only=True):
        if r[7] == variable and r[5] and isinstance(r[0], (int, float)) and r[9]:
            datos.setdefault(r[5], {})[str(int(r[0]))] = float(r[9])
    cache.write_text(json.dumps({"anio": anio, "datos": datos}), encoding="utf-8")
    return datos, anio


def poblacion():
    ruta = RAIZ / "data" / "fuentes" / "ine_es" / "ine_56940_ult.json"
    if not ruta.exists():
        ruta.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve("https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/56940?nult=1&tip=A", ruta)
    series = json.loads(ruta.read_text(encoding="utf-8"))
    por_nombre = {v[1]: k for k, v in CCAA.items()}
    pob, anio = {}, None
    for s in series:
        partes = [p.strip() for p in s["Nombre"].split(".")]
        if len(partes) > 2 and partes[0] == "Total" and partes[1] == "Todas las edades" and partes[2] in por_nombre:
            pob[por_nombre[partes[2]]] = int(s["Data"][0]["Valor"])
            anio = s["Data"][0]["Anyo"]
    return pob, anio


def main(anio=2025):
    tablas = {a: base_mapa(a, v) for a, v in ARCHIVOS.items()}
    pob, anio_pob = poblacion()
    faltan = [c for c in CCAA if c not in pob]
    assert not faltan, f"sin población: {faltan}"

    datos = {
        "codigo": "ES", "m49": "724", "pais": "España", "nivel": "comunidad autónoma",
        "nivelPlural": "comunidades autónomas", "femenino": True,
        "anio": anio, "anioPoblacion": anio_pob,
        "fuente": f"MAPA superficies y producciones {anio} (provisional), INE población {anio_pob}, FAOSTAT",
        "fuenteCorta": f"MAPA {anio}",
        "metodo": "Producción por provincia de la estadística anual de superficies y producciones del MAPA, sumada por "
                  "comunidad autónoma, sin estimaciones propias (salvo el plátano de Canarias, tomado de FAOSTAT).",
        "limites": [[27.5, -18.3], [43.9, 4.4]],
        "regiones": {c: {"nombre": n, "lat": la, "lon": lo, "pob": pob.get(c)} for c, (n, _, la, lo) in CCAA.items()},
        "productos": {},
    }
    for clave, partes in PRODUCTOS.items():
        regiones, anio_p = {}, anio
        if clave == "platano":
            nacional, ha = produccion_fao("724", "platano")
            regiones = {"05": [nacional, 1]}
            fuente, anio_p = "FAOSTAT", None
        else:
            fuente = "MAPA"
            for archivo, codigo in partes:
                prod, anio_archivo = tablas[archivo]
                anio_p = anio_archivo
                for prov, t in prod.get(codigo, {}).items():
                    c = PROV_CCAA[int(prov)]
                    regiones[c] = [regiones.get(c, [0, 0])[0] + t, 0]
            nacional = sum(v[0] for v in regiones.values())
            ha = 0
        if nacional <= 0:
            print(f"  (sin datos: {clave})")
            continue
        datos["productos"][clave] = {
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            **({"nota": NOTAS[clave]} if clave in NOTAS else {}),
            "fuenteProduccion": fuente, "anioProduccion": anio_p or anio,
            "nacional": round(nacional), "ha": round(ha),
            "regiones": {c: [round(t), e] for c, (t, e) in regiones.items() if round(t) > 0},
        }

    destino = escribir_pais(datos, sin_comercio=("coliflor", "mandarina"))
    print(f"→ {destino.name} ({destino.stat().st_size / 1e3:.0f} kB) · población {sum(pob.values()):,}")
    resumen(datos)


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 2025)

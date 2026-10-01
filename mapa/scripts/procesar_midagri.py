"""
Vista Perú: producción por departamento (región) del MIDAGRI y población del INEI. Comercio con FAOSTAT mediante
el motor común (scripts/subnacional_comun.py).

Fuentes:
  - MIDAGRI, boletín estadístico mensual "El Agro en Cifras", edición de diciembre: cuadro C.18 "Producción de
    principales cultivos por región, Enero-Diciembre" (preliminar). Repositorio institucional del MIDAGRI:
    https://repositorio.midagri.gob.pe/bitstream/20.500.13036/2181/1/El-agro-en-cifras-diciembre-2025.pdf
    (el portal SIEA y gob.pe no son accesibles desde fuera de Perú; el repositorio sí). Se lee con leer_agro_cifras.py.
  - INEI, población estimada al 30 de junio por departamento (proy_03_4.xlsx, hoja 2024-2026).
    https://m.inei.gob.pe/media/MenuRecursivo/indices_tematicos/proy_03_4.xlsx

Uso:
  python scripts/procesar_midagri.py [año=2025]
Salida: data/sub_pe.js → window.SUBNACIONAL.PE
"""
import sys
import unicodedata
import urllib.request
from pathlib import Path

import openpyxl

from leer_agro_cifras import leer, verificar
from subnacional_comun import escribir_pais, resumen

RAIZ = Path(__file__).resolve().parent.parent
PDF = {2025: ("agro_cifras_2025_12.pdf", "https://repositorio.midagri.gob.pe/bitstream/20.500.13036/2181/1/El-agro-en-cifras-diciembre-2025.pdf")}
INEI = ("proy_03_4.xlsx", "https://m.inei.gob.pe/media/MenuRecursivo/indices_tematicos/proy_03_4.xlsx")

# producto del mapa → columnas del cuadro C.18
PRODUCTOS = {
    "jitomate": ["Tomate"], "chile": ["Ají", "Piquillo", "Pimiento"], "cebolla": ["Cebolla"], "papa": ["Papa"],
    "zanahoria": ["Zanahoria"], "esparrago": ["Espárrago"], "calabacita": ["Zapallo"],
    "aguacate": ["Palta"], "platano": ["Plátano"], "mango": ["Mango"], "papaya": ["Papaya"], "pina": ["Piña"],
    "limon": ["Limón sutil"], "naranja": ["Naranja"], "uva": ["Uva"], "manzana": ["Manzana"], "durazno": ["Melocotón"],
    "arandano": ["Arándano"],
    # Solo vistas por país (data/productos_paises.js)
    "mandarina": ["Mandarina", "Tangelo"], "granadilla": ["Granadilla"],
}
NOMBRES = {"arandano": "Arándano"}
NOTAS = {
    "chile": "Ají, piquillo y pimiento en fresco (sin páprika seca).",
    "limon": "Limón sutil (la lima ácida peruana).",
    "calabacita": "Zapallo.",
    "arandano": "Solo arándano (el boletín no registra frambuesa); comercio de la FAO con berries agrupadas.",
    "mandarina": "Mandarina y tangelo. Perú exporta mucha mandarina, pero su comercio no está en este mapa: el balance supone que lo producido se consume en el país.",
    "granadilla": "Su comercio no está separado en la FAO: el balance supone que lo producido se consume en el país.",
}

DEPTOS = {  # ubigeo → (nombre, lat, lon de la capital)
    "01": ("Amazonas", -6.23, -77.87), "02": ("Áncash", -9.53, -77.53), "03": ("Apurímac", -13.64, -72.88),
    "04": ("Arequipa", -16.40, -71.54), "05": ("Ayacucho", -13.16, -74.22), "06": ("Cajamarca", -7.16, -78.51),
    "07": ("Callao", -12.06, -77.15), "08": ("Cusco", -13.53, -71.97), "09": ("Huancavelica", -12.79, -74.97),
    "10": ("Huánuco", -9.93, -76.24), "11": ("Ica", -14.07, -75.73), "12": ("Junín", -12.07, -75.21),
    "13": ("La Libertad", -8.11, -79.03), "14": ("Lambayeque", -6.77, -79.84), "15": ("Lima", -12.05, -77.00),
    "16": ("Loreto", -3.75, -73.25), "17": ("Madre de Dios", -12.59, -69.19), "18": ("Moquegua", -17.19, -70.93),
    "19": ("Pasco", -10.68, -76.26), "20": ("Piura", -5.19, -80.63), "21": ("Puno", -15.84, -70.02),
    "22": ("San Martín", -6.03, -76.97), "23": ("Tacna", -18.01, -70.25), "24": ("Tumbes", -3.57, -80.45),
    "25": ("Ucayali", -8.38, -74.55),
}


def norm(t):
    return unicodedata.normalize("NFD", t).encode("ascii", "ignore").decode().lower().replace(" ", "")


POR_NOMBRE = {norm(n): c for c, (n, _, _) in DEPTOS.items()}
POR_NOMBRE[norm("Lima Metropolitana")] = "15"   # el INEI incluye Lima Metropolitana en el departamento de Lima
POR_NOMBRE[norm("Prov. Const. del Callao")] = "07"


def fuente(carpeta, nombre, url):
    ruta = RAIZ / "data" / "fuentes" / carpeta / nombre
    if not ruta.exists():
        ruta.parent.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=300) as r:
            ruta.write_bytes(r.read())
    return ruta


def poblacion(anio):
    wb = openpyxl.load_workbook(fuente("inei", *INEI), data_only=True)
    ws = next(w for w in wb if str(anio) in w.title.split("-")[0] or
              int(w.title.split("-")[0]) <= anio <= int(w.title.split("-")[1]))
    filas = [r for r in ws.iter_rows(values_only=True) if any(c is not None for c in r)]
    col = filas[1].index(anio)   # la columna "Total" del año
    return {POR_NOMBRE[norm(str(r[1]).strip())]: int(r[col]) for r in filas[3:]
            if r[0] and str(r[0]).strip().isdigit() and str(r[0]).strip() != "000000"}


def main(anio=2025):
    tabla = leer(fuente("midagri", *PDF[anio]))
    descuadres = verificar(tabla)
    assert not descuadres, descuadres
    pob = poblacion(anio)

    datos = {
        "codigo": "PE", "m49": "604", "pais": "Perú", "nivel": "departamento", "nivelPlural": "departamentos",
        "anio": anio, "anioPoblacion": anio,
        "fuente": f"MIDAGRI El Agro en Cifras (dic. {anio}), INEI población {anio}, FAOSTAT",
        "fuenteCorta": f"MIDAGRI {anio}",
        "metodo": "Producción enero-diciembre por región del boletín El Agro en Cifras del MIDAGRI (cifras preliminares), "
                  "sin estimaciones propias. Lima incluye Lima Metropolitana, como el departamento del INEI.",
        "limites": [[-18.4, -81.4], [-0.1, -68.6]],
        "regiones": {c: {"nombre": n, "lat": la, "lon": lo, "pob": pob.get(c)} for c, (n, la, lo) in DEPTOS.items()},
        "productos": {},
    }
    for clave, columnas in PRODUCTOS.items():
        regiones = {}
        for columna in columnas:
            for nombre, anios in tabla[columna].items():
                if nombre == "Total Nacional":
                    continue
                c = POR_NOMBRE[norm(nombre)]
                t = anios.get(anio, 0)
                if t > 0:
                    regiones[c] = regiones.get(c, 0) + t
        nacional = sum(tabla[col]["Total Nacional"][anio] for col in columnas)
        assert abs(nacional - sum(regiones.values())) <= 2 * len(columnas), clave
        datos["productos"][clave] = {
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            **({"nota": NOTAS[clave]} if clave in NOTAS else {}),
            "fuenteProduccion": "MIDAGRI", "anioProduccion": anio,
            "nacional": nacional, "ha": 0,
            "regiones": {c: [t, 0] for c, t in regiones.items()},
        }

    destino = escribir_pais(datos, sin_comercio=("mandarina", "granadilla"))
    print(f"→ {destino.name} ({destino.stat().st_size / 1e3:.0f} kB) · población {sum(pob.values()):,}")
    resumen(datos)


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 2025)

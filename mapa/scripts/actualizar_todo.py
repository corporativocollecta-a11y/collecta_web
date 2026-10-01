"""
Actualización anual del mapa: corre, en orden, todas las fuentes que se descargan solas por internet y lista las que
requieren una descarga manual. No publica: para subir al sitio, después correr scripts/publicar_web.py.

Uso:
  python scripts/actualizar_todo.py [año=año pasado]
Requiere en .env: USDA_AMS_API_KEY (precios y embarques de EE. UU.).
"""
import subprocess
import sys
import urllib.request
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PY = sys.executable

MANUALES = [
    ("SIAP, cierre agrícola municipal", "https://nube.siap.gob.mx/cierreagricola/ → data/fuentes/ → procesar_siap.py <csv>"),
    ("Panorama Agroalimentario (consumo per cápita)", "PDF anual del SIAP → procesar_panorama.py <pdf> <año>"),
    ("PROFECO Quién es Quién en los Precios", "RAR anual de datos.profeco.gob.mx → procesar_profeco.py <rar>"),
    ("USDA NASS (producción por estado de EE. UU.)", "bulk qs.crops_*.txt.gz → filtrar_nass.py y procesar_usda.py"),
    ("FAOSTAT (Latinoamérica, mundo, matriz de comercio)", "zips de bulks-faostat.fao.org → procesar_faostat.py, procesar_faostat_bilateral.py, procesar_mercados.py, procesar_historia.py"),
    ("Vistas por país", "un script por país (procesar_ibge.py, procesar_eva.py, …); Turquía y Corea se leen en el navegador"),
]


def correr(*args):
    print(f"\n$ python {' '.join(str(a) for a in args)}")
    r = subprocess.run([PY, *map(str, args)], cwd=RAIZ)
    if r.returncode:
        print(f"  ⚠ terminó con código {r.returncode}; se sigue con lo demás")
    return r.returncode == 0


def descargar_sequia():
    """Monitor de Sequía: el archivo se reemplaza con la versión más reciente (se publica cada quincena)."""
    url = "https://smn.conagua.gob.mx/tools/RESOURCES/Monitor%20de%20Sequia%20en%20Mexico/MunicipiosSequia.xlsx"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    datos = urllib.request.urlopen(req, timeout=180).read()
    assert datos[:2] == b"PK", "la descarga no es un archivo xlsx"
    (RAIZ / "data" / "fuentes" / "conagua" / "MunicipiosSequia.xlsx").write_bytes(datos)


def main(anio):
    try:
        descargar_sequia()
    except Exception as e:
        print(f"  ⚠ no se pudo actualizar el Monitor de Sequía: {e}")
    pasos = [
        ("scripts/procesar_comercio.py", anio), ("scripts/procesar_sniim.py", anio),
        ("scripts/descargar_ams.py", anio), ("scripts/procesar_ams.py", anio),
        ("scripts/procesar_competencia.py", anio), ("scripts/procesar_precios_ue.py", anio),
        ("scripts/procesar_sequia.py", anio), ("scripts/procesar_avance_siap.py", anio),
    ]
    resultados = [(p, correr(p, a)) for p, a in pasos]
    print("\nResumen:")
    for p, ok in resultados:
        print(f"  {'✓' if ok else '✗'} {p}")
    print("\nPendientes manuales (fuentes sin descarga automática):")
    for nombre, como in MANUALES:
        print(f"  · {nombre}: {como}")
    print("\nDespués: revisar en http://localhost:8080 y publicar con scripts/publicar_web.py (con autorización).")


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else date.today().year - 1)

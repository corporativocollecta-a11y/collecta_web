"""
Series de 10 años por estado (SIAP, cierre de la producción agrícola municipal) para la comparación lado a lado.

Descarga los cierres que falten en data/fuentes/siap_historia/ (datos abiertos de la DGSIAP, un CSV por año;
2024 y 2025 se toman de data/fuentes/ si ya están ahí) y suma por producto y estado las toneladas y las hectáreas
cosechadas, con los mismos cultivos del SIAP que usa el mapa (procesar_siap.CULTIVOS).

Uso:
  python scripts/procesar_historia_estados.py [primer año=2016] [último año=2025]

Salida: data/historia_estados.js → window.HISTORIA_ESTADOS (carga diferida desde js/comparar.js)
  anios: [...], productos: {clave: {estado: [[t por año], [ha cosechadas por año]]}} (null = el cierre de ese año no trae el cultivo)
Solo usa la biblioteca estándar de Python.
"""
import csv
import json
import shutil
import subprocess
import sys
import time
import urllib.request
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from procesar_siap import CULTIVOS, abrir_csv, columna, normalizar, numero, parte_amarillo  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
CARPETA = RAIZ / "data" / "fuentes" / "siap_historia"
URL = "https://nube.agricultura.gob.mx/index.php?view=10AE434F-A2158368-A120BC5A-EDF4AFAA&ANIO={anio}"


def archivo(anio):
    """CSV del año: el de data/fuentes si existe; si no, se descarga a data/fuentes/siap_historia/."""
    propio = RAIZ / "data" / "fuentes" / f"Cierre_agricola_mun_{anio}.csv"
    if propio.exists():
        return propio
    destino = CARPETA / f"Cierre_agricola_mun_{anio}.csv"
    if destino.exists() and destino.stat().st_size > 1_000_000:
        return destino
    CARPETA.mkdir(parents=True, exist_ok=True)
    print(f"  descargando {anio}…", flush=True)
    # El servidor de la DGSIAP corta a veces la conexión: curl (con reintentos) si está instalado; si no, urllib
    if shutil.which("curl"):
        subprocess.run(["curl", "-sS", "-L", "--retry", "5", "--retry-delay", "3", "--max-time", "300", "-A", "Mozilla/5.0",
                        "-o", str(destino), URL.format(anio=anio)], check=True)
        datos = destino.read_bytes()
    else:
        req = urllib.request.Request(URL.format(anio=anio), headers={"User-Agent": "Mozilla/5.0 (mapa agroalimentario Collecta)"})
        with urllib.request.urlopen(req, timeout=300) as r:
            datos = r.read()
    if len(datos) < 1_000_000 or b"," not in datos[:2000]:
        raise RuntimeError(f"La descarga de {anio} no parece un CSV del SIAP ({len(datos)} bytes)")
    destino.write_bytes(datos)
    time.sleep(1)
    return destino


def leer(ruta):
    """{clave: {estado: [t, ha cosechadas]}} de un cierre municipal."""
    buscar = {nombre: clave for clave, nombres in CULTIVOS.items() for nombre in nombres}
    suma = defaultdict(lambda: defaultdict(lambda: [0.0, 0.0]))
    with abrir_csv(ruta) as f:
        lector = csv.DictReader(f)
        h = lector.fieldnames
        c_edo, c_cult = columna(h, "idestado"), columna(h, "nomcultivo", "nomcultivo sin um")   # hasta 2017: "Nomcultivo Sin Um"
        c_vol, c_unidad = columna(h, "volumenproduccion", "volumen"), columna(h, "nomunidad", "unidad")
        c_ha = columna(h, "cosechada")
        for fila in lector:
            clave = buscar.get(normalizar(fila[c_cult]))
            if not clave or "tonelada" not in normalizar(fila[c_unidad]):
                continue
            vol = numero(fila[c_vol])
            if vol is None:
                continue
            e = suma[clave][str(fila[c_edo]).zfill(2)]
            e[0] += vol
            e[1] += numero(fila[c_ha]) or 0
    return suma


def main(desde=2016, hasta=2025):
    anios = list(range(desde, hasta + 1))
    por_anio = {}
    for a in anios:
        por_anio[a] = leer(archivo(a))
        print(f"  {a}: {len(por_anio[a])} productos, jitomate {sum(v[0] for v in por_anio[a].get('jitomate', {}).values()):,.0f} t", flush=True)
    productos = {}
    for clave in CULTIVOS:
        estados = sorted({e for a in anios for e in por_anio[a].get(clave, {})})
        # Años en que el cierre no trae el cultivo en ningún estado (p. ej. arándano en 2020 y 2021): sin dato, no cero
        sin_dato = {a for a in anios if not por_anio[a].get(clave)}
        if sin_dato:
            print(f"  {clave}: sin registro en {sorted(sin_dato)} (se deja vacío)")
        valor = lambda a, e, i: None if a in sin_dato else round(por_anio[a].get(clave, {}).get(e, [0, 0])[i])
        productos[clave] = {
            e: [[valor(a, e, 0) for a in anios], [valor(a, e, 1) for a in anios]]
            for e in estados if any(por_anio[a].get(clave, {}).get(e, [0, 0])[0] > 0 for a in anios)
        }
    # Maíz grano por color: los cierres no lo separan; se usa la parte amarilla de cada estado del avance más reciente
    # (aproximación: el reparto entre colores cambia poco de un año a otro)
    if "maiz" in productos:
        m = productos.pop("maiz")
        parte, _ = parte_amarillo(m)
        for clave, f in (("maiz_amarillo", lambda e: parte[e]), ("maiz_blanco", lambda e: 1 - parte[e])):
            productos[clave] = {e: [[None if x is None else round(x * f(e)) for x in serie] for serie in v] for e, v in m.items()}
    destino = RAIZ / "data" / "historia_estados.js"
    destino.write_text(
        f"// Generado por scripts/procesar_historia_estados.py — SIAP, cierre agrícola municipal {desde}–{hasta}, sumado por estado\n"
        "// {anios, productos: {clave: {estado: [[toneladas por año], [hectáreas cosechadas por año]]}}}\n"
        f"window.HISTORIA_ESTADOS = {json.dumps({'anios': anios, 'fuente': 'SIAP', 'productos': productos}, separators=(',', ':'))};\n",
        encoding="utf-8",
    )
    print(f"-> {destino} ({destino.stat().st_size / 1e3:.0f} kB)")
    # Producción nacional del año anterior con la MISMA fuente (cierre SIAP), para el "la producción pasó de… a…" del
    # balance: compararla con la del Panorama (otra publicación y otra definición, p. ej. chile 3.22 Mt) exageraba caídas
    ant = hasta - 1
    nac = {k: sum(por_anio[ant].get(k, {}).get(e, [0, 0])[0] for e in por_anio[ant].get(k, {})) for k in CULTIVOS if por_anio[ant].get(k)}
    if "maiz" in nac:
        parte, _ = parte_amarillo(por_anio[ant]["maiz"])
        am = sum(v[0] * parte[e] for e, v in por_anio[ant]["maiz"].items())
        nac["maiz_amarillo"], nac["maiz_blanco"] = am, nac.pop("maiz") - am
    destino2 = RAIZ / "data" / "produccion_anterior.js"
    destino2.write_text(
        f"// Generado por scripts/procesar_historia_estados.py — producción nacional SIAP (cierre agrícola) de {ant}, en toneladas\n"
        f"window.PRODUCCION_ANTERIOR = {json.dumps({'anio': ant, 'productos': {k: round(v) for k, v in nac.items()}}, separators=(',', ':'))};\n",
        encoding="utf-8")
    print(f"-> {destino2}")


if __name__ == "__main__":
    args = [int(x) for x in sys.argv[1:]]
    main(*args)

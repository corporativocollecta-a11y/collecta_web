"""
Cosecha mensual por estado (SIAP, Avance de Siembras y Cosechas, https://nube.agricultura.gob.mx/avance_agricola/).
La página responde a una llamada xajax "reporte" con la situación acumulada al cierre de un mes (ciclo OI+PV y perennes,
riego + temporal, todas las entidades): superficie sembrada, cosechada y siniestrada, y producción por estado.
Cosecha del mes = acumulado del mes − acumulado del mes anterior. Sirve para repartir por temporada lo que cruza a EE. UU.
(js/embarques.js) y, más adelante, como indicador adelantado (superficie sembrada contra el año anterior).

Uso:
  python scripts/procesar_avance_siap.py [año=2025] [último mes=12]
Salida: data/avance_siap.js → window.AVANCE_SIAP = {anio, meses, productos: {clave: {estado: [t por mes]}},
  sembrada: {clave: {estado: ha sembradas al último mes}}}
Respuestas crudas en data/fuentes/siap_avance/ (no se vuelven a pedir).
"""
import html
import json
import re
import subprocess
import sys
import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CARPETA = RAIZ / "data" / "fuentes" / "siap_avance"
URL = "https://nube.agricultura.gob.mx/avance_agricola/"
# producto del mapa → id de cultivo en el avance del SIAP (unidad 200201 = tonelada)
CULTIVOS = {
    "jitomate": 389, "chile": 89, "aguacate": 7, "pepino": 289, "limon": 212, "fresa": 150, "frambuesa": 149,
    "zarzamora": 420, "brocoli": 57, "calabacita": 63, "cebolla": 78, "mango": 230, "papaya": 285, "melon": 241,
    "sandia": 326, "uva": 401, "esparrago": 132, "lechuga": 206, "berenjena": 53, "tomate_verde": 390, "coliflor": 105,
    "naranja": 259, "platano": 304, "pina": 296, "zanahoria": 416, "nopal": 268, "guayaba": 175, "papa": 283,
    # granos y leguminosas; el maíz grano se pide por variedad (440 blanco, 438 amarillo; el resto —azul, pozolero, de color,
    # sin clasificar— es menos de 1% y no se separa)
    "maiz_blanco": (225, 440), "maiz_amarillo": (225, 438), "frijol": 152, "trigo": 395, "sorgo": 374, "arroz": 36,
    "soya": 375, "cebada": 77, "garbanzo": 159,
}


def norm(t):
    return unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower().strip()


def consulta(cultivo, anio, mes):
    """cultivo = id del SIAP o (id, variedad)."""
    cultivo, variedad = cultivo if isinstance(cultivo, tuple) else (cultivo, "--")
    ruta = CARPETA / (f"{cultivo}_{anio}_{mes:02d}.html" if variedad == "--" else f"{cultivo}v{variedad}_{anio}_{mes:02d}.html")
    if ruta.exists() and ruta.stat().st_size > 2000:
        return ruta.read_bytes().decode("latin-1")
    args = [1, anio, 5, 3, 0, "--", "--", cultivo, 200201, variedad, 2, 0, 0, 0, mes]
    cmd = ["curl", "-sS", "--retry", "4", "--retry-delay", "3", "--max-time", "120", "-A", "Mozilla/5.0", "-X", "POST", URL,
           "--data-urlencode", "xajax=reporte", "--data-urlencode", "xajaxr=1"]
    for a in args:
        cmd += ["--data-urlencode", f"xajaxargs[]={a}"]
    datos = subprocess.run(cmd, capture_output=True, check=True).stdout
    ruta.parent.mkdir(parents=True, exist_ok=True)   # en GitHub Actions la carpeta no existe la primera vez
    ruta.write_bytes(datos)
    time.sleep(0.5)
    return datos.decode("latin-1")


def tabla(texto):
    """{estado normalizado: (sembrada, cosechada, producción)} de la respuesta."""
    t = html.unescape(re.sub(r"<!\[CDATA\[|\]\]>", "", texto))
    celdas = [re.sub(r"\s+", " ", c).strip() for c in re.findall(r"<td[^>]*>(.*?)</td>", t, flags=re.S)]
    celdas = [re.sub(r"<[^>]+>", "", c) for c in celdas]
    fuera = {}
    for i, c in enumerate(celdas):
        if re.fullmatch(r"\d+", c) and i + 5 < len(celdas) and not re.fullmatch(r"[\d,.]+", celdas[i + 1]):
            try:
                nums = [float(celdas[i + j].replace(",", "")) for j in (2, 3, 5)]
            except ValueError:
                continue
            fuera[norm(celdas[i + 1])] = tuple(nums)
    return fuera


def main(anio=2025, ultimo=12):
    CARPETA.mkdir(parents=True, exist_ok=True)
    tareas = [(k, c, m) for k, c in CULTIVOS.items() for m in range(1, ultimo + 1)]
    with ThreadPoolExecutor(max_workers=3) as ex:
        res = dict(zip(tareas, ex.map(lambda t: tabla(consulta(t[1], anio, t[2])), tareas)))
    return res


def escribir(anio=2025, ultimo=12):
    res = main(anio, ultimo)
    texto = (RAIZ / "data" / "estados.js").read_text(encoding="utf-8")
    ids = {norm(n): i for i, n in re.findall(r'id:\s*"(\d{2})"[^}]*?nombre:\s*"([^"]+)"', texto)}
    ids.setdefault("mexico", ids.get("estado de mexico", "15"))
    ids.setdefault("ciudad de mexico", "09")
    ids.setdefault("coahuila", ids.get("coahuila de zaragoza", "05"))
    ids.setdefault("michoacan", ids.get("michoacan de ocampo", "16"))
    ids.setdefault("veracruz", ids.get("veracruz de ignacio de la llave", "30"))
    productos, sembrada, sin = {}, {}, set()
    for k in CULTIVOS:
        acum = {}
        for m in range(1, ultimo + 1):
            for e, (sem, cos, prod) in res[(k, CULTIVOS[k], m)].items():
                i = ids.get(e)
                if not i:
                    sin.add(e)
                    continue
                acum.setdefault(i, [0.0] * ultimo)[m - 1] = prod
                if m == ultimo:
                    sembrada.setdefault(k, {})[i] = round(sem)
        # El año agrícola arranca cuando el acumulado nacional se reinicia (en 2025, en abril): los meses anteriores
        # repiten el cierre del año previo. El primer acumulado nuevo cubre enero a ese mes y se reparte parejo.
        nac = [sum(v[m] for v in acum.values()) for m in range(ultimo)]
        inicio = next((m for m in range(1, ultimo) if nac[m] < nac[m - 1] * 0.8), 0)
        productos[k] = {}
        for i, v in acum.items():
            mensual = [0.0] * ultimo
            for m in range(inicio + 1):
                mensual[m] = v[inicio] / (inicio + 1)
            for m in range(inicio + 1, ultimo):
                mensual[m] = max(0, v[m] - v[m - 1])
            if max(mensual) > 0:
                productos[k][i] = [round(x) for x in mensual]
        if inicio:
            print(f"  {k}: el año agrícola arranca en el mes {inicio + 1}; enero a ese mes se reparten parejo")
    salida = {"anio": anio, "meses": ultimo, "fuente": "SIAP, Avance de Siembras y Cosechas", "productos": productos, "sembrada": sembrada}
    destino = RAIZ / "data" / "avance_siap.js"
    destino.write_text("// Generado por scripts/procesar_avance_siap.py — SIAP, avance mensual de siembras y cosechas (cosecha del mes por estado)\n"
                       f"window.AVANCE_SIAP = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    tot = sum(sum(v) for v in productos.get("jitomate", {}).values())
    print(f"{anio}: {len(productos)} productos, jitomate {tot:,.0f} t en {ultimo} meses -> {destino} ({destino.stat().st_size / 1e3:.0f} kB)")
    if sin:
        print("Entidades sin id:", sorted(sin))


if __name__ == "__main__":
    a = [int(x) for x in sys.argv[1:]]
    escribir(*a)

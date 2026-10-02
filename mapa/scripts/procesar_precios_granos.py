"""
Precio internacional mensual de los granos (Banco Mundial, Commodity Price Data "Pink Sheet", mensual) en US$/t y en
pesos por kg con el tipo de cambio de la Reserva Federal (FRED DEXMXUS, promedio del mes). Sirve para comparar el precio
de referencia de la importación con el precio de mayoreo (SNIIM) y el precio al productor (SIAP).

Series (Pink Sheet, hoja "Monthly Prices"):
  maíz (blanco y amarillo) → Maize, EE. UU. No. 2 amarillo, FOB Golfo de México
  trigo → Wheat, US HRW (rojo duro de invierno, el que más importa México) · sorgo → Sorghum, EE. UU. No. 2 milo amarillo
  arroz → Rice, Thai 5% (arroz blanco pulido) · soya → Soybeans · cebada → Barley
Frijol y garbanzo no tienen precio internacional de referencia en el Pink Sheet.

El enlace del archivo cambia cada mes: se toma de https://www.worldbank.org/en/research/commodity-markets.
Uso: python scripts/procesar_precios_granos.py
Salida: data/precios_granos.js → window.PRECIOS_GRANOS. Solo biblioteca estándar.
"""
import csv
import io
import json
import re
import subprocess
import time
import urllib.request
import zipfile
from collections import defaultdict
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CARPETA = RAIZ / "data" / "fuentes" / "bancomundial"
XLSX = CARPETA / "pinksheet.xlsx"
PAGINA = "https://www.worldbank.org/en/research/commodity-markets"
DESTINO = RAIZ / "data" / "precios_granos.js"
SERIES = {"maiz": "Maize", "trigo": "Wheat, US HRW", "arroz": "Rice, Thai 5%", "soya": "Soybeans"}
# El Pink Sheet dejó de publicar sorgo y cebada en agosto de 2020: la cebada sale del FMI (FRED PBARLUSDM); para el sorgo no
# hay serie vigente y se usa el maíz como referencia (el sorgo forrajero se cotiza cerca del maíz amarillo).
SERIES_FRED = {"cebada": "PBARLUSDM"}
PRODUCTOS = {"maiz_blanco": "maiz", "maiz_amarillo": "maiz", "trigo": "trigo", "sorgo": "maiz", "arroz": "arroz", "soya": "soya",
             "cebada": "cebada"}
DESDE = 2015


def curl(url, destino=None):
    args = ["curl", "-sS", "-L", "--retry", "4", "--retry-delay", "5", "--max-time", "300", "-A", "Mozilla/5.0", url]
    if destino:
        args += ["-o", str(destino)]
    return subprocess.run(args, capture_output=True, check=True).stdout


def descargar():
    CARPETA.mkdir(parents=True, exist_ok=True)
    if XLSX.exists() and time.time() - XLSX.stat().st_mtime < 5 * 86400:
        return
    try:
        url = re.search(rb'https://thedocs\.worldbank\.org/[^"]*CMO-Historical-Data-Monthly\.xlsx', curl(PAGINA)).group(0).decode()
        curl(url, XLSX)
    except Exception as e:   # noqa: BLE001 — sin red se usa el archivo anterior
        if not XLSX.exists():
            raise
        print(f"  Banco Mundial sin respuesta ({e}); se usa el archivo anterior")


def leer_hoja(nombre_hoja):
    """Filas de la hoja como listas de texto (xlsx = zip con XML; sin bibliotecas externas)."""
    z = zipfile.ZipFile(XLSX)
    wb = z.read("xl/workbook.xml").decode("utf-8")
    hojas = re.findall(r'<sheet [^>]*name="([^"]+)"[^>]*r:id="([^"]+)"', wb)
    rels = dict(re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"', z.read("xl/_rels/workbook.xml.rels").decode("utf-8")))
    destino = "xl/" + rels[dict(hojas)[nombre_hoja]].lstrip("/").replace("xl/", "")
    comunes = [re.sub(r"<[^>]+>", "", s) for s in re.findall(r"<si>(.*?)</si>", z.read("xl/sharedStrings.xml").decode("utf-8"), re.S)]
    filas = []
    for fila in re.findall(r"<row[^>]*>(.*?)</row>", z.read(destino).decode("utf-8"), re.S):
        celdas = {}
        for ref, tipo, v in re.findall(r'<c r="([A-Z]+)\d+"([^>]*)>(?:<f>.*?</f>)?<v>([^<]*)</v>', fila, re.S):
            celdas[ref] = comunes[int(v)] if 't="s"' in tipo else v
        filas.append(celdas)
    return filas


def tipo_cambio():
    """{AAAA-MM: pesos por dólar} (promedio mensual de DEXMXUS)."""
    ruta = CARPETA / "fred_dexmxus_mensual.csv"
    if not ruta.exists() or time.time() - ruta.stat().st_mtime > 5 * 86400:
        try:
            ruta.write_bytes(urllib.request.urlopen(
                f"https://fred.stlouisfed.org/graph/fredgraph.csv?id=DEXMXUS&cosd={DESDE}-01-01&coed={date.today().isoformat()}", timeout=120).read())
        except Exception as e:   # noqa: BLE001
            if not ruta.exists():
                raise
            print(f"  FRED sin respuesta ({e}); se usa el archivo anterior")
    meses = defaultdict(list)
    for r in list(csv.reader(io.StringIO(ruta.read_text(encoding="utf-8"))))[1:]:
        if r[1] not in ("", "."):
            meses[r[0][:7]].append(float(r[1]))
    return {m: round(sum(v) / len(v), 4) for m, v in meses.items()}


def main():
    descargar()
    filas = leer_hoja("Monthly Prices")
    # encabezado: la fila que contiene "Maize"; unidades en la siguiente
    i = next(n for n, f in enumerate(filas) if "Maize" in f.values())
    cab = {v.strip(): c for c, v in filas[i].items()}
    unidades = filas[i + 1]
    columnas = {}
    for k, nombre in SERIES.items():
        c = cab.get(nombre) or next((col for txt, col in cab.items() if txt.startswith(nombre)), None)
        if not c:
            print(f"  sin columna para {nombre}")
            continue
        columnas[k] = c
        print(f"  {k:7s} ← {nombre} ({unidades.get(c, '').strip()})")
    tc = tipo_cambio()
    serie = defaultdict(list)
    for f in filas[i + 2:]:
        m = re.fullmatch(r"(\d{4})M(\d{2})", (f.get("A") or "").strip())
        if not m or int(m.group(1)) < DESDE:
            continue
        mes = f"{m.group(1)}-{m.group(2)}"
        for k, c in columnas.items():
            try:
                serie[k].append([mes, round(float(f[c]), 1)])
            except (KeyError, ValueError):
                pass
    for k, codigo in SERIES_FRED.items():
        try:
            t = urllib.request.urlopen(f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={codigo}&cosd={DESDE}-01-01", timeout=120).read().decode()
            (CARPETA / f"fred_{codigo}.csv").write_text(t, encoding="utf-8")
        except Exception as e:   # noqa: BLE001
            ruta = CARPETA / f"fred_{codigo}.csv"
            if not ruta.exists():
                print(f"  {k}: FRED sin respuesta ({e})")
                continue
            t = ruta.read_text(encoding="utf-8")
        serie[k] = [[r[0][:7], round(float(r[1]), 1)] for r in list(csv.reader(io.StringIO(t)))[1:] if r[1] not in ("", ".")]
        print(f"  {k:7s} ← FMI vía FRED {codigo}")
    ultimo = max(s[-1][0] for s in serie.values())
    salida = {"generado": date.today().isoformat(), "ultimo": ultimo,
              "fuente": "Banco Mundial, Commodity Price Data (Pink Sheet), mensual; tipo de cambio: Reserva Federal (DEXMXUS)",
              "referencias": {"maiz": "maíz amarillo EE. UU. No. 2, FOB Golfo", "trigo": "trigo rojo duro de invierno (HRW) EE. UU., FOB Golfo",
                              "arroz": "arroz blanco tailandés 5% quebrado, FOB Bangkok",
                              "soya": "soya, CIF Rotterdam", "cebada": "cebada (FMI)"},
              "notas": {"sorgo": "Sin precio internacional vigente de sorgo (el Banco Mundial lo dejó de publicar en 2020): se muestra el del maíz amarillo, al que suele seguir de cerca."},
              "productos": PRODUCTOS, "series": serie, "tc": {m: v for m, v in tc.items() if m >= f"{DESDE}-01"}}
    DESTINO.write_text("// Generado por scripts/procesar_precios_granos.py — precio internacional de los granos (Banco Mundial), US$/t\n"
                       f"window.PRECIOS_GRANOS = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    for k, s in serie.items():
        u = s[-1]
        print(f"  {k:7s} {u[0]}: US${u[1]:,.0f}/t = ${u[1] * tc.get(u[0], list(tc.values())[-1]) / 1000:.2f}/kg")
    print(f"-> {DESTINO} ({DESTINO.stat().st_size // 1024} kB)")


if __name__ == "__main__":
    main()

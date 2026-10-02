"""
Balance de granos de México y del mundo con proyección (USDA FAS, Production, Supply and Distribution, PSD Online):
producción, importación, exportación, consumo (y su parte forrajera) e inventario final por año comercial, desde 2016/17
hasta el ciclo proyectado más reciente (el del último reporte WASDE). Es la referencia internacional para saber si viene
más o menos grano y cómo quedan los inventarios mundiales (relación inventario/consumo).

Fuente (sin clave): https://apps.fas.usda.gov/psdonline/downloads/psd_grains_pulses_csv.zip y psd_oilseeds_csv.zip
(data/fuentes/psd/). Unidades: miles de toneladas; el arroz en arroz pulido (milled).
Productos: maíz (Corn; el USDA no separa colores), trigo (Wheat), sorgo (Sorghum), cebada (Barley), arroz (Rice, Milled),
soya (Oilseed, Soybean). Frijol y garbanzo no están en el PSD.

Uso: python scripts/procesar_psd.py
Salida: data/psd_granos.js → window.PSD_GRANOS. Solo biblioteca estándar.
"""
import csv
import io
import json
import subprocess
import time
import zipfile
from collections import defaultdict
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CARPETA = RAIZ / "data" / "fuentes" / "psd"
ARCHIVOS = ("psd_grains_pulses_csv.zip", "psd_oilseeds_csv.zip")
DESTINO = RAIZ / "data" / "psd_granos.js"
COMMODITY = {"Corn": "maiz", "Wheat": "trigo", "Sorghum": "sorgo", "Barley": "cebada", "Rice, Milled": "arroz", "Oilseed, Soybean": "soya"}
ATRIBUTOS = {"Production": "produccion", "Imports": "importacion", "Exports": "exportacion", "Domestic Consumption": "consumo",
             "Feed Dom. Consumption": "forraje", "Ending Stocks": "inventario", "Crush": "molienda"}
DESDE = 2016


def descargar():
    CARPETA.mkdir(parents=True, exist_ok=True)
    for f in ARCHIVOS:
        ruta = CARPETA / f
        if ruta.exists() and time.time() - ruta.stat().st_mtime < 5 * 86400:
            continue
        try:
            subprocess.run(["curl", "-sS", "-L", "--retry", "4", "--max-time", "600", "-A", "Mozilla/5.0", "-o", str(ruta),
                            f"https://apps.fas.usda.gov/psdonline/downloads/{f}"], check=True)
            zipfile.ZipFile(ruta).testzip()
        except Exception as e:   # noqa: BLE001 — sin red se usa el archivo anterior
            if not ruta.exists():
                raise
            print(f"  {f}: sin respuesta ({e}); se usa el archivo anterior")


def main():
    descargar()
    # {k: {país: {año: {atributo: valor}}}}
    datos = defaultdict(lambda: defaultdict(lambda: defaultdict(dict)))
    nombres = {}
    for f in ARCHIVOS:
        z = zipfile.ZipFile(CARPETA / f)
        for r in csv.DictReader(io.TextIOWrapper(z.open(z.namelist()[0]), encoding="utf-8-sig")):
            k, a = COMMODITY.get(r["Commodity_Description"]), ATRIBUTOS.get(r["Attribute_Description"])
            if not k or not a or int(r["Market_Year"]) < DESDE:
                continue
            datos[k][r["Country_Code"]][int(r["Market_Year"])][a] = float(r["Value"] or 0)
            nombres[r["Country_Code"]] = r["Country_Name"]
    salida = {}
    for k, paises in datos.items():
        anios = sorted({y for p in paises.values() for y in p})
        mundo = {y: {a: round(sum(p.get(y, {}).get(a, 0) for p in paises.values())) for a in ATRIBUTOS.values()} for y in anios}
        mx = paises.get("MX", {})
        ultimo = anios[-1]
        # principales importadores y exportadores del último ciclo
        top = lambda a: [[nombres[c], round(p[ultimo].get(a, 0))] for c, p in sorted(paises.items(), key=lambda kv: -kv[1].get(ultimo, {}).get(a, 0))[:6]
                         if p.get(ultimo, {}).get(a, 0) > 0]
        salida[k] = {
            "anios": [f"{y}/{str(y + 1)[2:]}" for y in anios],
            "mexico": {a: [round(mx.get(y, {}).get(a, 0)) for y in anios] for a in ATRIBUTOS.values() if any(mx.get(y, {}).get(a) for y in anios)},
            "mundo": {a: [mundo[y][a] for y in anios] for a in ATRIBUTOS.values() if any(mundo[y][a] for y in anios)},
            "importadores": top("importacion"), "exportadores": top("exportacion"),
            "lugarMexicoImportacion": next((i + 1 for i, (c, p) in enumerate(sorted(paises.items(), key=lambda kv: -kv[1].get(ultimo, {}).get("importacion", 0))) if c == "MX"), None),
        }
        m, w = salida[k]["mexico"], salida[k]["mundo"]
        print(f"  {k:7s} {salida[k]['anios'][-1]}: México prod {m.get('produccion', [0])[-1]:>7,} imp {m.get('importacion', [0])[-1]:>7,} "
              f"consumo {m.get('consumo', [0])[-1]:>7,} · mundo inventario/consumo {w['inventario'][-1] / w['consumo'][-1]:.0%} · "
              f"México {salida[k]['lugarMexicoImportacion']}.º importador")
    DESTINO.write_text("// Generado por scripts/procesar_psd.py — USDA FAS PSD, balance de granos de México y del mundo (miles de t)\n"
                       f"window.PSD_GRANOS = {json.dumps({'generado': date.today().isoformat(), 'fuente': 'USDA FAS, PSD Online', 'productos': salida}, ensure_ascii=False, separators=(',', ':'))};\n",
                       encoding="utf-8")
    print(f"-> {DESTINO} ({DESTINO.stat().st_size // 1024} kB)")


if __name__ == "__main__":
    main()

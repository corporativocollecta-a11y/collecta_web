"""
Precio al productor en EE. UU.: precio recibido por el agricultor, mercado fresco, promedio nacional del año comercial
(USDA NASS, "PRICE RECEIVED"), convertido a US$/kg; serie desde 2019. Primer eslabón de la cadena de precios de EE. UU.
(js/graficos.js, "De la granja al supermercado").

Requiere data/fuentes/usda/nass_frutas_hortalizas.tsv (scripts/filtrar_nass.py; ya conserva PRICE RECEIVED).
Cítricos fuera: NASS los da por caja (naranja, toronja, limón) con pesos distintos por estado y variedad.
Salida: data/productor_eua.js → window.PRODUCTOR_EUA = {anio, productos: {clave: {precio, anio, serie: {año: US$/kg}, serieNASS}}}

Uso:
  python scripts/procesar_productor_eua.py
"""
import csv
import datetime
import json
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
KG = {"$ / CWT": 45.359237, "$ / LB": 0.45359237, "$ / TON": 907.18474}
SERIES = {
    "jitomate": "TOMATOES", "chile": "PEPPERS, BELL", "aguacate": "AVOCADOS", "brocoli": "BROCCOLI",
    "coliflor": "CAULIFLOWER", "fresa": "STRAWBERRIES", "pepino": "CUCUMBERS", "manzana": "APPLES",
    "calabacita": "SQUASH", "zanahoria": "CARROTS", "lechuga": "LETTUCE, HEAD", "uva": "GRAPES", "pera": "PEARS",
    "durazno": "PEACHES", "arandano": "BLUEBERRIES, TAME", "frambuesa": "RASPBERRIES", "esparrago": "ASPARAGUS",
    "sandia": "MELONS, WATERMELON", "melon": "MELONS, CANTALOUP", "papa": "POTATOES", "cebolla": "ONIONS, DRY",
    "elote": "SWEET CORN", "col": "CABBAGE", "ejote": "BEANS, SNAP", "espinaca": "SPINACH", "calabaza": "PUMPKINS",
    "alcachofa": "ARTICHOKES",
}


def main():
    serie = defaultdict(dict)
    with open(RAIZ / "data" / "fuentes" / "usda" / "nass_frutas_hortalizas.tsv", encoding="utf-8") as f:
        for r in csv.DictReader(f, delimiter="\t"):
            if (r["STATISTICCAT_DESC"] != "PRICE RECEIVED" or r["AGG_LEVEL_DESC"] != "NATIONAL"
                    or r["REFERENCE_PERIOD_DESC"] != "MARKETING YEAR"):
                continue
            for k, c in SERIES.items():
                if r["SHORT_DESC"].startswith(f"{c}, FRESH MARKET - PRICE RECEIVED, MEASURED IN ") and r["UNIT_DESC"] in KG:
                    try:
                        v = float(r["VALUE"].replace(",", ""))
                    except ValueError:
                        continue   # (D) confidencial
                    serie[k][int(r["YEAR"])] = round(v / KG[r["UNIT_DESC"]], 3)
    productos = {}
    for k, s in serie.items():
        a = max(s)
        productos[k] = {"precio": s[a], "anio": a, "serie": dict(sorted(s.items())), "serieNASS": SERIES[k]}
        print(f"  {k:11s} {a} US${s[a]:.2f}/kg  ({len(s)} años)")
    salida = {"generado": datetime.date.today().isoformat(), "anio": max(p["anio"] for p in productos.values()),
              "fuente": "USDA NASS, precio recibido por el productor, mercado fresco, año comercial", "productos": productos}
    destino = RAIZ / "data" / "productor_eua.js"
    destino.write_text("// Generado por scripts/procesar_productor_eua.py · USDA NASS, precio al productor en EE. UU.\n"
                       f"window.PRODUCTOR_EUA = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n",
                       encoding="utf-8")
    print(f"-> {destino} ({destino.stat().st_size / 1024:.0f} kB), {len(productos)} productos")


if __name__ == "__main__":
    main()

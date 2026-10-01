"""
Descarga precios diarios de USDA AMS Market News (API MARS v1.2) de un año:
  - Mercados terminales (mayoreo) activos: frutas (FV010), hortalizas (FV020), cebolla y papa (FV030).
  - Punto de embarque de Phoenix (2402 frutas, 2403 hortalizas), que cotiza el producto mexicano al cruzar por
    Nogales, McAllen y Otay Mesa (precio FOB en la frontera).
  - Embarques semanales por distrito (1662, National Shipping Point Trends): producción de EE. UU., cruces de México
    e importaciones por puerto; base del volumen en la frontera y del calendario comercial.
  - Tarifas de camión (2375, National Truck Rate Report): US$ por carga de cada distrito o cruce a cada ciudad.
Guarda por reporte y mes solo los campos que usa scripts/procesar_ams.py, en data/fuentes/usda/ams/.

Requiere la clave en .env: USDA_AMS_API_KEY=... (mymarketnews.ams.usda.gov; HTTP Basic con la clave como usuario).

Uso:
  python scripts/descargar_ams.py [año=2025]
"""
import base64
import gzip
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "data" / "fuentes" / "usda" / "ams"
BASE = "https://marsapi.ams.usda.gov/services/v1.2/reports/"

# Mercados terminales activos → (códigos de reporte frutas, hortalizas, cebolla/papa)
TERMINALES = {
    "Atlanta": (2277, 2278, 2279), "Baltimore": (2281, 2282, 2283), "Boston": (2285, 2286, 2287),
    "Chicago": (2290, 2291, 2292), "Columbia": (2294, 2295, 2296), "Detroit": (2302, 2303, 2304),
    "Los Angeles": (2306, 2307, 2308), "Miami": (2310, 2311, 2312), "New York": (2314, 2315, 2316),
    "Philadelphia": (2318, 2319, 2320), "Asheville": (3913, 3914, 3915),
}
FRONTERA = (2402, 2403)
VOLUMEN = 1662   # National Shipping Point Trends: embarques semanales por distrito (incluye los cruces de México)
FLETES = 2375    # National Truck Rate Report: tarifa por camión de cada distrito (y cruce de México) a cada ciudad
CAMPOS = ("report_date", "commodity", "variety", "package", "pkg", "var", "origin", "district", "organic", "item_size",
          "low_price", "high_price", "mostly_low_price", "mostly_high_price", "market_location_name",
          "report_begin_date", "shipment_type", "shipments_week1", "shipments_week2", "shipments_week3", "category",
          "report_Date", "destination_city", "truck_availability")


def clave():
    import os
    if os.environ.get("USDA_AMS_API_KEY"):   # en GitHub Actions viene como secreto
        return os.environ["USDA_AMS_API_KEY"].strip()
    t = (RAIZ / ".env").read_text(encoding="utf-8")
    return re.search(r"^USDA_AMS_API_KEY=(.+)$", t, re.M).group(1).strip()


def bajar(slug, anio, mes, auth):
    ruta = DESTINO / f"{slug}_{anio}-{mes:02d}.json.gz"
    if ruta.exists():
        return slug, mes, "ya estaba"
    fin = [31, 29 if anio % 4 == 0 else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes - 1]
    q = urllib.parse.quote(f"report_date={mes:02d}/01/{anio}:{mes:02d}/{fin}/{anio}")
    url = BASE + str(slug) + "/" + urllib.parse.quote("Report Details") + "?q=" + q
    for intento in range(4):
        try:
            req = urllib.request.Request(url, headers={"Authorization": auth})
            d = json.load(urllib.request.urlopen(req, timeout=300))
            filas = [{c: r.get(c) for c in CAMPOS} for r in d.get("results", [])]
            tmp = ruta.with_suffix(".tmp")   # escritura atómica: un corte no deja archivos a medias
            with gzip.open(tmp, "wt", encoding="utf-8") as f:
                json.dump(filas, f, separators=(",", ":"))
            tmp.replace(ruta)
            return slug, mes, len(filas)
        except Exception as e:  # MARS a veces corta ventanas largas: reintento con espera
            err = e
            time.sleep(5 * (intento + 1))
    return slug, mes, f"error: {err}"


def main(anio=2025):
    DESTINO.mkdir(parents=True, exist_ok=True)
    auth = "Basic " + base64.b64encode((clave() + ":").encode()).decode()
    slugs = [s for t in TERMINALES.values() for s in t] + list(FRONTERA) + [VOLUMEN, FLETES]
    tareas = [(s, m) for s in slugs for m in range(1, 13)]
    with ThreadPoolExecutor(max_workers=6) as ex:
        for slug, mes, n in ex.map(lambda t: bajar(t[0], anio, t[1], auth), tareas):
            if not isinstance(n, int) or n == 0:
                print(f"  {slug} {anio}-{mes:02d}: {n}")
    total = sum(1 for _ in DESTINO.glob(f"*_{anio}-*.json.gz"))
    print(f"-> {total} archivos en {DESTINO}")


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 2025)

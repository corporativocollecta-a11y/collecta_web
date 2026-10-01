"""
Historia de varios años de USDA AMS Market News para el mapa de embarques y el pronóstico semanal:
  - 1662 National Shipping Point Trends: embarques semanales por distrito de origen (EE. UU.), cruce de México y puerto.
  - 2402 / 2403 Phoenix: precio FOB del producto mexicano al cruzar (Nogales, McAllen, Otay Mesa).
  - Mercados terminales de Los Ángeles, Chicago y Nueva York (frutas y hortalizas): precio de mayoreo de referencia.
Reutiliza scripts/descargar_ams.py (misma clave, mismos campos, mismos archivos por reporte y mes); lo ya descargado
no se vuelve a pedir. El año en curso se descarga hasta el mes actual.

Uso:
  python scripts/descargar_historia_ams.py [primer año=2019] [último año=año actual]
"""
import base64
import datetime
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from descargar_ams import DESTINO, bajar, clave  # noqa: E402

REPORTES = [1662, 2402, 2403, 2306, 2307, 2290, 2291, 2314, 2315]


def main(desde=2019, hasta=None):
    hoy = datetime.date.today()
    hasta = hasta or hoy.year
    DESTINO.mkdir(parents=True, exist_ok=True)
    auth = "Basic " + base64.b64encode((clave() + ":").encode()).decode()
    for viejo in DESTINO.glob("*.parcial.json.gz"):   # el mes incompleto de la vez anterior se vuelve a pedir
        viejo.unlink()
    tareas = [(s, a, m) for a in range(desde, hasta + 1) for s in REPORTES for m in range(1, 13)
              if (a, m) <= (hoy.year, hoy.month)]
    errores = 0
    with ThreadPoolExecutor(max_workers=6) as ex:
        for slug, a, m, r in ex.map(lambda t: (t[0], t[1], t[2], bajar(t[0], t[1], t[2], auth)[2]), tareas):
            if isinstance(r, str) and r.startswith("error"):
                errores += 1
                print(f"  {slug} {a}-{m:02d}: {r}", flush=True)
    # El mes en curso se vuelve a pedir la próxima vez (todavía no está completo)
    for s in REPORTES:
        actual = DESTINO / f"{s}_{hoy.year}-{hoy.month:02d}.json.gz"
        if actual.exists():
            actual.rename(actual.with_name(actual.name.replace(".json.gz", ".parcial.json.gz")))
    print(f"Listo: {len(tareas)} archivos pedidos, {errores} con error -> {DESTINO}")


if __name__ == "__main__":
    args = [int(x) for x in sys.argv[1:]]
    main(*args)

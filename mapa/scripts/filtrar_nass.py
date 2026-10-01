"""
Etapa 1 de la vista Estados Unidos: filtra el archivo masivo de USDA NASS Quick Stats (cultivos).

Fuente: https://www.nass.usda.gov/datasets/  →  qs.crops_AAAAMMDD.txt.gz (≈1.1 GB comprimido, separado por tabuladores)
Guardar en data/fuentes/usda/. Se lee en flujo; no se descomprime a disco.

Conserva solo: encuestas (SURVEY), hortalizas y frutas/nueces, nivel estatal y nacional, producción y
superficie cosechada, desde 2019. Resultado: data/fuentes/usda/nass_frutas_hortalizas.tsv (pocos MB).

Uso:
  python scripts/filtrar_nass.py data/fuentes/usda/qs.crops_20260926.txt.gz
Solo usa la biblioteca estándar de Python.
"""
import gzip
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "data" / "fuentes" / "usda" / "nass_frutas_hortalizas.tsv"
GRUPOS = {"VEGETABLES", "FRUIT & TREE NUTS"}
ESTADISTICAS = {"PRODUCTION", "AREA HARVESTED", "PRICE RECEIVED"}
NIVELES = {"STATE", "NATIONAL"}


def main(ruta):
    n = conservadas = 0
    with gzip.open(ruta, "rt", encoding="latin-1", newline="") as f, open(SALIDA, "w", encoding="utf-8", newline="") as out:
        encabezado = f.readline()
        out.write(encabezado)
        h = encabezado.rstrip("\n").split("\t")
        i = {c: k for k, c in enumerate(h)}
        for linea in f:
            n += 1
            # filtro rápido por texto antes de separar columnas
            if not linea.startswith("SURVEY\tCROPS\t") or ("VEGETABLES" not in linea and "FRUIT & TREE NUTS" not in linea):
                continue
            c = linea.rstrip("\n").split("\t")
            if (c[i["GROUP_DESC"]] in GRUPOS and c[i["AGG_LEVEL_DESC"]] in NIVELES
                    and c[i["STATISTICCAT_DESC"]] in ESTADISTICAS and c[i["YEAR"]] >= "2019"
                    and c[i["FREQ_DESC"]] == "ANNUAL" and c[i["DOMAIN_DESC"]] == "TOTAL"):
                out.write(linea)
                conservadas += 1
    print(f"{n:,} líneas leídas · {conservadas:,} conservadas → {SALIDA.name} ({SALIDA.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])

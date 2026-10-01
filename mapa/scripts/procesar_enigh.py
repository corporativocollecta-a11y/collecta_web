"""
Demanda regional (paso 10): cuánto consume por persona cada estado frente al promedio nacional, con la ENIGH 2024 de
INEGI (nueva serie, datos abiertos). Sirve para repartir la demanda nacional entre estados según lo que de verdad se
come en cada uno, en lugar de suponer el mismo consumo por persona en todo el país.

Fuente: https://www.inegi.org.mx/contenidos/programas/enigh/nc/2024/datosabiertos/conjunto_de_datos_enigh2024_ns_csv.zip
(103 MB, se guarda en data/fuentes/enigh/). Tablas: gastoshogar (clave, cantidad en kg de la semana de referencia,
entidad, factor) y concentradohogar (tot_integ, factor) para la población.

Cálculo por producto y estado:
  kg/persona/año = 52 × Σ(cantidad × factor) / Σ(integrantes × factor)        (compras + autoconsumo + regalos)
  índice crudo   = kg/persona del estado / kg/persona nacional
  índice         = (h × crudo + K) / (h + K), con h = hogares de la muestra del estado que reportaron el producto y
                   K = 40: con pocos hogares el índice se acerca a 1 (no se exagera por ruido de muestra);
                   acotado a 0.4–2.5.
El mapa (js/modelo.js) multiplica la demanda de cada estado por su índice y reescala para que la demanda nacional
no cambie: solo cambia el reparto entre estados.

Salida: data/consumo_regional.js → window.CONSUMO_REGIONAL = {anio, fuente, productos: {clave: {nacional: kg/persona/año,
  indice: {id estado: índice}, hogares: n}}}
Uso: python scripts/procesar_enigh.py
"""
import csv
import io
import json
import subprocess
import zipfile
from collections import defaultdict
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ZIP = RAIZ / "data" / "fuentes" / "enigh" / "enigh2024_ns_csv.zip"
URL = "https://www.inegi.org.mx/contenidos/programas/enigh/nc/2024/datosabiertos/conjunto_de_datos_enigh2024_ns_csv.zip"
K = 40
# producto del mapa → claves de la ENIGH 2024 (catálogo gastos.csv)
CLAVES = {
    "aguacate": ["011611"], "guayaba": ["011612"], "mango": ["011613"], "papaya": ["011614"], "pina": ["011615"],
    "platano": ["011616"], "limon": ["011621"], "naranja": ["011622"], "toronja": ["011623"], "durazno": ["011632"],
    "manzana": ["011633"], "pera": ["011634"], "fresa": ["011641"], "melon": ["011651"], "sandia": ["011652"],
    "uva": ["011653"], "lechuga": ["011712"], "calabacita": ["011721"],
    "chile": ["011723", "011724", "011725", "011726"], "jitomate": ["011727"], "pepino": ["011728"],
    "tomate_verde": ["011729"], "cebolla": ["011743"], "nopal": ["011746"], "zanahoria": ["011748"], "papa": ["011751"],
    # "Otras bayas" agrupa zarzamora, frambuesa y arándano: se usa el mismo índice para los tres
    "zarzamora": ["011642"], "frambuesa": ["011642"], "arandano": ["011642"],
}


def tabla(z, parte):
    nombre = next(n for n in z.namelist() if f"conjunto_de_datos_{parte}_enigh2024_ns.csv" in n)
    return csv.DictReader(io.TextIOWrapper(z.open(nombre), encoding="utf-8", errors="replace"))


def main():
    if not ZIP.exists():
        ZIP.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["curl", "-sS", "-L", "--retry", "3", "--max-time", "1200", "-A", "Mozilla/5.0", "-o", str(ZIP), URL], check=True)
    z = zipfile.ZipFile(ZIP)
    pob = defaultdict(float)
    for r in tabla(z, "concentradohogar"):
        pob[r["ubica_geo"][:2]] += float(r["tot_integ"]) * float(r["factor"])
    por_clave = defaultdict(set)
    for k, cs in CLAVES.items():
        for c in cs:
            por_clave[c].add(k)
    kg = defaultdict(lambda: defaultdict(float))
    hogares = defaultdict(lambda: defaultdict(set))
    for r in tabla(z, "gastoshogar"):
        ks = por_clave.get(r["clave"])
        if not ks:
            continue
        try:
            q = float(r["cantidad"])
        except ValueError:
            continue
        if q <= 0:
            continue
        e = r["entidad"].zfill(2)
        for k in ks:
            kg[k][e] += q * float(r["factor"])
            hogares[k][e].add(r["folioviv"] + r["foliohog"])
    pob_nac = sum(pob.values())
    productos = {}
    for k in CLAVES:
        if not kg[k]:
            continue
        nac = 52 * sum(kg[k].values()) / pob_nac
        indice = {}
        for e in sorted(pob):
            crudo = (52 * kg[k].get(e, 0) / pob[e]) / nac if nac else 1
            h = len(hogares[k].get(e, ()))
            indice[e] = round(min(2.5, max(0.4, (h * crudo + K) / (h + K))), 3)
        productos[k] = {"nacional": round(nac, 2), "indice": indice, "hogares": sum(len(s) for s in hogares[k].values())}
    salida = {"anio": 2024, "generado": date.today().isoformat(),
              "fuente": "INEGI, Encuesta Nacional de Ingresos y Gastos de los Hogares (ENIGH) 2024, nueva serie", "productos": productos}
    destino = RAIZ / "data" / "consumo_regional.js"
    destino.write_text("// Generado por scripts/procesar_enigh.py — consumo por persona de cada estado frente al nacional (ENIGH 2024)\n"
                       f"window.CONSUMO_REGIONAL = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"{len(productos)} productos -> {destino} ({destino.stat().st_size / 1e3:.0f} kB)")
    for k, p in productos.items():
        ext = sorted(p["indice"].items(), key=lambda x: x[1])
        print(f"  {k:12s} {p['nacional']:6.1f} kg/persona/año en hogares · {p['hogares']:5d} hogares · menor {ext[0][0]} {ext[0][1]} · mayor {ext[-1][0]} {ext[-1][1]}")


if __name__ == "__main__":
    main()

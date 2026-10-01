"""
Vista Polonia: producción por voivodato del GUS (Bank Danych Lokalnych, API sin clave) y población del GUS.
Comercio con FAOSTAT mediante el motor común.

Fuentes (https://bdl.stat.gov.pl/api/v1, nivel 2 = voivodato):
  - Frutas por especie (jabłka, gruszki, wiśnie, czereśnie, truskawki, maliny, borówki): zbiory (cosecha, dt).
  - Papa (ziemniaki, variable 4369).
  - Población total (variable 72305).
El GUS no publica en el BDL las hortalizas por especie y voivodato (solo el total), por eso no se incluyen.
Se usa el año más reciente disponible en cada variable (2025 salvo que falte).

Uso:
  python scripts/procesar_gus.py
Salida: data/sub_pl.js → window.SUBNACIONAL.PL
"""
import json
import time
import urllib.request
from pathlib import Path

from subnacional_comun import escribir_pais, fao_bruto, resumen

RAIZ = Path(__file__).resolve().parent.parent
CACHE = RAIZ / "data" / "fuentes" / "gus"
API = "https://bdl.stat.gov.pl/api/v1/data/by-variable/{}?unit-level=2&year=2024&year=2025&format=json&page-size=100"

VOIV = {  # código TERYT → (nombre, lat, lon de la capital)
    "02": ("Baja Silesia", 51.11, 17.03), "04": ("Cuyavia y Pomerania", 53.12, 18.01), "06": ("Lublin", 51.25, 22.57),
    "08": ("Lubusz", 52.73, 15.24), "10": ("Łódź", 51.76, 19.46), "12": ("Pequeña Polonia", 50.06, 19.94),
    "14": ("Mazovia", 52.23, 21.01), "16": ("Opole", 50.67, 17.93), "18": ("Subcarpacia", 50.04, 22.00),
    "20": ("Podlaquia", 53.13, 23.16), "22": ("Pomerania", 54.35, 18.65), "24": ("Silesia", 50.26, 19.02),
    "26": ("Santa Cruz", 50.87, 20.63), "28": ("Varmia y Masuria", 53.78, 20.49), "30": ("Gran Polonia", 52.41, 16.93),
    "32": ("Pomerania Occidental", 53.43, 14.55),
}
PRODUCTOS = {  # producto → variables de cosecha (dt)
    "manzana": [1751694], "pera": [1751698], "cereza": [1751706, 1751710], "fresa": [1751742],
    "arandano": [1751730, 1751738], "papa": [4369],
}
NOMBRES = {"arandano": "Berries (frambuesa y arándano)"}
NOTAS = {
    "manzana": "Polonia es el mayor productor de manzana de la Unión Europea.",
    "cereza": "Guinda (wiśnie) y cereza dulce (czereśnie). Comercio de FAOSTAT (partida de cerezas).",
    "arandano": "Frambuesa y arándano; la grosella y la aronia no se incluyen.",
}
EXTRA_FAO = {"cereza": "531"}


def serie(var):
    archivo = CACHE / f"bdl_{var}.json"
    if not archivo.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(API.format(var), timeout=120) as r:
            archivo.write_bytes(r.read())
        time.sleep(1)   # el API limita la cantidad de consultas por minuto
    return json.loads(archivo.read_text(encoding="utf-8"))["results"]


def por_voivodato(var):
    """{código: {año: valor}}"""
    return {u["id"][2:4]: {v["year"]: v["val"] for v in u["values"] if v.get("val") is not None} for u in serie(var)}


def main():
    pob_s = por_voivodato(72305)
    anio_pob = max(max(v) for v in pob_s.values())
    pob = {c: int(v[anio_pob]) for c, v in pob_s.items()}
    extra = fao_bruto("616", EXTRA_FAO)
    datos = {
        "codigo": "PL", "m49": "616", "pais": "Polonia", "nivel": "voivodato", "nivelPlural": "voivodatos",
        "anio": 2025, "anioPoblacion": int(anio_pob),
        "fuente": f"GUS Bank Danych Lokalnych (cosecha por voivodato), GUS población {anio_pob}, FAOSTAT",
        "fuenteCorta": "GUS",
        "metodo": "Cosecha oficial por voivodato del GUS (año más reciente, 2025), sin estimaciones propias. "
                  "Solo frutas y papa: el GUS no publica las hortalizas por especie y voivodato.",
        "limites": [[49.0, 14.1], [54.9, 24.2]],
        "regiones": {c: {"nombre": n, "lat": la, "lon": lo, "pob": pob.get(c)} for c, (n, la, lo) in VOIV.items()},
        "productos": {},
    }
    for clave, variables in PRODUCTOS.items():
        series = [por_voivodato(v) for v in variables]
        anio = max(a for s in series for vals in s.values() for a in vals)
        regiones = {}
        for s in series:
            for c, vals in s.items():
                if vals.get(anio):
                    regiones[c] = regiones.get(c, 0) + vals[anio] / 10   # dt → t
        datos["productos"][clave] = {
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            **({"nota": NOTAS[clave]} if clave in NOTAS else {}),
            "fuenteProduccion": "GUS", "anioProduccion": int(anio),
            "nacional": round(sum(regiones.values())), "ha": 0,
            "regiones": {c: [round(t), 0] for c, t in regiones.items() if t > 0},
            **({"comercio": extra[clave]["comercio"]} if clave in extra else {}),
        }
    destino = escribir_pais(datos)
    print(f"-> {destino.name} ({destino.stat().st_size / 1e3:.0f} kB) · población {sum(pob.values()):,}")
    resumen(datos)


if __name__ == "__main__":
    main()

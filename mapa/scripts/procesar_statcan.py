"""
Vista Canadá: producción por provincia de Statistics Canada y población estimada por provincia y territorio.
Comercio con FAOSTAT mediante el motor común (scripts/subnacional_comun.py).

Fuentes (descarga completa de cada tabla en CSV, sin clave: https://www150.statcan.gc.ca/n1/tbl/csv/<tabla>-eng.zip):
  - 32-10-0364-01  Frutas: superficie, producción y valor (producción total, toneladas métricas)
  - 32-10-0365-01  Hortalizas de campo: producción total (toneladas métricas)
  - 32-10-0456-01  Invernadero: producción de frutas y hortalizas (kilogramos)
  - 32-10-0358-01  Papa: producción (quintales cortos, hundredweight)
  - 17-10-0009-01  Población estimada trimestral (1 de julio)

Canadá produce en invernadero la mayor parte de su jitomate, pepino y pimiento para consumo en fresco: se suman
campo e invernadero. Donde Statistics Canada suprime la cifra de una provincia (confidencialidad), el resto del
total nacional se reparte entre esas provincias según su superficie cosechada (marcado como estimado).

Uso:
  python scripts/procesar_statcan.py [año=2025]
Salida: data/sub_ca.js → window.SUBNACIONAL.CA
"""
import csv
import io
import sys
import urllib.request
import zipfile
from pathlib import Path

from subnacional_comun import escribir_pais, resumen

RAIZ = Path(__file__).resolve().parent.parent
CACHE = RAIZ / "data" / "fuentes" / "statcan"

PROV = {  # id → (nombre en StatCan, nombre en español, lat, lon de la capital)
    "NL": ("Newfoundland and Labrador", "Terranova y Labrador", 47.56, -52.71),
    "PE": ("Prince Edward Island", "Isla del Príncipe Eduardo", 46.24, -63.13),
    "NS": ("Nova Scotia", "Nueva Escocia", 44.65, -63.57),
    "NB": ("New Brunswick", "Nuevo Brunswick", 45.96, -66.64),
    "QC": ("Quebec", "Quebec", 46.81, -71.21),
    "ON": ("Ontario", "Ontario", 43.65, -79.38),
    "MB": ("Manitoba", "Manitoba", 49.90, -97.14),
    "SK": ("Saskatchewan", "Saskatchewan", 50.45, -104.61),
    "AB": ("Alberta", "Alberta", 53.55, -113.49),
    "BC": ("British Columbia", "Columbia Británica", 48.43, -123.37),
    "YT": ("Yukon", "Yukón", 60.72, -135.05),
    "NT": ("Northwest Territories", "Territorios del Noroeste", 62.45, -114.37),
    "NU": ("Nunavut", "Nunavut", 63.75, -68.52),
}
ID = {v[0]: k for k, v in PROV.items()}

# producto del mapa → lista de (tabla, prefijo del nombre de Commodity en StatCan)
F, H, I = "32100364", "32100365", "32100456"
PRODUCTOS = {
    "jitomate": [(H, "Fresh tomatoes"), (I, "Fresh tomatoes")],
    "chile": [(H, "Fresh peppers"), (I, "Fresh peppers")],
    "pepino": [(H, "Fresh cucumbers and fresh gherkins"), (I, "Fresh cucumbers")],
    "lechuga": [(H, "Fresh lettuce"), (I, "Fresh lettuce")],
    "berenjena": [(H, "Fresh eggplants"), (I, "Fresh eggplants")],
    "cebolla": [(H, "Fresh dry onions")], "zanahoria": [(H, "Fresh carrots")], "brocoli": [(H, "Fresh broccoli")],
    "coliflor": [(H, "Fresh cauliflowers")], "esparrago": [(H, "Fresh asparagus")],
    "sandia": [(H, "Fresh watermelons")], "melon": [(H, "Other fresh melons")],
    "calabacita": [(H, "Fresh squash and zucchini"), (H, "Fresh pumpkins")],
    "papa": [("32100358", None)],
    "manzana": [(F, "Fresh apples")], "pera": [(F, "Fresh pears")],
    "durazno": [(F, "Fresh peaches"), (F, "Fresh nectarines")], "uva": [(F, "Fresh grapes [1141147]")],
    "fresa": [(F, "Fresh strawberries"), (I, "Fresh strawberries")],
    "arandano": [(F, "Fresh blueberries [1141114]"), (F, "Fresh raspberries")],
    # Solo vistas por país (data/productos_paises.js)
    "arandano_rojo": [(F, "Fresh cranberries")],
    "cereza": [(F, "Fresh sweet cherries"), (F, "Fresh sour cherries")],
}
NOMBRES = {"arandano": "Berries (arándano y frambuesa)"}
NOTAS = {
    "jitomate": "Campo más invernadero. La cifra de campo incluye el jitomate para industria (sobre todo en Ontario).",
    "chile": "Pimiento (sobre todo morrón de invernadero) de campo e invernadero.",
    "pepino": "Campo (incluye pepinillo) más invernadero.",
    "arandano": "Arándano azul (alto y silvestre) y frambuesa, agrupados como en la FAO.",
    "calabacita": "Calabaza, calabacita y zucchini.",
    "papa": "Toda la papa (fresca, industria y semilla); Statistics Canada no separa el destino en la producción.",
    "arandano_rojo": "Arándano rojo (cranberry), casi todo para jugo y deshidratado. Su comercio no está en este mapa.",
    "cereza": "Cereza dulce y ácida. Su comercio no está en este mapa.",
}
AREA_H = ("Area harvested (hectares)",)


def descargar(tabla):
    CACHE.mkdir(parents=True, exist_ok=True)
    archivo = CACHE / f"{tabla}.zip"
    if not archivo.exists():
        urllib.request.urlretrieve(f"https://www150.statcan.gc.ca/n1/tbl/csv/{tabla}-eng.zip", archivo)
    z = zipfile.ZipFile(archivo)
    nombre = next(n for n in z.namelist() if "MetaData" not in n)
    return list(csv.DictReader(io.TextIOWrapper(z.open(nombre), encoding="utf-8-sig")))


def valor(r):
    if not r["VALUE"]:
        return None
    return float(r["VALUE"]) * (1000 if r["SCALAR_ID"] == "3" else 1)


def serie(tabla, filas, anio, prefijo):
    """{GEO: toneladas} y {GEO: hectáreas cosechadas} de un producto."""
    prod, area = {}, {}
    for r in filas:
        if r["REF_DATE"] != str(anio):
            continue
        if tabla == "32100358":
            clave = r["Area, production and farm value of potatoes"]
            if clave == "Production" and valor(r) is not None:
                prod[r["GEO"]] = valor(r) * 45.359237 / 1000          # quintales cortos → t
            elif clave == "Harvested area" and valor(r) is not None:
                area[r["GEO"]] = valor(r) * 0.404686                  # acres → ha
            continue
        if not r["Commodity"].startswith(prefijo):
            continue
        v = valor(r)
        if tabla == F:
            if r["Estimates"] == "Total production" and r["UOM"] == "Metric tonnes":
                prod[r["GEO"]] = v
            elif r["Estimates"] == "Cultivated area, total" and r["UOM"] == "Hectares" and v is not None:
                area[r["GEO"]] = v
        elif tabla == H:
            if r["Estimates"] == "Total production (metric tonnes)":
                prod[r["GEO"]] = v
            elif r["Estimates"] in AREA_H and v is not None:
                area[r["GEO"]] = v
        else:  # invernadero
            if r["Production and value"] == "Production" and r["UOM"] == "Kilograms":
                prod[r["GEO"]] = None if v is None else v / 1000
            elif r["Production and value"] == "Area harvested" and r["UOM"] == "Square metres" and v is not None:
                area[r["GEO"]] = v / 10000
    return prod, area


def repartir(prod, area):
    """Provincias publicadas (0) y reparto del resto nacional entre las suprimidas según su superficie (1)."""
    nacional = prod.get("Canada")
    publicadas = {ID[g]: t for g, t in prod.items() if g in ID and t is not None and t > 0}
    regiones = {p: [t, 0] for p, t in publicadas.items()}
    if nacional:
        resto = nacional - sum(publicadas.values())
        suprimidas = [ID[g] for g, t in prod.items() if g in ID and t is None]
        pesos = {p: area.get(PROV[p][0], 0) for p in suprimidas}
        total = sum(pesos.values())
        if resto > 0 and suprimidas:
            for p in suprimidas:
                w = pesos[p] / total if total else 1 / len(suprimidas)
                if w > 0:
                    regiones[p] = [resto * w, 1]
    return (nacional or sum(publicadas.values())), regiones


def main(anio=2025):
    tablas = {t: descargar(t) for t in {F, H, I, "32100358"}}
    pob = {}
    for r in descargar("17100009"):
        if r["REF_DATE"] == f"{anio}-07-01" and r["GEO"] in ID and r["VALUE"]:
            pob[ID[r["GEO"]]] = int(float(r["VALUE"]))

    datos = {
        "codigo": "CA", "m49": "124", "pais": "Canadá", "nivel": "provincia", "nivelPlural": "provincias y territorios", "femenino": True,
        "anio": anio, "anioPoblacion": anio,
        "fuente": f"Statistics Canada {anio} (frutas, hortalizas, invernadero, papa, población), FAOSTAT",
        "fuenteCorta": f"Statistics Canada {anio}",
        "metodo": "Producción total por provincia de Statistics Canada, campo más invernadero. Donde una cifra provincial está "
                  "suprimida por confidencialidad, el resto del total nacional se reparte según la superficie (marcado como estimado).",
        "limites": [[42, -140], [66, -52]],
        "regiones": {p: {"nombre": n, "lat": la, "lon": lo, "pob": pob.get(p)} for p, (_, n, la, lo) in PROV.items()},
        "productos": {},
    }
    for clave, partes in PRODUCTOS.items():
        nacional, regiones, ha = 0.0, {}, 0.0
        for tabla, prefijo in partes:
            prod, area = serie(tabla, tablas[tabla], anio, prefijo)
            n, reg = repartir(prod, area)
            nacional += n
            ha += area.get("Canada", 0)
            for p, (t, est) in reg.items():
                previo = regiones.get(p, [0, 0])
                regiones[p] = [previo[0] + t, max(previo[1], est)]
        if nacional <= 0:
            print(f"  (sin datos {anio}: {clave})")
            continue
        datos["productos"][clave] = {
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            **({"nota": NOTAS[clave]} if clave in NOTAS else {}),
            "fuenteProduccion": "Statistics Canada", "anioProduccion": anio,
            "nacional": round(nacional), "ha": round(ha),
            "regiones": {p: [round(t), e] for p, (t, e) in regiones.items() if round(t) > 0},
        }

    destino = escribir_pais(datos, sin_comercio=("coliflor", "arandano_rojo", "cereza"))
    print(f"→ {destino.name} ({destino.stat().st_size / 1e3:.0f} kB) · población {sum(pob.values()):,}")
    resumen(datos)


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 2025)

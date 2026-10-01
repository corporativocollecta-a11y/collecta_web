"""
Vista Francia: producción por región de la Statistique agricole annuelle (SAA) de Agreste (Ministerio de Agricultura),
series largas 2010-2025 (2025 provisional), y población por región de Eurostat (1 de enero de 2025).
Comercio con FAOSTAT mediante el motor común.

Fuentes:
  - Agreste, SAA séries longues 2010-2025, datos regionales (hojas LEG hortalizas, FRT frutas, PDT papa):
    https://agreste.agriculture.gouv.fr/agreste-web/disaron/SAA-SeriesLongues/detail/  (producción en quintales)
  - Eurostat demo_r_pjanaggr3: población al 1 de enero por región (NUTS 1 de Francia metropolitana y regiones de
    ultramar, que coinciden con las regiones administrativas).
Incluye las regiones de ultramar (Guadalupe, Martinica, Guayana, Reunión, Mayotte), que producen plátano y frutas
tropicales.

Uso:
  python scripts/procesar_agreste.py [año=2025]
Salida: data/sub_fr.js → window.SUBNACIONAL.FR
"""
import json
import sys
import zipfile
from pathlib import Path

import openpyxl

from subnacional_comun import escribir_pais, fao_bruto, resumen

RAIZ = Path(__file__).resolve().parent.parent
F = RAIZ / "data" / "fuentes" / "agreste"
XLSX = "SAA_2010-2025_provisoires_donnees_regionales.xlsx"

REGIONES = {  # código SAA → (código Eurostat, nombre, lat, lon de la capital)
    "11": ("FR1", "Isla de Francia", 48.86, 2.35), "24": ("FRB", "Centro-Valle del Loira", 47.90, 1.90),
    "27": ("FRC", "Borgoña-Franco Condado", 47.32, 5.04), "28": ("FRD", "Normandía", 49.44, 1.10),
    "32": ("FRE", "Altos de Francia", 50.63, 3.06), "44": ("FRF", "Gran Este", 48.57, 7.75),
    "52": ("FRG", "Países del Loira", 47.22, -1.55), "53": ("FRH", "Bretaña", 48.11, -1.68),
    "75": ("FRI", "Nueva Aquitania", 44.84, -0.58), "76": ("FRJ", "Occitania", 43.60, 1.44),
    "84": ("FRK", "Auvernia-Ródano-Alpes", 45.76, 4.84), "93": ("FRL", "Provenza-Alpes-Costa Azul", 43.30, 5.37),
    "94": ("FRM", "Córcega", 41.93, 8.74), "971": ("FRY1", "Guadalupe", 16.24, -61.53),
    "972": ("FRY2", "Martinica", 14.61, -61.07), "973": ("FRY3", "Guayana Francesa", 4.94, -52.33),
    "974": ("FRY4", "Reunión", -20.88, 55.45), "976": ("FRY5", "Mayotte", -12.78, 45.23),
}

# producto → (hoja, [códigos de cultivo SAA])
PRODUCTOS = {
    "jitomate": ("LEG", ["41"]), "chile": ("LEG", ["36"]), "cebolla": ("LEG", ["50", "51"]), "zanahoria": ("LEG", ["46"]),
    "lechuga": ("LEG", ["13"]), "fresa": ("LEG", ["23"]), "brocoli": ("LEG", ["05", "04"]),
    "pepino": ("LEG", ["28"]), "berenjena": ("LEG", ["24"]), "esparrago": ("LEG", ["02"]), "sandia": ("LEG", ["35"]),
    "melon": ("LEG", ["34"]), "calabacita": ("LEG", ["30", "37"]), "papa": ("PDT", ["07"]),
    "manzana": ("FRT", ["31", "19"]), "pera": ("FRT", ["26"]), "durazno": ("FRT", ["08"]), "cereza": ("FRT", ["04"]),
    "kiwi": ("FRT", ["39"]), "arandano": ("FRT", ["40", "41"]), "aguacate": ("FRT", ["50"]), "platano": ("FRT", ["51"]),
    "mango": ("FRT", ["16"]), "pina": ("FRT", ["49"]), "limon": ("FRT", ["53"]), "mandarina": ("FRT", ["54"]),
    "naranja": ("FRT", ["55"]), "toronja": ("FRT", ["56"]), "chabacano": ("FRT", ["01"]),
}
EXTRA_FAO = {"cereza": "531", "kiwi": "592", "mandarina": "495", "chabacano": "526"}
NOMBRES = {"brocoli": "Brócoli y coliflor", "arandano": "Berries (grosella negra, arándano y frambuesa)"}
NOTAS = {
    "jitomate": "Campo, invernadero y tomate para industria.",
    "manzana": "Manzana de mesa y de sidra.",
    "papa": "Toda la papa (consumo, fécula y semilla).",
    "platano": "Plátano de Guadalupe y Martinica (regiones de ultramar).",
    "durazno": "Durazno, nectarina y pavía.",
    "calabacita": "Calabacín y calabaza.",
    "brocoli": "Brócoli y coliflor juntos, como la partida de comercio de la FAO (Francia exporta mucha coliflor).",
}


def hoja(nombre):
    if not (F / XLSX).exists():
        zipfile.ZipFile(F / "saa_2010_2025.zip").extract(XLSX, F)
    ws = openpyxl.load_workbook(F / XLSX, read_only=True, data_only=True)[nombre]
    ws.reset_dimensions()   # el archivo declara mal sus dimensiones
    filas = list(ws.iter_rows(values_only=True))
    cab = filas[5]
    return cab, filas[6:]


def poblacion(anio):
    d = json.loads((F / "eurostat_pop_fr.json").read_text(encoding="utf-8"))
    geo = d["dimension"]["geo"]["category"]["index"]
    t = d["dimension"]["time"]["category"]["index"]
    nt = len(t)
    return {g: int(d["value"][str(i * nt + t[str(anio)])]) for g, i in geo.items() if str(i * nt + t[str(anio)]) in d["value"]}


def main(anio=2025):
    pob_nuts = poblacion(anio)
    extra = fao_bruto("250", EXTRA_FAO)
    datos = {
        "codigo": "FR", "m49": "250", "pais": "Francia", "nivel": "región", "nivelPlural": "regiones", "femenino": True,
        "anio": anio, "anioPoblacion": anio,
        "fuente": f"Agreste SAA {anio} (provisional), Eurostat población 1-ene-{anio}, FAOSTAT",
        "fuenteCorta": f"Agreste SAA {anio}",
        "metodo": "Producción cosechada por región de la Statistique agricole annuelle (Agreste), sin estimaciones propias. "
                  "Incluye las regiones de ultramar. Población de Eurostat.",
        "limites": [[41.3, -5.2], [51.1, 9.6]],
        "regiones": {c: {"nombre": n, "lat": la, "lon": lo, "pob": pob_nuts.get(nuts)} for c, (nuts, n, la, lo) in REGIONES.items()},
        "productos": {},
    }
    cache = {}
    for clave, (nombre_hoja, codigos) in PRODUCTOS.items():
        if nombre_hoja not in cache:
            cache[nombre_hoja] = hoja(nombre_hoja)
        cab, filas = cache[nombre_hoja]
        col = cab.index(f"PROD_{anio}")
        reg, nacional = {}, 0.0
        for r in filas:
            if not r[0] or not r[1] or r[1].split(" - ")[0] not in codigos:
                continue
            region = r[0].split(" - ")[0]
            v = r[col] if isinstance(r[col], (int, float)) else 0
            if region == "001":
                nacional += v / 10   # quintales → t
            elif region in REGIONES and v > 0:
                reg[region] = reg.get(region, 0) + v / 10
        if nacional <= 0:
            print(f"  (sin datos: {clave})")
            continue
        suma = sum(reg.values())
        if abs(suma - nacional) > max(10, nacional * 0.01):
            print(f"  aviso {clave}: regiones {suma:,.0f} vs Francia {nacional:,.0f}")
        datos["productos"][clave] = {
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            **({"nota": NOTAS[clave]} if clave in NOTAS else {}),
            "fuenteProduccion": "Agreste", "anioProduccion": anio,
            "nacional": round(nacional), "ha": 0,
            "regiones": {c: [round(t), 0] for c, t in reg.items()},
            **({"comercio": extra[clave]["comercio"]} if clave in extra and extra[clave]["comercio"] else {}),
        }
    destino = escribir_pais(datos)
    print(f"-> {destino.name} ({destino.stat().st_size / 1e3:.0f} kB) · población {sum(r['pob'] or 0 for r in datos['regiones'].values()):,}")
    resumen(datos)


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 2025)

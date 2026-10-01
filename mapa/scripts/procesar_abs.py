"""
Vista Australia: producción por estado de "Australian Agriculture: Horticulture 2024-25" del Australian Bureau of
Statistics (cifras de Hort Innovation) y población residente estimada del ABS al 30 de junio de 2025.
Comercio con FAOSTAT mediante el motor común.

Fuentes:
  - https://www.abs.gov.au/statistics/industry/agriculture/australian-agriculture-horticulture/2024-25/
    AAHDC_Aust_Horticulture_202425.xlsx (Table 2 frutas, Table 3 hortalizas; "Production (t)").
  - API de datos del ABS, ERP_Q (población residente estimada trimestral por estado):
    https://data.api.abs.gov.au/rest/data/ABS,ERP_Q,1.0.0/1.3.TOT.1+…+8.Q

Uso:
  python scripts/procesar_abs.py
Salida: data/sub_au.js → window.SUBNACIONAL.AU
"""
import csv
from pathlib import Path

import openpyxl

from subnacional_comun import escribir_pais, fao_bruto, resumen

RAIZ = Path(__file__).resolve().parent.parent
F = RAIZ / "data" / "fuentes" / "abs"
ANIO_ABS = "2024-25"

ESTADOS = {  # código ABS → (nombre, lat, lon de la capital)
    "1": ("Nueva Gales del Sur", -33.87, 151.21), "2": ("Victoria", -37.81, 144.96), "3": ("Queensland", -27.47, 153.03),
    "4": ("Australia Meridional", -34.93, 138.60), "5": ("Australia Occidental", -31.95, 115.86),
    "6": ("Tasmania", -42.88, 147.33), "7": ("Territorio del Norte", -12.46, 130.84),
    "8": ("Territorio de la Capital", -35.28, 149.13),
}
PRODUCTOS = {  # producto → artículos del ABS
    "manzana": ["Apples"], "aguacate": ["Avocados"], "platano": ["Bananas"], "arandano": ["Blueberries", "Rubus berries"],
    "cereza": ["Cherries"], "toronja": ["Grapefruit"], "kiwi": ["Kiwifruit"], "limon": ["Lemons and limes"],
    "mandarina": ["Mandarins"], "mango": ["Mangoes"], "melon": ["Muskmelons"], "durazno": ["Nectarines and peaches"],
    "naranja": ["Oranges"], "papaya": ["Papaya/Pawpaw"], "pera": ["Pears", "Nashi"], "pina": ["Pineapples"],
    "fresa": ["Strawberries"], "uva": ["Table grapes"], "sandia": ["Watermelons"], "chabacano": ["Apricots"],
    "esparrago": ["Asparagus"], "brocoli": ["Broccoli/Baby broccoli", "Cauliflower"], "chile": ["Capsicums", "Chillies"],
    "zanahoria": ["Carrots"], "pepino": ["Cucumbers"], "berenjena": ["Eggplant"], "lechuga": ["Lettuce (head)"],
    "cebolla": ["Onions"], "papa": ["Potatoes"], "calabacita": ["Pumpkins", "Zucchini"], "jitomate": ["Tomatoes"],
}
EXTRA_FAO = {"cereza": "531", "kiwi": "592", "mandarina": "495", "chabacano": "526"}
NOMBRES = {"brocoli": "Brócoli y coliflor", "arandano": "Berries (arándano, frambuesa y zarzamora)", "chile": "Pimiento y chile"}
NOTAS = {
    "uva": "Solo uva de mesa (sin uva de vino ni pasas).",
    "brocoli": "Brócoli, brocolini y coliflor, como la partida de la FAO.",
    "pera": "Pera europea y nashi.",
    "calabacita": "Calabaza y calabacita (zucchini).",
    "papa": "Toda la papa, incluida la de industria.",
}


def poblacion():
    with open(F / "erp.csv", encoding="utf-8") as f:
        return {r["REGION"]: int(float(r["OBS_VALUE"])) for r in csv.DictReader(f) if r["TIME_PERIOD"] == "2025-Q2"}


def main():
    pob = poblacion()
    wb = openpyxl.load_workbook(F / "AAHDC_Aust_Horticulture_202425.xlsx", read_only=True, data_only=True)
    datos_abs = {}
    for hoja in ("Table 2", "Table 3"):
        filas = list(wb[hoja].iter_rows(values_only=True))
        cab = next(r for r in filas if r[0] == "Region codes")
        col = list(cab).index(ANIO_ABS)
        for r in filas:
            if r[2] and str(r[2]).endswith("- Production (t)") and isinstance(r[col], (int, float)):
                datos_abs.setdefault(r[2].replace(" - Production (t)", ""), {})[str(r[0])] = r[col]
    extra = fao_bruto("036", EXTRA_FAO)
    datos = {
        "codigo": "AU", "m49": "036", "pais": "Australia", "nivel": "estado", "nivelPlural": "estados y territorios",
        "anio": 2025, "anioPoblacion": 2025,
        "fuente": "ABS Australian Agriculture: Horticulture 2024-25 (Hort Innovation), ABS población 30-jun-2025, FAOSTAT",
        "fuenteCorta": "ABS 2024-25",
        "metodo": "Producción del año fiscal 2024-25 (julio a junio) por estado, del ABS con cifras de Hort Innovation, "
                  "sin estimaciones propias. Población residente estimada al 30 de junio de 2025.",
        "limites": [[-43.8, 112.5], [-10.5, 154.0]],
        "regiones": {c: {"nombre": n, "lat": la, "lon": lo, "pob": pob.get(c)} for c, (n, la, lo) in ESTADOS.items()},
        "productos": {},
    }
    for clave, articulos in PRODUCTOS.items():
        reg, nacional = {}, 0.0
        for a in articulos:
            d = datos_abs.get(a)
            assert d, a
            nacional += d.get("0", 0)
            for c, t in d.items():
                if c in ESTADOS and t > 0:
                    reg[c] = reg.get(c, 0) + t
        datos["productos"][clave] = {
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            **({"nota": NOTAS[clave]} if clave in NOTAS else {}),
            "fuenteProduccion": "ABS", "anioProduccion": 2025,
            "nacional": round(nacional), "ha": 0,
            "regiones": {c: [round(t), 0] for c, t in reg.items()},
            **({"comercio": extra[clave]["comercio"]} if clave in extra and extra[clave]["comercio"] else {}),
        }
    destino = escribir_pais(datos)
    print(f"-> {destino.name} ({destino.stat().st_size / 1e3:.0f} kB) · población {sum(pob.get(c, 0) for c in ESTADOS):,}")
    resumen(datos)


if __name__ == "__main__":
    main()

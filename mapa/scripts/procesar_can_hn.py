"""
Vista Honduras: producción por departamento del Censo Agropecuario Nacional (CAN) 2024 del INE Honduras
(año agrícola 2023-2024, datos preliminares). Comercio con FAOSTAT mediante el motor común.

Fuentes (https://ine.gob.hn/censo-agropecuario-nacional-2024/):
  - 4-CUADROS-CULTIVOS-ANUALES.xlsx: una hoja por cultivo anual con productores, explotaciones, área sembrada y
    cosechada (ha) y PRODUCCIÓN en toneladas métricas (TM) por departamento.
  - 5-CUADROS-CULTIVOS-PERMANENTES.xlsx: igual para los cultivos permanentes (área en producción y PRODUCCIÓN TM).
  El INE ya publica la producción en toneladas métricas: no hay conversión de quintales ni de cajas o racimos.
  Los cuadros traen 17 departamentos; Islas de la Bahía no aparece en ninguno (sin producción censada).
  - Población 2024 por departamento: proyecciones del INE (base Censo 2013) tal como las publica el Observatorio
    Nacional de la Violencia (IUDPAS-UNAH), Boletín nacional enero-diciembre 2024, ed. 70, cuadro de tasas por
    departamento (columna "Población", fuente "Proyecciones INE 2024"). El sitio del INE no tiene hoy un cuadro
    descargable de proyecciones departamentales (el Tomo 10 publicado solo trae la metodología); la suma de los 18
    departamentos coincide con el total nacional proyectado (9 892 632).
    data/fuentes/hn/IUDPAS-boletin-nacional-2024-ed70.pdf

Uso:
  python scripts/procesar_can_hn.py
Salida: data/sub_hn.js → window.SUBNACIONAL.HN
"""
import unicodedata
from pathlib import Path

import openpyxl

from subnacional_comun import escribir_pais, fao_bruto, produccion_fao, resumen

RAIZ = Path(__file__).resolve().parent.parent
F = RAIZ / "data" / "fuentes" / "hn"
ANUALES = F / "4-CUADROS-CULTIVOS-ANUALES.xlsx"
PERMANENTES = F / "5-CUADROS-CULTIVOS-PERMANENTES.xlsx"

# código INE → (nombre, lat, lon de la cabecera, población proyectada 2024)
DEPTOS = {
    "01": ("Atlántida", 15.78, -86.79, 515617), "02": ("Colón", 15.92, -85.95, 365557),
    "03": ("Comayagua", 14.45, -87.64, 604311), "04": ("Copán", 14.77, -88.78, 437037),
    "05": ("Cortés", 15.50, -88.03, 1920701), "06": ("Choluteca", 13.30, -87.19, 496899),
    "07": ("El Paraíso", 13.94, -86.85, 525535), "08": ("Francisco Morazán", 14.08, -87.21, 1773174),
    "09": ("Gracias a Dios", 15.27, -83.77, 112322), "10": ("Intibucá", 14.31, -88.18, 283857),
    "11": ("Islas de la Bahía", 16.32, -86.54, 82378), "12": ("La Paz", 14.32, -87.68, 239307),
    "13": ("Lempira", 14.59, -88.58, 388667), "14": ("Ocotepeque", 14.44, -89.18, 177128),
    "15": ("Olancho", 14.66, -86.22, 610799), "16": ("Santa Bárbara", 14.92, -88.24, 496965),
    "17": ("Valle", 13.53, -87.49, 198654), "18": ("Yoro", 15.14, -87.13, 663724),
}
POB_TOTAL = 9892632   # total nacional del mismo cuadro (control)


def norm(t):
    t = unicodedata.normalize("NFD", str(t)).encode("ascii", "ignore").decode().lower()
    return " ".join(t.split())


POR_NOMBRE = {norm(n): c for c, (n, *_) in DEPTOS.items()}

# producto del mapa → hojas del CAN (se suman). "A" = anuales, "P" = permanentes
PRODUCTOS = {
    "jitomate": ("A", ["TOMATE"]), "chile": ("A", ["CHILE DULCE", "CHILE PICANTE"]), "cebolla": ("A", ["CEBOLLA"]),
    "papa": ("A", ["PAPA"]), "zanahoria": ("A", ["ZANAHORIA"]), "lechuga": ("A", ["LECHUGA"]),
    "brocoli": ("A", ["BRÓCOLI"]), "coliflor": ("A", ["COLIFLOR"]), "pepino": ("A", ["PEPINO"]),
    "berenjena": ("A", ["BERENJENA"]), "sandia": ("A", ["SANDÍA"]),
    "melon": ("A", ["MELÓN"]),
    "aguacate": ("P", ["AGUACATE"]), "platano": ("P", ["BANANO", "PLATANO"]), "pina": ("P", ["PIÑA"]),
    "naranja": ("P", ["NARANJA"]), "limon": ("P", ["LIMÓN"]), "toronja": ("P", ["TORONJA"]),
    "mango": ("P", ["MANGO"]), "papaya": ("P", ["PAPAYA"]), "guayaba": ("P", ["GUAYABA"]),
    "fresa": ("P", ["FRESA"]), "zarzamora": ("P", ["MORA"]), "durazno": ("P", ["DURAZNO"]),
    # solo vistas por país (data/productos_paises.js)
    "mandarina": ("P", ["MANDARINA"]), "chabacano": ("P", ["ALBARICOQUE"]), "maracuya": ("P", ["MARACUYÁ"]),
}
FAO_EXTRA = {"mandarina": "495", "chabacano": "526"}   # comercio del archivo bruto de FAOSTAT
SIN_COMERCIO = ("coliflor", "guayaba", "zarzamora", "maracuya")
NOMBRES = {"zarzamora": "Mora (zarzamora)"}
# El censo no capta la mayor parte del banano de exportación (275 mil t de banano y plátano frente a 476 mil t
# exportadas en 2024 según FAOSTAT): para este producto se usa la producción nacional de FAOSTAT 2024 repartida
# según la producción censal de cada departamento (estimado). El ayote del censo (2 mil t) tampoco representa la
# partida de calabazas de la FAO (8.8 mil t exportadas), por eso no se incluye.
POR_FAO = ("platano",)
NOTAS = {
    "chile": "Chile dulce (pimiento) y chile picante juntos, como la partida de chiles y pimientos verdes de la FAO.",
    "platano": "Banano y plátano juntos, como en la FAO. El censo 2024 registra 183 mil t de banano y 92 mil t de plátano, "
               "menos de lo que Honduras exporta: se usa la producción de FAOSTAT 2024 (643 mil t) repartida según la "
               "producción censal de cada departamento.",
    "brocoli": "Solo brócoli; la coliflor va aparte.",
    "coliflor": "Su comercio está dentro de la partida de brócoli de la FAO; sin datos de comercio propios.",
    "guayaba": "Su comercio está dentro de la partida del mango de la FAO; sin datos de comercio propios.",
    "zarzamora": "Mora. La FAO no separa su comercio; sin datos de comercio propios.",
    "maracuya": "La FAO no separa su comercio (va en \"otras frutas\"): el balance supone que lo producido se consume en el país.",
    "mango": "La FAO estima apenas 538 t de mango para Honduras en 2024; el censo registra casi 28 mil t.",
}


def leer(archivo):
    """{hoja: {código de departamento: toneladas}} y {hoja: (total publicado t, ha)}"""
    wb = openpyxl.load_workbook(archivo, data_only=True, read_only=True)
    prod, totales = {}, {}
    for ws in wb.worksheets:
        filas = list(ws.iter_rows(values_only=True))
        cab = next((r for r in filas if r[1] == "DEPARTAMENTO"), None)
        if not cab:
            continue
        ip = next((i for i, c in enumerate(cab) if c and "PRODUCCI" in str(c) and "TM" in str(c)), None)
        ia = next(i for i, c in enumerate(cab) if c and ("COSECHADA" in str(c) or "EN PRODUCCI" in str(c)))
        if ip is None:
            continue
        hoja = ws.title.strip()
        prod[hoja] = {}
        for r in filas:
            if r[1] == "Total":
                totales[hoja] = (float(r[ip]), float(r[ia]))
            elif r[1] and norm(r[1]) in POR_NOMBRE and isinstance(r[ip], (int, float)):
                prod[hoja][POR_NOMBRE[norm(r[1])]] = float(r[ip])
    return prod, totales


def main():
    pa, ta = leer(ANUALES)
    pp, tp = leer(PERMANENTES)
    fuentes = {"A": (pa, ta), "P": (pp, tp)}
    assert sum(d[3] for d in DEPTOS.values()) == POB_TOTAL

    extra = fao_bruto("340", FAO_EXTRA)
    datos = {
        "codigo": "HN", "m49": "340", "pais": "Honduras", "nivel": "departamento", "nivelPlural": "departamentos",
        "anio": 2024, "anioPoblacion": 2024,
        "fuente": "INE Honduras, Censo Agropecuario Nacional 2024 (año agrícola 2023-2024, preliminar); proyecciones de población INE 2024; FAOSTAT",
        "fuenteCorta": "INE · CAN 2024",
        "metodo": "Censo Agropecuario Nacional 2024 del INE: producción en toneladas métricas por departamento publicada "
                  "por el INE (año agrícola 2023-2024, cifras preliminares). Islas de la Bahía no "
                  "tiene producción censada. Banano y plátano: producción de FAOSTAT 2024 repartida según el censo (estimado), porque "
                  "el censo no capta la mayor parte del banano de exportación. Población: proyecciones del INE para 2024 (base Censo 2013).",
        "limites": [[12.9, -89.4], [16.6, -83.1]],
        "regiones": {c: {"nombre": n, "lat": la, "lon": lo, "pob": p} for c, (n, la, lo, p) in DEPTOS.items()},
        "productos": {},
    }
    for clave, (tipo, hojas) in PRODUCTOS.items():
        prod, tot = fuentes[tipo]
        reg, ha, nac = {}, 0.0, 0.0
        for h in hojas:
            for c, t in prod[h].items():
                reg[c] = reg.get(c, 0) + t
            nac += tot[h][0]
            ha += tot[h][1]
            suma = sum(prod[h].values())
            assert abs(suma - tot[h][0]) <= max(1, tot[h][0] * 1e-6), (h, suma, tot[h][0])   # cuadra con el total del INE
        p = {
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            **({"nota": NOTAS[clave]} if clave in NOTAS else {}),
            "fuenteProduccion": "INE CAN", "anioProduccion": 2024,
            "nacional": round(nac), "ha": round(ha),
            "regiones": {c: [round(t), 0] for c, t in sorted(reg.items()) if round(t) > 0},
        }
        if clave in POR_FAO:
            fao, _ = produccion_fao("340", clave)
            p.update({"fuenteProduccion": "FAOSTAT (por censo)", "nacional": round(fao),
                      "regiones": {c: [round(fao * t / nac), 1] for c, t in sorted(reg.items()) if round(fao * t / nac) > 0}})
        if clave in FAO_EXTRA:
            p["comercio"] = extra[clave]["comercio"]
        datos["productos"][clave] = p

    destino = escribir_pais(datos, sin_comercio=SIN_COMERCIO)
    print(f"-> {destino.name} ({destino.stat().st_size / 1e3:.0f} kB)")
    resumen(datos)


if __name__ == "__main__":
    main()

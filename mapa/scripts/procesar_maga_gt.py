"""
Vista Guatemala: producción por departamento. Guatemala no publica producción de frutas y hortalizas por
departamento: la Encuesta Nacional Agropecuaria del INE cubre solo granos básicos y cultivos industriales, y el
último censo agropecuario con hortalizas y frutas por departamento es de 2003. Lo más reciente por departamento es
la SUPERFICIE de cada cultivo en el Mapa de Cobertura Vegetal y Uso de la Tierra 2020 (CVUT 2020, DIGEGR-MAGA),
que el MAGA publica en "El Agro en Cifras 2023". La producción nacional de FAOSTAT 2024 se reparte según esa
superficie y todas las cifras por departamento quedan marcadas como estimadas.

Fuentes:
  - MAGA, El Agro en Cifras 2023 (Planeamiento / Sistema de Información de Mercados), fichas de cada cultivo,
    "Principales departamentos productores": hectáreas por departamento del CVUT 2020.
    https://precios.maga.gob.gt/archivos/agro-en-cifras/El%20Agro%20En%20Cifras%20-%202023.pdf
    Algunos cultivos vienen agrupados en el mapa: cítricos (limón y naranja), deciduos (manzana y melocotón),
    musáceas (banano y plátano) y hortalizas (arveja, brócoli, cebolla, chile pimiento, ejote, papa, pepino, repollo
    y zanahoria); cada producto de un grupo usa la distribución del grupo.
    Las cifras se transcriben aquí de las fichas (el PDF intercala columnas y no se lee de forma fiable); cada
    lista se comprueba contra el total nacional de la ficha.
  - Población 2023 por departamento: estimaciones y proyecciones del INE publicadas en El Agro en Cifras 2023,
    tabla 2 (el sitio ine.gob.gt exige resolver un CAPTCHA, por lo que no se descarga de ahí).
  - FAOSTAT 2024: producción nacional.

Uso:
  python scripts/procesar_maga_gt.py
Salida: data/sub_gt.js → window.SUBNACIONAL.GT
"""
from pathlib import Path

from subnacional_comun import escribir_pais, produccion_fao, resumen

RAIZ = Path(__file__).resolve().parent.parent

# código INE → (nombre, lat, lon de la cabecera, población estimada 2023 del INE)
DEPTOS = {
    "01": ("Guatemala", 14.63, -90.51, 3639725), "02": ("El Progreso", 14.85, -90.07, 196917),
    "03": ("Sacatepéquez", 14.56, -90.73, 408476), "04": ("Chimaltenango", 14.66, -90.82, 771887),
    "05": ("Escuintla", 14.30, -90.79, 823684), "06": ("Santa Rosa", 14.28, -90.30, 456928),
    "07": ("Sololá", 14.77, -91.18, 487906), "08": ("Totonicapán", 14.91, -91.36, 507905),
    "09": ("Quetzaltenango", 14.84, -91.52, 936385), "10": ("Suchitepéquez", 14.53, -91.50, 626419),
    "11": ("Retalhuleu", 14.54, -91.68, 386783), "12": ("San Marcos", 14.96, -91.79, 1222951),
    "13": ("Huehuetenango", 15.32, -91.47, 1454019), "14": ("Quiché", 15.03, -91.15, 1119425),
    "15": ("Baja Verapaz", 15.10, -90.32, 344655), "16": ("Alta Verapaz", 15.47, -90.37, 1407025),
    "17": ("Petén", 16.93, -89.89, 640151), "18": ("Izabal", 15.73, -88.59, 458107),
    "19": ("Zacapa", 14.97, -89.53, 275913), "20": ("Chiquimula", 14.80, -89.54, 459294),
    "21": ("Jalapa", 14.63, -89.99, 413918), "22": ("Jutiapa", 14.29, -89.90, 563958),
}
POB_TOTAL = 17602431
POR_NOMBRE = {n: c for c, (n, *_) in DEPTOS.items()}

# Superficie CVUT 2020 por departamento (ha), El Agro en Cifras 2023. (total nacional de la ficha, {depto: ha})
CVUT = {
    "aguacate": (4755.07, {
        "Chimaltenango": 938.37, "Sacatepéquez": 710.43, "Alta Verapaz": 525.13, "Petén": 401.27,
        "Suchitepéquez": 385.99, "Sololá": 373.60, "Quetzaltenango": 364.18, "Guatemala": 271.06,
        "Baja Verapaz": 258.62, "Santa Rosa": 198.96, "Escuintla": 101.81, "Zacapa": 69.46, "Jutiapa": 67.07,
        "Retalhuleu": 38.60, "Totonicapán": 14.07, "Jalapa": 12.90, "Huehuetenango": 9.26, "San Marcos": 8.19,
        "El Progreso": 6.08}),
    "citricos": (5572.15, {
        "El Progreso": 1295.08, "Escuintla": 1201.35, "Santa Rosa": 466.19, "Retalhuleu": 465.41,
        "Alta Verapaz": 425.43, "Petén": 412.82, "Zacapa": 359.84, "Baja Verapaz": 182.80, "Jutiapa": 176.91,
        "Quetzaltenango": 170.92, "Suchitepéquez": 124.35, "Chiquimula": 61.62, "Sacatepéquez": 56.74,
        "Huehuetenango": 52.13, "Guatemala": 51.81, "Chimaltenango": 35.20, "Jalapa": 12.58, "San Marcos": 10.92,
        "Quiché": 6.33, "Izabal": 3.72}),
    "deciduos": (3097.94, {
        "Quiché": 2343.52, "San Marcos": 234.37, "Quetzaltenango": 219.07, "Sacatepéquez": 77.03, "Sololá": 71.48,
        "Jutiapa": 41.06, "Totonicapán": 34.69, "Chimaltenango": 34.46, "Jalapa": 32.60, "Huehuetenango": 5.84,
        "El Progreso": 3.83}),
    "mango": (13455.01, {
        "Retalhuleu": 3950.70, "Suchitepéquez": 2142.71, "Santa Rosa": 2091.00, "Escuintla": 1460.00,
        "Quetzaltenango": 1509.28, "Zacapa": 1386.95, "Jutiapa": 288.26, "San Marcos": 213.85, "Chiquimula": 183.55,
        "El Progreso": 178.49, "Izabal": 33.16, "Huehuetenango": 16.52}),
    "melon": (13512.03, {
        "Zacapa": 7920.54, "Jutiapa": 3324.24, "Santa Rosa": 1344.41, "El Progreso": 784.18, "Chiquimula": 138.66}),
    "pina": (12908.54, {
        "Guatemala": 5143.35, "Santa Rosa": 3314.85, "Petén": 2129.70, "Izabal": 750.81, "Suchitepéquez": 689.72,
        "Escuintla": 567.52, "Jutiapa": 140.03, "Jalapa": 99.30, "Retalhuleu": 73.28}),
    "musaceas": (76821.87, {
        "Escuintla": 37755.61, "Izabal": 14900.24, "San Marcos": 14534.57, "Suchitepéquez": 3691.30,
        "Retalhuleu": 2723.14, "Quetzaltenango": 2702.96, "Jutiapa": 327.76, "Alta Verapaz": 127.30,
        "Santa Rosa": 51.80, "Chiquimula": 7.20}),
    "sandia": (1403.60, {"Santa Rosa": 712.27, "Escuintla": 298.15, "Petén": 198.98, "Baja Verapaz": 194.20}),
    "papaya": (13096.85, {"Petén": 12986.88, "Escuintla": 92.33, "Retalhuleu": 17.64}),
    "tomate": (7087.36, {
        "Baja Verapaz": 2306.38, "Jalapa": 1856.12, "Jutiapa": 1151.58, "Chiquimula": 786.05, "Alta Verapaz": 629.42,
        "Santa Rosa": 258.81, "Guatemala": 99.00}),
    "hortalizas": (154675.90, {
        "Quiché": 28813.72, "Chimaltenango": 27262.44, "San Marcos": 20408.41, "Huehuetenango": 19534.23,
        "Guatemala": 12158.95, "Jalapa": 8925.38, "Baja Verapaz": 7767.03, "Quetzaltenango": 7250.32,
        "Alta Verapaz": 7009.22, "Sacatepéquez": 5250.54, "Sololá": 3976.37, "Jutiapa": 2807.79,
        "Chiquimula": 1507.28, "Totonicapán": 795.20, "El Progreso": 624.97, "Santa Rosa": 551.84, "Petén": 32.21}),
}
# producto del mapa → capa del CVUT
PRODUCTOS = {
    "jitomate": "tomate", "papa": "hortalizas", "cebolla": "hortalizas", "brocoli": "hortalizas",
    "chile": "hortalizas", "zanahoria": "hortalizas",
    "aguacate": "aguacate", "limon": "citricos", "naranja": "citricos", "manzana": "deciduos", "durazno": "deciduos",
    "mango": "mango", "melon": "melon", "sandia": "sandia", "pina": "pina", "platano": "musaceas", "papaya": "papaya",
}
GRUPO = {
    "hortalizas": "Reparto según la superficie de hortalizas en conjunto (arveja, brócoli, cebolla, chile pimiento, ejote, "
                  "papa, pepino, repollo y zanahoria) de cada departamento en el mapa de uso de la tierra 2020 del MAGA.",
    "citricos": "Reparto según la superficie de cítricos (limón y naranja juntos) de cada departamento en el mapa de uso de la tierra 2020 del MAGA.",
    "deciduos": "Reparto según la superficie de deciduos (manzana y melocotón juntos) de cada departamento en el mapa de uso de la tierra 2020 del MAGA.",
    "musaceas": "Banano y plátano juntos, como en la FAO. Reparto según la superficie de musáceas de cada departamento en el mapa de uso de la tierra 2020 del MAGA.",
}
NOTAS = {
    "brocoli": "La partida de la FAO agrupa brócoli y coliflor. " + GRUPO["hortalizas"],
    "mango": "La partida de la FAO agrupa mango, guayaba y mangostán.",
    "papaya": "El mapa de uso de la tierra del MAGA ubica casi toda la papaya en Petén.",
    "durazno": "Melocotón (durazno). " + GRUPO["deciduos"],
    "sandia": "FAOSTAT registra para Guatemala más exportación de sandía (151 mil t en 2024) que producción (59 mil t, "
              "cifra imputada por la FAO): el balance de consumo no es fiable.",
    "platano": GRUPO["musaceas"] + " FAOSTAT registra más exportación (3.17 millones de t en 2024) que producción "
               "(3.00 millones): el balance de consumo no es fiable.",
}


def main():
    assert sum(d[3] for d in DEPTOS.values()) == POB_TOTAL
    for capa, (total, reparto) in CVUT.items():
        assert set(reparto) <= set(POR_NOMBRE), (capa, set(reparto) - set(POR_NOMBRE))
        assert abs(sum(reparto.values()) - total) / total < 0.005, (capa, sum(reparto.values()), total)

    datos = {
        "codigo": "GT", "m49": "320", "pais": "Guatemala", "nivel": "departamento", "nivelPlural": "departamentos",
        "anio": 2024, "anioPoblacion": 2023,
        "fuente": "MAGA El Agro en Cifras 2023 (superficie del mapa de cobertura y uso de la tierra 2020), INE estimaciones de población 2023, FAOSTAT",
        "fuenteCorta": "MAGA · FAOSTAT",
        "metodo": "Guatemala no publica producción de frutas y hortalizas por departamento: la producción nacional de FAOSTAT "
                  "2024 se reparte según la superficie de cada cultivo por departamento del Mapa de Cobertura Vegetal y Uso "
                  "de la Tierra 2020 del MAGA (estimado). Algunos cultivos solo tienen superficie en grupo (hortalizas, "
                  "cítricos, deciduos, musáceas). Población: estimaciones del INE para 2023.",
        "limites": [[13.7, -92.3], [17.85, -88.2]],
        "regiones": {c: {"nombre": n, "lat": la, "lon": lo, "pob": p} for c, (n, la, lo, p) in DEPTOS.items()},
        "productos": {},
    }
    for clave, capa in PRODUCTOS.items():
        nacional, _ = produccion_fao("320", clave)
        if not nacional:
            print(f"  (sin producción FAOSTAT: {clave})")
            continue
        _, reparto = CVUT[capa]
        total = sum(reparto.values())
        nota = NOTAS.get(clave) or GRUPO.get(capa)
        datos["productos"][clave] = {
            **({"nota": nota} if nota else {}),
            "fuenteProduccion": "FAOSTAT (por superficie)", "anioProduccion": 2024,
            "nacional": round(nacional), "ha": 0,
            "regiones": {POR_NOMBRE[d]: [round(nacional * ha / total), 1] for d, ha in reparto.items()
                         if round(nacional * ha / total) > 0},
        }

    destino = escribir_pais(datos)
    print(f"-> {destino.name} ({destino.stat().st_size / 1e3:.0f} kB)")
    resumen(datos)


if __name__ == "__main__":
    main()

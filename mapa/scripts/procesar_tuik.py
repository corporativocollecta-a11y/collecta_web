"""
Vista Turquía: producción por provincia (81 il) y población de TÜİK. Comercio con FAOSTAT mediante el motor común.

Fuentes (TÜİK, sistema de consulta MEDAS, https://biruni.tuik.gov.tr/medas):
  - Crop Production Statistics → Vegetables y Fruits, beverage and spice crops: Production Quantity (Tonne), 2025,
    NUTS3. MEDAS es una aplicación interactiva sin API: la consulta se hizo en el navegador, se sumó por producto
    del mapa y se guardó en data/fuentes/tuik/medas_2025_agregado.json (con sumas de control por producto).
  - Crop Production Statistics → Cereals and other crop products: Patates (Tatlı Patates Hariç), 2025
    (data/fuentes/tuik/medas_2025_papa.json).
  - Address Based Population Registration System (ADNKS): población por provincia 2025
    (data/fuentes/tuik/adnks_2025_poblacion.json).
Sin estimaciones propias: son cifras oficiales por provincia (la suma coincide con el total nacional).

Uso:
  python scripts/procesar_tuik.py
Salida: data/sub_tr.js → window.SUBNACIONAL.TR
"""
import json
from pathlib import Path

from subnacional_comun import escribir_pais, resumen

RAIZ = Path(__file__).resolve().parent.parent
FUENTES = RAIZ / "data" / "fuentes" / "tuik"

# Provincias: código de placa → (nombre TÜİK, lat, lon de la capital)
PROV = {
    "01": ("Adana", 37.00, 35.32), "02": ("Adıyaman", 37.76, 38.28), "03": ("Afyonkarahisar", 38.76, 30.54),
    "04": ("Ağrı", 39.72, 43.05), "05": ("Amasya", 40.65, 35.83), "06": ("Ankara", 39.93, 32.86),
    "07": ("Antalya", 36.89, 30.71), "08": ("Artvin", 41.18, 41.82), "09": ("Aydın", 37.84, 27.84),
    "10": ("Balıkesir", 39.65, 27.88), "11": ("Bilecik", 40.14, 29.98), "12": ("Bingöl", 38.88, 40.50),
    "13": ("Bitlis", 38.40, 42.11), "14": ("Bolu", 40.74, 31.61), "15": ("Burdur", 37.72, 30.29),
    "16": ("Bursa", 40.19, 29.06), "17": ("Çanakkale", 40.15, 26.41), "18": ("Çankırı", 40.60, 33.62),
    "19": ("Çorum", 40.55, 34.95), "20": ("Denizli", 37.78, 29.09), "21": ("Diyarbakır", 37.91, 40.24),
    "22": ("Edirne", 41.68, 26.56), "23": ("Elazığ", 38.68, 39.22), "24": ("Erzincan", 39.75, 39.49),
    "25": ("Erzurum", 39.90, 41.27), "26": ("Eskişehir", 39.78, 30.52), "27": ("Gaziantep", 37.07, 37.38),
    "28": ("Giresun", 40.91, 38.39), "29": ("Gümüşhane", 40.46, 39.48), "30": ("Hakkari", 37.58, 43.74),
    "31": ("Hatay", 36.20, 36.16), "32": ("Isparta", 37.76, 30.55), "33": ("Mersin", 36.80, 34.63),
    "34": ("İstanbul", 41.01, 28.98), "35": ("İzmir", 38.42, 27.14), "36": ("Kars", 40.60, 43.10),
    "37": ("Kastamonu", 41.38, 33.78), "38": ("Kayseri", 38.73, 35.49), "39": ("Kırklareli", 41.73, 27.22),
    "40": ("Kırşehir", 39.15, 34.16), "41": ("Kocaeli", 40.77, 29.92), "42": ("Konya", 37.87, 32.48),
    "43": ("Kütahya", 39.42, 29.98), "44": ("Malatya", 38.35, 38.31), "45": ("Manisa", 38.61, 27.43),
    "46": ("Kahramanmaraş", 37.58, 36.94), "47": ("Mardin", 37.31, 40.74), "48": ("Muğla", 37.22, 28.36),
    "49": ("Muş", 38.74, 41.49), "50": ("Nevşehir", 38.62, 34.71), "51": ("Niğde", 37.97, 34.68),
    "52": ("Ordu", 40.98, 37.88), "53": ("Rize", 41.02, 40.52), "54": ("Sakarya", 40.78, 30.40),
    "55": ("Samsun", 41.29, 36.33), "56": ("Siirt", 37.93, 41.94), "57": ("Sinop", 42.03, 35.15),
    "58": ("Sivas", 39.75, 37.02), "59": ("Tekirdağ", 40.98, 27.51), "60": ("Tokat", 40.31, 36.55),
    "61": ("Trabzon", 41.00, 39.72), "62": ("Tunceli", 39.11, 39.55), "63": ("Şanlıurfa", 37.16, 38.79),
    "64": ("Uşak", 38.68, 29.41), "65": ("Van", 38.49, 43.38), "66": ("Yozgat", 39.82, 34.81),
    "67": ("Zonguldak", 41.45, 31.79), "68": ("Aksaray", 38.37, 34.03), "69": ("Bayburt", 40.26, 40.23),
    "70": ("Karaman", 37.18, 33.22), "71": ("Kırıkkale", 39.85, 33.51), "72": ("Batman", 37.88, 41.13),
    "73": ("Şırnak", 37.52, 42.46), "74": ("Bartın", 41.63, 32.34), "75": ("Ardahan", 41.11, 42.70),
    "76": ("Iğdır", 39.92, 44.04), "77": ("Yalova", 40.66, 29.28), "78": ("Karabük", 41.20, 32.62),
    "79": ("Kilis", 36.72, 37.12), "80": ("Osmaniye", 37.07, 36.25), "81": ("Düzce", 40.84, 31.16),
}
POR_NOMBRE = {n: c for c, (n, _, _) in PROV.items()}

NOMBRES = {"arandano": "Berries (frambuesa, arándano y zarzamora)", "chile": "Chile y pimiento"}
NOTAS = {
    "jitomate": "Jitomate de mesa (8.1 Mt) y para pasta de tomate (5.4 Mt).",
    "chile": "Pimiento para pasta (kapya), dolmalık, sivri y çarliston.",
    "cebolla": "Cebolla seca (sin cebolla tierna).",
    "lechuga": "Lechuga romana (kıvırcık), acogollada e iceberg.",
    "pepino": "Pepino de mesa y para encurtir.",
    "calabacita": "Calabacita (sakız) y calabaza de pulpa (bal kabağı); sin la calabaza para semilla.",
    "durazno": "Durazno y nectarina.",
    "uva": "Solo uva de mesa (con y sin semilla); sin la de vino ni la de pasas.",
    "papa": "Papa (sin camote).",
    "chabacano": "2025 fue un año de heladas: Malatya, la mayor zona productora del mundo, casi no cosechó. Su comercio no está en este mapa.",
    "granada": "Su comercio no está en este mapa: el balance supone que lo producido se consume en el país.",
    "mandarina": "Mandarina satsuma, clementina y otras. Su comercio no está en este mapa, pero Turquía exporta gran parte.",
    "kiwi": "Su comercio no está en este mapa.",
    "cereza": "Cereza dulce y guinda. Su comercio no está en este mapa, pero Turquía es el mayor productor del mundo.",
}
SIN_COMERCIO = ("coliflor", "mandarina", "kiwi", "cereza", "chabacano", "granada")


def main():
    ag = json.loads((FUENTES / "medas_2025_agregado.json").read_text(encoding="utf-8"))
    for k, a in ag["p"].items():   # sumas de control del navegador
        assert [sum(a), sum(x * (i + 1) for i, x in enumerate(a))] == ag["control"][k], k
    papa = json.loads((FUENTES / "medas_2025_papa.json").read_text(encoding="utf-8"))["papa"]
    pob = json.loads((FUENTES / "adnks_2025_poblacion.json").read_text(encoding="utf-8"))["pob"]
    assert set(pob) == set(POR_NOMBRE), set(pob) ^ set(POR_NOMBRE)

    productos = {k: dict(zip(ag["provs"], a)) for k, a in ag["p"].items()}
    productos["papa"] = papa
    datos = {
        "codigo": "TR", "m49": "792", "pais": "Turquía", "nivel": "provincia", "nivelPlural": "provincias", "femenino": True,
        "anio": 2025, "anioPoblacion": 2025,
        "fuente": "TÜİK producción vegetal 2025 (MEDAS), TÜİK población ADNKS 2025, FAOSTAT",
        "fuenteCorta": "TÜİK 2025",
        "metodo": "Producción 2025 por provincia (81 il) del sistema MEDAS de TÜİK, sumada por producto del mapa, sin "
                  "estimaciones propias. Población del registro ADNKS.",
        "limites": [[35.8, 25.6], [42.2, 44.9]],
        "regiones": {c: {"nombre": n, "lat": la, "lon": lo, "pob": pob[n]} for c, (n, la, lo) in PROV.items()},
        "productos": {},
    }
    for clave, valores in productos.items():
        regiones = {POR_NOMBRE[n]: [round(t), 0] for n, t in valores.items() if t and t > 0}
        datos["productos"][clave] = {
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            **({"nota": NOTAS[clave]} if clave in NOTAS else {}),
            "fuenteProduccion": "TÜİK", "anioProduccion": 2025,
            "nacional": round(sum(valores.values())), "ha": 0, "regiones": regiones,
        }
    destino = escribir_pais(datos, sin_comercio=SIN_COMERCIO)
    print(f"→ {destino.name} ({destino.stat().st_size / 1e3:.0f} kB) · población {sum(pob.values()):,}")
    resumen(datos)


if __name__ == "__main__":
    main()

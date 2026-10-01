"""
Vista Japón: producción por prefectura del Ministerio de Agricultura (MAFF), estadísticas de producción y envío de
hortalizas y de frutales, año de cosecha 2024 (令和6年産, final), y población estimada por prefectura
(人口推計, 1 de octubre de 2024). Comercio con FAOSTAT mediante el motor común.

Fuentes (archivos Excel en e-Stat, https://www.e-stat.go.jp/stat-search/file-download?statInfId=…):
  - Hortalizas, tabla 3 "都道府県別の作付面積、10a当たり収量、収穫量及び出荷量" (una por cultivo).
  - Frutales, tabla 3 "都道府県別の結果樹面積・10a当たり収量・収穫量・出荷量" (una por fruta).
  - Población: 人口推計 第4表 (miles de personas).
El MAFF solo encuesta las prefecturas productoras principales de cada cultivo ("…" en las demás): el resto del
total nacional se reparte entre esas prefecturas según su población (marcado como estimado).

Uso:
  python scripts/procesar_maff.py
Salida: data/sub_jp.js → window.SUBNACIONAL.JP
"""
from pathlib import Path

import openpyxl

from subnacional_comun import escribir_pais, fao_bruto, resumen

RAIZ = Path(__file__).resolve().parent.parent
F = RAIZ / "data" / "fuentes" / "maff"

PREF = {  # código → (nombre japonés, nombre en español, lat, lon de la capital)
    "01": ("北海道", "Hokkaidō", 43.06, 141.35), "02": ("青森", "Aomori", 40.82, 140.74), "03": ("岩手", "Iwate", 39.70, 141.15),
    "04": ("宮城", "Miyagi", 38.27, 140.87), "05": ("秋田", "Akita", 39.72, 140.10), "06": ("山形", "Yamagata", 38.24, 140.36),
    "07": ("福島", "Fukushima", 37.75, 140.47), "08": ("茨城", "Ibaraki", 36.34, 140.45), "09": ("栃木", "Tochigi", 36.57, 139.88),
    "10": ("群馬", "Gunma", 36.39, 139.06), "11": ("埼玉", "Saitama", 35.86, 139.65), "12": ("千葉", "Chiba", 35.61, 140.12),
    "13": ("東京", "Tokio", 35.69, 139.69), "14": ("神奈川", "Kanagawa", 35.45, 139.64), "15": ("新潟", "Niigata", 37.90, 139.02),
    "16": ("富山", "Toyama", 36.70, 137.21), "17": ("石川", "Ishikawa", 36.59, 136.63), "18": ("福井", "Fukui", 36.07, 136.22),
    "19": ("山梨", "Yamanashi", 35.66, 138.57), "20": ("長野", "Nagano", 36.65, 138.18), "21": ("岐阜", "Gifu", 35.39, 136.72),
    "22": ("静岡", "Shizuoka", 34.98, 138.38), "23": ("愛知", "Aichi", 35.18, 136.91), "24": ("三重", "Mie", 34.73, 136.51),
    "25": ("滋賀", "Shiga", 35.00, 135.87), "26": ("京都", "Kioto", 35.02, 135.76), "27": ("大阪", "Osaka", 34.69, 135.52),
    "28": ("兵庫", "Hyōgo", 34.69, 135.18), "29": ("奈良", "Nara", 34.69, 135.83), "30": ("和歌山", "Wakayama", 34.23, 135.17),
    "31": ("鳥取", "Tottori", 35.50, 134.24), "32": ("島根", "Shimane", 35.47, 133.05), "33": ("岡山", "Okayama", 34.66, 133.93),
    "34": ("広島", "Hiroshima", 34.40, 132.46), "35": ("山口", "Yamaguchi", 34.19, 131.47), "36": ("徳島", "Tokushima", 34.07, 134.56),
    "37": ("香川", "Kagawa", 34.34, 134.04), "38": ("愛媛", "Ehime", 33.84, 132.77), "39": ("高知", "Kōchi", 33.56, 133.53),
    "40": ("福岡", "Fukuoka", 33.61, 130.42), "41": ("佐賀", "Saga", 33.25, 130.30), "42": ("長崎", "Nagasaki", 32.74, 129.87),
    "43": ("熊本", "Kumamoto", 32.79, 130.74), "44": ("大分", "Ōita", 33.24, 131.61), "45": ("宮崎", "Miyazaki", 31.91, 131.42),
    "46": ("鹿児島", "Kagoshima", 31.56, 130.56), "47": ("沖縄", "Okinawa", 26.21, 127.68),
}
POR_NOMBRE = {jp: c for c, (jp, *_) in PREF.items()}

# producto → archivos (statInfId) de hortalizas ("yasai") o frutales ("kaju")
HORT = {"zanahoria": ["433"], "papa": ["439"], "esparrago": ["463"], "coliflor": ["464"], "brocoli": ["465"],
        "lechuga": ["466"], "cebolla": ["479"], "pepino": ["481"], "calabacita": ["484"], "berenjena": ["485"],
        "jitomate": ["488"], "chile": ["494"], "fresa": ["507"], "melon": ["508"], "sandia": ["510"]}
FRUT = {"mandarina": ["31"], "manzana": ["36"], "pera": ["37", "38"], "durazno": ["41"], "cereza": ["43"],
        "uva": ["45"], "pina": ["47"], "kiwi": ["48"]}
EXTRA_FAO = {"mandarina": "495", "cereza": "531", "kiwi": "592"}
NOMBRES = {"mandarina": "Mandarina (mikan)", "chile": "Pimiento (piman)"}
NOTAS = {
    "mandarina": "Mandarina satsuma (unshū mikan), la fruta más producida de Japón.",
    "pera": "Pera japonesa (nashi) y pera europea.",
    "calabacita": "Calabaza (kabocha).",
    "chile": "Pimiento verde (piman), incluido el shishitō.",
    "uva": "Uva de mesa (en Japón casi toda la uva es de mesa).",
    "pina": "Solo se cultiva en Okinawa.",
}


def filas(ruta):
    ws = openpyxl.load_workbook(ruta, read_only=True, data_only=True).worksheets[0]
    return [r for r in ws.iter_rows(values_only=True) if any(c is not None for c in r)]


def num(v):
    return v if isinstance(v, (int, float)) else None


def leer_hortaliza(id_):
    rs = filas(F / f"yasai_000040389{id_}.xlsx")
    nacional = next(num(r[4]) for r in rs if r[0] == "全国")
    i = next(i for i, r in enumerate(rs) if r[0] == "（都道府県）")
    reg, sin_dato = {}, []
    for r in rs[i + 1:]:
        n = str(r[0]).strip() if r[0] else ""
        if n in POR_NOMBRE:
            (reg.__setitem__(POR_NOMBRE[n], num(r[4])) if num(r[4]) is not None else sin_dato.append(POR_NOMBRE[n]))
    return nacional, reg, sin_dato


def leer_fruta(id_):
    rs = filas(F / f"kaju_0000403879{id_}.xlsx")
    if not any(r[1] == "全国" for r in rs):   # piña: solo Okinawa, tabla sin fila nacional
        t = next(num(r[6]) for r in rs if r[1] == "沖縄")
        return t, {"47": t}, []
    nacional = next(num(r[6]) for r in rs if r[1] == "全国")
    reg = {}
    for r in rs:
        n = str(r[2]).strip() if r[2] else ""
        if n in POR_NOMBRE and num(r[6]) is not None:
            reg[POR_NOMBRE[n]] = num(r[6])
    sin_dato = [c for c in PREF if c not in reg]   # la tabla solo lista las prefecturas encuestadas
    return nacional, reg, sin_dato


def poblacion():
    rs = filas(F / "pob_pref_2024.xlsx")
    pob = {}
    for r in rs:
        if r[9] and str(r[9]).endswith("000") and str(r[9]) != "00000" and isinstance(r[11], (int, float)):
            pob[str(r[9])[:2]] = int(r[11]) * 1000
    return pob


def main():
    pob = poblacion()
    extra = fao_bruto("392", EXTRA_FAO)
    datos = {
        "codigo": "JP", "m49": "392", "pais": "Japón", "nivel": "prefectura", "nivelPlural": "prefecturas", "femenino": True,
        "anio": 2024, "anioPoblacion": 2024,
        "fuente": "MAFF estadística de producción y envío de hortalizas y frutales 2024 (e-Stat), Oficina de Estadística población 2024, FAOSTAT",
        "fuenteCorta": "MAFF 2024",
        "metodo": "Cosecha 2024 por prefectura del MAFF. El MAFF solo encuesta las prefecturas productoras principales de cada "
                  "cultivo: el resto del total nacional se reparte entre las demás según su población (estimado).",
        "limites": [[30.0, 128.5], [45.6, 146.0]],
        "regiones": {c: {"nombre": es, "lat": la, "lon": lo, "pob": pob.get(c)} for c, (_, es, la, lo) in PREF.items()},
        "productos": {},
    }
    for clave, ids in list(HORT.items()) + list(FRUT.items()):
        lector = leer_hortaliza if clave in HORT else leer_fruta
        nacional, reg, sin = 0, {}, set()
        for i in ids:
            n, r, s = lector(i)
            nacional += n
            for c, t in r.items():
                reg[c] = reg.get(c, 0) + t
            sin |= set(s)
        regiones = {c: [t, 0] for c, t in reg.items() if t > 0}
        resto = nacional - sum(reg.values())
        sin = [c for c in sin if c not in reg]
        if resto > 0 and sin and clave != "pina":
            p = sum(pob[c] for c in sin)
            for c in sin:
                regiones[c] = [resto * pob[c] / p, 1]
        datos["productos"][clave] = {
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            **({"nota": NOTAS[clave]} if clave in NOTAS else {}),
            "fuenteProduccion": "MAFF", "anioProduccion": 2024,
            "nacional": round(nacional), "ha": 0,
            "regiones": {c: [round(t), e] for c, (t, e) in regiones.items() if round(t) > 0},
            **({"comercio": extra[clave]["comercio"]} if clave in extra and extra[clave]["comercio"] else {}),
        }
    destino = escribir_pais(datos)
    print(f"-> {destino.name} ({destino.stat().st_size / 1e3:.0f} kB) · población {sum(pob.values()):,}")
    resumen(datos)


if __name__ == "__main__":
    main()

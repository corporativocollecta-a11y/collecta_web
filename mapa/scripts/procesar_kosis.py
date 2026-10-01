"""
Vista Corea del Sur: producción por provincia (17 시도) de la Encuesta de producción de cultivos (농작물생산조사) de
Estadística de Corea (국가데이터처), publicada en KOSIS, y población registrada por provincia. Comercio con FAOSTAT
mediante el motor común.

Fuentes (KOSIS, https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=…, consulta pública sin registro):
  - DT_1ET0292 과실생산량(성과수+미과수): fruta por provincia (manzana y pera 2025; durazno, uva, cítricos y caqui 2024).
  - DT_1ET0027 채소생산량(과채류): sandía, melón coreano, fresa, pepino, calabaza, tomate (2024).
  - DT_1ET0028 채소생산량(엽채류): col china, repollo, lechuga (2024).
  - DT_1ET0029 채소생산량(근채류): zanahoria (2024).
  - DT_1ET0291 채소생산량(조미채소): chile (seco + verde, 2024) y cebolla (2025).
  - DT_1ET0026 서류생산량: papa (2024).
  - DT_1B040A3 주민등록인구: población registrada por provincia, junio de 2026 (último mes antes de la fusión
    Gwangju + Jeolla del Sur en 전남광주통합특별시; se mantienen las 17 provincias anteriores).
KOSIS bloquea las peticiones automatizadas ("비정상적인 서비스 이용"): las tablas se leyeron en el navegador con la
interfaz pública (selector de periodo) y se guardaron en data/fuentes/kr/*.json (superficie ha, producción t),
verificadas con una suma de control calculada en la página.

Uso:
  python scripts/procesar_kosis.py
Salida: data/sub_kr.js → window.SUBNACIONAL.KR
"""
import json
from pathlib import Path

from subnacional_comun import escribir_pais, fao_bruto, resumen

RAIZ = Path(__file__).resolve().parent.parent
F = RAIZ / "data" / "fuentes" / "kr"
M49 = "410"

REGIONES = {  # código de KOSIS → (nombre coreano base, nombre en español, lat, lon de la capital)
    "11": ("서울", "Seúl", 37.57, 126.98), "21": ("부산", "Busan", 35.18, 129.08), "22": ("대구", "Daegu", 35.87, 128.60),
    "23": ("인천", "Incheon", 37.46, 126.71), "24": ("광주", "Gwangju", 35.16, 126.85), "25": ("대전", "Daejeon", 36.35, 127.38),
    "26": ("울산", "Ulsan", 35.54, 129.31), "29": ("세종", "Sejong", 36.48, 127.29), "31": ("경기", "Gyeonggi", 37.27, 127.01),
    "32": ("강원", "Gangwon", 37.88, 127.73), "33": ("충청북", "Chungcheong del Norte", 36.64, 127.49),
    "34": ("충청남", "Chungcheong del Sur", 36.66, 126.67), "35": ("전", "Jeolla del Norte", 35.82, 127.15),
    "36": ("전라남", "Jeolla del Sur", 34.82, 126.46), "37": ("경상북", "Gyeongsang del Norte", 36.57, 128.73),
    "38": ("경상남", "Gyeongsang del Sur", 35.24, 128.69), "39": ("제주", "Jeju", 33.50, 126.53),
}
NOMBRES_KOSIS = {  # variantes de nombre en las tablas (antes y después de los cambios de 2023-2024)
    "서울특별시": "11", "부산광역시": "21", "대구광역시": "22", "인천광역시": "23", "광주광역시": "24", "대전광역시": "25",
    "울산광역시": "26", "세종특별자치시": "29", "경기도": "31", "강원도": "32", "강원특별자치도": "32", "충청북도": "33",
    "충청남도": "34", "전라북도": "35", "전북특별자치도": "35", "전라남도": "36", "경상북도": "37", "경상남도": "38",
    "제주도": "39", "제주특별자치도": "39",
}
TOTAL = {"계", "전국"}

# producto → (archivo, año, [cultivos KOSIS])
PRODUCTOS = {
    "manzana": ("DT_1ET0292_fruta", "2025", ["사과"]),
    "pera": ("DT_1ET0292_fruta", "2025", ["배"]),
    "durazno": ("DT_1ET0292_fruta", "2024", ["복숭아"]),
    "uva": ("DT_1ET0292_fruta", "2024", ["포도"]),
    "mandarina": ("DT_1ET0292_fruta", "2024", ["감귤"]),
    "caqui": ("DT_1ET0292_fruta", "2024", ["감"]),
    "sandia": ("DT_1ET0027_fruta_hortaliza", "2024", ["수박"]),
    "melon": ("DT_1ET0027_fruta_hortaliza", "2024", ["참외"]),
    "fresa": ("DT_1ET0027_fruta_hortaliza", "2024", ["딸기"]),
    "pepino": ("DT_1ET0027_fruta_hortaliza", "2024", ["오이"]),
    "calabacita": ("DT_1ET0027_fruta_hortaliza", "2024", ["호박"]),
    "jitomate": ("DT_1ET0027_fruta_hortaliza", "2024", ["토마토"]),
    "col": ("DT_1ET0028_hoja", "2024", ["배추", "양배추"]),
    "lechuga": ("DT_1ET0028_hoja", "2024", ["상추"]),
    "zanahoria": ("DT_1ET0029_raiz", "2024", ["당근"]),
    "chile": ("DT_1ET0291_condimento", "2024", ["고추"]),
    "cebolla": ("DT_1ET0291_condimento", "2025", ["양파"]),
    "papa": ("DT_1ET0026_papa", "2024", ["감자"]),
}
FAO_EXTRA = {"mandarina": "495", "col": "358", "caqui": "587"}   # comercio del archivo bruto de FAOSTAT
NOMBRES = {"melon": "Melón coreano (chamoe)", "mandarina": "Mandarina (cítricos de Jeju)", "col": "Col china y repollo",
           "caqui": "Caqui", "chile": "Chile (seco y verde)", "calabacita": "Calabaza y calabacita"}
NOTAS = {
    "melon": "Casi todo es melón coreano (참외), sobre todo de Seongju en Gyeongsang del Norte.",
    "mandarina": "Cítricos (감귤), casi en su totalidad mandarina de Jeju.",
    "col": "Col china (배추, base del kimchi) y repollo (양배추).",
    "chile": "Chile rojo seco (건고추) y chile verde (풋고추), en peso fresco del chile verde y seco del rojo, como lo publica KOSIS.",
    "manzana": "Cosecha 2025.", "pera": "Cosecha 2025.", "cebolla": "Cosecha 2025.",
    "caqui": "Caqui dulce (단감) y astringente (떫은감).",
}


def cargar(archivo):
    return json.loads((F / f"{archivo}.json").read_text(encoding="utf-8"))["datos"]


def poblacion():
    d = json.loads((F / "DT_1B040A3_poblacion_2026-06.json").read_text(encoding="utf-8"))["datos"]
    pob = {NOMBRES_KOSIS[n]: v for n, v in d.items() if n in NOMBRES_KOSIS}
    assert sum(pob.values()) == d["전국"], (sum(pob.values()), d["전국"])
    return pob


def main():
    pob = poblacion()
    extra = fao_bruto(M49, FAO_EXTRA)
    datos = {
        "codigo": "KR", "m49": M49, "pais": "Corea del Sur", "nivel": "provincia", "nivelPlural": "provincias", "femenino": True,
        "anio": 2024, "anioPoblacion": 2026,
        "fuente": "Estadística de Corea, Encuesta de producción de cultivos 2024-2025 (KOSIS), población registrada 2026, FAOSTAT",
        "fuenteCorta": "KOSIS 2024-25",
        "metodo": "Producción oficial por provincia (시도) de la Encuesta de producción de cultivos: cosecha 2025 para manzana, "
                  "pera y cebolla; 2024 para los demás (último año con todas las provincias). Población registrada a junio de 2026.",
        "limites": [[33.0, 124.6], [38.7, 131.0]],
        "regiones": {c: {"nombre": es, "lat": la, "lon": lo, "pob": pob.get(c)} for c, (_, es, la, lo) in REGIONES.items()},
        "productos": {},
    }
    for clave, (archivo, anio, cultivos) in PRODUCTOS.items():
        tabla = cargar(archivo)[anio]
        reg, nacional, ha = {}, 0.0, 0.0
        for cultivo in cultivos:
            for nombre, (area, t) in tabla[cultivo].items():
                if nombre in TOTAL:
                    nacional += t or 0
                    ha += area or 0
                else:
                    c = NOMBRES_KOSIS[nombre]
                    reg[c] = reg.get(c, 0) + (t or 0)
        suma = sum(reg.values())
        assert abs(suma - nacional) <= max(5, nacional * 0.002), (clave, suma, nacional)   # conciliación con el total
        datos["productos"][clave] = {
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            **({"nota": NOTAS[clave]} if clave in NOTAS else {}),
            "fuenteProduccion": "KOSIS", "anioProduccion": int(anio),
            "nacional": round(nacional), "ha": round(ha),
            "regiones": {c: [round(t), 0] for c, t in reg.items() if round(t) > 0},
            **({"comercio": extra[clave]["comercio"]} if clave in extra and extra[clave]["comercio"] else {}),
        }
    destino = escribir_pais(datos)
    print(f"-> {destino.name} ({destino.stat().st_size / 1e3:.0f} kB) · población {sum(pob.values()):,}")
    resumen(datos)


if __name__ == "__main__":
    main()

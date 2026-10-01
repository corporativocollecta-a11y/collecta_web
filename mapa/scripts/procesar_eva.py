"""
Vista Colombia: producción por departamento de las Evaluaciones Agropecuarias Municipales (EVA) del Ministerio de
Agricultura / UPRA, y población de las proyecciones del DANE. Comercio con FAOSTAT mediante el motor común.

Fuentes:
  - EVA 2019-2025, base agrícola (datos.gov.co, conjunto uejq-wxrr, API Socrata sin clave). Producción municipal
    por semestre (cultivos transitorios, periodos A y B) o anual (permanentes); se suma por departamento.
  - Proyecciones de población DANE con base en el Censo 2018 (población urbana + rural), tomadas de la descarga
    "Demografía y población" de TerriData (DNP), porque el sitio del DANE bloquea las descargas automáticas.
    https://terridata.dnp.gov.co/assets/docs/txt/dimensiones/TerriData_Dim2.txt.zip

Uso:
  python scripts/procesar_eva.py [año=2025]
Salida: data/sub_co.js → window.SUBNACIONAL.CO
Las descargas crudas se guardan en data/fuentes/eva/ y data/fuentes/dane/.
"""
import json
import sys
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

from subnacional_comun import escribir_pais, resumen

RAIZ = Path(__file__).resolve().parent.parent
CACHE = RAIZ / "data" / "fuentes" / "eva"
TERRIDATA = RAIZ / "data" / "fuentes" / "dane" / "TerriData_Dim2.txt.zip"
URL_TERRIDATA = "https://terridata.dnp.gov.co/assets/docs/txt/dimensiones/TerriData_Dim2.txt.zip"

# producto del mapa → cultivos EVA (nombre exacto del campo "cultivo"), alineados con las partidas de FAOSTAT
PRODUCTOS = {
    "jitomate": ["Tomate"], "chile": ["Ají", "Pimentón"], "cebolla": ["Cebolla de bulbo"], "papa": ["Papa"],
    "zanahoria": ["Zanahoria"], "lechuga": ["Lechuga"], "fresa": ["Fresa"], "brocoli": ["Brócoli"],
    "coliflor": ["Coliflor"], "pepino": ["Pepino Cohombro"], "berenjena": ["Berenjena"], "esparrago": ["Espárrago"],
    "sandia": ["Patilla"], "melon": ["Melón"], "calabacita": ["Ahuyama", "Calabacín, calabaza"],
    "aguacate": ["Aguacate"], "platano": ["Plátano", "Banano"], "pina": ["Piña"], "naranja": ["Naranja"],
    "limon": ["Limón"], "mango": ["Mango"], "papaya": ["Papaya"], "guayaba": ["Guayaba"], "uva": ["Uva"],
    "pera": ["Pera"], "durazno": ["Durazno o albaricoque"], "manzana": ["Manzana"], "toronja": ["Toronja", "Pomelo"],
    "arandano": ["Arándano"], "zarzamora": ["Mora"],
    # Solo vistas por país (data/productos_paises.js): sin partida propia en la FAO, por lo tanto sin comercio
    "tomate_arbol": ["Tomate de árbol"], "lulo": ["Lulo"], "maracuya": ["Maracuyá"], "uchuva": ["Uchuva"],
    "gulupa": ["Gulupa o cholupa"], "granadilla": ["Granadilla"], "mandarina": ["Mandarina"], "cebolla_rama": ["Cebolla de rama"],
}
SIN_PARTIDA_FAO = ("tomate_arbol", "lulo", "maracuya", "uchuva", "gulupa", "granadilla", "mandarina", "cebolla_rama")
NOMBRES = {"arandano": "Arándano", "zarzamora": "Mora (zarzamora)"}
NOTAS = {
    "chile": "Ají y pimentón juntos, como la partida de chiles y pimientos verdes de la FAO.",
    "cebolla": "Solo cebolla de bulbo. La cebolla de rama (larga), muy consumida en Colombia, es otro cultivo: 467 mil t en 2025.",
    "platano": "Plátano y banano juntos (de exportación y de consumo interno), como en la FAO.",
    "calabacita": "Ahuyama, calabacín y calabaza.",
    "coliflor": "Su comercio está dentro de la partida de brócoli de la FAO; sin datos de comercio propios.",
    "guayaba": "Su comercio está dentro de la partida del mango de la FAO; sin datos de comercio propios.",
    "zarzamora": "Mora de Castilla. La FAO no separa su comercio; sin datos de comercio propios.",
    "arandano": "Solo arándano; la mora va aparte.",
    **{k: "La FAO no separa su comercio (va en partidas agregadas como \"otras frutas\"): el balance supone que todo "
          "lo producido se consume en el país, aunque una parte se exporta." for k in
       ("tomate_arbol", "lulo", "maracuya", "uchuva", "gulupa", "granadilla")},
    "mandarina": "El comercio de mandarina no está en este mapa: el balance supone que lo producido se consume en el país.",
    "cebolla_rama": "Cebolla larga o junca. La FAO no separa su comercio: el balance supone que lo producido se consume en el país.",
}

# Departamentos: código DANE → (nombre, lat, lon de la capital)
DEPTOS = {
    "05": ("Antioquia", 6.25, -75.56), "08": ("Atlántico", 10.96, -74.80), "11": ("Bogotá D. C.", 4.61, -74.08),
    "13": ("Bolívar", 10.39, -75.51), "15": ("Boyacá", 5.54, -73.36), "17": ("Caldas", 5.07, -75.52),
    "18": ("Caquetá", 1.61, -75.61), "19": ("Cauca", 2.44, -76.61), "20": ("Cesar", 10.46, -73.25),
    "23": ("Córdoba", 8.75, -75.88), "25": ("Cundinamarca", 5.03, -74.30), "27": ("Chocó", 5.69, -76.66),
    "41": ("Huila", 2.93, -75.28), "44": ("La Guajira", 11.54, -72.91), "47": ("Magdalena", 11.24, -74.20),
    "50": ("Meta", 4.14, -73.63), "52": ("Nariño", 1.21, -77.28), "54": ("Norte de Santander", 7.89, -72.50),
    "63": ("Quindío", 4.53, -75.68), "66": ("Risaralda", 4.81, -75.69), "68": ("Santander", 7.12, -73.12),
    "70": ("Sucre", 9.30, -75.40), "73": ("Tolima", 4.44, -75.23), "76": ("Valle del Cauca", 3.45, -76.53),
    "81": ("Arauca", 7.08, -70.76), "85": ("Casanare", 5.34, -72.39), "86": ("Putumayo", 1.15, -76.65),
    "88": ("San Andrés y Providencia", 12.58, -81.70), "91": ("Amazonas", -4.21, -69.94), "94": ("Guainía", 3.87, -67.92),
    "95": ("Guaviare", 2.57, -72.64), "97": ("Vaupés", 1.25, -70.23), "99": ("Vichada", 6.19, -67.49),
}


def reparar(s):
    """El conjunto EVA trae UTF-8 leído como Latin-1 (p. ej. 'PlÃ¡tano')."""
    try:
        return s.encode("latin-1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return s


def eva(anio):
    """Producción y área cosechada por departamento y cultivo (suma de municipios y periodos)."""
    CACHE.mkdir(parents=True, exist_ok=True)
    archivo = CACHE / f"eva_{anio}_departamento_cultivo.json"
    if not archivo.exists():
        consulta = {
            "$select": "c_digo_dane_departamento as d, cultivo, sum(producci_n) as t, sum(rea_cosechada) as ha",
            "$where": f"a_o='{anio}'",
            "$group": "c_digo_dane_departamento, cultivo",
            "$limit": "50000",
        }
        url = "https://www.datos.gov.co/resource/uejq-wxrr.json?" + urllib.parse.urlencode(consulta)
        with urllib.request.urlopen(url, timeout=180) as r:
            archivo.write_bytes(r.read())
    filas = json.loads(archivo.read_text(encoding="utf-8"))
    return [(f["d"].zfill(2), reparar(f["cultivo"]).strip(), float(f.get("t") or 0), float(f.get("ha") or 0)) for f in filas]


def poblacion(anio):
    """Población total (urbana + rural) por departamento, proyecciones DANE vía TerriData."""
    if not TERRIDATA.exists():
        TERRIDATA.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(URL_TERRIDATA, TERRIDATA)
    texto = zipfile.ZipFile(TERRIDATA).read("TerriData_Dim2.txt").decode("utf-8-sig", errors="replace")
    pob = {}
    for linea in texto.splitlines()[1:]:
        c = linea.split("|")
        # entidad departamental = XX000; Bogotá es 11001
        if len(c) < 10 or c[9] != str(anio) or not (c[2].endswith("000") or c[2] == "11001"):
            continue
        if c[6] in ("Población urbana", "Población rural") or c[6].endswith("n urbana") or c[6].endswith("n rural"):
            if c[6].startswith("Porcentaje"):
                continue
            pob[c[0]] = pob.get(c[0], 0) + float(c[7].replace(".", "").replace(",", "."))
    return {d: round(v) for d, v in pob.items()}


def main(anio=2025):
    pob = poblacion(anio)
    filas = eva(anio)
    cultivos = {c for _, c, _, _ in filas}
    faltan = [c for lista in PRODUCTOS.values() for c in lista if c not in cultivos]
    if faltan:
        print("  cultivos no encontrados en EVA:", faltan)

    datos = {
        "codigo": "CO", "m49": "170", "pais": "Colombia", "nivel": "departamento", "nivelPlural": "departamentos",
        "anio": anio, "anioPoblacion": anio,
        "fuente": f"EVA {anio} (MinAgricultura/UPRA), DANE proyecciones de población {anio}, FAOSTAT",
        "fuenteCorta": f"EVA {anio}",
        "metodo": "Evaluaciones Agropecuarias Municipales (EVA): producción oficial por municipio sumada por departamento, "
                  "sin estimaciones propias. Población: proyecciones DANE (Censo 2018) publicadas en TerriData.",
        "limites": [[-4.3, -79.2], [12.6, -66.8]],
        "regiones": {d: {"nombre": n, "lat": la, "lon": lo, "pob": pob.get(d)} for d, (n, la, lo) in DEPTOS.items()},
        "productos": {},
    }
    for clave, lista in PRODUCTOS.items():
        prod, area = {}, 0.0
        for d, c, t, ha in filas:
            if c in lista and t > 0 and d in DEPTOS:
                prod[d] = prod.get(d, 0) + t
                area += ha
        if not prod:
            print(f"  (sin datos {anio}: {clave})")
            continue
        datos["productos"][clave] = {
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            **({"nota": NOTAS[clave]} if clave in NOTAS else {}),
            "fuenteProduccion": "EVA", "anioProduccion": anio,
            "nacional": round(sum(prod.values())), "ha": round(area),
            "regiones": {d: [round(t), 0] for d, t in prod.items()},
        }

    destino = escribir_pais(datos, sin_comercio=("coliflor", "guayaba", "zarzamora") + SIN_PARTIDA_FAO)
    print(f"→ {destino.name} ({destino.stat().st_size / 1e3:.0f} kB)")
    resumen(datos)


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 2025)

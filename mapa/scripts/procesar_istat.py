"""
Vista Italia: producción por región del ISTAT (coltivazioni: superfici e produzione) y población residente del ISTAT.
Comercio con FAOSTAT mediante el motor común (scripts/subnacional_comun.py).

Fuentes (API SDMX del ISTAT, sin clave; es lenta, 1-3 minutos por consulta):
  - Dataflow 101_1015_DF_DCSP_COLTIVAZIONI_1: producción cosechada (HP_Q_EXT, quintales) por región, año y cultivo.
  - Dataflow 22_289_DF_DCIS_POPRES1_1: población residente al 1 de enero por región.
  https://esploradati.istat.it/SDMXWS/rest/data/…

Campo e invernadero se suman (el ISTAT los publica por separado). Trentino-Alto Adige = ITDA (Bolzano + Trento).

Uso:
  python scripts/procesar_istat.py [año=2025]
Salida: data/sub_it.js → window.SUBNACIONAL.IT
"""
import csv
import sys
import urllib.request
from pathlib import Path

from subnacional_comun import escribir_pais, resumen

RAIZ = Path(__file__).resolve().parent.parent
CACHE = RAIZ / "data" / "fuentes" / "istat"
API = "https://esploradati.istat.it/SDMXWS/rest/data/"

REGIONES = {  # código NUTS 2021 del ISTAT → (nombre, lat, lon de la capital)
    "ITC1": ("Piamonte", 45.07, 7.69), "ITC2": ("Valle de Aosta", 45.74, 7.32), "ITC3": ("Liguria", 44.41, 8.93),
    "ITC4": ("Lombardía", 45.46, 9.19), "ITDA": ("Trentino-Alto Adigio", 46.07, 11.12), "ITD3": ("Véneto", 45.44, 12.32),
    "ITD4": ("Friuli-Venecia Julia", 45.65, 13.78), "ITD5": ("Emilia-Romaña", 44.49, 11.34), "ITE1": ("Toscana", 43.77, 11.25),
    "ITE2": ("Umbría", 43.11, 12.39), "ITE3": ("Marcas", 43.62, 13.52), "ITE4": ("Lacio", 41.90, 12.50),
    "ITF1": ("Abruzos", 42.35, 13.40), "ITF2": ("Molise", 41.56, 14.66), "ITF3": ("Campania", 40.85, 14.27),
    "ITF4": ("Apulia", 41.12, 16.87), "ITF5": ("Basilicata", 40.64, 15.80), "ITF6": ("Calabria", 38.91, 16.59),
    "ITG1": ("Sicilia", 38.12, 13.36), "ITG2": ("Cerdeña", 39.22, 9.12),
}

# producto del mapa → códigos de cultivo del ISTAT (CL_AGRI_MADRE)
PRODUCTOS = {
    "jitomate": ["OFTTOT", "OFTP", "TOMAGRENNH"], "chile": ["REDRINOP", "REDRINGR"], "cebolla": ["ONIOOPENF"],
    "zanahoria": ["CARRNDPARS", "CARRGREENH"], "lechuga": ["LETTNOPEN", "LETTNGREEN"], "fresa": ["STRAIEINO", "STRAIEING"],
    "brocoli": ["CAULERAND"], "pepino": ["CUCUINOPE", "CUCUINGRE", "GHERINOPEN"], "berenjena": ["EGGINOPE", "EGGINGRE"],
    "esparrago": ["ASPAINGREOPEN", "ASPAINGRE"], "sandia": ["WATENINOP", "WATENINGR"], "melon": ["MELOOPENFI", "MELOGREENHO"],
    "calabacita": ["COURINOPE", "COURINGRE", "ZUCCA"], "papa": ["POTA", "EARLATOES"],
    "manzana": ["APPLE"], "pera": ["PEAR"], "durazno": ["PEACH", "NECTA"], "uva": ["TABLEGRAPES"],
    "naranja": ["ORANGE"], "limon": ["LEMLIME"], "toronja": ["POME"], "aguacate": ["AOAO"],
    "arandano": ["BUBRY", "ROUSPBERRI"],
    # Solo vistas por país (data/productos_paises.js)
    "mandarina": ["MANDAR", "CLEMENTINE"], "kiwi": ["KIWI"], "cereza": ["CHERR"],
}
NOMBRES = {"brocoli": "Coliflor y brócoli", "arandano": "Berries (arándano y frambuesa)", "chile": "Pimiento"}
NOTAS = {
    "jitomate": "Campo e invernadero; incluye el tomate para industria (5.4 Mt de 6.6 Mt), como la FAO.",
    "brocoli": "El ISTAT publica coliflor y brócoli juntos, igual que la partida de comercio de la FAO.",
    "papa": "Papa común y papa temprana.",
    "calabacita": "Calabacín (zucchini), calabaza y zapallo.",
    "durazno": "Durazno y nectarina.",
    "uva": "Solo uva de mesa (sin la de vinificación).",
    "mandarina": "Mandarina y clementina. Su comercio no está en este mapa: el balance supone que lo producido se consume en el país.",
    "kiwi": "Italia es de los mayores productores de kiwi del mundo. Su comercio no está en este mapa: el balance supone que lo producido se consume en el país, pero se exporta la mayor parte.",
    "cereza": "Cereza dulce y ácida. Su comercio no está en este mapa.",
}


def descargar(nombre, ruta_api):
    archivo = CACHE / nombre
    if not archivo.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(API + ruta_api, headers={
            "User-Agent": "Mozilla/5.0", "Accept": "application/vnd.sdmx.data+csv;version=1.0.0"})
        with urllib.request.urlopen(req, timeout=900) as r:
            archivo.write_bytes(r.read())
    return list(csv.DictReader(open(archivo, encoding="utf-8-sig")))


def main(anio=2025):
    cultivos = descargar("coltivazioni.csv", "IT1,101_1015_DF_DCSP_COLTIVAZIONI_1,1.0/all?startPeriod=2024")
    claves = "+".join(["IT"] + list(REGIONES))
    pobs = descargar("poblacion.csv", f"IT1,22_289_DF_DCIS_POPRES1_1,1.0/A.{claves}.JAN.9.TOTAL.99?startPeriod=2024")
    pob = {x["REF_AREA"]: int(x["OBS_VALUE"]) for x in pobs if x["TIME_PERIOD"] == str(anio) and x["REF_AREA"] in REGIONES}

    prod = {}   # (región, cultivo) → toneladas
    for x in cultivos:
        if x["DATA_TYPE"] == "HP_Q_EXT" and x["TIME_PERIOD"] == str(anio) and x["OBS_VALUE"]:
            prod[(x["REF_AREA"], x["TYPE_OF_CROP"])] = float(x["OBS_VALUE"]) / 10   # quintales → t

    datos = {
        "codigo": "IT", "m49": "380", "pais": "Italia", "nivel": "región", "nivelPlural": "regiones", "femenino": True,
        "anio": anio, "anioPoblacion": anio,
        "fuente": f"ISTAT coltivazioni {anio}, ISTAT población 1-ene-{anio}, FAOSTAT",
        "fuenteCorta": f"ISTAT {anio}",
        "metodo": "Producción cosechada por región del ISTAT (campo e invernadero), sin estimaciones propias. "
                  "Población residente al 1 de enero.",
        "limites": [[36.6, 6.6], [47.1, 18.6]],
        "regiones": {r: {"nombre": n, "lat": la, "lon": lo, "pob": pob.get(r)} for r, (n, la, lo) in REGIONES.items()},
        "productos": {},
    }
    for clave, codigos in PRODUCTOS.items():
        regiones = {}
        for r in REGIONES:
            t = sum(prod.get((r, c), 0) for c in codigos)
            if t > 0:
                regiones[r] = [round(t), 0]
        nacional = sum(prod.get(("IT", c), 0) for c in codigos)
        if nacional <= 0:
            print(f"  (sin datos {anio}: {clave})")
            continue
        suma = sum(v[0] for v in regiones.values())
        if abs(suma - nacional) > max(10, nacional * 0.01):
            print(f"  aviso {clave}: regiones {suma:,.0f} vs nacional {nacional:,.0f}")
        datos["productos"][clave] = {
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            **({"nota": NOTAS[clave]} if clave in NOTAS else {}),
            "fuenteProduccion": "ISTAT", "anioProduccion": anio,
            "nacional": round(nacional), "ha": 0, "regiones": regiones,
        }

    destino = escribir_pais(datos, sin_comercio=("mandarina", "kiwi", "cereza"))
    print(f"→ {destino.name} ({destino.stat().st_size / 1e3:.0f} kB) · población {sum(pob.values()):,}")
    resumen(datos)


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 2025)

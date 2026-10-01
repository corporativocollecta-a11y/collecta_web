"""
Vista Brasil: producción por estado (Unidade da Federação) del IBGE, Producción Agrícola Municipal (PAM),
y población estimada del IBGE. Comercio con FAOSTAT mediante el motor común (scripts/subnacional_comun.py).

Fuentes (API SIDRA del IBGE, sin clave):
  - Tabla 1612, cultivos temporales (clasificación 81) y tabla 1613, cultivos permanentes (clasificación 82):
    variable 214 = cantidad producida (t), 216 = área cosechada (ha).  https://apisidra.ibge.gov.br
  - Tabla 6579, población residente estimada (variable 9324).

Uso:
  python scripts/procesar_ibge.py [año=2025]
Salida: data/sub_br.js → window.SUBNACIONAL.BR
Las respuestas crudas se guardan en data/fuentes/ibge/ para auditoría.
"""
import json
import sys
import time
import urllib.request
from pathlib import Path

from subnacional_comun import escribir_pais, produccion_fao, resumen

RAIZ = Path(__file__).resolve().parent.parent
CACHE = RAIZ / "data" / "fuentes" / "ibge"

# producto del mapa → (tabla, clasificación, código de producto IBGE)
PRODUCTOS = {
    "jitomate": (1612, 81, 2715), "chile": (1612, 81, 83376), "cebolla": (1612, 81, 2697), "papa": (1612, 81, 2695),
    "zanahoria": (1612, 81, 83381), "lechuga": (1612, 81, 83375), "fresa": (1612, 81, 83378),
    "sandia": (1612, 81, 2709), "melon": (1612, 81, 2710), "calabacita": (1612, 81, 83374), "pina": (1612, 81, 2688),
    "aguacate": (1613, 82, 2717), "platano": (1613, 82, 2720), "naranja": (1613, 82, 2733), "limon": (1613, 82, 2734),
    "manzana": (1613, 82, 2735), "papaya": (1613, 82, 2736), "mango": (1613, 82, 2737), "guayaba": (1613, 82, 2731),
    "pera": (1613, 82, 2741), "durazno": (1613, 82, 2742), "uva": (1613, 82, 2748), "nuez": (1613, 82, 2740),
}
EN_FRUTOS = {"pina"}  # el IBGE la reporta en miles de frutos: se reparten las toneladas nacionales de FAOSTAT
NOMBRES = {"chile": "Pimiento morrón (pimentão)", "nuez": "Nuez (noz)"}
NOTAS = {
    "chile": "El IBGE solo registra pimiento morrón (pimentão); los chiles no están en la encuesta.",
    "pina": "El IBGE reporta la piña en miles de frutos: la producción nacional en toneladas es de FAOSTAT, repartida según los frutos de cada estado.",
    "nuez": "\"Noz (fruto seco)\" del IBGE: sobre todo nuez pecanera de Rio Grande do Sul. Sin datos de comercio propios.",
    "guayaba": "Su comercio está dentro de la partida del mango de la FAO; sin datos de comercio propios.",
    "calabacita": "Abóbora: calabaza y calabacita.",
    "lechuga": "Producción registrada por la PAM desde su ampliación a hortalizas.",
}

# Unidades de la Federación: código IBGE → (sigla, nombre, lat, lon de la capital)
UF = {
    "11": ("RO", "Rondônia", -8.76, -63.90), "12": ("AC", "Acre", -9.97, -67.81), "13": ("AM", "Amazonas", -3.10, -60.02),
    "14": ("RR", "Roraima", 2.82, -60.67), "15": ("PA", "Pará", -1.46, -48.50), "16": ("AP", "Amapá", 0.03, -51.07),
    "17": ("TO", "Tocantins", -10.18, -48.33), "21": ("MA", "Maranhão", -2.53, -44.30), "22": ("PI", "Piauí", -5.09, -42.80),
    "23": ("CE", "Ceará", -3.73, -38.52), "24": ("RN", "Rio Grande do Norte", -5.79, -35.21), "25": ("PB", "Paraíba", -7.12, -34.86),
    "26": ("PE", "Pernambuco", -8.05, -34.90), "27": ("AL", "Alagoas", -9.67, -35.74), "28": ("SE", "Sergipe", -10.91, -37.07),
    "29": ("BA", "Bahia", -12.97, -38.50), "31": ("MG", "Minas Gerais", -19.92, -43.94), "32": ("ES", "Espírito Santo", -20.32, -40.34),
    "33": ("RJ", "Rio de Janeiro", -22.90, -43.20), "35": ("SP", "São Paulo", -23.55, -46.63), "41": ("PR", "Paraná", -25.43, -49.27),
    "42": ("SC", "Santa Catarina", -27.60, -48.55), "43": ("RS", "Rio Grande do Sul", -30.03, -51.23),
    "50": ("MS", "Mato Grosso do Sul", -20.47, -54.62), "51": ("MT", "Mato Grosso", -15.60, -56.10), "52": ("GO", "Goiás", -16.68, -49.25),
    "53": ("DF", "Distrito Federal", -15.79, -47.88),
}


def sidra(ruta, nombre_cache):
    CACHE.mkdir(parents=True, exist_ok=True)
    archivo = CACHE / nombre_cache
    if archivo.exists():
        return json.loads(archivo.read_text(encoding="utf-8"))
    for intento in range(4):
        try:
            with urllib.request.urlopen("https://apisidra.ibge.gov.br/values" + ruta, timeout=120) as r:
                datos = json.loads(r.read().decode("utf-8"))
            archivo.write_text(json.dumps(datos, ensure_ascii=False), encoding="utf-8")
            time.sleep(0.5)
            return datos
        except Exception:
            if intento == 3:
                raise
            time.sleep(5 * (intento + 1))


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None  # "-", "..", "X" (sin dato o confidencial)


def main(anio=2025):
    # Población estimada por UF
    pob = {}
    for r in sidra(f"/t/6579/n3/all/v/9324/p/{anio}", f"poblacion_{anio}.json")[1:]:
        if num(r["V"]):
            pob[r["D1C"]] = int(num(r["V"]))

    datos = {
        "codigo": "BR", "m49": "076", "pais": "Brasil", "nivel": "estado", "nivelPlural": "estados",
        "anio": anio, "anioPoblacion": anio,
        "fuente": f"IBGE PAM {anio}, IBGE estimaciones de población {anio}, FAOSTAT",
        "fuenteCorta": f"IBGE PAM {anio}",
        "metodo": "Producción Agrícola Municipal (PAM) del IBGE: cifras oficiales por estado, sin estimaciones propias "
                  "(salvo la piña, reportada en miles de frutos).",
        "limites": [[-34, -74], [5.5, -34]],
        "regiones": {c: {"nombre": n, "sigla": s, "lat": la, "lon": lo, "pob": pob.get(c)} for c, (s, n, la, lo) in UF.items()},
        "productos": {},
    }

    for clave, (tabla, clasif, codigo) in PRODUCTOS.items():
        filas = sidra(f"/t/{tabla}/n3/all/v/214,216/p/{anio}/c{clasif}/{codigo}", f"pam_{anio}_{tabla}_{codigo}.json")[1:]
        prod = {r["D1C"]: num(r["V"]) for r in filas if r["D2C"] == "214" and num(r["V"])}
        area = {r["D1C"]: num(r["V"]) for r in filas if r["D2C"] == "216" and num(r["V"])}
        if not prod:
            print(f"  (sin datos {anio}: {clave})")
            continue
        total = sum(prod.values())
        if clave in EN_FRUTOS:
            nacional, _ = produccion_fao("076", clave)
            regiones = {c: [round(nacional * v / total), 1] for c, v in prod.items()}
            fuente = "IBGE (frutos) + FAOSTAT (t)"
        else:
            nacional = total
            regiones = {c: [round(v), 0] for c, v in prod.items()}
            fuente = "IBGE"
        datos["productos"][clave] = {
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            **({"nota": NOTAS[clave]} if clave in NOTAS else {}),
            "fuenteProduccion": fuente, "anioProduccion": anio,
            "nacional": round(nacional), "ha": round(sum(area.values())),
            "regiones": regiones,
        }

    destino = escribir_pais(datos, sin_comercio=("nuez", "guayaba"))
    print(f"→ {destino.name} ({destino.stat().st_size / 1e3:.0f} kB)")
    resumen(datos)


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 2025)

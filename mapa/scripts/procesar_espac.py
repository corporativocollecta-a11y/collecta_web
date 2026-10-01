"""
Vista Ecuador: producción por provincia de la Encuesta de Superficie y Producción Agropecuaria Continua (ESPAC) del
INEC y proyección de población por provincia del INEC (revisión 2025, base Censo 2022). Comercio con FAOSTAT.

Fuentes (https://www.ecuadorencifras.gob.ec):
  - ESPAC 2025, Tabulados_excel_2025.xlsx: una hoja por cultivo con superficie y producción (t) por provincia,
    en monocultivo ("Solo") y asociado; aquí se suman ambos.
  - Proyecciones de población, revisión 2025 (Provincial.zip, Tabulado_provincial_edad_quinquenal_1990-2035.xlsx):
    total por provincia al 30 de junio.

Uso:
  python scripts/procesar_espac.py [año=2025]
Salida: data/sub_ec.js → window.SUBNACIONAL.EC
"""
import sys
import unicodedata
from pathlib import Path

import openpyxl

from subnacional_comun import escribir_pais, resumen

RAIZ = Path(__file__).resolve().parent.parent
F = RAIZ / "data" / "fuentes" / "inec_ec"

PROV = {  # código INEC → (nombre, hoja de proyecciones, lat, lon de la capital)
    "01": ("Azuay", "azuay", -2.90, -79.00), "02": ("Bolívar", "bolivar", -1.59, -79.00),
    "03": ("Cañar", "cañar", -2.56, -78.94), "04": ("Carchi", "carchi", 0.81, -77.72),
    "05": ("Cotopaxi", "cotopaxi", -0.93, -78.62), "06": ("Chimborazo", "chimborazo", -1.67, -78.65),
    "07": ("El Oro", "el_oro", -3.26, -79.96), "08": ("Esmeraldas", "esmeraldas", 0.96, -79.65),
    "09": ("Guayas", "guayas", -2.19, -79.89), "10": ("Imbabura", "imbabura", 0.35, -78.12),
    "11": ("Loja", "loja", -3.99, -79.20), "12": ("Los Ríos", "los_rios", -1.80, -79.53),
    "13": ("Manabí", "manabi", -1.05, -80.45), "14": ("Morona Santiago", "morona", -2.31, -78.12),
    "15": ("Napo", "napo", -0.99, -77.81), "16": ("Pastaza", "pastaza", -1.49, -78.00),
    "17": ("Pichincha", "pichincha", -0.18, -78.47), "18": ("Tungurahua", "tungurahua", -1.25, -78.62),
    "19": ("Zamora Chinchipe", "zamora", -4.07, -78.95), "20": ("Galápagos", "galapagos", -0.90, -89.61),
    "21": ("Sucumbíos", "sucumbios", 0.09, -76.89), "22": ("Orellana", "orellana", -0.46, -76.99),
    "23": ("Santo Domingo de los Tsáchilas", "santo_domingo", -0.25, -79.17), "24": ("Santa Elena", "santa_elena", -2.23, -80.86),
}


def norm(t):
    return unicodedata.normalize("NFD", str(t)).encode("ascii", "ignore").decode().upper().strip()


POR_NOMBRE = {norm(n): c for c, (n, *_) in PROV.items()}
POR_NOMBRE["SANTO DOMINGO DE LOS TSACHILAS"] = "23"

# producto → hojas de ESPAC
PRODUCTOS = {
    "platano": ["T13", "T22", "T26"], "aguacate": ["T12"], "limon": ["T18"], "mango": ["T19"], "naranja": ["T21"],
    "pina": ["T25"], "brocoli": ["T31"], "papa": ["T43"], "jitomate": ["T46"],
    # solo vistas por país (data/productos_paises.js); sin partida propia de comercio en la FAO
    "maracuya": ["T20"], "tomate_arbol": ["T27"], "cebolla_rama": ["T33"],
}
NOTAS = {
    "platano": "Banano (sobre todo de exportación), orito y plátano juntos, como la partida de la FAO. Ecuador es el primer exportador de banano del mundo.",
    "brocoli": "Brócoli; casi todo se exporta congelado.",
    "cebolla_rama": "Cebolla blanca (de tallo).",
    "maracuya": "Su comercio no está separado en la FAO: el balance supone que lo producido se consume en el país.",
    "tomate_arbol": "Su comercio no está separado en la FAO.",
}
SIN_COMERCIO = ("maracuya", "tomate_arbol", "cebolla_rama")


def produccion(wb, hoja):
    ws = wb[hoja]
    filas = list(ws.iter_rows(values_only=True))
    cab = next(r for r in filas if r and "Región y Provincia" in [str(c).strip() if c else "" for c in r])
    col = next(i for i, c in enumerate(cab) if c and "PRODUCCI" in str(c).upper())
    nacional = next(r[col] for r in filas if r[1] and str(r[1]).strip() == "TOTAL NACIONAL")
    out, actual = {}, None
    for r in filas:
        nombre = str(r[1]).strip() if r[1] else None
        if nombre and norm(nombre) in POR_NOMBRE:
            actual = POR_NOMBRE[norm(nombre)]
        elif nombre:
            actual = None
        if actual and r[2] in ("Solo", "Asociado") and isinstance(r[col], (int, float)):
            out[actual] = out.get(actual, 0) + r[col]
    return out, nacional or 0


def poblacion(anio):
    wb = openpyxl.load_workbook(F / "Tabulado_provincial_edad_quinquenal_1990-2035.xlsx", read_only=True, data_only=True)
    pob = {}
    for c, (_, hoja, *_r) in PROV.items():
        filas = list(wb[f"{hoja}_n"].iter_rows(values_only=True))
        cab = next(r for r in filas if 1990 in r)
        i = list(cab).index(anio)
        total = next(r for r in filas if r[1] == "Total")
        pob[c] = int(round(total[i]))
    return pob


def main(anio=2025):
    pob = poblacion(anio)
    wb = openpyxl.load_workbook(F / f"Tabulados_excel_{anio}.xlsx", read_only=True, data_only=True)
    datos = {
        "codigo": "EC", "m49": "218", "pais": "Ecuador", "nivel": "provincia", "nivelPlural": "provincias", "femenino": True,
        "anio": anio, "anioPoblacion": anio,
        "fuente": f"INEC ESPAC {anio}, INEC proyecciones de población {anio} (base Censo 2022), FAOSTAT",
        "fuenteCorta": f"INEC ESPAC {anio}",
        "metodo": "Producción por provincia de la ESPAC del INEC (monocultivo más asociado), sin estimaciones propias. "
                  "Población proyectada por el INEC al 30 de junio.",
        "limites": [[-5.1, -81.2], [1.5, -75.1]],
        "regiones": {c: {"nombre": n, "lat": la, "lon": lo, "pob": pob[c]} for c, (n, _, la, lo) in PROV.items()},
        "productos": {},
    }
    for clave, hojas in PRODUCTOS.items():
        reg, nac = {}, 0.0
        for h in hojas:
            r, n = produccion(wb, h)
            nac += n
            for c, t in r.items():
                reg[c] = reg.get(c, 0) + t
        suma = sum(reg.values())
        if abs(suma - nac) > max(5, nac * 0.01):
            print(f"  aviso {clave}: provincias {suma:,.0f} vs nacional {nac:,.0f}")
        datos["productos"][clave] = {
            **({"nota": NOTAS[clave]} if clave in NOTAS else {}),
            "fuenteProduccion": "INEC", "anioProduccion": anio,
            "nacional": round(nac), "ha": 0,
            "regiones": {c: [round(t), 0] for c, t in reg.items() if t > 0},
        }
    destino = escribir_pais(datos, sin_comercio=SIN_COMERCIO)
    print(f"-> {destino.name} ({destino.stat().st_size / 1e3:.0f} kB) · población {sum(pob.values()):,}")
    resumen(datos)


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 2025)

"""
Vista Chile: producción por región. Chile publica por región la SUPERFICIE de frutales y hortalizas, no la
producción; por eso la producción nacional (FAOSTAT 2024) se reparte según la superficie oficial de cada región
(marcado como estimado). La papa y el tomate industrial sí tienen producción oficial por región (INE).

Fuentes (biblioteca digital de ODEPA, https://bibliotecadigital.odepa.gob.cl):
  - Encuesta de Superficie Hortícola 2024 (INE), cuadro 2: superficie por región y especie.
    Hortalizas-CuadroResultados-ESH2024.xlsx
  - Catastros frutícolas CIREN-ODEPA: superficie por región y especie (último catastro de cada región, 2022-2025).
    SuperficieFruticolaRegion-16.01.2026.xls
  - Cultivos anuales 2024/2025 (INE): superficie y producción por región (papa, tomate industrial).
    CultivosRegional072025.xls
  - Censo 2024 (INE): población residente por región (síntesis de resultados, tabla 1).
  - FAOSTAT 2024: producción nacional; cereza, kiwi y mandarina (producción y comercio) del archivo bruto de FAOSTAT.
La columna "Resto país" (regiones no encuestadas, cifras del censo agropecuario 2007) se reparte entre esas
regiones según su población.

Uso:
  python scripts/procesar_odepa.py
Salida: data/sub_cl.js → window.SUBNACIONAL.CL
"""
import csv
import io
import unicodedata
import zipfile
from pathlib import Path

import openpyxl
import xlrd

from subnacional_comun import escribir_pais, produccion_fao, resumen

RAIZ = Path(__file__).resolve().parent.parent
F = RAIZ / "data" / "fuentes" / "chile"
FAO = RAIZ / "data" / "fuentes" / "faostat"

REGIONES = {  # código INE → (nombre, lat, lon de la capital, población Censo 2024)
    "15": ("Arica y Parinacota", -18.48, -70.31, 244569), "01": ("Tarapacá", -20.21, -70.15, 369806),
    "02": ("Antofagasta", -23.65, -70.40, 635416), "03": ("Atacama", -27.37, -70.33, 299180),
    "04": ("Coquimbo", -29.90, -71.25, 832864), "05": ("Valparaíso", -33.05, -71.62, 1896053),
    "13": ("Metropolitana", -33.45, -70.67, 7400741), "06": ("O'Higgins", -34.17, -70.74, 987228),
    "07": ("Maule", -35.43, -71.66, 1123008), "16": ("Ñuble", -36.61, -72.10, 512289),
    "08": ("Biobío", -36.83, -73.05, 1613059), "09": ("La Araucanía", -38.74, -72.60, 1010423),
    "14": ("Los Ríos", -39.81, -73.25, 398230), "10": ("Los Lagos", -41.47, -72.94, 890284),
    "11": ("Aysén", -45.57, -72.07, 100745), "12": ("Magallanes", -53.16, -70.92, 166537),
}


def norm(t):
    t = unicodedata.normalize("NFD", str(t)).encode("ascii", "ignore").decode().lower()
    return " ".join(t.replace("\n", " ").split()).rstrip("0123456789").strip()


POR_NOMBRE = {norm(n): c for c, (n, *_) in REGIONES.items()}
POR_NOMBRE.update({"valparaiso": "05", "la araucania": "09", "los rios": "14", "aysen": "11", "nuble": "16",
                   "biobio": "08", "o'higgins": "06"})

# producto → especies de hortalizas (ESH) o de frutales (catastro)
HORT = {
    "jitomate": ["tomate consumo fresco"], "chile": ["aji", "pimiento"],
    "cebolla": ["cebolla de guarda", "cebolla temprana"], "zanahoria": ["zanahoria"], "lechuga": ["lechuga"],
    "brocoli": ["brocoli", "coliflor"], "pepino": ["pepino de ensalada"], "esparrago": ["esparrago"],
    "sandia": ["sandia"], "melon": ["melon"], "calabacita": ["zapallo italiano", "zapallo temprano y de guarda"],
}
FRUT = {
    "aguacate": ["palto"], "limon": ["limonero", "lima"], "naranja": ["naranjo"],
    "manzana": ["manzano rojo", "manzano verde"], "pera": ["peral", "peral asiatico"],
    "durazno": ["duraznero consumo fresco", "duraznero tipo conservero", "nectarino"],
    "arandano": ["arandano americano", "frambuesa", "moras cultivadas e hibridos"], "papaya": ["papayo"],
    # solo vistas por país; producción y comercio del archivo bruto de FAOSTAT
    "cereza": ["cerezo", "guindo agrio"], "kiwi": ["kiwi", "kiwi gold"], "mandarina": ["mandarino", "tangelo"],
}
FAO_EXTRA = {"cereza": "531", "kiwi": "592", "mandarina": "495"}
NOMBRES = {"brocoli": "Brócoli y coliflor", "arandano": "Berries (arándano, frambuesa y mora)", "chile": "Ají y pimiento"}
NOTAS = {
    "jitomate": "Tomate industrial con producción oficial por región (INE) más tomate fresco (total FAOSTAT menos el industrial) repartido según superficie.",
    "brocoli": "Brócoli y coliflor juntos, como la partida de la FAO.",
    "durazno": "Durazno de mesa y conservero, y nectarina.",
    "papa": "Producción oficial por región del INE (año agrícola 2024/2025).",
    "cereza": "Chile exporta casi 9 de cada 10 cerezas que produce (sobre todo a China).",
}


def filas_hort():
    ws = openpyxl.load_workbook(F / "Hortalizas-CuadroResultados-ESH2024.xlsx", data_only=True)["2"]
    filas = list(ws.iter_rows(values_only=True))
    cab = next(r for r in filas if r[1] == "Especies")
    cols = {i: norm(c) for i, c in enumerate(cab) if c and i > 2}
    area = {}
    for r in filas:
        if r[1] and r[1] not in ("Especies", "TOTAL") and isinstance(r[2], (int, float)):
            area[norm(r[1])] = {cols[i]: (v if isinstance(v, (int, float)) else 0) for i, v in enumerate(r) if i in cols}
    return area   # especie → {región normalizada | "resto pais": ha}


def filas_frut():
    b = xlrd.open_workbook(F / "SuperficieFruticolaRegion-16.01.2026.xls")
    area = {}
    for s in b.sheets():
        reg = POR_NOMBRE[norm(s.name)]
        cab = None
        for i in range(s.nrows):
            r = s.row_values(i)
            if str(r[0]).strip().lower() in ("especie", "especies"):
                cab = r
                ult = max(j for j, h in enumerate(cab) if isinstance(h, float))   # último catastro de la región
                continue
            if cab and r[0] and isinstance(r[ult], float):
                area.setdefault(norm(r[0]), {})[reg] = area.get(norm(r[0]), {}).get(reg, 0) + r[ult]
    return area


def cultivo_anual(nombre):
    """{región normalizada | 'resto pais': toneladas} de un cultivo anual (producción en quintales)."""
    s = xlrd.open_workbook(F / "CultivosRegional072025.xls").sheet_by_name("Superficie_producción_rdto")
    cab = next(s.row_values(i) for i in range(s.nrows) if s.row_values(i)[2] == "Total")
    for i in range(s.nrows):
        if str(s.row_values(i)[1]).strip() == nombre:
            prod = s.row_values(i + 2)
            assert prod[1].startswith("Producción"), prod
            return {norm(cab[j]): prod[j] / 10 for j in range(3, len(cab)) if isinstance(prod[j], float) and prod[j] > 0}
    raise KeyError(nombre)


def a_regiones(por_col):
    """Convierte {columna normalizada: valor} a {código: valor}; 'resto pais' se reparte por población."""
    out, resto = {}, 0.0
    for c, v in por_col.items():
        if c.startswith("resto pais"):
            resto += v
        elif c != "total" and v:
            out[POR_NOMBRE[c]] = out.get(POR_NOMBRE[c], 0) + v
    return out, resto


def repartir_resto(valores, resto, excluir):
    faltan = [c for c in REGIONES if c not in excluir]
    pob = sum(REGIONES[c][3] for c in faltan)
    for c in faltan:
        valores[c] = valores.get(c, 0) + resto * REGIONES[c][3] / pob
    return valores


def fao_extra():
    """Producción 2024 y comercio 2024 de FAOSTAT para cereza, kiwi y mandarina (archivo bruto de América)."""
    def leer(archivo):
        z = zipfile.ZipFile(FAO / archivo)
        n = next(x for x in z.namelist() if x.endswith(".csv") and "NOFLAG" not in x and "Codes" not in x
                 and "Elements" not in x and "Flags" not in x)
        r = csv.reader(io.TextIOWrapper(z.open(n), encoding="latin-1"))
        h = next(r)
        ix = {c: i for i, c in enumerate(h)}
        for row in r:
            if row[ix["Area Code (M49)"]].strip("'") == "152" and row[ix["Item Code"]] in FAO_EXTRA.values():
                yield row[ix["Item Code"]], row[ix["Element"]], float(row[ix["Y2024"]] or 0)
    prod = {i: v for i, e, v in leer("Production_Crops_Livestock_E_Americas.zip") if e == "Production"}
    com = {}
    for i, e, v in leer("Trade_CropsLivestock_E_Americas.zip"):
        clave = {"Export quantity": "exp", "Import quantity": "imp", "Export value": "expUSD", "Import value": "impUSD"}.get(e)
        if clave:
            com.setdefault(i, {})[clave] = round(v)
    return prod, com


def main():
    hort, frut = filas_hort(), filas_frut()
    extra_prod, extra_com = fao_extra()
    datos = {
        "codigo": "CL", "m49": "152", "pais": "Chile", "nivel": "región", "nivelPlural": "regiones", "femenino": True,
        "anio": 2024, "anioPoblacion": 2024,
        "fuente": "ODEPA/INE superficie hortícola 2024 y catastros frutícolas CIREN-ODEPA, INE cultivos anuales 2024/25, Censo 2024, FAOSTAT",
        "fuenteCorta": "ODEPA · INE",
        "metodo": "Chile publica por región la superficie de frutales y hortalizas, no la producción: la producción nacional "
                  "de FAOSTAT 2024 se reparte según la superficie oficial de cada región (estimado). Papa y tomate industrial "
                  "con producción oficial por región (INE 2024/25). Población del Censo 2024.",
        "limites": [[-54, -76], [-17.5, -66]],
        "regiones": {c: {"nombre": n, "lat": la, "lon": lo, "pob": p} for c, (n, la, lo, p) in REGIONES.items()},
        "productos": {},
    }

    def agregar(clave, nacional, regiones, fuente, extra=None):
        datos["productos"][clave] = {
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            **({"nota": NOTAS[clave]} if clave in NOTAS else {}),
            "fuenteProduccion": fuente, "anioProduccion": 2024,
            "nacional": round(nacional), "ha": 0,
            "regiones": {c: [round(t), e] for c, (t, e) in regiones.items() if round(t) > 0},
            **(extra or {}),
        }

    def por_superficie(nacional, areas):
        total = sum(areas.values())
        return {c: [nacional * a / total, 1] for c, a in areas.items() if a > 0}

    # Hortalizas: superficie ESH 2024 (resto país repartido por población entre las regiones no encuestadas)
    for clave, especies in HORT.items():
        por_col = {}
        for e in especies:
            for c, v in hort[e].items():
                por_col[c] = por_col.get(c, 0) + v
        areas, resto = a_regiones(por_col)
        areas = repartir_resto(areas, resto, excluir=set(areas) | {"15", "03", "04", "05", "13", "06", "07", "16", "08", "09"})
        nacional, _ = produccion_fao("152", clave)
        if clave == "jitomate":
            ind, resto_ind = a_regiones(cultivo_anual("Tomate Industrial"))
            ind = repartir_resto(ind, resto_ind, excluir=set(ind) | {"04", "05", "13", "06", "07", "16", "08", "09", "14", "10"})
            fresco = nacional - sum(ind.values())
            assert fresco > 0, (nacional, sum(ind.values()))
            reg = por_superficie(fresco, areas)
            for c, t in ind.items():
                reg[c] = [reg.get(c, [0, 0])[0] + t, 1]
            agregar(clave, nacional, reg, "INE + FAOSTAT")
        else:
            agregar(clave, nacional, por_superficie(nacional, areas), "FAOSTAT (por superficie)")

    # Frutales: último catastro CIREN-ODEPA de cada región
    for clave, especies in FRUT.items():
        areas = {}
        for e in especies:
            for c, v in frut.get(e, {}).items():
                areas[c] = areas.get(c, 0) + v
        if clave in FAO_EXTRA:
            item = FAO_EXTRA[clave]
            nacional = extra_prod[item]
            com = {**{"exp": 0, "imp": 0, "expUSD": 0, "impUSD": 0}, **extra_com.get(item, {}),
                   "origenes": [], "destinos": [], "desdeMX": [0, 0], "haciaMX": [0, 0]}
            agregar(clave, nacional, por_superficie(nacional, areas), "FAOSTAT (por superficie)", {"comercio": com})
        else:
            nacional, _ = produccion_fao("152", clave)
            agregar(clave, nacional, por_superficie(nacional, areas), "FAOSTAT (por superficie)")

    # Papa: producción oficial por región
    papa, resto = a_regiones(cultivo_anual("Papa"))
    publicadas = set(papa)
    papa = repartir_resto(papa, resto, excluir=publicadas | {"04", "05", "13", "06", "07", "16", "08", "09", "14", "10"})
    reg = {c: [t, 0 if c in publicadas else 1] for c, t in papa.items()}   # "resto país" repartido = estimado
    agregar("papa", sum(papa.values()), reg, "INE")

    destino = escribir_pais(datos)
    print(f"-> {destino.name} ({destino.stat().st_size / 1e3:.0f} kB) · población {sum(r[3] for r in REGIONES.values()):,}")
    resumen(datos)


if __name__ == "__main__":
    main()

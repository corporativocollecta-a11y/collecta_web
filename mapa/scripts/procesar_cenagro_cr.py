"""
Vista Costa Rica: producción por provincia. Costa Rica no publica producción agrícola por provincia: la Encuesta
Nacional Agropecuaria (ENA) del INEC es solo nacional. Por eso la producción nacional se reparte según la
superficie de cada provincia del VI Censo Nacional Agropecuario 2014 (CENAGRO) y todas las cifras por provincia
quedan marcadas como estimadas.

Fuentes:
  - INEC, VI Censo Nacional Agropecuario 2014, tomo "Cultivos agrícolas, forestales y ornamentales": cuadros de
    fincas y extensión por provincia de cada cultivo. Se usa la extensión COSECHADA (cultivos anuales) o la
    extensión EN EDAD DE PRODUCCIÓN (permanentes); las plantas dispersas no se cuentan.
    El sitio inec.cr responde 403 a descargas automáticas; se usa la copia del tomo publicada por la Oficina
    Nacional Forestal: https://onfcr.org/wp-content/uploads/media/uploads/documents/06.-cenagro-costa-rica.-cultivos-agricolas-forestales-y-ornamentales.pdf
  - INEC, Encuesta Nacional Agropecuaria 2024 (actividad agrícola), cuadros 4.1 y 4.3: producción nacional en
    toneladas métricas de cebolla, melón, papa, sandía, zanahoria, aguacate, banano, mango, naranja y plátano.
    https://admin.inec.cr/sites/default/files/2025-09/reagropecENAAGR%C3%8DCOLA2024-01_2.pdf
    (tomate, papaya y piña no se publican por tener coeficientes de variación altos).
  - FAOSTAT 2024: producción nacional del resto de productos (tomate, chile, lechuga, brócoli y coliflor, pepino,
    fresa, limón, papaya, piña).
  - INEC, Estimación de población y vivienda 2022 (Censo 2022), cuadro 4: población por provincia.
    https://admin.inec.cr/sites/default/files/2023-11/reResultadosEstimacionPoblacionVivienda2022_3.xlsx

Uso:
  python scripts/procesar_cenagro_cr.py
Salida: data/sub_cr.js → window.SUBNACIONAL.CR
"""
import re
from pathlib import Path

import openpyxl
import pdfplumber

from subnacional_comun import escribir_pais, fao_bruto, produccion_fao, resumen

RAIZ = Path(__file__).resolve().parent.parent
F = RAIZ / "data" / "fuentes" / "cr"
CENAGRO = F / "CENAGRO2014-cultivos-agricolas-forestales-ornamentales.pdf"
POBLACION = F / "reResultadosEstimacionPoblacionVivienda2022_3.xlsx"

PROVINCIAS = {  # código INEC → (nombre, lat, lon de la cabecera)
    "1": ("San José", 9.93, -84.08), "2": ("Alajuela", 10.02, -84.21), "3": ("Cartago", 9.86, -83.92),
    "4": ("Heredia", 10.00, -84.12), "5": ("Guanacaste", 10.63, -85.44), "6": ("Puntarenas", 9.98, -84.83),
    "7": ("Limón", 9.99, -83.03),
}
POR_NOMBRE = {n: c for c, (n, *_) in PROVINCIAS.items()}

# producto del mapa → cultivos del CENAGRO cuya superficie se suma
CULTIVOS = {
    "jitomate": ["tomate"], "chile": ["chile"], "cebolla": ["cebolla"], "papa": ["papa"], "zanahoria": ["zanahoria"],
    "lechuga": ["lechuga"], "brocoli": ["brócoli", "coliflor"], "pepino": ["pepino"], "sandia": ["sandía"],
    "melon": ["melón"], "fresa": ["fresa"],
    "aguacate": ["aguacate"], "platano": ["banano", "plátano"], "pina": ["piña"], "naranja": ["naranja"],
    "limon": ["limón"], "mango": ["mango"], "papaya": ["papaya"],
}
# La mandarina tiene superficie en el CENAGRO pero ni la ENA ni FAOSTAT publican su producción: no se incluye.
# Producción nacional oficial 2024 (t) de la ENA 2024, cuadros 4.1 (anuales) y 4.3 (permanentes)
ENA_2024 = {
    "cebolla": 25349.0, "melon": 58924.1, "papa": 30228.5, "sandia": 65593.2, "zanahoria": 17088.6,
    "aguacate": 10185.9, "platano": 2277988.4 + 72277.9, "mango": 18846.5, "naranja": 128069.5,
}
FAO_EXTRA = {}
NOMBRES = {"brocoli": "Brócoli y coliflor"}
NOTAS = {
    "brocoli": "Brócoli y coliflor juntos, como la partida de la FAO.",
    "platano": "Banano (Cavendish de exportación y criollo) y plátano juntos, como en la FAO: 2.28 millones de t de banano "
               "y 72 mil t de plátano según la ENA 2024.",
    "pina": "La ENA 2024 no publica la piña por falta de precisión estadística; producción de FAOSTAT.",
    "jitomate": "La ENA 2024 no publica el tomate por falta de precisión estadística; producción de FAOSTAT.",
    "papaya": "La ENA 2024 no publica la papaya por falta de precisión estadística; producción de FAOSTAT.",
}
NUM = re.compile(r"^-$|^\d[\d.]*(,\d+)?$")


def a_numero(t):
    return 0.0 if t == "-" else float(t.replace(".", "").replace(",", "."))


def lineas(pagina):
    """Filas de texto de la página; los números con separador de miles ('1 250,9') se unen por su posición."""
    filas = {}
    for w in pagina.extract_words():
        filas.setdefault(round(w["top"]), []).append(w)
    salida = []
    for top in sorted(filas):
        ws = sorted(filas[top], key=lambda w: w["x0"])
        celdas = []
        for w in ws:
            if celdas and NUM.match(w["text"]) and NUM.match(celdas[-1]["text"]) and w["x0"] - celdas[-1]["x1"] < 4 \
                    and re.fullmatch(r"\d{3}(,\d+)?", w["text"]):
                celdas[-1] = {**celdas[-1], "text": celdas[-1]["text"] + w["text"], "x1": w["x1"]}
            else:
                celdas.append(dict(w))
        salida.append([c["text"] for c in celdas])
    return salida


def superficies():
    """{cultivo: {código de provincia: ha cosechadas o en edad de producción}} de los cuadros por provincia."""
    pdf = pdfplumber.open(CENAGRO)
    filas = []
    for pg in pdf.pages:
        filas.extend(lineas(pg))
    textos = [" ".join(f) for f in filas]
    buscados = {c for lista in CULTIVOS.values() for c in lista}
    area = {}
    for i, t in enumerate(textos):
        if not t.startswith("Costa Rica:"):
            continue
        titulo = " ".join(textos[i:i + 4])   # el título ocupa hasta tres renglones
        m = re.match(r"Costa Rica: ?Total de fincas con cultivo de (.+?) por extensión", titulo)
        if not m or m.group(1) not in buscados or m.group(1) in area or "según provincia" not in titulo:
            continue
        cultivo, datos = m.group(1), {}
        for f in filas[i + 1:]:
            if f and f[0] == "CUADRO":
                break
            nombre = next((n for n in POR_NOMBRE if " ".join(f).startswith(n + " ")), None)
            if nombre and nombre not in datos:
                nums = [a_numero(x) for x in f[len(nombre.split()):] if NUM.match(x)]
                datos[nombre] = nums[2]   # fincas, sembrada, cosechada / en edad de producción, [plantas dispersas]
            if " ".join(f).startswith("Costa Rica ") and "total" not in datos:
                datos["total"] = [a_numero(x) for x in f[2:] if NUM.match(x)][2]
        total = datos.pop("total")
        assert abs(sum(datos.values()) - total) < 0.6, (cultivo, datos, total)   # cuadra con el total del cuadro
        area[cultivo] = {POR_NOMBRE[n]: v for n, v in datos.items()}
    faltan = buscados - set(area)
    assert not faltan, faltan
    return area


def poblacion():
    ws = openpyxl.load_workbook(POBLACION, data_only=True, read_only=True)["4"]
    pob = {}
    for r in ws.iter_rows(values_only=True):
        if r[0] and str(r[0]).strip() in POR_NOMBRE:
            pob[POR_NOMBRE[str(r[0]).strip()]] = int(r[2])   # columna 2022
    assert len(pob) == 7
    return pob


def main():
    area = superficies()
    pob = poblacion()
    extra = fao_bruto("188", FAO_EXTRA)
    datos = {
        "codigo": "CR", "m49": "188", "pais": "Costa Rica", "nivel": "provincia", "nivelPlural": "provincias", "femenino": True,
        "anio": 2024, "anioPoblacion": 2022,
        "fuente": "INEC Encuesta Nacional Agropecuaria 2024 y VI Censo Nacional Agropecuario 2014, INEC Censo 2022, FAOSTAT",
        "fuenteCorta": "INEC · ENA 2024",
        "metodo": "Costa Rica no publica producción agrícola por provincia (la ENA es solo nacional): la producción nacional "
                  "2024 (ENA del INEC o, si no la publica, FAOSTAT) se reparte según la superficie cosechada o en producción "
                  "de cada provincia en el Censo Agropecuario 2014 (estimado). Población del Censo 2022.",
        "limites": [[8.0, -86.0], [11.25, -82.5]],
        "regiones": {c: {"nombre": n, "lat": la, "lon": lo, "pob": pob[c]} for c, (n, la, lo) in PROVINCIAS.items()},
        "productos": {},
    }
    for clave, cultivos in CULTIVOS.items():
        sup = {}
        for c in cultivos:
            for p, ha in area[c].items():
                sup[p] = sup.get(p, 0) + ha
        if clave in ENA_2024:
            nacional, fuente = ENA_2024[clave], "INEC ENA (por superficie)"
        elif clave in FAO_EXTRA:
            nacional, fuente = extra[clave]["prod"], "FAOSTAT (por superficie)"
        else:
            nacional, fuente = produccion_fao("188", clave)[0], "FAOSTAT (por superficie)"
        total = sum(sup.values())
        p = {
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            **({"nota": NOTAS[clave]} if clave in NOTAS else {}),
            "fuenteProduccion": fuente, "anioProduccion": 2024,
            "nacional": round(nacional), "ha": 0,
            "regiones": {c: [round(nacional * a / total), 1] for c, a in sorted(sup.items()) if round(nacional * a / total) > 0},
        }
        if clave in FAO_EXTRA:
            p["comercio"] = extra[clave]["comercio"]
        datos["productos"][clave] = p

    destino = escribir_pais(datos)
    print(f"-> {destino.name} ({destino.stat().st_size / 1e3:.0f} kB)")
    for c, v in sorted(area.items()):
        print(f"   CENAGRO {c:10s} {sum(v.values()):>10,.1f} ha")
    resumen(datos)


if __name__ == "__main__":
    main()

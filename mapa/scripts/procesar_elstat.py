"""
Vista Grecia: producción por región (13 periferias, NUTS 2) de la Encuesta Agrícola Anual de ELSTAT
(Autoridad Estadística Helénica), "Areas and production" 2024 (último año publicado, resultados finales),
y población por región de Eurostat (1 de enero de 2025). Comercio con FAOSTAT mediante el motor común.

Fuentes:
  - ELSTAT, publicación SPG06 "Areas and production" 2024: https://www.statistics.gr/en/statistics/-/publication/SPG06/2024
    Cuadros (xlsx, por región y unidad regional; superficie en estremas y producción en toneladas):
      02F Melones, sandías y papas · 03a Hortalizas · 04 Viñedos (uva de mesa) · 05b Árboles frutales.
    Los enlaces de descarga pasan por redirecciones con cookie de sesión (se usa un CookieJar).
  - Eurostat demo_r_pjanaggr3: población al 1 de enero por región NUTS 2 (EL30…EL65).

Uso:
  python scripts/procesar_elstat.py
Salida: data/sub_gr.js → window.SUBNACIONAL.GR
"""
import html
import http.cookiejar
import json
import re
import urllib.request
from pathlib import Path

import openpyxl

from subnacional_comun import escribir_pais, fao_bruto, resumen

RAIZ = Path(__file__).resolve().parent.parent
F = RAIZ / "data" / "fuentes" / "gr"
ANIO, ANIO_POB = 2024, 2025
PAGINA = f"https://www.statistics.gr/en/statistics/-/publication/SPG06/{ANIO}"
CUADROS = {  # prefijo del título del cuadro en la página → (archivo local, hoja)
    "02F": (f"ELSTAT_{ANIO}_02F_melones_papa.xlsx", "ΠΙΝΑΚΑΣ 2(η)"),
    "03a": (f"ELSTAT_{ANIO}_03a_hortalizas.xlsx", "Sheet1"),
    "04.": (f"ELSTAT_{ANIO}_04_uva.xlsx", "Πίνακας4α"),
    "05b": (f"ELSTAT_{ANIO}_05b_arboles.xlsx", "Sheet1"),
}
EUROSTAT = ("https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_r_pjanaggr3?format=JSON&lang=EN"
            "&sex=T&age=TOTAL&unit=NR&sinceTimePeriod=2024")

REGIONES = {  # código NUTS 2021 → (nombre en griego de ELSTAT, nombre, lat, lon de la capital)
    "EL51": ("Ανατολικής Μακεδονίας και Θράκης", "Macedonia Oriental y Tracia", 41.12, 25.40),
    "EL52": ("Κεντρικής Μακεδονίας", "Macedonia Central", 40.64, 22.94),
    "EL53": ("Δυτικής Μακεδονίας", "Macedonia Occidental", 40.30, 21.79),
    "EL54": ("Ηπείρου", "Epiro", 39.66, 20.85),
    "EL61": ("Θεσσαλίας", "Tesalia", 39.64, 22.42),
    "EL62": ("Ιονίων Νήσων", "Islas Jónicas", 39.62, 19.92),
    "EL63": ("Δυτικής Ελλάδας", "Grecia Occidental", 38.25, 21.73),
    "EL64": ("Στερεάς Ελλάδας", "Grecia Central", 38.90, 22.43),
    "EL65": ("Πελοποννήσου", "Peloponeso", 37.51, 22.37),
    "EL30": ("Αττικής", "Ática", 37.98, 23.73),
    "EL41": ("Βορείου Αιγαίου", "Egeo Septentrional", 39.11, 26.55),
    "EL42": ("Νοτίου Αιγαίου", "Egeo Meridional", 37.44, 24.94),
    "EL43": ("Κρήτης", "Creta", 35.34, 25.13),
}

# producto del mapa → (cuadro, [columnas de producción en toneladas]); columna 0 = nombre de la región
PRODUCTOS = {
    "jitomate": ("03a", [27, 29, 31]), "chile": ("03a", [47, 49]), "cebolla": ("03a", [15]),
    "zanahoria": ("03a", [25]), "lechuga": ("03a", [21, 23]), "brocoli": ("03a", [3, 7]),
    "pepino": ("03a", [39, 41]), "berenjena": ("03a", [43, 45]), "esparrago": ("03a", [53]),
    "fresa": ("03a", [55]), "calabacita": ("03a", [37]),
    "sandia": ("02F", [3]), "melon": ("02F", [5]), "papa": ("02F", [8, 10, 12]),
    "uva": ("04.", [3]),
    "limon": ("05b", [3]), "naranja": ("05b", [6]), "pera": ("05b", [12]), "manzana": ("05b", [15]),
    "durazno": ("05b", [24]), "nuez": ("05b", [42]),
    # Solo vistas por país (data/productos_paises.js)
    "mandarina": ("05b", [9]), "kiwi": ("05b", [18]), "granada": ("05b", [21]), "chabacano": ("05b", [27]),
    "cereza": ("05b", [30]),
}
EXTRA_FAO = {"cereza": "531", "kiwi": "592", "mandarina": "495", "chabacano": "526", "nuez": "222"}
SIN_COMERCIO = ("granada",)
NOMBRES = {"brocoli": "Brócoli y coliflor", "chile": "Pimiento", "lechuga": "Lechuga y achicoria",
           "nuez": "Nuez de Castilla (nogal)"}
NOTAS = {
    "jitomate": "Tomate para industria (417 mil t), de mesa al aire libre y de invernadero.",
    "chile": "Pimiento al aire libre y de invernadero.",
    "cebolla": "Cebolla seca (sin cebolla tierna).",
    "lechuga": "Lechuga, achicoria y endibia, como la partida de la FAO.",
    "brocoli": "Brócoli y coliflor juntos, como la partida de comercio de la FAO.",
    "pepino": "Pepino al aire libre y de invernadero (sin pepinillo para encurtir).",
    "berenjena": "Al aire libre y de invernadero.",
    "calabacita": "Calabacita (zucchini), aire libre e invernadero; sin calabaza.",
    "papa": "Papa de primavera, de verano y de otoño-invierno (sin camote).",
    "uva": "Solo uva destinada a mesa (de todas las variedades de viñedo); sin la de vino ni la de pasas.",
    "durazno": "Durazno y nectarina (en buena parte para conserva).",
    "nuez": "Nuez de nogal, no pecanera. Comercio de la FAO: nuez con cáscara (partida 222).",
    "granada": "Su comercio no está en este mapa: el balance supone que lo producido se consume en el país.",
}


def descargar():
    """Descarga los cuadros de ELSTAT que falten (la página enlaza cada xlsx con redirecciones y cookie)."""
    F.mkdir(parents=True, exist_ok=True)
    if all((F / a).exists() for a, _ in CUADROS.values()) and (F / "eurostat_pop_gr.json").exists():
        return
    abridor = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    abridor.addheaders = [("User-Agent", "Mozilla/5.0")]
    pagina = abridor.open(PAGINA, timeout=120).read().decode("utf-8")
    for m in re.finditer(r'<a[^>]+href="([^"]*documents[^"]*)"[^>]*>(.*?)</a>', pagina, re.S):
        titulo = re.sub("<[^>]+>", "", m.group(2)).strip()
        for pref, (archivo, _) in CUADROS.items():
            if titulo.startswith(pref) and not (F / archivo).exists():
                (F / archivo).write_bytes(abridor.open(html.unescape(m.group(1)), timeout=180).read())
    if not (F / "eurostat_pop_gr.json").exists():
        url = EUROSTAT + "".join(f"&geo={g}" for g in list(REGIONES) + ["EL"])
        (F / "eurostat_pop_gr.json").write_bytes(urllib.request.urlopen(url, timeout=120).read())


def num(v):
    return float(v) if isinstance(v, (int, float)) else 0.0


def leer_cuadro(archivo, hoja):
    """{código NUTS o 'EL': fila} con las filas de total nacional y de región (no las unidades regionales)."""
    ws = openpyxl.load_workbook(F / archivo, data_only=True)[hoja]
    por_nombre = {g: c for c, (g, *_) in REGIONES.items()}
    filas = {}
    for r in ws.iter_rows(values_only=True):
        t = str(r[0] or "").strip()
        if t == "Σύνολο Ελλάδας":
            filas["EL"] = r
        elif t.startswith("Περιφέρεια "):
            filas[por_nombre[t[len("Περιφέρεια "):].strip()]] = r
    assert set(filas) == set(REGIONES) | {"EL"}, (archivo, set(REGIONES) - set(filas))
    return filas


def poblacion():
    d = json.loads((F / "eurostat_pop_gr.json").read_text(encoding="utf-8"))
    geo = d["dimension"]["geo"]["category"]["index"]
    t = d["dimension"]["time"]["category"]["index"]
    nt = len(t)
    return {g: int(d["value"][str(i * nt + t[str(ANIO_POB)])]) for g, i in geo.items() if g in REGIONES}


def main():
    descargar()
    cuadros = {k: leer_cuadro(a, h) for k, (a, h) in CUADROS.items()}
    pob = poblacion()
    extra = fao_bruto("300", EXTRA_FAO)
    datos = {
        "codigo": "GR", "m49": "300", "pais": "Grecia", "nivel": "región", "nivelPlural": "regiones", "femenino": True,
        "anio": ANIO, "anioPoblacion": ANIO_POB,
        "fuente": f"ELSTAT Encuesta Agrícola Anual {ANIO} (superficies y producción), Eurostat población 1-ene-{ANIO_POB}, FAOSTAT",
        "fuenteCorta": f"ELSTAT {ANIO}",
        "metodo": f"Producción {ANIO} por región (periferia, NUTS 2) de la Encuesta Agrícola Anual de ELSTAT (resultados "
                  "finales), sin estimaciones propias. Población de Eurostat.",
        "limites": [[34.8, 19.3], [41.8, 28.3]],
        "regiones": {c: {"nombre": n, "lat": la, "lon": lo, "pob": pob.get(c)} for c, (g, n, la, lo) in REGIONES.items()},
        "productos": {},
    }
    for clave, (cuadro, cols) in PRODUCTOS.items():
        filas = cuadros[cuadro]
        nacional = sum(num(filas["EL"][c]) for c in cols)
        regiones = {}
        for r in REGIONES:
            t = sum(num(filas[r][c]) for c in cols)
            if t > 0:
                regiones[r] = [round(t), 0]
        if nacional <= 0:
            print(f"  (sin datos: {clave})")
            continue
        suma = sum(v[0] for v in regiones.values())
        if abs(suma - nacional) > max(10, nacional * 0.01):
            print(f"  aviso {clave}: regiones {suma:,.0f} vs Grecia {nacional:,.0f}")
        datos["productos"][clave] = {
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            **({"nota": NOTAS[clave]} if clave in NOTAS else {}),
            "fuenteProduccion": "ELSTAT", "anioProduccion": ANIO,
            "nacional": round(nacional), "ha": 0, "regiones": regiones,
            **({"comercio": extra[clave]["comercio"]} if clave in extra and extra[clave]["comercio"] else {}),
        }
    destino = escribir_pais(datos, sin_comercio=SIN_COMERCIO)
    print(f"-> {destino.name} ({destino.stat().st_size / 1e3:.0f} kB) · población {sum(pob.values()):,}")
    resumen(datos)


if __name__ == "__main__":
    main()

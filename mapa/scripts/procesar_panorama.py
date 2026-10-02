"""
Extrae del PANORAMA AGROALIMENTARIO (SIAP/DGSIAP) el consumo anual per cápita y la producción
nacional del año de referencia para los productos del mapa, y descarga la proyección de
población de CONAPO para el año de análisis.

Fuentes:
  - Panorama Agroalimentario 2025 (datos 2024): https://nube.agricultura.gob.mx/panorama_dgsiap/2025.pdf
    (guardar en data/fuentes/Panorama_Agroalimentario_2025.pdf)
  - CONAPO, proyecciones de población por entidad, vía API de Data México (SE)

Uso:
  python scripts/procesar_panorama.py data/fuentes/Panorama_Agroalimentario_2025.pdf 2025

Requiere pypdf (pip install pypdf) para leer el PDF.
Salida: data/consumo_oficial.js → window.CONSUMO_OFICIAL y window.POBLACION_CONAPO
"""
import json
import re
import sys
import unicodedata
import urllib.request
from pathlib import Path

from pypdf import PdfReader

RAIZ = Path(__file__).resolve().parent.parent
POB_URL = ("https://www.economia.gob.mx/apidatamexico/tesseract/data.jsonrecords"
           "?cube=population_projection&drilldowns=State,Year&measures=Projected+Population&Year={anio}")

# Título de la ficha en el Panorama (normalizado, sin acentos) → producto del mapa
TITULOS = {
    "jitomate": ("jitomate",), "chile": ("chile verde", "chile"), "aguacate": ("aguacate",), "limon": ("limon",),
    "naranja": ("naranja",), "platano": ("platano",), "mango": ("mango",), "papa": ("papa",), "cebolla": ("cebolla",),
    "brocoli": ("brocoli",), "fresa": ("fresa",), "pepino": ("pepino",), "manzana": ("manzana",),
    # títulos en dos líneas: se compara también "línea 1 + línea 2" ("Tomate / verde", "Uva / fruta")
    "tomate_verde": ("tomate verde",), "calabacita": ("calabacita",), "lechuga": ("lechuga",),
    "sandia": ("sandia",), "melon": ("melon",), "papaya": ("papaya",), "pina": ("pina",),
    "uva": ("uva fruta",),  # uva de mesa; el Panorama tiene fichas aparte de "uva industrial" y "uva pasa"
    "toronja": ("toronja",), "pera": ("pera",), "durazno": ("durazno",),
    "arandano": ("arandano",), "berenjena": ("berenjena",), "coliflor": ("coliflor",), "esparrago": ("esparrago",),
    "frambuesa": ("frambuesa",), "guayaba": ("guayaba",), "nopal": ("nopales",), "nuez": ("nuez",),
    "zarzamora": ("zarzamora",),  # su 2.ª línea es texto corrido: coincide por la 1.ª línea
    # zanahoria: el Panorama 2025 no tiene ficha → la app usa el consumo de respaldo de data/productos.js
    # Granos: sus fichas dicen "Disponibilidad anual per cápita" (todos los usos). Maíz amarillo, sorgo y cebada dicen
    # "N/A" (uso pecuario e industrial): la app usa el consumo aparente. Los dos trigos se suman en "trigo" (ver main).
    "maiz_blanco": ("maiz blanco",), "frijol": ("frijol",), "arroz": ("arroz palay",), "soya": ("soya",),
    "garbanzo": ("garbanzo",), "trigo_panificable": ("trigo panificable",), "trigo_cristalino": ("trigo cristalino",),
}


def normalizar(t):
    return unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().strip().lower()


def fichas(reader):
    """Fichas de producto: página con 'Consumo anual'. El título es la línea siguiente al encabezado; como
    algunos títulos ocupan dos líneas ("Tomate / verde", "Uva / fruta") se entregan ambas variantes."""
    for i, pagina in enumerate(reader.pages):
        texto = pagina.extract_text() or ""
        if "Consumo anual" not in texto and "Disponibilidad" not in texto:
            continue
        lineas = [l.strip() for l in texto.splitlines() if l.strip()]
        k = next((n for n, l in enumerate(lineas) if l.startswith("Panorama Agroalimentario")), None)
        if k is not None and k + 1 < len(lineas):
            dos = " ".join(normalizar(" ".join(lineas[k + 1:k + 3])).split())
            yield i + 1, (normalizar(lineas[k + 1]), dos), texto


MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto",
         "Septiembre", "Octubre", "Noviembre", "Diciembre"]


def produccion_mensual(pagina):
    """Gráfica 'Producción mensual nacional (%)': cada porcentaje está justo debajo de la etiqueta de su
    mes en la columna derecha de la ficha. Se asigna cada número al mes cuya etiqueta tiene encima
    más cercana y se valida que los 12 sumen ≈ 100%."""
    frag = []
    pagina.extract_text(visitor_text=lambda s, cm, tm, fd, fs: frag.append((s.strip(), tm[4], tm[5])) if s.strip() else None)
    etiquetas = {}
    for s, x, y in frag:
        if s in MESES and x > 650 and y > 60:
            etiquetas.setdefault(s, set()).add(round(y))
    # una etiqueta puede repetirse en otras posiciones; se toma la serie con espaciado regular de arriba hacia abajo
    ys = []
    for i, m in enumerate(MESES):
        candidatos = sorted(etiquetas.get(m, []), reverse=True)
        if not candidatos:
            return None
        previo = ys[-1] if ys else 10_000
        y = next((c for c in candidatos if c < previo), None)
        if y is None:
            return None
        ys.append(y)
    numeros = [(float(s), y) for s, x, y in frag if re.fullmatch(r"\d+(\.\d+)?", s) and x > 650 and 60 < y < 800]
    valores = []
    for i, y in enumerate(ys):
        abajo = ys[i + 1] if i + 1 < len(ys) else y - 70
        en_rango = [v for v, yn in numeros if abajo < yn < y]
        if len(en_rango) != 1:
            return None
        valores.append(en_rango[0])
    return valores if abs(sum(valores) - 100) <= 1.5 else None


def main(pdf, anio):
    reader = PdfReader(pdf)
    resultado = {}
    todas = list(fichas(reader))
    paginas = reader.pages
    for clave, titulo in TITULOS.items():  # titulo: nombres aceptados
        for num, nombre, texto in todas:
            if not any(n in titulo for n in nombre):  # nombre: (línea 1, líneas 1+2)
                continue
            # 1) valor en kg/g que sigue a la etiqueta "Consumo anual" (evita pesos de fruto en la descripción,
            #    p. ej. sandía "de 2 hasta 20 kg"); 2) si no aparece así, único valor en kg/g de la ficha,
            #    descartando pesos de fruto ("500 g")
            i = texto.find("Consumo anual") if "Consumo anual" in texto else texto.find("Disponibilidad")
            despues = re.search(r"(\d+(?:\.\d+)?)\s*(kg|g)\b", texto[i:i + 200]) if i >= 0 else None
            if despues:
                valores = [(float(despues.group(1)), despues.group(2))]
            else:
                valores = [(float(v), u) for v, u in re.findall(r"(\d+(?:\.\d+)?)\s*(kg|g)\b", texto)]
            candidatos = [v if u == "kg" else v / 1000 for v, u in valores if not (u == "g" and v <= 500 and len(valores) > 1)]
            # con la etiqueta se admiten consumos pequeños (berenjena: 62 g); sin ella, se exige ≥ 100 g
            # granos ("Disponibilidad"): hasta 200 kg (maíz blanco 164 kg); frutas y hortalizas: hasta 45 kg
            tope = 200 if "Disponibilidad" in texto and "Consumo anual" not in texto else 45
            candidatos = [c for c in candidatos if (0.01 if despues else 0.1) <= c <= tope]
            if not candidatos:
                continue
            # producción nacional del año de datos: "21, 489, 704 toneladas 3, 723, 803 toneladas"
            prod = re.search(r"toneladas\s+([\d, ]+?)\s*toneladas", texto)
            resultado[clave] = {
                "consumoPC": candidatos[-1],
                "pagina": num,
                "mensual": produccion_mensual(paginas[num - 1]),
                "produccionRef": int(re.sub(r"\D", "", prod.group(1))) if prod else None,
            }
            break
        print(f"  {clave:9s} {resultado.get(clave, {}).get('consumoPC', 'NO ENCONTRADO')!s:>6} kg  (pág. {resultado.get(clave, {}).get('pagina')})"
              f"  producción de referencia: {resultado.get(clave, {}).get('produccionRef')}"
              f"  mensual: {resultado.get(clave, {}).get('mensual')}")

    # trigo = panificable + cristalino (el mapa tiene un solo trigo; el SIAP los publica aparte)
    tp, tc = resultado.pop("trigo_panificable", None), resultado.pop("trigo_cristalino", None)
    if tp and tc:
        resultado["trigo"] = {"consumoPC": round(tp["consumoPC"] + tc["consumoPC"], 1), "pagina": tp["pagina"], "mensual": None,
                              "produccionRef": (tp["produccionRef"] or 0) + (tc["produccionRef"] or 0) or None,
                              "partes": {"panificable": tp["consumoPC"], "cristalino": tc["consumoPC"]}}
        print(f"  trigo      {resultado['trigo']['consumoPC']} kg (panificable {tp['consumoPC']} + cristalino {tc['consumoPC']})")

    with urllib.request.urlopen(POB_URL.format(anio=anio), timeout=120) as r:
        pob = {str(x["State ID"]).zfill(2): x["Projected Population"] for x in json.loads(r.read())["data"]}
    print(f"Población CONAPO {anio}: {sum(pob.values()):,}")

    anio_datos = int(re.search(r"(\d{4})", Path(pdf).name).group(1)) - 1
    (RAIZ / "data" / "consumo_oficial.js").write_text(
        f"// Generado por scripts/procesar_panorama.py — Panorama Agroalimentario {anio_datos + 1} (SIAP, datos {anio_datos})"
        f" y proyección de población CONAPO {anio}\n"
        f"window.CONSUMO_OFICIAL = {json.dumps({'publicacion': anio_datos + 1, 'anioDatos': anio_datos, 'productos': resultado}, ensure_ascii=False)};\n"
        f"window.POBLACION_CONAPO = {json.dumps({'anio': int(anio), 'estados': pob})};\n"
        "Object.entries(window.CONSUMO_OFICIAL.productos).forEach(([k, v]) => {\n"
        "  const p = window.PRODUCTOS[k]; if (!p) return;\n"
        "  p.consumoPC = v.consumoPC; p.consumoOficial = true; p.paginaPanorama = v.pagina; p.produccionRef = v.produccionRef;\n"
        "  p.produccionMensual = v.mensual;\n"
        "});\n"
        "window.ESTADOS.forEach(e => { e.pob2020 = e.pob; e.pob = window.POBLACION_CONAPO.estados[e.id] ?? e.pob; });\n",
        encoding="utf-8",
    )
    print("Listo: data/consumo_oficial.js")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])

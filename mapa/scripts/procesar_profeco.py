"""
Procesa los precios AL CONSUMIDOR de PROFECO, programa "Quién es Quién en los Precios" (QQP),
para las frutas y hortalizas frescas del mapa.

Fuente: https://datos.profeco.gob.mx/datos_abiertos/qqp.php  (QQP_<año>.rar, CSV quincenales)
El RAR se lee en flujo con bsdtar (incluido en Windows 10/11 como C:\\Windows\\System32\\tar.exe,
o `bsdtar` en Linux/macOS); no se extrae a disco.

Uso:
  python scripts/procesar_profeco.py data/fuentes/QQP_2025.rar

Salida:
  data/precios_consumidor.js → window.PRECIOS_CONSUMIDOR: por producto del mapa
      precio      mediana nacional (MXN/kg)
      estados     {claveEstado: [mediana, registros]}
      giros       {tipo de comercio: [mediana, registros]}
      mensual     12 medianas mensuales
      variedades  {presentación: [mediana, registros]}
Solo usa la biblioteca estándar de Python.
"""
import csv
import io
import json
import re
import shutil
import statistics
import subprocess
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CATEGORIAS = (b"Frutas Frescas", b"Hortalizas Frescas", b"Condimentos")
# La nuez pecanera QQP la clasifica en "Condimentos"; de esa categoría solo se aceptan estos productos
SOLO_EN_CATEGORIA = {"Condimentos": {"nuez"}}
# Precio máximo plausible (MXN/kg) por producto; por omisión 500. La nuez en mitades supera ese valor.
PRECIO_MAX = {"nuez": 1500}

# producto QQP (normalizado) → producto del mapa
PRODUCTOS = {
    "jitomate": "jitomate", "chile fresco": "chile", "pimiento": "chile", "aguacate": "aguacate",
    "limon": "limon", "naranja": "naranja", "platano": "platano", "mango": "mango", "papa": "papa",
    "cebolla": "cebolla", "brocoli": "brocoli", "fresa": "fresa", "pepino": "pepino", "manzana": "manzana",
    # "Tomate" en QQP es el tomate verde ("Verde Sin Cáscara"); el rojo se registra como "Jitomate"
    "tomate": "tomate_verde", "calabaza": "calabacita", "zanahoria": "zanahoria",
    "lechuga": "lechuga",  # se vende por pieza: kilos() la descarta, no hay precio por kg
    "sandia": "sandia", "melon": "melon", "papaya": "papaya", "pina": "pina", "uva": "uva",
    "toronja": "toronja", "pera": "pera", "durazno": "durazno",  # "Perón" es otro producto y no se mapea
    "guayaba": "guayaba", "nopal": "nopal", "nuez": "nuez",
    "coliflor": "coliflor",  # se vende por pieza: kilos() la descarta
    # arándano, berenjena, espárrago, frambuesa y zarzamora no se registran en QQP como producto fresco
}
# Variedades excluidas para comparar la misma canasta que la muestra de mayoreo del SNIIM
EXCLUIR = {"chile": ("habanero", "arbol", "manzano", "caribe", "guero"),
           "platano": ("macho", "dominico", "manzano", "morado"),
           "calabacita": ("castilla", "de castilla"),      # calabaza madura, no calabacita
           "tomate_verde": ("rojo", "bola", "saladette"),  # por si algún registro de jitomate se capturó como "Tomate"
           "uva": ("pasa",),
           # nuez: se excluye la de Castilla (Juglans) y las bolsitas de 75–100 g (precio por kg ≈2× el granel)
           "nuez": ("castilla", "bolsa")}
ALIAS_ESTADO = {"ciudad de mexico": "09", "distrito federal": "09", "estado de mexico": "15", "mexico": "15",
                "coahuila de zaragoza": "05", "michoacan de ocampo": "16", "veracruz de ignacio de la llave": "30"}


def normalizar(t):
    return unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().strip().lower()


def kilos(presentacion):
    """Kilogramos que contiene la presentación; None si no es por peso (pieza, manojo)."""
    p = normalizar(presentacion)
    m = re.match(r"(\d+(?:\.\d+)?)\s*kg", p)
    if m:
        return float(m.group(1))
    m = re.search(r"(\d+(?:\.\d+)?)\s*gr", p)
    if m and ("paquete" in p or "canastilla" in p or "bolsa" in p or "charola" in p):
        return float(m.group(1)) / 1000
    return None


# El archivo fuente trae algunos acentos ya dañados (carácter U+FFFD); se reparan los más comunes
REPARAR = {"Jalape�o": "Jalapeño", "Cuaresme�o": "Cuaresmeño", "Morr�n": "Morrón", "�rbol": "Árbol",
           "Lim�n": "Limón", "Pl�tano": "Plátano", "Roat�n": "Roatán", "Portalim�n": "Portalimón",
           "Br�coli": "Brócoli", "D�anjou": "D'anjou", "Pi�a": "Piña", "Sand�a": "Sandía"}


def reparar(texto):
    for mal, bien in REPARAR.items():
        texto = texto.replace(mal, bien)
    return texto


def variedad(presentacion):
    partes = [x.strip() for x in reparar(presentacion).split(".") if x.strip()]
    resto = [x for x in partes if not re.match(r"^\d|^kg$|^granel$", normalizar(x))]
    return resto[0][:40] if resto else "Granel"


def bsdtar():
    for c in (r"C:\Windows\System32\tar.exe", shutil.which("bsdtar")):
        if c and Path(c).exists():
            return c
    sys.exit("Se requiere bsdtar (C:\\Windows\\System32\\tar.exe en Windows) para leer el RAR")


def estados():
    texto = (RAIZ / "data" / "estados.js").read_text(encoding="utf-8")
    return {normalizar(n): i for i, n in re.findall(r'id: "(\d\d)".*?nombre: "([^"]+)"', texto)}


def main(rar):
    tar, edos = bsdtar(), estados()
    archivos = [a for a in subprocess.run([tar, "-tf", rar], capture_output=True, text=True).stdout.split() if a.endswith(".csv")]
    precios = defaultdict(list)
    por = {g: defaultdict(list) for g in ("estados", "giros", "mes", "variedades")}
    anio, total = None, 0

    for archivo in sorted(archivos):
        proc = subprocess.Popen([tar, "-xOf", rar, archivo], stdout=subprocess.PIPE)
        encabezado = None
        n = 0
        for linea in proc.stdout:
            if encabezado is None:
                encabezado = next(csv.reader([linea.decode("utf-8-sig", "replace")]))
                continue
            if not any(c in linea for c in CATEGORIAS):  # filtro rápido antes de parsear
                continue
            try:
                texto = linea.decode("utf-8")
            except UnicodeDecodeError:
                texto = linea.decode("latin-1")
            fila = dict(zip(encabezado, next(csv.reader(io.StringIO(texto)))))
            clave = PRODUCTOS.get(normalizar(reparar(fila.get("producto", ""))))
            kg = kilos(fila.get("presentacion", ""))
            cat = fila.get("categoria", "").strip()
            if cat in SOLO_EN_CATEGORIA and clave not in SOLO_EN_CATEGORIA[cat]:
                continue
            if not clave or not kg:
                continue
            pres = normalizar(reparar(fila["presentacion"]))
            if any(x in pres for x in EXCLUIR.get(clave, ())):
                continue
            try:
                p = float(fila["precio"]) / kg
            except ValueError:
                continue
            if not 1 <= p <= PRECIO_MAX.get(clave, 500):
                continue
            fecha = fila["fecha_registro"]
            anio = anio or fecha[:4]
            e = normalizar(fila["estado"])
            e = edos.get(e) or ALIAS_ESTADO.get(e)
            precios[clave].append(p)
            if e:
                por["estados"][(clave, e)].append(p)
            por["giros"][(clave, fila["giro"].strip())].append(p)
            por["mes"][(clave, int(fecha[5:7]))].append(p)
            por["variedades"][(clave, variedad(fila["presentacion"]))].append(p)
            n += 1
        proc.wait()
        total += n
        print(f"  {archivo}: {n:,} registros de frutas y hortalizas del mapa")

    med = lambda v: [round(statistics.median(v), 2), len(v)]
    salida = {}
    for clave, v in precios.items():
        sub = lambda g, minimo=30: {k[1]: med(x) for k, x in por[g].items() if k[0] == clave and len(x) >= minimo}
        salida[clave] = {
            "precio": round(statistics.median(v), 2), "registros": len(v),
            "estados": sub("estados"), "giros": sub("giros"),
            "mensual": [med(por["mes"][(clave, m)])[0] if por["mes"].get((clave, m)) else None for m in range(1, 13)],
            "variedades": dict(sorted(sub("variedades", 100).items(), key=lambda x: -x[1][1])[:6]),
        }
    (RAIZ / "data" / "precios_consumidor.js").write_text(
        f"// Generado por scripts/procesar_profeco.py — PROFECO, Quién es Quién en los Precios {anio}, MXN/kg (mediana)\n"
        f"window.PRECIOS_CONSUMIDOR = {json.dumps({'anio': anio, 'productos': salida}, ensure_ascii=False, separators=(',', ':'))};\n",
        encoding="utf-8",
    )
    print(f"\n{total:,} registros. Mediana nacional al consumidor (MXN/kg):")
    for k, v in salida.items():
        print(f"  {k:9s} ${v['precio']:>6.2f}  {v['registros']:>8,} reg · {len(v['estados'])} estados · giros: {v['giros']}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])

"""
Procesa el Cierre de la Producción Agrícola MUNICIPAL del SIAP (datos abiertos)
y genera los archivos de datos que usa el mapa.

Uso:
  1. Descarga el CSV municipal del año deseado desde
     https://nube.agricultura.gob.mx/datosAbiertos/Agricola.php  (DGSIAP, "Cierre de la Producción Agrícola")
     y guárdalo en  data/fuentes/  (ej. data/fuentes/Cierre_agricola_mun_2025.csv)
  2. python scripts/procesar_siap.py data/fuentes/Cierre_agricola_mun_2025.csv

Salidas:
  - data/produccion_siap.js   → producción por entidad (reemplaza "estados" y "nacional"
                                 de data/productos.js al cargarse después de él)
  - data/produccion_municipal.js → producción, superficie cosechada y valor por municipio y producto

Solo usa la biblioteca estándar de Python.
"""
import csv
import json
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

# clave del producto en el mapa → nombres de cultivo en el SIAP (sin acentos, minúsculas)
CULTIVOS = {
    "jitomate": ["tomate rojo (jitomate)", "jitomate", "tomate rojo"],
    "chile": ["chile verde"],
    "aguacate": ["aguacate"],
    "limon": ["limon", "limon real"],
    "naranja": ["naranja"],
    "platano": ["platano"],
    "mango": ["mango"],
    "papa": ["papa"],
    "cebolla": ["cebolla"],
    "brocoli": ["brocoli"],
    "fresa": ["fresa"],
    "pepino": ["pepino"],
    "manzana": ["manzana"],
    "tomate_verde": ["tomate verde"],  # tomatillo (Physalis); distinto de "tomate rojo (jitomate)"
    "calabacita": ["calabacita"],      # no incluye "calabaza" (madura) ni "calabaza semilla o chihua"
    "zanahoria": ["zanahoria"],
    "lechuga": ["lechuga"],
    "sandia": ["sandia"],
    "melon": ["melon"],                # excluye "melon amargo"
    "papaya": ["papaya"],
    "pina": ["pina"],
    "uva": ["uva"],                    # el cierre 2025 solo publica "Uva" (mesa + vino; sin "uva pasa"/"industrial")
    "toronja": ["toronja (pomelo)", "toronja"],
    "pera": ["pera"],
    "durazno": ["durazno"],            # excluye "viveros de durazno" (plantas)
    "arandano": ["arandano"],
    "berenjena": ["berenjena"],
    "coliflor": ["coliflor"],
    "esparrago": ["esparrago"],
    "frambuesa": ["frambuesa"],
    "guayaba": ["guayaba"],
    "nopal": ["nopalitos"],            # nopal verdura; excluye "nopal forrajero"
    "nuez": ["nuez"],                  # nuez pecanera (Carya illinoinensis), con cáscara; excluye "viveros de nuez"
    "zarzamora": ["zarzamora"],
}


def normalizar(texto):
    texto = unicodedata.normalize("NFKD", str(texto)).encode("ascii", "ignore").decode()
    return texto.strip().lower()


def columna(encabezados, *candidatos):
    mapa = {normalizar(h): h for h in encabezados}
    for c in candidatos:
        if c in mapa:
            return mapa[c]
    raise KeyError(f"No se encontró ninguna columna {candidatos} en {list(encabezados)}")


def abrir_csv(ruta):
    # El SIAP publica en Latin-1; se valida el archivo completo, no solo el encabezado
    try:
        Path(ruta).read_bytes().decode("utf-8")
        cod = "utf-8-sig"
    except UnicodeDecodeError:
        cod = "latin-1"
    return open(ruta, encoding=cod, newline="")


def numero(texto):
    try:
        return float(str(texto).replace(",", "") or 0)
    except ValueError:
        return None


def main(ruta_csv):
    buscar = {nombre: clave for clave, nombres in CULTIVOS.items() for nombre in nombres}
    por_estado = defaultdict(lambda: defaultdict(float))
    por_municipio = defaultdict(lambda: defaultdict(lambda: [0.0, 0.0, 0.0]))  # t, ha cosechadas, MXN
    valor = defaultdict(float)      # MXN
    vol_valor = defaultdict(float)  # t con valor reportado
    anio = None

    with abrir_csv(ruta_csv) as f:
        lector = csv.DictReader(f)
        h = lector.fieldnames
        c_anio = columna(h, "anio", "ano")
        c_edo = columna(h, "idestado")
        c_mun = columna(h, "idmunicipio")
        c_cult = columna(h, "nomcultivo")
        c_vol = columna(h, "volumenproduccion", "volumen")
        c_unidad = columna(h, "nomunidad", "unidad")
        c_valor = columna(h, "valorproduccion", "valor")
        c_ha = columna(h, "cosechada")

        for fila in lector:
            cultivo = normalizar(fila[c_cult])
            # coincidencia exacta: evita confundir "papaya" con "papa" o "mangostan" con "mango"
            clave = buscar.get(cultivo)
            if not clave:
                continue
            if "tonelada" not in normalizar(fila[c_unidad]):
                continue  # descarta unidades distintas (gruesas, plantas, etc.)
            try:
                vol = float(str(fila[c_vol]).replace(",", "") or 0)
            except ValueError:
                continue
            anio = fila[c_anio]
            edo = str(fila[c_edo]).zfill(2)
            mun = edo + str(fila[c_mun]).zfill(3)
            por_estado[clave][edo] += vol
            val = numero(fila[c_valor])
            if val is not None:
                valor[clave] += val
                vol_valor[clave] += vol
            m = por_municipio[clave][mun]
            m[0] += vol
            m[1] += numero(fila[c_ha]) or 0
            m[2] += val or 0

    salida_js = RAIZ / "data" / "produccion_siap.js"
    datos = {
        clave: {
            "nacional": round(sum(e.values())),
            # precio medio rural ponderado (MXN/kg) = valor de la producción / volumen
            "precioRural": round(valor[clave] / vol_valor[clave] / 1000, 2) if vol_valor[clave] else None,
            "estados": {k: round(v) for k, v in sorted(e.items())},
        }
        for clave, e in por_estado.items()
    }
    salida_js.write_text(
        f"// Generado por scripts/procesar_siap.py a partir de {Path(ruta_csv).name} (año {anio})\n"
        f"window.PRODUCCION_SIAP = {json.dumps({'anio': anio, 'productos': datos}, ensure_ascii=False, indent=1)};\n"
        "Object.entries(window.PRODUCCION_SIAP.productos).forEach(([k, v]) => {\n"
        "  if (window.PRODUCTOS[k]) Object.assign(window.PRODUCTOS[k], v, { fuente: 'SIAP ' + window.PRODUCCION_SIAP.anio });\n"
        "});\n",
        encoding="utf-8",
    )

    # Producción municipal compacta: {producto: {CVEGEO: [t, ha cosechadas, valor MXN]}}
    municipal = {
        clave: {m: [round(v[0]), round(v[1], 1), round(v[2])] for m, v in sorted(ms.items()) if v[0] > 0}
        for clave, ms in por_municipio.items()
    }
    (RAIZ / "data" / "produccion_municipal.js").write_text(
        f"// Generado por scripts/procesar_siap.py — SIAP cierre agrícola municipal {anio}\n"
        "// {producto: {CVEGEO: [toneladas, hectáreas cosechadas, valor MXN]}}\n"
        f"window.PRODUCCION_MUNICIPAL = {json.dumps({'anio': anio, 'productos': municipal}, separators=(',', ':'))};\n",
        encoding="utf-8",
    )
    n_mun = len({m for ms in municipal.values() for m in ms})

    print(f"Año {anio}: {len(datos)} productos, {n_mun} municipios productores")
    for clave, d in datos.items():
        print(f"  {clave:10s} {d['nacional']:>12,.0f} t")
    print("Listo. Recarga el mapa: index.html ya carga data/produccion_siap.js")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])

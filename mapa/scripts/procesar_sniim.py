"""
Descarga y procesa precios de MAYOREO de frutas y hortalizas del SNIIM (Secretaría de Economía):
precio diario por variedad, estado de origen y central de abasto de destino, en MXN/kg.

Uso:
  python scripts/procesar_sniim.py 2025

Salidas:
  - data/fuentes/sniim/<anio>_<idProducto>.csv  (registros diarios, para auditoría)
  - data/precios_sniim.js → window.PRECIOS_SNIIM: por producto del mapa
      precio       precio frecuente promedio nacional (MXN/kg)
      mensual      12 promedios mensuales (estacionalidad del precio)
      mercados     {idCentral: [precio, observaciones]}
      origenes     {claveEstado | "IMP:<país>": [precio, observaciones]}
      rutas        [[origen, idCentral, observaciones, precio], ...]  red de abasto observada
      variedades   {variedad: [precio, observaciones]}
    y el catálogo de centrales (nombre, estado, lat, lon).
Solo usa la biblioteca estándar de Python.
"""
import csv
import html
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BASE = "http://www.economia-sniim.gob.mx/NUEVO/Consultas/MercadosNacionales/PreciosDeMercado/Agricolas/"
URL = (BASE + "ResultadosConsultaFechaFrutasYHortalizas.aspx?fechaInicio=01/01/{a}&fechaFinal=31/12/{a}"
       "&ProductoId={id}&OrigenId=-1&Origen=Todos&DestinoId=-1&Destino=Todos&PreciosPorId=2&RegistrosPorPagina=100000")

# Producto del mapa → variedades SNIIM (id, nombre corto). Calidad "Primera".
VARIEDADES = {
    "jitomate": [(839, "Saladette"), (836, "Bola")],
    "chile":    [(233, "Jalapeño"), (246, "Serrano"), (239, "Pimiento morrón"), (242, "Poblano")],
    "aguacate": [(133, "Hass")],
    "limon":    [(426, "Persa (sin semilla)"), (423, "Mexicano (con semilla)")],
    "naranja":  [(551, "Valencia mediana")],
    "platano":  [(732, "Tabasco"), (663, "Chiapas")],
    "mango":    [(479, "Kent"), (465, "Ataulfo"), (494, "Tommy")],
    "papa":     [(740, "Alpha"), (748, "Galeana")],
    "cebolla":  [(183, "Bola")],
    "brocoli":  [(162, "Brócoli")],
    "fresa":    [(358, "Fresa")],
    "pepino":   [(771, "Pepino")],
    "manzana":  [(519, "Golden Delicious"), (522, "Red Delicious")],
    "tomate_verde": [(842, "Tomate verde")],
    "calabacita":   [(170, "Italiana"), (166, "Criolla")],
    "zanahoria":    [(880, "Mediana")],
    "lechuga":      [(405, "Romanita grande"), (401, "Orejona grande")],
    "sandia":       [(787, "Sangría"), (799, "Rayada")],  # "Charleston" no tuvo registros en 2025
    "melon":        [(508, "Cantaloupe #27"), (500, "Cantaloupe #12"), (516, "Cantaloupe s/clasif.")],
    "papaya":       [(609, "Maradol")],
    "pina":         [(651, "Mediana")],
    "uva":          [(858, "Globo"), (869, "Sin semilla")],
    "toronja":      [(824, "Roja"), (832, "Rosada")],
    "pera":         [(634, "D'anjou")],   # en su mayoría importada; Bartlett casi sin registros en 2025
    "durazno":      [(290, "Amarillo")],  # Melocotón y Prisco sin registros en 2025
    "berenjena":    [(157, "Berenjena")],
    "coliflor":     [(263, "Grande"), (261, "Mediana")],
    "esparrago":    [(314, "Espárrago")],
    "guayaba":      [(378, "Guayaba")],
    "nopal":        [(556, "Grande"), (560, "Nopal")],
    "nuez":         [(563, "Cáscara de papel"), (567, "Wichita"), (566, "Western")],  # "Nuez" (565) sin registros 2025
    "zarzamora":    [(891, "Zarzamora")],
    # arándano y frambuesa: el SNIIM no los cotiza en su catálogo de frutas y hortalizas
}

# Centrales de abasto que reporta el SNIIM: id → (nombre corto, clave estado, lat, lon)
CENTRALES = {
    10: ("Aguascalientes", "01", 21.88, -102.29), 33: ("Tijuana", "02", 32.50, -117.00),
    20: ("La Paz", "03", 24.14, -110.31), 40: ("Campeche", "04", 19.85, -90.53),
    50: ("Torreón", "05", 25.54, -103.41), 80: ("Colima", "06", 19.24, -103.72),
    70: ("Tuxtla Gutiérrez", "07", 16.75, -93.12), 71: ("Tapachula", "07", 14.90, -92.26),
    61: ("Chihuahua", "08", 28.63, -106.07), 63: ("Cd. Juárez", "08", 31.69, -106.42),
    100: ("CEDA Iztapalapa (CDMX)", "09", 19.37, -99.09), 102: ("Durango", "10", 24.02, -104.66),
    101: ("Gómez Palacio", "10", 25.56, -103.50), 110: ("León", "11", 21.12, -101.68),
    112: ("Celaya", "11", 20.52, -100.81), 111: ("Irapuato", "11", 20.67, -101.35),
    121: ("Acapulco", "12", 16.85, -99.88), 122: ("Chilpancingo", "12", 17.55, -99.50),
    130: ("Pachuca", "13", 20.10, -98.76), 140: ("Guadalajara (Abasto)", "14", 20.65, -103.37),
    141: ("Guadalajara (Felipe Ángeles)", "14", 20.66, -103.33), 151: ("Ecatepec", "15", 19.60, -99.05),
    150: ("Toluca", "15", 19.29, -99.65), 160: ("Morelia", "16", 19.70, -101.19),
    170: ("Cuautla", "17", 18.81, -98.95), 172: ("Cuernavaca", "17", 18.92, -99.23),
    180: ("Tepic (López Mateos)", "18", 21.50, -104.89), 181: ("Tepic (Nayarabastos)", "18", 21.49, -104.86),
    190: ("Monterrey (Estrella)", "19", 25.73, -100.25), 200: ("Oaxaca", "20", 17.06, -96.72),
    210: ("Puebla", "21", 19.04, -98.20), 220: ("Querétaro", "22", 20.59, -100.39),
    230: ("Chetumal", "23", 18.50, -88.30), 231: ("Cancún", "23", 21.16, -86.85),
    240: ("San Luis Potosí", "24", 22.15, -100.98), 250: ("Culiacán", "25", 24.80, -107.39),
    252: ("Mazatlán", "25", 23.25, -106.41), 261: ("Cd. Obregón", "26", 27.49, -109.94),
    260: ("Hermosillo", "26", 29.07, -110.96), 270: ("Villahermosa", "27", 17.99, -92.93),
    281: ("Reynosa", "28", 26.08, -98.29), 280: ("Tampico", "28", 22.25, -97.86),
    301: ("Xalapa", "30", 19.54, -96.91), 302: ("Minatitlán", "30", 17.99, -94.55),
    306: ("Veracruz (Malibrán)", "30", 19.18, -96.14), 310: ("Mérida", "31", 20.97, -89.62),
    311: ("Oxkutzcab", "31", 20.30, -89.42), 312: ("Mérida (Casa del Pueblo)", "31", 20.96, -89.61),
    320: ("Zacatecas", "32", 22.77, -102.58),
}

ALIAS_ESTADO = {"distrito federal": "09", "df": "09", "cdmx": "09", "mexico": "15", "edo. de mexico": "15",
                "estado de mexico": "15", "coahuila de zaragoza": "05", "michoacan de ocampo": "16",
                "veracruz de ignacio de la llave": "30"}


def decodificar(datos):
    """Las páginas del SNIIM mezclan UTF-8 y Latin-1."""
    try:
        return datos.decode("utf-8")
    except UnicodeDecodeError:
        return datos.decode("latin-1")


def reparar(texto):
    """Corrige texto UTF-8 que fue leído como Latin-1 (p. ej. 'MÃ©xico' → 'México')."""
    try:
        return texto.encode("latin-1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return texto


def normalizar(t):
    return unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().strip().lower()


def estados():
    texto = (RAIZ / "data" / "estados.js").read_text(encoding="utf-8")
    return {normalizar(n): i for i, n in re.findall(r'id: "(\d\d)".*?nombre: "([^"]+)"', texto)}


def catalogo_destinos():
    """Nombre completo de central (como aparece en resultados) → id."""
    with urllib.request.urlopen(BASE + "ConsultaFrutasYHortalizas.aspx?SubOpcion=4", timeout=90) as r:
        t = html.unescape(decodificar(r.read()))
    i = t.find('id="ddlDestino"')
    bloque = t[i:t.find("</select>", i)]
    return {normalizar(n): int(v) for v, n in re.findall(r'<option[^>]*value="(\d+)"[^>]*>([^<]+)</option>', bloque)}


def descargar(anio, pid):
    cache = RAIZ / "data" / "fuentes" / "sniim" / f"{anio}_{pid}.csv"
    if cache.exists():
        with open(cache, encoding="utf-8", newline="") as f:
            return [[reparar(c) for c in fila] for fila in csv.reader(f)]
    for intento in range(5):  # el servidor del SNIIM responde 503 si se le consulta seguido
        try:
            with urllib.request.urlopen(URL.format(a=anio, id=pid), timeout=300) as r:
                t = html.unescape(decodificar(r.read()))
            break
        except urllib.error.HTTPError as e:
            if e.code != 503 or intento == 4:
                raise
            time.sleep(15 * (intento + 1))
    filas = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", t, re.S):
        c = [re.sub(r"<[^>]+>", "", x).strip() for x in re.findall(r"<td[^>]*>(.*?)</td>", tr, re.S)]
        if len(c) >= 7 and re.match(r"\d\d/\d\d/\d{4}", c[0]):
            filas.append(c[:7])  # fecha, presentación, origen, destino, mín, máx, frecuente
    cache.parent.mkdir(parents=True, exist_ok=True)
    with open(cache, "w", encoding="utf-8", newline="") as f:
        csv.writer(f).writerows(filas)
    time.sleep(1)
    return filas


def main(anio):
    edos = estados()
    destinos = catalogo_destinos()
    sin_mapear = defaultdict(int)
    salida = {}

    for clave, variedades in VARIEDADES.items():
        # una observación = (variedad, fecha, origen, central); se promedian presentaciones
        obs = defaultdict(list)
        for pid, var in variedades:
            for fecha, _pres, origen, destino, pmin, pmax, pfrec in descargar(anio, pid):
                try:
                    precio = float(pfrec.replace(",", "")) or (float(pmin) + float(pmax)) / 2
                except ValueError:
                    continue
                if precio <= 0:
                    continue
                o = normalizar(origen)
                o = edos.get(o) or ALIAS_ESTADO.get(o) or f"IMP:{origen.strip()}"
                d = destinos.get(normalizar(destino))
                if d is None or d not in CENTRALES:
                    sin_mapear[destino] += 1
                    continue
                obs[(var, fecha, o, d)].append(precio)
            print(f"  {clave:9s} {var:24s} {len([k for k in obs if k[0] == var]):>7,} observaciones")

        acum = {k: defaultdict(lambda: [0.0, 0]) for k in ("mercados", "origenes", "rutas", "variedades", "mes")}
        total = [0.0, 0]
        for (var, fecha, o, d), precios in obs.items():
            p = sum(precios) / len(precios)
            mes = int(fecha[3:5])
            for grupo, llave in (("mercados", d), ("origenes", o), ("rutas", (o, d)), ("variedades", var), ("mes", mes)):
                acum[grupo][llave][0] += p
                acum[grupo][llave][1] += 1
            total[0] += p; total[1] += 1
        if not total[1]:
            continue
        prom = lambda v: [round(v[0] / v[1], 2), v[1]]
        salida[clave] = {
            "precio": round(total[0] / total[1], 2), "observaciones": total[1],
            "mensual": [round(acum["mes"][m][0] / acum["mes"][m][1], 2) if acum["mes"][m][1] else None for m in range(1, 13)],
            "mercados": {d: prom(v) for d, v in acum["mercados"].items()},
            "origenes": {o: prom(v) for o, v in acum["origenes"].items()},
            "rutas": sorted([[o, d, v[1], round(v[0] / v[1], 2)] for (o, d), v in acum["rutas"].items()], key=lambda r: -r[2]),
            "variedades": {k: prom(v) for k, v in acum["variedades"].items()},
        }

    centrales = {i: {"nombre": n, "estado": e, "lat": la, "lon": lo} for i, (n, e, la, lo) in CENTRALES.items()}
    (RAIZ / "data" / "precios_sniim.js").write_text(
        f"// Generado por scripts/procesar_sniim.py — SNIIM (SE), precios de mayoreo {anio}, MXN/kg, calidad primera\n"
        f"window.PRECIOS_SNIIM = {json.dumps({'anio': anio, 'centrales': centrales, 'productos': salida}, ensure_ascii=False, separators=(',', ':'))};\n",
        encoding="utf-8",
    )
    print("\nPrecio de mayoreo promedio (MXN/kg):")
    for k, v in salida.items():
        top = sorted(((o, x[1]) for o, x in v["origenes"].items()), key=lambda x: -x[1])[:3]
        print(f"  {k:9s} ${v['precio']:>6.2f}  {v['observaciones']:>7,} obs · {len(v['mercados'])} centrales · orígenes: {top}")
    if sin_mapear:
        print("Centrales sin mapear:", dict(sin_mapear))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])

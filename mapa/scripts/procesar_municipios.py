"""
Genera la capa municipal del mapa: polígonos simplificados + población por municipio.

Fuentes:
  - Polígonos: CONABIO, "División política municipal 1:250000, 2023" (mun23gw), derivada del
    Marco Geoestadístico del INEGI. http://www.conabio.gob.mx/informacion/gis/maps/geo/mun23gw.zip
    (descomprimir en data/fuentes/mun23gw/)
  - Población: INEGI, Censo de Población y Vivienda 2020, vía API de Data México (SE).

Uso:
  python scripts/procesar_municipios.py [tolerancia_grados=0.004]

Salida:
  data/municipios_geo.js  → window.MUNICIPIOS_GEO (GeoJSON) con propiedades
                            c = clave INEGI (CVEGEO), n = nombre, p = población 2020
Solo usa la biblioteca estándar de Python (lector de shapefile propio).
"""
import json
import struct
import sys
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SHP = RAIZ / "data" / "fuentes" / "mun23gw" / "mun23gw"
POB_URL = ("https://www.economia.gob.mx/apidatamexico/tesseract/data.jsonrecords"
           "?cube=inegi_population_total&drilldowns=Municipality&measures=Population&Year=2020")
DECIMALES = 3  # ≈ 100 m


# ---------------- Lectura de shapefile (tipo 5: Polygon) ----------------
def leer_dbf(ruta):
    b = ruta.read_bytes()
    n, largo_enc, largo_reg = struct.unpack("<IHH", b[4:12])
    campos, i = [], 32
    while b[i] != 0x0D:
        campos.append((b[i:i + 11].split(b"\0")[0].decode(), b[i + 16]))
        i += 32
    filas = []
    for r in range(n):
        pos = largo_enc + r * largo_reg + 1  # +1: bandera de borrado
        fila = {}
        for nombre, largo in campos:
            crudo = b[pos:pos + largo]
            try:  # el DBF de CONABIO mezcla registros en UTF-8 y Latin-1
                fila[nombre] = crudo.decode("utf-8").strip()
            except UnicodeDecodeError:
                fila[nombre] = crudo.decode("latin-1").strip()
            pos += largo
        filas.append(fila)
    return filas


def leer_shp(ruta):
    b = ruta.read_bytes()
    pos, geometrias = 100, []
    while pos < len(b):
        _, largo = struct.unpack(">ii", b[pos:pos + 8])
        contenido = b[pos + 8: pos + 8 + largo * 2]
        pos += 8 + largo * 2
        tipo = struct.unpack("<i", contenido[:4])[0]
        if tipo == 0:
            geometrias.append([]); continue
        if tipo not in (5, 15, 25):
            raise ValueError(f"Tipo de geometría no soportado: {tipo}")
        n_partes, n_puntos = struct.unpack("<ii", contenido[36:44])
        partes = list(struct.unpack(f"<{n_partes}i", contenido[44:44 + 4 * n_partes]))
        inicio = 44 + 4 * n_partes
        pts = struct.unpack(f"<{2 * n_puntos}d", contenido[inicio:inicio + 16 * n_puntos])
        xy = list(zip(pts[0::2], pts[1::2]))
        partes.append(n_puntos)
        geometrias.append([xy[partes[k]:partes[k + 1]] for k in range(n_partes)])
    return geometrias


# ---------------- Geometría ----------------
def area_firmada(anillo):
    return sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(anillo, anillo[1:] + anillo[:1])) / 2


def punto_en_anillo(p, anillo):
    x, y = p; dentro = False
    for (x1, y1), (x2, y2) in zip(anillo, anillo[1:] + anillo[:1]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            dentro = not dentro
    return dentro


def douglas_peucker(puntos, tol):
    if len(puntos) < 3:
        return puntos
    conservar = [False] * len(puntos)
    conservar[0] = conservar[-1] = True
    pila = [(0, len(puntos) - 1)]
    tol2 = tol * tol
    while pila:
        a, z = pila.pop()
        (x1, y1), (x2, y2) = puntos[a], puntos[z]
        dx, dy = x2 - x1, y2 - y1
        L2 = dx * dx + dy * dy
        dmax, idx = 0, -1
        for i in range(a + 1, z):
            px, py = puntos[i]
            if L2 == 0:
                d = (px - x1) ** 2 + (py - y1) ** 2
            else:
                t = max(0, min(1, ((px - x1) * dx + (py - y1) * dy) / L2))
                d = (px - x1 - t * dx) ** 2 + (py - y1 - t * dy) ** 2
            if d > dmax:
                dmax, idx = d, i
        if dmax > tol2:
            conservar[idx] = True
            pila += [(a, idx), (idx, z)]
    return [p for p, k in zip(puntos, conservar) if k]


def simplificar_anillo(anillo, tol):
    s = douglas_peucker(anillo, tol)
    s = [(round(x, DECIMALES), round(y, DECIMALES)) for x, y in s]
    limpio = [p for i, p in enumerate(s) if i == 0 or p != s[i - 1]]
    if limpio[0] != limpio[-1]:
        limpio.append(limpio[0])
    return limpio if len(limpio) >= 4 else None


def a_multipoligono(anillos, tol):
    """Shapefile: exteriores en sentido horario (área < 0), huecos antihorario."""
    exteriores, huecos = [], []
    for a in anillos:
        (exteriores if area_firmada(a) < 0 else huecos).append(a)
    if not exteriores:
        exteriores, huecos = huecos, []
    # descarta islotes diminutos, pero conserva siempre el anillo mayor
    mayor = max(abs(area_firmada(a)) for a in exteriores)
    exteriores = [a for a in exteriores if abs(area_firmada(a)) >= max(tol * tol * 4, mayor * 0.001)]
    poligonos = [[e] for e in exteriores]
    for h in huecos:
        if abs(area_firmada(h)) < tol * tol * 4:
            continue
        for pol in poligonos:
            if punto_en_anillo(h[0], pol[0]):
                pol.append(h); break
    salida = []
    for pol in poligonos:
        anillos_s = [simplificar_anillo(a, tol) for a in pol]
        if anillos_s[0]:
            salida.append([[list(p) for p in a] for a in anillos_s if a])
    return salida


def main(tol):
    atributos = leer_dbf(SHP.with_suffix(".dbf"))
    geometrias = leer_shp(SHP.with_suffix(".shp"))
    print(f"{len(atributos)} municipios leídos")

    with urllib.request.urlopen(POB_URL, timeout=120) as r:
        pob = {str(x["Municipality ID"]).zfill(5): x["Population"] for x in json.loads(r.read())["data"]}
    print(f"Población 2020 para {len(pob)} municipios")

    features, sin_pob = [], []
    for attr, anillos in zip(atributos, geometrias):
        if not anillos:
            continue
        cve = attr["CVEGEO"]
        coords = a_multipoligono(anillos, tol)
        if not coords:
            continue
        if cve not in pob:
            sin_pob.append(cve)
        features.append({
            "type": "Feature",
            "properties": {"c": cve, "n": attr["NOMGEO"], "p": pob.get(cve, 0)},
            "geometry": {"type": "MultiPolygon", "coordinates": coords},
        })
    geo = {"type": "FeatureCollection", "features": features}
    salida = RAIZ / "data" / "municipios_geo.js"
    salida.write_text(
        "// Generado por scripts/procesar_municipios.py — CONABIO mun23gw (Marco Geoestadístico INEGI) + Censo 2020\n"
        "window.MUNICIPIOS_GEO = " + json.dumps(geo, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"{len(features)} municipios escritos en {salida.name} ({salida.stat().st_size / 1e6:.1f} MB)")
    if sin_pob:
        print(f"Sin población 2020 (municipios creados después del censo): {sin_pob}")


if __name__ == "__main__":
    main(float(sys.argv[1]) if len(sys.argv) > 1 else 0.004)

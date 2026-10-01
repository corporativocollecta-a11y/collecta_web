"""
Fase LATAM: procesa FAOSTAT (FAO) para América Latina y el Caribe con los mismos productos del mapa.

Fuentes (descargas masivas públicas, región Américas):
  https://bulks-faostat.fao.org/production/Production_Crops_Livestock_E_Americas.zip  (QCL: producción, superficie, rendimiento)
  https://bulks-faostat.fao.org/production/Trade_CropsLivestock_E_Americas.zip        (TCL: exportación e importación, t y USD)
  https://bulks-faostat.fao.org/production/Population_E_Americas.zip                  (OA: población)
Guardar en data/fuentes/faostat/ (sin descomprimir).

Uso:
  python scripts/procesar_faostat.py [latam|global] [año=último disponible]

  latam  → archivos *_E_Americas.zip, 34 países de América Latina y el Caribe → data/latam.js (window.LATAM)
  global → archivos *_E_All_Data.zip, todos los países (sin agregados regionales) → data/global.js (window.GLOBAL)
           Coordenadas: código M49 → ISO2 (catálogo de Comtrade, data/fuentes/comtrade/paises.json) →
           centroide (data/fuentes/faostat/centroides_paises.csv, Google DSPL countries.csv).

Salida: data/latam.js → window.LATAM
  paises:    {M49: {nombre, lat, lon, pob}}
  productos: {clave: {fao: [códigos], grupo?: texto, datos: {M49: [prod t, ha, export t, import t, export miles USD, import miles USD]},
                      serie: {M49: [prod de los últimos 5 años]}}}
Solo usa la biblioteca estándar de Python.
"""
import csv
import io
import json
import sys
import zipfile
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FUENTES = RAIZ / "data" / "fuentes" / "faostat"

# producto del mapa → códigos de producto FAOSTAT (se suman si hay varios)
PRODUCTOS = {
    "jitomate": [388], "chile": [401], "aguacate": [572], "limon": [497], "naranja": [490],
    "platano": [486, 489], "mango": [571], "papa": [116], "cebolla": [403], "brocoli": [393],
    "fresa": [544], "pepino": [397], "manzana": [515], "calabacita": [394], "zanahoria": [426],
    "lechuga": [372], "sandia": [567], "melon": [568], "papaya": [600], "pina": [574], "uva": [560],
    "toronja": [507], "pera": [521], "durazno": [534], "berenjena": [399], "esparrago": [367],
    # FAOSTAT registra casi todo el comercio de berries en la partida 558 ("otros berries y Vaccinium"):
    # así reporta Perú su arándano y México su frambuesa y zarzamora. Se agrupan para no perder ese comercio.
    "arandano": [552, 547, 558],
    # Productos que solo existen en las vistas internacionales y por país (data/productos_paises.js)
    "mandarina": [495], "cereza": [531], "kiwi": [592], "chabacano": [526], "ciruela": [536], "coco": [249],
    "ajo": [406], "col": [358], "ejote": [414], "chile_seco": [689], "cafe": [656], "cacao": [661],
}
NOMBRES = {"arandano": "Berries (arándano, frambuesa, zarzamora)", "cafe": "Café verde (oro)", "cacao": "Cacao en grano",
           "chile_seco": "Chile seco", "mandarina": "Mandarina y clementina"}
GRUPOS = {  # partidas FAO que agrupan varios productos
    "platano": "FAO suma banano (486) y plátano macho (489).",
    "mango": "La partida FAO 571 agrupa mango, guayaba y mangostán.",
    "brocoli": "La partida FAO 393 agrupa brócoli y coliflor.",
    "calabacita": "La partida FAO 394 agrupa calabacita, calabaza y otras cucurbitáceas.",
    "zanahoria": "La partida FAO 426 agrupa zanahoria y nabo.",
    "lechuga": "La partida FAO 372 agrupa lechuga y achicoria.",
    "uva": "Uva total (mesa, vino y pasa).",
    "arandano": "Agrupa arándano (552), frambuesa (547) y otros berries (558): FAOSTAT registra en la 558 la mayor parte del comercio de berries.",
}

# América Latina y el Caribe (código M49 → nombre en español, centroide aproximado de población)
PAISES = {
    "032": ("Argentina", -34.6, -64.0), "068": ("Bolivia", -17.0, -65.0), "076": ("Brasil", -14.2, -51.9),
    "152": ("Chile", -33.4, -71.0), "170": ("Colombia", 4.6, -74.1), "188": ("Costa Rica", 9.9, -84.1),
    "192": ("Cuba", 22.0, -79.5), "214": ("República Dominicana", 18.7, -70.2), "218": ("Ecuador", -1.5, -78.5),
    "222": ("El Salvador", 13.7, -88.9), "320": ("Guatemala", 15.5, -90.3), "328": ("Guyana", 5.0, -58.9),
    "332": ("Haití", 19.0, -72.3), "340": ("Honduras", 14.8, -86.8), "388": ("Jamaica", 18.1, -77.3),
    "484": ("México", 21.0, -101.0), "558": ("Nicaragua", 12.9, -85.2), "591": ("Panamá", 8.6, -80.1),
    "600": ("Paraguay", -23.4, -58.4), "604": ("Perú", -9.2, -75.0), "630": ("Puerto Rico", 18.2, -66.5),
    "740": ("Surinam", 4.0, -56.0), "780": ("Trinidad y Tobago", 10.4, -61.3), "858": ("Uruguay", -32.8, -56.0),
    "862": ("Venezuela", 7.1, -66.2), "084": ("Belice", 17.2, -88.7), "044": ("Bahamas", 24.7, -77.8),
    "052": ("Barbados", 13.2, -59.5), "028": ("Antigua y Barbuda", 17.1, -61.8), "212": ("Dominica", 15.4, -61.4),
    "308": ("Granada", 12.1, -61.7), "659": ("San Cristóbal y Nieves", 17.3, -62.7), "662": ("Santa Lucía", 13.9, -61.0),
    "670": ("San Vicente y las Granadinas", 13.2, -61.2),
}


def filas(zipnombre, csvnombre):
    with zipfile.ZipFile(FUENTES / zipnombre) as z:
        with z.open(csvnombre) as f:
            lector = csv.reader(io.TextIOWrapper(f, encoding="latin-1"))
            encabezado = next(lector)
            for r in lector:
                yield dict(zip(encabezado, r))


def m49(valor):
    return valor.strip("'").zfill(3)


def num(v):
    try:
        return float(v) if v not in ("", None) else None
    except ValueError:
        return None


ALCANCES = {
    "latam": {"sufijo": "Americas", "variable": "LATAM", "archivo": "latam.js", "titulo": "América Latina y el Caribe"},
    "global": {"sufijo": "All_Data", "variable": "GLOBAL", "archivo": "global.js", "titulo": "todos los países"},
}
# Áreas FAO que son agregados o que duplican a otras: "China" (351) = China continental + Hong Kong + Macao + Taiwán
EXCLUIR_FAO = {351}
ISO_EXTRA = {"158": "TW", "729": "SD", "728": "SS", "891": "RS", "736": "SD"}


def paises_globales():
    """M49 → (nombre en inglés, lat, lon, ISO2) para todos los países con coordenadas."""
    comtrade = json.loads((RAIZ / "data" / "fuentes" / "comtrade" / "paises.json").read_text(encoding="utf-8"))["results"]
    iso = {str(p["id"]).zfill(3): p.get("PartnerCodeIsoAlpha2") for p in comtrade if p.get("PartnerCodeIsoAlpha2")}
    iso.update(ISO_EXTRA)
    with open(FUENTES / "centroides_paises.csv", encoding="utf-8") as fc:
        centro = {r["country"]: (r["name"], float(r["latitude"]), float(r["longitude"])) for r in csv.DictReader(fc) if r["latitude"]}
    return iso, centro


def main(alcance="latam", anio=None):
    cfg = ALCANCES[alcance]
    arch = lambda base: (f"{base}_E_{cfg['sufijo']}.zip", f"{base}_E_{cfg['sufijo']}_NOFLAG.csv")
    codigos = {c: k for k, cs in PRODUCTOS.items() for c in cs}
    if alcance == "latam":
        incluido = lambda r: m49(r["Area Code (M49)"]) in PAISES
    else:
        iso, centro = paises_globales()
        incluido = lambda r: int(r["Area Code"]) < 5000 and int(r["Area Code"]) not in EXCLUIR_FAO \
            and iso.get(m49(r["Area Code (M49)"])) in centro
        nombres_fao = {}
    prod = defaultdict(lambda: defaultdict(lambda: defaultdict(float)))   # clave → país → elemento → valor
    serie = defaultdict(lambda: defaultdict(lambda: defaultdict(float)))  # clave → país → año → t

    # Año de análisis: el último con producción de tomate registrada para México
    if anio is None:
        for r in filas(*arch("Production_Crops_Livestock")):
            if r["Area"] == "Mexico" and r["Item Code"] == "388" and r["Element Code"] == "5510":
                anio = max(int(c[1:]) for c, v in r.items() if c.startswith("Y") and v)
                break
    col = f"Y{anio}"
    anios_serie = [f"Y{a}" for a in range(anio - 4, anio + 1)]

    for r in filas(*arch("Production_Crops_Livestock")):
        pais = m49(r["Area Code (M49)"])
        clave = codigos.get(int(r["Item Code"]))
        if not clave or not incluido(r):
            continue
        if alcance == "global":
            nombres_fao[pais] = r["Area"]
        if r["Element Code"] == "5510":
            prod[clave][pais]["prod"] += num(r[col]) or 0
            for a in anios_serie:
                serie[clave][pais][a] += num(r.get(a)) or 0
        elif r["Element Code"] == "5312":
            prod[clave][pais]["ha"] += num(r[col]) or 0

    elementos = {"5910": "exp", "5610": "imp", "5922": "expUSD", "5622": "impUSD"}
    for r in filas(*arch("Trade_CropsLivestock")):
        pais = m49(r["Area Code (M49)"])
        clave = codigos.get(int(r["Item Code"]))
        el = elementos.get(r["Element Code"])
        if clave and el and incluido(r):
            prod[clave][pais][el] += num(r[col]) or 0

    pob = {}
    for r in filas(*arch("Population")):
        pais = m49(r["Area Code (M49)"])
        if incluido(r) and r["Element Code"] == "511" and r["Item Code"] == "3010":
            v = num(r.get(col)) or num(r.get(f"Y{anio - 1}"))
            if v:
                pob[pais] = round(v * 1000)

    if alcance == "latam":
        paises_salida = {c: {"nombre": n, "lat": la, "lon": lo, "pob": pob.get(c)} for c, (n, la, lo) in PAISES.items()}
    else:
        codigos_pais = set(pob) | {p for v in prod.values() for p in v}
        paises_salida = {}
        for c in sorted(codigos_pais):
            i2 = iso.get(c)
            if i2 not in centro:
                continue
            n, la, lo = centro[i2]
            nombre = PAISES[c][0] if c in PAISES else n  # nombre en español en el navegador (Intl.DisplayNames) a partir de iso
            paises_salida[c] = {"nombre": nombre, "iso": i2, "lat": round(la, 2), "lon": round(lo, 2), "pob": pob.get(c)}
    salida = {
        "anio": anio,
        "alcance": alcance,
        "fuente": f"FAOSTAT (FAO): QCL, TCL y OA, {cfg['titulo']}",
        "paises": paises_salida,
        "productos": {},
    }
    for clave, paises in prod.items():
        datos = {}
        for pais, v in paises.items():
            fila = [round(v.get(x, 0)) for x in ("prod", "ha", "exp", "imp", "expUSD", "impUSD")]
            if any(fila) and pais in salida["paises"]:
                datos[pais] = fila
        salida["productos"][clave] = {
            "fao": PRODUCTOS[clave], **({"grupo": GRUPOS[clave]} if clave in GRUPOS else {}),
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            "datos": datos,
            "serie": {p: [round(serie[clave][p][a]) for a in anios_serie] for p in datos if any(serie[clave][p].values())},
        }

    destino = RAIZ / "data" / cfg["archivo"]
    destino.write_text(
        f"// Generado por scripts/procesar_faostat.py — FAOSTAT {anio}, {cfg['titulo']}\n"
        f"window.{cfg['variable']} = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n",
        encoding="utf-8",
    )
    print(f"Año {anio}: {len(salida['productos'])} productos, {len(pob)} países con población · {destino.stat().st_size / 1e3:.0f} kB")
    for k, v in salida["productos"].items():
        tot = sum(d[0] for d in v["datos"].values())
        mx = v["datos"].get("484", [0])[0]
        orden = sorted(v["datos"].items(), key=lambda x: -x[1][0])
        lider = salida["paises"][orden[0][0]]["nombre"] if orden else "—"
        lugar = next((i + 1 for i, (p, _) in enumerate(orden) if p == "484"), None)
        print(f"  {k:11s} {tot:>12,.0f} t · líder {lider:12s} · México {mx / tot * 100 if tot else 0:5.1f}% (lugar {lugar})")


if __name__ == "__main__":
    args = sys.argv[1:]
    alcance = args.pop(0) if args and args[0] in ALCANCES else "latam"
    main(alcance, int(args[0]) if args else None)

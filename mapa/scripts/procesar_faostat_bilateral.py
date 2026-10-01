"""
Fase LATAM · comercio bilateral: quién le vende a quién (FAOSTAT, matriz detallada de comercio).

Fuente: https://bulks-faostat.fao.org/production/Trade_DetailedTradeMatrix_E_All_Data_(Normalized).zip
(guardar en data/fuentes/faostat/; se lee en flujo, sin descomprimir).

Reglas para no contar dos veces un mismo envío:
  - Flujos que SALEN de un país latinoamericano (a cualquier destino): lo que reporta el exportador (elementos 5910 t, 5922 miles USD).
  - Flujos que LLEGAN a un país latinoamericano desde fuera de la región: lo que reporta el importador (5610 t, 5622 miles USD).

Uso:
  python scripts/procesar_faostat_bilateral.py [latam|global] [año=último disponible]

  global: todos los países de data/global.js (generar antes con procesar_faostat.py global); solo se usa lo que
          reporta el exportador, y se conservan las rutas mayores más las 20 mayores de México por producto.
          Salida: data/global_comercio.js → window.GLOBAL_COMERCIO

Salida: data/latam_comercio.js → window.LATAM_COMERCIO
  anio, anclas: {id: {nombre, lat, lon}} (EE. UU., Canadá y regiones fuera de América),
  productos: {clave: [[origen, destino, toneladas, miles USD], ...]}  (origen/destino = M49 o id de ancla)
Solo usa la biblioteca estándar de Python.
"""
import csv
import io
import json
import sys
import zipfile
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from procesar_faostat import PAISES, PRODUCTOS  # noqa: E402  (mismos países y productos)

RAIZ = Path(__file__).resolve().parent.parent
ZIP = RAIZ / "data" / "fuentes" / "faostat" / "Trade_DetailedTradeMatrix_E_All_Data_(Normalized).zip"

# Socios fuera de América Latina: EE. UU. y Canadá como países; el resto agrupado en anclas al borde del mapa
ANCLAS = {
    "840": ("Estados Unidos", 38.5, -97.0),
    "124": ("Canadá", 50.0, -96.0),
    "EUR": ("Europa", 34.0, -30.0),
    "ASI": ("Asia y Oceanía", 16.0, -122.0),
    "MOA": ("Medio Oriente y África", 4.0, -27.0),
    "CAR": ("Otros territorios del Caribe", 16.0, -62.5),
}
EUROPA = {"008", "020", "040", "056", "058", "070", "100", "112", "191", "196", "203", "208", "233", "234", "246", "250",
          "276", "292", "300", "336", "348", "352", "372", "380", "428", "438", "440", "442", "470", "492", "498", "499",
          "528", "578", "616", "620", "642", "643", "674", "688", "703", "705", "724", "752", "756", "804", "807", "826", "831", "832", "833"}
ASIA_OCEANIA = {"004", "031", "036", "048", "050", "051", "064", "096", "104", "116", "144", "156", "158", "242", "258", "268",
                "296", "344", "356", "360", "392", "398", "408", "410", "417", "418", "446", "458", "462", "496", "524", "540",
                "548", "554", "583", "584", "585", "586", "598", "608", "626", "702", "704", "762", "764", "776", "795", "798", "860", "882", "090"}
CARIBE_OTROS = {"060", "092", "136", "254", "312", "474", "500", "531", "533", "534", "535", "652", "663", "666", "796", "850"}


def socio(m49):
    """Código de dibujo para un país fuera de la lista de América Latina."""
    if m49 in PAISES:
        return m49
    if m49 in ("840", "124"):
        return m49
    if m49 in EUROPA:
        return "EUR"
    if m49 in ASIA_OCEANIA:
        return "ASI"
    if m49 in CARIBE_OTROS:
        return "CAR"
    return "MOA"


def m49(v):
    return v.strip().strip("'").zfill(3)


def paises_globales():
    texto = (RAIZ / "data" / "global.js").read_text(encoding="utf-8")
    return set(json.loads(texto[texto.index("{"):texto.rindex("}") + 1])["paises"])


def main(alcance="latam", anio=None):
    codigos = {c: k for k, cs in PRODUCTOS.items() for c in cs}
    globales = paises_globales() if alcance == "global" else None
    universo = globales if globales else PAISES
    flujos = defaultdict(lambda: defaultdict(lambda: [0.0, 0.0]))  # clave → (origen, destino) → [t, miles USD]
    anios = set()

    # El CSV (≈8.5 GB) tiene todos los campos entre comillas: se separa en bytes por '","', mucho más rápido que csv
    reporteros = {f"'{p}".encode() for p in universo}
    items = {str(c).encode() for c in codigos}
    elementos = {b"5910", b"5922"} if globales else {b"5910", b"5922", b"5610", b"5622"}
    with zipfile.ZipFile(ZIP) as z:
        nombre = next(n for n in z.namelist() if n.endswith("(Normalized).csv"))
        with z.open(nombre) as f:
            h = [c.strip('"') for c in f.readline().decode("latin-1").strip().split(",")]
            idx = {c: i for i, c in enumerate(h)}
            c_rep, c_par = idx["Reporter Country Code (M49)"], idx["Partner Country Code (M49)"]
            c_item, c_el, c_anio, c_val = idx["Item Code"], idx["Element Code"], idx["Year"], idx["Value"]
            for linea in f:
                partes = linea.rstrip(b"\r\n").split(b'","')
                if len(partes) < len(h) or partes[c_rep] not in reporteros or partes[c_item] not in items or partes[c_el] not in elementos:
                    continue
                r = [p.decode("latin-1") for p in partes]
                clave = codigos[int(r[c_item])]
                el = r[c_el]
                rep, par = m49(r[c_rep]), m49(r[c_par])
                a = int(r[c_anio])
                r[c_val] = r[c_val].rstrip('"')
                anios.add(a)
                if anio is not None and a != anio:
                    continue
                try:
                    v = float(r[c_val] or 0)
                except ValueError:
                    continue
                if globales:                          # mundial: solo exportaciones reportadas, entre países con coordenadas
                    if par in globales:
                        flujos[(clave, a)][(rep, par)][0 if el == "5910" else 1] += v
                    continue
                if el in ("5910", "5922"):          # exportación reportada por país latinoamericano
                    par_ok = socio(par)
                    llave = (rep, par_ok)
                    flujos[(clave, a)][llave][0 if el == "5910" else 1] += v
                elif par not in PAISES:              # importación desde fuera de la región, reportada por el importador
                    llave = (socio(par), rep)
                    flujos[(clave, a)][llave][0 if el == "5610" else 1] += v

    if anio is None:
        anio = max(anios)
    anclas = {} if globales else {k: {"nombre": n, "lat": la, "lon": lo} for k, (n, la, lo) in ANCLAS.items()}
    salida = {"anio": anio, "alcance": alcance, "anclas": anclas, "productos": {}}
    for clave in PRODUCTOS:
        pares = flujos.get((clave, anio), {})
        lista = sorted(([o, d, round(t), round(usd)] for (o, d), (t, usd) in pares.items() if t >= 1 and o != d), key=lambda x: -x[2])
        total = sum(x[2] for x in lista)
        # se conservan los flujos que suman 99.5% del volumen o los 120 mayores, lo que sea menor
        acum, recortada = 0, []
        for x in lista:
            recortada.append(x)
            acum += x[2]
            if acum >= total * (0.95 if globales else 0.995) or len(recortada) >= (150 if globales else 120):
                break
        if globales:  # se agregan las 20 mayores rutas de México aunque queden fuera del recorte
            ya = {(x[0], x[1]) for x in recortada}
            recortada += [x for x in lista if "484" in (x[0], x[1]) and (x[0], x[1]) not in ya][:20]
        salida["productos"][clave] = recortada
        mx = sum(x[2] for x in recortada if x[0] == "484")
        print(f"  {clave:11s} {len(lista):>4} flujos → {len(recortada):>3} · {total:>12,.0f} t · México exporta {mx:>10,.0f} t")

    destino = RAIZ / "data" / ("global_comercio.js" if globales else "latam_comercio.js")
    variable = "GLOBAL_COMERCIO" if globales else "LATAM_COMERCIO"
    destino.write_text(
        f"// Generado por scripts/procesar_faostat_bilateral.py — FAOSTAT matriz detallada de comercio {anio} ({alcance})\n"
        f"window.{variable} = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n",
        encoding="utf-8",
    )
    print(f"Año {anio} (años en archivo: {min(anios)}–{max(anios)}) · {destino.stat().st_size / 1e3:.0f} kB")


if __name__ == "__main__":
    args = sys.argv[1:]
    alcance = args.pop(0) if args and args[0] in ("latam", "global") else "latam"
    main(alcance, int(args[0]) if args else None)

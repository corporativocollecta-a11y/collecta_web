"""
Vista por mercado de destino: a quién le compra cada país sus frutas y hortalizas (FAOSTAT, matriz detallada de comercio).

Fuente: data/fuentes/faostat/Trade_DetailedTradeMatrix_E_All_Data_(Normalized).zip (la misma de
procesar_faostat_bilateral.py; se lee en flujo, sin descomprimir).

Regla: importaciones según el país comprador (elementos 5610 t y 5622 miles USD). Si un país no reporta la
importación de un producto, se usa lo que declaran sus proveedores como exportación hacia él (5910, 5922) y se marca.
Solo países compradores con al menos US$20 M al año en estas frutas y hortalizas.

Uso:
  python scripts/procesar_mercados.py [año=último disponible]

Salida: data/mercados.js → window.MERCADOS (carga diferida desde js/mercado.js)
  anio, mercados: {M49: {k: [t, miles USD, espejo(0/1), [[proveedor M49, t, miles USD], ...]]}}
  Se guardan los 8 proveedores mayores por valor más "otros".
Solo usa la biblioteca estándar de Python.
"""
import json
import sys
import zipfile
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from procesar_faostat import PRODUCTOS  # noqa: E402  (mismos productos y partidas FAO)
from procesar_faostat_bilateral import ZIP, m49, paises_globales  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
MINIMO_USD = 20_000        # miles de USD al año en todos los productos
PROVEEDORES = 8


def main(anio=None):
    codigos = {c: k for k, cs in PRODUCTOS.items() for c in cs}
    paises = paises_globales()
    items = {str(c).encode() for c in codigos}
    elementos = {b"5610", b"5622", b"5910", b"5922"}
    # (año, producto) → comprador → proveedor → [t, usd]; "imp" = lo que reporta el comprador, "esp" = espejo del exportador
    imp = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: [0.0, 0.0])))
    esp = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: [0.0, 0.0])))
    anios = set()
    with zipfile.ZipFile(ZIP) as z:
        nombre = next(n for n in z.namelist() if n.endswith("(Normalized).csv"))
        with z.open(nombre) as f:
            h = [c.strip('"') for c in f.readline().decode("latin-1").strip().split(",")]
            idx = {c: i for i, c in enumerate(h)}
            c_rep, c_par = idx["Reporter Country Code (M49)"], idx["Partner Country Code (M49)"]
            c_item, c_el, c_anio, c_val = idx["Item Code"], idx["Element Code"], idx["Year"], idx["Value"]
            for linea in f:
                partes = linea.rstrip(b"\r\n").split(b'","')
                if len(partes) < len(h) or partes[c_item] not in items or partes[c_el] not in elementos:
                    continue
                a = int(partes[c_anio].decode())
                anios.add(a)
                if anio is not None and a != anio:
                    continue
                rep, par = m49(partes[c_rep].decode("latin-1")), m49(partes[c_par].decode("latin-1"))
                if rep not in paises or par not in paises or rep == par:
                    continue
                try:
                    v = float(partes[c_val].decode("latin-1").rstrip('"') or 0)
                except ValueError:
                    continue
                clave = codigos[int(partes[c_item].decode())]
                el = partes[c_el]
                if el in (b"5610", b"5622"):      # el comprador (rep) reporta lo que le compra a par
                    imp[(a, clave)][rep][par][0 if el == b"5610" else 1] += v
                else:                             # el exportador (rep) reporta lo que le vende a par
                    esp[(a, clave)][par][rep][0 if el == b"5910" else 1] += v

    if anio is None:
        anio = max(anios)
    mercados = defaultdict(dict)
    for clave in PRODUCTOS:
        compradores = set(imp.get((anio, clave), {})) | set(esp.get((anio, clave), {}))
        for c in compradores:
            propio = imp.get((anio, clave), {}).get(c)
            espejo = 0
            socios = propio if propio and sum(v[0] for v in propio.values()) > 0 else None
            if socios is None:
                socios, espejo = esp.get((anio, clave), {}).get(c), 1
            if not socios:
                continue
            lista = sorted(([p, round(t), round(u)] for p, (t, u) in socios.items() if t >= 1), key=lambda x: -x[2])
            if not lista:
                continue
            t_tot, u_tot = sum(x[1] for x in lista), sum(x[2] for x in lista)
            top = lista[:PROVEEDORES]
            resto = lista[PROVEEDORES:]
            if resto:
                top.append(["otros", sum(x[1] for x in resto), sum(x[2] for x in resto)])
            # México se conserva aunque no esté entre los mayores (para medir su parte)
            mx = next((x for x in resto if x[0] == "484"), None)
            if mx:
                top.insert(-1, mx)
                top[-1] = ["otros", top[-1][1] - mx[1], top[-1][2] - mx[2]]
            mercados[c][clave] = [t_tot, u_tot, espejo, top]

    total = {c: sum(v[1] for v in ps.values()) for c, ps in mercados.items()}
    salida = {"anio": anio, "mercados": {c: mercados[c] for c in sorted(mercados, key=lambda c: -total[c]) if total[c] >= MINIMO_USD}}
    destino = RAIZ / "data" / "mercados.js"
    destino.write_text(
        f"// Generado por scripts/procesar_mercados.py — FAOSTAT matriz detallada de comercio {anio}: proveedores de cada país comprador\n"
        f"window.MERCADOS = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n",
        encoding="utf-8",
    )
    # Lo que cada comprador reporta que le compra a México (y su proveedor principal), para la tabla "Dónde puede
    # vender México" (js/latam.js): se carga siempre, por eso va aparte y pequeño. Comprador presente con 0 = no le compra.
    desde = defaultdict(dict)
    for c, ps in salida["mercados"].items():
        for clave, (_, _, espejo, top) in ps.items():
            mx = next((x for x in top if x[0] == "484"), None)
            principal = next((x[0] for x in top if x[0] != "otros"), None)
            desde[clave][c] = [mx[1] if mx else 0, principal, espejo]
    destino2 = RAIZ / "data" / "desde_mexico.js"
    destino2.write_text(
        f"// Generado por scripts/procesar_mercados.py — FAOSTAT {anio}: toneladas que cada comprador reporta de México, proveedor principal, espejo(0/1)\n"
        f"window.DESDE_MEXICO = {json.dumps({'anio': anio, 'productos': desde}, ensure_ascii=False, separators=(',', ':'))};\n",
        encoding="utf-8",
    )
    print(f"  -> {destino2} ({destino2.stat().st_size / 1e3:.0f} kB)")
    m = salida["mercados"]
    print(f"Año {anio} (años en archivo: {min(anios)}–{max(anios)}) · {len(m)} mercados · {destino.stat().st_size / 1e3:.0f} kB")
    for c in ("276", "124", "840", "528", "392"):
        if c in m:
            print(f"  {c}: {len(m[c])} productos, US${sum(v[1] for v in m[c].values()) / 1e3:,.0f} M")


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else None)

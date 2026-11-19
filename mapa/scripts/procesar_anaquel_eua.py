"""
Precio de anaquel en EE. UU.: precio promedio mensual que pagan los consumidores en tiendas urbanas de todo el país
(BLS, Average Price Data, serie APU0000<artículo>, "U.S. city average"), convertido a US$/kg. Es el precio de todos los
días, no el de oferta: último eslabón de la cadena de precios de EE. UU. (js/graficos.js, "De la granja al supermercado"),
junto al precio de oferta del USDA (scripts/procesar_consumidor_eua.py).

El BLS dejó de publicar casi todas las hortalizas: en 2026 solo quedan jitomate, papa, lechuga, fresa, naranja,
toronja y plátano (pimiento morrón y brócoli terminan en 2020, uva en 2021; col, apio, cebolla, pepino… no tienen datos).
Los limones (711412) no son el limón mexicano (lima persa): se dejan fuera.

Fuente: API pública del BLS v1 (sin clave; 25 series y 25 consultas al día), con respaldo en FRED (misma serie).
Respuesta cruda en data/fuentes/bls/anaquel.json (si las dos fallan, se usa la última descargada).
Salida: data/anaquel_eua.js → window.ANAQUEL_EUA = {generado, mes, productos: {clave: {serie, articulo, unidad, kgUnidad,
        meses: [["AAAA-MM", US$ por unidad], …] (últimos 36), precioKg (promedio de los últimos 3 meses), mesUltimo}}}

Uso:
  python scripts/procesar_anaquel_eua.py
"""
import csv
import datetime
import io
import json
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CRUDO = RAIZ / "data" / "fuentes" / "bls" / "anaquel.json"
LB, OZ12 = 0.45359237, 0.34019428
# clave del mapa: (artículo BLS, nombre del artículo, unidad, kg por unidad)
SERIES = {
    "jitomate": ("712311", "Tomatoes, field grown", "lb", LB),
    "papa": ("712112", "Potatoes, white", "lb", LB),
    "lechuga": ("712211", "Lettuce, iceberg", "lb", LB),
    "fresa": ("711415", "Strawberries, dry pint", "12 oz", OZ12),
    "naranja": ("711311", "Oranges, Navel", "lb", LB),
    "toronja": ("711411", "Grapefruit", "lb", LB),
    "platano": ("711211", "Bananas", "lb", LB),
}
MESES_SALIDA, MESES_PROMEDIO = 36, 3


def desde_bls(ids, anio):
    cuerpo = json.dumps({"seriesid": ids, "startyear": str(anio - 3), "endyear": str(anio)}).encode()
    req = urllib.request.Request("https://api.bls.gov/publicAPI/v1/timeseries/data/", data=cuerpo,
                                 headers={"Content-Type": "application/json", "User-Agent": "collecta-mapa/1.0"})
    d = json.loads(urllib.request.urlopen(req, timeout=90).read())
    if d.get("status") != "REQUEST_SUCCEEDED":
        raise RuntimeError(f"BLS: {d.get('status')} {d.get('message')}")
    out = {}
    for s in d["Results"]["series"]:
        out[s["seriesID"]] = {f"{x['year']}-{x['period'][1:]}": float(x["value"]) for x in s["data"]
                              if x["period"].startswith("M") and x["period"] != "M13" and x["value"] not in ("-", "")}
    return out


def desde_fred(ids, anio):
    out = {}
    for i in ids:   # una serie a la vez: FRED corta las ráfagas de consultas
        u = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={i}&cosd={anio - 3}-01-01"
        texto = urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "collecta-mapa/1.0"}), timeout=60).read().decode()
        filas = list(csv.reader(io.StringIO(texto)))[1:]
        out[i] = {f[0][:7]: float(f[1]) for f in filas if len(f) > 1 and f[1] not in (".", "")}
    return out


def main():
    hoy = datetime.date.today()
    ids = ["APU0000" + s[0] for s in SERIES.values()]
    crudo, usadas = {}, []
    for nombre, f in (("BLS", desde_bls), ("FRED", desde_fred)):
        try:
            nuevo = f([i for i in ids if not crudo.get(i)], hoy.year)   # la segunda fuente solo completa lo que faltó
            if any(nuevo.values()):
                crudo.update({i: v for i, v in nuevo.items() if v})
                usadas.append(nombre)
        except Exception as e:   # sin red, límite diario, servidor caído
            print(f"  {nombre} no respondió: {e}")
        if all(crudo.get(i) for i in ids):
            break
        print(f"  {nombre}: faltan series, se intenta la siguiente fuente")
    origen = " + ".join(usadas)
    guardado = json.loads(CRUDO.read_text(encoding="utf-8")) if CRUDO.exists() else None
    if crudo:
        # lo que ninguna fuente dio hoy se toma de la descarga anterior (no se pierde una serie por una falla parcial)
        faltan = [i for i in ids if not crudo.get(i) and guardado and guardado["series"].get(i)]
        for i in faltan:
            crudo[i] = guardado["series"][i]
        if faltan:
            print(f"  de la descarga del {guardado['descargado']}: {', '.join(faltan)}")
        CRUDO.parent.mkdir(parents=True, exist_ok=True)
        CRUDO.write_text(json.dumps({"descargado": hoy.isoformat(), "origen": origen, "series": crudo}, indent=0), encoding="utf-8")
    elif guardado:
        crudo, origen = guardado["series"], guardado["origen"] + " (copia del " + guardado["descargado"] + ")"
        print(f"  se usa la última descarga: {origen}")
    else:
        raise SystemExit("Sin datos del BLS ni de FRED, y sin descarga previa")
    productos = {}
    for k, (art, nombre, unidad, kg) in SERIES.items():
        m = crudo.get("APU0000" + art) or {}
        if not m:
            print(f"  {k:9s} sin datos")
            continue
        meses = sorted(m.items())[-MESES_SALIDA:]
        ult = [v for _, v in meses[-MESES_PROMEDIO:]]
        productos[k] = {"serie": "APU0000" + art, "articulo": nombre, "unidad": unidad, "kgUnidad": round(kg, 5),
                        "meses": [[a, v] for a, v in meses], "mesUltimo": meses[-1][0],
                        "precioKg": round(sum(ult) / len(ult) / kg, 3)}
        print(f"  {k:9s} {nombre:24s} {meses[-1][0]} US${meses[-1][1]:.3f}/{unidad} · {productos[k]['precioKg']:.2f} US$/kg (prom. 3 meses)")
    salida = {"generado": hoy.isoformat(), "mes": max(p["mesUltimo"] for p in productos.values()),
              "fuente": f"BLS, Average Price Data, U.S. city average ({origen})", "productos": productos}
    destino = RAIZ / "data" / "anaquel_eua.js"
    destino.write_text("// Generado por scripts/procesar_anaquel_eua.py · BLS, precio promedio de anaquel en EE. UU.\n"
                       f"window.ANAQUEL_EUA = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"-> {destino} ({destino.stat().st_size / 1024:.0f} kB), {len(productos)} productos")


if __name__ == "__main__":
    main()

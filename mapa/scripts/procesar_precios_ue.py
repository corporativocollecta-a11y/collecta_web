"""
Precios de frutas y hortalizas en la Unión Europea (Comisión Europea, DG AGRI, Agri-food data portal), para comparar
los mercados de oportunidad con el mayoreo de Estados Unidos.

Fuente: API pública, sin clave:
  https://api.tech.ec.europa.eu/agrifood/api/fruitAndVegetable/pricesSupplyChain?products=<producto>&years=<año>
  Etapa usada: "Ex-packaging station price" (precio en empacadora: lo que recibe el productor europeo al empacar),
  en €/100 kg, semanal, por país productor. Se compara con el precio FOB del producto mexicano en la frontera.
Tipo de cambio: dólares por euro, promedio anual (Reserva Federal H.10, DEXUSEU, vía FRED).
Respuestas crudas en data/fuentes/ue/.

Uso:
  python scripts/procesar_precios_ue.py [año=2025]
Salida: data/precios_ue.js → window.PRECIOS_UE
  {anio, usdPorEur, etapa, productos: {clave: {país ISO2: [€/kg mediana, US$/kg, semanas]}}}
"""
import csv
import json
import statistics
import sys
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CRUDOS = RAIZ / "data" / "fuentes" / "ue"
API = "https://api.tech.ec.europa.eu/agrifood/api/fruitAndVegetable/pricesSupplyChain?products={p}&years={a}"
ETAPA = "Ex-packaging station price"   # la etapa con más países y productos

PRODUCTOS = {
    "aguacate": "Avocados", "jitomate": "Tomatoes", "chile": "Peppers", "pepino": "Cucumbers", "fresa": "Strawberries",
    "uva": "Table Grapes", "limon": "Lemons", "sandia": "Water Melons", "melon": "Melons", "esparrago": "Asparagus",
    "berenjena": "Egg Plants", "calabacita": "Courgettes", "cebolla": "Onions", "zanahoria": "Carrots",
    "lechuga": "Lettuces", "coliflor": "Cauliflowers", "naranja": "Oranges", "platano": "Bananas", "manzana": "Apples",
    "pera": "Pears", "durazno": "Peaches", "mandarina": "Mandarins", "kiwi": "Kiwis Hayward", "cereza": "Cherries",
    "chabacano": "Apricots",
}


def usd_por_eur(anio):
    ruta = RAIZ / "data" / "fuentes" / f"fred_dexuseu_{anio}.csv"
    if not ruta.exists():
        url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id=DEXUSEU&cosd={anio}-01-01&coed={anio}-12-31"
        ruta.write_bytes(urllib.request.urlopen(url, timeout=60).read())
    with open(ruta, encoding="utf-8") as f:
        v = [float(r[1]) for r in list(csv.reader(f))[1:] if r[1] not in ("", ".")]
    return round(sum(v) / len(v), 4)


def bajar(producto, anio):
    ruta = CRUDOS / f"{producto.replace(' ', '_')}_{anio}.json"
    if ruta.exists():
        return json.loads(ruta.read_text(encoding="utf-8"))
    url = API.format(p=urllib.parse.quote(producto), a=anio)
    for intento in range(5):
        try:
            d = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=180))
            if isinstance(d, dict):   # la API responde un objeto de error cuando está suspendida
                raise RuntimeError(d.get("description", d))
            ruta.write_text(json.dumps(d), encoding="utf-8")
            time.sleep(3)
            return d
        except Exception as e:
            print(f"  {producto}: {e}; reintento")
            time.sleep(20 * (intento + 1))
    raise SystemExit(f"No se pudo descargar {producto}")


def precio(texto):
    return float(texto.replace("€", "").replace(",", "")) if texto else None


def main(anio=2025):
    CRUDOS.mkdir(parents=True, exist_ok=True)
    tc = usd_por_eur(anio)
    salida = {"anio": anio, "usdPorEur": tc, "etapa": "precio en empacadora (Ex-packaging station price)",
              "fuente": f"Comisión Europea, Agri-food data portal, precios de frutas y hortalizas {anio}", "productos": {}}
    for clave, producto in PRODUCTOS.items():
        filas = bajar(producto, anio)
        por_pais = defaultdict(list)
        for r in filas:
            if r.get("productStage") != ETAPA or r.get("year") != anio or "organic" in (r.get("variety") or "").lower():
                continue
            p = precio(r.get("price"))
            if p and r.get("unit") == "€/100Kg":
                por_pais[r["memberStateCode"]].append(p / 100)
        salida["productos"][clave] = {pa: [round(statistics.median(v), 2), round(statistics.median(v) * tc, 2), len(v)]
                                      for pa, v in sorted(por_pais.items()) if len(v) >= 8}
        print(f"  {clave:10} {producto:15} países: {', '.join(salida['productos'][clave]) or '—'}")
    destino = RAIZ / "data" / "precios_ue.js"
    destino.write_text(f"// Generado por scripts/procesar_precios_ue.py · {salida['fuente']}\n"
                       f"window.PRECIOS_UE = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"-> {destino.name} ({destino.stat().st_size / 1e3:.0f} kB), US$ por €: {tc}")


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 2025)

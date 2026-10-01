"""
De qué estados sale lo que México exporta a EE. UU., por mes y producto: registro de comercio exterior por entidad
federativa de la Secretaría de Economía (Data México, cubo economy_foreign_trade_ent; exportaciones a EE. UU. por
estado, mes y fracción SA; solo valor en US$). Lo usa js/embarques.js para repartir por estado lo que el USDA reporta
que cruzó cada semana ("De qué estados viene lo que cruzó").

Por qué: la estimación anterior (excedente mensual del SIAP − consumo del estado, repartido por cercanía al cruce)
coincidía solo 62% con el registro mes a mes en 2025 (70% en el año); casi no asignaba nada a Baja California (44% de
la cebolla, 45% de la lechuga y 30% de la fresa registradas) y daba a Michoacán el limón que exporta Veracruz. Repartir
con lo registrado el mismo mes del año anterior coincidió 94% (ponderado por valor, 21 productos). La SE publica con
~2 meses de retraso: para los meses aún sin dato, js/embarques.js usa el mismo mes del año anterior.

Ojo con la fuente: la SE asigna la exportación al estado del domicilio del exportador, no al de la huerta (de ahí
la Ciudad de México o Nuevo León con algunos puntos). Se usa en valor, no en toneladas.

Salida: data/origen_exportacion.js → window.ORIGEN_EXPORTACION = {ultimo: "AAAA-MM", fuente,
  productos: {clave: {"AAAA-MM": {id estado "01".."32": parte 0–1}}}}   (partes < 0.5% se omiten)
Crudos: data/fuentes/datamexico/export_eua_estados_<año>.json (años cerrados no se vuelven a pedir).
Uso: python scripts/procesar_origen_exportacion.py [primer año=el más antiguo ya guardado, o el anterior]
"""
import json
import subprocess
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path
from urllib.parse import urlencode

sys.path.insert(0, str(Path(__file__).resolve().parent))
from procesar_comercio import FRACCIONES  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
CRUDOS = RAIZ / "data" / "fuentes" / "datamexico"
URL = "https://www.economia.gob.mx/apidatamexico/tesseract/data.jsonrecords?"
MINIMO = 0.005


def bajar(hs6, anio):
    # los ids de SA en Data México llevan antepuesta la sección: 070200 → 2070200 (cap. 07 y 08 = sección 2)
    q = urlencode({"cube": "economy_foreign_trade_ent", "drilldowns": "State,Month", "measures": "Trade Value",
                   "HS6": "2" + hs6, "Flow": 2, "Country": "usa", "Year": anio})
    r = subprocess.run(["curl", "-sS", "--retry", "6", "--retry-all-errors", "--retry-delay", "10", "--max-time", "180", URL + q],
                       capture_output=True, check=True)
    d = json.loads(r.stdout.decode("utf-8"))
    if not isinstance(d, dict) or "data" not in d:   # fracción que Data México no tiene (p. ej. 080299)
        print(f"  sin datos para {hs6}: {str(d)[:80]}", flush=True)
        return []
    return d["data"]


def anio_registrado(anio):
    """{producto: {"AAAA-MM": {estado: US$}}}; el año en curso se vuelve a pedir siempre."""
    ruta = CRUDOS / f"export_eua_estados_{anio}.json"
    if ruta.exists() and anio < date.today().year:
        return json.loads(ruta.read_text(encoding="utf-8"))
    salida = {}
    for k, codigos in FRACCIONES.items():
        por = defaultdict(lambda: defaultdict(float))
        for c in codigos:
            for r in bajar(c, anio):
                por[r["Month"]][f"{int(r['State ID']):02d}"] += r["Trade Value"]
        salida[k] = {m: {e: round(v) for e, v in es.items()} for m, es in sorted(por.items())}
        tot = sum(sum(es.values()) for es in salida[k].values())
        print(f"  {anio} {k:11s} US${tot / 1e6:>8,.0f} M · {len(salida[k])} meses", flush=True)
    CRUDOS.mkdir(parents=True, exist_ok=True)
    ruta.write_text(json.dumps(salida, ensure_ascii=False), encoding="utf-8")
    return salida


def main(desde=None):
    hoy = date.today().year
    # por omisión, todos los años ya guardados (la historia de embarques empieza en 2021) más el anterior y el actual
    guardados = [int(r.stem.rsplit("_", 1)[1]) for r in CRUDOS.glob("export_eua_estados_*.json")]
    desde = desde or min(guardados + [hoy - 1])
    # Se parte del archivo publicado: así, sin las descargas crudas de años viejos (p. ej. en GitHub Actions) no se
    # pierde la historia; los años que se vuelven a pedir reemplazan sus meses
    productos = defaultdict(dict)
    ultimo = ""
    previo = RAIZ / "data" / "origen_exportacion.js"
    if previo.exists():
        t = previo.read_text(encoding="utf-8")
        P = json.JSONDecoder().raw_decode(t[t.index("{", t.index(" = ")):])[0]
        for k, meses in P.get("productos", {}).items():
            productos[k].update(meses)
        ultimo = P.get("ultimo", "")
    for anio in range(desde, hoy + 1):
        for k, meses in anio_registrado(anio).items():
            for m, es in meses.items():
                tot = sum(es.values())
                if tot <= 0:
                    continue
                partes = {e: round(v / tot, 3) for e, v in sorted(es.items(), key=lambda x: -x[1]) if v / tot >= MINIMO}
                productos[k][m] = partes
                ultimo = max(ultimo, m)
    salida = {"ultimo": ultimo, "fuente": "Secretaría de Economía, comercio exterior por entidad federativa (Data México)",
              "generado": date.today().isoformat(), "productos": productos}
    destino = RAIZ / "data" / "origen_exportacion.js"
    destino.write_text("// Generado por scripts/procesar_origen_exportacion.py — SE (Data México): exportación a EE. UU. por estado y mes, partes del valor\n"
                       f"window.ORIGEN_EXPORTACION = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"Último mes registrado: {ultimo} · {len(productos)} productos -> {destino} ({destino.stat().st_size / 1e3:.0f} kB)")


if __name__ == "__main__":
    main(*[int(x) for x in sys.argv[1:]])

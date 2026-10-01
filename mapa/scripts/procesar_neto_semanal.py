"""
Precio neto al productor por semana (paso 4): cuánto le queda a un estado si vende en la frontera, semana a semana.

  neto(estado, cruce, semana) = FOB del producto mexicano en el cruce (USDA AMS, reportes 2402/2403 Phoenix, US$/kg)
                                × tipo de cambio de la semana (FRED DEXMXUS, diario)
                                − km del estado al cruce × tarifa de flete del estado (js/precios_eua.js)
  tarifa del estado = tarifa del simulador × (0.6 + 0.4 × diésel del estado / diésel nacional promedio 2025):
  el diésel pesa ~40% del costo de operar un tractocamión; el resto (operador, casetas, desgaste, refrigeración) se
  toma igual en todo el país.

Este script prepara lo que no depende de la distancia (la distancia y la tarifa las calcula el mapa):
  - por producto y cruce: FOB en pesos por kg de las últimas 52 semanas, y el perfil típico por semana del año
    (mediana de los años completos desde 2021) para "la mejor semana para vender";
  - diésel promedio mensual por estado (CNE, estaciones de servicio) del último mes publicado y su promedio 2025.

Entradas: data/fuentes/usda/ams/240[23]_*.json.gz (scripts/descargar_historia_ams.py), data/precios_eua.js (mercancía
y empaque de referencia de la frontera), CNE "Precios promedio diarios y mensuales en estaciones de servicio" (xlsx,
se baja el del último mes disponible a data/fuentes/cne/), FRED DEXMXUS (CSV público, se renueva cada vez).
Salida: data/neto_semanal.js → window.NETO_SEMANAL (carga diferida desde js/precios_eua.js)
Uso: python scripts/procesar_neto_semanal.py
"""
import csv
import gzip
import io
import json
import re
import subprocess
import sys
import unicodedata
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path
from statistics import median

sys.path.insert(0, str(Path(__file__).resolve().parent))
from procesar_ams import NOMBRE_MERCANCIA, kg_empaque, precio  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
AMS = RAIZ / "data" / "fuentes" / "usda" / "ams"
CNE = RAIZ / "data" / "fuentes" / "cne"
FRED = RAIZ / "data" / "fuentes" / "fred_dexmxus_diario.csv"
MIN_COT = 3
DESDE = 2021  # años completos para el perfil típico (desde 2021 la serie de embarques y cruces es continua)
MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
URL_CNE = "https://www.cne.gob.mx/da/CNE/DATOS%20ABIERTOS%20(GASOLINAS%20Y%20DI%c3%89SEL)/{a}/{m}/Precios_promedio_diarios_y_mensuales_en_estaciones_de_servicio_{ml}_{a}.xlsx"


def norm(t):
    return unicodedata.normalize("NFKD", str(t)).encode("ascii", "ignore").decode().lower().strip()


def lunes(fecha_mdY):
    m, d, a = map(int, fecha_mdY.split("/"))
    x = date(a, m, d)
    return x - timedelta(days=x.weekday())


def curl(url, destino):
    r = subprocess.run(["curl", "-sS", "-L", "--retry", "4", "--retry-all-errors", "--max-time", "180", "-A", "Mozilla/5.0",
                        "-o", str(destino), "-w", "%{http_code}", url], capture_output=True, text=True)
    return r.stdout.strip() == "200" and destino.exists() and destino.stat().st_size > 10000


# ---------- tipo de cambio semanal ----------
def tipo_cambio():
    hoy = date.today()
    url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id=DEXMXUS&cosd=2019-01-01&coed={hoy.isoformat()}"
    import urllib.request   # con curl, FRED a veces no responde; con urllib sí
    try:
        FRED.write_bytes(urllib.request.urlopen(url, timeout=60).read())
    except OSError as e:
        if not FRED.exists():
            raise SystemExit(f"No se pudo bajar DEXMXUS de FRED: {e}")
    por = defaultdict(list)
    for r in list(csv.reader(io.StringIO(FRED.read_text(encoding="utf-8"))))[1:]:
        if len(r) > 1 and r[1] not in ("", "."):
            d = date.fromisoformat(r[0])
            por[d - timedelta(days=d.weekday())].append(float(r[1]))
    return {s: sum(v) / len(v) for s, v in por.items()}


def tc_de(tc, s):
    for i in range(0, 8):   # semana sin cotización (feriados en EE. UU.): la anterior
        x = tc.get(s - timedelta(weeks=i))
        if x:
            return x
    return None


# ---------- diésel por estado (CNE) ----------
def diesel():
    hoy = date.today()
    ruta = None
    CNE.mkdir(parents=True, exist_ok=True)   # en GitHub Actions no existe la primera vez (curl -o no la crea)
    for atras in range(0, 6):
        a, m = (hoy.year, hoy.month - atras) if hoy.month - atras > 0 else (hoy.year - 1, hoy.month - atras + 12)
        r = CNE / f"precios_{MESES[m - 1].lower()}_{a}.xlsx"
        if r.exists() or curl(URL_CNE.format(a=a, m=MESES[m - 1], ml=MESES[m - 1].lower()), r):
            ruta = r
            break
        r.unlink(missing_ok=True)
    if not ruta:
        # La CNE a veces no responde (desde GitHub Actions, por ejemplo): se conserva el diésel de la versión anterior
        previo = RAIZ / "data" / "neto_semanal.js"
        if previo.exists():
            t = previo.read_text(encoding="utf-8")
            d = json.JSONDecoder().raw_decode(t[t.index("{", t.index(" = ")):])[0].get("diesel")
            if d:
                print(f"  CNE sin respuesta: se conserva el diésel de {d['mes']}")
                return d
        raise SystemExit("No se encontró el archivo de precios de la CNE de los últimos 6 meses")
    import openpyxl
    ws = openpyxl.load_workbook(ruta, read_only=True, data_only=True)["Cuadro 1.4"]
    filas = list(ws.iter_rows(values_only=True))
    i_anio = next(i for i, r in enumerate(filas) if r and norm(r[0]) == "entidad")
    anios, meses = filas[i_anio], filas[i_anio + 1]
    col = {}
    anio = None
    for j in range(1, len(meses)):
        if j < len(anios) and isinstance(anios[j], (int, float)):
            anio = int(anios[j])
        if anio and meses[j]:
            col[j] = (anio, ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"].index(str(meses[j]).strip()[:3].upper()) + 1)
    serie = {}
    for r in filas[i_anio + 2:]:
        if not r or not r[0]:
            continue
        serie[str(r[0]).strip()] = {col[j]: float(v) for j, v in enumerate(r) if j in col and isinstance(v, (int, float))}
    ultimo = max(k for v in serie.values() for k in v)
    texto = (RAIZ / "data" / "estados.js").read_text(encoding="utf-8")
    ids = {norm(n): i for i, n in re.findall(r'id:\s*"(\d{2})"[^}]*?nombre:\s*"([^"]+)"', texto)}

    def id_de(nombre):
        n = norm(nombre)
        if n in ids:
            return ids[n]
        if n in ("mexico", "estado de mexico"):
            return ids.get("mexico") or ids.get("estado de mexico")
        return next((i for nn, i in ids.items() if n.startswith(nn) or nn.startswith(n.split(" de ")[0])), None)

    estados = {}
    for nombre, v in serie.items():
        if norm(nombre) == "nacional":
            continue
        i = id_de(nombre)
        if i and ultimo in v:
            estados[i] = round(v[ultimo], 2)
    nac = serie[next(n for n in serie if norm(n) == "nacional")]
    base = [x for (a, _), x in nac.items() if a == 2025]
    faltan = sorted(set(ids.values()) - set(estados))
    if faltan:
        print("  diésel: estados sin dato:", faltan)
    return {"mes": f"{ultimo[0]}-{ultimo[1]:02d}", "nacional": round(nac[ultimo], 2), "base2025": round(sum(base) / len(base), 2),
            "estados": estados, "fuente": f"CNE, precios promedio mensuales de diésel en estaciones de servicio ({ruta.name})"}


# ---------- FOB semanal por cruce ----------
def fob_semanal():
    t = (RAIZ / "data" / "precios_eua.js").read_text(encoding="utf-8")
    P = json.loads(t[t.index("{"):t.rindex("}") + 1])
    inv = {v: c for c, v in NOMBRE_MERCANCIA.items()}
    ref = {(inv.get(d["frontera"]["mercancia"], d["frontera"]["mercancia"]), d["frontera"]["empaque"]): k
           for k, d in P["productos"].items() if d.get("frontera", {}).get("mercancia")}
    obs = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    for f in sorted(AMS.glob("240[23]_*.json.gz")):
        for r in json.load(gzip.open(f, "rt", encoding="utf-8")):
            pk = r.get("pkg") or r.get("package")
            k = ref.get((r.get("commodity"), pk))
            d = (r.get("district") or "").lower()
            if not k or "mexico" not in d or r.get("organic") == "Y":
                continue
            cruce = ("Nogales" if "nogales" in d or "arizona" in d else "Otay Mesa" if "otay" in d or "california" in d
                     else "McAllen" if "texas" in d else None)
            p, kg = precio(r), kg_empaque(r["commodity"], pk)
            if cruce and p and kg:
                obs[k][cruce][lunes(r["report_date"])].append(p / kg)
    # semana con menos de MIN_COT cotizaciones en un cruce: no se usa (una cotización rara dispara el "mejor cruce")
    return {k: {c: {s: median(v) for s, v in por.items() if len(v) >= MIN_COT} for c, por in cr.items()} for k, cr in obs.items()}, \
        {k: f"{d['frontera']['mercancia']}, {d['frontera']['empaque']}" for k, d in P["productos"].items() if d.get("frontera")}


def main():
    tc = tipo_cambio()
    di = diesel()
    fob, refs = fob_semanal()
    hoy = date.today()
    ult_lunes = hoy - timedelta(days=hoy.weekday())
    inicio = ult_lunes - timedelta(weeks=51)
    productos = {}
    for k, cruces in fob.items():
        item = {"referencia": refs.get(k), "cruces": {}}
        for c, serie in cruces.items():
            pesos = {s: v * tc_de(tc, s) for s, v in serie.items() if tc_de(tc, s)}
            # perfil típico: mediana por semana del año (ISO, la 53 se junta con la 52) en años completos
            por_sem = defaultdict(list)
            for s, v in pesos.items():
                if DESDE <= s.year < hoy.year:
                    por_sem[min(52, s.isocalendar()[1])].append(v)
            tipico = [round(median(por_sem[w]), 2) if len(por_sem[w]) >= 2 else None for w in range(1, 53)]
            ultimas = [round(pesos[s], 2) if (s := inicio + timedelta(weeks=i)) in pesos else None for i in range(52)]
            if sum(x is not None for x in tipico) < 8 and not any(ultimas):
                continue
            item["cruces"][c] = {"tipico": tipico, "ultimas": ultimas,
                                 "anios": sorted({s.year for s in pesos if DESDE <= s.year < hoy.year})}
        if item["cruces"]:
            productos[k] = item
    ult_tc = max(tc)
    salida = {"generado": hoy.isoformat(), "inicio": inicio.isoformat(), "desde": DESDE,
              "tc": {"valor": round(tc[ult_tc], 2), "semana": ult_tc.isoformat(), "fuente": "Reserva Federal (H.10, DEXMXUS) vía FRED"},
              "diesel": di, "productos": productos}
    destino = RAIZ / "data" / "neto_semanal.js"
    destino.write_text("// Generado por scripts/procesar_neto_semanal.py — FOB semanal en la frontera (USDA AMS) en pesos, diésel por estado (CNE)\n"
                       f"window.NETO_SEMANAL = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"Diésel {di['mes']}: nacional ${di['nacional']} (promedio 2025 ${di['base2025']}), {len(di['estados'])} estados · "
          f"tipo de cambio {salida['tc']['valor']} ({ult_tc})")
    print(f"{len(productos)} productos -> {destino} ({destino.stat().st_size / 1e3:.0f} kB)")
    for k, it in productos.items():
        print(f"  {k:11s} " + " · ".join(f"{c}: {sum(x is not None for x in v['tipico'])} sem. típicas, "
                                          f"{sum(x is not None for x in v['ultimas'])} recientes" for c, v in it["cruces"].items()))


if __name__ == "__main__":
    main()

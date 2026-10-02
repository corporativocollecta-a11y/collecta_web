"""
Pronóstico de 8 semanas del precio de mayoreo en México (centrales de abasto, SNIIM), por producto (paso 5).

Serie: mediana semanal del precio frecuente (MXN/kg) de la variedad principal de cada producto
(scripts/procesar_sniim.py, VARIEDADES[k][0]) en todas las centrales y orígenes, desde 2019.
Método: el mismo de scripts/procesar_pronostico.py (USDA): misma semana en años previos × nivel de las últimas 4
semanas; en cada horizonte se usa ese método o la persistencia (repetir el último precio), el que haya acertado más en
la prueba hacia atrás de las últimas 104 semanas; banda = percentiles 20–80 del error de esa prueba. Se publica el
error medio (MAPE) de cada producto: si es alto, el pronóstico no sirve.

Descarga: un año de una variedad ≈ 9 MB y ~10 s; el SNIIM responde 503 si se le consulta seguido (reintentos en
procesar_sniim.descargar). El año en curso se vuelve a pedir si la copia tiene más de 6 días.
Salida: data/pronostico_sniim.js → window.PRONOSTICO_SNIIM (carga diferida desde js/precios.js)
Uso: python scripts/procesar_pronostico_sniim.py [primer año=2019]
"""
import json
import statistics
import sys
import time
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from procesar_pronostico import H, pronosticar, prueba_hacia_atras  # noqa: E402
from procesar_sniim import VARIEDADES, descargar  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
CACHE = RAIZ / "data" / "fuentes" / "sniim"
ORIGEN = date(2019, 1, 7)   # primer lunes de 2019: índice de semana 0


def serie_semanal(pid, desde):
    hoy = date.today()
    obs = defaultdict(list)
    for anio in range(desde, hoy.year + 1):
        cache = CACHE / f"{anio}_{pid}.csv"
        if anio == hoy.year and cache.exists() and time.time() - cache.stat().st_mtime > 6 * 86400:
            cache.unlink()
        for f in descargar(anio, pid):
            try:
                d, m, a = map(int, f[0].split("/"))
                p = float(f[6].replace(",", ""))
            except (ValueError, IndexError):
                continue
            if p > 0:
                x = date(a, m, d)
                if x - timedelta(days=x.weekday()) + timedelta(days=6) >= hoy:   # semana en curso: incompleta, no se usa
                    continue
                obs[((x - timedelta(days=x.weekday())) - ORIGEN).days // 7].append(p)
    return {i: statistics.median(v) for i, v in obs.items() if i >= 0 and len(v) >= 3}


# Granos: consulta semanal propia del SNIIM (procesar_sniim.descargar_granos), todas las semanas desde 2022 de la variedad
# principal (≈4 cotizaciones por central al mes; cada semana es una consulta: más años saturarían el servidor)
GRANOS_PRONOSTICO = {"maiz_blanco": [(605, "Maíz blanco")], "frijol": [(347, "Negro"), (352, "Pinto")], "arroz": [(3, "Pulido")],
                     "garbanzo": [(601, "Grande"), (600, "Chico")]}
DESDE_GRANOS = 2022


HISTORIA_GRANOS = RAIZ / "data" / "sniim_granos_historia.js"


def leer_historia_granos():
    """{pid: {semana: mediana}} guardado en data/ (viaja con el sitio: GitHub Actions no tiene las descargas semanales)."""
    if not HISTORIA_GRANOS.exists():
        return {}
    t = HISTORIA_GRANOS.read_text(encoding="utf-8")
    d = json.loads(t[t.index("{"):t.rindex("}") + 1])
    return {int(p): {int(i): v for i, v in s.items()} for p, s in d["series"].items()}


def guardar_historia_granos(hist):
    HISTORIA_GRANOS.write_text(
        "// Generado por scripts/procesar_pronostico_sniim.py — mediana semanal del mayoreo de granos (SNIIM), historia para el pronóstico\n"
        "// {series: {id de variedad SNIIM: {semana desde el 7 de enero de 2019: MXN/kg}}}\n"
        f"window.SNIIM_GRANOS_HISTORIA = {json.dumps({'generado': date.today().isoformat(), 'series': {str(p): {str(i): round(v, 2) for i, v in sorted(s.items())} for p, s in hist.items()}}, separators=(',', ':'))};\n",
        encoding="utf-8")


def serie_semanal_granos(pid, hist):
    """Historia guardada + lo que se descarga: si ya hay historia, solo el año en curso (y el anterior en enero)."""
    from procesar_sniim import descargar_granos
    hoy = date.today()
    previa = hist.get(pid, {})
    desde = DESDE_GRANOS if len(previa) < 104 else (hoy.year - 1 if hoy.month == 1 else hoy.year)
    obs = defaultdict(list)
    for anio in range(desde, hoy.year + 1):
        for f in descargar_granos(anio, pid, semanas=(1, 2, 3, 4, 5)):
            try:
                d, m, a = map(int, f[0].split("/"))
                p = float(f[6].replace(",", ""))
            except (ValueError, IndexError):
                continue
            if p > 0:
                x = date(a, m, d)
                if x - timedelta(days=x.weekday()) + timedelta(days=6) >= hoy:
                    continue
                obs[((x - timedelta(days=x.weekday())) - ORIGEN).days // 7].append(p)
    nueva = {i: statistics.median(v) for i, v in obs.items() if i >= 0 and len(v) >= 3}
    hist[pid] = {**previa, **nueva}
    return hist[pid]


def main(desde=2019):
    hist_granos = leer_historia_granos()
    salida = {}
    for k, variedades in {**VARIEDADES, **GRANOS_PRONOSTICO}.items():
        # variedad principal; si no alcanza (p. ej. mango Kent al empezar su temporada), la siguiente
        for pid, nombre in variedades:
            try:
                serie = serie_semanal_granos(pid, hist_granos) if k in GRANOS_PRONOSTICO else serie_semanal(pid, desde)
            except Exception as e:  # noqa: BLE001  (un producto que falla no detiene a los demás)
                print(f"  {k}: error {e}", flush=True)
                continue
            if len(serie) < 104:   # frutas de temporada tienen huecos: 2 años de semanas bastan
                print(f"  {k:12s} {nombre}: solo {len(serie)} semanas", flush=True)
                continue
            u = max(serie)
            r = pronosticar(serie, None, u)
            if r and any(x is not None for x in r[0]):
                break
            print(f"  {k:12s} {nombre}: sin semanas recientes suficientes para pronosticar", flush=True)
        else:
            continue
        err_est, err_ing = prueba_hacia_atras(serie, u)
        mape_de = lambda e, h: statistics.mean(abs(x) for x in e[h]) if len(e.get(h, [])) >= 20 else None
        p50, err, metodo = [], {}, []
        for h in range(1, H + 1):
            me, mi = mape_de(err_est, h), mape_de(err_ing, h)
            usar_ing = me is None or r[0][h - 1] is None or (mi is not None and mi < me)
            p50.append(serie[u] if usar_ing else r[0][h - 1])
            err[h] = err_ing[h] if usar_ing else err_est[h]
            metodo.append("p" if usar_ing else "e")
        banda = {h: (statistics.quantiles(e, n=10)[1], statistics.quantiles(e, n=10)[7]) for h, e in err.items() if len(e) >= 20}
        mape = [round(statistics.mean(abs(x) for x in err[h]), 3) if len(err.get(h, [])) >= 20 else None for h in (1, 4, 8)]
        mape_ing = [round(mape_de(err_ing, h), 3) if mape_de(err_ing, h) is not None else None for h in (1, 4, 8)]
        i0 = max(min(serie), u - 156)   # se publican las últimas 3 años de la serie
        salida[k] = {"variedad": nombre, "id": pid, "inicio": (ORIGEN + timedelta(weeks=i0)).isoformat(), "ultima": (ORIGEN + timedelta(weeks=u)).isoformat(),
                     "serie": [round(serie[i], 2) if i in serie else None for i in range(i0, u + 1)],
                     "p50": [round(x, 2) for x in p50],
                     "p20": [round(x / (1 + banda[h][1]), 2) if h in banda else None for h, x in enumerate(p50, 1)],
                     "p80": [round(x / (1 + banda[h][0]), 2) if h in banda else None for h, x in enumerate(p50, 1)],
                     "mape": mape, "mapeIngenuo": mape_ing, "metodo": "".join(metodo), "factor": round(r[1], 2)}
        print(f"  {k:12s} {nombre:22s} {len(serie)} sem. · MAPE 1/4/8 {mape} · persistencia {mape_ing} · {''.join(metodo)}", flush=True)
    if hist_granos:
        guardar_historia_granos(hist_granos)
    datos = {"generado": date.today().isoformat(), "horizonte": H, "fuente": "SNIIM, precios de mercados nacionales (precio frecuente, MXN/kg)",
             "productos": salida}
    destino = RAIZ / "data" / "pronostico_sniim.js"
    destino.write_text("// Generado por scripts/procesar_pronostico_sniim.py — pronóstico semanal del precio de mayoreo en México (SNIIM)\n"
                       f"window.PRONOSTICO_SNIIM = {json.dumps(datos, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"{len(salida)} productos -> {destino} ({destino.stat().st_size / 1e3:.0f} kB)")


if __name__ == "__main__":
    main(*[int(x) for x in sys.argv[1:]])

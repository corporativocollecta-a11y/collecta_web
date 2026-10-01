"""
Prueba hacia atrás de la alerta de oferta (scripts/procesar_alerta_oferta.py): ¿la señal del SIAP al cierre de un mes
anticipa el precio en EE. UU. 8–12 semanas después?

Para cada producto con precio USDA y cada mes de corte (2019 → último con datos):
  señal   = misma fórmula que la alerta publicada, contra el mismo corte del año anterior
            (cíclicos: superficie por cosechar; perennes: producción acumulada a la fecha)
  precio  = mediana semanal US$/kg de la referencia del mapa (terminales LA/Chicago/NY y FOB frontera, data/precios_eua.js)
  y_h     = log(precio medio en las semanas h del corte / mismas semanas del año anterior)
  x0      = log(precio de las 4 semanas previas al corte / mismas semanas del año anterior): lo que el precio ya traía
Se reporta la correlación de rangos (Spearman) señal ↔ y, y la regresión y = a + b·x0 + c·señal agrupada por producto
(errores por bloques de año, porque los cortes mensuales se traslapan). Si c < 0 con consistencia (más oferta → precio
menor que el año anterior), la señal aporta algo que el precio de hoy no dice.

Uso:
  python scripts/backtest_alerta.py descargar   # baja los cortes mensuales del SIAP que falten (lento, ~1 h la primera vez)
  python scripts/backtest_alerta.py             # análisis → analisis/backtest_alerta.json y resumen en pantalla
(analisis/ no se publica en el sitio)
"""
import json
import math
import statistics
import sys
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from procesar_alerta_oferta import PERENNES, tabla4  # noqa: E402
from procesar_avance_siap import CULTIVOS, consulta  # noqa: E402
from procesar_pronostico import leer_js, precios_semanales  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
PRIMER_ANIO = 2018          # base de la primera señal (2019 contra 2018)
VENTANAS = {"0-4": (0, 4), "4-8": (4, 8), "8-12": (8, 12), "12-16": (12, 16)}


def referencias():
    P = leer_js("precios_eua.js", "PRECIOS_EUA")
    ref = {}
    for k, d in P["productos"].items():
        r = {}
        if d.get("mercancia") and d.get("empaque"):
            r["mayoreo"] = (d["mercancia"], d["empaque"])
        if d.get("frontera", {}).get("mercancia"):
            r["frontera"] = (d["frontera"]["mercancia"], d["frontera"]["empaque"])
        if r and k in CULTIVOS:
            ref[k] = r
    return ref


def cortes(hasta):
    return [(a, m) for a in range(PRIMER_ANIO, hasta[0] + 1) for m in range(1, 13) if (a, m) <= hasta]


def ultimo_corte():
    hoy = date.today()
    return (hoy.year, hoy.month - 2) if hoy.month > 2 else (hoy.year - 1, hoy.month + 10)


def descargar():
    prods = list(referencias())
    tareas = [(k, a, m) for k in prods for a, m in cortes(ultimo_corte())]
    print(f"{len(prods)} productos × {len(tareas) // len(prods)} cortes = {len(tareas)} consultas (las guardadas no se repiten)", flush=True)
    hechas = 0

    def una(t):
        try:
            consulta(CULTIVOS[t[0]], t[1], t[2])
            return None
        except Exception as e:  # noqa: BLE001
            return f"{t}: {e}"

    with ThreadPoolExecutor(max_workers=3) as ex:
        for err in ex.map(una, tareas):
            hechas += 1
            if err:
                print("  error", err, flush=True)
            if hechas % 100 == 0:
                print(f"  {hechas}/{len(tareas)}", flush=True)


def nacional(k, a, m):
    """[sembrada, cosechada, siniestrada, producción] nacional al corte, o None si el corte no es de ese año."""
    fuera, corte = tabla4(consulta(CULTIVOS[k], a, m))
    if not fuera or not corte or str(a) not in corte:
        return None
    return [sum(v[j] for v in fuera.values()) for j in range(4)]


def senal(k, act, ant):
    if not act or not ant:
        return None
    if k in PERENNES:
        return act[3] / ant[3] - 1 if ant[3] > 0 and act[3] > 0 else None
    pa, pb = act[0] - act[1] - act[2], ant[0] - ant[1] - ant[2]
    return pa / pb - 1 if pb > 0 and pa > 0 else None


def media(serie, desde, n0, n1):
    v = [serie[s] for s in (desde + timedelta(weeks=i) for i in range(n0, n1)) if s in serie]
    return statistics.mean(v) if len(v) >= max(2, (n1 - n0) // 2) else None


def rangos(x):
    orden = sorted(range(len(x)), key=lambda i: x[i])
    r = [0.0] * len(x)
    i = 0
    while i < len(orden):
        j = i
        while j + 1 < len(orden) and x[orden[j + 1]] == x[orden[i]]:
            j += 1
        for t in range(i, j + 1):
            r[orden[t]] = (i + j) / 2
        i = j + 1
    return r


def pearson(x, y):
    mx, my = statistics.mean(x), statistics.mean(y)
    sx = math.sqrt(sum((a - mx) ** 2 for a in x))
    sy = math.sqrt(sum((b - my) ** 2 for b in y))
    return sum((a - mx) * (b - my) for a, b in zip(x, y)) / (sx * sy) if sx and sy else None


def spearman(x, y):
    return pearson(rangos(x), rangos(y)) if len(x) >= 8 else None


def ols(filas):
    """y = a + b·x0 + c·s con efectos fijos de producto (datos centrados por producto). Devuelve (b, c, ee_c por bloques de año)."""
    por = defaultdict(list)
    for f in filas:
        por[f["k"]].append(f)
    cen = []
    for fs in por.values():
        mx0, ms, my = (statistics.mean(f[c] for f in fs) for c in ("x0", "s", "y"))
        cen += [(f["x0"] - mx0, f["s"] - ms, f["y"] - my, f["anio"]) for f in fs]
    sxx = sum(a * a for a, _, _, _ in cen)
    sss = sum(b * b for _, b, _, _ in cen)
    sxs = sum(a * b for a, b, _, _ in cen)
    sxy = sum(a * y for a, _, y, _ in cen)
    ssy = sum(b * y for _, b, y, _ in cen)
    det = sxx * sss - sxs * sxs
    if det <= 0:
        return None
    b = (sss * sxy - sxs * ssy) / det
    c = (sxx * ssy - sxs * sxy) / det
    # error estándar de c agrupado por año (sándwich), porque los cortes de un mismo año comparten choques
    inv = [[sss / det, -sxs / det], [-sxs / det, sxx / det]]
    grupos = defaultdict(lambda: [0.0, 0.0])
    for a, s, y, anio in cen:
        e = y - b * a - c * s
        grupos[anio][0] += a * e
        grupos[anio][1] += s * e
    meat = [[sum(g[i] * g[j] for g in grupos.values()) for j in range(2)] for i in range(2)]
    var_c = sum(inv[1][i] * meat[i][j] * inv[j][1] for i in range(2) for j in range(2))
    return b, c, math.sqrt(var_c) if var_c > 0 else None


def main():
    ref = referencias()
    precios = precios_semanales(ref)
    hasta = ultimo_corte()
    filas = []
    for k in ref:
        niv = {}
        for a, m in cortes(hasta):
            try:
                niv[(a, m)] = nacional(k, a, m)
            except FileNotFoundError:
                niv[(a, m)] = None
        for tipo, serie in precios.get(k, {}).items():
            for a, m in cortes(hasta):
                if a == PRIMER_ANIO:
                    continue
                s = senal(k, niv.get((a, m)), niv.get((a - 1, m)))
                if s is None:
                    continue
                fin = date(a + (m == 12), m % 12 + 1, 1) - timedelta(days=1)
                l0 = fin - timedelta(days=fin.weekday())                 # lunes de la semana del corte
                l0_ant = l0 - timedelta(weeks=52)
                p0, p0a = media(serie, l0, -3, 1), media(serie, l0_ant, -3, 1)
                if not p0 or not p0a:
                    continue
                fila = {"k": k, "tipo": tipo, "anio": a, "mes": m, "s": s, "x0": math.log(p0 / p0a)}
                for nombre, (n0, n1) in VENTANAS.items():
                    p, pa = media(serie, l0, n0 + 1, n1 + 1), media(serie, l0_ant, n0 + 1, n1 + 1)
                    fila[nombre] = math.log(p / pa) if p and pa else None
                filas.append(fila)
    # señal acotada para que un año con base casi nula no domine la regresión
    for f in filas:
        f["s"] = max(-0.6, min(0.6, f["s"]))
    resultado = {"generado": date.today().isoformat(), "observaciones": len(filas), "ventanas": {}, "productos": {}}
    print(f"{len(filas)} observaciones (producto × referencia de precio × mes de corte), {hasta[0]}-{hasta[1]:02d} último corte\n")
    for tipo in ("mayoreo", "frontera"):
        ft = [f for f in filas if f["tipo"] == tipo]
        if not ft:
            continue
        print(f"== Precio {tipo} ==")
        for v in VENTANAS:
            fv = [dict(f, y=f[v]) for f in ft if f[v] is not None]
            if len(fv) < 30:
                continue
            rho = spearman([f["s"] for f in fv], [f["y"] for f in fv])
            r = ols(fv)
            # señales fuertes: ¿el precio quedó del lado esperado?
            altos = [f for f in fv if f["s"] >= 0.15]
            bajos = [f for f in fv if f["s"] <= -0.15]
            acierto = lambda fs, lado: sum(1 for f in fs if (f["y"] < 0) == (lado > 0)) / len(fs) if fs else None
            base = sum(1 for f in fv if f["y"] < 0) / len(fv)
            linea = {"n": len(fv), "spearman": rho, "b_x0": r[0] if r else None, "c_senal": r[1] if r else None,
                     "ee_c": r[2] if r else None, "n_alta": len(altos), "baja_precio_si_alta": acierto(altos, 1),
                     "n_baja": len(bajos), "sube_precio_si_baja": acierto(bajos, -1), "base_baja_precio": base}
            resultado["ventanas"][f"{tipo} {v}"] = linea
            t = r[1] / r[2] if r and r[2] else float("nan")
            print(f"  semanas {v:5s} n={len(fv):4d}  Spearman {rho:+.2f}  | regresión: precio previo {r[0]:+.2f}, "
                  f"señal {r[1]:+.3f} (t={t:+.1f})  | señal ≥+15%: {linea['baja_precio_si_alta'] or 0:.0%} bajó (n={len(altos)}), "
                  f"≤−15%: {linea['sube_precio_si_baja'] or 0:.0%} subió (n={len(bajos)}), base {base:.0%} bajó")
        print()
    print("== Por producto (mayoreo, semanas 8-12): Spearman señal↔precio y n ==")
    for k in ref:
        fv = [f for f in filas if f["k"] == k and f["tipo"] == "mayoreo" and f["8-12"] is not None]
        if len(fv) < 12:
            continue
        rho = spearman([f["s"] for f in fv], [f["8-12"] for f in fv])
        rho0 = spearman([f["x0"] for f in fv], [f["8-12"] for f in fv])
        resultado["productos"][k] = {"n": len(fv), "spearman": rho, "spearman_precio_previo": rho0,
                                     "perenne": k in PERENNES}
        print(f"  {k:12s} {'perenne' if k in PERENNES else 'cíclico':8s} n={len(fv):3d}  señal {rho:+.2f}   precio previo {rho0:+.2f}")
    (RAIZ / "analisis").mkdir(exist_ok=True)
    destino = RAIZ / "analisis" / "backtest_alerta.json"
    destino.write_text(json.dumps(resultado, ensure_ascii=False, indent=1), encoding="utf-8")
    (RAIZ / "analisis" / "backtest_alerta_filas.json").write_text(json.dumps(filas, ensure_ascii=False), encoding="utf-8")
    print(f"\n-> {destino}")


if __name__ == "__main__":
    descargar() if sys.argv[1:] == ["descargar"] else main()

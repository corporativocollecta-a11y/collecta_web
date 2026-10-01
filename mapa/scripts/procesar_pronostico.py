"""
Pronóstico semanal de oferta y precio en EE. UU. por producto (8 semanas), a partir de la historia del USDA:
  - Oferta: embarques semanales por origen (data/embarques.js, scripts/procesar_embarques.py), agrupados en
    EE. UU., México (cruces) e importaciones.
  - Precio: mediana semanal en US$/kg de la mercancía y empaque de referencia del mapa (data/precios_eua.js) en los
    mercados terminales de Los Ángeles, Chicago y Nueva York, y precio FOB del producto mexicano en la frontera (Phoenix).

Método (transparente, sin cajas negras): estacionalidad de años anteriores × nivel reciente.
  pronóstico(semana s + h) = mediana de la misma semana del año (±1) en años previos × factor de nivel, donde el factor
  es la razón entre las últimas 4 semanas observadas y esas mismas semanas en años previos (acotado a 0.5–2).
  Banda = percentiles 20 y 80 del error relativo que tuvo el mismo método en la historia (prueba hacia atrás) al mismo
  horizonte. Se publica el error medio (MAPE) de esa prueba para cada producto: si es alto, el pronóstico no sirve.

Salida: data/pronostico.js → window.PRONOSTICO (carga diferida desde js/embarques.js)
Uso: python scripts/procesar_pronostico.py
"""
import glob
import gzip
import json
import re
import statistics
import sys
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from procesar_ams import NOMBRE_MERCANCIA, kg_empaque, precio  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
FUENTE = RAIZ / "data" / "fuentes" / "usda" / "ams"
TERMINALES = (2306, 2307, 2290, 2291, 2314, 2315)   # Los Ángeles, Chicago, Nueva York (frutas y hortalizas)
FRONTERA = (2402, 2403)
H = 8                # semanas de pronóstico
MIN_ANIOS = 3        # años previos necesarios para estimar la estacionalidad


def leer_js(nombre, variable):
    t = (RAIZ / "data" / nombre).read_text(encoding="utf-8")
    return json.loads(t[t.index("{"):t.rindex("}") + 1])


def lunes(fecha_mdY):
    m, d, a = map(int, fecha_mdY.split("/"))
    x = date(a, m, d)
    return x - timedelta(days=x.weekday())


def precios_semanales(referencias):
    """{k: {"mayoreo": {lunes: US$/kg}, "frontera": {lunes: US$/kg}}} con la mercancía y el empaque de referencia."""
    inv = {v: c for c, v in NOMBRE_MERCANCIA.items()}
    buscar = defaultdict(list)   # (tipo, mercancía AMS, empaque) → productos
    for k, ref in referencias.items():
        for tipo, (mc, pk) in ref.items():
            buscar[(tipo, inv.get(mc, mc), pk)].append(k)
    obs = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    for tipo, slugs in (("mayoreo", TERMINALES), ("frontera", FRONTERA)):
        for s in slugs:
            for f in sorted(glob.glob(str(FUENTE / f"{s}_*.json.gz"))):
                for r in json.load(gzip.open(f, "rt", encoding="utf-8")):
                    ks = buscar.get((tipo, r.get("commodity"), r.get("package")))
                    if not ks or r.get("organic") == "Y":
                        continue
                    if tipo == "frontera" and "mexico" not in (r.get("district") or "").lower():
                        continue
                    p, kg = precio(r), kg_empaque(r["commodity"], r["package"])
                    if p and kg:
                        for k in ks:
                            obs[k][tipo][lunes(r["report_date"])].append(p / kg)
    return {k: {t: {s: statistics.median(v) for s, v in por.items()} for t, por in d.items()} for k, d in obs.items()}


def pronosticar(serie, semanas, ultimo):
    """serie: {índice de semana: valor}. Devuelve (p50[H], factor, estacional usado) o None."""
    def estacional(i_objetivo, excluir_desde):
        # misma semana del año (±1) en años previos, sin usar datos posteriores a excluir_desde
        vals = []
        for anios_atras in range(1, 8):
            for d in (-1, 0, 1):
                j = i_objetivo - 52 * anios_atras + d
                if 0 <= j < excluir_desde and j in serie:
                    vals.append(serie[j])
        return statistics.median(vals) if len(vals) >= MIN_ANIOS else None

    def en(i_base):
        rec = [i for i in range(i_base - 3, i_base + 1) if i in serie]
        if len(rec) < 3:
            return None
        base_prev = [estacional(i, i_base + 1) for i in rec]
        if any(b is None or b <= 0 for b in base_prev):
            factor = 1.0
        else:
            factor = sum(serie[i] for i in rec) / sum(base_prev)
            factor = min(2.0, max(0.5, factor))
        out = []
        for h in range(1, H + 1):
            e = estacional(i_base + h, i_base + 1)
            out.append(None if e is None else e * factor)
        return out, factor

    return en(ultimo)


def prueba_hacia_atras(serie, ultimo):
    """Error relativo por horizonte de pronósticos hechos en el pasado (últimas 104 semanas con dato), del método
    estacional y de la referencia ingenua (persistencia: el valor de la última semana se repite)."""
    errores, ingenuo = defaultdict(list), defaultdict(list)
    for base in range(max(0, ultimo - 104 - H), ultimo - H + 1):
        if base not in serie:
            continue
        r = pronosticar(serie, None, base)
        for h in range(1, H + 1):
            real = serie.get(base + h)
            if not real or real <= 0:
                continue
            p = r[0][h - 1] if r else None
            if p:
                errores[h].append(p / real - 1)
                ingenuo[h].append(serie[base] / real - 1)   # misma semana de comparación que el método
    return errores, ingenuo


def main():
    E = leer_js("embarques.js", "EMBARQUES")
    P = leer_js("precios_eua.js", "PRECIOS_EUA")
    semanas = [date.fromisoformat(s) for s in E["semanas"]]
    idx = {s: i for i, s in enumerate(semanas)}
    tipo = {o: v[3] for o, v in E["origenes"].items()}
    referencias = {}
    for k, d in P["productos"].items():
        ref = {}
        if d.get("mercancia") and d.get("empaque"):
            ref["mayoreo"] = (d["mercancia"], d["empaque"])
        if d.get("frontera", {}).get("mercancia"):
            ref["frontera"] = (d["frontera"]["mercancia"], d["frontera"]["empaque"])
        if ref:
            referencias[k] = ref
    precios = precios_semanales(referencias)
    salida = {}
    for k, origenes in E["productos"].items():
        grupos = defaultdict(lambda: defaultdict(float))
        for o, (i0, vals) in origenes.items():
            g = {"eua": "eua", "mx": "mx", "imp": "imp"}.get(tipo[o], "mixto")
            for j, v in enumerate(vals):
                grupos[g][i0 + j] += v
        ultimo = max((i for g in grupos.values() for i, v in g.items() if v > 0), default=None)
        if ultimo is None:
            continue
        item = {"ultima": ultimo, "oferta": {}, "precio": {}}
        for g, serie in grupos.items():
            serie = {i: v for i, v in serie.items()}
            r = pronosticar(serie, semanas, ultimo)
            if r and any(x is not None for x in r[0]):
                item["oferta"][g] = [None if x is None else round(x) for x in r[0]]
        for t, por in precios.get(k, {}).items():
            serie = {idx[s]: v for s, v in por.items() if s in idx}
            if len(serie) < 104:
                continue
            u = max(serie)
            r = pronosticar(serie, semanas, u)
            if not r or all(x is None for x in r[0]):
                continue
            err_est, err_ing = prueba_hacia_atras(serie, u)
            mape_de = lambda e, h: statistics.mean(abs(x) for x in e[h]) if len(e.get(h, [])) >= 20 else None
            # En cada horizonte se usa el método que acertó más en la prueba: estacional o persistencia
            p50, err, metodo = [], {}, []
            for h in range(1, H + 1):
                me, mi = mape_de(err_est, h), mape_de(err_ing, h)
                usar_ing = me is None or (mi is not None and mi < me)
                p50.append(serie[u] if usar_ing else r[0][h - 1])
                err[h] = err_ing[h] if usar_ing else err_est[h]
                metodo.append("p" if usar_ing else "e")
            banda = {h: (statistics.quantiles(e, n=10)[1], statistics.quantiles(e, n=10)[7]) for h, e in err.items() if len(e) >= 20}
            mape = [statistics.mean(abs(x) for x in err[h]) for h in (1, 4, 8) if len(err.get(h, [])) >= 20]
            mape_ing = [round(mape_de(err_ing, h), 3) for h in (1, 4, 8) if mape_de(err_ing, h) is not None]
            item["precio"][t] = {
                "serie": [min(serie), [round(serie[i], 3) if i in serie else None for i in range(min(serie), u + 1)]],
                "ultima": u, "p50": [None if x is None else round(x, 3) for x in p50],
                # banda: el error relativo e = pronóstico/real − 1 → real = pronóstico / (1 + e)
                "p20": [None if x is None or h not in banda else round(x / (1 + banda[h][1]), 3) for h, x in enumerate(p50, 1)],
                "p80": [None if x is None or h not in banda else round(x / (1 + banda[h][0]), 3) for h, x in enumerate(p50, 1)],
                "mape": [round(m, 3) for m in mape], "mapeIngenuo": mape_ing, "metodo": "".join(metodo), "factor": round(r[1], 2),
                "referencia": " · ".join(referencias[k][t])}
        salida[k] = item
    datos = {"generado": date.today().isoformat(), "horizonte": H, "semanas": E["semanas"], "productos": salida}
    destino = RAIZ / "data" / "pronostico.js"
    destino.write_text("// Generado por scripts/procesar_pronostico.py — pronóstico semanal (estacionalidad × nivel reciente) con datos USDA AMS\n"
                       f"window.PRONOSTICO = {json.dumps(datos, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"{len(salida)} productos -> {destino} ({destino.stat().st_size / 1e3:.0f} kB)")
    for k, it in salida.items():
        for t, p in it["precio"].items():
            print(f"  {k:10s} {t:9s} MAPE 1/4/8: {p['mape']}  ingenuo: {p['mapeIngenuo']}  método {p['metodo']}  factor {p['factor']}")


if __name__ == "__main__":
    main()

"""
Alertas de precio y oferta de la semana: movimientos fuertes que conviene ver, a partir de lo que el mapa ya calcula.

Por producto, con datos de la última semana disponible:
  - precio_eua / precio_mx: el precio de las últimas 2 semanas contra las 2 anteriores (USDA mayoreo, o FOB frontera
    si no hay mayoreo; SNIIM en México) se movió 15% o más;
  - anual_eua / anual_mx: el precio de las últimas 4 semanas contra las mismas 4 semanas del año anterior, ±30% o más
    (no se usa el "nivel contra lo normal" del pronóstico: compara pesos de hoy con años atrás y la inflación lo sesga);
  - pronostico_eua / pronostico_mx: el pronóstico a 8 semanas se mueve 20% o más contra el último precio, solo si su
    error histórico a 8 semanas es menor a 30%;
  - embarques_mx: lo que cruzó de México en las últimas 2 semanas contra las mismas semanas del año anterior, ±30% o
    más (con al menos 5,000 t en alguno de los dos periodos: con menos, un cambio grande es ruido).
  En México no se alertan series del SNIIM cuyo pronóstico a 4 semanas falla más de 25% (precio que salta semana a
  semana, p. ej. zarzamora).
  - internacional_mes / internacional_anual (granos): el precio internacional del último mes (Banco Mundial / FMI,
    data/precios_granos.js) contra el mes anterior, ±8% o más, o contra el mismo mes del año anterior, ±25% o más. Una
    sola alerta por serie: el maíz va con el maíz amarillo (el que se importa); el sorgo no tiene serie propia.
Cada alerta guarda su magnitud para ordenar; el texto lo arma js/alertas.js (así se traduce por plantillas).

Entradas: data/pronostico.js, data/pronostico_sniim.js, data/embarques.js. Se corre en actualizar_semanal.py.
Salida: data/alertas_precio.js → window.ALERTAS_PRECIO = {generado, semanaEUA, semanaMX, alertas: [{k, tipo, cambio, ...}]}
Uso: python scripts/construir_alertas.py
"""
import json
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CAMBIO, ANUAL, PRON, EMB, MIN_T, MAPE_MAX = 0.15, 0.30, 0.20, 0.30, 5000, 0.30
INT_MES, INT_ANUAL = 0.08, 0.25
SERIE_INTERNACIONAL = {"maiz_amarillo": "maiz", "trigo": "trigo", "arroz": "arroz", "soya": "soya", "cebada": "cebada"}
RUIDO_MX = 0.25


def leer(nombre):
    t = (RAIZ / "data" / f"{nombre}.js").read_text(encoding="utf-8")
    i = t.index("{", t.index(" = "))
    return json.JSONDecoder().raw_decode(t[i:])[0]


def prom(v):
    v = [x for x in v if x is not None]
    return sum(v) / len(v) if v else None


def cambio_reciente(serie):
    """Últimas 2 semanas contra las 2 anteriores (con dato en ambas)."""
    a, b = prom(serie[-2:]), prom(serie[-4:-2])
    return a / b - 1 if a and b else None


def senales(k, mercado, serie, p50, mape8, ultimo, ref=None):
    out = []
    c = cambio_reciente(serie)
    if c is not None and abs(c) >= CAMBIO:
        out.append({"k": k, "tipo": f"precio_{mercado}", "cambio": round(c, 3), "precio": round(ultimo, 2), "ref": ref})
    if len(serie) >= 56:
        a, b = prom(serie[-4:]), prom(serie[-56:-52])
        if a and b and abs(a / b - 1) >= ANUAL:
            out.append({"k": k, "tipo": f"anual_{mercado}", "cambio": round(a / b - 1, 3), "precio": round(ultimo, 2), "ref": ref})
    fin = next((x for x in reversed(p50 or []) if x is not None), None)
    if fin and ultimo and mape8 is not None and mape8 < MAPE_MAX and abs(fin / ultimo - 1) >= PRON:
        out.append({"k": k, "tipo": f"pronostico_{mercado}", "cambio": round(fin / ultimo - 1, 3), "precio": round(fin, 2), "error": round(mape8, 3), "ref": ref})
    return out


def main():
    alertas = []
    P = leer("pronostico")
    for k, it in P["productos"].items():
        pr = it.get("precio", {}).get("mayoreo") or it.get("precio", {}).get("frontera")
        if not pr:
            continue
        serie = pr["serie"][1]
        ult = next((x for x in reversed(serie) if x is not None), None)
        if ult:
            # variedad de referencia (en chile, EE. UU. cotiza pimiento morrón y el SNIIM jalapeño: hay que decirlo)
            alertas += senales(k, "eua", serie, pr.get("p50"), pr["mape"][2] if len(pr.get("mape", [])) > 2 else None, ult, (pr.get("referencia") or "").split(" · ")[0])
    S = leer("pronostico_sniim")
    for k, pr in S["productos"].items():
        ult = next((x for x in reversed(pr["serie"]) if x is not None), None)
        if ult and (pr["mape"][1] or 0) <= RUIDO_MX:
            alertas += senales(k, "mx", pr["serie"], pr.get("p50"), pr["mape"][2], ult, pr.get("variedad"))
    E = leer("embarques")
    tipo = {o: v[3] for o, v in E["origenes"].items()}
    for k, origenes in E["productos"].items():
        por = {}
        for o, (i0, vals) in origenes.items():
            if tipo.get(o) != "mx":
                continue
            for j, v in enumerate(vals):
                por[i0 + j] = por.get(i0 + j, 0) + v
        if not por:
            continue
        u = max(i for i, v in por.items() if v > 0)
        if u < len(E["semanas"]) - 3:   # sin embarques recientes de México: fuera de temporada
            continue
        ahora = sum(por.get(i, 0) for i in (u - 1, u))
        antes = sum(por.get(i, 0) for i in (u - 53, u - 52))
        if max(ahora, antes) >= MIN_T and antes > 0 and abs(ahora / antes - 1) >= EMB:
            alertas.append({"k": k, "tipo": "embarques_mx", "cambio": round(ahora / antes - 1, 3), "t": round(ahora)})
    try:
        G = leer("precios_granos")
    except FileNotFoundError:
        G = None
    for k, sk in (SERIE_INTERNACIONAL.items() if G else []):
        s = dict(map(tuple, G["series"].get(sk, [])))
        if not s:
            continue
        mes = max(s)
        a, m = map(int, mes.split("-"))
        previo = f"{a - 1}-12" if m == 1 else f"{a}-{m - 1:02d}"
        hace = f"{a - 1}-{m:02d}"
        if previo in s and abs(s[mes] / s[previo] - 1) >= INT_MES:
            alertas.append({"k": k, "tipo": "internacional_mes", "cambio": round(s[mes] / s[previo] - 1, 3), "precio": s[mes], "mes": mes})
        if hace in s and abs(s[mes] / s[hace] - 1) >= INT_ANUAL:
            alertas.append({"k": k, "tipo": "internacional_anual", "cambio": round(s[mes] / s[hace] - 1, 3), "precio": s[mes], "mes": mes})
    alertas.sort(key=lambda a: -abs(a["cambio"]))
    salida = {"generado": date.today().isoformat(), "semanaEUA": P["semanas"][-1],
              "semanaMX": max((p["ultima"] for p in S["productos"].values()), default=None), "alertas": alertas}
    destino = RAIZ / "data" / "alertas_precio.js"
    destino.write_text("// Generado por scripts/construir_alertas.py — movimientos fuertes de precio y oferta de la semana\n"
                       f"window.ALERTAS_PRECIO = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"{len(alertas)} alertas -> {destino}")
    for a in alertas[:25]:
        print(f"  {a['k']:12s} {a['tipo']:15s} {a['cambio']:+.0%}")


if __name__ == "__main__":
    main()

"""
Oferta y demanda mundial por producto y eficiencia de las rutas de comercio (FAOSTAT 2024).

Para cada producto del mapa:
  1. Balance por país (data/global.js): consumo aparente = producción − exportación + importación. Excedente = lo que
     produce de más sobre su consumo (exportación neta) y en qué porcentaje de su consumo; déficit = lo que le falta.
  2. Rutas reales: matriz detallada de comercio de FAOSTAT (quién le vende a quién, toneladas). Cada envío se toma de lo
     que reporta el importador y, si no lo reporta, de lo que reporta el exportador. Toneladas-kilómetro = toneladas ×
     distancia en línea recta entre los centroides de los países.
  3. Ruta mínima: problema de transporte (programación lineal, scipy/HiGHS) que abastece la importación neta de cada
     país deficitario con la exportación neta de los países con excedente, al menor número de toneladas-kilómetro.
     La diferencia con las rutas reales es el potencial teórico de redistribución; se separa en comercio cruzado
     (países que importan y exportan el mismo producto) y reasignación de proveedores.

Límites: con datos anuales el óptimo no ve temporadas (un país puede importar en su contraestación lo mismo que exporta
en su cosecha), variedades, calidades, contratos, precios ni acceso fitosanitario; la distancia es en línea recta, sin
distinguir barco, camión o avión. Es un orden de magnitud de dónde hay rutas largas que podrían acortarse, no un plan.

Fuente: https://bulks-faostat.fao.org/production/Trade_DetailedTradeMatrix_E_All_Data_(Normalized).zip
(data/fuentes/faostat/, se lee en flujo) y data/global.js (procesar_faostat.py global).
Salida: data/oferta_global.js → window.OFERTA_GLOBAL y analisis/oferta_demanda_global.md (resumen).
Requiere scipy (solo para correrlo en local; el mapa usa el resultado).
Uso: python scripts/analisis_oferta_demanda.py [año=2024]
"""
import csv
import io
import json
import math
import sys
import zipfile
from collections import defaultdict
from pathlib import Path

import numpy as np
from scipy.optimize import linprog

sys.path.insert(0, str(Path(__file__).resolve().parent))
from procesar_faostat import PRODUCTOS  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
ZIP = RAIZ / "data" / "fuentes" / "faostat" / "Trade_DetailedTradeMatrix_E_All_Data_(Normalized).zip"
DESTINO = RAIZ / "data" / "oferta_global.js"
RESUMEN = RAIZ / "analisis" / "oferta_demanda_global.md"
MX = "484"


def leer_js(nombre):
    t = (RAIZ / "data" / nombre).read_text(encoding="utf-8")
    return json.JSONDecoder().raw_decode(t[t.index("{", t.index(" = ")):])[0]


def km(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))


def flujos(anio, paises):
    """{clave: {(origen, destino): toneladas}} con lo que reporta el importador (o, si falta, el exportador)."""
    codigo = {c: k for k, cs in PRODUCTOS.items() for c in cs}
    imp, exp = defaultdict(float), defaultdict(float)
    with zipfile.ZipFile(ZIP) as z:
        nombre = next(n for n in z.namelist() if n.endswith("(Normalized).csv"))
        with z.open(nombre) as fb:
            for r in csv.reader(io.TextIOWrapper(fb, encoding="latin-1")):
                # 0 rep, 1 rep M49, 4 socio M49, 6 producto, 9 elemento, 12 año, 14 valor
                if len(r) < 15 or r[12] != anio or r[9] not in ("5610", "5910"):
                    continue
                try:
                    k = codigo.get(int(r[6]))
                except ValueError:
                    continue
                if not k:
                    continue
                rep, soc = r[1].lstrip("'"), r[4].lstrip("'")
                if rep not in paises or soc not in paises or rep == soc:
                    continue
                try:
                    v = float(r[14])
                except ValueError:
                    continue
                if r[9] == "5610":
                    imp[(k, soc, rep)] += v    # importador reporta: socio → reportante
                else:
                    exp[(k, rep, soc)] += v    # exportador reporta: reportante → socio
    salida = defaultdict(dict)
    for clave in set(imp) | set(exp):
        v = imp.get(clave) or exp.get(clave) or 0
        if v > 0:
            k, o, d = clave
            salida[k][(o, d)] = v
    return salida


def transporte(ofertas, demandas, dist):
    """Problema de transporte: min Σ x·d con Σ_j x_ij = oferta_i y Σ_i x_ij = demanda_j (equilibrado)."""
    O, D = list(ofertas), list(demandas)
    n, m = len(O), len(D)
    c = np.array([dist(o, d) for o in O for d in D])
    A_eq = np.zeros((n + m, n * m))
    for i in range(n):
        A_eq[i, i * m:(i + 1) * m] = 1
    for j in range(m):
        A_eq[n + j, j::m] = 1
    b_eq = np.array([ofertas[o] for o in O] + [demandas[d] for d in D])
    r = linprog(c, A_eq=A_eq, b_eq=b_eq, bounds=(0, None), method="highs")
    if not r.success:
        raise RuntimeError(r.message)
    x = r.x.reshape(n, m)
    return {(O[i], D[j]): x[i, j] for i in range(n) for j in range(m) if x[i, j] > 0.5}, r.fun


def main():
    anio = sys.argv[1] if len(sys.argv) > 1 else "2024"
    G = leer_js("global.js")
    P = G["paises"]
    coord = {m: (p["lat"], p["lon"]) for m, p in P.items() if p.get("lat") is not None}
    print(f"Leyendo la matriz de comercio {anio} (≈420 MB)…", flush=True)
    F = flujos(anio, coord)
    cache_d = {}

    def dist(a, b):
        if (a, b) not in cache_d:
            cache_d[(a, b)] = cache_d[(b, a)] = km(coord[a], coord[b])
        return cache_d[(a, b)]

    productos, filas_md = {}, []
    for k in PRODUCTOS:
        datos = G["productos"].get(k, {}).get("datos", {})
        fl = F.get(k, {})
        if not datos or not fl:
            continue
        # 1. balance por país (totales de FAOSTAT)
        bal = {}
        for m, v in datos.items():
            prod, exp_t, imp_t = v[0] or 0, v[2] or 0, v[3] or 0
            cons = max(0.0, prod - exp_t + imp_t)
            if prod or exp_t or imp_t:
                bal[m] = (prod, cons, exp_t - imp_t)
        prod_mundo = sum(b[0] for b in bal.values())
        cons_mundo = sum(b[1] for b in bal.values())
        excedentes = sorted(((m, b[2], b[2] / b[1] if b[1] else None) for m, b in bal.items() if b[2] > 0), key=lambda x: -x[1])
        deficits = sorted(((m, -b[2], -b[2] / b[1] if b[1] else None) for m, b in bal.items() if b[2] < 0), key=lambda x: -x[1])
        # 2. rutas reales
        bruto = sum(fl.values())
        tkm_real = sum(t * dist(o, d) for (o, d), t in fl.items())
        sale, entra = defaultdict(float), defaultdict(float)
        for (o, d), t in fl.items():
            sale[o] += t
            entra[d] += t
        neto = {m: sale[m] - entra[m] for m in set(sale) | set(entra)}
        ofertas = {m: v for m, v in neto.items() if v > 1}
        demandas = {m: -v for m, v in neto.items() if v < -1}
        # equilibrio exacto (redondeos)
        so, sd = sum(ofertas.values()), sum(demandas.values())
        demandas = {m: v * so / sd for m, v in demandas.items()}
        # 3. ruta mínima
        opt, tkm_opt = transporte(ofertas, demandas, dist) if ofertas and demandas else ({}, 0.0)
        cruzado = bruto - so   # toneladas que se mueven aunque el país también exporta (o importa) lo mismo
        # destinos con mayor ahorro: tkm reales que llegan al país contra los del óptimo
        llega_real, llega_opt = defaultdict(float), defaultdict(float)
        orig_real, orig_opt = defaultdict(lambda: defaultdict(float)), defaultdict(lambda: defaultdict(float))
        for (o, d), t in fl.items():
            llega_real[d] += t * dist(o, d)
            orig_real[d][o] += t
        for (o, d), t in opt.items():
            llega_opt[d] += t * dist(o, d)
            orig_opt[d][o] += t

        def top(dic, n=3):
            tot = sum(dic.values()) or 1
            return [[o, round(t), round(t / tot, 3), round(dist(o, d0))] for o, t in sorted(dic.items(), key=lambda x: -x[1])[:n]] if dic else []

        reasignar = []
        for d in sorted(llega_real, key=lambda d: -(llega_real[d] - llega_opt.get(d, 0))):
            ahorro = llega_real[d] - llega_opt.get(d, 0)
            if ahorro <= 0 or len(reasignar) >= 10:
                break
            d0 = d
            imp_d = sum(orig_real[d].values())
            reasignar.append({"pais": d, "importa": round(imp_d), "neto": round(-neto.get(d, 0)),
                              "kmReal": round(llega_real[d] / imp_d), "kmOpt": round(llega_opt[d] / sum(orig_opt[d].values())) if orig_opt.get(d) else None,
                              "ahorroTkm": round(ahorro), "origenesReal": top(orig_real[d]), "origenesOpt": top(orig_opt.get(d, {}))})
        # México: de dónde importa y de dónde convendría (en el óptimo), y a quién le vende
        d0 = MX
        mx = None
        if orig_real.get(MX) or any(o == MX for o, _ in fl):
            ventas = defaultdict(float)
            for (o, d), t in fl.items():
                if o == MX:
                    ventas[d] += t
            ventas_opt = defaultdict(float)
            for (o, d), t in opt.items():
                if o == MX:
                    ventas_opt[d] += t

            def top_dest(dic, n=4):
                tot = sum(dic.values()) or 1
                return [[d, round(t), round(t / tot, 3), round(dist(MX, d))] for d, t in sorted(dic.items(), key=lambda x: -x[1])[:n]]
            mx = {"importa": round(sum(orig_real[MX].values())), "neto": round(neto.get(MX, 0)),
                  "kmImport": round(llega_real[MX] / sum(orig_real[MX].values())) if orig_real.get(MX) else None,
                  "origenesReal": top(orig_real.get(MX, {}), 5), "origenesOpt": top(orig_opt.get(MX, {}), 5),
                  "exporta": round(sum(ventas.values())), "destinos": top_dest(ventas), "destinosOpt": top_dest(ventas_opt)}
        productos[k] = {
            "prod": round(prod_mundo), "consumo": round(cons_mundo), "comercio": round(bruto), "parteComercio": round(bruto / cons_mundo, 3) if cons_mundo else None,
            "netoMovido": round(so), "cruzado": round(cruzado), "parteCruzado": round(cruzado / bruto, 3) if bruto else None,
            "kmMedio": round(tkm_real / bruto) if bruto else None, "kmMedioOpt": round(tkm_opt / so) if so else None,
            "tkmReal": round(tkm_real / 1e6, 1), "tkmOpt": round(tkm_opt / 1e6, 1),
            "ahorro": round(1 - tkm_opt / tkm_real, 3) if tkm_real else None,
            "excedentes": [[m, round(t), round(p, 3) if p is not None else None] for m, t, p in excedentes[:10]],
            "deficits": [[m, round(t), round(p, 3) if p is not None else None] for m, t, p in deficits[:10]],
            "nExcedente": len(excedentes), "nDeficit": len(deficits),
            "reasignar": reasignar, "mexico": mx,
        }
        p = productos[k]
        filas_md.append((k, p))
        print(f"  {k:11s} comercio {p['comercio']/1e3:8.0f} mil t ({p['parteComercio'] or 0:.0%} del consumo) · cruzado {p['parteCruzado'] or 0:.0%} · "
              f"km medio {p['kmMedio']} → {p['kmMedioOpt']} · ahorro teórico {p['ahorro'] or 0:.0%}", flush=True)

    nombres = {m: v["nombre"] for m, v in P.items()}
    salida = {"anio": int(anio), "fuente": "FAOSTAT: matriz detallada de comercio y balance de producción y comercio",
              "nombres": {m: nombres[m] for m in {x for p in productos.values() for x in
                          [r[0] for r in p["excedentes"] + p["deficits"]] +
                          [r["pais"] for r in p["reasignar"]] +
                          [o[0] for r in p["reasignar"] for o in r["origenesReal"] + r["origenesOpt"]] +
                          ([o[0] for o in p["mexico"]["origenesReal"] + p["mexico"]["origenesOpt"] + p["mexico"]["destinos"] + p["mexico"]["destinosOpt"]] if p["mexico"] else [])}
                          if m in nombres},
              "productos": productos}
    salida["iso"] = {m: P[m].get("iso") for m in salida["nombres"] if P[m].get("iso")}
    DESTINO.write_text("// Generado por scripts/analisis_oferta_demanda.py — oferta, demanda y rutas de comercio por producto (FAOSTAT)\n"
                       f"window.OFERTA_GLOBAL = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"{len(productos)} productos -> {DESTINO} ({DESTINO.stat().st_size // 1024} kB)")
    json.dump(salida, open(RAIZ / "data" / "fuentes" / "oferta_global_detalle.json", "w", encoding="utf-8"), ensure_ascii=False)


if __name__ == "__main__":
    main()

"""
Riesgo de pérdida por siniestro (propuesta 3): qué parte de la superficie sembrada se pierde cada año, por producto,
estado y modalidad (riego o temporal), con los cierres municipales del SIAP de 10 años.

El SIAP no publica la causa (helada, granizo, lluvia, sequía, plaga…) en el cierre, solo la superficie siniestrada:
la sembrada que no llegó a cosecharse por un daño. Aquí se mide qué tan seguido y dónde ocurre, que es lo que importa
para el abasto y el riesgo del productor. Complementa la sequía (Monitor de Sequía, js/sequia.js) y el clima de los
próximos días (js/clima.js).

  pérdida = superficie siniestrada / superficie sembrada        (por año)
  promedio = Σ siniestrada / Σ sembrada de los 10 años; peor año = el de mayor pérdida.

Entradas: data/fuentes/siap_historia/Cierre_agricola_mun_<año>.csv (y 2024–2025 de data/fuentes/), los mismos que
scripts/procesar_historia_estados.py (los descarga si faltan). Cultivos del SIAP: procesar_siap.CULTIVOS.
Salida: data/siniestros.js → window.SINIESTROS = {anios, productos: {clave: {nacional: [pérdida por año], riego,
  temporal: pérdida promedio, estados: {id: [sembrada promedio ha, [pérdida por año]]}}}}
Uso: python scripts/procesar_siniestros.py [primer año=2016] [último año=2025]
"""
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from procesar_historia_estados import archivo  # noqa: E402
from procesar_siap import CULTIVOS, abrir_csv, columna, normalizar, numero  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
MIN_HA = 200   # superficie sembrada promedio mínima de un estado para mostrarlo


def leer(ruta):
    """{clave: {(estado, municipio, modalidad): [sembrada, siniestrada, nombre del municipio]}}"""
    buscar = {nombre: clave for clave, nombres in CULTIVOS.items() for nombre in nombres}
    suma = defaultdict(lambda: defaultdict(lambda: [0.0, 0.0, ""]))
    with abrir_csv(ruta) as f:
        lector = csv.DictReader(f)
        h = lector.fieldnames
        c_edo, c_cult = columna(h, "idestado"), columna(h, "nomcultivo", "nomcultivo sin um")
        c_sem, c_sin, c_mod = columna(h, "sembrada"), columna(h, "siniestrada"), columna(h, "nommodalidad", "modalidad")
        c_mun, c_nmun = columna(h, "idmunicipio"), columna(h, "nommunicipio")
        for fila in lector:
            clave = buscar.get(normalizar(fila[c_cult]))
            if not clave:
                continue
            sem = numero(fila[c_sem]) or 0
            if sem <= 0:
                continue
            mod = "riego" if "riego" in normalizar(fila[c_mod]) else "temporal"
            s = suma[clave][(str(fila[c_edo]).zfill(2), str(fila[c_mun]).zfill(3), mod)]
            s[0] += sem
            s[1] += min(sem, numero(fila[c_sin]) or 0)
            s[2] = fila[c_nmun]
    return suma


def main(desde=2016, hasta=2025):
    anios = list(range(desde, hasta + 1))
    por_anio = {}
    for a in anios:
        por_anio[a] = leer(archivo(a))
        print(f"  {a}: {len(por_anio[a])} cultivos", flush=True)
    # Filas municipales que parecen error de captura: siembran más de 3× su mediana de los otros años y pierden ≥ 90%
    # (p. ej. calabacita 2025 en Valle de Santiago, Gto.: 7,100 ha sembradas y 7,087 siniestradas, cuando todo el
    # estado siembra ~1,500 ha). Se excluyen y se listan.
    excluidos = []
    for k in CULTIVOS:
        hist = defaultdict(dict)
        for a in anios:
            for (e, mu, m), v in por_anio[a].get(k, {}).items():
                hist[(e, mu)][a] = hist[(e, mu)].get(a, 0) + v[0]
        for a in anios:
            d = por_anio[a].get(k, {})
            for clave_f in list(d):
                e, mu, m = clave_f
                s1, s2, nombre = d[clave_f]
                otros = sorted(x for b, x in hist[(e, mu)].items() if b != a)
                mediana = otros[len(otros) // 2] if otros else 0
                if s1 >= 300 and s2 >= 0.9 * s1 and s1 > 3 * max(mediana, 1):
                    excluidos.append({"k": k, "anio": a, "estado": e, "municipio": nombre, "sembrada": round(s1), "siniestrada": round(s2), "mediana": round(mediana)})
                    del d[clave_f]
    productos = {}
    for k in CULTIVOS:
        nac = []
        mod = defaultdict(lambda: [0.0, 0.0])
        est = defaultdict(lambda: [[0.0, 0.0] for _ in anios])
        for i, a in enumerate(anios):
            d = por_anio[a].get(k)
            if not d:
                nac.append(None)
                continue
            sem = sum(v[0] for v in d.values())
            sin = sum(v[1] for v in d.values())
            nac.append(round(sin / sem, 4) if sem else None)
            for (e, _mu, m), (s1, s2, _n) in d.items():
                mod[m][0] += s1
                mod[m][1] += s2
                est[e][i][0] += s1
                est[e][i][1] += s2
        if not any(x is not None for x in nac):
            continue
        estados = {}
        for e, serie in est.items():
            con = [s for s in serie if s[0] > 0]
            prom_sem = sum(s[0] for s in con) / len(con) if con else 0
            if prom_sem >= MIN_HA:
                estados[e] = [round(prom_sem), [round(s[1] / s[0], 4) if s[0] > 0 else None for s in serie]]
        productos[k] = {"nacional": nac, "estados": estados,
                        **{m: round(v[1] / v[0], 4) for m, v in mod.items() if v[0] > 0}}
    salida = {"anios": anios, "fuente": f"SIAP, cierre de la producción agrícola municipal {anios[0]}–{anios[-1]}", "productos": productos,
              "excluidos": excluidos}
    for x in excluidos:
        print(f"  excluido: {x}")
    destino = RAIZ / "data" / "siniestros.js"
    destino.write_text("// Generado por scripts/procesar_siniestros.py — superficie siniestrada / sembrada por año, producto, estado y modalidad (SIAP)\n"
                       f"window.SINIESTROS = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"{len(productos)} productos -> {destino} ({destino.stat().st_size / 1e3:.0f} kB)")
    for k, p in sorted(productos.items(), key=lambda x: -max(v for v in x[1]["nacional"] if v is not None)):
        v = [x for x in p["nacional"] if x is not None]
        peor = max(range(len(anios)), key=lambda i: p["nacional"][i] or -1)
        print(f"  {k:12s} promedio {sum(v) / len(v):5.1%} · peor {anios[peor]} {p['nacional'][peor]:5.1%} · riego {p.get('riego', 0):5.1%} · temporal {p.get('temporal', 0):5.1%}")


if __name__ == "__main__":
    main(*[int(x) for x in sys.argv[1:]])

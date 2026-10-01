"""
Alerta de sobreoferta (o de escasez): siembras y cosechas del año contra el mismo corte de años anteriores.
Fuente: SIAP, Avance de Siembras y Cosechas (misma consulta que scripts/procesar_avance_siap.py), situación acumulada al
último mes disponible por estado: superficie sembrada, cosechada y siniestrada (ha) y producción (t).

Indicadores por producto y estado, contra el mismo mes del año anterior (y del antepasado, como referencia):
  - Superficie por cosechar = sembrada − cosechada − siniestrada: lo que todavía va a salir al mercado (cultivos cíclicos).
  - Superficie sembrada: en perennes (aguacate, limón, berries…) mide huertas en producción.
  - Producción acumulada a la fecha.
Señal: cíclicos → cambio en la superficie por cosechar; perennes → cambio en la producción a la fecha.
  ≥ +15% riesgo alto de sobreoferta · +5 a +15% moderado · ±5% normal · −5 a −15% menor oferta · ≤ −15% posible escasez.

Uso:
  python scripts/procesar_alerta_oferta.py [año=año en curso] [mes=último con datos]
Salida: data/alerta_oferta.js → window.ALERTA_OFERTA
"""
import html
import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from procesar_avance_siap import CULTIVOS, consulta, norm  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
PERENNES = {"aguacate", "limon", "naranja", "mango", "papaya", "platano", "uva", "guayaba", "nopal", "esparrago",
            "zarzamora", "frambuesa", "fresa", "pina", "toronja"}
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]


def tabla4(texto):
    """{estado: [sembrada, cosechada, siniestrada, producción]} y el corte ("31 de agosto de 2026")."""
    t = html.unescape(re.sub(r"<!\[CDATA\[|\]\]>", "", texto))
    corte = re.search(r"Situaci[oó]n al ([^<]+)", t)
    celdas = [re.sub(r"<[^>]+>", "", re.sub(r"\s+", " ", c)).strip() for c in re.findall(r"<td[^>]*>(.*?)</td>", t, flags=re.S)]
    fuera = {}
    for i, c in enumerate(celdas):
        if re.fullmatch(r"\d+", c) and i + 5 < len(celdas) and not re.fullmatch(r"[\d,.]+", celdas[i + 1]):
            try:
                fuera[norm(celdas[i + 1])] = [float(celdas[i + j].replace(",", "")) for j in (2, 3, 4, 5)]
            except ValueError:
                continue
    return fuera, (corte.group(1).strip() if corte else None)


def ultimo_mes(anio):
    for m in range(date.today().month if anio == date.today().year else 12, 0, -1):
        _, corte = tabla4(consulta(CULTIVOS["jitomate"], anio, m))
        if corte and str(anio) in corte:
            return m, corte
        # mes todavía sin publicar: no se guarda la respuesta, para volver a pedirlo la próxima vez
        (RAIZ / "data" / "fuentes" / "siap_avance" / f"{CULTIVOS['jitomate']}_{anio}_{m:02d}.html").unlink(missing_ok=True)
    raise SystemExit(f"Sin datos del avance para {anio}")


def main(anio=None, mes=None):
    anio = anio or date.today().year
    if mes:
        corte = f"{mes} de {anio}"
    else:
        mes, corte = ultimo_mes(anio)
    texto = (RAIZ / "data" / "estados.js").read_text(encoding="utf-8")
    ids = {norm(n): i for i, n in re.findall(r'id:\s*"(\d{2})"[^}]*?nombre:\s*"([^"]+)"', texto)}
    ids.setdefault("mexico", "15")
    anios = [anio - 2, anio - 1, anio]
    tareas = [(k, a) for k in CULTIVOS for a in anios]
    with ThreadPoolExecutor(max_workers=3) as ex:
        res = dict(zip(tareas, ex.map(lambda t: tabla4(consulta(CULTIVOS[t[0]], t[1], mes))[0], tareas)))
    productos = {}
    for k in CULTIVOS:
        por_anio = {a: {ids[e]: v for e, v in res[(k, a)].items() if e in ids} for a in anios}
        nac = {a: [round(sum(v[j] for v in por_anio[a].values())) for j in range(4)] for a in anios}
        estados = {}
        for e in set().union(*[set(por_anio[a]) for a in anios]):
            estados[e] = {a: [round(x) for x in por_anio[a].get(e, [0, 0, 0, 0])] for a in anios}
        productos[k] = {"perenne": k in PERENNES, "nacional": nac, "estados": estados}
    salida = {"anio": anio, "mes": mes, "corte": corte, "anios": anios, "fuente": "SIAP, Avance de Siembras y Cosechas",
              "generado": date.today().isoformat(), "productos": productos}
    destino = RAIZ / "data" / "alerta_oferta.js"
    destino.write_text("// Generado por scripts/procesar_alerta_oferta.py — SIAP, avance de siembras y cosechas al mismo corte de cada año\n"
                       f"window.ALERTA_OFERTA = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"Corte: {corte} · {len(productos)} productos -> {destino} ({destino.stat().st_size / 1e3:.0f} kB)")
    for k, p in productos.items():
        a, b = p["nacional"][anio], p["nacional"][anio - 1]
        pend = lambda v: v[0] - v[1] - v[2]
        s = (a[3] / b[3] - 1) if p["perenne"] and b[3] else (pend(a) / pend(b) - 1 if pend(b) > 0 else None)
        print(f"  {k:12s} {'perenne' if p['perenne'] else 'cíclico':8s} sembrada {a[0]:>9,} vs {b[0]:>9,}  señal {'—' if s is None else f'{s:+.0%}'}")


if __name__ == "__main__":
    args = [int(x) for x in sys.argv[1:]]
    main(*args)

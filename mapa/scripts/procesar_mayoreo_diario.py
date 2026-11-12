"""
Precio diario de mayoreo en México (SNIIM, centrales de abasto) durante el año, por producto y variedad. Base del
gráfico "Precio de mayoreo en México" (js/graficos.js, mismo diseño que el precio en la frontera).
Escribe data/mayoreo_diario.js → window.MAYOREO_MX (carga diferida).

Método:
  - Variedades de scripts/procesar_sniim.py (VARIEDADES), calidad "Primera", precio por kg (MXN/kg), todas las
    centrales y orígenes. Descarga con procesar_sniim.descargar (caché por año y variedad en data/fuentes/sniim/); el
    año en curso se vuelve a pedir si la copia tiene más de 6 días (igual que el pronóstico del SNIIM).
  - Se descartan cotizaciones atípicas: fuera de 1/3–3× la mediana de la variedad en el año (como procesar_sniim.py).
  - Precio del día = mediana del precio frecuente de todas las cotizaciones del día (centrales × orígenes); banda =
    percentiles 10 y 90 de esas cotizaciones (dispersión entre centrales). Días con al menos 3 cotizaciones.
  - Variedad de omisión: la primera de VARIEDADES con datos (la misma que usan el panel de precios y el pronóstico).
  - Cambio de año: igual que el precio en la frontera (scripts/procesar_frontera_diaria.py): hasta el 31 de marzo, una
    variedad con menos de 20 días en el año nuevo muestra el año anterior completo; después, sin días suficientes no
    se muestra.
  - El SNIIM no publica volumen ni demanda: el gráfico muestra solo precio.

Uso:
  python scripts/procesar_mayoreo_diario.py [año=año actual]
"""
import datetime
import json
import statistics
import sys
import time
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from procesar_sniim import VARIEDADES, descargar  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
CACHE = RAIZ / "data" / "fuentes" / "sniim"
MIN_DIAS_NUEVO = 20
MIN_COTIZACIONES_DIA = 3


def percentil(v, q):
    v = sorted(v)
    i = (len(v) - 1) * q
    a, b = int(i), min(int(i) + 1, len(v) - 1)
    return v[a] + (v[b] - v[a]) * (i - a)


def serie(anio, pid):
    """[[MM-DD, mediana, p10, p90]], número de centrales con cotización"""
    hoy = datetime.date.today()
    cache = CACHE / f"{anio}_{pid}.csv"
    if anio == hoy.year and cache.exists() and time.time() - cache.stat().st_mtime > 6 * 86400:
        cache.unlink()
    obs = []
    for f in descargar(anio, pid):
        try:
            d, m, a = map(int, f[0].split("/"))
            p = float(f[6].replace(",", ""))
        except (ValueError, IndexError):
            continue
        if p > 0 and a == anio:
            obs.append((f"{m:02d}-{d:02d}", p, f[3]))
    if not obs:
        return [], 0
    med = statistics.median(p for _, p, _ in obs)
    obs = [o for o in obs if med / 3 <= o[1] <= med * 3]
    por_dia = defaultdict(list)
    for md, p, _ in obs:
        por_dia[md].append(p)
    dias = [[md, round(statistics.median(v), 2), round(percentil(v, 0.1), 2), round(percentil(v, 0.9), 2)]
            for md, v in sorted(por_dia.items()) if len(v) >= MIN_COTIZACIONES_DIA]
    return dias, len({c for _, _, c in obs})


def ficha(anio, pid, nombre, respaldo):
    dias, centrales = serie(anio, pid)
    a = anio
    if len(dias) < MIN_DIAS_NUEVO:
        if not respaldo:
            return None
        a = anio - 1
        dias, centrales = serie(a, pid)
        if len(dias) < MIN_DIAS_NUEVO:
            return None
    return {"nombre": nombre, "anio": a, "mercancia": nombre, "empaque": "kg", "kgEmpaque": None, "centrales": centrales,
            "dias": dias, "demanda": [], "volSemana": {}}


def main(anio=None):
    anio = anio or datetime.date.today().year
    respaldo = datetime.date.today() < datetime.date(anio, 4, 1)
    salida = {"generado": datetime.date.today().isoformat(), "anio": anio,
              "fuente": "SNIIM (Secretaría de Economía), precios de mayoreo en centrales de abasto", "unidad": "MXN/kg",
              "productos": {}}
    ultimo = ""
    for k, variedades in VARIEDADES.items():
        vs = [v for v in (ficha(anio, pid, nombre, respaldo) for pid, nombre in variedades) if v]
        if not vs:
            print(f"  {k:12s} sin datos suficientes")
            continue
        prod = {x: y for x, y in vs[0].items() if x != "nombre"}
        if len(vs) > 1:
            prod["variantes"], prod["varOmision"] = vs, 0
        salida["productos"][k] = prod
        for v in vs:
            ultimo = max(ultimo, f"{v['anio']}-{v['dias'][-1][0]}")
            print(f"  {k:12s} {v['nombre'][:24]:24s} {len(v['dias']):3d} días {v['anio']} · {v['centrales']:2d} centrales · "
                  f"último {v['dias'][-1][0]} ${v['dias'][-1][1]:.2f}")
    salida["ultimoDia"] = ultimo
    destino = RAIZ / "data" / "mayoreo_diario.js"
    destino.write_text(
        f"// Generado por scripts/procesar_mayoreo_diario.py · SNIIM {anio} (precio diario de mayoreo en México)\n"
        f"window.MAYOREO_MX = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"-> {destino} ({destino.stat().st_size / 1024:.0f} kB), {len(salida['productos'])} productos, último día {ultimo}")


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else None)

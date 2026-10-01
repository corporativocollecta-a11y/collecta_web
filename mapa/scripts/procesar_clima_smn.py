"""
Alertas de helada y lluvia fuerte para los próximos días (paso 11): pronóstico por municipio del Servicio
Meteorológico Nacional (SMN, CONAGUA) cruzado con la producción municipal del SIAP de cada producto.

Fuente: https://smn.conagua.gob.mx/tools/GUI/webservices/?method=3 (JSON comprimido, pronóstico POR HORA de ~5 días
para 2,463 municipios; el pronóstico diario, method=1, devuelve fechas de 2023 y no se usa).
Por municipio y día: temperatura mínima (°C) y lluvia acumulada (mm). Ojo: la lluvia por hora del SMN trae ~14% de
valores negativos que compensan al positivo anterior (+27.2 y luego −27.2, artefacto de desacumular el modelo): se usa
la suma NETA del día, que da totales razonables; sumar solo los positivos los inflaría varias veces.
Umbrales: helada ≤ 0 °C · riesgo de helada ≤ 3 °C · lluvia muy fuerte ≥ 50 mm en el día · lluvia fuerte ≥ 25 mm
(clasificación de lluvias del SMN: fuertes 25–50 mm, muy fuertes 50–75 mm).

Por producto: qué parte de la producción del SIAP (cierre municipal) está en municipios con cada alerta en algún día
del pronóstico, y los municipios con más producción afectada.
El pronóstico vence en días: el mapa lo muestra solo si se generó hace 3 días o menos (correr a diario para que sirva).

Salida: data/clima_smn.js → window.CLIMA_SMN = {emitido, dias: [AAAA-MM-DD], productos: {clave: {alertas: {helada,
  riesgoHelada, lluviaMuyFuerte, lluviaFuerte: parte de la producción 0–1}, municipios: [[CVEGEO, nombre, estado,
  toneladas, alerta, día, valor]]}}}
Uso: python scripts/procesar_clima_smn.py
En el sitio (GitHub Actions de collecta_web, a diario; publicar_web.py copia este archivo a collecta_web/scripts/clima_smn.py):
  python scripts/clima_smn.py --datos public/mapa-agroalimentario/data --index public/mapa-agroalimentario/index.html
  → además de clima_smn.js, actualiza la fila del SMN en frescura.js y la huella ?v= de ambos en index.html (los
    archivos del mapa se guardan en caché un día por URL). Solo biblioteca estándar.
"""
import argparse
import gzip
import hashlib
import re
import urllib.request
import json
from collections import defaultdict
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
URL = "https://smn.conagua.gob.mx/tools/GUI/webservices/?method=3"
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
HELADA, RIESGO, MUY_FUERTE, FUERTE = 0.0, 3.0, 50.0, 25.0


def leer_js(ruta):
    t = Path(ruta).read_text(encoding="utf-8")
    i = t.index("{", t.index(" = "))   # desde la asignación (el comentario de cabecera también lleva llaves)
    return json.JSONDecoder().raw_decode(t[i:])[0]


def bajar():
    for intento in range(5):
        try:
            req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
            return urllib.request.urlopen(req, timeout=300).read()
        except OSError as e:
            if intento == 4:
                raise SystemExit(f"No se pudo bajar el pronóstico del SMN: {e}")
            import time
            time.sleep(20 * (intento + 1))


def main(datos=None, index=None):
    datos = Path(datos) if datos else RAIZ / "data"
    raw = bajar()
    if not index:   # en el proyecto se guarda la respuesta cruda para revisarla
        crudo = RAIZ / "data" / "fuentes" / "smn" / "pronostico_horario.json.gz"
        crudo.parent.mkdir(parents=True, exist_ok=True)
        crudo.write_bytes(raw)
    try:
        texto = gzip.decompress(raw).decode("utf-8", "replace")
    except OSError:
        texto = raw.decode("utf-8", "replace")
    horas = json.loads(texto)
    # municipio → día → [tmin, lluvia]
    clima = defaultdict(lambda: defaultdict(lambda: [99.0, 0.0]))
    nombres = {}
    for h in horas:
        cve = f"{int(h['ides']):02d}{int(h['idmun']):03d}"
        dia = h["hloc"][:8]
        try:
            t, p = float(h["temp"]), float(h["prec"])
        except (ValueError, KeyError):
            continue
        c = clima[cve][dia]
        c[0] = min(c[0], t)
        c[1] += p
        nombres[cve] = (h["nmun"], h["nes"])
    dias = sorted({d for m in clima.values() for d in m})
    # días completos: los que tienen al menos 20 horas en la mayoría de municipios (el primero y el último suelen ser parciales)
    cuenta = defaultdict(int)
    for h in horas:
        cuenta[h["hloc"][:8]] += 1
    n_mun = len(clima)
    dias = [d for d in dias if cuenta[d] >= 20 * n_mun * 0.8]
    emitido = min(h["hloc"] for h in horas)
    M = leer_js(datos / "produccion_municipal.js")["productos"]
    productos = {}
    for k, muns in M.items():
        total = sum(v[0] for v in muns.values())
        if total <= 0:
            continue
        partes = {"helada": 0.0, "riesgoHelada": 0.0, "lluviaMuyFuerte": 0.0, "lluviaFuerte": 0.0}
        lista = []
        for cve, (t, *_) in muns.items():
            if t <= 0 or cve not in clima:
                continue
            dd = [(d, *clima[cve][d]) for d in dias if d in clima[cve]]
            if not dd:
                continue
            dmin = min(dd, key=lambda x: x[1])
            dd = [(d, tmin, max(0.0, mm)) for d, tmin, mm in dd]
            dllu = max(dd, key=lambda x: x[2])
            alerta = None
            if dmin[1] <= HELADA:
                partes["helada"] += t
                alerta = ("helada", dmin[0], round(dmin[1], 1))
            if dmin[1] <= RIESGO:
                partes["riesgoHelada"] += t
                alerta = alerta or ("riesgoHelada", dmin[0], round(dmin[1], 1))
            if dllu[2] >= MUY_FUERTE:
                partes["lluviaMuyFuerte"] += t
                alerta = alerta or ("lluviaMuyFuerte", dllu[0], round(dllu[2]))
            if dllu[2] >= FUERTE:
                partes["lluviaFuerte"] += t
                alerta = alerta or ("lluviaFuerte", dllu[0], round(dllu[2]))
            if alerta:
                n, e = nombres[cve]
                lista.append([cve, n, e, round(t), alerta[0], f"{alerta[1][:4]}-{alerta[1][4:6]}-{alerta[1][6:]}", alerta[2]])
        lista.sort(key=lambda x: -x[3])
        productos[k] = {"alertas": {a: round(v / total, 4) for a, v in partes.items()}, "municipios": lista[:8]}
    salida = {"emitido": f"{emitido[:4]}-{emitido[4:6]}-{emitido[6:8]}", "generado": date.today().isoformat(),
              "dias": [f"{d[:4]}-{d[4:6]}-{d[6:]}" for d in dias], "umbrales": {"helada": HELADA, "riesgoHelada": RIESGO, "lluviaMuyFuerte": MUY_FUERTE, "lluviaFuerte": FUERTE},
              "fuente": "SMN (CONAGUA), pronóstico por municipio", "productos": productos}
    destino = datos / "clima_smn.js"
    destino.write_text("// Generado por scripts/procesar_clima_smn.py — pronóstico por municipio del SMN cruzado con la producción municipal (SIAP)\n"
                       f"window.CLIMA_SMN = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"Pronóstico desde {salida['emitido']} · días completos {salida['dias']} · {n_mun} municipios -> {destino} ({destino.stat().st_size / 1e3:.0f} kB)")
    for k, p in sorted(productos.items(), key=lambda x: -max(x[1]["alertas"].values()))[:12]:
        a = p["alertas"]
        print(f"  {k:12s} helada {a['helada']:.0%} · riesgo {a['riesgoHelada']:.0%} · lluvia fuerte {a['lluviaFuerte']:.0%} · muy fuerte {a['lluviaMuyFuerte']:.0%}")


    if index:
        sitio(datos, Path(index), salida["generado"])


def sitio(datos, index, generado):
    """Fila del SMN en frescura.js y huellas ?v= de clima_smn.js y frescura.js en index.html."""
    fr = datos / "frescura.js"
    if fr.exists():
        t = fr.read_text(encoding="utf-8")
        i = t.index("{", t.index(" = "))
        F = json.JSONDecoder().raw_decode(t[i:])[0]
        a, m, d = map(int, generado.split("-"))
        for f in F["fuentes"]:
            if f["id"] == "smn_clima":
                f["al"], f["periodo"] = generado, f"emitido el {d} de {MESES[m - 1]}"
        fr.write_text(t[:i] + json.dumps(F, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    html = index.read_text(encoding="utf-8")
    for nombre in ("clima_smn.js", "frescura.js"):
        ruta = datos / nombre
        if ruta.exists():
            huella = hashlib.md5(ruta.read_bytes()).hexdigest()[:8]   # la misma huella que publicar_web.py
            html = re.sub(rf"data/{re.escape(nombre)}\?v=[0-9a-f]+", f"data/{nombre}?v={huella}", html)
    index.write_text(html, encoding="utf-8")
    print(f"Sitio: frescura y huellas actualizadas en {index}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--datos", help="carpeta de los data/*.js (por omisión, data/ del proyecto)")
    ap.add_argument("--index", help="index.html del sitio publicado: actualiza frescura y huellas de caché")
    a = ap.parse_args()
    main(a.datos, a.index)

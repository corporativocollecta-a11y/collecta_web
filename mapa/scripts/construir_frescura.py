"""
Frescura de los datos (paso 7): hasta qué fecha llega cada fuente del mapa y cada cuánto se actualiza, para mostrar
en la pestaña Fuentes una tabla con semáforo y en la cabecera un punto ámbar si alguna fuente frecuente se atrasó.

Lee los metadatos de cada data/*.js (sin cargar el mapa) y escribe data/frescura.js → window.FRESCURA:
  {generado, fuentes: [{id, nombre, al: "AAAA-MM-DD", periodo, cada: días entre publicaciones, retraso: días normales
   entre el fin del periodo y su publicación, script}]}
El mapa marca "al día" si hoy − al ≤ cada + retraso + 7 días de holgura; si no, "atrasado".
Se corre al final de scripts/actualizar_semanal.py y de scripts/actualizacion_automatica.py.
Uso: python scripts/construir_frescura.py
"""
import calendar
import json
import re
from datetime import date, timedelta
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]


def leer(nombre):
    ruta = RAIZ / "data" / f"{nombre}.js"
    if not ruta.exists():
        return None
    t = ruta.read_text(encoding="utf-8")
    i = t.index("{")
    try:
        return json.loads(t[i:t.rindex("}") + 1])
    except json.JSONDecodeError:   # archivos con dos objetos (p. ej. consumo_oficial.js + POBLACION_CONAPO)
        return json.JSONDecoder().raw_decode(t[i:])[0]


def panorama_nuevo(anio):
    """¿Ya publicó el SIAP el Panorama Agroalimentario de ese año? (sin red o con error: no se sabe → False)"""
    import urllib.request
    try:
        req = urllib.request.Request(f"https://nube.agricultura.gob.mx/panorama_dgsiap/{anio}.pdf", method="HEAD",
                                     headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status == 200 and "pdf" in r.headers.get("Content-Type", "pdf")
    except Exception:
        return False


def fin_mes(a, m):
    return date(a, m, calendar.monthrange(a, m)[1])


def fin_anio(a):
    return date(int(a), 12, 31)


def main():
    F = []

    def agregar(id_, nombre, al, periodo, cada, retraso, script):
        if al:
            F.append({"id": id_, "nombre": nombre, "al": al.isoformat(), "periodo": periodo, "cada": cada, "retraso": retraso, "script": script})

    e = leer("embarques")
    if e:
        ult = max((i0 + max((j for j, v in enumerate(vals) if v), default=-1) for p in e["productos"].values() for i0, vals in p.values()), default=None)
        if ult is not None and ult >= 0:
            s = date.fromisoformat(e["semanas"][ult])
            agregar("usda_embarques", "USDA: embarques semanales y precio FOB en la frontera", s + timedelta(days=6), f"semana del {s.day} de {MESES[s.month - 1]}", 7, 9, "actualizar_semanal.py")
    n = leer("neto_semanal")
    if n:
        a, m = map(int, n["diesel"]["mes"].split("-"))
        agregar("cne_diesel", "CNE: diésel por estado", fin_mes(a, m), f"{MESES[m - 1]} de {a}", 31, 20, "procesar_neto_semanal.py")
        s = date.fromisoformat(n["tc"]["semana"])
        agregar("fred_tc", "Reserva Federal: tipo de cambio", s + timedelta(days=6), f"semana del {s.day} de {MESES[s.month - 1]}", 7, 9, "procesar_neto_semanal.py")
    al = leer("alerta_oferta")
    if al:
        agregar("siap_avance", "SIAP: avance de siembras y cosechas", fin_mes(al["anio"], al["mes"]), al["corte"], 31, 31, "procesar_alerta_oferta.py")
    o = leer("origen_exportacion")
    if o:
        a, m = map(int, o["ultimo"].split("-"))
        agregar("se_estados", "Secretaría de Economía: exportación por estado", fin_mes(a, m), f"{MESES[m - 1]} de {a}", 31, 70, "procesar_origen_exportacion.py")
    ps = leer("pronostico_sniim")
    if ps and ps["productos"]:
        u = max(date.fromisoformat(p["ultima"]) for p in ps["productos"].values())
        agregar("sniim_semanal", "SNIIM: precio semanal de mayoreo", u + timedelta(days=6), f"semana del {u.day} de {MESES[u.month - 1]}", 7, 9, "procesar_pronostico_sniim.py")
    cl = leer("clima_smn")
    if cl:
        f = date.fromisoformat(cl["generado"])
        agregar("smn_clima", "SMN: pronóstico de helada y lluvia", f, f"emitido el {f.day} de {MESES[f.month - 1]}", 1, 2, "procesar_clima_smn.py")
    sq = leer("sequia")
    if sq:
        f = date.fromisoformat(sq["fecha"])
        agregar("conagua_sequia", "CONAGUA: Monitor de Sequía", f, f"{f.day} de {MESES[f.month - 1]} de {f.year}", 15, 10, "procesar_sequia.py")
    for nombre, id_, texto, script in (("produccion_siap", "siap_cierre", "SIAP: cierre de la producción agrícola", "procesar_siap.py"),
                                       ("comercio_oficial", "comercio", "Comercio exterior (INEGI/SE vía UN Comtrade)", "procesar_comercio.py"),
                                       ("precios_sniim", "sniim_anual", "SNIIM: precios de mayoreo del año", "procesar_sniim.py"),
                                       ("precios_consumidor", "profeco", "PROFECO: precios al consumidor", "procesar_profeco.py"),
                                       ("competencia_eua", "comtrade_eua", "UN Comtrade: importaciones de EE. UU.", "procesar_competencia.py"),
                                       ("precios_ue", "ue_precios", "Comisión Europea: precios en la UE", "procesar_precios_ue.py")):
        d = leer(nombre)
        if d and d.get("anio"):
            agregar(id_, texto, fin_anio(d["anio"]), f"año {d['anio']}", 365, 120, script)
    c = leer("consumo_oficial")
    if c:
        agregar("panorama", "SIAP: Panorama Agroalimentario (consumo)", fin_anio(c["anioDatos"]), f"datos {c['anioDatos']}, publicado en {c['publicacion']}", 365, 270, "procesar_panorama.py")
        # El Panorama sale una vez al año sin fecha fija (oct–dic): se revisa si ya existe la edición siguiente
        if panorama_nuevo(c["publicacion"] + 1):
            F[-1]["nuevo"] = f"Ya está el Panorama {c['publicacion'] + 1}: correr scripts/procesar_panorama.py"
            print(f"::warning::{F[-1]['nuevo']}")
    g = leer("global")
    if g:
        agregar("faostat", "FAOSTAT (FAO): producción y comercio mundial", fin_anio(g["anio"]), f"año {g['anio']}", 365, 400, "procesar_faostat.py")
    salida = {"generado": date.today().isoformat(), "fuentes": F}
    destino = RAIZ / "data" / "frescura.js"
    destino.write_text("// Generado por scripts/construir_frescura.py — hasta qué fecha llega cada fuente y cada cuánto se publica\n"
                       f"window.FRESCURA = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    hoy = date.today()
    for f in F:
        edad = (hoy - date.fromisoformat(f["al"])).days
        print(f"  {'al día  ' if edad <= f['cada'] + f['retraso'] + 7 else 'ATRASADO'} {f['nombre']:55s} {f['periodo']} ({edad} días)")
    print(f"{len(F)} fuentes -> {destino}")


if __name__ == "__main__":
    main()

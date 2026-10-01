"""
Competencia en Estados Unidos: importaciones mensuales de EE. UU. por país de origen y producto (UN Comtrade,
reporte de EE. UU., API pública "preview", sin clave; un mes por consulta). Muestra cuándo entra cada competidor.

Fuente: https://comtradeapi.un.org/public/v1/preview/C/M/HS?reporterCode=842&period=AAAAMM&cmdCode=...&flowCode=M
Respuestas crudas en data/fuentes/comtrade/eua_M_<AAAAMM>_<grupo>.json.

Uso:
  python scripts/procesar_competencia.py [año=2025]
Salida: data/competencia_eua.js → window.COMPETENCIA_EUA
  {anio, productos: {clave: {total: t, origenes: {M49: [t por mes ×12]}}}}   (hasta 8 orígenes por producto + "otros")
"""
import json
import sys
import time
import urllib.request
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CRUDOS = RAIZ / "data" / "fuentes" / "comtrade"
API = ("https://comtradeapi.un.org/public/v1/preview/C/M/HS?reporterCode=842&period={periodo}&cmdCode={codigos}"
       "&flowCode=M&partner2Code=0&customsCode=C00&motCode=0")

# producto (claves de las vistas) → subpartidas del Sistema Armonizado (6 dígitos)
PRODUCTOS = {
    "jitomate": ["070200"], "chile": ["070960"], "aguacate": ["080440"], "limon": ["080550"], "naranja": ["080510"],
    "platano": ["080390", "080310"], "mango": ["080450"], "papa": ["070190"], "cebolla": ["070310"], "brocoli": ["070410"],
    "fresa": ["081010"], "pepino": ["070700"], "manzana": ["080810"], "calabacita": ["070993"], "zanahoria": ["070610"],
    "lechuga": ["070511", "070519"], "sandia": ["080711"], "melon": ["080719"], "papaya": ["080720"], "pina": ["080430"],
    "uva": ["080610"], "toronja": ["080540"], "pera": ["080830"], "durazno": ["080930"], "berenjena": ["070930"],
    "esparrago": ["070920"], "arandano": ["081040"], "frambuesa": ["081020"], "nuez": ["080231", "080232"],
}
# EE. UU. registra la nuez pecanera en otra subpartida (las 080231/080232 son nuez de Castilla): no se publica
EXCLUIR = {"nuez"}
GRUPOS = 3   # para no pasar de 500 registros por consulta


def bajar(periodo, codigos, n):
    ruta = CRUDOS / f"eua_M_{periodo}_{n}.json"
    if ruta.exists():
        return json.loads(ruta.read_text(encoding="utf-8"))
    for intento in range(5):
        try:
            req = urllib.request.Request(API.format(periodo=periodo, codigos=",".join(codigos)), headers={"User-Agent": "Mozilla/5.0"})
            d = json.load(urllib.request.urlopen(req, timeout=120))
            if d.get("error"):
                raise RuntimeError(d["error"])
            assert d.get("count", 0) < 500, "consulta truncada a 500 registros"
            ruta.write_text(json.dumps(d), encoding="utf-8")
            time.sleep(2)
            return d
        except Exception as e:   # límite de la API pública: esperar y reintentar
            print(f"  {periodo} grupo {n}: {e}; reintento")
            time.sleep(15 * (intento + 1))
    raise SystemExit(f"No se pudo descargar {periodo} grupo {n}")


def main(anio=2025):
    CRUDOS.mkdir(parents=True, exist_ok=True)
    cod_a_prod = {c: k for k, cs in PRODUCTOS.items() for c in cs}
    todos = list(cod_a_prod)
    grupos = [todos[i::GRUPOS] for i in range(GRUPOS)]
    serie = defaultdict(lambda: defaultdict(lambda: [0.0] * 12))
    for m in range(1, 13):
        for n, codigos in enumerate(grupos):
            d = bajar(f"{anio}{m:02d}", codigos, n)
            for r in d.get("data", []):
                p = r["partnerCode"]
                if p == 0 or r.get("motCode") not in (0, None):
                    continue
                k = cod_a_prod.get(r["cmdCode"])
                t = (r.get("netWgt") or r.get("qty") or 0) / 1000
                if k and t > 0:
                    serie[k][str(p).zfill(3)][m - 1] += t
    salida = {"anio": anio, "fuente": f"UN Comtrade, importaciones mensuales de EE. UU. {anio}", "productos": {}}
    for k, origenes in serie.items():
        if k in EXCLUIR:
            continue
        orden = sorted(origenes.items(), key=lambda x: -sum(x[1]))
        top = dict(orden[:8])
        resto = [sum(s[i] for _, s in orden[8:]) for i in range(12)]
        if any(resto):
            top["otros"] = resto
        salida["productos"][k] = {"total": round(sum(sum(s) for s in origenes.values())),
                                  "origenes": {o: [round(x) for x in s] for o, s in top.items()}}
    destino = RAIZ / "data" / "competencia_eua.js"
    destino.write_text(f"// Generado por scripts/procesar_competencia.py · {salida['fuente']}\n"
                       f"window.COMPETENCIA_EUA = {json.dumps(salida, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"-> {destino.name} ({destino.stat().st_size / 1e3:.0f} kB), {len(salida['productos'])} productos")
    for k, p in salida["productos"].items():
        mx = sum(p["origenes"].get("484", [0]))
        print(f"  {k:10} {p['total']:>10,} t · México {mx / p['total']:5.0%} · {', '.join(list(p['origenes'])[:4])}")


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 2025)

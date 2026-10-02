"""
Balanzas disponibilidad-consumo de granos (SIAP/DGSIAP, https://nube.agricultura.gob.mx/Balanza/): oferta (inventario
inicial, producción, importación) y demanda (exportación, consumo humano, consumo pecuario, mermas) del ciclo comercial
octubre–septiembre, mes por mes, con los meses que faltan estimados por el SIAP. Es la fuente oficial que separa el maíz
blanco del amarillo en el comercio y en el uso (humano o pecuario).

Productos: maíz grano blanco, maíz grano amarillo, frijol, arroz, trigo panificable y trigo cristalino (el mapa suma los
dos trigos en "trigo"). Cada página de reporte trae sus gráficas como JSON de Highcharts (<script type="application/json">):
  figura 1: composición anual de la oferta y la demanda; figuras 2 y 3: oferta y demanda por mes.
Se lee la publicación más reciente de cada ciclo comercial (el actual y el anterior).

Uso: python scripts/procesar_balanzas_siap.py
Salida: data/balanzas_siap.js → window.BALANZAS_SIAP. Solo biblioteca estándar.
"""
import json
import re
import subprocess
import time
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BASE = "https://nube.agricultura.gob.mx/Balanza/"
CARPETA = RAIZ / "data" / "fuentes" / "balanzas"
DESTINO = RAIZ / "data" / "balanzas_siap.js"
PAGINAS = {"maiz_blanco": "MaizGranoBlanco", "maiz_amarillo": "MaizGranoAmarillo", "frijol": "Frijol", "arroz": "Arroz",
           "trigo_panificable": "TrigoPanificable", "trigo_cristalino": "TrigoCristalino"}
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]


def norm(t):
    return unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower().strip()


def concepto(n):
    """Nombre uniforme del concepto: "Inventario inicial" e "Inventario" → "inventario"; "Consumo humano" → "consumo humano"."""
    n = norm(n)
    return "inventario" if n.startswith("inventario") else n


def bajar(url, nombre, refrescar):
    ruta = CARPETA / nombre
    if ruta.exists() and not refrescar:
        return ruta.read_bytes().decode("utf-8", "replace")
    datos = subprocess.run(["curl", "-sS", "--retry", "4", "--retry-delay", "3", "--max-time", "120", "-A", "Mozilla/5.0", url],
                           capture_output=True, check=True).stdout
    CARPETA.mkdir(parents=True, exist_ok=True)
    ruta.write_bytes(datos)
    time.sleep(0.5)
    return datos.decode("utf-8", "replace")


def graficas(html):
    return [json.loads(m)["x"]["hc_opts"] for m in re.findall(r'<script type="application/json"[^>]*>(.*?)</script>', html, flags=re.S)]


def leer_reporte(html):
    g = graficas(html)
    if len(g) < 3:
        return None
    anual = {s["id"]: {concepto(n): round(v, 1) for n, v in s["data"]} for s in g[0]["drilldown"]["series"]}
    cats = g[1]["xAxis"]["categories"]
    # los meses estimados empiezan donde comienza la franja gris de "Datos estimados"
    banda = (g[1]["xAxis"].get("plotBands") or [{}])[0]
    estimado = int(banda["from"] + 0.5) if isinstance(banda.get("from"), (int, float)) else None
    mensual = {concepto(s["name"]): [round(v, 1) for v in s["data"]] for s in g[1]["series"] + g[2]["series"]}
    m0, a0 = cats[0].split()
    return {"desde": f"{a0}-{MESES.index(norm(m0)) + 1:02d}", "meses": [norm(c) for c in cats], "estimadoDesde": estimado,
            "oferta": anual.get("oferta", {}), "demanda": anual.get("demanda", {}), "mensual": mensual}


def main():
    salida = {}
    for clave, pag in PAGINAS.items():
        indice = bajar(f"{BASE}{pag}/index.php", f"{pag}_index.html", True)
        # reportes en el orden de la página (el más reciente primero), con su fecha de publicación
        enlaces = list(dict.fromkeys(re.findall(r"'([a-z]+\d{4})\.php'|\"([a-z]+\d{4})\.php\"", indice)))
        nombres = [a or b for a, b in enlaces]
        texto = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", indice))
        publicado = re.findall(r"Fecha de publicaci(?:ó|&oacute;|o)n: ([^<]+?) (?:Consultar)", texto)
        ciclos = {}
        for i, n in enumerate(nombres):
            r = leer_reporte(bajar(f"{BASE}{pag}/{n}.php", f"{pag}_{n}.html", i == 0))
            if not r:
                continue
            a = int(r["desde"][:4])
            ciclo = f"{a}/{str(a + 1)[2:]}"
            if ciclo in ciclos:
                continue   # ya está la publicación más reciente de ese ciclo
            r["reporte"] = n
            r["publicado"] = publicado[i].strip() if i < len(publicado) else None
            ciclos[ciclo] = r
            if len(ciclos) == 2:
                break
        salida[clave] = ciclos
        for c, r in ciclos.items():
            print(f"  {clave:18s} {c}  oferta {sum(r['oferta'].values()):>9,.0f}  demanda {sum(r['demanda'].values()):>9,.0f} mil t "
                  f"({r['reporte']}, {r['publicado']}; estimado desde el mes {r['estimadoDesde']})")
    datos = {"fuente": "SIAP, Análisis de balanzas disponibilidad-consumo (nube.agricultura.gob.mx/Balanza)", "unidad": "miles de toneladas",
             "productos": salida}
    DESTINO.write_text("// Generado por scripts/procesar_balanzas_siap.py — balanzas disponibilidad-consumo de granos (SIAP), miles de t\n"
                       f"window.BALANZAS_SIAP = {json.dumps(datos, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"-> {DESTINO} ({DESTINO.stat().st_size // 1024} kB)")


if __name__ == "__main__":
    main()

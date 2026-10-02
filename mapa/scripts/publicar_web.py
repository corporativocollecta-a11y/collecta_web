"""
Copia el mapa (y el reporte) al sitio collectaproduce.com como página aparte, no enlazada ni indexada.

Destino: <repo collecta_web>/public/mapa-agroalimentario/
  - index.html   el mapa, con <base href> para servirse desde /mapa-agroalimentario y meta noindex
  - reporte/     el reporte "De la parcela al plato"
  - css/, js/, img/, data/ y data/geo/ (sin data/fuentes ni data/base, que solo usa la versión de claude.ai)
  - scripts/clima_smn.py (copia de scripts/procesar_clima_smn.py) para la actualización diaria del clima en GitHub Actions

El sitio agrega en next.config.ts la reescritura /mapa-agroalimentario → index.html y el encabezado
X-Robots-Tag: noindex. Publicar = commit + push del repo del sitio (Vercel despliega main).

Uso:
  python scripts/publicar_web.py [ruta del repo del sitio=C:/Users/DELL/dev/collecta_web] [ruta del reporte] [--sin-traer]
"""
import json
import re
import shutil
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
SITIO = Path(ARGS[0] if ARGS else r"C:\Users\DELL\dev\collecta_web")
REPORTE = Path(ARGS[1]) if len(ARGS) > 1 else None
# --sin-traer: publicar los datos del proyecto tal cual, sin traer los del sitio (cuando se corrigieron y regeneraron a
# mano el mismo día que corrió la actualización automática)
SIN_TRAER = "--sin-traer" in sys.argv
RUTA = "mapa-agroalimentario"
DESTINO = SITIO / "public" / RUTA
NOINDEX = '<meta name="robots" content="noindex, nofollow">'
# Archivos que también generan las actualizaciones automáticas en GitHub Actions (clima-smn.yml y
# actualizacion-semanal.yml de collecta_web); todos llevan "generado"
AUTOMATICOS = ("clima_smn.js", "embarques.js", "pronostico.js", "alerta_oferta.js", "origen_exportacion.js",
               "neto_semanal.js", "pronostico_sniim.js", "alertas_precio.js", "sequia.js", "precios_canada.js")
# Copia del proyecto en el sitio (collecta_web/mapa/) para que GitHub Actions corra la actualización semanal; sin
# data/fuentes (descargas crudas, van en la caché de Actions) ni .env (la clave del USDA va como secreto)
ESPEJO = SITIO / "mapa"


def generado(ruta):
    m = re.search(r'"generado":"(\d{4}-\d{2}-\d{2})"', ruta.read_text(encoding="utf-8")) if ruta.exists() else None
    return m.group(1) if m else ""


def main():
    # El clima lo actualiza a diario GitHub Actions en el sitio: si el del sitio es más reciente que el del proyecto, se
    # trae al proyecto antes de copiar (así la publicación manual no lo regresa a una versión vieja).
    import subprocess
    atras = subprocess.run(["git", "-C", str(SITIO), "fetch", "-q", "origin"], capture_output=True)
    pend = subprocess.run(["git", "-C", str(SITIO), "rev-list", "--count", "HEAD..origin/main"], capture_output=True, text=True).stdout.strip()
    if atras.returncode == 0 and pend not in ("", "0"):
        raise SystemExit(f"El sitio tiene {pend} commit(s) nuevos en origin/main (p. ej. el clima diario): corre "
                         f"'git -C {SITIO} pull' antes de publicar.")
    # Lo que generan las actualizaciones automáticas en GitHub (clima diario y actualización semanal): si la copia del
    # sitio es más reciente, se trae al proyecto antes de copiar
    traidos = []
    for nombre in ([] if SIN_TRAER else AUTOMATICOS):
        sitio, local = DESTINO / "data" / nombre, RAIZ / "data" / nombre
        # en empate (mismo día) gana el sitio: la actualización automática es la fuente principal de estos archivos
        if generado(sitio) and generado(sitio) >= generado(local) and sitio.read_bytes() != local.read_bytes():
            shutil.copy2(sitio, local)
            traidos.append(f"{nombre} ({generado(sitio)})")
    if traidos:
        print("  se conserva la versión del sitio de: " + ", ".join(traidos))
        subprocess.run([sys.executable, str(RAIZ / "scripts" / "construir_frescura.py")], check=True, capture_output=True)
    if DESTINO.exists():
        shutil.rmtree(DESTINO)
    (DESTINO / "data").mkdir(parents=True)
    shutil.copytree(RAIZ / "css", DESTINO / "css")
    shutil.copytree(RAIZ / "js", DESTINO / "js")
    for f in (RAIZ / "data").glob("*.js"):
        shutil.copy2(f, DESTINO / "data" / f.name)
    shutil.copytree(RAIZ / "data" / "geo", DESTINO / "data" / "geo")   # contornos que se cargan al abrir cada vista
    shutil.copytree(RAIZ / "img", DESTINO / "img")

    html = (RAIZ / "index.html").read_text(encoding="utf-8")
    html = html.replace('<meta charset="UTF-8">',
                        f'<meta charset="UTF-8">\n  <base href="/{RUTA}/">\n  {NOINDEX}', 1)
    html = re.sub(r'href="https://claude\.ai/artifact/[^"]+"', 'href="reporte"', html)
    html = html.replace("<title>Mapa Agroalimentario</title>", "<title>Mapa Agroalimentario · Collecta</title>")
    # ?v=<huella del contenido> en cada archivo local: con caché larga en el sitio, una actualización cambia la URL
    import hashlib
    def version(m):
        ruta = RAIZ / m.group(2)
        v = hashlib.md5(ruta.read_bytes()).hexdigest()[:8] if ruta.exists() else None
        return f'{m.group(1)}="{m.group(2)}?v={v}"' if v else m.group(0)
    html = re.sub(r'(src|href)="((?:js|css|data|img)/[^"?]+)"', version, html)
    # Los datos que se cargan bajo demanda (Paleta.cargar: traducción, pronósticos, neto semanal…) no están en el HTML:
    # su huella va en window.VERSIONES para que una actualización no se quede en la caché del navegador
    huellas = {f"data/{f.name}": hashlib.md5(f.read_bytes()).hexdigest()[:8] for f in sorted((DESTINO / "data").glob("*.js"))}
    html = html.replace(f'<base href="/{RUTA}/">',
                        f'<base href="/{RUTA}/">\n  <script>window.VERSIONES = {json.dumps(huellas)};</script>', 1)
    assert f'<base href="/{RUTA}/">' in html and "claude.ai" not in html
    (DESTINO / "index.html").write_text(html, encoding="utf-8")

    if REPORTE and REPORTE.exists():
        cuerpo = REPORTE.read_text(encoding="utf-8")
        cuerpo = re.sub(r'https://claude\.ai/artifact/[A-Za-z0-9]+', f"/{RUTA}", cuerpo)
        # El reporte enlaza al mapa con rutas relativas (../index.html, ../index.html#tour); en el sitio vive en /RUTA/reporte
        cuerpo = cuerpo.replace('href="../index.html', f'href="/{RUTA}')
        (DESTINO / "reporte").mkdir()
        (DESTINO / "reporte" / "index.html").write_text(
            '<!DOCTYPE html>\n<html lang="es">\n<meta charset="UTF-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            f"{NOINDEX}\n{cuerpo}\n</html>\n", encoding="utf-8")

    # Actualización diaria del clima en el sitio (GitHub Actions .github/workflows/clima-smn.yml de collecta_web):
    # el mismo script del proyecto, copiado para que el sitio no dependa de esta carpeta
    (SITIO / "scripts").mkdir(exist_ok=True)
    shutil.copy2(RAIZ / "scripts" / "procesar_clima_smn.py", SITIO / "scripts" / "clima_smn.py")
    # Correo semanal de alertas (GitHub Actions .github/workflows/alertas-correo.yml de collecta_web)
    shutil.copy2(RAIZ / "scripts" / "enviar_alertas.py", SITIO / "scripts" / "enviar_alertas.py")

    if ESPEJO.resolve() != RAIZ.resolve():   # en GitHub Actions el proyecto ES el espejo
        espejo()

    total = sum(f.stat().st_size for f in DESTINO.rglob("*") if f.is_file())
    print(f"-> {DESTINO} ({total / 1e6:.1f} MB, {sum(1 for f in DESTINO.rglob('*') if f.is_file())} archivos)")


def espejo():
    for carpeta in ("scripts", "js", "css", "img", "reporte"):
        if (ESPEJO / carpeta).exists():
            shutil.rmtree(ESPEJO / carpeta)
        shutil.copytree(RAIZ / carpeta, ESPEJO / carpeta, ignore=shutil.ignore_patterns("__pycache__"))
    (ESPEJO / "data").mkdir(parents=True, exist_ok=True)
    for f in (ESPEJO / "data").glob("*.js"):
        f.unlink()
    for f in (RAIZ / "data").glob("*.js"):
        shutil.copy2(f, ESPEJO / "data" / f.name)
    if (ESPEJO / "data" / "geo").exists():
        shutil.rmtree(ESPEJO / "data" / "geo")
    shutil.copytree(RAIZ / "data" / "geo", ESPEJO / "data" / "geo")
    for f in ("index.html", "README.md"):
        shutil.copy2(RAIZ / f, ESPEJO / f)
    print(f"  espejo del proyecto -> {ESPEJO}")


if __name__ == "__main__":
    main()

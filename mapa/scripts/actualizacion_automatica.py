"""
Actualización automática del mapa y publicación en collectaproduce.com/mapa-agroalimentario.
La ejecuta el Programador de tareas de Windows (tareas "Collecta mapa - mensual" y "Collecta mapa - anual").

Modos:
  mensual  Monitor de Sequía de CONAGUA (se publica cada quincena) → publica si cambió algo.
  anual    Todas las fuentes automáticas del año anterior (scripts/actualizar_todo.py) → publica.

Salvaguardas antes de publicar (si alguna falla, no se publica y queda registrado):
  - todos los pasos terminaron sin error;
  - todos los .js del mapa pasan `node --check`;
  - la clave de USDA no aparece en ningún archivo a publicar.
Publicación: scripts/publicar_web.py → commit y push a main del repositorio del sitio (Vercel despliega solo).
Registro: logs/actualizacion.log

Uso:
  python scripts/actualizacion_automatica.py mensual|anual [--sin-publicar]
"""
import datetime as dt
import re
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SITIO = Path(r"C:\Users\DELL\dev\collecta_web")
REPORTE = RAIZ / "reporte" / "hallazgos-agroalimentarios.html"
LOG = RAIZ / "logs" / "actualizacion.log"
PY = sys.executable


def log(msg):
    LOG.parent.mkdir(exist_ok=True)
    linea = f"{dt.datetime.now():%Y-%m-%d %H:%M} {msg}"
    print(linea)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(linea + "\n")


def correr(args, cwd=RAIZ):
    r = subprocess.run(args, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    salida = (r.stdout + r.stderr).strip().splitlines()
    log(f"$ {' '.join(map(str, args))} → código {r.returncode}" + (f" · {salida[-1][:200]}" if salida else ""))
    return r.returncode == 0, r.stdout


def verificar():
    malos = [p.name for p in list((RAIZ / "js").glob("*.js")) + list((RAIZ / "data").glob("*.js"))
             if subprocess.run(["node", "--check", str(p)], capture_output=True).returncode != 0]
    if malos:
        log(f"✗ node --check falló en: {', '.join(malos)}")
        return False
    return True


def publicar():
    if not correr([PY, "scripts/publicar_web.py", str(SITIO), str(REPORTE)])[0]:
        return False
    clave = re.search(r"^USDA_AMS_API_KEY=(.+)$", (RAIZ / ".env").read_text(encoding="utf-8"), re.M).group(1).strip().encode()
    destino = SITIO / "public" / "mapa-agroalimentario"
    if any(clave in p.read_bytes() for p in destino.rglob("*") if p.is_file()):
        log("✗ la clave de USDA aparece en los archivos a publicar: no se publica")
        return False
    git = lambda *a: correr(["git", *a], cwd=SITIO)
    ok, _ = git("checkout", "main")
    ok = ok and git("pull", "--ff-only")[0]
    if not ok:
        return False
    git("add", "public/mapa-agroalimentario")
    cambios = subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=SITIO).returncode != 0
    if not cambios:
        log("sin cambios que publicar")
        return True
    ok = git("commit", "-m", f"Actualización automática del mapa agroalimentario ({dt.date.today():%Y-%m-%d})")[0]
    return ok and git("push", "origin", "main")[0]


def main(modo, sin_publicar=False):
    log(f"== inicio {modo}")
    anio = dt.date.today().year - 1
    if modo == "mensual":
        pasos = [[PY, "-c", "import sys; sys.path.insert(0, 'scripts'); import actualizar_todo as a; a.descargar_sequia()"],
                 [PY, "scripts/procesar_sequia.py", str(anio)]]
    elif modo == "anual":
        pasos = [[PY, "scripts/actualizar_todo.py", str(anio)]]
    else:
        raise SystemExit("modo: mensual | anual")
    pasos.append([PY, "scripts/construir_frescura.py"])   # al final: hasta qué fecha llega cada fuente
    ok = all(correr(p)[0] for p in pasos)
    if not ok:
        log("✗ algún paso falló: no se publica")
    elif not verificar():
        pass
    elif sin_publicar:
        log("listo (sin publicar)")
    else:
        log("✓ publicado" if publicar() else "✗ la publicación falló")
    log(f"== fin {modo}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "mensual", "--sin-publicar" in sys.argv)

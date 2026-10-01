"""
Monitor de Sequía de México (CONAGUA, por municipio; se publica cada quincena): descarga la versión más reciente y
la procesa (scripts/procesar_sequia.py). Paso de la actualización semanal (scripts/actualizar_semanal.py), que en
GitHub Actions corre cada martes: así el corte quincenal nuevo entra a más tardar una semana después.
Si la CONAGUA no responde se conserva el archivo anterior (falla no crítica en actualizar_semanal.py).

Uso: python scripts/actualizar_sequia.py [año de referencia = año anterior, el del cierre agrícola]
"""
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import procesar_sequia  # noqa: E402
from actualizar_todo import descargar_sequia  # noqa: E402

if __name__ == "__main__":
    (Path(__file__).resolve().parent.parent / "data" / "fuentes" / "conagua").mkdir(parents=True, exist_ok=True)
    descargar_sequia()
    procesar_sequia.main(int(sys.argv[1]) if len(sys.argv) > 1 else date.today().year - 1)

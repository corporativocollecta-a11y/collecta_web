"""
Actualización semanal de embarques y pronóstico (USDA AMS publica el reporte de embarques cada lunes).
Descarga el año en curso (lo ya descargado no se vuelve a pedir; el mes en curso se renueva), procesa los embarques
por origen y recalcula el pronóstico de 8 semanas, la alerta de oferta (SIAP, mensual) y el origen por estado de lo exportado (SE, mensual). No publica: después correr scripts/publicar_web.py.

Uso:
  python scripts/actualizar_semanal.py
Requiere en .env: USDA_AMS_API_KEY.
"""
import subprocess
import sys
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def main():
    anio = date.today().year
    pasos = [["scripts/descargar_historia_ams.py", str(anio)], ["scripts/procesar_embarques.py"], ["scripts/procesar_pronostico.py"],
             ["scripts/procesar_alerta_oferta.py"],   # el SIAP publica el avance cada mes; si no hay mes nuevo, no cambia
             ["scripts/procesar_origen_exportacion.py"],   # SE: exportación por estado y mes (~2 meses de retraso)
             ["scripts/procesar_neto_semanal.py"],   # FOB semanal en pesos, tipo de cambio (FRED) y diésel por estado (CNE)
             ["scripts/procesar_pronostico_sniim.py"],   # mayoreo en México (SNIIM), año en curso
             ["scripts/procesar_clima_smn.py"],   # helada y lluvia de los próximos días (vence: conviene correrlo a diario)
             ["scripts/construir_alertas.py"],   # movimientos fuertes de la semana (usa los pronósticos)
             ["scripts/construir_frescura.py"]]   # al final: hasta qué fecha llega cada fuente
    # Los pasos del USDA son la base (embarques, pronóstico, alertas): si fallan, se detiene todo. Los demás dependen de
    # fuentes que a veces se caen (Data México, SIAP, SNIIM, CNE, SMN): si uno falla se conserva su archivo anterior y se
    # sigue; al final se avisa (en GitHub Actions como advertencia).
    criticos = {"scripts/descargar_historia_ams.py", "scripts/procesar_embarques.py", "scripts/procesar_pronostico.py"}
    fallidos = []
    for p in pasos:
        print(f"\n$ python {' '.join(p)}", flush=True)
        if subprocess.run([sys.executable, *p], cwd=RAIZ).returncode:
            if p[0] in criticos:
                sys.exit(f"Falló {p[0]}; no se siguió con los demás pasos.")
            fallidos.append(p[0])
            print(f"::warning::Falló {p[0]}: se conserva su versión anterior", flush=True)
    if fallidos:
        print("\nPasos con falla (se conservó lo anterior): " + ", ".join(fallidos))
    print("\nListo. Para publicar: python scripts/publicar_web.py C:/Users/DELL/dev/collecta_web reporte/hallazgos-agroalimentarios.html")


if __name__ == "__main__":
    main()

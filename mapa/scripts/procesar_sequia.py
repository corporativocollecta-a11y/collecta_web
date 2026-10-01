"""
Riesgo climático: Monitor de Sequía de México (CONAGUA / Servicio Meteorológico Nacional), por municipio.

Fuente: https://smn.conagua.gob.mx/tools/RESOURCES/Monitor%20de%20Sequia%20en%20Mexico/MunicipiosSequia.xlsx
        → data/fuentes/conagua/MunicipiosSequia.xlsx (una columna por corte quincenal desde 2003; valor D0–D4 o vacío)

Uso:
  python scripts/procesar_sequia.py [año de referencia=2025]
Salida: data/sequia.js → window.SEQUIA
  {fecha: último corte, anio, municipios: {CVEGEO: [nivel actual, % de cortes del año con sequía D1 o peor]}}
  nivel: 0 sin sequía · 1 D0 anormalmente seco · 2 D1 moderada · 3 D2 severa · 4 D3 extrema · 5 D4 excepcional
"""
import json
import sys
from datetime import datetime
from pathlib import Path

import openpyxl

RAIZ = Path(__file__).resolve().parent.parent
FUENTE = RAIZ / "data" / "fuentes" / "conagua" / "MunicipiosSequia.xlsx"
NIVEL = {None: 0, "": 0, "D0": 1, "D1": 2, "D2": 3, "D3": 4, "D4": 5}


def main(anio=2025):
    ws = openpyxl.load_workbook(FUENTE, read_only=True, data_only=True)["MUNICIPIOS"]
    filas = ws.iter_rows(values_only=True)
    cab = next(filas)
    fechas = [(i, c) for i, c in enumerate(cab) if isinstance(c, datetime)]
    ultima_i, ultima = fechas[-1]
    del_anio = [i for i, c in fechas if c.year == anio]
    salida = {"generado": datetime.now().strftime("%Y-%m-%d"), "fecha": ultima.strftime("%Y-%m-%d"), "anio": anio, "cortesAnio": len(del_anio),
              "fuente": "CONAGUA, Monitor de Sequía de México (por municipio)", "municipios": {}}
    for r in filas:
        cve = str(r[0] or "").zfill(5)
        if not cve.strip("0"):
            continue
        actual = NIVEL.get((r[ultima_i] or "").strip() if isinstance(r[ultima_i], str) else r[ultima_i], 0)
        con = sum(1 for i in del_anio if NIVEL.get((r[i] or "").strip() if isinstance(r[i], str) else r[i], 0) >= 2)
        salida["municipios"][cve] = [actual, round(con / len(del_anio) * 100) if del_anio else 0]
    destino = RAIZ / "data" / "sequia.js"
    destino.write_text(f"// Generado por scripts/procesar_sequia.py · {salida['fuente']}, corte {salida['fecha']}\n"
                       f"window.SEQUIA = {json.dumps(salida, separators=(',', ':'))};\n", encoding="utf-8")
    niveles = [v[0] for v in salida["municipios"].values()]
    print(f"-> {destino.name} ({destino.stat().st_size / 1e3:.0f} kB), {len(niveles)} municipios, corte {salida['fecha']}; "
          f"con sequía D1+ hoy: {sum(n >= 2 for n in niveles)}; cortes {anio}: {len(del_anio)}")


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 2025)

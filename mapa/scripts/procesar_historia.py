"""
Historia de 10 años (FAOSTAT): producción, exportación e importación por país y producto, para ver quién crece y
quién cae. Usa los mismos archivos mundiales que procesar_faostat.py global (data/fuentes/faostat/*_E_All_Data.zip)
y los mismos productos y países.

Uso:
  python scripts/procesar_historia.py [año final=2024] [años=10]
Salida: data/historia.js → window.HISTORIA (se carga al abrir un panel que la usa)
  {anios: [...], productos: {clave: {M49: [[producción t], [exportación t], [importación t]]}}}
"""
import json
import sys
from collections import defaultdict

from procesar_faostat import EXCLUIR_FAO, PRODUCTOS, RAIZ, filas, m49, num, paises_globales

ELEMENTOS = {"Production": 0, "Export quantity": 1, "Import quantity": 2}


def main(fin=2024, n=10):
    anios = list(range(fin - n + 1, fin + 1))
    iso, centro = paises_globales()
    incluido = lambda r: int(r["Area Code"]) < 5000 and int(r["Area Code"]) not in EXCLUIR_FAO \
        and iso.get(m49(r["Area Code (M49)"])) in centro
    codigos = {str(c): k for k, cs in PRODUCTOS.items() for c in cs}
    datos = defaultdict(lambda: defaultdict(lambda: [[0.0] * n for _ in range(3)]))
    for base in ("Production_Crops_Livestock", "Trade_CropsLivestock"):
        for r in filas(f"{base}_E_All_Data.zip", f"{base}_E_All_Data_NOFLAG.csv"):
            k = codigos.get(r["Item Code"])
            e = ELEMENTOS.get(r["Element"])
            if k is None or e is None or not incluido(r):
                continue
            if e == 0 and r.get("Unit") not in ("t", "tonnes"):
                continue
            serie = datos[k][m49(r["Area Code (M49)"])][e]
            for i, a in enumerate(anios):
                serie[i] += num(r.get(f"Y{a}")) or 0
    salida = {"anios": anios, "fuente": f"FAOSTAT (QCL y TCL), {anios[0]}-{anios[-1]}",
              "productos": {k: {p: [[round(v) for v in s] for s in series] for p, series in paises.items()
                                if any(any(s) for s in series)} for k, paises in datos.items()}}
    destino = RAIZ / "data" / "historia.js"
    destino.write_text(f"// Generado por scripts/procesar_historia.py · {salida['fuente']}\n"
                       f"window.HISTORIA = {json.dumps(salida, separators=(',', ':'))};\n", encoding="utf-8")
    mx = salida["productos"].get("aguacate", {}).get("484")
    print(f"-> {destino.name} ({destino.stat().st_size / 1e3:.0f} kB), {len(salida['productos'])} productos; "
          f"México aguacate producción {mx[0] if mx else '—'}")


if __name__ == "__main__":
    main(*(int(x) for x in sys.argv[1:3]))

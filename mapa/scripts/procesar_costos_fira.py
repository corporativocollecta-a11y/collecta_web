"""
Costo de producción por estado contra el precio que recibe el productor (propuesta 4).

Fuente de costos: FIRA, Agrocostos (https://www.fira.gob.mx/agrocostosApp/), archivo completo detrás de la app:
https://www.fira.gob.mx/Nd/agrocosto_data_completa.csv (UTF-8 con BOM; 2015–2022). Cada fila es un costo
paramétrico por hectárea para un cultivo, estado, zona, ciclo y tecnología; CostoUnitario = CostoTotal ÷ rendimiento
probable, en pesos por tonelada. FIRA advierte que son pocas observaciones y no son representativas del estado: sirven
como referencia de orden de magnitud. El archivo trae nombres del personal de FIRA que elabora y autoriza: NO se copian.

Se usan solo costos de plantaciones o cultivos en producción (se excluyen establecimiento y años pre-productivos, y
filas con rendimiento menor a 0.5 t/ha, que son errores de captura: aguacate en Sinaloa 2018 trae 0.000001 t/ha) y,
por producto, estado y tipo (agricultura protegida —invernadero, malla— o cielo abierto, según la "Modalidad" de
FIRA), el año más reciente (promedio de sus filas). El precio rural del SIAP mezcla ambos tipos: la producción
protegida suele venderse más cara (exportación), así que su margen contra el precio rural sale castigado.

Pesos de hoy: índice de precios al consumidor de México (OCDE vía FRED, MEXCPIALLMINMEI, mensual hasta julio de
2024); después, la inflación anual de 2025 (FRED FPCPITOTLZGMEX) mes a mes hasta el mes actual. Es una aproximación
(INEGI y Banxico piden clave); se reemplaza cuando haya INPC directo.

Precio de comparación: precio medio rural del SIAP 2025 por estado (valor ÷ volumen del cierre municipal).

Salida: data/costos_fira.js → window.COSTOS_FIRA = {actualizadoA, factores, rural: {clave: {estado: $/kg SIAP 2025}},
  productos: {clave: {estado: [[tipo "protegida"|"abierto", costo $/kg de hoy, año FIRA, rendimiento t/ha, filas], …]}}}
Uso: python scripts/procesar_costos_fira.py
"""
import csv
import io
import json
import re
import subprocess
import sys
import unicodedata
import urllib.request
from collections import defaultdict
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from procesar_siap import CULTIVOS, abrir_csv, columna, normalizar, numero  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
CSV_FIRA = RAIZ / "data" / "fuentes" / "fira" / "agrocosto_data_completa.csv"
URL_FIRA = "https://www.fira.gob.mx/Nd/agrocosto_data_completa.csv"
# producto del mapa → nombres de cultivo de FIRA (prefijos, sin acentos y en mayúsculas)
FIRA = {
    "aguacate": ["AGUACATE"], "arandano": ["ARANDANO"], "brocoli": ["BROCOLI"], "calabacita": ["CALABACITA"],
    "cebolla": ["CEBOLLA"], "chile": ["CHILE JALAPENO", "CHILE PIMIENTO"], "durazno": ["DURAZNO"],
    "esparrago": ["ESPARRAGO"], "frambuesa": ["FRAMBUESA"], "fresa": ["FRESA"],
    "jitomate": ["JITOMATE", "TOMATE ROJO"], "limon": ["LIMON"], "mango": ["MANGO"], "manzana": ["MANZANO"],
    "melon": ["MELON"], "naranja": ["NARANJO"], "nuez": ["NOGAL"], "papa": ["PAPA "], "papaya": ["PAPAYA", "PAPAYO"],
    "pina": ["PINA"], "platano": ["PLATANO"], "sandia": ["SANDIA"], "uva": ["VID MANTENIMIENTO", "VID UVA", "VID  MANTENIMIENTO"],
    "zarzamora": ["ZARZAMORA"],
}
NO_PRODUCTIVO = re.compile(r"ESTABLEC|PRE-?PRODUCTIVO|PREPRODUCTIVO|ANO [1-4]\b|PASA")


def sin_acentos(t):
    return unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().upper()


def fred(serie):
    url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={serie}&cosd=2014-01-01"
    filas = urllib.request.urlopen(url, timeout=60).read().decode().splitlines()[1:]
    return [(r.split(",")[0], float(r.split(",")[1])) for r in filas if r.split(",")[1] not in ("", ".")]


def factores():
    """Promedio anual del índice por año y el índice estimado del mes actual → factor a pesos de hoy por año."""
    mens = fred("MEXCPIALLMINMEI")
    anual = dict((f[:4], v) for f, v in fred("FPCPITOTLZGMEX"))
    ult_f, ult_v = mens[-1]
    a, m = map(int, ult_f[:7].split("-"))
    hoy = date.today()
    meses = (hoy.year - a) * 12 + hoy.month - m
    tasa = anual.get(str(hoy.year - 1)) or list(anual.values())[-1]   # inflación anual más reciente
    indice_hoy = ult_v * (1 + tasa / 100) ** (meses / 12)
    prom = defaultdict(list)
    for f, v in mens:
        prom[f[:4]].append(v)
    return {y: round(indice_hoy / (sum(v) / len(v)), 4) for y, v in prom.items()}, f"{hoy.year}-{hoy.month:02d}", ult_f[:7], tasa


def precio_rural(anio=2025):
    """{clave: {estado: $/kg}} = valor ÷ volumen del cierre municipal del SIAP."""
    buscar = {nombre: clave for clave, nombres in CULTIVOS.items() for nombre in nombres}
    suma = defaultdict(lambda: defaultdict(lambda: [0.0, 0.0]))
    with abrir_csv(RAIZ / "data" / "fuentes" / f"Cierre_agricola_mun_{anio}.csv") as f:
        lector = csv.DictReader(f)
        h = lector.fieldnames
        c_edo, c_cult = columna(h, "idestado"), columna(h, "nomcultivo")
        c_vol, c_val, c_un = columna(h, "volumenproduccion"), columna(h, "valorproduccion"), columna(h, "nomunidad")
        for fila in lector:
            k = buscar.get(normalizar(fila[c_cult]))
            if not k or "tonelada" not in normalizar(fila[c_un]):
                continue
            vol, val = numero(fila[c_vol]) or 0, numero(fila[c_val]) or 0
            s = suma[k][str(fila[c_edo]).zfill(2)]
            s[0] += vol
            s[1] += val
    return {k: {e: round(v[1] / v[0] / 1000, 2) for e, v in d.items() if v[0] > 0} for k, d in suma.items()}


def main():
    if not CSV_FIRA.exists():
        CSV_FIRA.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["curl", "-sS", "-L", "--retry", "4", "-A", "Mozilla/5.0", "-o", str(CSV_FIRA), URL_FIRA], check=True)
    fac, hoy, ult_cpi, tasa = factores()
    texto = (RAIZ / "data" / "estados.js").read_text(encoding="utf-8")
    ids = {sin_acentos(n): i for i, n in re.findall(r'id:\s*"(\d{2})"[^}]*?nombre:\s*"([^"]+)"', texto)}

    def id_estado(n):
        n = sin_acentos(n).replace(" NTE", " NORTE").replace("COAHUILA DE ZARAGOZA", "COAHUILA").replace("MEXICO", "MEXICO")
        return ids.get(n) or next((i for nn, i in ids.items() if nn.startswith(n.split(" DE ")[0]) or n.startswith(nn)), None)

    filas = defaultdict(lambda: defaultdict(list))   # clave → (estado, tipo) → [(año, $/t, rendimiento)]
    for r in csv.DictReader(io.StringIO(CSV_FIRA.read_text(encoding="utf-8-sig"))):
        nombre = sin_acentos(r["Cultivo"]) + " "
        if NO_PRODUCTIVO.search(nombre) or r.get("Estatus", "").strip().lower() not in ("autorizado", ""):
            continue
        k = next((k for k, pref in FIRA.items() if any(nombre.startswith(p) for p in pref)), None)
        if not k:
            continue
        e = id_estado(r["Estado"])
        try:
            cu, rend, anio = float(r["CostoUnitario"]), float(r["Rendimiento probable"]), r["Año"]
        except ValueError:
            continue
        tipo = "protegida" if "PROTEGID" in sin_acentos(r.get("Modalidad", "")) else "abierto"
        if e and cu > 0 and rend >= 0.5:
            filas[k][(e, tipo)].append((anio, cu, rend))
    rural = precio_rural()
    productos = {}
    for k, estados in filas.items():
        out = defaultdict(list)
        for (e, tipo), lista in estados.items():
            ult = max(a for a, _, _ in lista)
            sel = [x for x in lista if x[0] == ult]
            costo = sum(cu for _, cu, _ in sel) / len(sel) / 1000 * fac.get(ult, 1)
            out[e].append([tipo, round(costo, 2), int(ult), round(sum(r for *_, r in sel) / len(sel), 1), len(sel)])
        productos[k] = dict(out)
    salida = {"generado": date.today().isoformat(), "actualizadoA": hoy, "indice": f"OCDE/FRED hasta {ult_cpi}; después {tasa:.1f}% anual",
              "factores": fac, "rural": {k: rural.get(k, {}) for k in productos}, "fuente": "FIRA, Agrocostos 2015–2022 (costo paramétrico por hectárea); SIAP, precio medio rural 2025",
              "productos": productos}
    destino = RAIZ / "data" / "costos_fira.js"
    destino.write_text("// Generado por scripts/procesar_costos_fira.py — costo de producción por kg (FIRA, a pesos de hoy) y precio rural (SIAP 2025)\n"
                       f"window.COSTOS_FIRA = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"Pesos de {hoy} (índice {salida['indice']}) · factor 2022 = {fac.get('2022')} · {len(productos)} productos -> {destino}")
    for k, d in productos.items():
        print(f"  {k:11s} " + " · ".join(f"{e} {v[0][:4]}: {v[1]:.1f} ({v[2]}) vs rural {rural.get(k, {}).get(e, 0):.1f}" for e, vs in sorted(d.items()) for v in vs))


if __name__ == "__main__":
    main()

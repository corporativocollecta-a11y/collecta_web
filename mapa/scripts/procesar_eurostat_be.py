"""
Vista Bélgica: producción por provincia (las 11 provincias NUTS 2, con Bruselas-Capital como una más) a partir de
Eurostat, porque el portal de Statbel (statbel.fgov.be, también sus archivos de datos abiertos y data.gov.be) responde
con un desafío anti-bot de JavaScript a las descargas automáticas y no se intentó sortearlo.

Fuentes (API de Eurostat, abierta y sin clave; https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/):
  - apro_cpshr  producción de papa (R1000, miles de t) por región NUTS 2, 2024 → publicada por provincia.
  - ef_lus_allcrops  Encuesta de estructura de las explotaciones 2023 (Statbel para Eurostat): superficie (ha) por
                     provincia de hortalizas bajo vidrio (V0000_S0000S), hortalizas al aire libre (V0000_S0000T),
                     hortalizas + fresa total (V0000_S0000), frutas de pepita (F1100), de hueso (F1200) y berries (F3000).
  - demo_r_pjanaggr3  población al 1 de enero de 2025 por NUTS 2.
  - FAOSTAT 2024 (motor común) para la producción nacional de cada hortaliza y fruta.
Descargas brutas en data/fuentes/be/eurostat_*.json (se reutilizan si existen).

Método: la papa es producción publicada por provincia. Para las demás, la producción nacional de FAOSTAT 2024 se
reparte entre provincias según la superficie del grupo de cultivos correspondiente en la encuesta de 2023 (los
cultivos de invernadero con la superficie bajo vidrio, las hortalizas de campo con la superficie al aire libre, la
manzana y la pera con la de frutales de pepita, etc.) y se marca como estimada.

Uso:
  python scripts/procesar_eurostat_be.py
Salida: data/sub_be.js → window.SUBNACIONAL.BE
"""
import json
import urllib.request
from pathlib import Path

from subnacional_comun import escribir_pais, fao_bruto, produccion_fao, resumen

RAIZ = Path(__file__).resolve().parent.parent
F = RAIZ / "data" / "fuentes" / "be"
API = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data"

PROVINCIAS = {  # id (ISO 3166-2 sin prefijo) → (NUTS 2, nombre en español, lat, lon de la capital)
    "BRU": ("BE10", "Bruselas-Capital", 50.85, 4.35), "VAN": ("BE21", "Amberes", 51.22, 4.40),
    "VLI": ("BE22", "Limburgo", 50.93, 5.34), "VOV": ("BE23", "Flandes Oriental", 51.05, 3.72),
    "VBR": ("BE24", "Brabante Flamenco", 50.88, 4.70), "VWV": ("BE25", "Flandes Occidental", 51.21, 3.22),
    "WBR": ("BE31", "Brabante Valón", 50.67, 4.61), "WHT": ("BE32", "Henao", 50.45, 3.95),
    "WLG": ("BE33", "Lieja", 50.63, 5.57), "WLX": ("BE34", "Luxemburgo", 49.68, 5.82),
    "WNA": ("BE35", "Namur", 50.47, 4.87),
}
GEO = "".join(f"&geo={g}" for g in ["BE"] + [v[0] for v in PROVINCIAS.values()])
DESCARGAS = {
    "apro_cpshr": "crops=R1000&strucpro=HPRD_HUMD_EU_THS_T&strucpro=AR_THS_HA&sinceTimePeriod=2023",
    "ef_lus_allcrops": "time=2023&unit=HA&statinfo=TOTAL&so_eur=TOTAL&uaarea=TOTAL",
    "pop": "sex=T&age=TOTAL&unit=NR&sinceTimePeriod=2024",
}
TABLAS = {"apro_cpshr": "apro_cpshr", "ef_lus_allcrops": "ef_lus_allcrops", "pop": "demo_r_pjanaggr3"}

# producto → (grupo de superficie de ef_lus_allcrops usado para repartir)
REPARTO = {
    "jitomate": "V0000_S0000S", "chile": "V0000_S0000S", "pepino": "V0000_S0000S", "berenjena": "V0000_S0000S",
    "cebolla": "V0000_S0000T", "zanahoria": "V0000_S0000T", "brocoli": "V0000_S0000T", "lechuga": "V0000_S0000T",
    "calabacita": "V0000_S0000T", "esparrago": "V0000_S0000T", "fresa": "V0000_S0000",
    "manzana": "F1100", "pera": "F1100", "cereza": "F1200", "arandano": "F3000",
}
EXTRA_FAO = {"cereza": "531"}
GRUPOS = {"V0000_S0000S": "superficie de hortalizas bajo vidrio", "V0000_S0000T": "superficie de hortalizas al aire libre",
          "V0000_S0000": "superficie de hortalizas y fresa", "F1100": "superficie de frutales de pepita",
          "F1200": "superficie de frutales de hueso", "F3000": "superficie de berries"}
NOMBRES = {"brocoli": "Brócoli y coliflor", "arandano": "Berries (arándano, frambuesa y otros)",
           "lechuga": "Lechuga y achicoria (endibia)", "zanahoria": "Zanahoria y nabo"}
NOTAS = {
    "papa": "Producción publicada por provincia (Eurostat, datos de Statbel).",
    "lechuga": "Incluye la endibia (witloof), que la FAO agrupa con la lechuga.",
}


def eurostat(nombre):
    archivo = F / f"eurostat_{nombre}_be.json"
    if not archivo.exists():
        F.mkdir(parents=True, exist_ok=True)
        url = f"{API}/{TABLAS[nombre]}?format=JSON&lang=EN{GEO}&{DESCARGAS[nombre]}"
        with urllib.request.urlopen(url, timeout=120) as r:
            archivo.write_bytes(r.read())
    d = json.loads(archivo.read_text(encoding="utf-8"))
    ids, tam = d["id"], d["size"]
    cats = {k: {i: c for c, i in d["dimension"][k]["category"]["index"].items()} for k in ids}
    filas = []
    for k, v in d["value"].items():
        k, coords = int(k), []
        for s in reversed(tam):
            coords.append(k % s)
            k //= s
        coords.reverse()
        filas.append(({ids[i]: cats[ids[i]][coords[i]] for i in range(len(ids))}, v))
    return filas


def main():
    pob = {f["geo"]: int(v) for f, v in eurostat("pop") if f["time"] == "2025"}
    sup = {}
    for f, v in eurostat("ef_lus_allcrops"):
        sup[(f["geo"], f["crops"])] = v or 0
    papa = {(f["geo"], f["strucpro"]): v for f, v in eurostat("apro_cpshr") if f["time"] == "2024"}
    extra = fao_bruto("056", EXTRA_FAO)

    datos = {
        "codigo": "BE", "m49": "056", "pais": "Bélgica", "nivel": "provincia", "nivelPlural": "provincias",
        "femenino": True, "anio": 2024, "anioPoblacion": 2025,
        "fuente": "Eurostat (apro_cpshr 2024, encuesta de explotaciones 2023, población 1-ene-2025), FAOSTAT 2024",
        "fuenteCorta": "Eurostat / FAOSTAT 2024",
        "metodo": "Papa: producción publicada por provincia (Eurostat apro_cpshr, datos de Statbel). Demás productos: "
                  "producción nacional de FAOSTAT 2024 repartida entre provincias según la superficie del grupo de "
                  "cultivos en la encuesta de estructura de las explotaciones 2023 (bajo vidrio, aire libre, frutales "
                  "de pepita, de hueso, berries); marcada como estimada. Población de Eurostat.",
        "limites": [[49.49, 2.54], [51.51, 6.41]],
        "regiones": {c: {"nombre": n, "lat": la, "lon": lo, "pob": pob.get(nuts)} for c, (nuts, n, la, lo) in PROVINCIAS.items()},
        "productos": {},
    }

    def agregar(clave, nacional, hect, reg, fuente, estimado, nota_extra=None):
        if nacional <= 0:
            print(f"  (sin datos: {clave})")
            return
        suma = sum(reg.values())
        if abs(suma - nacional) > max(10, nacional * 0.01):
            print(f"  aviso {clave}: provincias {suma:,.0f} vs Bélgica {nacional:,.0f}")
        nota = " ".join(x for x in (NOTAS.get(clave), nota_extra) if x)
        datos["productos"][clave] = {
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            **({"nota": nota} if nota else {}),
            "fuenteProduccion": fuente, "anioProduccion": 2024,
            "nacional": round(nacional), "ha": round(hect),
            "regiones": {c: [round(t), 1 if estimado else 0] for c, t in reg.items() if round(t) > 0},
            **({"comercio": extra[clave]["comercio"]} if clave in extra and extra[clave]["comercio"] else {}),
        }

    # Papa: publicada por provincia (miles de t)
    reg = {c: papa.get((nuts, "HPRD_HUMD_EU_THS_T")) * 1000 for c, (nuts, *_r) in PROVINCIAS.items()
           if papa.get((nuts, "HPRD_HUMD_EU_THS_T"))}
    agregar("papa", (papa.get(("BE", "HPRD_HUMD_EU_THS_T")) or 0) * 1000,
            (papa.get(("BE", "AR_THS_HA")) or 0) * 1000, reg, "Eurostat", False)

    # Resto: FAOSTAT nacional repartido por superficie del grupo
    for clave, grupo in REPARTO.items():
        if clave in extra:
            t, h = extra[clave]["prod"], 0
        else:
            t, h = produccion_fao("056", clave)
        pesos = {c: sup.get((nuts, grupo), 0) for c, (nuts, *_r) in PROVINCIAS.items()}
        total = sum(pesos.values())
        if total <= 0:
            print(f"  aviso {clave}: sin superficie {grupo}")
            continue
        reg = {c: t * w / total for c, w in pesos.items() if w > 0}
        agregar(clave, t, h, reg, "FAOSTAT", True, f"Reparto por provincia según la {GRUPOS[grupo]} (encuesta 2023).")

    destino = escribir_pais(datos)
    print(f"-> {destino.name} ({destino.stat().st_size / 1e3:.0f} kB) · población {sum(r['pob'] or 0 for r in datos['regiones'].values()):,}")
    resumen(datos)


if __name__ == "__main__":
    main()

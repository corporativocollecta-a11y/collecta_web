"""
Vista Portugal: producción por región NUTS II (versión NUTS 2024) de las Estadísticas da produção vegetal del INE
de Portugal y población residente estimada del INE. Comercio con FAOSTAT mediante el motor común.

Fuentes (API JSON del INE, sin clave):
  - Indicador 0013082: "Produção das principais culturas agrícolas (t) por Localização geográfica (NUTS - 2024) e
    Espécie; Anual" (2025 = último año publicado, actualizado 2026-08-01).
  - Indicador 0012918: "População residente (N.º) por Local de residência (NUTS - 2024), Sexo e Grupo etário; Anual"
    (estimaciones anuales, 2025).
  https://www.ine.pt/ine/json_indicador/pindica.jsp?op=2&varcd=<indicador>&Dim1=S7A<año>&lang=PT

El INE solo publica las hortalizas (tomate fresco, cebolla, zanahoria, lechuga, melón…) a nivel nacional: en todas
las regiones aparecen como "x" (dato no disponible), también en la serie por región agraria. Por eso la vista de
Portugal cubre frutas, papa y tomate para industria, sin estimaciones propias.

Uso:
  python scripts/procesar_ine_pt.py [año=2025]
Salida: data/sub_pt.js → window.SUBNACIONAL.PT
"""
import json
import sys
import urllib.request
from pathlib import Path

from subnacional_comun import escribir_pais, fao_bruto, resumen

RAIZ = Path(__file__).resolve().parent.parent
F = RAIZ / "data" / "fuentes" / "pt"
API = "https://www.ine.pt/ine/json_indicador/pindica.jsp?op=2&lang=PT&varcd="

REGIONES = {  # código NUTS 2024 → (geocod del INE, nombre, lat, lon de la capital)
    "PT11": ("11", "Norte", 41.15, -8.61), "PT19": ("19", "Centro", 40.21, -8.43),
    "PT1D": ("1D", "Oeste y Valle del Tajo", 39.24, -8.69), "PT1A": ("1A", "Gran Lisboa", 38.72, -9.14),
    "PT1B": ("1B", "Península de Setúbal", 38.52, -8.89), "PT1C": ("1C", "Alentejo", 38.57, -7.91),
    "PT15": ("15", "Algarve", 37.02, -7.93), "PT20": ("20", "Azores", 37.74, -25.67),
    "PT30": ("30", "Madeira", 32.65, -16.91),
}

# producto del mapa → códigos de especie del INE
PRODUCTOS = {
    "jitomate": ["10401"], "papa": ["103"],
    "manzana": ["11002"], "pera": ["11001"], "durazno": ["11003"], "uva": ["11502"],
    "naranja": ["11301"], "limon": ["11303"], "toronja": ["11305"], "aguacate": ["11204"],
    "platano": ["11203"], "pina": ["11202"], "arandano": ["11104", "11102", "11101"], "nuez": ["11403"],
    # Solo vistas por país (data/productos_paises.js)
    "mandarina": ["11302", "11304"], "kiwi": ["11201"], "cereza": ["11004", "11009"], "chabacano": ["11006"],
    "granada": ["11012"],
}
EXTRA_FAO = {"cereza": "531", "kiwi": "592", "mandarina": "495", "chabacano": "526", "nuez": "222"}
SIN_COMERCIO = ("granada",)
NOMBRES = {"jitomate": "Jitomate para industria", "arandano": "Berries (arándano, frambuesa y zarzamora)",
           "nuez": "Nuez de Castilla (nogal)"}
NOTAS = {
    "jitomate": "Solo el tomate para industria, que el INE publica por región. El tomate fresco (127,779 t en 2025) "
                "solo tiene dato nacional y no se incluye; el comercio de la FAO sí cubre todo el tomate.",
    "papa": "Papa de riego y de temporal.",
    "durazno": "Durazno (pêssego), incluida la nectarina.",
    "uva": "Solo uva de mesa (sin la de vinificación, 778 mil t en 2025).",
    "arandano": "Arándano (mirtilo), frambuesa y zarzamora (amora); casi toda en el Alentejo y el Algarve (invernadero).",
    "nuez": "Nuez de nogal (noz), no pecanera. Comercio de la FAO: nuez con cáscara (partida 222).",
    "mandarina": "Mandarina (tangerina) y tangor (tangera).",
    "cereza": "Cereza dulce y guinda (ginja).",
    "granada": "Su comercio no está en este mapa: el balance supone que lo producido se consume en el país.",
    "platano": "Plátano de Madeira y Azores (y algo del Algarve).",
    "pina": "Piña de invernadero de São Miguel (Azores).",
}


def descargar(nombre, varcd, anio, extra=""):
    archivo = F / nombre
    if not archivo.exists():
        F.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(f"{API}{varcd}&Dim1=S7A{anio}{extra}", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=300) as r:
            archivo.write_bytes(r.read())
    d = json.loads(archivo.read_text(encoding="utf-8"))[0]
    return d["Dados"][str(anio)]


def valor(r):
    return float(r["valor"]) if r.get("valor") not in (None, "") else None


def main(anio=2025):
    filas = descargar(f"produccion_0013082_{anio}.json", "0013082", anio)
    pobs = descargar(f"poblacion_0012918_{anio}.json", "0012918", anio, "&Dim3=T&Dim4=T")
    geo = {g: c for c, (g, *_) in REGIONES.items()}
    pob = {geo[r["geocod"]]: int(r["valor"]) for r in pobs if r["geocod"] in geo}

    prod = {}   # (geocod, especie) → toneladas
    for r in filas:
        v = valor(r)
        if v is not None:
            prod[(r["geocod"], r["dim_3"])] = v

    extra = fao_bruto("620", EXTRA_FAO)
    datos = {
        "codigo": "PT", "m49": "620", "pais": "Portugal", "nivel": "región", "nivelPlural": "regiones", "femenino": True,
        "anio": anio, "anioPoblacion": anio,
        "fuente": f"INE Portugal, Estatísticas da produção vegetal {anio}; INE población estimada {anio}; FAOSTAT",
        "fuenteCorta": f"INE Portugal {anio}",
        "metodo": "Producción por región NUTS II (versión 2024) del INE de Portugal, sin estimaciones propias. "
                  "Las hortalizas no se incluyen porque el INE solo las publica a nivel nacional. "
                  "Población residente estimada del INE.",
        "limites": [[36.9, -9.6], [42.2, -6.1]],
        "regiones": {c: {"nombre": n, "lat": la, "lon": lo, "pob": pob.get(c)} for c, (g, n, la, lo) in REGIONES.items()},
        "productos": {},
    }
    for clave, codigos in PRODUCTOS.items():
        regiones = {}
        for c, (g, *_) in REGIONES.items():
            t = sum(prod.get((g, e), 0) for e in codigos)
            if t > 0:
                regiones[c] = [round(t), 0]
        nacional = sum(prod.get(("PT", e), 0) for e in codigos)
        if nacional <= 0:
            print(f"  (sin datos {anio}: {clave})")
            continue
        suma = sum(v[0] for v in regiones.values())
        if abs(suma - nacional) > max(10, nacional * 0.01):
            print(f"  aviso {clave}: regiones {suma:,.0f} vs Portugal {nacional:,.0f}")
        datos["productos"][clave] = {
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            **({"nota": NOTAS[clave]} if clave in NOTAS else {}),
            "fuenteProduccion": "INE", "anioProduccion": anio,
            "nacional": round(nacional), "ha": 0, "regiones": regiones,
            **({"comercio": extra[clave]["comercio"]} if clave in extra and extra[clave]["comercio"] else {}),
        }
    destino = escribir_pais(datos, sin_comercio=SIN_COMERCIO)
    print(f"-> {destino.name} ({destino.stat().st_size / 1e3:.0f} kB) · población {sum(pob.values()):,}")
    resumen(datos)


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 2025)

"""
Descarga y procesa el comercio exterior OFICIAL de México (exportación e importación,
en toneladas y USD, por país) para los productos del mapa.

Fuente: estadísticas de comercio que México (INEGI/SE) reporta a Naciones Unidas,
consultadas en la API pública de UN Comtrade (reporter 484 = México, HS, anual).

Uso:
  python scripts/procesar_comercio.py 2025

Salidas:
  - data/fuentes/comtrade/<anio>_<producto>_<flujo>.json  (respuesta cruda, para auditoría)
  - data/comercio_oficial.js  → sobrescribe exportacion, importacion, destinos y origenes
                                  de data/productos.js al cargarse después de él
Solo usa la biblioteca estándar de Python.
"""
import json
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
API = "https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=484&period={anio}&cmdCode={codigos}&flowCode={flujo}"

# Fracciones del Sistema Armonizado (6 dígitos), producto en fresco
FRACCIONES = {
    "jitomate": ["070200"],            # tomates frescos o refrigerados
    "chile":    ["070960"],            # frutos de los géneros Capsicum o Pimenta (chiles y pimientos)
    "aguacate": ["080440"],
    "limon":    ["080550"],            # limones y limas
    "naranja":  ["080510"],
    "platano":  ["080310", "080390"],  # plátano macho + banano
    "mango":    ["080450"],            # guayabas, mangos y mangostanes (el SA no los separa)
    "papa":     ["070110", "070190"],  # papa para siembra + papa fresca
    "cebolla":  ["070310"],            # cebollas y chalotes
    "brocoli":  ["070410"],            # coliflores y brócoli (el SA no los separa)
    "fresa":    ["081010"],
    "pepino":   ["070700"],            # pepinos y pepinillos
    "manzana":  ["080810"],
    # tomate_verde (tomatillo) no tiene fracción propia: va dentro de 070999 "las demás hortalizas";
    # se omite y la app conserva los valores de respaldo de data/productos.js
    "calabacita": ["070993"],          # calabazas (Cucurbita spp.) — SA 2012+; incluye calabaza madura
    "zanahoria":  ["070610"],          # zanahorias y nabos
    "lechuga":    ["070511", "070519"],  # lechuga repollada + las demás lechugas
    "sandia":     ["080711"],
    "melon":      ["080719"],          # los demás melones (incl. melón chino y gota de miel)
    "papaya":     ["080720"],
    "pina":       ["080430"],
    "uva":        ["080610"],          # uvas frescas (excluye pasas 080620)
    "toronja":    ["080540"],          # toronjas y pomelos
    "pera":       ["080830"],
    "durazno":    ["080930"],          # duraznos (melocotones), incluidos griñones y nectarinas
    "berenjena":  ["070930"],
    "esparrago":  ["070920"],
    "arandano":   ["081040"],          # arándanos y demás frutos del género Vaccinium
    # Nuez pecanera: el SA no tiene subpartida propia (080290 dejó de existir en SA 2017; hoy "las demás"
    # es 080299). México reporta la nuez pecanera sobre todo en 080231/080232 ("nueces de nogal", con y sin
    # cáscara): en 2025, 080299 solo registra ≈670 t. Se suman las tres; incluyen algo de nuez de Castilla (Juglans).
    "nuez":       ["080231", "080232", "080299"],
    # Sin fracción propia o ya asignada a otro producto (no se duplican):
    #   coliflor → dentro de 070410 (asignada a brócoli); guayaba → dentro de 080450 (asignada a mango);
    #   nopal → dentro de 070999 "las demás hortalizas"
}

# Fracciones COMPARTIDAS por varios productos del mapa: volumen y valor se reparten en proporción a la
# producción nacional SIAP de cada uno (data/produccion_siap.js); destinos y orígenes (%) son los mismos.
COMPARTIDAS = {
    "081020": {"codigos": ["081020"], "productos": ["frambuesa", "zarzamora"]},  # frambuesas, zarzamoras, moras
}

NOMBRES_PAIS = {
    "USA": "Estados Unidos", "Canada": "Canadá", "Japan": "Japón", "Netherlands": "Países Bajos",
    "Spain": "España", "United Kingdom": "Reino Unido", "Chile": "Chile", "Guatemala": "Guatemala",
    "China": "China", "Rep. of Korea": "Corea del Sur", "El Salvador": "El Salvador", "Honduras": "Honduras",
    "France": "Francia", "Germany": "Alemania", "Belgium": "Bélgica", "Italy": "Italia",
    "New Zealand": "Nueva Zelanda", "Peru": "Perú", "Costa Rica": "Costa Rica", "Ecuador": "Ecuador",
    "Colombia": "Colombia", "United Arab Emirates": "Emiratos Árabes", "Nicaragua": "Nicaragua",
    "Panama": "Panamá", "Australia": "Australia", "Russian Federation": "Rusia", "Hong Kong": "Hong Kong",
    "Other Asia, nes": "Taiwán", "Areas, nes": "No especificado", "Belize": "Belice",
    "Thailand": "Tailandia", "Argentina": "Argentina", "Brazil": "Brasil", "Singapore": "Singapur",
}


def descargar(anio, clave, codigos, flujo):
    cache = RAIZ / "data" / "fuentes" / "comtrade" / f"{anio}_{clave}_{flujo}.json"
    if cache.exists():
        return json.loads(cache.read_text(encoding="utf-8"))
    url = API.format(anio=anio, codigos=",".join(codigos), flujo=flujo)
    for intento in range(5):  # la API pública responde 429 (límite de frecuencia) si se consulta seguido
        try:
            with urllib.request.urlopen(url, timeout=90) as r:
                datos = json.loads(r.read().decode("utf-8"))
            break
        except urllib.error.HTTPError as e:
            if e.code not in (429, 503) or intento == 4:
                raise
            time.sleep(10 * (intento + 1))
    if datos.get("error"):
        raise RuntimeError(f"{clave} {flujo}: {datos['error']}")
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps(datos, ensure_ascii=False), encoding="utf-8")
    time.sleep(1.5)  # la API pública limita la frecuencia de consultas
    return datos


def paises():
    ruta = RAIZ / "data" / "fuentes" / "comtrade" / "paises.json"
    if not ruta.exists():
        url = "https://comtradeapi.un.org/files/v1/app/reference/partnerAreas.json"
        with urllib.request.urlopen(url, timeout=90) as r:
            ruta.parent.mkdir(parents=True, exist_ok=True)
            ruta.write_bytes(r.read())
    ref = json.loads(ruta.read_text(encoding="utf-8"))["results"]
    return {p["id"]: p["text"] for p in ref}


def resumir(registros, catalogo):
    """Total mundial y reparto por país (toneladas y USD). Solo registros sin desglose adicional."""
    total_t = total_usd = 0.0
    por_pais = defaultdict(lambda: [0.0, 0.0])
    for r in registros:
        if r.get("partner2Code", 0) != 0 or r.get("customsCode", "C00") != "C00" or r.get("motCode", 0) != 0:
            continue
        t = (r.get("netWgt") or 0) / 1000
        usd = r.get("primaryValue") or 0
        if r["partnerCode"] == 0:
            total_t += t; total_usd += usd
        else:
            nombre = catalogo.get(r["partnerCode"], str(r["partnerCode"]))
            por_pais[NOMBRES_PAIS.get(nombre, nombre)][0] += t
            por_pais[NOMBRES_PAIS.get(nombre, nombre)][1] += usd
    return total_t, total_usd, por_pais


def reparto(por_pais, total_t, maximo=5):
    if total_t <= 0:
        return {}
    orden = sorted(por_pais.items(), key=lambda x: -x[1][0])
    salida = {p: round(v[0] / total_t, 4) for p, v in orden[:maximo] if v[0] / total_t >= 0.005}
    resto = round(1 - sum(salida.values()), 4)
    if resto > 0.0005:
        salida["Otros"] = resto
    return salida


def produccion_siap():
    """Producción nacional por producto (t) tomada de data/produccion_siap.js (salida de procesar_siap.py)."""
    texto = (RAIZ / "data" / "produccion_siap.js").read_text(encoding="utf-8")
    i = texto.index("=", texto.index("window.PRODUCCION_SIAP")) + 1
    datos = json.JSONDecoder().raw_decode(texto[i:].lstrip())[0]
    return {k: v["nacional"] for k, v in datos["productos"].items()}


def main(anio):
    catalogo = paises()
    resultado = {}
    for clave, codigos in FRACCIONES.items():
        exp_t, exp_usd, exp_p = resumir(descargar(anio, clave, codigos, "X")["data"], catalogo)
        imp_t, imp_usd, imp_p = resumir(descargar(anio, clave, codigos, "M")["data"], catalogo)
        resultado[clave] = {
            "exportacion": round(exp_t), "importacion": round(imp_t),
            "valorExportUSD": round(exp_usd), "valorImportUSD": round(imp_usd),
            "destinos": reparto(exp_p, exp_t), "origenes": reparto(imp_p, imp_t, 3),
            "fracciones": codigos,
        }
        print(f"  {clave:9s} exp {exp_t:>12,.0f} t  US${exp_usd/1e6:>8,.0f} M   imp {imp_t:>10,.0f} t")

    produccion = produccion_siap()
    for grupo, g in COMPARTIDAS.items():
        exp_t, exp_usd, exp_p = resumir(descargar(anio, grupo, g["codigos"], "X")["data"], catalogo)
        imp_t, imp_usd, imp_p = resumir(descargar(anio, grupo, g["codigos"], "M")["data"], catalogo)
        base = {k: produccion.get(k, 0) for k in g["productos"]}
        total = sum(base.values())
        if not total:
            print(f"  {grupo}: sin producción SIAP para repartir; se omite")
            continue
        for clave, prod in base.items():
            f = prod / total
            resultado[clave] = {
                "exportacion": round(exp_t * f), "importacion": round(imp_t * f),
                "valorExportUSD": round(exp_usd * f), "valorImportUSD": round(imp_usd * f),
                "destinos": reparto(exp_p, exp_t), "origenes": reparto(imp_p, imp_t, 3),
                "fracciones": g["codigos"], "compartida": {"productos": g["productos"], "proporcion": round(f, 4)},
            }
            print(f"  {clave:9s} exp {exp_t * f:>12,.0f} t  US${exp_usd * f / 1e6:>8,.0f} M   imp {imp_t * f:>10,.0f} t"
                  f"  ({f:.1%} de {grupo})")

    salida = RAIZ / "data" / "comercio_oficial.js"
    salida.write_text(
        f"// Generado por scripts/procesar_comercio.py — UN Comtrade, reporte de México (INEGI/SE), año {anio}\n"
        f"window.COMERCIO_OFICIAL = {json.dumps({'anio': anio, 'productos': resultado}, ensure_ascii=False, indent=1)};\n"
        "Object.entries(window.COMERCIO_OFICIAL.productos).forEach(([k, v]) => {\n"
        "  const p = window.PRODUCTOS[k]; if (!p) return;\n"
        "  Object.assign(p, v, { fuenteComercio: 'Comtrade/INEGI ' + window.COMERCIO_OFICIAL.anio });\n"
        "  p.origenImport = Object.keys(v.origenes).filter(o => o !== 'Otros').join(', ') || p.origenImport;\n"
        "});\n",
        encoding="utf-8",
    )
    print(f"Listo: {salida.relative_to(RAIZ)}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])

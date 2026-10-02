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
    # Granos y leguminosas (sin semilla para siembra). El maíz 100590 junta blanco y amarillo: se separa después con
    # las balanzas del SIAP (ver separar_maiz). El arroz se convierte a equivalente palay (ver FACTOR).
    "maiz":       ["100590"],
    "frijol":     ["071333", "071339"],          # frijol común (Phaseolus vulgaris) y los demás frijoles
    "trigo":      ["100119", "100199"],          # trigo duro (cristalino) y los demás (panificable)
    "sorgo":      ["100790"],
    "arroz":      ["100610", "100620", "100630", "100640"],
    "soya":       ["120190"],
    "cebada":     ["100390"],
    "garbanzo":   ["071320"],
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


# Toneladas a equivalente del producto del SIAP: el arroz se produce palay (con cáscara) y se comercia descascarillado,
# blanco o quebrado (rendimiento de molino ≈ 80% a integral y 65% a blanco)
FACTOR = {"100620": 1 / 0.8, "100630": 1 / 0.72, "100640": 1 / 0.72}
ARROZ_PALAY = 1 / 0.72   # la balanza del SIAP está en arroz pulido: 185.9 mil t ÷ 0.72 ≈ 257 mil t de palay del cierre

# Granos: lo que México reporta a Comtrade queda muy por debajo de lo que registran el SIAP, FAOSTAT y los exportadores
# (2024: maíz 7.8 Mt contra 23.9 Mt; soya 3.2 contra 6.6 Mt). Se usa la balanza disponibilidad-consumo del SIAP donde
# existe (maíz por color, frijol, arroz, trigo) y FAOSTAT para los demás; países de la matriz de comercio de FAOSTAT.
GRANOS_BALANZA = {"maiz_blanco": ["maiz_blanco"], "maiz_amarillo": ["maiz_amarillo"], "frijol": ["frijol"], "arroz": ["arroz"],
                  "trigo": ["trigo_panificable", "trigo_cristalino"]}
GRANOS_FAO = {"maiz_blanco": "maiz", "maiz_amarillo": "maiz", "frijol": "frijol", "trigo": "trigo", "sorgo": "sorgo",
              "arroz": "arroz", "soya": "soya", "cebada": "cebada", "garbanzo": "garbanzo"}
PAISES_ES = {"United States": "Estados Unidos", "Canada": "Canadá", "Brasil": "Brasil", "Argentina": "Argentina", "France": "Francia",
             "Australia": "Australia", "Thailand": "Tailandia", "Perú": "Perú", "Cuba": "Cuba", "Venezuela": "Venezuela",
             "Guatemala": "Guatemala", "Turkey": "Turquía", "Spain": "España", "El Salvador": "El Salvador", "Honduras": "Honduras",
             "Italy": "Italia", "Algeria": "Argelia", "Germany": "Alemania", "Russia": "Rusia", "Ukraine": "Ucrania",
             "South Africa": "Sudáfrica", "Paraguay": "Paraguay", "Uruguay": "Uruguay", "Pakistan": "Pakistán", "India": "India",
             "Vietnam": "Vietnam", "China": "China", "Japan": "Japón", "Netherlands": "Países Bajos", "United Kingdom": "Reino Unido",
             "Belice": "Belice", "Nicaragua": "Nicaragua", "Costa Rica": "Costa Rica", "Panamá": "Panamá", "Colombia": "Colombia"}


def leer_js(nombre):
    ruta = RAIZ / "data" / nombre
    if not ruta.exists():
        return {}
    t = ruta.read_text(encoding="utf-8")
    return json.JSONDecoder().raw_decode(t[t.index("{", t.index("=")):])[0]


ANIO_PANEL = None   # año de Comtrade del panel (lo fija main)


def granos_oficial(resultado):
    """Reemplaza el comercio de Comtrade de los granos (ver arriba). Conserva lo de Comtrade en "comtradeMexico"."""
    B = leer_js("balanzas_siap.js").get("productos", {})
    G, GC = leer_js("global.js"), leer_js("global_comercio.js")
    nombres = {m: p["nombre"] for m, p in G.get("paises", {}).items()}
    anio_fao = G.get("anio")

    def reparto_fao(clave_fao, flujo, maximo=5):
        rutas = GC.get("productos", {}).get(clave_fao, [])
        filas = [(r[1] if flujo == "X" else r[0], r[2]) for r in rutas if (r[0] if flujo == "X" else r[1]) == "484"]
        tot = sum(t for _, t in filas)
        if not tot:
            return {}
        orden = sorted(filas, key=lambda x: -x[1])
        salida = {PAISES_ES.get(nombres.get(m, m), nombres.get(m, m)): round(t / tot, 4) for m, t in orden[:maximo] if t / tot >= 0.005}
        resto = round(1 - sum(salida.values()), 4)
        if resto > 0.0005:
            salida["Otros"] = resto
        return salida

    for k, kf in GRANOS_FAO.items():
        fao = G.get("productos", {}).get(kf, {}).get("datos", {}).get("484")
        previo = resultado.get(k, {})
        exp_t = imp_t = None
        fuente = None
        if k in GRANOS_BALANZA:
            partes = []
            for b in GRANOS_BALANZA[k]:
                ciclos = B.get(b, {})
                if not ciclos:
                    break
                completos = sorted(ciclos)                 # el ciclo anterior está cerrado; si solo hay uno, se usa ese
                c = completos[0] if len(completos) > 1 else completos[-1]
                partes.append((c, ciclos[c]))
            if partes and len(partes) == len(GRANOS_BALANZA[k]):
                f = ARROZ_PALAY if k == "arroz" else 1
                exp_t = sum(r["demanda"].get("exportaciones", 0) for _, r in partes) * 1000 * f
                imp_t = sum(r["oferta"].get("importaciones", 0) for _, r in partes) * 1000 * f
                fuente = f"SIAP, balanza disponibilidad-consumo {partes[0][0]}"
        if exp_t is None:
            # Sin balanza: el mayor entre lo que reporta México (Comtrade, año del panel) y lo que reportan sus socios en la
            # matriz de FAOSTAT (espejo). Sorgo 2025: México reporta 583 mil t (sequía) y el espejo 2024, 44 mil t;
            # cebada: México reporta 30 mil t y Francia y Australia, 445 mil t.
            rutas = GC.get("productos", {}).get(kf, [])
            esp_imp = sum(r[2] for r in rutas if r[1] == "484")
            esp_exp = sum(r[2] for r in rutas if r[0] == "484")
            ct_imp, ct_exp = previo.get("importacion", 0) or 0, previo.get("exportacion", 0) or 0
            usar_ct_imp, usar_ct_exp = ct_imp >= esp_imp, ct_exp >= esp_exp
            imp_t = ct_imp if usar_ct_imp else esp_imp
            exp_t = ct_exp if usar_ct_exp else esp_exp
            fuente = ("Comtrade/INEGI" if usar_ct_imp else f"FAOSTAT {anio_fao} (lo que reportan los países exportadores)")
            if usar_ct_imp != usar_ct_exp:
                fuente = (f"importación: {'Comtrade/INEGI' if usar_ct_imp else f'FAOSTAT {anio_fao} (espejo)'}; "
                          f"exportación: {'Comtrade/INEGI' if usar_ct_exp else f'FAOSTAT {anio_fao} (espejo)'}")
            if usar_ct_imp or usar_ct_exp:
                fuente = fuente.replace("Comtrade/INEGI", f"Comtrade/INEGI {ANIO_PANEL}")
            if not fao:
                fao = [0, 0, esp_exp, esp_imp, sum(r[3] for r in rutas if r[0] == "484"), sum(r[3] for r in rutas if r[1] == "484")]
        # dólares: valor unitario de FAOSTAT por la tonelada oficial (en maíz, el mismo valor unitario para los dos colores)
        # valor unitario de Comtrade si México registró el flujo (sus fracciones no incluyen semilla para siembra; en
        # FAOSTAT el maíz sí: US$1.3/kg de exportación); si no, el de FAOSTAT
        pu = lambda v, t, fv, ft: v / t if v and t else (fv * 1000 / ft if ft else 0)
        pu_exp = pu(previo.get("valorExportUSD"), previo.get("exportacion"), fao[4] if fao else 0, fao[2] if fao else 0)
        pu_imp = pu(previo.get("valorImportUSD"), previo.get("importacion"), fao[5] if fao else 0, fao[3] if fao else 0)
        resultado[k] = {
            "exportacion": round(exp_t), "importacion": round(imp_t),
            "valorExportUSD": round(exp_t * pu_exp), "valorImportUSD": round(imp_t * pu_imp),
            "destinos": reparto_fao(kf, "X"), "origenes": reparto_fao(kf, "M", 3),
            "fracciones": previo.get("fracciones", []), "fuenteComercio": fuente,
            "paisesFuente": f"FAOSTAT {anio_fao}, matriz de comercio",
            "comtradeMexico": {"exportacion": previo.get("exportacion"), "importacion": previo.get("importacion")},
        }
        print(f"  {k:13s} exp {exp_t:>12,.0f} t   imp {imp_t:>12,.0f} t   ({fuente}; Comtrade México: {previo.get('importacion', 0):,} t importadas)")


def resumir(registros, catalogo):
    """Total mundial y reparto por país (toneladas y USD). Solo registros sin desglose adicional."""
    total_t = total_usd = 0.0
    por_pais = defaultdict(lambda: [0.0, 0.0])
    for r in registros:
        if r.get("partner2Code", 0) != 0 or r.get("customsCode", "C00") != "C00" or r.get("motCode", 0) != 0:
            continue
        t = (r.get("netWgt") or 0) / 1000 * FACTOR.get(str(r.get("cmdCode")), 1)
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


def usda_mexico():
    """Lo que el USDA registra que cruzó de México por producto (data/precios_eua.js → mexico), y su año."""
    ruta = RAIZ / "data" / "precios_eua.js"
    if not ruta.exists():
        return {}, None
    t = ruta.read_text(encoding="utf-8")
    d = json.loads(t[t.index("{"):t.rindex("}") + 1])
    return d.get("mexico", {}), d.get("anio")


USDA_MX, USDA_ANIO = usda_mexico()


def separar_maiz(resultado):
    """La fracción 100590 junta maíz blanco y amarillo. Las balanzas disponibilidad-consumo del SIAP (data/balanzas_siap.js,
    scripts/procesar_balanzas_siap.py) sí separan la importación y la exportación por color: se reparte el volumen y el
    valor de Comtrade con su proporción del ciclo comercial anterior completo; destinos y orígenes quedan iguales."""
    m = resultado.pop("maiz", None)
    if not m:
        return
    ruta = RAIZ / "data" / "balanzas_siap.js"
    t = ruta.read_text(encoding="utf-8") if ruta.exists() else ""
    B = json.loads(t[t.index("{"):t.rindex("}") + 1])["productos"] if t else {}

    def flujo(clave, concepto):
        ciclos = B.get(clave, {})
        c = sorted(ciclos)[0] if ciclos else None   # ciclo anterior (completo)
        return (ciclos[c]["oferta"] | ciclos[c]["demanda"]).get(concepto, 0) if c else 0
    bi, ai = flujo("maiz_blanco", "importaciones"), flujo("maiz_amarillo", "importaciones")
    be, ae = flujo("maiz_blanco", "exportaciones"), flujo("maiz_amarillo", "exportaciones")
    pi = bi / (bi + ai) if bi + ai else 0.03
    pe = be / (be + ae) if be + ae else 0.97
    for clave, fi, fe in (("maiz_blanco", pi, pe), ("maiz_amarillo", 1 - pi, 1 - pe)):
        resultado[clave] = {**m, "exportacion": round(m["exportacion"] * fe), "importacion": round(m["importacion"] * fi),
                            "valorExportUSD": round(m["valorExportUSD"] * fe), "valorImportUSD": round(m["valorImportUSD"] * fi),
                            "compartida": {"productos": ["maiz_blanco", "maiz_amarillo"], "proporcion": round(fi, 4),
                                           "fuente": "balanzas disponibilidad-consumo del SIAP"}}
        print(f"  {clave:13s} exp {m['exportacion'] * fe:>12,.0f} t   imp {m['importacion'] * fi:>12,.0f} t  ({fi:.1%} de la importación de 100590)")


def main(anio):
    global ANIO_PANEL
    ANIO_PANEL = anio
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
        # Reparto con lo que el USDA registra que cruzó de México de cada producto (reporte 1662, data/precios_eua.js):
        # con la producción SIAP salía al revés (frambuesa 37.6%, cuando el USDA registra 111 mil t de frambuesa y
        # 69 mil t de zarzamora en 2025). Si no hay registro del USDA, se usa la producción.
        usda = {k: (USDA_MX.get(k) or {}).get("total", 0) for k in g["productos"]}
        base = usda if all(usda.values()) else {k: produccion.get(k, 0) for k in g["productos"]}
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

    # Tomate verde (tomatillo): sin fracción propia (va en 070999); su exportación se estima con lo que el USDA registra
    # que cruzó de México. Sin valor en dólares ni importación.
    for clave in ("tomate_verde",):
        v = (USDA_MX.get(clave) or {}).get("total")
        if clave not in resultado and v:
            resultado[clave] = {"exportacion": round(v), "importacion": 0, "destinos": {"Estados Unidos": 1.0}, "origenes": {},
                                "fracciones": [], "fuenteComercio": f"USDA {USDA_ANIO} (cruces registrados; sin fracción arancelaria propia)"}
            print(f"  {clave:9s} exp {v:>12,.0f} t  (estimado con los cruces del USDA)")

    separar_maiz(resultado)
    granos_oficial(resultado)

    salida = RAIZ / "data" / "comercio_oficial.js"
    salida.write_text(
        f"// Generado por scripts/procesar_comercio.py — UN Comtrade, reporte de México (INEGI/SE), año {anio}\n"
        f"window.COMERCIO_OFICIAL = {json.dumps({'anio': anio, 'productos': resultado}, ensure_ascii=False, indent=1)};\n"
        "Object.entries(window.COMERCIO_OFICIAL.productos).forEach(([k, v]) => {\n"
        "  const p = window.PRODUCTOS[k]; if (!p) return;\n"
        "  Object.assign(p, v, { fuenteComercio: v.fuenteComercio ?? 'Comtrade/INEGI ' + window.COMERCIO_OFICIAL.anio });\n"
        "  p.origenImport = Object.keys(v.origenes).filter(o => o !== 'Otros').join(', ') || p.origenImport;\n"
        "});\n",
        encoding="utf-8",
    )
    print(f"Listo: {salida.relative_to(RAIZ)}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])

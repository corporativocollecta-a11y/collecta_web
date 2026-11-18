"""
Precio en origen del producto de EE. UU. (FOB en punto de embarque, USDA AMS Market News): la competencia directa del
producto mexicano, al mismo nivel que el precio en la frontera. Diario, por producto, variedad y región productora
(Salinas, Valle Imperial, Florida, Georgia, Michigan…), con el volumen embarcado (reporte 1662) y la demanda que
califica el reportero. Base del gráfico "Precio en origen de EE. UU." (js/graficos.js, mismo diseño que la frontera).

Fuentes: puntos de embarque de Phoenix (2402, 2403), Fresno (2390, 2391), Benton Harbor, Columbia, Idaho Falls,
Inwood, Miami, Orlando, Raleigh, Thomasville y Yakima (scripts/descargar_historia_ams.py, EMBARQUE_EUA).

Método (el mismo de scripts/procesar_frontera_diaria.py): sin orgánicos; un empaque de referencia por producto
(el más cotizado con peso conocido si tiene al menos la mitad de cotizaciones que el más cotizado); precio del día =
mediana de las cotizaciones del día de todas las regiones; banda = bajo–alto. Solo distritos de EE. UU.: se excluyen
los cruces de México y Canadá y los puertos de importación. Por región (selector): cada distrito con al menos 20 días.
Volumen: embarques semanales del 1662 de los distritos de EE. UU. de esa mercancía (por región, el de ese distrito).
Salida: un archivo por producto data/origen_eua_<producto>.js y el índice data/origen_eua_indice.js.

Uso:
  python scripts/procesar_origen_eua_diario.py [año=año actual]
"""
import datetime
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from descargar_ams import VOLUMEN  # noqa: E402
from descargar_historia_ams import EMBARQUE_EUA  # noqa: E402
from procesar_ams import CWT_T, PRODUCTOS, kg_empaque, leer, precio  # noqa: E402
from procesar_frontera_diaria import (EXTRA, MIN_COTIZACIONES, MIN_DIAS_NUEVO, NOMBRES, VARIANTES, VOL_ALIAS,  # noqa: E402
                                      empaque_referencia, nivel_demanda, num, semanas_del_anio, serie)
from procesar_mayoreo_eua_diario import NOMBRES as NOMBRES_EUA  # noqa: E402

NOMBRES = {**NOMBRES, **NOMBRES_EUA, "Cauliflower": "coliflor"}

RAIZ = Path(__file__).resolve().parent.parent
REPORTES = (2402, 2403, 2390, 2391, *EMBARQUE_EUA)
ESTADOS_ES = {"CALIFORNIA": "California", "ARIZONA": "Arizona", "FLORIDA": "Florida", "GEORGIA": "Georgia",
              "WASHINGTON": "Washington", "OREGON": "Oregón", "IDAHO": "Idaho", "MICHIGAN": "Míchigan",
              "NEW YORK": "Nueva York", "TEXAS": "Texas", "WISCONSIN": "Wisconsin", "MINNESOTA": "Minnesota",
              "COLORADO": "Colorado", "SOUTH CAROLINA": "Carolina del Sur", "NORTH CAROLINA": "Carolina del Norte",
              "NORTH DAKOTA": "Dakota del Norte", "VIRGINIA": "Virginia", "TENNESSEE": "Tennessee", "NEW MEXICO": "Nuevo México"}


# Nombre en español de cada distrito de embarque (clave: el distrito normalizado, ver norma)
REGIONES_ES = {
    "ALABAMA": "Alabama", "APPALACHIAN (MD PA VA WV)": "Apalaches (MD, PA, VA, WV)",
    "ATWATER LIVINGSTON CALIFORNIA": "Atwater-Livingston, California", "BIG LAKE AND CENTRAL MINNESOTA": "Big Lake y centro de Minnesota",
    "CENTRAL AND NORTH FLORIDA": "Centro y norte de Florida", "CENTRAL AND SOUTH FLORIDA": "Centro y sur de Florida",
    "CENTRAL AND SOUTHERN CALIFORNIA AND ARIZONA": "Centro y sur de California y Arizona",
    "CENTRAL AND SOUTHERN SAN JOAQUIN VALLEY CALIFORNIA": "Centro y sur del Valle de San Joaquín, California",
    "CENTRAL AND WESTERN ARIZONA": "Centro y oeste de Arizona", "CENTRAL COAST CALIFORNIA": "Costa central de California",
    "CENTRAL CALIFORNIA": "Centro de California", "CENTRAL FLORIDA": "Centro de Florida",
    "CENTRAL SAN JOAQUIN VALLEY CALIFORNIA": "Centro del Valle de San Joaquín, California", "CENTRAL WISCONSIN": "Centro de Wisconsin",
    "COACHELLA VALLEY CALIFORNIA": "Valle de Coachella, California",
    "COLUMBIA BASIN WASHINGTON AND UMATILLA BASIN OREGON": "Cuenca del Columbia (Washington) y Umatilla (Oregón)",
    "DELAWARE MARYLAND AND EASTERN SHORE VIRGINIA": "Delaware, Maryland y costa este de Virginia",
    "EASTERN NORTH CAROLINA": "Este de Carolina del Norte",
    "EASTERN TENNESSEE VIRGINIA EASTERN SHORE": "Este de Tennessee y costa este de Virginia", "FLORIDA": "Florida",
    "FLORIDA WEST AND GEORGIA": "Oeste de Florida y Georgia", "FLORIDA WEST AND SOUTH CAROLINA": "Oeste de Florida y Carolina del Sur",
    "FLORIDA WEST GEORGIA AND SOUTH CAROLINA": "Oeste de Florida, Georgia y Carolina del Sur", "GEORGIA": "Georgia",
    "IDAHO AND MALHEUR COUNTY OREGON": "Idaho y condado de Malheur, Oregón",
    "IMPERIAL AND COACHELLA VALLEYS CALIFORNIA": "Valles Imperial y Coachella, California",
    "IMPERIAL AND COACHELLA VALLEYS CALIFORNIA AND WESTERN ARIZONA": "Valles Imperial y Coachella (California) y oeste de Arizona",
    "IMPERIAL AND PALO VERDE VALLEYS CALIFORNIA AND CENTRAL AND WESTERN ARIZONA": "Valles Imperial y Palo Verde (California) y centro y oeste de Arizona",
    "IMPERIAL VALLEY CALIFORNIA": "Valle Imperial, California",
    "IMPERIAL VALLEY CALIFORNIA AND CENTRAL AND WESTERN ARIZONA": "Valle Imperial (California) y centro y oeste de Arizona",
    "IMPERIAL COACHELLA AND PALO VERDE VALLEYS CALIFORNIA": "Valles Imperial, Coachella y Palo Verde, California",
    "KERN CALIFORNIA": "Kern, California", "LEXINGTON SOUTH CAROLINA": "Lexington, Carolina del Sur", "LOUISIANA": "Luisiana",
    "LOWER RIO GRANDE VALLEY TEXAS": "Valle bajo del Río Bravo, Texas", "MICHIGAN": "Míchigan",
    "MINNESOTA-NORTH DAKOTA (RED RIVER VALLEY)": "Minnesota y Dakota del Norte (Valle del Río Rojo)", "MISSISSIPPI": "Misisipi",
    "NEW YORK": "Nueva York", "NORTH CAROLINA": "Carolina del Norte", "NORTH CENTRAL AND SOUTH FLORIDA": "Norte, centro y sur de Florida",
    "NORTHERN CALIFORNIA INCLUDING SAN JOAQUIN VALLEY": "Norte de California y Valle de San Joaquín",
    "OREGON AND WASHINGTON": "Oregón y Washington", "OREGON AND WASHINGTON COAST": "Costa de Oregón y Washington",
    "OXNARD CALIFORNIA": "Oxnard, California", "SALINAS-WATSONVILLE CALIFORNIA": "Salinas-Watsonville, California",
    "SAN ANTONIO-WINTER GARDEN-LAREDO TEXAS": "San Antonio-Winter Garden-Laredo, Texas",
    "SAN JOAQUIN VALLEY AND KERN CALIFORNIA": "Valle de San Joaquín y Kern, California",
    "SAN JOAQUIN VALLEY CALIFORNIA": "Valle de San Joaquín, California", "SAN LUIS VALLEY COLORADO": "Valle de San Luis, Colorado",
    "SANTA MARIA CALIFORNIA": "Santa María, California", "SOUTH AND CENTRAL CALIFORNIA": "Sur y centro de California",
    "SOUTH CAROLINA": "Carolina del Sur", "SOUTH CALIFORNIA": "Sur de California", "SOUTH FLORIDA": "Sur de Florida",
    "SOUTH GEORGIA": "Sur de Georgia", "SOUTH NEW JERSEY": "Sur de Nueva Jersey", "SOUTH TEXAS": "Sur de Texas",
    "SOUTHEAST MISSOURI": "Sureste de Misuri", "SOUTHEASTERN ARKANSAS": "Sureste de Arkansas",
    "SOUTHERN NEW MEXICO": "Sur de Nuevo México", "SOUTHWEST INDIANA AND SOUTHEAST ILLINOIS": "Suroeste de Indiana y sureste de Illinois",
    "TEXAS": "Texas", "UPPER VALLEY TWIN FALLS-BURLEY IDAHO": "Upper Valley y Twin Falls-Burley, Idaho",
    "VIDALIA GEORGIA": "Vidalia, Georgia",
    "WALLA WALLA AND LOWER YAKIMA VALLEY WASHINGTON": "Walla Walla y valle bajo de Yakima, Washington",
    "WALLA WALLA WASHINGTON": "Walla Walla, Washington", "WASHINGTON COAST": "Costa de Washington",
    "WESTERN AND CENTRAL NEW YORK": "Oeste y centro de Nueva York", "WESTERN ARIZONA": "Oeste de Arizona",
    "YAKIMA VALLEY AND WENATCHEE WASHINGTON": "Valle de Yakima y Wenatchee, Washington",
    "COLORADO": "Colorado", "WESTERN SLOPE COLORADO": "Vertiente oeste de Colorado", "UTAH": "Utah", "MISSOURI": "Misuri",
    "NEW ENGLAND": "Nueva Inglaterra", "NORTH GEORGIA AND SOUTH CAROLINA": "Norte de Georgia y Carolina del Sur",
    "HEREFORD-HIGH PLAINS TEXAS": "Hereford-High Plains, Texas", "NORTH AND EAST POINTS COLORADO": "Norte y este de Colorado",
}
# El reporte de embarques (1662) escribe algunos distritos distinto que los de precios
ALIAS_DISTRITO = {"VIDALIA": "VIDALIA GEORGIA", "FLORIDA SOUTH": "SOUTH FLORIDA", "FLORIDA CENTRAL": "CENTRAL FLORIDA",
                  "COLORADO WESTERN SLOPE": "WESTERN SLOPE COLORADO"}


def norma(d):
    """Distrito sin comas, espacios dobles ni la palabra DISTRICT (para cruzar precios y embarques)"""
    u = " ".join((d or "").upper().replace(",", " ").replace(" DISTRICT", " ").split())
    return ALIAS_DISTRITO.get(u, u)


def distrito_eua(d):
    """Distrito productor de EE. UU. normalizado (o None si es cruce, importación o mezcla con México).
    "NEW MEXICO" es un estado de EE. UU.: no cuenta como México."""
    u = norma(d)
    sin_nm = u.replace("NEW MEXICO", "")
    if not u or "MEXICO" in sin_nm or "IMPORT" in u or "CROSSING" in u or "CANADA" in u or u == "UNITED STATES":
        return None
    return u


REGION_EN = {}   # nombre en español -> nombre del distrito en inglés (para la versión en inglés del mapa)


def nombre_region(d):
    if d in REGIONES_ES:
        es = REGIONES_ES[d]
    else:
        es = d.title()
        for en, nom in ESTADOS_ES.items():
            es = es.replace(en.title(), nom)
        es = es.replace(" And ", " y ")
    REGION_EN.setdefault(es, titulo_en(d))
    return es


def titulo_en(d):
    t = d.title().replace(" And ", " and ").replace("(Md Pa Va Wv)", "(MD, PA, VA, WV)")
    for st in sorted(ESTADOS_ES, key=len, reverse=True):   # "Salinas Watsonville California" -> "..., California"
        cola = " " + st.title()
        if t.endswith(cola) and len(t) > len(cola) and not t[:-len(cola)].endswith((" and", " Of"))                 and t[:-len(cola)] not in ("Central", "Southern", "Northern", "Eastern", "Western", "South", "North", "East", "West",
                                           "Southeast", "Southwest", "Northeast", "Northwest", "Upper", "Lower"):
            return t[:-len(cola)] + "," + cola
    return t


def cotizaciones(anio, comm_a_prod):
    filas = defaultdict(list)
    for r in leer(REPORTES, anio):
        k = comm_a_prod.get(r.get("commodity"))
        d = distrito_eua(r.get("district"))
        if not k or not d or r.get("organic") == "Y":
            continue
        p = precio(r)
        if p is None:
            continue
        m, dd, a = r["report_date"].split("/")
        lo, hi = num(r.get("low_price")), num(r.get("high_price"))
        filas[k].append((r["commodity"], r.get("pkg") or r.get("package"), r.get("var") or r.get("variety") or "",
                         nombre_region(d), f"{a}-{m}-{dd}", p, lo or p, hi or p,
                         nivel_demanda(r.get("demand_tone_comments")), False))
    return filas


def volumen_eua(anio):
    total, por_region = defaultdict(lambda: defaultdict(float)), defaultdict(lambda: defaultdict(float))
    for r in leer([VOLUMEN], anio):
        t = num(r.get("shipments_week1"))
        d = distrito_eua(r.get("district"))
        if t is None or not d:
            continue
        m, dd, a = map(int, r["report_date"].split("/"))
        lunes = datetime.date(a, m, dd) - datetime.timedelta(days=7)
        lunes -= datetime.timedelta(days=lunes.weekday())
        total[r["commodity"]][lunes.isoformat()] += t * CWT_T
        por_region[(r["commodity"], nombre_region(d))][lunes.isoformat()] += t * CWT_T
    return total, por_region


def ficha(cotiz, anio, vol, respaldo, filtro=None, nombre=None):
    def elegir(a):
        return [f for f in cotiz[a] if filtro is None or f[0] == filtro]
    for a, minimo in ([(anio, MIN_DIAS_NUEVO), (anio - 1, MIN_COTIZACIONES)] if respaldo else [(anio, MIN_DIAS_NUEVO)]):
        fs = elegir(a)
        clave = empaque_referencia(fs, minimo)
        dias = serie(fs, clave) if clave else []
        if len(dias) >= MIN_DIAS_NUEVO:
            break
    else:
        return None
    comm, pk, var = clave
    kg = kg_empaque(comm, pk)
    total, por_region = vol
    cv = VOL_ALIAS.get(comm, comm)
    regiones = Counter(c for d in dias for c in d[4])
    out = {"anio": a, "mercancia": NOMBRES.get(comm, comm), "empaque": pk, "presentacion": var.lower(),
           "kgEmpaque": round(kg, 2) if kg else None, "cruces": dict(regiones.most_common()),
           "dias": [d[:4] for d in dias], "demanda": [d[5] for d in dias],
           "volSemana": semanas_del_anio(total.get(cv, {}), a),
           "regionesEn": {rg: REGION_EN.get(rg, rg) for rg in regiones}}
    if nombre:
        out["nombre"] = nombre
    cada = {}
    for rg in regiones:
        dc = serie([f for f in fs if f[3] == rg], clave)
        if len(dc) >= MIN_DIAS_NUEVO:
            cada[rg] = {"dias": [d[:4] for d in dc], "demanda": [d[5] for d in dc],
                        "volSemana": semanas_del_anio(por_region.get((cv, rg), {}), a)}
    if len(cada) > 1:
        out["porCruce"] = dict(sorted(cada.items(), key=lambda x: -len(x[1]["dias"])))
    return out


def main(anio=None):
    anio = anio or datetime.date.today().year
    respaldo = datetime.date.today() < datetime.date(anio, 4, 1)
    productos = {**PRODUCTOS, **{k: v for k, v in EXTRA.items() if k not in PRODUCTOS}}
    comm_a_prod = {c: k for k, cs in productos.items() for c in cs}
    comm_a_prod.update({c: k for k, vs in VARIANTES.items() for c, _ in vs})
    cotiz = {a: cotizaciones(a, comm_a_prod) for a in (anio, anio - 1)}
    total, por_region = defaultdict(dict), defaultdict(dict)
    for a in (anio - 1, anio):
        t, pr = volumen_eua(a)
        for c, sem in t.items():
            total[c].update(sem)
        for c, sem in pr.items():
            por_region[c].update(sem)
    vol = (total, por_region)
    hoy = datetime.date.today().isoformat()
    for viejo in (RAIZ / "data").glob("origen_eua_*.js"):
        viejo.unlink()
    escritos = []
    for k in dict.fromkeys([*productos, *VARIANTES]):
        c = {a: cotiz[a].get(k, []) for a in cotiz}
        principal = ficha(c, anio, vol, respaldo)
        if not principal:
            continue
        prod = dict(principal)
        variantes = [v for v in (ficha(c, anio, vol, respaldo, comm, nombre) for comm, nombre in VARIANTES.get(k, [])) if v]
        if len(variantes) > 1:
            prod["variantes"] = variantes
            prod["varOmision"] = next((j for j, v in enumerate(variantes) if v["mercancia"] == principal["mercancia"]
                                       and v["empaque"] == principal["empaque"]), 0)
        destino = RAIZ / "data" / f"origen_eua_{k}.js"
        destino.write_text(
            f"// Generado por scripts/procesar_origen_eua_diario.py · USDA AMS, precio en origen de EE. UU. {anio}\n"
            "window.ORIGEN_EUA = window.ORIGEN_EUA || { productos: {} };\n"
            f"Object.assign(window.ORIGEN_EUA, {{\"anio\":{anio},\"generado\":\"{hoy}\"}});\n"
            f"window.ORIGEN_EUA.productos[{json.dumps(k)}] = {json.dumps(prod, ensure_ascii=False, separators=(',', ':'))};\n",
            encoding="utf-8")
        escritos.append(destino)
        for v in variantes or [prod]:
            print(f"  {k:12s} {(v.get('nombre') or '')[:14]:14s} {v['mercancia'][:18]:18s} {str(v['empaque'])[:24]:24s} "
                  f"{len(v['dias']):3d} días {v['anio']} · regiones {len(v.get('porCruce', {})):2d} · vol {len(v['volSemana']):2d} sem · "
                  f"principal: {next(iter(v['cruces']))[:30]} · último ${v['dias'][-1][1]:.2f}")
    claves = [f.stem.replace("origen_eua_", "") for f in escritos]
    (RAIZ / "data" / "origen_eua_indice.js").write_text(
        "// Generado por scripts/procesar_origen_eua_diario.py · productos con precio en origen de EE. UU.\n"
        f"window.ORIGEN_EUA_INDICE = {json.dumps({'anio': anio, 'generado': hoy, 'productos': claves}, separators=(',', ':'))};\n",
        encoding="utf-8")
    print(f"-> {len(escritos)} archivos data/origen_eua_*.js ({sum(f.stat().st_size for f in escritos) / 1024:.0f} kB)")


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else None)

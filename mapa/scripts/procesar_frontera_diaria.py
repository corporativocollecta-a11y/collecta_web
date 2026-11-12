"""
Precio diario en la frontera del producto mexicano durante el año (USDA AMS Market News, punto de embarque de Phoenix, reportes
2402 frutas y 2403 hortalizas): una cotización por día hábil, por cruce (Nogales, McAllen, Otay Mesa).
Base de los gráficos de precio a lo largo del año (js/graficos.js). Escribe data/frontera_diaria.js →
window.FRONTERA_DIARIA.

Método (el mismo de scripts/procesar_ams.py):
  - Solo distritos "Mexico crossings…", sin orgánicos.
  - Un solo empaque y presentación por producto: el más cotizado del año cuyo peso se conoce, para que la serie no
    brinque cuando cambia la caja.
  - Precio de cada cotización = punto medio del rango "mostly" (o del rango bajo–alto si no hay). Precio del día =
    mediana de las cotizaciones del día (todos los tamaños y cruces); mínimo y máximo = extremos del rango bajo–alto.
  - Demanda del día: la calificación que da el reportero del USDA a cada cotización ("demand tone"), convertida a una
    escala de 1 a 5 (very light 1 · light 1.5 · fairly light 2 · moderate 3 · fairly good 4 · good 4.5 · very good 5;
    "supplies exceed demand" 1, "exceeds supply" 5). Si la calificación distingue tamaños o variedades
    ("110-150s moderate, others fairly light"), se promedian los niveles que menciona; luego, las cotizaciones del día.
  - Volumen semanal: toneladas de la misma mercancía que cruzaron de México (reporte 1662, National Shipping Point
    Trends, suma de los distritos "Mexico crossings…"). Cada reporte del lunes trae como semana 1 la semana anterior:
    se guarda con el lunes de esa semana.
  - Cambio de año: cada producto muestra el año en curso en cuanto tiene al menos MIN_DIAS_NUEVO días hábiles con
    cotización; antes, y solo hasta el 31 de marzo, muestra el año anterior completo, con su año en "anio" del
    producto. Después de marzo, un producto sin días suficientes en el año en curso no se muestra (no se enseñan datos
    de hace un año como si fueran recientes). Nunca se mezclan dos años en un mismo producto.

Uso:
  python scripts/procesar_frontera_diaria.py [año=año actual]
"""
import datetime
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from statistics import median

sys.path.insert(0, str(Path(__file__).resolve().parent))
from descargar_ams import FRONTERA  # noqa: E402
from descargar_ams import VOLUMEN  # noqa: E402
from procesar_ams import CWT_T, NOMBRE_MERCANCIA, PRODUCTOS, kg_empaque, leer, precio  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
MIN_COTIZACIONES = 50   # para elegir el empaque de referencia en un año completo
MIN_DIAS_NUEVO = 20     # días hábiles con cotización para empezar a mostrar el año en curso (≈ un mes)


# Variedades que el USDA cotiza por separado: el gráfico deja elegirlas. La de omisión es la de la referencia del
# producto. El volumen solo existe si el reporte 1662 trae esa mercancía.
VARIANTES = {
    "chile": [("Peppers, Bell Type", "Pimiento morrón"), ("Peppers, Jalapeno", "Jalapeño"), ("Peppers, Serrano", "Serrano"),
              ("Peppers, Poblano", "Poblano"), ("Peppers, Habanero", "Habanero"), ("Peppers, Anaheim", "Anaheim")],
    "jitomate": [("Tomatoes, Plum Type", "Saladette"), ("Tomatoes", "Bola"), ("Tomatoes, Grape Type", "Uva")],
    "calabacita": [("Squash, Zucchini", "Italiana (zucchini)"), ("Squash, Grey", "Gris"), ("Squash, Yellow Straightneck", "Amarilla")],
    "calabaza": [("Squash, Kabocha", "Kabocha"), ("Squash, Butternut", "Butternut"), ("Squash, Spaghetti", "Spaghetti"),
                 ("Squash, Acorn", "Bellota (acorn)")],
    "limon": [("Limes", "Persa"), ("Lemons", "Amarillo")],
}


def empaque_referencia(fs, minimo):
    """(mercancía, empaque, presentación) de referencia con al menos `minimo` cotizaciones: la más cotizada con peso
    conocido (para poder dar US$/kg) si tiene al menos la mitad de cotizaciones que la más cotizada; si no, la más
    cotizada aunque su caja no traiga peso (el gráfico la muestra solo en US$ por caja)."""
    cuenta = Counter({c: n for c, n in Counter(f[:3] for f in fs).items() if n >= minimo})
    if not cuenta:
        return None
    top, n_top = cuenta.most_common(1)[0]
    con_peso = [(c, n) for c, n in cuenta.most_common() if kg_empaque(c[0], c[1])]
    return con_peso[0][0] if con_peso and con_peso[0][1] >= n_top / 2 else top


def cruce_de(distrito):
    """Cruce del producto mexicano. Solo distritos que son exclusivamente cruces de México ("Mexico crossings through…"):
    los que empiezan con un distrito de EE. UU. ("South and Central California and Mexico crossings…", "Imperial,
    Coachella… Mexico crossings through Calexico") mezclan producción estadounidense con la mexicana."""
    d = (distrito or "").lower()
    if not d.startswith("mexico crossings"):
        return None
    return ("Otay Mesa" if "otay" in d else "Calexico" if "san luis" in d or "calexico" in d or "southern california" in d
            else "Nogales" if "nogales" in d or "arizona" in d else "McAllen" if "texas" in d else None)


def num(x):
    try:
        v = float(x)
        return v if v > 0 else None
    except (TypeError, ValueError):
        return None


# Demanda que califica el reportero del USDA → escala 1–5 (el orden importa: frases largas antes que sus palabras sueltas)
NIVELES = [("supplies exceed demand", 1), ("exceeds? demand", 1), ("exceeds? supply", 5), ("very light", 1),
           ("fairly light", 2), ("very good", 5), ("fairly good", 4), ("moderate", 3), ("light", 1.5), ("good", 4.5)]
RE_NIVEL = re.compile("|".join(rf"(\b{p}\b)" for p, _ in NIVELES))   # \b: "slightly" no es "light"


def nivel_demanda(texto):
    m = [NIVELES[[i for i, g in enumerate(x.groups()) if g][0]][1] for x in RE_NIVEL.finditer((texto or "").lower())]
    return sum(m) / len(m) if m else None


def cotizaciones(anio, comm_a_prod):
    """producto → [(comm, empaque, presentación, cruce, fecha ISO, precio medio, bajo, alto, demanda 1–5)]"""
    filas = defaultdict(list)
    for r in leer(FRONTERA, anio):
        k = comm_a_prod.get(r["commodity"])
        cruce = cruce_de(r.get("district"))
        if not k or not cruce or r.get("organic") == "Y":
            continue
        p = precio(r)
        if p is None:
            continue
        m, d, a = r["report_date"].split("/")
        lo, hi = num(r.get("low_price")), num(r.get("high_price"))
        filas[k].append((r["commodity"], r.get("pkg") or r.get("package"), r.get("var") or r.get("variety") or "",
                         cruce, f"{a}-{m}-{d}", p, lo or p, hi or p, nivel_demanda(r.get("demand_tone_comments"))))
    return filas


def volumen_semanal(anio):
    """mercancía → {lunes ISO de la semana: toneladas que cruzaron de México}"""
    vol = defaultdict(lambda: defaultdict(float))
    for r in leer([VOLUMEN], anio):
        t = num(r.get("shipments_week1"))
        if t is None or not (r.get("district") or "").upper().startswith("MEXICO CROSSINGS"):
            continue
        m, d, a = map(int, r["report_date"].split("/"))
        lunes = datetime.date(a, m, d) - datetime.timedelta(days=7)
        lunes -= datetime.timedelta(days=lunes.weekday())
        vol[r["commodity"]][lunes.isoformat()] += t * CWT_T
    return vol


def serie(filas, clave):
    por_dia = defaultdict(list)
    for f in filas:
        if f[:3] == clave:
            por_dia[f[4]].append(f)
    dias = []
    for fecha in sorted(por_dia):
        fs = por_dia[fecha]
        dem = [f[8] for f in fs if f[8] is not None]
        dias.append([fecha[5:], round(median(f[5] for f in fs), 2), round(min(f[6] for f in fs), 2),
                     round(max(f[7] for f in fs), 2), sorted({f[3] for f in fs}),
                     round(sum(dem) / len(dem), 2) if dem else None])
    return dias


def ficha(cotiz, anio, vol, respaldo, filtro=None):
    """Serie de un producto (o de una variedad, con `filtro` = mercancía): año en curso si ya tiene suficientes días;
    si no, y solo en enero–marzo, el año anterior completo."""
    def elegir(a):
        return [f for f in cotiz[a] if filtro is None or f[0] == filtro]
    a, fs = anio, elegir(anio)
    clave = empaque_referencia(fs, MIN_DIAS_NUEVO)
    dias = serie(fs, clave) if clave else []
    if len(dias) < MIN_DIAS_NUEVO:
        if not respaldo:
            return None
        a, fs = anio - 1, elegir(anio - 1)
        clave = empaque_referencia(fs, MIN_COTIZACIONES)
        if not clave:
            return None
        dias = serie(fs, clave)
    comm, pk, var = clave
    kg = kg_empaque(comm, pk)
    cruces = Counter(c for d in dias for c in d[4])   # cruce → días con cotización (para decir por dónde cruza)
    return {
        "anio": a,   # año que muestra (el anterior mientras el año en curso tenga pocos días)
        "mercancia": NOMBRE_MERCANCIA.get(comm, comm), "empaque": pk, "presentacion": var.lower(),
        "kgEmpaque": round(kg, 2) if kg else None,   # None: la caja no trae peso, solo US$ por caja
        "cruces": dict(cruces.most_common()),
        # [MM-DD, precio del día, mínimo, máximo]; el cruce solo se guarda si hay más de uno en el año
        "dias": [d[:4] + ([d[4]] if len(cruces) > 1 else []) for d in dias],
        # demanda de cada día (1 baja – 5 muy buena), alineada con "dias"; null si el USDA no la calificó
        "demanda": [d[5] for d in dias],
        # lunes de la semana → toneladas que cruzaron de México (misma mercancía); vacío si el 1662 no la trae
        "volSemana": {s: round(t) for s, t in sorted(vol.get(comm, {}).items())
                      if t > 0 and f"{a - 1}-12-25" <= s <= f"{a}-12-31"},   # semanas del año mostrado (y la que lo abre)
        "_comm": comm,
    }


def main(anio=None):
    anio = anio or datetime.date.today().year
    comm_a_prod = {c: k for k, cs in PRODUCTOS.items() for c in cs}
    comm_a_prod.update({c: k for k, vs in VARIANTES.items() for c, _ in vs})
    cotiz = {a: cotizaciones(a, comm_a_prod) for a in (anio, anio - 1)}
    # Volumen de los dos años juntos: la última semana de diciembre llega en el reporte de enero del año siguiente
    vol = defaultdict(dict)
    for a in (anio - 1, anio):
        for comm, semanas in volumen_semanal(a).items():
            vol[comm].update(semanas)
    salida = {"generado": datetime.date.today().isoformat(), "anio": anio, "fuente": "USDA AMS Market News, punto de embarque de Phoenix (2402, 2403)",
              "unidad": "US$ por empaque", "productos": {}}
    ultimo = ""
    respaldo = datetime.date.today() < datetime.date(anio, 4, 1)   # el año anterior solo cubre enero–marzo
    for k in dict.fromkeys([*PRODUCTOS, *VARIANTES]):
        c = {a: cotiz[a].get(k, []) for a in cotiz}
        principal = ficha(c, anio, vol, respaldo)
        if not principal:
            continue
        # Variedades: la de la misma mercancía que la referencia del producto usa exactamente su serie
        variantes = []
        for comm, nombre in VARIANTES.get(k, []):
            v = principal if comm == principal["_comm"] else ficha(c, anio, vol, respaldo, comm)
            if v:
                variantes.append({"nombre": nombre, **{x: y for x, y in v.items() if x != "_comm"}})
        prod = {x: y for x, y in principal.items() if x != "_comm"}
        if len(variantes) > 1:
            prod["variantes"] = variantes
            omision = dict(VARIANTES[k]).get(principal["_comm"])
            prod["varOmision"] = next((j for j, v in enumerate(variantes) if v["nombre"] == omision), 0)
        salida["productos"][k] = prod
        ultimo = max(ultimo, f"{prod['anio']}-{prod['dias'][-1][0]}")
    salida["ultimoDia"] = ultimo
    destino = RAIZ / "data" / "frontera_diaria.js"
    destino.write_text(
        f"// Generado por scripts/procesar_frontera_diaria.py · USDA AMS Market News {anio} (precio diario en la frontera)\n"
        f"window.FRONTERA_DIARIA = {json.dumps(salida, ensure_ascii=False, separators=(',', ':'))};\n", encoding="utf-8")
    for k, p in salida["productos"].items():
        for v in p.get("variantes") or [p]:
            print(f"  {k:12s} {(v.get('nombre') or '')[:18]:18s} {v['mercancia'][:20]:20s} {v['empaque'][:26]:26s} "
                  f"{'kg ' + str(v['kgEmpaque']) if v['kgEmpaque'] else 'sin peso':9s} {len(v['dias']):3d} días {v['anio']} · "
                  f"{len(v['volSemana']):2d} sem. vol · {sum(x is not None for x in v['demanda']):3d} días demanda")
    print(f"-> {destino} ({destino.stat().st_size / 1024:.0f} kB), último día {ultimo}")


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else None)

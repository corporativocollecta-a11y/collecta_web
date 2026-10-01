"""
Vista Países Bajos: producción por provincia con datos de CBS StatLine (Oficina Central de Estadística), año 2025,
y población por provincia al 1 de enero de 2025. Comercio con FAOSTAT mediante el motor común.

Fuentes (API OData de CBS, abierta y sin clave; https://opendata.cbs.nl/ODataApi/odata/<tabla>/TypedDataSet):
  - 85636NED  Akkerbouwgewassen; productie, regio: producción (1 000 kg) por provincia de papa y cebolla → publicada.
  - 37738     Groenteteelt; oogst en teeltoppervlakte per groentesoort: cosecha nacional (mln kg) de cada hortaliza,
              incluidas las de invernadero (jitomate, pimiento, pepino, berenjena, fresa bajo vidrio).
  - 84499NED  Fruitteelt; oogst en teeltoppervlakte appels en peren: cosecha nacional de manzana y pera.
  - 80780ned  Landbouw; gewassen, dieren en grondgebruik naar regio: superficie por provincia y cultivo
              (áreas en "are" al aire libre y en m² bajo vidrio, censo agrícola anual).
  - 03759ned  Bevolking op 1 januari; regio: población por provincia.
  - FAOSTAT (vía motor común) para berries y cereza, que CBS no publica en toneladas (año 2024).
Descargas brutas guardadas en data/fuentes/nl/cbs_<tabla>.json (se reutilizan si existen).

Método: papa y cebolla son producción publicada por provincia. El resto de hortalizas y frutas solo tiene cosecha
nacional; se reparte entre provincias según la superficie de cada cultivo en la provincia (tabla 80780ned) y se marca
como estimado. Cuando un producto del mapa agrupa varios cultivos (zanahoria = bos-/waspeen + winterpeen;
brócoli = brócoli + coliflor; lechuga = lechuga + endibia/witlof; fresa = bajo vidrio + aire libre), cada cultivo
se reparte con su propia superficie y luego se suman.

Uso:
  python scripts/procesar_cbs.py [año=2025]
Salida: data/sub_nl.js → window.SUBNACIONAL.NL
"""
import json
import sys
import urllib.request
from pathlib import Path

from subnacional_comun import escribir_pais, fao_bruto, produccion_fao, resumen

RAIZ = Path(__file__).resolve().parent.parent
F = RAIZ / "data" / "fuentes" / "nl"
API = "https://opendata.cbs.nl/ODataApi/odata"

PROVINCIAS = {  # código CBS → (ISO 3166-2, nombre en español, lat, lon de la capital)
    "PV20": ("NL-GR", "Groninga", 53.22, 6.57), "PV21": ("NL-FR", "Frisia", 53.20, 5.80),
    "PV22": ("NL-DR", "Drente", 52.99, 6.56), "PV23": ("NL-OV", "Overijssel", 52.51, 6.09),
    "PV24": ("NL-FL", "Flevoland", 52.52, 5.47), "PV25": ("NL-GE", "Güeldres", 51.98, 5.91),
    "PV26": ("NL-UT", "Utrecht", 52.09, 5.12), "PV27": ("NL-NH", "Holanda Septentrional", 52.38, 4.64),
    "PV28": ("NL-ZH", "Holanda Meridional", 52.08, 4.31), "PV29": ("NL-ZE", "Zelanda", 51.50, 3.61),
    "PV30": ("NL-NB", "Brabante Septentrional", 51.69, 5.30), "PV31": ("NL-LI", "Limburgo", 50.85, 5.69),
}

# Descargas (filtros OData) → archivo local
DESCARGAS = {
    "85636NED": "$filter=Perioden ge '2024JJ00'",
    "37738": "$filter=Perioden ge '2023JJ00'",
    "84499NED": "$filter=Perioden ge '2023JJ00'",
    "80780ned": "$filter=Perioden ge '2024JJ00' and (substringof('PV',RegioS) or substringof('NL',RegioS))",
    "03759ned": "$filter=Geslacht eq 'T001038' and Leeftijd eq '10000' and BurgerlijkeStaat eq 'T001019' "
                "and Perioden ge '2025JJ00' and (substringof('PV',RegioS) or substringof('NL',RegioS))",
}

# Producción publicada por provincia (85636NED): clave → códigos de cultivo
ACKER = {
    "papa": ["A042355"],                 # aardappelen totaal (consumo, semilla y fécula)
    "cebolla": ["A042320", "A049495"],   # cebolla de siembra + cebolla de bulbillo (2.º año)
}

# Producción nacional repartida por superficie: clave → [(tabla nacional, código, [columnas de 80780ned])]
# Las columnas "are" son al aire libre; las "m²" (_3xx) son bajo vidrio. Se convierten a hectáreas.
REPARTO = {
    "jitomate": [("37738", "A042291", ["TomatenTotaal_370"])],
    "chile": [("37738", "A042286", ["PaprikaSTotaal_365"])],
    "pepino": [("37738", "A042285", ["Komkommers_364"])],
    "berenjena": [("37738", "A042282", ["Aubergines_360"])],
    "calabacita": [("37738", "A042283", ["Komkommerachtigen_224"])],
    "fresa": [("37738", "A044062", ["AardbeienTotaal_361"]), ("37738", "A042278", ["AardbeienProductie_213"])],
    "lechuga": [("37738", "A042306", ["Sla_232"]), ("37738", "A042305", ["Sla_232"]),
                ("37738", "A042308", ["Witlofwortel_52"])],
    "zanahoria": [("37738", "A042312", ["Bospeen_221", "Waspeen_50"]), ("37738", "A042315", ["Winterpeen_51"])],
    "brocoli": [("37738", "A042331", ["Broccoli_222"]), ("37738", "A042329", ["Bloemkool_220"])],
    "esparrago": [("37738", "A042297", ["AspergesProductie_218"])],
    "manzana": [("84499NED", "A041297", ["Appels_202"])],
    "pera": [("84499NED", "A041309", ["Peren_203"])],
}
# Sin toneladas en CBS: nacional de FAOSTAT 2024 repartido por superficie
REPARTO_FAO = {
    "arandano": ["BlauweBessen_197", "RodeBessenFrambozenBramen_198", "Frambozen_357", "Bramen_356"],
    "cereza": ["ZoeteKers_206"],
    "uva": ["Wijndruiven_210"],
}
EXTRA_FAO = {"cereza": "531"}

NOMBRES = {"brocoli": "Brócoli y coliflor", "arandano": "Berries (arándano, frambuesa, zarzamora y grosella)",
           "lechuga": "Lechuga y endibia (witlof)", "chile": "Pimiento (paprika)"}
NOTAS = {
    "jitomate": "Casi todo de invernadero (Westland, Holanda Meridional).",
    "chile": "Pimiento morrón de invernadero.",
    "pepino": "Pepino de invernadero.",
    "berenjena": "Berenjena de invernadero.",
    "fresa": "Fresa bajo vidrio y túnel más fresa de aire libre.",
    "papa": "Toda la papa: consumo, semilla (pootaardappelen) y fécula (zetmeelaardappelen).",
    "cebolla": "Cebolla de siembra (amarilla y roja) y cebolla de bulbillo de segundo año.",
    "zanahoria": "Zanahoria en manojo, de industria (waspeen) y de invierno.",
    "lechuga": "Lechuga (de cabeza, iceberg y otras) y endibia (witlof), como la partida 372 de la FAO.",
    "calabacita": "Solo calabacín (CBS no separa la calabaza, que la FAO sí incluye en la partida 394); repartido con la superficie de cucurbitáceas al aire libre.",
    "arandano": "Toneladas nacionales de FAOSTAT 2024 (CBS no las publica), repartidas con la superficie de berries.",
    "uva": "Uva para vino; toneladas nacionales de FAOSTAT 2024 repartidas con la superficie de viñedo.",
    "cereza": "Cereza dulce; toneladas nacionales de FAOSTAT 2024 repartidas con la superficie de cerezo.",
}


def cbs(tabla):
    archivo = F / f"cbs_{tabla}.json"
    if not archivo.exists():
        F.mkdir(parents=True, exist_ok=True)
        url = f"{API}/{tabla}/TypedDataSet?$format=json&" + DESCARGAS[tabla].replace(" ", "%20")
        with urllib.request.urlopen(url, timeout=120) as r:
            archivo.write_bytes(r.read())
    return json.loads(archivo.read_text(encoding="utf-8"))["value"]


def main(anio=2025):
    per = f"{anio}JJ00"
    # Población al 1 de enero
    pob = {r["RegioS"].strip(): r["BevolkingOp1Januari_1"] for r in cbs("03759ned") if r["Perioden"] == per}
    # Superficies por provincia (ha)
    sup = {r["RegioS"].strip(): r for r in cbs("80780ned") if r["Perioden"] == per}

    def ha(region, col):
        v = sup.get(region, {}).get(col) or 0
        return v / 10000 if int(col.rsplit("_", 1)[1]) in range(326, 426) else v / 100   # m² o are → ha

    # Cosechas nacionales (mln kg → t)
    nac = {}
    for r in cbs("37738"):
        if r["Perioden"] == per:
            nac[("37738", r["Groenten"].strip())] = ((r["Oogst_1"] or 0) * 1000, r["Teeltoppervlakte_2"] or 0)
    for r in cbs("84499NED"):
        if r["Perioden"] == per:
            nac[("84499NED", r["Fruitgewassen"].strip())] = ((r["Oogst_1"] or 0) * 1000, r["Teeltoppervlakte_2"] or 0)

    extra = fao_bruto("528", EXTRA_FAO)
    datos = {
        "codigo": "NL", "m49": "528", "pais": "Países Bajos", "nivel": "provincia", "nivelPlural": "provincias",
        "femenino": True, "anio": anio, "anioPoblacion": anio,
        "fuente": f"CBS StatLine {anio} (producción y superficie por provincia), CBS población 1-ene-{anio}, FAOSTAT",
        "fuenteCorta": f"CBS {anio}",
        "metodo": "Papa y cebolla: producción publicada por provincia (CBS 85636NED). Las demás hortalizas (incluidas "
                  "las de invernadero) y la manzana y la pera: cosecha nacional de CBS repartida entre provincias según "
                  "la superficie de cada cultivo en el censo agrícola (CBS 80780ned), marcada como estimada. Berries, "
                  "cereza y uva: toneladas de FAOSTAT 2024 repartidas igual. Población de CBS.",
        "limites": [[50.75, 3.36], [53.56, 7.23]],
        "regiones": {c: {"nombre": n, "lat": la, "lon": lo, "pob": pob.get(c)} for c, (_, n, la, lo) in PROVINCIAS.items()},
        "productos": {},
    }

    def agregar(clave, nacional, hect, reg, fuente, anio_prod, estimado):
        if nacional <= 0:
            print(f"  (sin datos: {clave})")
            return
        suma = sum(reg.values())
        if abs(suma - nacional) > max(10, nacional * 0.01):
            print(f"  aviso {clave}: provincias {suma:,.0f} vs Países Bajos {nacional:,.0f}")
        datos["productos"][clave] = {
            **({"nombre": NOMBRES[clave]} if clave in NOMBRES else {}),
            **({"nota": NOTAS[clave]} if clave in NOTAS else {}),
            "fuenteProduccion": fuente, "anioProduccion": anio_prod,
            "nacional": round(nacional), "ha": round(hect),
            "regiones": {c: [round(t), 1 if estimado else 0] for c, t in reg.items() if round(t) > 0},
            **({"comercio": extra[clave]["comercio"]} if clave in extra and extra[clave]["comercio"] else {}),
        }

    # 1) Producción publicada por provincia
    acker = [r for r in cbs("85636NED") if r["Perioden"] == per]
    for clave, codigos in ACKER.items():
        reg, nacional, hect = {}, 0.0, 0.0
        for r in acker:
            if r["Gewassen"].strip() not in codigos:
                continue
            region, t = r["RegioS"].strip(), r["TotaleBrutoOpbrengst_4"]   # 1 000 kg = t
            if region == "NL01":
                nacional += t or 0
                hect += r["BeteeldeOppervlakte_1"] or 0
            elif region in PROVINCIAS and t:
                reg[region] = reg.get(region, 0) + t
        agregar(clave, nacional, hect, reg, "CBS", anio, False)

    # 2) Cosecha nacional repartida por superficie
    def repartir(t, cols, reg):
        pesos = {c: sum(ha(c, col) for col in cols) for c in PROVINCIAS}
        total = sum(pesos.values())
        if total <= 0:
            return False
        for c, w in pesos.items():
            if w > 0:
                reg[c] = reg.get(c, 0) + t * w / total
        return True

    for clave, partes in REPARTO.items():
        reg, nacional, hect = {}, 0.0, 0.0
        for tabla, codigo, cols in partes:
            t, h = nac.get((tabla, codigo), (0, 0))
            if t and not repartir(t, cols, reg):
                print(f"  aviso {clave}: sin superficie por provincia para {codigo}")
            nacional += t
            hect += h
        agregar(clave, nacional, hect, reg, "CBS", anio, True)

    for clave, cols in REPARTO_FAO.items():
        if clave in extra:
            t, h = extra[clave]["prod"], sum(ha("NL01", c) for c in cols)
        else:
            t, _h = produccion_fao("528", clave)
            h = sum(ha("NL01", c) for c in cols)
        reg = {}
        repartir(t, cols, reg)
        agregar(clave, t, h, reg, "FAOSTAT", 2024, True)

    destino = escribir_pais(datos)
    print(f"-> {destino.name} ({destino.stat().st_size / 1e3:.0f} kB) · población {sum(r['pob'] or 0 for r in datos['regiones'].values()):,}")
    resumen(datos)


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 2025)

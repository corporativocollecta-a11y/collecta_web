"""
Matriz de ACCESO A MERCADOS para frutas y hortalizas FRESCAS de México (7 mercados x 29 productos).

Cada celda dice si el producto fresco mexicano puede entrar hoy, con qué condición principal y qué
arancel aplica a origen México. La tabla está CURADA A MANO a partir de fuentes oficiales consultadas
en sept-2026; cada entrada lleva la URL exacta donde se verificó. Lo que no se pudo confirmar queda
como estado "sin_dato" / requisito "No verificado" (no se adivina).

Estados:
  abierto          admisible con requisitos generales (permiso/certificado fitosanitario/inspección)
  con_condiciones  admisible solo con medidas específicas (zona libre, tratamiento, estados/huertos
                   aprobados, declaración adicional, protocolo bilateral)
  cerrado          prohibido o sin acceso fitosanitario aprobado para México
  sin_dato         no verificado

Uso:
  python scripts/construir_acceso.py
Salida:
  data/acceso.js  -> window.ACCESO = {actualizado, mercados, productos}
Fuentes crudas guardadas en data/fuentes/acceso/<mercado>/ (ver README de ese directorio en el reporte).
Solo usa la biblioteca estándar.
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "data" / "acceso.js"

# ---------------------------------------------------------------- URLs base
ACIR = "https://acir.aphis.usda.gov/s/acir-document-detail?rowId={}&Document_Type=Commodity%20Import%20Requirements"
HTS = "https://hts.usitc.gov/search?query={}"
FR_TOMATE = "https://www.federalregister.gov/documents/2025/07/17/2025-13453/fresh-tomatoes-from-mexico-termination-of-suspension-agreement-rescission-of-administrative-reviews"
AIRS = "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx"
CBSA = "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch{}-eng.html"
EURLEX = "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706"
A2M = "https://trade.ec.europa.eu/access-to-markets/en/results?product={}&origin=MX&destination=ES"
BTOM = "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/"
UKLEG6 = "https://www.legislation.gov.uk/eur/2019/2072/annex/VI"
UKLEG7 = "https://www.legislation.gov.uk/eur/2019/2072/annex/VII"
UKTT = "https://www.trade-tariff.service.gov.uk/commodities/{}?country=MX"
JPT2 = "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html"
JPTAR = "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_{}.htm"
GACC = "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html"
CNTAR = "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm"
KRLAW = "https://www.law.go.kr/LSW/admRulLsInfoP.do?admRulSeq={}"
KRANEXO = "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619"          # Reglamento Ley de Protección Fitosanitaria, anexo 1
KRTAR = "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689"            # Ley de Aduanas, anexo tabla arancelaria

MERCADOS = {
    "EUA": {"nombre": "Estados Unidos",
            "fuente": "USDA APHIS ACIR (requisitos por país/producto); USITC HTS (arancel T-MEC)",
            "url": "https://acir.aphis.usda.gov/s/acir-global-search?category=Plants-and-Plant-Products-Not-for-Propagation"},
    "CAN": {"nombre": "Canadá",
            "fuente": "CFIA AIRS (origen México, consumo humano); CBSA Customs Tariff 2026 (MXT/T-MEC)",
            "url": AIRS},
    "UE": {"nombre": "Unión Europea",
           "fuente": "Reglamento de Ejecución (UE) 2019/2072 consolidado 06-07-2026 (Anexos VI, VII y XI); EU Access2Markets (arancel origen MX)",
           "url": EURLEX},
    "RU": {"nombre": "Reino Unido",
           "fuente": "DEFRA Plant Health Portal (categorías de riesgo BTOM); 2019/2072 versión GB (legislation.gov.uk); UK Trade Tariff (país MX)",
           "url": BTOM},
    "JPN": {"nombre": "Japón",
            "fuente": "MAFF Plant Protection Station, Tabla Anexa 2 (plantas de importación prohibida); Aduana de Japón, arancel 08-08-2026 (columna EPA México)",
            "url": JPT2},
    "CHN": {"nombre": "China",
            "fuente": "GACC listas de frutas y hortalizas frescas con acceso (actualizadas ago-2026); Arancel de la RPC 2026 (NMF, sin TLC con México)",
            "url": GACC},
    "KOR": {"nombre": "Corea del Sur",
            "fuente": "Reglamento de la Ley de Protección Fitosanitaria, anexo 1 y normas APQA de excepción para México (law.go.kr); Ley de Aduanas, tabla arancelaria (tasa básica, sin TLC)",
            "url": KRANEXO},
}

PRODUCTOS = ["jitomate", "chile", "aguacate", "limon", "naranja", "mango", "papa", "cebolla", "brocoli",
             "fresa", "pepino", "calabacita", "zanahoria", "lechuga", "sandia", "melon", "papaya", "pina",
             "uva", "toronja", "berenjena", "esparrago", "arandano", "frambuesa", "zarzamora", "guayaba",
             "nopal", "tomate_verde", "nuez"]


def c(estado, requisito, arancel, fuente, url, url_arancel=None):
    d = {"estado": estado, "requisito": requisito, "arancel": arancel, "fuente": fuente, "url": url}
    if url_arancel:
        d["url_arancel"] = url_arancel
    return d


# =============================================================== ESTADOS UNIDOS
# ACIR (sustituto de FAVIR). Arancel: HTS columna Special incluye "S" (USMCA) = Free en todas las fracciones.
PERM = "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3)"
T = "0% (T-MEC)"
F = "USDA APHIS ACIR"
EUA = {
    "jitomate": c("abierto", PERM, "0% (T-MEC) + antidumping 17.09% (orden AD desde 14-jul-2025)", F, ACIR.format("a0jSJ00000BmSYLYA3"), FR_TOMATE),
    "chile": c("abierto", PERM, T, F, ACIR.format("a0jSJ00000fsWRVYA2"), HTS.format("0709.60")),
    "aguacate": c("con_condiciones", "Hass solo de Michoacán o Jalisco; envíos comerciales; cert. fitosanitario con declaración adicional; otros estados sin permiso", T, F, ACIR.format("a0jSJ00000CGfoHYAT"), HTS.format("0804.40")),
    "limon": c("con_condiciones", "Limón persa/agrio: cert. fitosanitario con declaración adicional de limpieza en empacadora", T, F, ACIR.format("a0jSJ00000frAUfYAM"), HTS.format("0805.50")),
    "naranja": c("con_condiciones", "Zona libre de mosca de la fruta o tratamiento cuarentenario (frío, vapor, irradiación, aire forzado); solo puertos continentales", T, F, ACIR.format("a0jSJ00000ObTwTYAV"), HTS.format("0805.10")),
    "mango": c("con_condiciones", "Zona libre de mosca de la fruta o tratamiento (agua caliente, irradiación, aire forzado, vapor); solo comercial", T, F, ACIR.format("a0jSJ00000oOr81YAC"), HTS.format("0804.50")),
    "papa": c("con_condiciones", "Cert. fitosanitario con declaraciones adicionales (Globodera, semilla certificada, plagas listadas); etiqueta 'no para siembra'", T, F, ACIR.format("a0jSJ00000jmXSnYAM"), HTS.format("0701.90")),
    "cebolla": c("abierto", PERM, T, F, ACIR.format("a0jSJ00000BmRu1YAF"), HTS.format("0703.10")),
    "brocoli": c("con_condiciones", "Cert. fitosanitario: libre de Copitarsia (o Mexicali, área sin la plaga); sin él, fumigación con bromuro de metilo", T, F, ACIR.format("a0jSJ00000qkxSVYAY"), HTS.format("0704.10")),
    "fresa": c("abierto", PERM, T, F, ACIR.format("a0jSJ00000BmSOfYAN"), HTS.format("0810.10")),
    "pepino": c("abierto", PERM, T, F, ACIR.format("a0jSJ00000BmOGEYA3"), HTS.format("0707")),
    "calabacita": c("abierto", PERM + " (Cucurbita spp.)", T, F, ACIR.format("a0jSJ00000J6zlrYAB"), HTS.format("0709.93")),
    "zanahoria": c("abierto", PERM, T, F, ACIR.format("a0jSJ00000BmX8DYAV"), HTS.format("0706.10")),
    "lechuga": c("abierto", PERM, T, F, ACIR.format("a0jSJ00000kUde9YAC"), HTS.format("0705.11")),
    "sandia": c("abierto", PERM, T, F, ACIR.format("a0jSJ00000BmSmrYAF"), HTS.format("0807.11")),
    "melon": c("abierto", PERM, T, F, ACIR.format("a0j3d000000Sz2ZAAS"), HTS.format("0807.19")),
    "papaya": c("con_condiciones", "Cert. fitosanitario con estado de origen y declaración adicional; Chiapas solo huertos aprobados; prohibido a Hawái", T, F, ACIR.format("a0jSJ00000fsVYfYAM"), HTS.format("0807.20")),
    "pina": c("abierto", PERM + "; no a Hawái", T, F, ACIR.format("a0jt000001Ahr5RAAR"), HTS.format("0804.30")),
    "uva": c("abierto", PERM, T, F, ACIR.format("a0jSJ00000BmcHZYAZ"), HTS.format("0806.10")),
    "toronja": c("con_condiciones", "Zona libre de mosca de la fruta o tratamiento (irradiación, frío, vapor, aire forzado, bromuro de metilo)", T, F, ACIR.format("a0jSJ00000OVY9FYAX"), HTS.format("0805.40")),
    "berenjena": c("abierto", PERM, T, F, ACIR.format("a0jSJ00000BmU0iYAF"), HTS.format("0709.30")),
    "esparrago": c("abierto", PERM, T, F, ACIR.format("a0jSJ00000NUEOUYA5"), HTS.format("0709.20")),
    "arandano": c("abierto", PERM, T, F, ACIR.format("a0jSJ00000BmNvIYAV"), HTS.format("0810.40")),
    "frambuesa": c("abierto", PERM, T, F, ACIR.format("a0jSJ00000BmSA9YAN"), HTS.format("0810.20")),
    "zarzamora": c("abierto", PERM, T, F, ACIR.format("a0jSJ00000BmTkXYAV"), HTS.format("0810.20")),
    "guayaba": c("con_condiciones", "Solo comercial; irradiación obligatoria (mín. 400 Gy) en origen o a la llegada", T, F, ACIR.format("a0jSJ00000OVwLGYA1"), HTS.format("0804.50")),
    "nopal": c("abierto", PERM + " (tuna y nopal)", T, F, ACIR.format("a0jSJ00000cgzCTYAY"), HTS.format("0709.99")),
    "tomate_verde": c("abierto", PERM, T, F, ACIR.format("a0jSJ00000Ic65HYAR"), HTS.format("0709.99")),
    "nuez": c("abierto", PERM + " (documento ACIR 'Pecan (Fruit)')", T, F, ACIR.format("a0jSJ00000BmF87YAF"), HTS.format("0802.99")),
}

# =============================================================== CANADÁ
# AIRS: origen México, uso "Human consumption". Arancel: CBSA 2026, MXT (T-MEC) "Free" en todas las fracciones.
AB = "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario"
TC = "0% (T-MEC)"
FC = "CFIA AIRS"
CAN = {k: c("abierto", AB, TC, FC, AIRS, CBSA.format("08" if k in (
    "aguacate", "limon", "naranja", "mango", "fresa", "sandia", "melon", "papaya", "pina", "uva", "toronja",
    "arandano", "frambuesa", "zarzamora", "guayaba", "nuez") else "07")) for k in PRODUCTOS}
CAN["arandano"] = c("con_condiciones", "Certificado fitosanitario (emitido ≤14 días antes); libre de suelo, hojas y plagas", TC, FC, AIRS, CBSA.format("08"))
CAN["papa"] = c("cerrado", "Requiere aprobación previa del CFIA (análisis de riesgo de plagas) y permiso de importación; sin acceso vigente", TC, FC, AIRS, CBSA.format("07"))
CAN["cebolla"] = c("abierto", "Aprobado sin suelo: licencia SFC y DRC; sin certificado fitosanitario (directiva D-94-26)", TC, FC, AIRS, CBSA.format("07"))
CAN["zanahoria"] = c("abierto", "Aprobado sin suelo: licencia SFC y DRC; sin certificado fitosanitario (directiva D-94-26)", TC, FC, AIRS, CBSA.format("07"))
CAN["nuez"] = c("abierto", "Aprobado: licencia SFC del importador; sin certificado fitosanitario", TC, FC, AIRS, CBSA.format("08"))

# =============================================================== UNIÓN EUROPEA
FU = "Reg. (UE) 2019/2072; Access2Markets"
GEN = "Certificado fitosanitario; sin requisitos especiales para México en el Anexo VII"
TU = "0% (TLCUEM)"
UE = {
    "jitomate": c("con_condiciones", "Cert. fitosanitario con declaración de país/área/lugar libre de B. cockerelli, Neoleucinodes y Keiferia (Anexo VII 67-69)", "0% con precio de entrada (TLCUEM)", FU, EURLEX, A2M.format("0702009999")),
    "chile": c("con_condiciones", "Área o lugar de producción libre de Anthonomus eugenii; declaraciones sobre B. cockerelli y Neoleucinodes (Anexo VII 67, 68, 72)", TU, FU, EURLEX, A2M.format("0709609990")),
    "aguacate": c("abierto", GEN, TU, FU, EURLEX, A2M.format("0804400010")),
    "limon": c("con_condiciones", "Sin pedúnculo ni hojas; declaración oficial sobre cancro de los cítricos y moscas Tephritidae (Anexo VII 57-61)", TU, FU, EURLEX, A2M.format("0805509010")),
    "naranja": c("con_condiciones", "Sin pedúnculo ni hojas; declaración sobre cancro, mancha negra y moscas Tephritidae (Anexo VII 57-61)", TU, FU, EURLEX, A2M.format("0805102890")),
    "mango": c("con_condiciones", "Declaración oficial sobre moscas Tephritidae: país, área o lugar libre, o tratamiento eficaz (Anexo VII 61)", TU, FU, EURLEX, A2M.format("0804500040")),
    "papa": c("cerrado", "Tubérculos de Solanum prohibidos desde México (Anexo VI, punto 17)", TU, FU, EURLEX, A2M.format("0701909090")),
    "cebolla": c("abierto", GEN, TU, FU, EURLEX, A2M.format("07031019")),
    "brocoli": c("abierto", GEN, TU, FU, EURLEX, A2M.format("0704101010")),
    "fresa": c("abierto", GEN, TU, FU, EURLEX, A2M.format("081010")),
    "pepino": c("abierto", GEN, "0% con precio de entrada (TLCUEM)", FU, EURLEX, A2M.format("0707000599")),
    "calabacita": c("abierto", GEN, "0% con precio de entrada (TLCUEM)", FU, EURLEX, A2M.format("07099310")),
    "zanahoria": c("abierto", GEN, TU, FU, EURLEX, A2M.format("0706100010")),
    "lechuga": c("abierto", GEN, TU, FU, EURLEX, A2M.format("070511")),
    "sandia": c("abierto", GEN, TU, FU, EURLEX, A2M.format("080711")),
    "melon": c("abierto", GEN, "8.8% (NMF; sin preferencia para México)", FU, EURLEX, A2M.format("0807190090")),
    "papaya": c("abierto", GEN, "0% (NMF)", FU, EURLEX, A2M.format("080720")),
    "pina": c("abierto", "Sin certificado fitosanitario (Anexo XI, parte C)", TU, FU, EURLEX, A2M.format("0804300090")),
    "uva": c("abierto", GEN, "14.1% NMF con precio de entrada (al 28-sep-2026; estacional); sin preferencia para México", FU, EURLEX, A2M.format("0806101090")),
    "toronja": c("con_condiciones", "Sin pedúnculo ni hojas; declaración sobre cancro, mancha negra y moscas Tephritidae (Anexo VII 57-61)", TU, FU, EURLEX, A2M.format("0805400011")),
    "berenjena": c("con_condiciones", "Declaraciones de país/área/lugar libre de B. cockerelli, Neoleucinodes, Keiferia y Thrips palmi (Anexo VII 67-70)", TU, FU, EURLEX, A2M.format("0709300005")),
    "esparrago": c("abierto", GEN, "0% dentro de cupo (TLCUEM); fuera de cupo 10.2%", FU, EURLEX, A2M.format("0709200010")),
    "arandano": c("con_condiciones", "Área o lugar libre de Grapholita packardi, o enfoque de sistemas/tratamiento (Anexo VII 63, específico México)", TU, FU, EURLEX, A2M.format("08104050")),
    "frambuesa": c("abierto", GEN, TU, FU, EURLEX, A2M.format("08102010")),
    "zarzamora": c("abierto", GEN, TU, FU, EURLEX, A2M.format("08102090")),
    "guayaba": c("abierto", GEN, TU, FU, EURLEX, A2M.format("0804500030")),
    "nopal": c("abierto", GEN, TU, FU, EURLEX, A2M.format("0709999090")),
    "tomate_verde": c("con_condiciones", "Solanácea: declaración de país/área/lugar libre de Bactericera cockerelli (Anexo VII 67)", TU, FU, EURLEX, A2M.format("0709999090")),
    "nuez": c("abierto", "Sin prohibición ni requisito especial en el Reg. (UE) 2019/2072", "0% (NMF)", FU, EURLEX, A2M.format("08029910")),
}

# =============================================================== REINO UNIDO
FR = "DEFRA BTOM; UK Trade Tariff"
MA = "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS"
MB = "Riesgo medio B (BTOM): certificado fitosanitario, sin prenotificación"
LO = "Riesgo bajo (BTOM): sin certificado fitosanitario ni prenotificación"
TR = "0% (acuerdo RU-México)"
RU = {
    "jitomate": c("con_condiciones", MA + "; declaraciones sobre B. cockerelli y otras plagas (Anexo VII 100-102)", TR, FR, UKLEG7, UKTT.format("0702009999")),
    "chile": c("con_condiciones", MA + "; área/lugar libre de Anthonomus eugenii (Anexo VII 105) y B. cockerelli", TR, FR, UKLEG7, UKTT.format("0709609990")),
    "aguacate": c("abierto", MA, TR, FR, BTOM, UKTT.format("0804400010")),
    "limon": c("abierto", LO + " (cítricos)", TR, FR, BTOM, UKTT.format("0805509010")),
    "naranja": c("abierto", LO + " (cítricos)", TR, FR, BTOM, UKTT.format("0805102290")),
    "mango": c("abierto", LO, "0% (NMF)", FR, BTOM, UKTT.format("0804500040")),
    "papa": c("cerrado", "Tubérculos de Solanum prohibidos desde México (2019/2072 GB, Anexo VI, punto 17)", TR, "legislation.gov.uk", UKLEG6, UKTT.format("0701909090")),
    "cebolla": c("abierto", MB, TR, FR, BTOM, UKTT.format("0703101900")),
    "brocoli": c("abierto", MB, TR, FR, BTOM, UKTT.format("0704101010")),
    "fresa": c("abierto", MA, TR, FR, BTOM, UKTT.format("0810100000")),
    "pepino": c("abierto", MA + " (cucurbitáceas de América)", TR, FR, BTOM, UKTT.format("0707000599")),
    "calabacita": c("abierto", MA + " (cucurbitáceas de América)", TR, FR, BTOM, UKTT.format("0709931000")),
    "zanahoria": c("abierto", MA + " (raíces)", TR, FR, BTOM, UKTT.format("0706100010")),
    "lechuga": c("abierto", MB, TR, FR, BTOM, UKTT.format("0705110000")),
    "sandia": c("abierto", MA + " (cucurbitáceas de América)", TR, FR, BTOM, UKTT.format("0807110000")),
    "melon": c("abierto", MA + " (cucurbitáceas de América)", "0% (suspensión arancelaria RU hasta 2028; NMF 8%)", FR, BTOM, UKTT.format("0807190090")),
    "papaya": c("abierto", LO, "0% (NMF)", FR, BTOM, UKTT.format("0807200000")),
    "pina": c("abierto", LO, TR, FR, BTOM, UKTT.format("0804300090")),
    "uva": c("abierto", MA, "0% (suspensión arancelaria RU hasta 2028; NMF 8%)", FR, BTOM, UKTT.format("0806101090")),
    "toronja": c("abierto", LO + " (cítricos)", TR, FR, BTOM, UKTT.format("0805400011")),
    "berenjena": c("con_condiciones", MA + "; declaraciones sobre B. cockerelli y otras plagas (Anexo VII 100-103)", TR, FR, UKLEG7, UKTT.format("0709300005")),
    "esparrago": c("abierto", MA + " (espárrago de América)", "0% dentro de cupo (acuerdo RU-México); fuera 10%", FR, BTOM, UKTT.format("0709200010")),
    "arandano": c("con_condiciones", MA + "; área/lugar libre de Grapholita packardi o tratamiento (Anexo VII 96, México)", TR, FR, UKLEG7, UKTT.format("0810405000")),
    "frambuesa": c("abierto", MA, TR, FR, BTOM, UKTT.format("0810201000")),
    "zarzamora": c("abierto", MA, TR, FR, BTOM, UKTT.format("0810209000")),
    "guayaba": c("abierto", LO, "0% (NMF)", FR, BTOM, UKTT.format("0804500030")),
    "nopal": c("abierto", MB, TR, FR, BTOM, UKTT.format("0709999090")),
    "tomate_verde": c("con_condiciones", MA + "; solanácea de América: declaración sobre Bactericera cockerelli (Anexo VII 100)", TR, FR, UKLEG7, UKTT.format("0709999090")),
    "nuez": c("abierto", MB, "0% (NMF)", FR, BTOM, UKTT.format("0802991000")),
}

# =============================================================== JAPÓN
FJ = "MAFF PPS Tabla Anexa 2; Aduana de Japón"
TJ = "0% (AAE México-Japón)"
NP = "No figura como prohibido para México en la Tabla Anexa 2; certificado fitosanitario e inspección"
JPN = {
    "jitomate": c("con_condiciones", "Solo con envío directo de México a Japón (Apéndice 47 de la Tabla Anexa 2)", TJ, FJ, JPT2, JPTAR.format("07")),
    "chile": c("con_condiciones", "Solo pimiento morrón (var. grossum) con envío directo (Apéndice 92); chiles picantes prohibidos (ítem 12)", TJ, FJ, JPT2, JPTAR.format("07")),
    "aguacate": c("abierto", NP, TJ, FJ, JPT2, JPTAR.format("08")),
    "limon": c("abierto", "Lima persa y mexicana y limón excluidos de las prohibiciones por Anastrepha (Tabla Anexa 2, ítems 18 y 20)", TJ, FJ, JPT2, JPTAR.format("08")),
    "naranja": c("con_condiciones", "Envío directo y cumplir normas del MAFF (Apéndice 86); hospedero de Anastrepha ludens y striata", "5% jun-nov / 10% dic-may en cupo AAE; fuera de cupo 16%/32%", FJ, JPT2, JPTAR.format("08")),
    "mango": c("con_condiciones", "Envío directo y cumplir normas del MAFF (Apéndice 87)", TJ, FJ, JPT2, JPTAR.format("08")),
    "papa": c("cerrado", "Tubérculos de solanáceas prohibidos desde México (nematodo dorado, ítem 10)", "4.3% (NMF; sin preferencia AAE)", FJ, JPT2, JPTAR.format("07")),
    "cebolla": c("abierto", NP, TJ, FJ, JPT2, JPTAR.format("07")),
    "brocoli": c("abierto", NP, TJ, FJ, JPT2, JPTAR.format("07")),
    "fresa": c("abierto", NP, TJ, FJ, JPT2, JPTAR.format("08")),
    "pepino": c("abierto", NP, TJ, FJ, JPT2, JPTAR.format("07")),
    "calabacita": c("abierto", NP, TJ, FJ, JPT2, JPTAR.format("07")),
    "zanahoria": c("abierto", NP, TJ, FJ, JPT2, JPTAR.format("07")),
    "lechuga": c("abierto", NP, TJ, FJ, JPT2, JPTAR.format("07")),
    "sandia": c("abierto", NP, TJ, FJ, JPT2, JPTAR.format("08")),
    "melon": c("abierto", NP, TJ, FJ, JPT2, JPTAR.format("08")),
    "papaya": c("cerrado", "Hospedero de Anastrepha striata (ítem 23) sin excepción para México; el Apéndice 84 solo exime del ítem 18", TJ, FJ, JPT2, JPTAR.format("08")),
    "pina": c("abierto", NP, "17% (NMF; sin preferencia AAE)", FJ, JPT2, JPTAR.format("08")),
    "uva": c("con_condiciones", "Excepto Chiapas y sin tránsito por zonas del ítem 18 (Apéndice 80)", "0% abr-jul (AAE); resto del año NMF 17% (mar-oct) o 7.8% (nov-feb)", FJ, JPT2, JPTAR.format("08")),
    "toronja": c("con_condiciones", "Envío directo y cumplir normas del MAFF (Apéndice 86)", TJ, FJ, JPT2, JPTAR.format("08")),
    "berenjena": c("cerrado", "Frutos de solanáceas prohibidos desde México (moho azul, ítem 12)", TJ, FJ, JPT2, JPTAR.format("07")),
    "esparrago": c("abierto", NP, TJ, FJ, JPT2, JPTAR.format("07")),
    "arandano": c("con_condiciones", "Excepto Chiapas y sin tránsito por zonas del ítem 18 (Apéndice 83)", TJ, FJ, JPT2, JPTAR.format("08")),
    "frambuesa": c("con_condiciones", "Excepto Chiapas y sin tránsito por zonas del ítem 18 (Apéndice 82)", TJ, FJ, JPT2, JPTAR.format("08")),
    "zarzamora": c("con_condiciones", "Excepto Chiapas y sin tránsito por zonas del ítem 18 (Apéndice 82)", TJ, FJ, JPT2, JPTAR.format("08")),
    "guayaba": c("cerrado", "Hospedero de moscas Anastrepha presentes en México (ítems 18, 20, 21 y 23)", TJ, FJ, JPT2, JPTAR.format("08")),
    "nopal": c("abierto", NP, TJ, FJ, JPT2, JPTAR.format("07")),
    "tomate_verde": c("cerrado", "Frutos de solanáceas prohibidos desde México (moho azul, ítem 12)", TJ, FJ, JPT2, JPTAR.format("07")),
    "nuez": c("abierto", NP + " (el ítem 5 solo aplica a Juglans)", "4.5% (NMF; sin preferencia AAE)", FJ, JPT2, JPTAR.format("08")),
}

# =============================================================== CHINA
# Régimen de lista positiva: solo entran las frutas/hortalizas frescas listadas por país.
FCN = "GACC; Arancel RPC 2026"
NOL = "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)"
PROT = "Protocolo GACC: huertos, empacadoras y almacenes registrados; certificado fitosanitario"
CHN_AR = {"jitomate": "13%", "chile": "13%", "aguacate": "7% (tasa provisional NMF; NMF 25%)", "limon": "11%",
          "naranja": "11%", "mango": "15%", "papa": "13%", "cebolla": "13%", "brocoli": "11%", "fresa": "14%",
          "pepino": "13%", "calabacita": "13%", "zanahoria": "13%", "lechuga": "10%", "sandia": "25%", "melon": "12%",
          "papaya": "25%", "pina": "12%", "uva": "13%", "toronja": "12%", "berenjena": "13%", "esparrago": "13%",
          "arandano": "30%", "frambuesa": "25%", "zarzamora": "25%", "guayaba": "15%", "nopal": "13%",
          "tomate_verde": "13%", "nuez": "24%"}
CHN = {}
for k in PRODUCTOS:
    ar = CHN_AR[k] if "NMF" in CHN_AR[k] else CHN_AR[k] + " (NMF)"
    CHN[k] = c("cerrado", NOL, ar, FCN, GACC, CNTAR)
for k, txt in (("aguacate", "Solo variedad Hass. " + PROT), ("uva", PROT), ("arandano", PROT),
               ("frambuesa", PROT), ("zarzamora", PROT)):
    CHN[k] = c("con_condiciones", txt, CHN[k]["arancel"], FCN, GACC, CNTAR)
CHN["nuez"] = c("sin_dato", "No verificado (nueces con cáscara fuera de las listas de frutas y hortalizas frescas)", CHN["nuez"]["arancel"], FCN, GACC, CNTAR)

# =============================================================== COREA DEL SUR
FK = "APQA/law.go.kr; Ley de Aduanas"
KR_AR = {"jitomate": "45%", "chile": "50%", "aguacate": "30%", "limon": "50% (limón persa)", "naranja": "50%",
         "mango": "30%", "papa": "30%", "cebolla": "50%", "brocoli": "27%", "fresa": "45%", "pepino": "27%",
         "calabacita": "27%", "zanahoria": "30% o 134 KRW/kg, el mayor", "lechuga": "45%", "sandia": "45%",
         "melon": "45%", "papaya": "30%", "pina": "30%", "uva": "45%", "toronja": "30%", "berenjena": "27%",
         "esparrago": "27%", "arandano": "45%", "frambuesa": "45%", "zarzamora": "45%", "guayaba": "30%",
         "nopal": "27%", "tomate_verde": "27%", "nuez": "30%"}
MOSCA = "Fruto hospedero de moscas de la fruta: prohibido desde México (anexo 1, punto 2); sin norma de excepción vigente"
NOPRO = "No figura como planta prohibida para México (anexo 1); certificado fitosanitario e inspección"
KOR = {}
for k in PRODUCTOS:
    KOR[k] = c("cerrado", MOSCA, KR_AR[k] + " (tasa básica, sin TLC)", FK, KRANEXO, KRTAR)
for k in ("cebolla", "brocoli", "lechuga", "esparrago", "nopal", "pina", "nuez"):
    KOR[k] = c("abierto", NOPRO, KR_AR[k] + " (tasa básica, sin TLC)", FK, KRANEXO, KRTAR)
KOR["pina"]["requisito"] = "Piña permitida desde México por el anexo 1 (punto 2); certificado fitosanitario e inspección"
KOR["nuez"]["requisito"] = NOPRO + " (el punto 3 solo aplica a nogal Juglans)"
KOR["papa"] = c("cerrado", "Partes subterráneas de solanáceas prohibidas desde México (anexo 1, puntos 7 y 9)", KR_AR["papa"] + " (tasa básica, sin TLC)", FK, KRANEXO, KRTAR)
KOR["zanahoria"] = c("cerrado", "Partes subterráneas de zanahoria prohibidas desde México (nematodos Radopholus, anexo 1, punto 14)", KR_AR["zanahoria"] + " (tasa básica, sin TLC)", FK, KRANEXO, KRTAR)
KOR["aguacate"] = c("con_condiciones", "Solo Hass de Michoacán; huertos y empacadoras registrados, trampeo de moscas, cert. con declaración (norma APQA 2025-26)", KR_AR["aguacate"] + " (tasa básica, sin TLC)", FK, KRLAW.format("2100000263646"), KRTAR)
KOR["limon"] = c("con_condiciones", "Solo limón persa; huertos y empacadoras registrados ante SENASICA, inspección en campo (norma APQA 2026-36, 21-ago-2026)", KR_AR["limon"] + " (tasa básica, sin TLC)", FK, KRLAW.format("2100000284198"), KRTAR)
KOR["uva"] = c("con_condiciones", "Solo uva de Sonora; huertos registrados, trampeo de moscas y pruebas de Xylella fastidiosa (norma APQA 2026-5)", KR_AR["uva"] + " (tasa básica, sin TLC)", FK, KRLAW.format("2100000272914"), KRTAR)

TABLA = {"EUA": EUA, "CAN": CAN, "UE": UE, "RU": RU, "JPN": JPN, "CHN": CHN, "KOR": KOR}


# =============================================================== VERSIONES EN INGLÉS
NOMBRE_EN = {"EUA": "United States", "CAN": "Canada", "UE": "European Union", "RU": "United Kingdom",
             "JPN": "Japan", "CHN": "China", "KOR": "South Korea"}

REQ_EN = {
    "Aprobado sin suelo: licencia SFC y DRC; sin certificado fitosanitario (directiva D-94-26)":
        "Approved if soil-free: SFC licence and DRC; no phytosanitary certificate (directive D-94-26)",
    "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario":
        "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "Aprobado: licencia SFC del importador; sin certificado fitosanitario":
        "Approved: importer SFC licence; no phytosanitary certificate",
    "Cert. fitosanitario con declaraciones adicionales (Globodera, semilla certificada, plagas listadas); etiqueta 'no para siembra'":
        "Phytosanitary cert. with additional declarations (Globodera, certified seed, listed pests); 'not for planting' label",
    "Cert. fitosanitario con declaración de país/área/lugar libre de B. cockerelli, Neoleucinodes y Keiferia (Anexo VII 67-69)":
        "Phytosanitary cert. declaring country/area/place free of B. cockerelli, Neoleucinodes and Keiferia (Annex VII 67-69)",
    "Cert. fitosanitario con estado de origen y declaración adicional; Chiapas solo huertos aprobados; prohibido a Hawái":
        "Phytosanitary cert. with state of origin and additional declaration; Chiapas approved orchards only; not to Hawaii",
    "Cert. fitosanitario: libre de Copitarsia (o Mexicali, área sin la plaga); sin él, fumigación con bromuro de metilo":
        "Phytosanitary cert.: free of Copitarsia (or Mexicali, pest-free area); without it, methyl bromide fumigation",
    "Certificado fitosanitario (emitido ≤14 días antes); libre de suelo, hojas y plagas":
        "Phytosanitary certificate (issued ≤14 days before); free of soil, leaves and pests",
    "Certificado fitosanitario; sin requisitos especiales para México en el Anexo VII":
        "Phytosanitary certificate; no special requirements for Mexico in Annex VII",
    "Declaraciones de país/área/lugar libre de B. cockerelli, Neoleucinodes, Keiferia y Thrips palmi (Anexo VII 67-70)":
        "Declarations of country/area/place free of B. cockerelli, Neoleucinodes, Keiferia and Thrips palmi (Annex VII 67-70)",
    "Declaración oficial sobre moscas Tephritidae: país, área o lugar libre, o tratamiento eficaz (Anexo VII 61)":
        "Official statement on Tephritidae fruit flies: pest-free country, area or place, or effective treatment (Annex VII 61)",
    "Envío directo y cumplir normas del MAFF (Apéndice 86)":
        "Direct shipment and compliance with MAFF standards (Appendix 86)",
    "Envío directo y cumplir normas del MAFF (Apéndice 86); hospedero de Anastrepha ludens y striata":
        "Direct shipment and compliance with MAFF standards (Appendix 86); host of Anastrepha ludens and striata",
    "Envío directo y cumplir normas del MAFF (Apéndice 87)":
        "Direct shipment and compliance with MAFF standards (Appendix 87)",
    "Excepto Chiapas y sin tránsito por zonas del ítem 18 (Apéndice 80)":
        "Except Chiapas and no transit through item 18 areas (Appendix 80)",
    "Excepto Chiapas y sin tránsito por zonas del ítem 18 (Apéndice 82)":
        "Except Chiapas and no transit through item 18 areas (Appendix 82)",
    "Excepto Chiapas y sin tránsito por zonas del ítem 18 (Apéndice 83)":
        "Except Chiapas and no transit through item 18 areas (Appendix 83)",
    "Fruto hospedero de moscas de la fruta: prohibido desde México (anexo 1, punto 2); sin norma de excepción vigente":
        "Fruit-fly host fruit: prohibited from Mexico (Annex 1, point 2); no exemption rule in force",
    "Frutos de solanáceas prohibidos desde México (moho azul, ítem 12)":
        "Solanaceous fruits prohibited from Mexico (blue mold, item 12)",
    "Hass solo de Michoacán o Jalisco; envíos comerciales; cert. fitosanitario con declaración adicional; otros estados sin permiso":
        "Hass only from Michoacán or Jalisco; commercial shipments; phytosanitary cert. with additional declaration; other states not permitted",
    "Hospedero de Anastrepha striata (ítem 23) sin excepción para México; el Apéndice 84 solo exime del ítem 18":
        "Host of Anastrepha striata (item 23) with no exemption for Mexico; Appendix 84 only exempts from item 18",
    "Hospedero de moscas Anastrepha presentes en México (ítems 18, 20, 21 y 23)":
        "Host of Anastrepha fruit flies present in Mexico (items 18, 20, 21 and 23)",
    "Lima persa y mexicana y limón excluidos de las prohibiciones por Anastrepha (Tabla Anexa 2, ítems 18 y 20)":
        "Persian and Mexican lime and lemon excluded from the Anastrepha prohibitions (Annexed Table 2, items 18 and 20)",
    "Limón persa/agrio: cert. fitosanitario con declaración adicional de limpieza en empacadora":
        "Persian/sour lime: phytosanitary cert. with additional declaration of packinghouse cleaning",
    "No figura como planta prohibida para México (anexo 1); certificado fitosanitario e inspección":
        "Not listed as a prohibited plant for Mexico (Annex 1); phytosanitary certificate and inspection",
    "No figura como planta prohibida para México (anexo 1); certificado fitosanitario e inspección (el punto 3 solo aplica a nogal Juglans)":
        "Not listed as prohibited for Mexico (Annex 1); phytosanitary certificate and inspection (point 3 applies only to Juglans walnut)",
    "No figura como prohibido para México en la Tabla Anexa 2; certificado fitosanitario e inspección":
        "Not listed as prohibited for Mexico in Annexed Table 2; phytosanitary certificate and inspection",
    "No figura como prohibido para México en la Tabla Anexa 2; certificado fitosanitario e inspección (el ítem 5 solo aplica a Juglans)":
        "Not prohibited for Mexico in Annexed Table 2; phytosanitary certificate and inspection (item 5 applies only to Juglans)",
    "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)":
        "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "No verificado (nueces con cáscara fuera de las listas de frutas y hortalizas frescas)":
        "Not verified (in-shell nuts are outside the fresh fruit and vegetable lists)",
    "Partes subterráneas de solanáceas prohibidas desde México (anexo 1, puntos 7 y 9)":
        "Underground parts of Solanaceae prohibited from Mexico (Annex 1, points 7 and 9)",
    "Partes subterráneas de zanahoria prohibidas desde México (nematodos Radopholus, anexo 1, punto 14)":
        "Underground parts of carrot prohibited from Mexico (Radopholus nematodes, Annex 1, point 14)",
    "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3)":
        "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3)",
    "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3) (Cucurbita spp.)":
        "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3) (Cucurbita spp.)",
    "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3) (documento ACIR 'Pecan (Fruit)')":
        "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3) (ACIR document 'Pecan (Fruit)')",
    "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3) (tuna y nopal)":
        "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3) (prickly pear fruit and cactus pad)",
    "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3); no a Hawái":
        "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3); not to Hawaii",
    "Piña permitida desde México por el anexo 1 (punto 2); certificado fitosanitario e inspección":
        "Pineapple permitted from Mexico under Annex 1 (point 2); phytosanitary certificate and inspection",
    "Protocolo GACC: huertos, empacadoras y almacenes registrados; certificado fitosanitario":
        "GACC protocol: registered orchards, packinghouses and cold stores; phytosanitary certificate",
    "Requiere aprobación previa del CFIA (análisis de riesgo de plagas) y permiso de importación; sin acceso vigente":
        "Requires prior CFIA approval (pest risk analysis) and an import permit; no current access",
    "Riesgo bajo (BTOM): sin certificado fitosanitario ni prenotificación":
        "Low risk (BTOM): no phytosanitary certificate or pre-notification",
    "Riesgo bajo (BTOM): sin certificado fitosanitario ni prenotificación (cítricos)":
        "Low risk (BTOM): no phytosanitary certificate or pre-notification (citrus)",
    "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS":
        "Medium risk A: phytosanitary cert. and IPAFFS pre-notification",
    "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS (cucurbitáceas de América)":
        "Medium risk A: phytosanitary cert. and IPAFFS pre-notification (cucurbits from the Americas)",
    "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS (espárrago de América)":
        "Medium risk A: phytosanitary cert. and IPAFFS pre-notification (asparagus from the Americas)",
    "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS (raíces)":
        "Medium risk A: phytosanitary cert. and IPAFFS pre-notification (root vegetables)",
    "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS; declaraciones sobre B. cockerelli y otras plagas (Anexo VII 100-102)":
        "Medium risk A: phytosanitary cert. and IPAFFS pre-notification; declarations on B. cockerelli and other pests (Annex VII 100-102)",
    "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS; declaraciones sobre B. cockerelli y otras plagas (Anexo VII 100-103)":
        "Medium risk A: phytosanitary cert. and IPAFFS pre-notification; declarations on B. cockerelli and other pests (Annex VII 100-103)",
    "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS; solanácea de América: declaración sobre Bactericera cockerelli (Anexo VII 100)":
        "Medium risk A: phytosanitary cert. and IPAFFS pre-notification; solanaceous from the Americas: B. cockerelli declaration (Annex VII 100)",
    "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS; área/lugar libre de Anthonomus eugenii (Anexo VII 105) y B. cockerelli":
        "Medium risk A: phytosanitary cert. and IPAFFS pre-notification; area/place free of Anthonomus eugenii (Annex VII 105) and B. cockerelli",
    "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS; área/lugar libre de Grapholita packardi o tratamiento (Anexo VII 96, México)":
        "Medium risk A: phytosanitary cert. and IPAFFS pre-notification; area/place free of Grapholita packardi or treatment (Annex VII 96, Mexico)",
    "Riesgo medio B (BTOM): certificado fitosanitario, sin prenotificación":
        "Medium risk B (BTOM): phytosanitary certificate, no pre-notification",
    "Sin certificado fitosanitario (Anexo XI, parte C)":
        "No phytosanitary certificate required (Annex XI, Part C)",
    "Sin pedúnculo ni hojas; declaración oficial sobre cancro de los cítricos y moscas Tephritidae (Anexo VII 57-61)":
        "Free of peduncles and leaves; official statement on citrus canker and Tephritidae fruit flies (Annex VII 57-61)",
    "Sin pedúnculo ni hojas; declaración sobre cancro, mancha negra y moscas Tephritidae (Anexo VII 57-61)":
        "Free of peduncles and leaves; statement on canker, citrus black spot and Tephritidae fruit flies (Annex VII 57-61)",
    "Sin prohibición ni requisito especial en el Reg. (UE) 2019/2072":
        "No prohibition or special requirement in Reg. (EU) 2019/2072",
    "Solanácea: declaración de país/área/lugar libre de Bactericera cockerelli (Anexo VII 67)":
        "Solanaceous: declaration of country/area/place free of Bactericera cockerelli (Annex VII 67)",
    "Solo Hass de Michoacán; huertos y empacadoras registrados, trampeo de moscas, cert. con declaración (norma APQA 2025-26)":
        "Hass from Michoacán only; registered orchards and packinghouses, fruit-fly trapping, cert. with declaration (APQA rule 2025-26)",
    "Solo comercial; irradiación obligatoria (mín. 400 Gy) en origen o a la llegada":
        "Commercial only; mandatory irradiation (min. 400 Gy) at origin or on arrival",
    "Solo con envío directo de México a Japón (Apéndice 47 de la Tabla Anexa 2)":
        "Only with direct shipment from Mexico to Japan (Appendix 47 of Annexed Table 2)",
    "Solo limón persa; huertos y empacadoras registrados ante SENASICA, inspección en campo (norma APQA 2026-36, 21-ago-2026)":
        "Persian lime only; orchards and packinghouses registered with SENASICA, field inspection (APQA rule 2026-36, 21-Aug-2026)",
    "Solo pimiento morrón (var. grossum) con envío directo (Apéndice 92); chiles picantes prohibidos (ítem 12)":
        "Bell pepper (var. grossum) only, direct shipment (Appendix 92); hot chili peppers prohibited (item 12)",
    "Solo uva de Sonora; huertos registrados, trampeo de moscas y pruebas de Xylella fastidiosa (norma APQA 2026-5)":
        "Sonora grapes only; registered orchards, fruit-fly trapping and Xylella fastidiosa testing (APQA rule 2026-5)",
    "Solo variedad Hass. Protocolo GACC: huertos, empacadoras y almacenes registrados; certificado fitosanitario":
        "Hass variety only. GACC protocol: registered orchards, packinghouses and cold stores; phytosanitary certificate",
    "Tubérculos de Solanum prohibidos desde México (2019/2072 GB, Anexo VI, punto 17)":
        "Solanum tubers prohibited from Mexico (2019/2072 GB, Annex VI, point 17)",
    "Tubérculos de Solanum prohibidos desde México (Anexo VI, punto 17)":
        "Solanum tubers prohibited from Mexico (Annex VI, point 17)",
    "Tubérculos de solanáceas prohibidos desde México (nematodo dorado, ítem 10)":
        "Solanaceous tubers prohibited from Mexico (golden nematode, item 10)",
    "Zona libre de mosca de la fruta o tratamiento (agua caliente, irradiación, aire forzado, vapor); solo comercial":
        "Fruit-fly-free area or treatment (hot water, irradiation, forced air, vapor heat); commercial only",
    "Zona libre de mosca de la fruta o tratamiento (irradiación, frío, vapor, aire forzado, bromuro de metilo)":
        "Fruit-fly-free area or treatment (irradiation, cold, vapor heat, forced air, methyl bromide)",
    "Zona libre de mosca de la fruta o tratamiento cuarentenario (frío, vapor, irradiación, aire forzado); solo puertos continentales":
        "Fruit-fly-free area or quarantine treatment (cold, vapor heat, irradiation, forced air); continental ports only",
    "Área o lugar de producción libre de Anthonomus eugenii; declaraciones sobre B. cockerelli y Neoleucinodes (Anexo VII 67, 68, 72)":
        "Area or place of production free of Anthonomus eugenii; declarations on B. cockerelli and Neoleucinodes (Annex VII 67, 68, 72)",
    "Área o lugar libre de Grapholita packardi, o enfoque de sistemas/tratamiento (Anexo VII 63, específico México)":
        "Area or place free of Grapholita packardi, or systems approach/treatment (Annex VII 63, Mexico-specific)",
    "No verificado": "Not verified",
}

ARANCEL_EN = {
    "0% (AAE México-Japón)": "0% (Mexico-Japan EPA)",
    "0% (NMF)": "0% (MFN)",
    "0% (T-MEC)": "0% (USMCA)",
    "0% (T-MEC) + antidumping 17.09% (orden AD desde 14-jul-2025)": "0% (USMCA) + 17.09% antidumping (AD order since 14-Jul-2025)",
    "0% (TLCUEM)": "0% (EU-Mexico agreement)",
    "0% (acuerdo RU-México)": "0% (UK-Mexico agreement)",
    "0% (suspensión arancelaria RU hasta 2028; NMF 8%)": "0% (UK tariff suspension until 2028; MFN 8%)",
    "0% abr-jul (AAE); resto del año NMF 17% (mar-oct) o 7.8% (nov-feb)": "0% Apr-Jul (EPA); rest of year MFN 17% (Mar-Oct) or 7.8% (Nov-Feb)",
    "0% con precio de entrada (TLCUEM)": "0% with entry price (EU-Mexico agreement)",
    "0% dentro de cupo (TLCUEM); fuera de cupo 10.2%": "0% within quota (EU-Mexico agreement); out of quota 10.2%",
    "0% dentro de cupo (acuerdo RU-México); fuera 10%": "0% within quota (UK-Mexico agreement); out of quota 10%",
    "14.1% NMF con precio de entrada (al 28-sep-2026; estacional); sin preferencia para México": "14.1% MFN with entry price (as of 28-Sep-2026; seasonal); no preference for Mexico",
    "17% (NMF; sin preferencia AAE)": "17% (MFN; no EPA preference)",
    "30% o 134 KRW/kg, el mayor (tasa básica, sin TLC)": "30% or 134 KRW/kg, whichever is higher (basic rate, no FTA)",
    "4.3% (NMF; sin preferencia AAE)": "4.3% (MFN; no EPA preference)",
    "4.5% (NMF; sin preferencia AAE)": "4.5% (MFN; no EPA preference)",
    "5% jun-nov / 10% dic-may en cupo AAE; fuera de cupo 16%/32%": "5% Jun-Nov / 10% Dec-May within EPA quota; out of quota 16%/32%",
    "50% (limón persa) (tasa básica, sin TLC)": "50% (Persian lime) (basic rate, no FTA)",
    "7% (tasa provisional NMF; NMF 25%)": "7% (provisional MFN rate; MFN 25%)",
    "8.8% (NMF; sin preferencia para México)": "8.8% (MFN; no preference for Mexico)",
}


def arancel_en(a):
    if a is None:
        return None
    if a in ARANCEL_EN:
        return ARANCEL_EN[a]
    import re
    m = re.fullmatch(r"([\d.]+%) \(NMF\)", a)
    if m:
        return f"{m.group(1)} (MFN)"
    m = re.fullmatch(r"([\d.]+%) \(tasa básica, sin TLC\)", a)
    if m:
        return f"{m.group(1)} (basic rate, no FTA)"
    raise KeyError(f"Sin traducción de arancel: {a!r}")


def main():
    for m in MERCADOS:
        MERCADOS[m]["nombre_en"] = NOMBRE_EN[m]
    productos = {}
    for p in PRODUCTOS:
        productos[p] = {}
        for m, tab in TABLA.items():
            e = tab.get(p) or c("sin_dato", "No verificado", None, MERCADOS[m]["fuente"], MERCADOS[m]["url"])
            assert e["estado"] in ("abierto", "con_condiciones", "cerrado", "sin_dato"), (m, p)
            assert len(e["requisito"]) <= 140, (m, p, len(e["requisito"]), e["requisito"])
            assert e["url"].startswith("http"), (m, p)
            e["requisito_en"] = REQ_EN[e["requisito"]]
            e["arancel_en"] = arancel_en(e["arancel"])
            assert e["requisito_en"] and len(e["requisito_en"]) <= 160, (m, p, len(e["requisito_en"]), e["requisito_en"])
            assert "arancel_en" in e and (e["arancel_en"] is None) == (e["arancel"] is None), (m, p)
            productos[p][m] = e
    for m in MERCADOS:
        assert MERCADOS[m].get("nombre_en"), m
    out = {"actualizado": "2026-09", "mercados": MERCADOS, "productos": productos}
    js = ("// Generado por scripts/construir_acceso.py. Acceso fitosanitario y arancel para fruta/hortaliza fresca de México.\n"
          "window.ACCESO = " + json.dumps(out, ensure_ascii=False, indent=1) + ";\n")
    SALIDA.write_text(js, encoding="utf-8")
    # resumen
    print(f"Escrito {SALIDA} ({len(js)/1024:.1f} KB)")
    for m in TABLA:
        cnt = {}
        for p in PRODUCTOS:
            s = productos[p][m]["estado"]
            cnt[s] = cnt.get(s, 0) + 1
        print(f"  {m:4s}", cnt)


if __name__ == "__main__":
    main()

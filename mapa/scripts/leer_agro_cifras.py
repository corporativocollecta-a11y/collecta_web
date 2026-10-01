"""
Lee el cuadro C.18 "Producción de principales cultivos por región, Enero-Diciembre" del boletín mensual
"El Agro en Cifras" (MIDAGRI, Perú), edición de diciembre, que trae el año completo por región.

Las cifras usan espacio como separador de miles ("1 227 819"), así que el texto plano es ambiguo: se leen las
palabras con su posición (pdfplumber), se unen los grupos de dígitos contiguos en un número y cada número se
asigna a la columna cuya orilla derecha (tomada de la fila "Total Nacional") queda más cerca.

Devuelve {cultivo: {region: {anio: toneladas}}}.
"""
import re
import unicodedata

import pdfplumber

# Columnas de cada página del cuadro C.18 (en el orden del boletín de diciembre 2025)
COLUMNAS = [
    ["Trigo", "Maíz amarillo duro", "Maíz amiláceo", "Arroz cáscara", "Cebada grano", "Quinua", "Espárrago",
     "Alcachofa", "Ají", "Piquillo", "Pimiento"],
    ["Tomate", "Zapallo", "Arveja verde", "Zanahoria", "Ajo", "Cebolla", "Maíz choclo", "Palta", "Plátano", "Mango", "Papaya"],
    ["Piña", "Granadilla", "Limón sutil", "Naranja", "Mandarina", "Tangelo", "Uva", "Manzana", "Melocotón", "Tuna"],
    ["Aceituna", "Palma aceitera", "Papa", "Yuca", "Camote", "Oca", "Olluco", "Café pergamino", "Cacao", "Páprika", "Frijol grano seco"],
    ["Pallar grano seco", "Haba seca", "Arveja seca", "Caña para azúcar", "Alfalfa", "Maíz chala", "Cebada forrajera",
     "Avena forrajera", "Algodón rama", "Orégano", "Arándano"],
]


def _clave(t):
    t = unicodedata.normalize("NFD", t.replace(" ", "")).encode("ascii", "ignore").decode().lower()
    return t


def buscar_paginas(pdf):
    """Índices de las páginas del cuadro C.18 (la primera dice 'C.18', las siguientes 'continúa C.18')."""
    paginas = []
    for i, p in enumerate(pdf.pages):
        t = p.extract_text() or ""
        if "PRODUCCIÓN DE PRINCIPALES CULTIVOS POR REGIÓN" in t or "continúa C.18" in t:
            paginas.append(i)
    return paginas


def filas_de(pagina):
    """Agrupa las palabras en renglones: [(top, etiqueta, [(x1, número), …])]."""
    palabras = pagina.extract_words(x_tolerance=1.5)
    # Renglones con tolerancia vertical: la etiqueta del año puede ir ~2 pt más arriba que sus cifras
    renglones = []
    for w in sorted(palabras, key=lambda w: w["top"]):
        if renglones and w["top"] - renglones[-1][0] <= 3:
            renglones[-1][1].append(w)
        else:
            renglones.append((w["top"], [w]))
    salida = []
    for top, grupo in renglones:
        ws = sorted(grupo, key=lambda w: w["x0"])
        etiqueta = " ".join(w["text"] for w in ws if w["x1"] < 116)
        nums, actual = [], None
        for w in ws:
            if w["x0"] < 145 or not re.fullmatch(r"\d+", w["text"]):
                continue
            if actual and w["x0"] - actual["x1"] < 6:
                actual["txt"] += w["text"]
                actual["x1"] = w["x1"]
            else:
                actual = {"txt": w["text"], "x1": w["x1"]}
                nums.append(actual)
        anio = next((w["text"] for w in ws if 116 <= w["x0"] < 145 and re.fullmatch(r"20\d\dp?", w["text"])), None)
        salida.append((top, etiqueta, anio, [(n["x1"], int(n["txt"])) for n in nums]))
    return salida


def leer(ruta):
    datos = {}
    with pdfplumber.open(ruta) as pdf:
        paginas = buscar_paginas(pdf)
        assert len(paginas) == len(COLUMNAS), f"se esperaban {len(COLUMNAS)} páginas del C.18, hay {paginas}"
        for columnas, i in zip(COLUMNAS, paginas):
            filas = filas_de(pdf.pages[i])
            # Orillas de columna: renglón nacional con todas las columnas
            anclas = next(sorted(x for x, _ in nums) for _, _, _, nums in filas if len(nums) == len(columnas))
            region = None
            for top, etiqueta, anio, nums in filas:
                if etiqueta and anio and anio.startswith("2024"):
                    region = etiqueta
                if anio is None or not nums:
                    continue
                nombre = "Total Nacional" if anio.endswith("p") else region
                if nombre is None:
                    continue
                a = int(anio[:4])
                for x, v in nums:
                    col = min(range(len(anclas)), key=lambda k: abs(anclas[k] - x))
                    if abs(anclas[col] - x) > 8:
                        raise ValueError(f"número fuera de columna en pág. {i}: {nombre} {a} {v} x={x:.1f}")
                    datos.setdefault(columnas[col], {}).setdefault(nombre, {})[a] = v
    return datos


def verificar(datos):
    """Suma de regiones = total nacional (tolerancia 0.5%)."""
    malos = [(c, "sin total nacional") for c, regs in datos.items() if "Total Nacional" not in regs]
    for cultivo, regs in datos.items():
        for a in (2024, 2025):
            nac = regs.get("Total Nacional", {}).get(a)
            suma = sum(v.get(a, 0) for r, v in regs.items() if r != "Total Nacional")
            if nac and abs(suma - nac) > max(2, nac * 0.005):
                malos.append((cultivo, a, nac, suma))
    return malos


if __name__ == "__main__":
    import sys
    d = leer(sys.argv[1])
    print(len(d), "cultivos;", "regiones:", sorted({r for v in d.values() for r in v}))
    print("descuadres:", verificar(d))

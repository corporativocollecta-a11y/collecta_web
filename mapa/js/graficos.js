// ============================================================================
// Gráficos de precio a lo largo del año. Primer gráfico: precio en la frontera del producto mexicano durante el año
// en curso (USDA AMS, punto de embarque de Phoenix; volumen del reporte 1662). Datos: data/frontera_diaria.js ←
// scripts/procesar_frontera_diaria.py.
// Diseño "estilo trading" aprobado en el lienzo de diseño:
// - Encabezado con el último precio y su cambio; selector 1D / 1S / 1M, rango bajo–alto, unidad y media móvil.
// - Línea azul con brillo y nodos (precio del día o promedio de la semana o del mes), etiquetas en el más alto,
//   el más bajo y el último; eje de precios a la derecha; volumen semanal que cruza de México debajo.
// - Cursor: al pasar sobre el gráfico se leen los datos de ese día, semana o mes.
// - Dos tamaños: "panel" (sección del panel de análisis) y "grande" (vista ampliada en una ventana sobre el mapa).
// Segunda fuente, mismo diseño: precio de mayoreo en México (SNIIM, centrales de abasto; data/mayoreo_diario.js ←
// scripts/procesar_mayoreo_diario.py, carga diferida). Sin volumen ni demanda (el SNIIM no los publica); su banda es
// la dispersión entre centrales (percentiles 10–90 de las cotizaciones del día).
// La interacción va por delegación en document, así sobrevive a los repintados del panel. Cada bloque lleva su fuente
// en data-gfr-fuente; antes de pintarlo se fija la fuente activa (F).
// ============================================================================
(function () {
  const FUENTES = {
    frontera: { id: "frontera", datos: () => window.FRONTERA_DIARIA, moneda: "US$", titulo: "Precio en la frontera", tag: "USDA AMS",
      volumen: true, demanda: true, alto: "Máximo", bajo: "Mínimo", rango: "Rango" },
    mayoreo: { id: "mayoreo", datos: () => window.MAYOREO_MX, moneda: "$", titulo: "Precio de mayoreo en México", tag: "SNIIM",
      volumen: false, demanda: false, alto: "Alto (centrales)", bajo: "Bajo (centrales)", rango: "Rango entre centrales",
      archivo: "data/mayoreo_diario.js" },
    // Mercados terminales de EE. UU.: un archivo por producto (data/mayoreo_eua_<producto>.js), con series por ciudad y origen
    eua: { id: "eua", datos: () => window.MAYOREO_EUA, moneda: "US$", titulo: "Precio de mayoreo en EE. UU.", tag: "USDA AMS",
      volumen: false, demanda: false, alto: "Alto (mercados)", bajo: "Bajo (mercados)", rango: "Rango entre mercados",
      archivo: k => `data/mayoreo_eua_${k}.js`, porProducto: true },
    // Precio en origen del producto de EE. UU. (punto de embarque): un archivo por producto, con regiones, volumen y demanda
    origen: { id: "origen", datos: () => window.ORIGEN_EUA, moneda: "US$", titulo: "Precio en origen de EE. UU.", tag: "USDA AMS",
      volumen: true, demanda: true, alto: "Máximo", bajo: "Mínimo", rango: "Rango", archivo: k => `data/origen_eua_${k}.js`,
      porProducto: true, etqVol: "VOLUMEN EMBARCADO · t/semana", verboVol: "que se embarca en EE. UU.",
      etqVolEn: "VOLUME SHIPPED · t/week", verboVolEn: "shipped in the U.S." },
    // Precio de oferta en supermercados de EE. UU. (semanal, por región)
    consumidor: { id: "consumidor", datos: () => window.CONSUMIDOR_EUA, moneda: "US$", titulo: "Precio al consumidor en EE. UU.",
      tag: "USDA AMS", volumen: false, demanda: false, alto: "Alto (regiones)", bajo: "Bajo (regiones)", rango: "Rango entre regiones",
      archivo: "data/consumidor_eua.js", semanal: true }
  };
  let F = FUENTES.frontera;   // fuente del bloque que se está pintando
  const usar = fuente => { F = FUENTES[fuente] ?? FUENTES.frontera; };
  const D = () => F.datos();
  // Inglés: estos bloques se escriben directamente en inglés y llevan translate="no" (js/idioma.js no los toca): sus textos
  // combinan variedad, unidad, región y periodo, y como plantillas se multiplicarían
  const en = () => !!window.Idioma?.activo?.();
  const tx = (es, ing) => en() ? ing : es;
  const tno = () => en() ? ' translate="no"' : "";
  const EN = {
    "Precio en la frontera": "Border price", "Precio de mayoreo en México": "Wholesale price in Mexico",
    "Precio de mayoreo en EE. UU.": "U.S. wholesale price", "Precio en origen de EE. UU.": "U.S. shipping-point price",
    "Precio al consumidor en EE. UU.": "U.S. retail price", "Máximo": "High", "Mínimo": "Low", "Rango": "Range",
    "Alto (centrales)": "High (markets)", "Bajo (centrales)": "Low (markets)", "Rango entre centrales": "Range across markets",
    "Alto (mercados)": "High (markets)", "Bajo (mercados)": "Low (markets)", "Rango entre mercados": "Range across markets",
    "Alto (regiones)": "High (regions)", "Bajo (regiones)": "Low (regions)", "Rango entre regiones": "Range across regions",
    "Baja": "Low", "Algo baja": "Slightly low", "Normal": "Normal", "Buena": "Good", "Muy buena": "Very good",
    // orígenes, ciudades y regiones
    "México": "Mexico", "EE. UU.": "U.S.", "Otros países": "Other countries", "Todos los orígenes": "All origins",
    "Filadelfia": "Philadelphia", "Los Ángeles": "Los Angeles", "Nueva York": "New York",
    "Nacional": "National", "Noreste": "Northeast", "Medio Oeste": "Midwest", "Sureste": "Southeast", "Centro sur": "South Central",
    "Suroeste": "Southwest", "Noroeste": "Northwest",
    "Calexico y Valle Imperial (mixto)": "Calexico and Imperial Valley (mixed)",
    "Sur de California y San Luis (mixto)": "Southern California and San Luis (mixed)", "Varios cruces": "Several crossings",
    // variedades (frontera, mercados, origen y supermercado)
    "Saladette": "Roma", "Bola": "Round", "Uva": "Grape", "Pimiento morrón": "Bell pepper", "Italiana (zucchini)": "Zucchini",
    "Gris": "Grey", "Amarilla": "Yellow", "Bellota (acorn)": "Acorn", "Persa": "Persian lime", "Amarillo": "Lemon",
    // productos solo con gráfico
    "Cebollín": "Green onion", "Col china": "Napa cabbage", "Bok choy": "Bok choy", "Hinojo": "Fennel",
  };
  const L = t => en() ? (EN[t] ?? t) : t;
  const MES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MES_L_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const MES_L = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const UP = "#9FD36A", DN = "#F2703A", AZUL = "#4CC3FF", AZUL2 = "#7FD6FF", AMARILLO = "#E7B653";
  const NOMBRE_CRUCE_ES = { McAllen: "McAllen, Texas", Nogales: "Nogales, Arizona", "Otay Mesa": "Otay Mesa, California", Calexico: "Calexico y San Luis", "Varios cruces": "varios cruces (Arizona, California y Texas)" };
  const NOMBRE_CRUCE_EN = { ...NOMBRE_CRUCE_ES, Calexico: "Calexico and San Luis", "Varios cruces": "several crossings (Arizona, California and Texas)" };
  const nombreCruce = c => (en() ? NOMBRE_CRUCE_EN : NOMBRE_CRUCE_ES)[c] ?? L(c);
  const PERIODO_MA = { D: 20, S: 4, M: 3 };
  const txtMa = () => tx({ D: "20 días", S: "4 semanas", M: "3 meses" }, { D: "20 days", S: "4 weeks", M: "3 months" })[op.tf];
  const vsTxt = () => tx({ D: "vs día anterior", S: "promedio vs semana anterior", M: "promedio vs mes anterior" },
    { D: "vs previous day", S: "average vs previous week", M: "average vs previous month" })[op.tf];
  // Tamaños del gráfico (unidades del viewBox del SVG, que se escala al ancho disponible)
  const TAM = {
    panel: { W: 340, AX: 38, PH: 200, VH: 50, GAP: 10, fs: 9.5, nodo: 2.6, cursor: 4, etiquetas: "clave", nodos: "mes" },
    grande: { W: 1120, AX: 58, PH: 400, VH: 92, GAP: 14, fs: 11, nodo: 3.4, cursor: 5.5, etiquetas: "mes", nodos: "semana" }
  };
  const op = { tf: "S", rango: false, ma: true, kg: false, variedad: {}, cruce: {}, origen: {} };   // se recuerda entre productos y repintados
  let uid = 0;

  const disponible = k => !!D()?.productos?.[k]?.dias?.length;
  const cargado = k => F.porProducto ? !!D()?.productos?.[k] : !!D();
  // Productos solo con gráfico de frontera: el USDA los cotiza pero el SIAP no publica su producción (no están en el mapa)
  const SOLO_PRECIO = { cebollin: ["Cebollín", "#7cb342"], col_china: ["Col china", "#a5c882"], bok_choy: ["Bok choy", "#5f9e6e"],
    hinojo: ["Hinojo", "#c5d6a0"] };
  const nombreEs = k => window.PRODUCTOS?.[k]?.nombre ?? SOLO_PRECIO[k]?.[0] ?? k;
  const nombreDe = k => { const n = nombreEs(k); return en() ? (EN[n] ?? window.Idioma?.traducir?.(n) ?? n) : n; };
  // Lugar (cruce, ciudad o región) y variedad en el idioma activo; las regiones de origen de EE. UU. traen su nombre en inglés
  const lugar = (c, p) => en() ? (p?.regionesEn?.[c] ?? EN[c] ?? c) : c;
  const varNombre = (x) => {
    if (!x?.nombre) return "";
    if (!en()) return x.nombre;
    if (x.nombre.startsWith("Más anunciada")) return "Most advertised" + (x.presentacionEn ? ` (${x.presentacionEn})` : "");
    return EN[x.nombre] ?? x.nombre;
  };
  // Empaque y mercancía: en inglés, tal como los publica el USDA
  const empaqueTxt = p => en() ? p.empaque : window.Paleta.usdaES(p.empaque);
  const mercanciaTxt = (p, k) => en() ? (window.Idioma?.traducir?.(p.mercancia) ?? nombreDe(k).toLowerCase()) : window.Paleta.usdaES(p.mercancia);
  const sinAcentos = t => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  // Grupo al final de la lista de productos; al tocar uno se abre su gráfico ampliado
  function listaSoloPrecioHTML(texto = "", tipo = "todos") {
    usar("frontera");
    if (!D() || (tipo !== "todos" && tipo !== "Hortaliza")) return "";
    const q = sinAcentos(texto.trim());
    const items = Object.entries(SOLO_PRECIO).filter(([k, [n]]) => disponible(k) && (!q || sinAcentos(n).includes(q)));
    if (!items.length) return "";
    return `<div class="grupo"${tno()} title="${tx("El USDA los cotiza en la frontera, pero el SIAP no publica su producción: solo tienen gráfico de precio", "Quoted by the USDA at the border, but SIAP does not publish their production: price chart only")}">${tx("Solo precio en la frontera", "Border price only")}</div>` +
      items.map(([k, [n, color]]) => {
        const p = ficha(k), u = p.dias.at(-1);
        return `<button class="chip" data-gfr-solo="${k}" type="button"${tno()}>
          <span class="punto" style="background:${color}"></span><span class="nombre">${L(n)}</span>
          <span class="meta">US$${n2(u[1])} ${tx("la caja", "per box")}${p.mixto ? tx(" · mixto", " · mixed") : ""}</span>
          <span class="indic" title="${tx("Sin producción SIAP", "No SIAP production")}"><b>—</b></span></button>`;
      }).join("");
  }
  const tn = () => window.Acceso?.tn?.() ?? "";
  const presentacionES = t => en() ? String(t ?? "") : String(t ?? "").replace(/^per lb$/i, "por libra").replace(/^each$/i, "por pieza").replace(/^per bunch$/i, "por manojo")
    .replace(/(\d) count/i, "$1 piezas").replace(/ lb bag/i, " lb, bolsa").replace(/ package/i, " paquete").replace(/ bag/i, " bolsa");
  const fd = md => { const [m, d] = md.split("-").map(Number); return en() ? `${MES_EN[m - 1]} ${d}` : `${d} ${MES[m - 1]}`; };
  const n2 = v => v == null ? "—" : v.toFixed(2);
  const ton = v => v == null ? "—" : Math.round(v).toLocaleString("es-MX") + " t";
  const sg = v => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2);
  const sp = v => (v >= 0 ? "+" : "−") + Math.abs(v * 100).toFixed(1) + "%";
  // Año que muestra cada producto: el anterior completo mientras el año en curso tenga pocos días
  // Serie que se muestra: la variedad elegida (chile serrano, jitomate bola…) o el producto
  const variedadDe = k => {
    const b = D().productos[k], vs = b?.variantes;
    return vs ? vs[op.variedad[F.id + ":" + k] ?? b.varOmision ?? 0] ?? b : b;
  };
  // Y dentro de la variedad, el cruce elegido (McAllen, Nogales…) si tiene serie propia; si no, todos los cruces
  const ficha = k => {
    const v = variedadDe(k), o = op.origen[F.id + ":" + k], po = o && v?.porOrigen?.[o];
    if (po) return { ...v, ...po, demanda: [], volSemana: {}, origenSel: o, porCruce: undefined };
    const cr = op.cruce[F.id + ":" + k], pc = cr && v?.porCruce?.[cr];
    return pc ? { ...v, ...pc, cruces: { [cr]: pc.dias.length }, cruceSel: cr } : v;
  };
  const usaKg = k => op.kg && !!ficha(k)?.kgEmpaque;   // cajas sin peso escrito: solo US$ por caja
  const sinVolumen = k => !Object.keys(ficha(k)?.volSemana ?? {}).length;   // el reporte 1662 no trae esa mercancía
  const anioDe = k => ficha(k)?.anio ?? D().anio;
  const lunes = (md, anio) => {
    const [m, d] = md.split("-").map(Number), t = new Date(Date.UTC(anio, m - 1, d));
    t.setUTCDate(t.getUTCDate() - (t.getUTCDay() + 6) % 7);
    return t.toISOString().slice(0, 10);
  };
  const ticker = k => k.normalize("NFD").replace(/[^a-z]/gi, "").slice(0, 4).toUpperCase();

  // ---------- Series: día, semana o mes ----------
  // c = precio del día o promedio del periodo · h, l = extremos del rango · u = precio del último día del periodo
  // dem = demanda que califica el USDA (1 baja – 5 muy buena) · volProm = toneladas por semana (para comparar meses)
  function serie(k) {
    const p = ficha(k), A = anioDe(k), f = usaKg(k) ? 1 / p.kgEmpaque : 1, vol = p.volSemana ?? {}, dem = p.demanda ?? [];
    const dias = p.dias.map((d, j) => ({ md: d[0], c: d[1] * f, l: d[2] * f, h: d[3] * f, sem: lunes(d[0], A), cr: d[4], dem: dem[j] ?? null }));
    const agrupar = clave => {
      const g = new Map();
      dias.forEach(d => { const c = clave(d); if (!g.has(c)) g.set(c, []); g.get(c).push(d); });
      return [...g.entries()];
    };
    const conPrev = a => { a.forEach((x, j) => { x.prev = j ? a[j - 1].c : null; }); return a; };
    const semanas = conPrev(agrupar(d => d.sem).map(([sem, ds]) => ({ ...periodo(ds, tx("Semana del ", "Week of ") + fd(ds[0].md), vol[sem] ?? null), sem, volProm: vol[sem] ?? null })));
    const semI = new Map(semanas.map((s, j) => [s.sem, j]));
    let out;
    if (op.tf === "D") {
      out = conPrev(dias.map(d => ({ ...d, titulo: (F.semanal ? tx("Semana al ", "Week ending ") : tx("Día ", "")) + fd(d.md), u: d.c, vol: vol[d.sem] ?? null, semI: semI.get(d.sem) })));
    } else if (op.tf === "S") {
      out = semanas;
    } else {
      out = conPrev(agrupar(d => d.md.slice(0, 2)).map(([m, ds]) => {
        const vs = semanas.filter(s => s.md.slice(0, 2) === m && s.vol != null);   // semana → mes de su primer día hábil
        const total = vs.length ? vs.reduce((a, s) => a + s.vol, 0) : null;
        return { ...periodo(ds, `${(en() ? MES_L_EN : MES_L)[+m - 1]} ${A}`, total), volProm: total == null ? null : total / vs.length };
      }));
    }
    return { p, v: out, dias, semanas };
  }
  function periodo(ds, titulo, vol) {
    const dm = ds.map(x => x.dem).filter(x => x != null);
    return { md: ds[0].md, titulo, vol, c: ds.reduce((a, x) => a + x.c, 0) / ds.length,
      h: Math.max(...ds.map(x => x.h)), l: Math.min(...ds.map(x => x.l)), u: ds.at(-1).c,
      dem: dm.length ? dm.reduce((a, b) => a + b, 0) / dm.length : null };
  }
  const sube = x => x.prev == null || x.c >= x.prev;

  // ---------- Demanda (USDA) y lectura combinada de precio y volumen ----------
  const NIVELES = [[1.75, "Baja", "#2F6FA8"], [2.5, "Algo baja", "#6FA3CF"], [3.5, "Normal", "#55615A"], [4.25, "Buena", "#D9913F"], [9, "Muy buena", "#F7B955"]];
  const nivel = v => v == null ? null : NIVELES.find(n => v < n[0]);
  function lectura(a, b, cual, sinVol) {
    if (!a || !b) return "";
    const dp = a.c / b.c - 1, P = Math.abs(dp) < 0.02 ? 0 : Math.sign(dp);
    const cualTxt = tx(cual, cual === "mes anterior" ? "previous month" : "previous week");
    if (a.volProm == null || b.volProm == null)
      return en()
        ? `Price ${P > 0 ? "rising" : P < 0 ? "falling" : "steady"} (${sp(dp)} vs ${cualTxt}); ${sinVol
          ? `the USDA does not report the volume ${F.verboVolEn ?? "crossing from Mexico"} for this commodity, so there is no price-vs-volume reading.`
          : "volume for this period is not published yet."}`
        : `Precio ${P > 0 ? "al alza" : P < 0 ? "a la baja" : "estable"} (${sp(dp)} vs ${cual}); ${sinVol
          ? `el USDA no reporta el volumen ${F.verboVol ?? "que cruza de México"} de esta mercancía, así que no hay lectura de precio contra volumen.`
          : "el volumen de este periodo aún no se publica."}`;
    const dv = a.volProm / b.volProm - 1, V = Math.abs(dv) < 0.05 ? 0 : Math.sign(dv);
    const mas = F.id === "origen" ? tx("se embarca más", "more is shipped") : tx("cruza más producto", "more product crosses");
    const menos = F.id === "origen" ? tx("se embarca menos", "less is shipped") : tx("cruza menos producto", "less product crosses");
    const txt = (en() ? {
      "1,1": `Demand is pulling: the price rises even though ${mas}.`,
      "-1,1": `Oversupply: ${mas} and the price falls.`,
      "1,-1": `Short supply: ${menos} and the price rises.`,
      "-1,-1": `Demand is cooling: ${menos} and the price still falls.`,
      "0,0": "Stable market: price and volume almost unchanged.",
      "0,1": `The price holds even though ${mas}.`,
      "0,-1": `The price holds even though ${menos}.`,
      "1,0": "The price rises on the same volume.",
      "-1,0": "The price falls on the same volume."
    } : {
      "1,1": `La demanda está jalando: sube el precio aunque ${mas}.`,
      "-1,1": `Sobra producto: ${mas} y el precio baja.`,
      "1,-1": `Falta producto: ${menos} y el precio sube.`,
      "-1,-1": `La demanda se enfría: ${menos} y aun así baja el precio.`,
      "0,0": "Mercado estable: precio y volumen casi sin cambio.",
      "0,1": `El precio aguanta aunque ${mas}.`,
      "0,-1": `El precio se sostiene aunque ${menos}.`,
      "1,0": "El precio sube con el mismo volumen.",
      "-1,0": "El precio baja con el mismo volumen."
    })[`${P},${V}`];
    return `${txt} <span class="gfr-cifras">${tx("Precio", "Price")} ${sp(dp)} · ${tx("volumen", "volume")} ${sp(dv)} vs ${cualTxt}.</span>`;
  }

  // ---------- Gráfico (SVG) ----------
  function grafico(k, modo, i, S) {
    const T = TAM[modo], { v } = S, N = v.length, PW = T.W - T.AX, slot = PW / N;
    const lo = Math.min(...v.map(x => x.l)), hi = Math.max(...v.map(x => x.h));
    const crudo = (hi - lo) / (modo === "grande" ? 5 : 4), pot = 10 ** Math.floor(Math.log10(crudo));
    const paso = [1, 2, 2.5, 5, 10].map(m => m * pot).find(x => x >= crudo);
    const yMin = Math.max(0, Math.floor((lo - paso * 0.4) / paso) * paso), yMax = Math.ceil((hi + paso * 0.6) / paso) * paso;
    const y = q => (yMax - q) / (yMax - yMin) * T.PH;
    const cx = j => (j + 0.5) * slot, f1 = n => n.toFixed(1);
    // Alturas: precio (0–PH), volumen (V0–V0+VH), franja de demanda (D0–D0+DH) y meses
    const VH = F.volumen ? T.VH : 0, DH = F.demanda ? (modo === "grande" ? 16 : 11) : 0;
    const V0 = T.PH + T.GAP, D0 = V0 + VH + (F.demanda ? T.fs + 8 : 0), H = D0 + DH + T.fs + 8, id = `gfr${++uid}`;

    const ejes = [];
    for (let q = yMin; q <= yMax + 1e-9; q += paso)
      ejes.push(`<line x1="0" x2="${PW}" y1="${f1(y(q))}" y2="${f1(y(q))}" class="g-rejilla"/><text x="${PW + 6}" y="${f1(y(q) + T.fs * 0.35)}" class="g-eje">${q.toFixed(paso < 1 ? 2 : 0)}</text>`);

    const linea = v.map((x, j) => `${f1(cx(j))},${f1(y(x.c))}`).join(" ");
    const banda = op.rango ? `<polygon points="${v.map((x, j) => `${f1(cx(j))},${f1(y(x.h))}`).join(" ")} ${v.map((x, j) => `${f1(cx(j))},${f1(y(x.l))}`).reverse().join(" ")}" fill="${AZUL}" fill-opacity=".1"/>` : "";
    const per = PERIODO_MA[op.tf];
    const ma = op.ma ? v.map((x, j) => j < per - 1 ? null : `${f1(cx(j))},${f1(y(v.slice(j - per + 1, j + 1).reduce((a, b) => a + b.c, 0) / per))}`).filter(Boolean).join(" ") : "";

    // Nodos y etiquetas: más alto, más bajo y último; en el tamaño grande, nodo en cada semana o mes y etiqueta en cada mes
    const iMax = v.reduce((m, x, j) => x.c > v[m].c ? j : m, 0), iMin = v.reduce((m, x, j) => x.c < v[m].c ? j : m, 0);
    const clave = j => j === iMax || j === iMin || j === N - 1;
    const conNodo = j => clave(j) || (op.tf === "M") || (op.tf === "S" && T.nodos === "semana");
    const conEtq = j => clave(j) || (op.tf === "M" && T.etiquetas === "mes");
    const nodos = v.map((x, j) => conNodo(j) ? `<circle cx="${f1(cx(j))}" cy="${f1(y(x.c))}" r="${T.nodo}" class="g-nodo" filter="url(#${id}b)"/>` : "").join("");
    const etiquetas = v.map((x, j) => {
      if (!conEtq(j)) return "";
      const t = n2(x.c), w = t.length * T.fs * 0.62 + 8, h = T.fs + 6;
      const ex = Math.min(Math.max(cx(j), w / 2), PW - w / 2), ey = y(x.c) - T.nodo - 5 - h;
      return `<g class="g-etq"><rect x="${f1(ex - w / 2)}" y="${f1(ey)}" width="${f1(w)}" height="${h}" rx="3"/><text x="${f1(ex)}" y="${f1(ey + h - 4)}" text-anchor="middle">${t}</text></g>`;
    }).join("");

    // Volumen: por semana; en la vista diaria, una barra que abarca los días de cada semana
    let barras;
    if (op.tf === "D") {
      const g = {};
      v.forEach((x, j) => { (g[x.sem] ??= []).push(j); });
      barras = Object.values(g).map(js => ({ x: js[0] * slot + 0.5, w: js.length * slot - 1, vol: v[js[0]].vol, col: "#6B7A6E" }));
    } else {
      const w = Math.max(1.5, slot * 0.62);
      barras = v.map((x, j) => ({ x: cx(j) - w / 2, w, vol: x.vol, col: sube(x) ? UP : DN }));
    }
    const vmax = Math.max(1, ...barras.map(b => b.vol ?? 0));
    const vol = !F.volumen ? "" : barras.filter(b => b.vol).map(b => { const h = b.vol / vmax * (T.VH - T.fs - 8); return `<rect x="${f1(b.x)}" y="${f1(V0 + T.VH - h)}" width="${f1(b.w)}" height="${f1(h)}" fill="${b.col}" opacity=".5"/>`; }).join("");

    // Franja de demanda: una celda por día, semana o mes, del azul (baja) al naranja (muy buena)
    const celdas = v.map((x, j) => {
      const n = nivel(x.dem);
      return n ? `<rect x="${f1(j * slot + (slot > 3 ? 0.5 : 0))}" y="${D0}" width="${f1(slot > 3 ? slot - 1 : slot + 0.2)}" height="${DH}" fill="${n[2]}"/>` : "";
    }).join("");

    // Meses en el eje horizontal
    let ant = "";
    const meses = v.map((x, j) => {
      const m = x.md.slice(0, 2);
      if (m === ant) return "";
      ant = m;
      const xx = op.tf === "M" ? cx(j) : j * slot;
      return `<text x="${f1(xx)}" y="${H - 2}" class="g-mes"${op.tf === "M" ? ' text-anchor="middle"' : ""}>${(en() ? MES_EN : MES)[+m - 1].toUpperCase()}</text>`;
    }).join("");

    const L_ = v[N - 1], h = v[i], tag = (yy, txt, fondo, tinta) => {
      const w = txt.length * T.fs * 0.62 + 8;
      return `<rect x="${PW + 1}" y="${f1(yy - T.fs / 2 - 3)}" width="${f1(w)}" height="${T.fs + 6}" rx="2" fill="${fondo}"/><text x="${PW + 5}" y="${f1(yy + T.fs * 0.35)}" class="g-tag" fill="${tinta}">${txt}</text>`;
    };
    return `
      <svg class="gfr-svg" viewBox="0 0 ${T.W} ${H}" role="img" aria-label="${L(F.titulo)} ${tx("durante", "during")} ${anioDe(k)}" style="font-size:${T.fs}px">
        <defs><filter id="${id}b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="${modo === "grande" ? 5 : 3.5}" result="h"/><feMerge><feMergeNode in="h"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        ${ejes.join("")}
        <line x1="${PW}" x2="${PW}" y1="0" y2="${T.PH}" class="g-borde"/>
        ${banda}
        <polyline points="${linea}" fill="none" stroke="${AZUL}" stroke-opacity=".35" stroke-width="${modo === "grande" ? 7 : 5}" stroke-linejoin="round" stroke-linecap="round" filter="url(#${id}b)"/>
        <polyline points="${linea}" fill="none" stroke="${AZUL2}" stroke-width="${modo === "grande" ? 2.2 : 1.8}" stroke-linejoin="round" stroke-linecap="round"/>
        ${ma ? `<polyline points="${ma}" fill="none" stroke="${AMARILLO}" stroke-width="${modo === "grande" ? 1.6 : 1.3}" stroke-linejoin="round"/>` : ""}
        ${nodos}${etiquetas}
        ${F.volumen ? `<line x1="0" x2="${PW}" y1="${V0}" y2="${V0}" class="g-borde"/>
        <text x="0" y="${V0 + T.fs + 3}" class="g-eje g-vol-t">${en() ? F.etqVolEn ?? "VOLUME CROSSING · t/week" : F.etqVol ?? "VOLUMEN QUE CRUZA · t/semana"}</text>
        ${sinVolumen(k) ? `<text x="${PW / 2}" y="${V0 + T.VH / 2 + T.fs}" text-anchor="middle" class="g-eje">${en() ? `The USDA does not report the volume ${F.verboVolEn ?? "crossing from Mexico"} for this commodity` : `El USDA no reporta el volumen ${F.verboVol ?? "que cruza de México"} de esta mercancía`}</text>` : ""}
        ${modo === "grande" ? `<text x="${PW + 6}" y="${V0 + T.fs + 3}" class="g-eje">${ton(vmax === 1 ? null : vmax)}</text>` : ""}
        ${vol}` : ""}
        ${F.demanda ? `<text x="0" y="${D0 - 4}" class="g-eje g-vol-t">${tx("DEMANDA · CALIFICACIÓN USDA", "DEMAND · USDA RATING")}</text>
        ${celdas}` : ""}
        ${meses}
        <line x1="${f1(cx(i))}" x2="${f1(cx(i))}" y1="0" y2="${Math.max(T.PH, D0 + DH)}" class="g-cursor"/>
        <line x1="0" x2="${PW}" y1="${f1(y(h.c))}" y2="${f1(y(h.c))}" class="g-cursor g-cursor-h"/>
        <circle cx="${f1(cx(i))}" cy="${f1(y(h.c))}" r="${T.cursor}" class="g-punto" filter="url(#${id}b)"/>
        ${tag(y(L_.c), n2(L_.c), sube(L_) ? UP : DN, "#0B120D")}
        ${i !== N - 1 ? tag(y(h.c), n2(h.c), "#EEEBE3", "#0B120D") : ""}
        <rect class="gfr-hit" x="0" y="0" width="${PW}" height="${Math.max(T.PH, D0 + DH)}" fill="transparent" data-n="${N}" data-pw="${PW}" data-w="${T.W}"/>
      </svg>`;
  }

  // ---------- Bloque completo ----------
  function vista(k, modo, iSel) {
    if (F.semanal && op.tf === "D") op.tf = "S";   // supermercado: semanal (si otro gráfico quedó en diario)
    const S = serie(k), { p, v } = S, N = v.length, i = iSel != null && iSel < N ? iSel : N - 1, h = v[i], L_ = v[N - 1];
    const grande = modo === "grande", A = anioDe(k);
    const todos = S.dias.map(d => d.c), prom = todos.reduce((a, b) => a + b, 0) / todos.length;
    const mayoreo = F.id === "mayoreo", eua = F.id === "eua", origenEU = F.id === "origen", cons = F.id === "consumidor";
    const unidad = mayoreo ? "$/kg" : usaKg(k) ? "US$/kg" : cons ? "US$ " + presentacionES(p.empaque) : tx("US$/caja", "US$/box");
    const cruces = Object.keys(p.cruces ?? {}).map(c => origenEU || cons || eua ? lugar(c, p) : nombreCruce(c));
    const btn = (accion, on, txt, extra = "") => `<button type="button" class="gfr-btn${on ? " on" : ""}" data-gfr-accion="${accion}" aria-pressed="${on}"${extra}>${txt}</button>`;
    const stats = [
      [op.tf === "D" ? tx("Precio del día", "Day price") : tx("Precio promedio", "Average price"), n2(h.c)], [L(F.alto), n2(h.h)], [L(F.bajo), n2(h.l)],
      [F.semanal ? tx("Última semana", "Last week") : tx("Último día", "Last day"), n2(h.u)],
      [tx("Cambio", "Change"), h.prev != null ? sp(h.c / h.prev - 1) : "—", h.prev != null ? (sube(h) ? UP : DN) : null],
      mayoreo ? [tx("Centrales", "Markets"), String(p.centrales ?? "—")] : eua ? [tx("Mercados", "Markets"), String(Object.keys(p.cruces ?? {}).length)]
        : cons ? [tx("Tiendas con oferta", "Stores advertising"), p.tiendas?.at(-1)?.toLocaleString("es-MX") ?? "—"]
        : [op.tf === "M" ? tx("Volumen mes", "Month volume") : tx("Volumen semana", "Week volume"), ton(h.vol)]
    ];
    if (grande) stats.push([`${tx("Promedio", "Average")} ${A}`, n2(prom)], [`${tx("Rango", "Range")} ${A}`, `${n2(Math.min(...todos))}–${n2(Math.max(...todos))}`]);
    const base = D().productos[k], variantes = base.variantes;
    const nombre = nombreDe(k) + (variantes ? ` · ${varNombre(p)}` : "");
    const selVariedad = variantes ? `<label class="gfr-variedad"><span>${tx("Variedad", "Variety")}</span><select data-gfr-variedad="${k}">${variantes.map((x, j) =>
      `<option value="${j}"${x.nombre === p.nombre ? " selected" : ""}>${varNombre(x)}</option>`).join("")}</select></label>` : "";
    const pcs = !p.origenSel && variedadDe(k)?.porCruce, pos = variedadDe(k)?.porOrigen, origen = p.origenSel ?? p.origenBase;
    const selOrigen = eua && pos ? `<label class="gfr-variedad"><span>${tx("Origen", "Origin")}</span><select data-gfr-origen="${k}"><option value="">${L(variedadDe(k).origenBase)}</option>${Object.keys(pos).map(o =>
      `<option value="${o}"${o === p.origenSel ? " selected" : ""}>${L(o)}</option>`).join("")}</select></label>` : "";
    const selCruce = pcs ? `<label class="gfr-variedad"><span>${eua ? tx("Ciudad", "City") : origenEU || cons ? tx("Región", "Region") : tx("Cruce", "Crossing")}</span><select data-gfr-cruce="${k}"><option value="">${tx("Todos", "All")}</option>${Object.keys(pcs).map(c =>
      `<option value="${c}"${c === p.cruceSel ? " selected" : ""}>${eua || origenEU || cons ? lugar(c, p) : nombreCruce(c)}</option>`).join("")}</select></label>` : "";
    const kgTxt = mayoreo || cons ? "" : p.kgEmpaque ? ` (${p.kgEmpaque} kg)` : tx(" (la caja no trae peso: solo US$ por caja)", " (the box has no stated weight: US$ per box only)");
    const cruceSel = p.cruceSel ? lugar(p.cruceSel, p) : null, origenL = L(origen);
    // Demanda del día o promedio del periodo, y lectura de precio contra volumen (en la vista diaria, de su semana)
    const dn = nivel(h.dem), sem = S.semanas;
    const lect = op.tf === "D"
      ? (h.semI > 0 ? `<b>${tx("Semana del", "Week of")} ${fd(sem[h.semI].md)}:</b> ${lectura(sem[h.semI], sem[h.semI - 1], "semana anterior", sinVolumen(k))}` : "")
      : lectura(h, v[i - 1], op.tf === "S" ? "semana anterior" : "mes anterior", sinVolumen(k));
    const nCruces = Object.keys(p.cruces ?? {}).length;
    const ticketTxt = en()
      ? (mayoreo ? `<b>${ticker(k)} · WHOLESALE MX</b> ${p.centrales} WHOLESALE MARKETS · SNIIM`
        : origenEU ? `<b>${ticker(k)} · U.S. ORIGIN</b> FOB ${(cruceSel ?? nCruces + " PRODUCING REGIONS").toUpperCase()}`
        : cons ? `<b>${ticker(k)} · U.S. RETAIL</b> ${(cruceSel ?? "National").toUpperCase()} · AD PRICE`
        : eua ? `<b>${ticker(k)} · U.S. WHOLESALE</b> ORIGIN ${origenL.toUpperCase()} · ${cruceSel ? cruceSel.toUpperCase() : nCruces + " TERMINAL MARKETS"}`
        : p.mixto ? `<b>${ticker(k)} · MIXED</b> ${L(Object.keys(p.cruces)[0]).replace(" (mixed)", "").toUpperCase()} · MEXICO AND U.S.`
        : `<b>${ticker(k)} · MX→US</b> FOB ${(cruces.length === 1 ? cruces[0] : cruces.join(" · ")).toUpperCase()}`)
      : (mayoreo ? `<b>${ticker(k)} · MAYOREO MX</b> ${p.centrales} CENTRALES DE ABASTO · SNIIM`
        : origenEU ? `<b>${ticker(k)} · ORIGEN EE. UU.</b> FOB ${(cruceSel ?? (nCruces + " REGIONES PRODUCTORAS")).toUpperCase()}`
        : cons ? `<b>${ticker(k)} · SUPERMERCADO EE. UU.</b> ${(cruceSel ?? "Nacional").toUpperCase()} · PRECIO DE OFERTA`
        : eua ? `<b>${ticker(k)} · MAYOREO EE. UU.</b> ORIGEN ${origen.toUpperCase()} · ${cruceSel ? cruceSel.toUpperCase() : nCruces + " MERCADOS TERMINALES"}`
        : p.mixto ? `<b>${ticker(k)} · MIXTO</b> ${Object.keys(p.cruces)[0].replace(" (mixto)", "").toUpperCase()} · MÉXICO Y EE. UU.`
        : `<b>${ticker(k)} · MX→US</b> FOB ${(cruces.length === 1 ? cruces[0] : cruces.join(" · ")).toUpperCase()}`);
    const presTxt = en() ? (p.presentacionEn ?? p.presentacion) : p.presentacion;
    const subTxt = en()
      ? (mayoreo ? "Most frequent price per kg · first grade · SNIIM, Ministry of Economy"
        : eua ? `${empaqueTxt(p)}${kgTxt} · origin ${origenL} · USDA AMS, terminal markets`
        : origenEU ? `${empaqueTxt(p)}${kgTxt} · U.S. product · USDA AMS, shipping point`
        : cons ? `${p.empaque}${presTxt ? " · " + presTxt : ""} · supermarket ads · USDA AMS`
        : `${empaqueTxt(p)}${kgTxt} · conventional · USDA AMS`)
      : (mayoreo ? "Precio frecuente por kg · calidad primera · SNIIM, Secretaría de Economía"
        : eua ? `<span${tn()}>${empaqueTxt(p)}</span>${kgTxt} · origen ${origen} · USDA AMS, mercados terminales`
        : origenEU ? `<span${tn()}>${empaqueTxt(p)}</span>${kgTxt} · producto de EE. UU. · USDA AMS, punto de embarque`
        : cons ? `${presentacionES(p.empaque)}${p.presentacion ? " · " + p.presentacion : ""} · ofertas de supermercado · USDA AMS`
        : `<span${tn()}>${empaqueTxt(p)}</span>${kgTxt} · convencional · USDA AMS`);
    const lugares = (p.cruceSel ? [cruceSel] : Object.keys(p.cruces ?? {}).map(c => lugar(c, p)));
    const hasta = fd(S.dias.at(-1).md);
    const merc = mercanciaTxt(p, k), emp = empaqueTxt(p);
    const nota = en()
      ? (mayoreo ? `Wholesale price (most frequent price) of ${p.nombre ? "the " + varNombre(p) + " variety" : "this product"}, first grade, per kg, in ${p.centrales} wholesale markets reported by SNIIM, one data point per business day from Jan 1 to ${hasta}, ${A}.
        Line: median of the day's quotes (all markets and origins) or the weekly or monthly average; labels on the highest, lowest and latest.
        Range across markets: 10th and 90th percentiles of the day's quotes (how differently each market sells). Quotes outside 1/3–3× the year's median are discarded.
        SNIIM does not publish volume or demand. ${txtMa()} moving average. Source: SNIIM, Ministry of Economy.`
        : origenEU ? `FOB shipping-point price of U.S. product (${lugares.slice(0, 4).join(", ")}): ${merc}, ${emp}${kgTxt}, no organics, from Jan 1 to ${hasta}, ${A}. It is the direct competitor of Mexican product at the same level as the border price.
        Line: median of the day's quotes across all regions (or the selected one) or the weekly or monthly average. Range: USDA low–high. Volume: tonnes shipped per week from U.S. regions (report 1662); green if the price rose, orange if it fell.
        Demand: the USDA reporter's rating at the shipping point. Mexican and Canadian crossings and import ports are excluded. ${txtMa()} moving average. Source: USDA AMS Market News.`
        : cons ? `Average advertised price for the week in U.S. supermarkets (${cruceSel ?? "national"}), weighted by number of stores: ${p.empaque}${presTxt ? ", " + presTxt : ""}, conventional, through the week ending ${hasta}, ${A}.
        It is the promotional price, not the everyday shelf price: it tracks the level and the deals. Range: lowest and highest price across the six regions. ${p.kgEmpaque ? "US$/kg uses the package weight." : "Sold by the piece or bunch: no per-kg equivalent."} ${txtMa()} moving average. Source: USDA AMS, Weekly Grocery Store Specialty Crops Feature Activity.`
        : eua ? `Wholesale price in U.S. terminal markets (${lugares.join(", ")}), origin ${origenL}: ${merc}, ${emp}${kgTxt}, no organics, from Jan 1 to ${hasta}, ${A}.
        Line: median of the day's quotes (markets, sizes and varieties of the same package) or the weekly or monthly average. Range across markets: 10th and 90th percentiles of the day's quotes.
        The origin selector shows the same package from the U.S., other countries or all origins: the difference from Mexican product is what the market pays for origin. Terminal markets do not publish volume or demand per quote. ${txtMa()} moving average. Source: USDA AMS Market News.`
        : `${p.mixto ? `FOB price for the ${L(Object.keys(p.cruces)[0]).replace(" (mixed)", "")} region (the USDA lumps together product from Mexico and from California and Arizona; the Mexican share cannot be separated):` : `FOB price of Mexican product crossing at ${cruces.join(", ")}${p.cruceSel ? " (this crossing only)" : ""}:`} ${merc}${presTxt && presTxt !== "n/a" ? ", " + presTxt : ""}, ${emp}${kgTxt}, no organics, one data point per business day from Jan 1 to ${hasta}, ${A}.
        Line: each day's price (1D) or the average of the week's or month's business days (1W, 1M); labels on the highest, lowest and latest. Range: low–high reported by the USDA.
        Volume: tonnes of this commodity that crossed from Mexico each week (USDA, report 1662); green if the price rose vs the previous period, orange if it fell. ${txtMa()} moving average.
        Demand: the rating the USDA reporter gives each day to buyer activity at the crossing (from low to very good), averaged over the week or month; it is a market thermometer, not measured consumption.
        Reading: compares price and volume with the previous period; changes under 2% in price or 5% in volume count as stable. Source: USDA AMS Market News.`)
      : (mayoreo ? `Precio de mayoreo (precio frecuente) de ${p.nombre ? "la variedad " + p.nombre : "este producto"}, calidad primera, por kg, en ${p.centrales} centrales de abasto que reporta el SNIIM, un dato por día hábil del 1 de enero al ${hasta} de ${A}.
        Línea: mediana de las cotizaciones del día (todas las centrales y orígenes) o promedio de la semana o del mes; etiquetas en el más alto, el más bajo y el último.
        Rango entre centrales: percentiles 10 y 90 de las cotizaciones del día (qué tan distinto se vende en cada central). Se descartan cotizaciones fuera de 1/3–3× la mediana del año.
        El SNIIM no publica volumen ni demanda. Media móvil de ${txtMa()}. Fuente: SNIIM, Secretaría de Economía.`
        : origenEU ? `Precio FOB en el punto de embarque del producto de EE. UU. (${lugares.slice(0, 4).join(", ")}): <span${tn()}>${merc}, ${emp}</span>${kgTxt}, sin orgánicos, del 1 de enero al ${hasta} de ${A}. Es la competencia directa del producto mexicano al mismo nivel que el precio en la frontera.
        Línea: mediana de las cotizaciones del día de todas las regiones (o de la elegida) o promedio de la semana o del mes. Rango: bajo–alto del USDA. Volumen: toneladas embarcadas por semana de las regiones de EE. UU. (reporte 1662); verde si el precio subió, naranja si bajó.
        Demanda: la calificación del reportero del USDA en el punto de embarque. Se excluyen los cruces de México y Canadá y los puertos de importación. Media móvil de ${txtMa()}. Fuente: USDA AMS Market News.`
        : cons ? `Precio promedio de los anuncios de oferta de la semana en supermercados de EE. UU. (${p.cruceSel ?? "nacional"}), ponderado por número de tiendas: ${presentacionES(p.empaque)}${p.presentacion ? ", " + p.presentacion : ""}, convencional, hasta la semana al ${hasta} de ${A}.
        Es el precio de promoción, no el de anaquel de todos los días: sirve para seguir el nivel y las ofertas. Rango: precio más bajo y más alto entre las seis regiones. ${p.kgEmpaque ? "US$/kg con el peso de la presentación." : "Se vende por pieza o manojo: sin equivalente en kg."} Media móvil de ${txtMa()}. Fuente: USDA AMS, Weekly Grocery Store Specialty Crops Feature Activity.`
        : eua ? `Precio de mayoreo en los mercados terminales de EE. UU. (${lugares.join(", ")}), origen ${origen}: <span${tn()}>${merc}, ${emp}</span>${kgTxt}, sin orgánicos, del 1 de enero al ${hasta} de ${A}.
        Línea: mediana de las cotizaciones del día (mercados, tamaños y variedades del mismo empaque) o promedio de la semana o del mes. Rango entre mercados: percentiles 10 y 90 de las cotizaciones del día.
        Con el selector de origen se ve el mismo empaque de EE. UU., de otros países o de todos los orígenes: la diferencia con el mexicano es lo que paga el mercado por el origen. Los mercados terminales no publican volumen ni demanda por cotización. Media móvil de ${txtMa()}. Fuente: USDA AMS Market News.`
        : `${p.mixto ? `Precio FOB de la región de ${cruces[0].replace(" (mixto)", "")} (el USDA junta producto de México y de California y Arizona; no se puede separar el mexicano):` : `Precio FOB del producto mexicano al cruzar por ${cruces.join(", ")}${p.cruceSel ? " (solo este cruce)" : ""}:`} <span${tn()}>${merc}${p.presentacion && p.presentacion !== "n/a" ? ", " + p.presentacion : ""}, ${emp}</span>${kgTxt}, sin orgánicos, un dato por día hábil del 1 de enero al ${hasta} de ${A}.
        Línea: precio de cada día (1D) o promedio de los días hábiles de la semana o del mes (1S, 1M); etiquetas en el más alto, el más bajo y el último. Rango: bajo–alto que reportó el USDA.
        Volumen: toneladas de esta mercancía que cruzaron de México cada semana (USDA, reporte 1662); verde si el precio subió contra el periodo anterior, naranja si bajó. Media móvil de ${txtMa()}.
        Demanda: la calificación que da cada día el reportero del USDA a la actividad de los compradores en el cruce (de baja a muy buena), promediada en la semana o el mes; es un termómetro del mercado, no consumo medido.
        Lectura: compara el precio y el volumen con el periodo anterior; cambios menores a 2% en precio o a 5% en volumen se toman como estables. Fuente: USDA AMS Market News.`);
    const sem1 = tx("1S", "1W");
    return `
      <div class="gfr-cab">
        <div class="gfr-id">
          <span class="gfr-ticker">${ticketTxt}</span>
          ${grande ? `<div class="gfr-nombre"><span>${nombre}</span><small>${subTxt}</small></div>` : ""}
        </div>
        <div class="gfr-precio">
          <b>${n2(S.dias.at(-1).c)}</b>
          <span><i style="color:${sube(L_) ? UP : DN}">${L_.prev != null ? `${sg(L_.c - L_.prev)} (${sp(L_.c / L_.prev - 1)})` : ""}</i><small>${unidad} · ${vsTxt()} · ${tx("al", "as of")} ${fd(S.dias.at(-1).md)} ${A}</small></span>
        </div>
      </div>
      <div class="gfr-controles">
        <div class="gfr-grupo" role="group" aria-label="${tx("Periodo", "Period")}">${[["D", "1D", tx("Diario", "Daily")], ["S", sem1, tx("Semanal", "Weekly")], ["M", "1M", tx("Mensual", "Monthly")]].filter(([t]) => !(F.semanal && t === "D")).map(([t, l, ti]) => btn("tf:" + t, op.tf === t, l, ` title="${ti}"`)).join("")}</div>
        ${btn("rango", op.rango, `<svg width="15" height="9" viewBox="0 0 16 10" aria-hidden="true"><path d="M1 3 L6 1 L10 4 L15 2 L15 8 L10 9 L6 7 L1 8 Z" fill="${AZUL}" fill-opacity=".4"/></svg>${tx("Rango", "Range")}`, ' data-suelto="1"')}
        ${selVariedad}${selOrigen}${selCruce}
        ${p.kgEmpaque ? `<div class="gfr-grupo" role="group" aria-label="${tx("Unidad", "Unit")}">${btn("unidad:caja", !usaKg(k), cons ? presentacionES(p.empaque) : grande ? tx("US$/caja", "US$/box") : tx("Caja", "Box"))}${btn("unidad:kg", usaKg(k), grande ? "US$/kg" : "Kg")}</div>` : ""}
        ${btn("ma", op.ma, `<svg width="15" height="9" viewBox="0 0 16 10" aria-hidden="true"><path d="M1 8 C5 8 6 2 9 3 S13 6 15 2" fill="none" stroke="${AMARILLO}" stroke-width="1.8" stroke-linecap="round"/></svg>${tx("Media", "Avg.")}`, ' data-suelto="1"')}
        ${btn("comparar", false, `<svg width="14" height="12" viewBox="0 0 24 20" aria-hidden="true"><path d="M2 15l6-6 4 3 5-7 5 4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 11l6 1.5 4-3.5 5 2.5 5-3" fill="none" stroke="${DN}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>${tx("Comparar", "Compare")}`, ` data-suelto="1" aria-label="${tx("Comparar con otros productos", "Compare with other products")}" title="${tx("Comparar con otros productos (Analizar precios)", "Compare with other products (Analyze prices)")}"`)}
        ${grande ? "" : btn("ampliar", false, `<svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>${tx("Ampliar", "Expand")}`, ` data-suelto="1" aria-label="${tx("Ampliar el gráfico", "Expand the chart")}"`)}
      </div>
      ${p.mixto ? `<div class="gfr-aviso">${en()
        ? `<b>Mixed price:</b> the USDA quotes this product only in the ${L(Object.keys(p.cruces)[0]).replace(" (mixed)", "")} region, where it lumps into one price product crossing from Mexico and production from California and Arizona. It is a reference for its value, but not the price of Mexican product alone.`
        : `<b>Precio mixto:</b> el USDA cotiza este producto solo en la región de ${Object.keys(p.cruces)[0].replace(" (mixto)", "")}, donde junta en un mismo precio producto que cruza de México y producción de California y Arizona. Sirve como referencia de cuánto vale, pero no es solo el precio del producto mexicano.`}</div>` : ""}
      ${eua && !p.origenSel && p.origenBase !== "México" ? `<div class="gfr-aviso">${tx("A estos mercados casi no llega producto mexicano en el empaque de referencia: la serie es de todos los orígenes.", "Almost no Mexican product reaches these markets in the reference package: the series covers all origins.")}</div>` : ""}
      ${A < D().anio ? `<div class="gfr-aviso">${tx(`Todavía hay pocos días de ${D().anio} para este producto: se muestra ${A} completo hasta que el año nuevo junte al menos un mes de cotizaciones.`, `There are still few days of ${D().anio} for this product: all of ${A} is shown until the new year has at least a month of quotes.`)}</div>` : ""}
      <div class="gfr-stats${grande ? " ocho" : ""}">${stats.map(([t, val, col]) => `<div><span>${t}</span><b${col ? ` style="color:${col}"` : ""}>${val}</b></div>`).join("")}</div>
      ${F.demanda ? `<div class="gfr-senal">
        <span class="gfr-dem"><i style="background:${dn?.[2] ?? "#55615A"}"></i>${op.tf === "D" ? tx("Demanda del día", "Day demand") : tx("Demanda promedio", "Average demand")}: <b>${dn ? L(dn[1]) : tx("sin calificar", "not rated")}</b></span>
        ${lect ? `<span class="gfr-lect">${lect}</span>` : ""}
      </div>` : ""}
      <div class="gfr-tarjeta">
        <div class="gfr-lectura">
          <b>${h.titulo}</b>
          ${grande ? `<span>${op.tf === "D" ? tx("Precio", "Price") : tx("Promedio", "Average")} <em>${n2(h.c)}</em></span><span>${mayoreo || eua ? tx("Alto", "High") : tx("Máx", "High")} <em>${n2(h.h)}</em></span><span>${mayoreo || eua ? tx("Bajo", "Low") : tx("Mín", "Low")} <em>${n2(h.l)}</em></span><span>${tx("Último", "Last")} <em>${n2(h.u)}</em></span>${h.prev != null ? `<span style="color:${sube(h) ? UP : DN}">${sg(h.c - h.prev)} ${sp(h.c / h.prev - 1)}</span>` : ""}` : ""}
          <span class="gfr-leyenda">
            ${grande ? `<span><i class="l-precio"></i>${tx("Precio", "Price")}</span>` : ""}
            ${op.rango ? `<span><i class="l-rango"></i>${L(F.rango)}</span>` : ""}
            ${op.ma ? `<span><i class="l-ma"></i>${tx(`Media ${txtMa()}`, `${txtMa()} average`)}</span>` : ""}
          </span>
        </div>
        ${grafico(k, modo, i, S)}
        ${F.demanda ? `<div class="gfr-escala"><span>${tx("Demanda", "Demand")}</span>${NIVELES.map(n => `<span><i style="background:${n[2]}"></i>${L(n[1])}</span>`).join("")}</div>` : ""}
      </div>
      <p class="gfr-nota">${nota}</p>`;
  }

  function html(fuente, k) {
    usar(fuente);
    if (!cargado(k)) {   // datos de carga diferida: se pintan cuando llegan (ver llenar)
      return `<h3><span${tno()}>${L(F.titulo)} ${window.FRONTERA_DIARIA?.anio ?? ""}</span> <span class="tag ok">${F.tag}</span></h3>
        <div class="gfr" data-gfr-fuente="${fuente}" data-gfr-k="${k}" data-gfr-modo="panel" data-pendiente="1"${tno()}><p class="gfr-nota">${tx("Cargando la serie diaria…", "Loading the daily series…")}</p></div>`;
    }
    if (!disponible(k)) return "";
    return `<h3><span${tno()}>${L(F.titulo)} ${anioDe(k)}</span> <span class="tag ok">${F.tag}</span></h3><div class="gfr" data-gfr-fuente="${fuente}" data-gfr-k="${k}" data-gfr-modo="panel"${tno()}>${vista(k, "panel")}</div>`;
  }
  // Resumen de la sección (va en el <summary>): en inglés, envuelto con translate="no"
  const envolverRes = t => t && en() ? `<span translate="no">${t}</span>` : t;
  function resumenTxt(fuente, k) {
    usar(fuente);
    if (!cargado(k)) return tx("Cargando la serie diaria…", "Loading the daily series…");
    if (!disponible(k)) return "";
    const p = ficha(k), f = usaKg(k) ? 1 / p.kgEmpaque : 1, c = p.dias.map(d => d[1] * f), M = F.moneda;
    const u = F.id === "mayoreo" || usaKg(k) ? tx("el kg", "per kg") : F.id === "consumidor" ? presentacionES(p.empaque) : tx("la caja", "per box");
    const pre = F.id === "eua" ? `${tx("Origen", "Origin")} ${L(p.origenSel ?? p.origenBase)}${p.cruceSel ? " · " + lugar(p.cruceSel, p) : ""} · ` : "";
    const ult = n2(c.at(-1)), pr = n2(c.reduce((a, b) => a + b, 0) / c.length), mn = n2(Math.min(...c)), mx = n2(Math.max(...c));
    const nom = p.nombre ? varNombre(p) + ": " : "";
    return en()
      ? `${pre}${p.mixto ? "Mixed price (Mexico and U.S.) · " : ""}${nom}Last ${M}${ult} ${u} · ${anioDe(k)} average ${M}${pr} · from ${M}${mn} to ${M}${mx}`
      : `${pre}${p.mixto ? "Precio mixto (México y EE. UU.) · " : ""}${nom}Último ${M}${ult} ${u} · promedio ${anioDe(k)} ${M}${pr} · de ${M}${mn} a ${M}${mx}`;
  }
  const resumen = (fuente, k) => envolverRes(resumenTxt(fuente, k));
  // Escribe el resumen en el <summary> ya pintado
  function ponerResumen(el, t) {
    const r = el.closest("details.seccion")?.querySelector("summary .sec-resumen");
    if (!r) return;
    if (en()) r.setAttribute("translate", "no");
    r.textContent = t;
  }
  const fronteraHTML = k => html("frontera", k), fronteraResumen = k => resumen("frontera", k);
  const mayoreoHTML = k => html("mayoreo", k), mayoreoResumen = k => resumen("mayoreo", k);
  const euaHTML = k => html("eua", k), euaResumen = k => resumen("eua", k);
  const origenHTML = k => html("origen", k), origenResumen = k => resumen("origen", k);
  const consumidorHTML = k => html("consumidor", k), consumidorResumen = k => resumen("consumidor", k);
  const disponibleOrigen = k => window.ORIGEN_EUA?.productos?.[k] ? disponible_(FUENTES.origen, k) : !!window.ORIGEN_EUA_INDICE?.productos?.includes(k);
  // El consumidor es un solo archivo diferido: antes de bajarlo, la lista de productos del índice que viene en el panel de la cadena
  const disponibleConsumidor = k => window.CONSUMIDOR_EUA ? disponible_(FUENTES.consumidor, k) : !!window.CONSUMIDOR_EUA_PRODUCTOS?.includes(k);

  // ---------- De la granja al supermercado en EE. UU. (US$/kg) ----------
  // Promedio de las últimas 8 semanas de cada eslabón diario, en US$/kg (solo si el empaque trae peso); productor: NASS anual
  function promedioKg(base, semanas = 8) {
    if (!base?.dias?.length || !base.kgEmpaque) return null;
    const t = md => { const [m, d] = md.split("-").map(Number); return Date.UTC(base.anio, m - 1, d); };
    const corte = t(base.dias.at(-1)[0]) - semanas * 7 * 864e5;
    const v = base.dias.filter(x => t(x[0]) > corte).map(x => x[1] / base.kgEmpaque);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  }
  // Promedio en US$/kg de los meses dados ("AAAA-MM"): para comparar con el anaquel del BLS en el mismo periodo
  function promedioKgMeses(base, meses) {
    if (!base?.dias?.length || !base.kgEmpaque) return null;
    const v = base.dias.filter(x => meses.includes(`${base.anio}-${x[0].slice(0, 2)}`));
    // cada mes del periodo con al menos 5 cotizaciones: si no, el promedio no sería del periodo que dice la etiqueta
    if (meses.some(m => v.filter(x => `${base.anio}-${x[0].slice(0, 2)}` === m).length < 5)) return null;
    return v.reduce((a, x) => a + x[1] / base.kgEmpaque, 0) / v.length;
  }
  // Variedad de cada eslabón: la misma que la de la frontera cuando el eslabón la cotiza (si no, la principal del eslabón)
  function principalDe(datos, k, nombre) {
    const p = datos?.productos?.[k];
    if (!p) return null;
    return (nombre && p.variantes?.find(v => v.nombre === nombre)) ?? p.variantes?.[p.varOmision ?? 0] ?? p;
  }
  // Variedades del USDA que llegan en inglés en los reportes de embarque y mercados
  const VAR_ES = { yellow: "amarilla", red: "roja", white: "blanca", green: "verde", "crown cut": "corona", "mature greens": "verde maduro",
    roma: "saladette (roma)", "round green type": "redonda verde", "flat type": "hoja lisa", seedless: "sin semilla" };
  const etqVar = b => {
    if (!b) return "";
    if (b.nombre) return varNombre(b);
    const pr = en() ? (b.presentacionEn ?? b.presentacion) : b.presentacion;
    return pr && pr !== "n/a" ? (en() ? pr : VAR_ES[pr] ?? pr) : "";
  };
  // Precio de anaquel (BLS): artículo y periodo del promedio (últimos 3 meses publicados)
  const ARTICULO_ES = { jitomate: "jitomate de campo", papa: "papa blanca", lechuga: "lechuga iceberg", fresa: "fresa (caja de 12 oz)",
    naranja: "naranja Navel", toronja: "toronja", platano: "plátano" };
  function periodoAnaquel(an) {
    const m = an.meses.slice(-3).map(x => x[0]), M = en() ? MES_EN : MES;
    const [a1, m1] = m[0].split("-").map(Number), [a2, m2] = m.at(-1).split("-").map(Number);
    return `${M[m1 - 1]}${a1 !== a2 ? " " + a1 : ""}–${M[m2 - 1]} ${a2}`;
  }
  function cadenaDatos(k) {
    const pr = window.PRODUCTOR_EUA?.productos?.[k];
    const fr = principalDe(window.FRONTERA_DIARIA, k), nom = fr?.nombre;
    const og = principalDe(window.ORIGEN_EUA, k, nom), my = principalDe(window.MAYOREO_EUA, k, nom), cs = principalDe(window.CONSUMIDOR_EUA, k, nom);
    const v = b => etqVar(b) ? etqVar(b) + ", " : "";
    const mixto = !!window.FRONTERA_DIARIA?.productos?.[k]?.mixto;
    const myMx = !my || my.origenBase === "México";
    const ult8 = tx("últimas 8 semanas", "last 8 weeks");
    const eslabones = [
      [tx("Agricultor de EE. UU.", "U.S. grower"), pr ? pr.precio : null, pr ? tx(`precio recibido, NASS ${pr.anio} (año comercial)`, `price received, NASS ${pr.anio} (marketing year)`) : tx("NASS no lo publica", "not published by NASS"), "#6FA3CF"],
      [tx("Origen EE. UU. (FOB)", "U.S. shipping point (FOB)"), promedioKg(og), v(og) + tx("punto de embarque", "shipping point") + ", " + ult8, "#4CC3FF"],
      mixto ? [tx("Frontera (precio mixto)", "Border (mixed price)"), promedioKg(fr), v(fr) + tx("el USDA lo cotiza junto con producción de EE. UU.", "the USDA quotes it together with U.S. production") + ", " + ult8, UP]
        : [tx("Frontera México (FOB)", "Mexico border (FOB)"), promedioKg(fr), v(fr) + tx("producto mexicano al cruzar", "Mexican product at the crossing") + ", " + ult8, UP],
      [tx("Mayoreo EE. UU.", "U.S. wholesale"), promedioKg(my), v(my) + (myMx ? tx("producto mexicano en mercados terminales", "Mexican product in terminal markets") : tx("todos los orígenes (llega poco producto mexicano) en mercados terminales", "all origins (little Mexican product arrives) in terminal markets")) + ", " + ult8, AMARILLO],
      [tx("Supermercado (oferta)", "Supermarket (ad price)"), promedioKg(cs), v(cs) + tx("precio de oferta", "advertised price") + ", " + ult8, DN]
    ];
    const an = window.ANAQUEL_EUA?.productos?.[k];
    if (an) eslabones.push([tx("Supermercado (anaquel)", "Supermarket (shelf price)"), an.precioKg,
      `${tx(ARTICULO_ES[k] ?? an.articulo, an.articulo)}, ${tx("precio de todos los días, BLS", "everyday price, BLS")}, ${periodoAnaquel(an)}`, "#E86A92"]);
    eslabones.mixto = mixto;
    if (an && !mixto) eslabones.fronteraAnaquel = { precio: promedioKgMeses(fr, an.meses.slice(-3).map(x => x[0])), periodo: periodoAnaquel(an), variedad: etqVar(fr) };
    return eslabones;
  }
  function cadenaHTML(k) {
    if (!window.PRODUCTOR_EUA?.productos?.[k] && !window.ORIGEN_EUA_INDICE?.productos?.includes(k) && !window.FRONTERA_DIARIA?.productos?.[k]) return "";
    return `<h3><span${tno()}>${tx("De la granja al supermercado en EE. UU.", "From farm to supermarket in the U.S.")}</span> <span class="tag ok">USDA${window.ANAQUEL_EUA?.productos?.[k] ? " · BLS" : ""}</span></h3><div class="gfr-cadena" data-cadena="${k}"${tno()}><p class="gfr-nota">${tx("Cargando los precios…", "Loading prices…")}</p></div>`;
  }
  const resumenCadena = () => envolverRes(tx("Precio por kg en cada eslabón", "Price per kg at each link"));
  function pintarCadena(el) {
    const k = el.dataset.cadena, e = cadenaDatos(k), max = Math.max(...e.map(x => x[1] ?? 0));
    if (en()) el.setAttribute("translate", "no");
    const sup = e[4][1], fr = e.mixto ? null : e[2][1], anq = e[5]?.[1] ?? null;
    const filas = e.map(([n, v, nota, col]) => `<div class="gfr-cad-fila"><span class="n">${n}<small>${nota}</small></span>
      <span class="b">${v != null ? `<i style="width:${(v / max * 100).toFixed(1)}%;background:${col}"></i>` : ""}</span>
      <span class="x">${v != null ? "US$" + v.toFixed(2) : "—"}</span></div>`).join("");
    const ofertaBaja = sup && Math.max(fr ?? 0, e[3][1] ?? 0) >= sup * 0.9;   // con frontera mixta solo cuenta el mayoreo
    const enFrontera = (fr ?? 0) >= sup * 0.9, pct = sup && fr ? Math.round(fr / sup * 100) : null;
    const fa = e.fronteraAnaquel, frA = fa?.precio ?? null;   // frontera en los mismos meses que el anaquel
    const pctA = anq && frA ? Math.round(frA / anq * 100) : null;
    const caroMayoreo = ofertaBaja && pctA == null;   // sin anaquel comparable, la advertencia de ofertas es la lectura
    const sinFronteraAnq = !(anq != null && fa && frA == null) ? ""
      : fr == null ? tx(` El precio de anaquel del BLS (${fa.periodo}) no se compara con la frontera porque el USDA no cotiza el producto mexicano al cruzar.`,
        ` The BLS shelf price (${fa.periodo}) is not compared with the border because the USDA does not quote Mexican product at the crossing.`)
      : tx(` El precio de anaquel del BLS (${fa.periodo}) no se compara con la frontera porque en esos meses casi no cruza producto mexicano.`,
        ` The BLS shelf price (${fa.periodo}) is not compared with the border because almost no Mexican product crossed in those months.`);
    const notaOferta = ofertaBaja ? (en()
      ? ` The supermarket <i>ads</i> (US$${sup.toFixed(2)}/kg) are close to the ${enFrontera ? "border" : "wholesale"} price: they are promotions with minimal margin or at a loss.`
      : ` Las <i>ofertas</i> del supermercado (US$${sup.toFixed(2)}/kg) están casi al nivel del precio ${enFrontera ? "en la frontera" : "de mayoreo"}: son promociones con margen mínimo o con pérdida.`) : "";
    const lectura = pctA != null && pctA < 90 ? `<div class="nota">${en()
        ? `In ${fa.periodo} Mexican product at the border${fa.variedad ? ` (${fa.variedad})` : ""} averaged US$${frA.toFixed(2)}/kg, <b>${pctA}%</b> of the everyday supermarket shelf price (US$${anq.toFixed(2)}/kg): of every dollar the U.S. shopper pays, ${pctA} cents go to the FOB price at the crossing (which includes packing and freight to the border); the rest is U.S. freight, wholesale, shrink and the supermarket's margin.`
        : `En ${fa.periodo} el producto mexicano en la frontera${fa.variedad ? ` (${fa.variedad})` : ""} promedió US$${frA.toFixed(2)}/kg, <b>${pctA}%</b> del precio de anaquel de todos los días en el supermercado (US$${anq.toFixed(2)}/kg): de cada dólar que paga el consumidor estadounidense, ${pctA} centavos corresponden al precio FOB en el cruce (que incluye empaque y flete hasta la frontera); el resto es flete en EE. UU., mayoreo, merma y margen del supermercado.`}${notaOferta}</div>`
      : pctA != null ? `<div class="nota">${tx(`En ${fa.periodo} el precio en la frontera (US$${frA.toFixed(2)}/kg) quedó casi al nivel del precio de anaquel (US$${anq.toFixed(2)}/kg): el empaque de referencia de la frontera no es el que mide el BLS en la tienda, así que no se calcula qué parte del precio al consumidor llega a la frontera.`,
        `In ${fa.periodo} the border price (US$${frA.toFixed(2)}/kg) was almost at the shelf price level (US$${anq.toFixed(2)}/kg): the border reference package is not the one BLS measures in stores, so the share of the retail price reaching the border is not calculated.`)}</div>`
      : caroMayoreo ? `<div class="nota">${en()
        ? `In these weeks the supermarket ad price (US$${sup.toFixed(2)}/kg) is below or close to the ${enFrontera ? "border" : "wholesale"} price: these are promotions with minimal margin or at a loss (supermarkets use them to draw shoppers), so they do not reflect the everyday shelf price. Compare per-kg prices with caution.`
        : `En estas semanas el precio de oferta del supermercado (US$${sup.toFixed(2)}/kg) está por debajo o casi al nivel del precio ${enFrontera ? "en la frontera" : "de mayoreo"}: son promociones con margen mínimo o con pérdida (el supermercado las usa para atraer clientes), así que no reflejan el precio de anaquel de todos los días. Compara los precios por kg con cautela.`}${sinFronteraAnq}</div>`
      : pct != null ? `<div class="nota">${en()
        ? `Mexican product at the border is worth <b>${pct}%</b> of the supermarket ad price: of every dollar the U.S. shopper pays, ${pct} cents go to the FOB price at the crossing (which includes packing and freight to the border); the rest is U.S. freight, wholesale, shrink and the supermarket's margin.`
        : `El producto mexicano en la frontera vale <b>${pct}%</b> del precio de oferta en el supermercado: de cada dólar que paga el consumidor estadounidense, ${pct} centavos corresponden al precio FOB en el cruce (que incluye empaque y flete hasta la frontera); el resto es flete en EE. UU., mayoreo, merma y margen del supermercado.`}</div>`
      : e.mixto ? `<div class="nota">${tx("El USDA cotiza este producto en la frontera junto con producción de EE. UU. (distritos mixtos), así que no se puede separar el precio del producto mexicano ni calcular qué parte del precio al consumidor le corresponde.",
        "The USDA quotes this product at the border together with U.S. production (mixed districts), so the Mexican product's price cannot be separated nor its share of the retail price calculated.")}</div>`
      : `<div class="nota">${tx("Sin el precio en kg de todos los eslabones no se puede calcular cuánto del precio al consumidor llega a la frontera", "Without a per-kg price at every link it is not possible to calculate how much of the retail price reaches the border")}${e[4][1] == null && window.CONSUMIDOR_EUA?.productos?.[k] ? tx(" (en el supermercado se vende por pieza o manojo)", " (supermarkets sell it by the piece or bunch)") : ""}.</div>`;
    const conPrecio = e.filter(x => x[1] != null).length;
    if (conPrecio < 2) {   // sin dos eslabones en kg no hay cadena que comparar (empaques sin peso, sin cotización)
      el.innerHTML = `<p class="gfr-nota">${tx("No hay suficientes precios por kg para comparar la cadena de este producto: en la mayoría de los eslabones se vende por pieza o manojo, en cajas sin peso declarado, o el USDA no lo cotiza.",
        "There are not enough per-kg prices to compare this product's chain: at most links it is sold by the piece or bunch, in boxes with no stated weight, or the USDA does not quote it.")}</p>`;
      ponerResumen(el, tx("Sin suficientes precios por kg", "Not enough per-kg prices"));
      return;
    }
    el.innerHTML = `<div class="gfr-cad">${filas}</div>${lectura}
      <p class="sub">${tx("US$/kg. Agricultor: precio recibido promedio nacional de mercado fresco (USDA NASS). Origen EE. UU., frontera y mayoreo: promedio de las últimas 8 semanas del empaque de referencia, misma variedad que en la frontera cuando se cotiza (USDA AMS). Supermercado (oferta): promedio de las ofertas de las últimas 8 semanas (USDA AMS). Los empaques que no traen peso no se convierten a kg.",
        "US$/kg. Grower: national average fresh-market price received (USDA NASS). U.S. shipping point, border and wholesale: average of the last 8 weeks for the reference package, same variety as at the border when quoted (USDA AMS). Supermarket (ad price): average of the last 8 weeks of ads (USDA AMS). Packages with no stated weight are not converted to kg.")}${anq != null ? tx(" Supermercado (anaquel): precio promedio que pagan los consumidores en tiendas urbanas de todo el país, promedio de los últimos 3 meses publicados (BLS, Average Price Data); el BLS solo lo publica para unos cuantos productos frescos.",
        " Supermarket (shelf price): average price paid by consumers in urban stores nationwide, average of the last 3 published months (BLS, Average Price Data); BLS publishes it for only a few fresh products.") : ""}</p>`;
    ponerResumen(el, caroMayoreo ? (enFrontera ? tx("Las ofertas del supermercado están al nivel de la frontera", "Supermarket ads are at border-price level")
        : tx("Las ofertas del supermercado están al nivel del mayoreo", "Supermarket ads are at wholesale level"))
      : e.mixto ? tx("Precio por kg en cada eslabón (frontera mixta)", "Price per kg at each link (mixed border)")
      : pctA != null && pctA < 90 ? tx(`En la frontera vale ${pctA}% del precio de anaquel`, `At the border it is worth ${pctA}% of the shelf price`)
      : pctA != null ? tx("Precio por kg en cada eslabón", "Price per kg at each link")
      : pct != null ? tx(`En la frontera vale ${pct}% del precio al consumidor`, `At the border it is worth ${pct}% of the retail price`) : tx("Precio por kg en cada eslabón", "Price per kg at each link"));
  }
  function llenarCadena(el) {
    if (el.dataset.esperando) return;
    el.dataset.esperando = "1";
    const k = el.dataset.cadena, cargas = [];
    if (window.ORIGEN_EUA_INDICE?.productos?.includes(k)) cargas.push(window.Paleta.cargar(FUENTES.origen.archivo(k), () => !!window.ORIGEN_EUA?.productos?.[k]).catch(() => {}));
    if (window.MAYOREO_EUA_INDICE?.productos?.includes(k)) cargas.push(window.Paleta.cargar(FUENTES.eua.archivo(k), () => !!window.MAYOREO_EUA?.productos?.[k]).catch(() => {}));
    cargas.push(window.Paleta.cargar(FUENTES.consumidor.archivo, () => !!window.CONSUMIDOR_EUA).catch(() => {}));
    const bajar = () => Promise.all(cargas).then(() => pintarCadena(el));
    window.Seccion ? window.Seccion.alAbrir(el, bajar) : bajar();
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (n.nodeType !== 1) return;
    if (n.matches?.("[data-cadena]")) llenarCadena(n);
    n.querySelectorAll?.("[data-cadena]").forEach(llenarCadena);
  }))).observe(document.body, { childList: true, subtree: true });
  // Antes de bajar el archivo del producto se sabe si el USDA lo cotiza en los mercados por data/precios_eua.js (2025)
  const disponibleEua = k => window.MAYOREO_EUA?.productos?.[k] ? disponible_(FUENTES.eua, k) : !!window.MAYOREO_EUA_INDICE?.productos?.includes(k);
  const disponible_ = (f, k) => !!f.datos()?.productos?.[k]?.dias?.length;
  // Antes de cargar data/mayoreo_diario.js se sabe qué productos tiene el SNIIM por el panel de precios (data/precios_sniim.js)
  const disponibleMayoreo = k => window.MAYOREO_MX ? !!window.MAYOREO_MX.productos?.[k]?.dias?.length : !!window.PRECIOS_SNIIM?.productos?.[k];

  // ---------- Interacción ----------
  function pintar(el) {
    const fuente = el.dataset.gfrFuente ?? "frontera", k = el.dataset.gfrK;
    usar(fuente);
    if (!cargado(k)) return;
    delete el.dataset.pendiente;
    if (en()) el.setAttribute("translate", "no");
    el.innerHTML = disponible(k) ? vista(k, el.dataset.gfrModo, el.dataset.i ? +el.dataset.i : null)
      : `<p class="gfr-nota">${en() ? `${F.id === "mayoreo" ? "SNIIM" : "The USDA"} does not have enough quotes for this product in ${D()?.anio ?? "this year"}.`
        : `${F.id === "mayoreo" ? "El SNIIM" : "El USDA"} no tiene suficientes cotizaciones de este producto en ${D()?.anio ?? "este año"}.`}</p>`;
    ponerResumen(el, resumenTxt(fuente, k));
  }
  // Bloques de carga diferida: se baja su archivo cuando la sección está abierta (o al abrirla) y se pintan
  const cargando = {};
  function llenar(el) {
    const f = FUENTES[el.dataset.gfrFuente];
    if (!f?.archivo || el.dataset.esperando) return;
    el.dataset.esperando = "1";
    const k = el.dataset.gfrK, clave = f.porProducto ? f.id + ":" + k : f.id;
    const archivo = f.porProducto ? f.archivo(k) : f.archivo;
    const listo = f.porProducto ? () => !!f.datos()?.productos?.[k] : () => !!f.datos();
    const sel = `.gfr[data-pendiente][data-gfr-fuente="${f.id}"]${f.porProducto ? `[data-gfr-k="${k}"]` : ""}`;
    const bajar = () => (cargando[clave] ??= window.Paleta.cargar(archivo, listo))
      .then(() => document.querySelectorAll(sel).forEach(pintar))
      .catch(() => { delete cargando[clave]; document.querySelectorAll(sel).forEach(e => { e.innerHTML = `<p class="gfr-nota">${tx("El USDA no tiene suficientes cotizaciones de este producto en los mercados este año.", "The USDA does not have enough market quotes for this product this year.")}</p>`; }); });
    window.Seccion ? window.Seccion.alAbrir(el, bajar) : bajar();
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (n.nodeType !== 1) return;
    if (n.matches?.(".gfr[data-pendiente]")) llenar(n);
    n.querySelectorAll?.(".gfr[data-pendiente]").forEach(llenar);
  }))).observe(document.body, { childList: true, subtree: true });
  const todos = () => document.querySelectorAll(".gfr[data-gfr-k]:not([data-pendiente])").forEach(pintar);

  function abrir(k, fuente = "frontera") {
    cerrar();
    usar(fuente);
    const m = document.createElement("div");
    m.className = "gfr-modal";
    if (en()) m.setAttribute("translate", "no");
    m.innerHTML = `<div class="gfr-modal-caja" role="dialog" aria-modal="true" aria-label="${L(F.titulo)}, ${tx("vista ampliada", "expanded view")}">
      <button type="button" class="gfr-btn gfr-cerrar" data-gfr-accion="cerrar" aria-label="${tx("Cerrar", "Close")}">✕</button>
      <div class="gfr" data-gfr-fuente="${fuente}" data-gfr-k="${k}" data-gfr-modo="grande">${vista(k, "grande")}</div></div>`;
    document.body.appendChild(m);
    m.querySelector(".gfr-cerrar").focus();
  }
  function cerrar() { document.querySelector(".gfr-modal")?.remove(); }

  document.addEventListener("click", ev => {
    if (ev.target.classList?.contains("gfr-modal")) return cerrar();   // clic fuera de la ventana
    const b = ev.target.closest?.("[data-gfr-accion]");
    if (!b) return;
    const [a, val] = b.dataset.gfrAccion.split(":"), caja = b.closest(".gfr");
    if (a === "cerrar") return cerrar();
    if (a === "ampliar") return abrir(caja.dataset.gfrK, caja.dataset.gfrFuente);
    if (a === "comparar") {   // modo "Analizar precios" con este producto (y su variedad elegida) ya en la lista
      const fuente = caja.dataset.gfrFuente ?? "frontera", k = caja.dataset.gfrK, base = FUENTES[fuente].datos()?.productos?.[k];
      const j = op.variedad[fuente + ":" + k];
      const items = base?.variantes && j != null ? [k + "~" + j] : null;
      return window.AnalisisEntrada?.abrir(items ? { fuente, k, semilla: items[0] } : { fuente, k }, b);
    }
    if (a === "tf") { op.tf = val; document.querySelectorAll(".gfr[data-i]").forEach(e => delete e.dataset.i); }
    else if (a === "rango") op.rango = !op.rango;
    else if (a === "ma") op.ma = !op.ma;
    else if (a === "unidad") op.kg = val === "kg";
    todos();
    document.querySelector(`.gfr[data-gfr-modo="${caja.dataset.gfrModo}"] [data-gfr-accion="${b.dataset.gfrAccion}"]`)?.focus();
  });
  document.addEventListener("change", ev => {
    const s = ev.target.closest?.("select[data-gfr-variedad]");
    if (!s) return;
    const caja = s.closest(".gfr"), modo = caja.dataset.gfrModo;   // antes de repintar: después el <select> ya no está
    op.variedad[(caja.dataset.gfrFuente ?? "frontera") + ":" + s.dataset.gfrVariedad] = +s.value;   // antes de repintar: después el <select> ya no está en la página
    document.querySelectorAll(".gfr[data-i]").forEach(e => delete e.dataset.i);
    todos();
    document.querySelector(`.gfr[data-gfr-modo="${modo}"] select[data-gfr-variedad]`)?.focus();
  });
  document.addEventListener("change", ev => {
    const s = ev.target.closest?.("select[data-gfr-cruce]");
    if (!s) return;
    const caja = s.closest(".gfr"), modo = caja.dataset.gfrModo;   // antes de repintar
    op.cruce[(caja.dataset.gfrFuente ?? "frontera") + ":" + s.dataset.gfrCruce] = s.value;
    document.querySelectorAll(".gfr[data-i]").forEach(e => delete e.dataset.i);
    todos();
    document.querySelector(`.gfr[data-gfr-modo="${modo}"] select[data-gfr-cruce]`)?.focus();
  });
  document.addEventListener("change", ev => {
    const s = ev.target.closest?.("select[data-gfr-origen]");
    if (!s) return;
    const caja = s.closest(".gfr"), modo = caja.dataset.gfrModo;   // antes de repintar
    op.origen[(caja.dataset.gfrFuente ?? "frontera") + ":" + s.dataset.gfrOrigen] = s.value;
    document.querySelectorAll(".gfr[data-i]").forEach(e => delete e.dataset.i);
    todos();
    document.querySelector(`.gfr[data-gfr-modo="${modo}"] select[data-gfr-origen]`)?.focus();
  });
  document.addEventListener("keydown", ev => { if (ev.key === "Escape" && document.querySelector(".gfr-modal")) cerrar(); });

  // Cursor: el índice bajo el puntero; solo se repinta cuando cambia
  function mover(ev) {
    const hit = ev.target.closest?.(".gfr-hit");
    if (!hit) return;
    const caja = hit.closest(".gfr"), sv = hit.ownerSVGElement, r = sv.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width * +hit.dataset.w;
    const i = Math.max(0, Math.min(+hit.dataset.n - 1, Math.floor(x / (+hit.dataset.pw / +hit.dataset.n))));
    if (caja.dataset.i === String(i)) return;
    caja.dataset.i = i;
    pintar(caja);
  }
  function salir(ev) {
    const hit = ev.target.closest?.(".gfr-hit");
    if (!hit || ev.relatedTarget?.closest?.(".gfr-hit")) return;
    const caja = hit.closest(".gfr");
    if (caja.dataset.i == null) return;
    delete caja.dataset.i;
    pintar(caja);
  }
  document.addEventListener("pointermove", mover);
  document.addEventListener("pointerdown", mover);
  document.addEventListener("pointerout", salir);

  document.addEventListener("click", ev => {
    const b = ev.target.closest?.("[data-gfr-solo]");
    if (b) abrir(b.dataset.gfrSolo, "frontera");
  });
  window.Graficos = { disponible: k => (usar("frontera"), disponible(k)), fronteraHTML, fronteraResumen, listaSoloPrecioHTML,
    disponibleMayoreo, mayoreoHTML, mayoreoResumen, disponibleEua, euaHTML, euaResumen,
    disponibleOrigen, origenHTML, origenResumen, disponibleConsumidor, consumidorHTML, consumidorResumen, cadenaHTML, resumenCadena, abrir };
})();

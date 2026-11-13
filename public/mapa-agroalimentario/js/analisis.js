// ============================================================================
// Analizar precios: comparativo entre productos a pantalla completa (carga diferida desde js/analisis_entrada.js).
// Pregunta que responde: ¿se mueven juntos los precios? (cuando baja el brócoli, ¿la zanahoria sube, baja o se queda igual?)
// Fuentes: precio diario en la frontera (USDA AMS, data/frontera_diaria.js) y mayoreo en México (SNIIM,
// data/mayoreo_diario.js, carga diferida). Se comparan de 2 a 5 series; cada variedad (jitomate saladette, bola…)
// es una serie propia.
// Vista 1, "Líneas": índice base 100 (cada serie parte de 100 en su primer dato del periodo, así se comparan productos
// que se venden en cajas distintas) o precio real. Un solo eje. Las líneas se cortan donde la serie deja de cotizar más
// de tres semanas (fuera de temporada).
// Colores: paleta categórica validada (scripts de dataviz) en oscuro sobre #16211A y en claro sobre #FFFFFF; el color
// sigue a la serie, no a su posición; cada línea lleva su nombre al final y hay tabla con las cifras.
// Vista 2, "Mapa de calor": todos los productos contra todos (clic → Cuadrantes). Vista 3, "Cuadrantes": un par, semana a semana, con prueba de confianza.
// ============================================================================
(function () {
  const FUENTES = {
    frontera: { id: "frontera", nombre: "Frontera EE. UU.", tag: "USDA AMS", datos: () => window.FRONTERA_DIARIA, archivo: "data/frontera_diaria.js",
      desc: "Precio FOB del producto mexicano al cruzar a EE. UU. (USDA AMS)" },
    mayoreo: { id: "mayoreo", nombre: "Mayoreo México", tag: "SNIIM", datos: () => window.MAYOREO_MX, archivo: "data/mayoreo_diario.js",
      desc: "Precio frecuente de mayoreo en centrales de abasto, $/kg (SNIIM)" }
  };
  const MAX = 5, MIN_DIAS = 20, CORTE = { D: 21, S: 22 };   // corte de línea: días sin dato
  const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const PERIODOS = [["todo", "Todo el año"], ["6m", "6 meses"], ["3m", "3 meses"]];
  const COMPANEROS = ["brocoli", "zanahoria", "lechuga", "pepino", "jitomate", "calabacita", "cebolla", "papa"];

  const op = { fuente: "frontera", items: [], periodo: "todo", escala: "indice", tf: "S", vista: "lineas", buscar: "", qa: null, qb: null, tipoCalor: "todos" };
  let caja = null, origenEl = null, ro = null, cursor = null;
  // Frecuencia efectiva: la elegida en Líneas; Cuadrantes y Mapa de calor siempre comparan semanas (de un día hábil al
  // siguiente los precios casi no cambian y solo se acumulan puntos "sin cambio")
  const TF = () => op.vista === "lineas" ? op.tf : "S";

  // ---------- Catálogo de series de la fuente ----------
  // id de serie: "brocoli" o, en productos con variedades, "jitomate~1"
  const D = () => FUENTES[op.fuente].datos();
  const nombreProd = k => window.PRODUCTOS?.[k]?.nombre ?? k;
  function catalogo() {
    const d = D();
    if (!d) return [];
    const out = [];
    for (const [k, b] of Object.entries(d.productos)) {
      const vs = b.variantes ? b.variantes.map((v, j) => [k + "~" + j, v]) : [[k, b]];
      for (const [id, v] of vs) {
        const util = (v.anio ?? b.anio ?? d.anio) === d.anio && (v.dias?.length ?? 0) >= MIN_DIAS;
        out.push({ id, k, ficha: v, nombre: nombreProd(k) + (b.variantes ? " · " + v.nombre : ""), tipo: window.PRODUCTOS?.[k]?.tipo ?? "", util, dias: v.dias?.length ?? 0 });
      }
    }
    return out.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }
  const porId = id => catalogo().find(c => c.id === id);
  // Producto → su serie de omisión (variedad por omisión del producto)
  function serieDe(k) {
    const b = D()?.productos?.[k];
    if (!b) return null;
    const id = b.variantes ? k + "~" + (b.varOmision ?? 0) : k;
    return porId(id)?.util ? id : catalogo().find(c => c.k === k && c.util)?.id ?? null;
  }
  function porOmision(k, semilla) {
    const sel = [], add = id => { if (id && !sel.includes(id) && sel.length < 3 && !sel.some(x => x.split("~")[0] === id.split("~")[0])) sel.push(id); };
    add(semilla && porId(semilla)?.util ? semilla : serieDe(k));
    COMPANEROS.forEach(c => add(serieDe(c)));
    return sel;
  }
  // Color fijo por serie mientras esté elegida (no se repinta al quitar otra)
  const colores = {};
  function asignarColores() {
    Object.keys(colores).forEach(id => { if (!op.items.includes(id)) delete colores[id]; });
    op.items.forEach(id => {
      if (colores[id] != null) return;
      const usados = new Set(Object.values(colores));
      colores[id] = [0, 1, 2, 3, 4].find(n => !usados.has(n));
    });
  }
  const color = id => `var(--an-${colores[id] + 1})`;

  // ---------- Series ----------
  const fecha = (md, A) => { const [m, d] = md.split("-").map(Number); return new Date(Date.UTC(A, m - 1, d)); };
  const DIA = 864e5;
  const lunes = t => new Date(t.getTime() - ((t.getUTCDay() + 6) % 7) * DIA);
  const fd = t => `${t.getUTCDate()} ${MES[t.getUTCMonth()]}`;
  function unidadDe(c) {
    if (op.fuente === "mayoreo") return { f: 1, u: "$/kg" };
    return c.ficha.kgEmpaque ? { f: 1 / c.ficha.kgEmpaque, u: "US$/kg" } : { f: 1, u: "US$/caja" };
  }
  function series(ids = op.items) {
    const d = D(), A = d.anio;
    const ultimo = Math.max(...ids.map(id => { const c = porId(id); return fecha(c.ficha.dias.at(-1)[0], A).getTime(); }));
    const desde = op.periodo === "todo" ? -Infinity : ultimo - (op.periodo === "6m" ? 182 : 91) * DIA;
    return ids.map(id => {
      const c = porId(id), { f, u } = unidadDe(c);
      let pts = c.ficha.dias.map(x => ({ t: fecha(x[0], A), v: x[1] * f })).filter(p => p.t.getTime() >= desde);
      if (TF() === "S") {
        const g = new Map();
        pts.forEach(p => { const k = lunes(p.t).getTime(); if (!g.has(k)) g.set(k, []); g.get(k).push(p.v); });
        const ene1 = Date.UTC(A, 0, 1);   // la semana del 29 de diciembre se rotula desde el 1 de enero
        pts = [...g.entries()].map(([k, vs]) => ({ t: new Date(Math.max(k, ene1)), v: vs.reduce((a, b) => a + b, 0) / vs.length }));
      }
      const base = pts[0]?.v;
      pts.forEach(p => { p.i = p.v / base * 100; });
      return { id, c, u, pts, base };
    }).filter(s => s.pts.length);
  }
  const val = p => op.escala === "indice" ? p.i : p.v;

  // ---------- Gráfico de líneas ----------
  function lineas(S, W, H) {
    const angosto = W < 600, M = { l: 8, r: angosto ? 112 : 150, t: 14, b: 28 }, PW = W - M.l - M.r, PH = H - M.t - M.b;
    const ts = S.flatMap(s => s.pts.map(p => p.t.getTime())), t0 = Math.min(...ts), t1 = Math.max(...ts);
    const vs = S.flatMap(s => s.pts.map(val));
    let lo = Math.min(...vs), hi = Math.max(...vs);
    if (op.escala === "indice") { lo = Math.min(lo, 100); hi = Math.max(hi, 100); }
    const crudo = (hi - lo) / 6 || 1, pot = 10 ** Math.floor(Math.log10(crudo)), paso = [1, 2, 2.5, 5, 10].map(m => m * pot).find(x => x >= crudo);
    const yMin = Math.max(0, Math.floor(lo / paso) * paso), yMax = Math.ceil(hi / paso) * paso;
    const x = t => M.l + (t1 === t0 ? PW / 2 : (t - t0) / (t1 - t0) * PW), y = v => M.t + (yMax - v) / (yMax - yMin) * PH;
    const f1 = n => n.toFixed(1);
    const rej = [];
    for (let q = yMin; q <= yMax + 1e-9; q += paso) {
      const es100 = op.escala === "indice" && Math.abs(q - 100) < 1e-9;
      rej.push(`<line x1="${M.l}" x2="${M.l + PW}" y1="${f1(y(q))}" y2="${f1(y(q))}" class="${es100 ? "an-base" : "an-rejilla"}"/>
        <text x="${M.l + PW + 8}" y="${f1(y(q) + 4)}" class="an-eje">${q.toFixed(paso < 1 ? 2 : 0)}</text>`);
    }
    if (op.escala === "indice" && !rej.some(r => r.includes("an-base")))
      rej.push(`<line x1="${M.l}" x2="${M.l + PW}" y1="${f1(y(100))}" y2="${f1(y(100))}" class="an-base"/>`);
    // Meses en el eje horizontal
    const meses = [];
    const A = new Date(t0).getUTCFullYear();
    let ultX = -Infinity;
    for (let m = 0; m < 12; m++) {
      const t = Date.UTC(A, m, 1);
      if (t < t0 - 15 * DIA || t > t1) continue;
      const xx = Math.max(M.l, x(t));
      if (xx - ultX < 30) continue;   // en pantallas angostas, un mes sí y otro no
      ultX = xx;
      meses.push(`<line x1="${f1(xx)}" x2="${f1(xx)}" y1="${M.t + PH}" y2="${M.t + PH + 4}" class="an-rejilla"/><text x="${f1(xx + 3)}" y="${H - 8}" class="an-mes">${MES[m].toUpperCase()}</text>`);
    }
    // Líneas (cortadas donde la serie deja de cotizar) y nombre al final, sin encimarse
    const corte = CORTE[TF()] * DIA;
    const trazos = S.map(s => {
      const tramos = [[]];
      s.pts.forEach((p, j) => { if (j && p.t - s.pts[j - 1].t > corte) tramos.push([]); tramos.at(-1).push(p); });
      const st = `stroke:${color(s.id)}`;
      return tramos.map(tr => tr.length === 1
        ? `<circle cx="${f1(x(tr[0].t.getTime()))}" cy="${f1(y(val(tr[0])))}" r="2.5" style="fill:${color(s.id)}"/>`
        : `<polyline points="${tr.map(p => `${f1(x(p.t.getTime()))},${f1(y(val(p)))}`).join(" ")}" class="an-linea" style="${st}"/>`).join("");
    }).join("");
    const fin = S.map(s => { const p = s.pts.at(-1); return { s, x: x(p.t.getTime()), y: y(val(p)), v: val(p) }; }).sort((a, b) => a.y - b.y);
    const GAP = 15;
    fin.forEach((e, j) => { e.ly = j ? Math.max(e.y, fin[j - 1].ly + GAP) : e.y; });
    for (let j = fin.length - 1; j >= 0; j--) { const lim = j === fin.length - 1 ? M.t + PH : fin[j + 1].ly - GAP; if (fin[j].ly > lim) fin[j].ly = lim; }
    const etqs = fin.map(e => {
      const lim = angosto ? 9 : 18, n = e.s.c.nombre.length > lim ? e.s.c.nombre.slice(0, lim - 1) + "…" : e.s.c.nombre;
      const xl = M.l + PW + (angosto ? 36 : 44);
      return `<circle cx="${f1(e.x)}" cy="${f1(e.y)}" r="4" class="an-fin" style="fill:${color(e.s.id)}"/>
        <path d="M${f1(e.x + 5)},${f1(e.y)} L${f1(xl - 6)},${f1(e.ly)}" class="an-guia"/>
        <text x="${f1(xl)}" y="${f1(e.ly + 4)}" class="an-nombre">${n}</text>`;
    }).join("");
    // Cursor
    let cur = "";
    if (cursor != null) {
      const cx = x(cursor);
      cur = `<line x1="${f1(cx)}" x2="${f1(cx)}" y1="${M.t}" y2="${M.t + PH}" class="an-cursor"/>` + S.map(s => {
        const p = cerca(s, cursor);
        return p ? `<circle cx="${f1(x(p.t.getTime()))}" cy="${f1(y(val(p)))}" r="5" class="an-punto" style="fill:${color(s.id)}"/>` : "";
      }).join("");
    }
    return `<svg class="an-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Comparativo de precios: ${S.map(s => s.c.nombre).join(", ")}">
      ${rej.join("")}${meses.join("")}
      <line x1="${M.l + PW}" x2="${M.l + PW}" y1="${M.t}" y2="${M.t + PH}" class="an-borde"/>
      ${trazos}${etqs}${cur}
      <rect class="an-hit" x="${M.l}" y="${M.t}" width="${PW}" height="${PH}" fill="transparent" data-t0="${t0}" data-t1="${t1}" data-l="${M.l}" data-pw="${PW}"/>
    </svg>`;
  }
  // Punto de la serie más cercano al instante t (sin saltar huecos de temporada)
  function cerca(s, t) {
    let best = null;
    s.pts.forEach(p => { if (!best || Math.abs(p.t - t) < Math.abs(best.t - t)) best = p; });
    return best && Math.abs(best.t - t) <= (TF() === "S" ? 4 : 2) * DIA ? best : null;
  }

  // ---------- Textos ----------
  const n2 = v => v == null ? "—" : v.toFixed(2);
  const pct = r => (r >= 0 ? "+" : "−") + Math.abs(r * 100).toFixed(1) + "%";
  const periodoTxt = S => {
    const t0 = new Date(Math.min(...S.map(s => s.pts[0].t.getTime()))), t1 = new Date(Math.max(...S.map(s => s.pts.at(-1).t.getTime())));
    return `${TF() === "S" ? "semana del " : ""}${fd(t0)} al ${fd(t1)} ${t1.getUTCFullYear()}`;
  };
  function lectura(S) {
    if (cursor == null) {
      const cambios = S.map(s => ({ s, r: s.pts.at(-1).v / s.base - 1 })).sort((a, b) => b.r - a.r);
      const sube = cambios.filter(c => c.r > 0.02), baja = cambios.filter(c => c.r < -0.02), igual = cambios.filter(c => Math.abs(c.r) <= 0.02);
      const lista = a => a.map(c => `<b>${c.s.c.nombre}</b> ${pct(c.r)}`).join(", ");
      return `<span class="an-lect-t">Del primer al último dato del periodo</span>
        ${sube.length ? `<span>Subieron: ${lista(sube)}</span>` : ""}${baja.length ? `<span>Bajaron: ${lista(baja)}</span>` : ""}${igual.length ? `<span>Casi igual (±2%): ${lista(igual)}</span>` : ""}`;
    }
    const t = new Date(cursor);
    const filas = S.map(s => ({ s, p: cerca(s, cursor) })).sort((a, b) => (b.p ? val(b.p) : -1) - (a.p ? val(a.p) : -1));
    return `<span class="an-lect-t">${TF() === "S" ? "Semana del " : ""}${fd(t)}</span>` + filas.map(({ s, p }) =>
      `<span><i style="background:${color(s.id)}"></i>${s.c.nombre} <em>${p ? (op.escala === "indice" ? p.i.toFixed(1) : n2(p.v)) : "sin dato"}</em>${p && op.escala === "indice" ? ` <small>${n2(p.v)} ${s.u}</small>` : ""}</span>`).join("");
  }
  function tabla(S) {
    const filas = S.map(s => {
      const vs = s.pts.map(p => p.v), iMax = vs.indexOf(Math.max(...vs)), iMin = vs.indexOf(Math.min(...vs)), r = vs.at(-1) / s.base - 1;
      const pre = TF() === "S" ? "sem. " : "";
      return `<tr><td><i class="an-punto-t" style="background:${color(s.id)}"></i>${s.c.nombre}</td><td>${s.u}</td>
        <td class="num">${n2(s.base)} <small>${pre}${fd(s.pts[0].t)}</small></td><td class="num">${n2(vs.at(-1))} <small>${pre}${fd(s.pts.at(-1).t)}</small></td>
        <td class="num ${r > 0.02 ? "an-up" : r < -0.02 ? "an-dn" : ""}">${pct(r)}</td>
        <td class="num">${n2(vs[iMax])} <small>${pre}${fd(s.pts[iMax].t)}</small></td><td class="num">${n2(vs[iMin])} <small>${pre}${fd(s.pts[iMin].t)}</small></td></tr>`;
    }).join("");
    return `<div class="an-tabla-caja"><table class="an-tabla"><thead><tr><th>Serie</th><th>Unidad</th><th class="num">Primer dato</th><th class="num">Último</th><th class="num">Cambio</th><th class="num">Más alto</th><th class="num">Más bajo</th></tr></thead><tbody>${filas}</tbody></table></div>`;
  }

  // ---------- Vista 2: Cuadrantes ----------
  // Cada punto es una semana (o un día): en el eje horizontal el cambio del producto A contra el periodo anterior, en el
  // vertical el del producto B. Arriba a la derecha y abajo a la izquierda, los dos se movieron en la misma dirección;
  // en las otras dos esquinas, en sentido contrario. Un cambio menor a ±2% cuenta como "se quedó igual" (franja gris).
  const UMBRAL = 0.02;
  let qPts = [], qCursor = null;   // posiciones en pantalla para el cursor; índice del punto señalado
  const dir = d => Math.abs(d) < UMBRAL ? 0 : Math.sign(d);
  function parValido() {
    if (!op.items.includes(op.qa)) op.qa = op.items.find(id => id !== op.qb) ?? op.items[0];
    if (!op.items.includes(op.qb) || op.qb === op.qa) op.qb = op.items.find(id => id !== op.qa);
  }
  // Cambios de los dos productos en los periodos en que ambos cotizan y que siguen a otro periodo con dato de ambos
  // Prueba de confianza: si los dos productos no tuvieran relación, "misma dirección" y "sentido contrario" serían igual de
  // probables (como lanzar una moneda). p = probabilidad de ver un reparto igual o más desigual por puro azar (binomial
  // exacta, dos colas). Se exige p < 1% porque se comparan muchos pares: con 5%, 1 de cada 20 pares sin relación
  // saldría "confiable" por suerte.
  const ALFA = 0.01;
  function pAzar(k, n) {
    if (!n) return 1;
    const m = Math.max(k, n - k);
    let suma = 0, c = Math.pow(0.5, n);   // P(X = 0)
    for (let i = 0; i <= n; i++) { if (i >= m) suma += c; c = c * (n - i) / (i + 1); }
    return Math.min(1, 2 * suma);
  }
  function pares(S, a = op.qa, b = op.qb) {
    const sa = S.find(s => s.id === a), sb = S.find(s => s.id === b);
    if (!sa || !sb) return null;
    const mb = new Map(sb.pts.map(p => [p.t.getTime(), p]));
    const comun = sa.pts.filter(p => mb.has(p.t.getTime())).map(p => ({ t: p.t, a: p.v, b: mb.get(p.t.getTime()).v }));
    const salto = (TF() === "S" ? 8 : 5) * DIA, out = [];
    for (let j = 1; j < comun.length; j++) {
      const x = comun[j], y = comun[j - 1];
      if (x.t - y.t > salto) continue;   // hubo un hueco (fuera de temporada): no se compara contra un dato viejo
      const da = x.a / y.a - 1, db = x.b / y.b - 1;
      out.push({ t: x.t, da, db, va: x.a, vb: x.b, A: dir(da), B: dir(db) });
    }
    // m[A][B]: veces que A hizo (−1 bajó, 0 igual, 1 subió) y B hizo lo mismo; índices +1
    const m = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    out.forEach(p => m[p.A + 1][p.B + 1]++);
    const juntos = m[0][0] + m[2][2], contra = m[0][2] + m[2][0];
    return { sa, sb, out, m, juntos, contra, quietos: out.length - juntos - contra, p: pAzar(juntos, juntos + contra) };
  }
  const tipoPunto = p => p.A === 0 || p.B === 0 ? "igual" : p.A === p.B ? "juntos" : "contra";
  // Veredicto: [título, explicación, clase] · clase: juntos | contra | azar | nada | pocos
  function veredicto(R) {
    const n = R.juntos + R.contra;
    if (R.out.length < 8 || n < 5) return ["Pocos datos para concluir", "Hay muy pocas semanas en que cotizan y se mueven los dos productos. Prueba con todo el año o con otro par.", "pocos"];
    const ix = (R.juntos - R.contra) / n, pj = pctE(R.juntos / n);
    if (R.p >= ALFA) return Math.abs(ix) < 0.2
      ? ["Sin relación clara", `Fueron en la misma dirección ${R.juntos} de ${n} veces (${pj}), casi como lanzar una moneda: cada producto va por su lado.`, "nada"]
      : ["Puede ser casualidad", `Fueron en la misma dirección ${R.juntos} de ${n} veces (${pj}), pero con tan pocas semanas un reparto así sale por azar ${pctE(R.p)} de las veces. No alcanza para afirmar que estén relacionados.`, "azar"];
    return ix >= 0.5 ? ["Se mueven juntos con frecuencia", `Fueron en la misma dirección ${R.juntos} de ${n} veces (${pj}). Es poco probable que sea casualidad.`, "juntos"]
      : ix > 0 ? ["Tienden a moverse juntos", `Fueron en la misma dirección ${R.juntos} de ${n} veces (${pj}): no siempre, pero más de lo que daría el azar.`, "juntos"]
      : ix <= -0.5 ? ["Van en sentido contrario con frecuencia", `Fueron en sentido contrario ${R.contra} de ${n} veces (${pctE(R.contra / n)}). Es poco probable que sea casualidad.`, "contra"]
      : ["Tienden a ir en sentido contrario", `Fueron en sentido contrario ${R.contra} de ${n} veces (${pctE(R.contra / n)}): no siempre, pero más de lo que daría el azar.`, "contra"];
  }
  const confianza = R => R.juntos + R.contra < 5 ? "" : R.p < ALFA
    ? `<span class="an-conf an-conf-ok">Confiable · probabilidad de que sea azar: ${R.p < 0.001 ? "menos de 0.1%" : (R.p * 100).toFixed(1) + "%"}</span>`
    : `<span class="an-conf">No confiable · probabilidad de que sea azar: ${pctE(R.p)}</span>`;


  function cuadrantes(R, W, H) {
    const M = { l: 52, r: 18, t: 18, b: 46 }, PW = W - M.l - M.r, PH = H - M.t - M.b, f1 = n => n.toFixed(1);
    const abs = R.out.flatMap(p => [Math.abs(p.da), Math.abs(p.db)]).sort((a, b) => a - b);
    let lim = Math.max(0.05, (abs[Math.floor(abs.length * 0.95)] ?? 0.05) * 1.15);
    const paso = [0.01, 0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1].find(s => lim / s <= 4) ?? 1;
    lim = Math.ceil(lim / paso) * paso;
    const cl = d => Math.max(-lim, Math.min(lim, d));
    const x = d => M.l + (cl(d) + lim) / (2 * lim) * PW, y = d => M.t + (lim - cl(d)) / (2 * lim) * PH;
    const x0 = x(0), y0 = y(0), na = R.sa.c.nombre, nb = R.sb.c.nombre;
    const pc = v => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(Math.round(v * 100)) + "%";
    const ejes = [];
    for (let q = -lim; q <= lim + 1e-9; q += paso) {
      if (Math.abs(q) < 1e-9) continue;
      ejes.push(`<line x1="${f1(x(q))}" x2="${f1(x(q))}" y1="${M.t}" y2="${M.t + PH}" class="an-rejilla"/><text x="${f1(x(q))}" y="${M.t + PH + 16}" text-anchor="middle" class="an-eje">${pc(q)}</text>
        <line x1="${M.l}" x2="${M.l + PW}" y1="${f1(y(q))}" y2="${f1(y(q))}" class="an-rejilla"/><text x="${M.l - 6}" y="${f1(y(q) + 4)}" text-anchor="end" class="an-eje">${pc(q)}</text>`);
    }
    const fondo = `
      <rect x="${f1(x0)}" y="${M.t}" width="${f1(M.l + PW - x0)}" height="${f1(y0 - M.t)}" class="an-q-juntos"/>
      <rect x="${M.l}" y="${f1(y0)}" width="${f1(x0 - M.l)}" height="${f1(M.t + PH - y0)}" class="an-q-juntos"/>
      <rect x="${M.l}" y="${M.t}" width="${f1(x0 - M.l)}" height="${f1(y0 - M.t)}" class="an-q-contra"/>
      <rect x="${f1(x0)}" y="${f1(y0)}" width="${f1(M.l + PW - x0)}" height="${f1(M.t + PH - y0)}" class="an-q-contra"/>
      <rect x="${f1(x(-UMBRAL))}" y="${M.t}" width="${f1(x(UMBRAL) - x(-UMBRAL))}" height="${PH}" class="an-q-igual"/>
      <rect x="${M.l}" y="${f1(y(UMBRAL))}" width="${PW}" height="${f1(y(-UMBRAL) - y(UMBRAL))}" class="an-q-igual"/>`;
    const m = R.m, corto = s => s.length > 16 ? s.slice(0, 15) + "…" : s;
    const esquina = (xx, yy, ancla, t1, n) => `<text x="${f1(xx)}" y="${f1(yy)}" text-anchor="${ancla}" class="an-q-etq">${t1}<tspan class="an-q-n" dx="6">${n}</tspan></text>`;
    const pad = 10;
    const ang = PW < 480;   // en pantallas angostas, rótulos cortos para que no se encimen
    const esquinas = esquina(M.l + PW - pad, M.t + 18, "end", ang ? "Los dos ↑" : "Los dos suben", m[2][2])
      + esquina(M.l + pad, M.t + PH - pad, "start", ang ? "Los dos ↓" : "Los dos bajan", m[0][0])
      + esquina(M.l + pad, M.t + 18, "start", ang ? "Contrario" : `${corto(na)} baja, ${corto(nb)} sube`, m[0][2])
      + esquina(M.l + PW - pad, M.t + PH - pad, "end", ang ? "Contrario" : `${corto(na)} sube, ${corto(nb)} baja`, m[2][0]);
    // Puntos: el más reciente al final (encima) y marcado
    qPts = R.out.map((p, j) => ({ j, px: x(p.da), py: y(p.db) }));
    const fuera = p => Math.abs(p.da) > lim || Math.abs(p.db) > lim;
    const puntos = R.out.map((p, j) => {
      const t = tipoPunto(p), ult = j === R.out.length - 1;
      return `<circle cx="${f1(x(p.da))}" cy="${f1(y(p.db))}" r="${ult ? 6 : 4.5}" class="an-q-p an-q-${t}${fuera(p) ? " an-q-fuera" : ""}${ult ? " an-q-ult" : ""}"/>`;
    }).join("");
    const U = R.out.at(-1), ux = x(U.da), uy = y(U.db), izq = ux > M.l + PW * 0.7;
    const ultEtq = `<text x="${f1(ux + (izq ? -10 : 10))}" y="${f1(uy - 9)}" text-anchor="${izq ? "end" : "start"}" class="an-q-ult-t">Más reciente</text>`;
    let cur = "";
    if (qCursor != null && R.out[qCursor]) {
      const p = R.out[qCursor];
      cur = `<line x1="${f1(x(p.da))}" x2="${f1(x(p.da))}" y1="${f1(y0)}" y2="${f1(y(p.db))}" class="an-cursor"/><line x1="${f1(x0)}" x2="${f1(x(p.da))}" y1="${f1(y(p.db))}" y2="${f1(y(p.db))}" class="an-cursor"/>
        <circle cx="${f1(x(p.da))}" cy="${f1(y(p.db))}" r="8" class="an-q-sel"/>`;
    }
    return `<svg class="an-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Cuadrantes: cambio de ${na} contra cambio de ${nb}">
      ${fondo}${ejes.join("")}
      <line x1="${f1(x0)}" x2="${f1(x0)}" y1="${M.t}" y2="${M.t + PH}" class="an-q-cero"/><line x1="${M.l}" x2="${M.l + PW}" y1="${f1(y0)}" y2="${f1(y0)}" class="an-q-cero"/>
      ${esquinas}${puntos}${ultEtq}${cur}
      <text x="${f1(M.l + PW / 2)}" y="${H - 6}" text-anchor="middle" class="an-q-tit">Cambio de ${na} →</text>
      <text transform="translate(14 ${f1(M.t + PH / 2)}) rotate(-90)" text-anchor="middle" class="an-q-tit">Cambio de ${nb} →</text>
      <rect class="an-hit-q" x="${M.l}" y="${M.t}" width="${PW}" height="${PH}" fill="transparent" data-w="${W}"/>
    </svg>`;
  }

  const per = () => TF() === "S" ? "semanas" : "días";
  const pctE = v => Math.round(v * 100) + "%";
  function frase(R, a) {   // a = −1 (bajó A) o 1 (subió A)
    const fila = R.m[a + 1], n = fila[0] + fila[1] + fila[2], na = R.sa.c.nombre, nb = R.sb.c.nombre.toLowerCase();
    if (!n) return `<p class="an-q-frase">${na} no ${a < 0 ? "bajó" : "subió"} más de 2% en ningún periodo.</p>`;
    const mismo = a < 0 ? fila[0] : fila[2], contra = a < 0 ? fila[2] : fila[0];
    return `<p class="an-q-frase"><b>Cuando ${a < 0 ? "bajó" : "subió"} ${na.toLowerCase()}</b> (${n} ${per()}), ${nb} ${a < 0 ? "también bajó" : "también subió"} en <em>${pctE(mismo / n)}</em>,
      se quedó igual en <em>${pctE(fila[1] / n)}</em> y ${a < 0 ? "subió" : "bajó"} en <em>${pctE(contra / n)}</em>.</p>`;
  }
  function tabla3(R) {
    const na = R.sa.c.nombre, nb = R.sb.c.nombre, et = ["bajó", "igual", "subió"];
    return `<table class="an-q-tabla"><thead><tr><th>${na} ↓ · ${nb} →</th>${et.map(e => `<th class="num">${e}</th>`).join("")}<th class="num">Total</th></tr></thead><tbody>
      ${[0, 1, 2].map(i => { const n = R.m[i][0] + R.m[i][1] + R.m[i][2]; return `<tr><th>${et[i]}</th>${[0, 1, 2].map(k => {
        const c = R.m[i][k], t = i === 1 || k === 1 ? "igual" : i === k ? "juntos" : "contra";
        return `<td class="num an-q-c-${t}">${c}<small>${n ? pctE(c / n) : "—"}</small></td>`; }).join("")}<td class="num">${n}</td></tr>`; }).join("")}
      </tbody></table>`;
  }
  function lecturaQ(R) {
    if (qCursor == null || !R.out[qCursor]) {
      const [t] = veredicto(R);
      return `<span class="an-lect-t">${t}</span><span>${R.juntos} ${per()} en la misma dirección · ${R.contra} en sentido contrario · ${R.quietos} con al menos uno estable (±2%)</span>`;
    }
    const p = R.out[qCursor], u = s => s.u, sp2 = d => `<em class="${d > UMBRAL ? "an-up" : d < -UMBRAL ? "an-dn" : ""}">${pct(d)}</em>`;
    return `<span class="an-lect-t">${TF() === "S" ? "Semana del " : ""}${fd(p.t)}</span>
      <span><i style="background:${color(R.sa.id)}"></i>${R.sa.c.nombre} ${sp2(p.da)} <small>${n2(p.va)} ${u(R.sa)}</small></span>
      <span><i style="background:${color(R.sb.id)}"></i>${R.sb.c.nombre} ${sp2(p.db)} <small>${n2(p.vb)} ${u(R.sb)}</small></span>
      <span>${{ juntos: "Se movieron en la misma dirección", contra: "Se movieron en sentido contrario", igual: "Al menos uno se quedó igual" }[tipoPunto(p)]}</span>`;
  }
  function principalQ() {
    parValido();
    const S = series(), R = pares(S);
    const opcion = sel => op.items.map(id => `<option value="${id}"${id === sel ? " selected" : ""}>${porId(id)?.nombre ?? id}</option>`).join("");
    const selector = `<div class="an-q-par">
        <label><span><i style="background:${color(op.qa)}"></i>Eje horizontal</span><select data-an-q="qa">${opcion(op.qa)}</select></label>
        <button type="button" class="an-q-cambiar" data-an="invertir:1" aria-label="Intercambiar ejes" title="Intercambiar ejes">⇄</button>
        <label><span><i style="background:${color(op.qb)}"></i>Eje vertical</span><select data-an-q="qb">${opcion(op.qb)}</select></label>
      </div>`;
    if (!R || R.out.length < 3) return `<div class="an-titulo"><h3>¿Cuando uno baja, el otro también?</h3></div>${selector}
      <div class="an-vacio"><b>Casi no coinciden en el tiempo</b><span>Estos productos cotizan en temporadas distintas en este periodo. Prueba con otro par o con todo el año.</span></div>`;
    const [vt, vd, vc] = veredicto(R);
    return `
      <div class="an-titulo"><h3>¿Cuando uno baja, el otro también?</h3><p>Cambio ${TF() === "S" ? "semanal (promedio de cada semana contra la anterior)" : "diario (cada día hábil contra el anterior)"} · ${R.out.length} ${per()} con dato de los dos · ${periodoTxt(S.filter(s => s.id === op.qa || s.id === op.qb))}</p></div>
      ${selector}
      <div class="an-lectura" aria-live="polite">${lecturaQ(R)}</div>
      <div class="an-q-cuerpo">
        <div class="an-graf an-graf-q" data-an-graf></div>
        <div class="an-q-lado">
          <div class="an-q-veredicto an-v-${vc}"><b>${vt}</b><span>${vd}</span>${confianza(R)}</div>
          ${frase(R, -1)}${frase(R, 1)}
          ${tabla3(R)}
        </div>
      </div>
      <div class="an-leyenda"><span><i class="an-l-pt an-q-juntos-l"></i>Misma dirección</span><span><i class="an-l-pt an-q-contra-l"></i>Sentido contrario</span><span><i class="an-l-pt an-q-igual-l"></i>Al menos uno igual (±2%)</span><span><i class="an-l-pt an-q-fuera-l"></i>Cambio fuera de escala (en el borde)</span></div>
      <p class="an-nota">Cada punto es ${TF() === "S" ? "una semana" : "un día hábil"}: a la derecha si ${R.sa.c.nombre.toLowerCase()} subió contra ${TF() === "S" ? "la semana" : "el día"} anterior, a la izquierda si bajó; arriba si ${R.sb.c.nombre.toLowerCase()} subió, abajo si bajó.
        Un cambio menor a 2% se toma como "se quedó igual" (franja gris). "Confiable" quiere decir que un reparto tan desigual entre "misma dirección" y "sentido contrario" saldría por azar menos de 1% de las veces. Solo se comparan periodos seguidos en que cotizan los dos productos; tras un hueco de temporada no se compara contra un dato viejo.
        La escala se ajusta al 95% de los cambios; los pocos más extremos se dibujan huecos en el borde. Que dos productos se muevan juntos no quiere decir que uno cause al otro: pueden compartir temporada, clima o flete.</p>`;
  }
  function pintarQ() {
    const g = caja?.querySelector("[data-an-graf]");
    if (!g) return;
    const R = pares(series());
    if (!R) return;
    const W = Math.max(300, Math.floor(g.clientWidth)), H = Math.min(W, Math.max(300, Math.min(600, Math.floor(window.innerHeight * 0.62))));
    g.innerHTML = cuadrantes(R, W, H);
    const l = caja.querySelector(".an-lectura");
    if (l) l.innerHTML = lecturaQ(R);
  }

  // ---------- Vista 3: Mapa de calor ----------
  // Todos los productos de la fuente contra todos (la variedad por omisión de cada uno). Cada celda resume un par con el
  // mismo cálculo de Cuadrantes: (semanas en la misma dirección − en sentido contrario) / (las dos), de −1 a +1.
  // Azul: se mueven juntos · naranja: en sentido contrario · gris: sin relación. Lleno solo si pasa la prueba de
  // confianza; tenue si puede ser casualidad; vacío si hay pocos datos. Clic en una celda → Cuadrantes de ese par.
  let hCel = null, hCursor = null, hCache = null;
  function matriz() {
    const llave = [op.fuente, op.periodo, op.tipoCalor].join("|");
    if (hCache?.llave === llave && hCache.d === D()) return hCache;
    const ids = catalogo().filter(c => c.util && (op.tipoCalor === "todos" || c.tipo === op.tipoCalor))
      .map(c => serieDe(c.k)).filter((id, j, a) => id && a.indexOf(id) === j)
      .sort((a, b) => (porId(a).tipo + porId(a).nombre).localeCompare(porId(b).tipo + porId(b).nombre, "es"));
    const S = ids.length ? series(ids) : [];
    const vivos = S.map(s => s.id), celdas = {};
    for (let i = 0; i < vivos.length; i++) for (let j = 0; j < i; j++) {
      const R = pares(S, vivos[i], vivos[j]), n = R.juntos + R.contra;
      celdas[vivos[i] + "|" + vivos[j]] = { a: vivos[i], b: vivos[j], juntos: R.juntos, contra: R.contra, n, sem: R.out.length, p: R.p,
        ix: n ? (R.juntos - R.contra) / n : 0, pocos: R.out.length < 8 || n < 5 };
    }
    hCache = { llave, d: D(), ids: vivos, celdas, S };
    return hCache;
  }
  const celda = (H, a, b) => H.celdas[a + "|" + b] ?? H.celdas[b + "|" + a];
  // Color de la celda: mezcla del extremo (azul o naranja) con el gris neutro según la fuerza; tenue si no es confiable
  function colorCelda(c) {
    if (c.pocos) return null;
    const fuerza = Math.min(1, Math.abs(c.ix)), polo = c.ix >= 0 ? "var(--an-1)" : "var(--an-2)";
    const pct = Math.round((c.p < ALFA ? 35 + fuerza * 65 : fuerza * 30));
    return `color-mix(in oklab, ${polo} ${pct}%, var(--an-neutro))`;
  }
  function calor(H, W) {
    const N = H.ids.length, ang = W < 600, f1 = n => n.toFixed(1);
    const nom = id => { const n = porId(id).nombre, lim = ang ? 10 : 16; return n.length > lim ? n.slice(0, lim - 1) + "…" : n; };
    const LW = ang ? 74 : 118, cel = Math.max(10, Math.min(30, Math.floor((W - LW - 10) / N))), LH = ang ? 64 : 96;
    const ancho = LW + cel * N + 10, alto = cel * N + LH;
    hCel = { LW, cel, N, ids: H.ids, ancho };
    let rects = "";
    for (let i = 0; i < N; i++) for (let j = 0; j < i; j++) {
      const c = celda(H, H.ids[i], H.ids[j]), col = colorCelda(c), x = LW + j * cel, y = i * cel;
      rects += col
        ? `<rect x="${x + 1}" y="${y + 1}" width="${cel - 2}" height="${cel - 2}" rx="2" style="fill:${col}" class="an-h-c${c.p < ALFA ? " an-h-ok" : ""}"/>`
        : `<rect x="${x + 1}" y="${y + 1}" width="${cel - 2}" height="${cel - 2}" rx="2" class="an-h-vacia"/>`;
      if (c.p < ALFA && !c.pocos && cel >= 16) rects += `<circle cx="${f1(x + cel / 2)}" cy="${f1(y + cel / 2)}" r="2" class="an-h-punto"/>`;
    }
    const filas = H.ids.map((id, i) => `<text x="${LW - 6}" y="${f1(i * cel + cel / 2 + 4)}" text-anchor="end" class="an-h-etq${hCursor && (hCursor[0] === id || hCursor[1] === id) ? " on" : ""}">${nom(id)}</text>`).join("");
    const cols = H.ids.map((id, j) => `<text transform="translate(${f1(LW + j * cel + cel / 2 + 3)} ${N * cel + 8}) rotate(-60)" text-anchor="end" class="an-h-etq${hCursor && (hCursor[0] === id || hCursor[1] === id) ? " on" : ""}">${nom(id)}</text>`).join("");
    let sel = "";
    if (hCursor) {
      const i = H.ids.indexOf(hCursor[0]), j = H.ids.indexOf(hCursor[1]);
      sel = `<rect x="${LW + j * cel}" y="${i * cel}" width="${cel}" height="${cel}" rx="3" class="an-h-sel"/>`;
    }
    return `<svg class="an-svg" viewBox="0 0 ${ancho} ${alto}" width="${ancho}" height="${alto}" role="img" aria-label="Mapa de calor: qué tan seguido se mueven juntos los precios de ${N} productos">
      ${rects}${filas}${cols}${sel}
      <rect class="an-hit-h" x="${LW}" y="0" width="${cel * N}" height="${cel * N}" fill="transparent" data-w="${ancho}"/>
    </svg>`;
  }
  function lecturaH(H) {
    if (!hCursor) return `<span class="an-lect-t">Pasa el cursor por una celda</span><span>Haz clic para ver ese par en Cuadrantes, semana por semana.</span>`;
    const c = celda(H, hCursor[0], hCursor[1]), na = porId(c.a).nombre, nb = porId(c.b).nombre;
    if (c.pocos) return `<span class="an-lect-t">${na} y ${nb}</span><span>Pocos datos: solo ${c.sem} semanas en que cotizan los dos.</span>`;
    const [t] = veredicto({ ...c, out: { length: c.sem } });
    return `<span class="an-lect-t">${na} y ${nb}: ${t.toLowerCase()}</span><span>Misma dirección <em>${c.juntos}</em> · sentido contrario <em>${c.contra}</em> · de ${c.sem} semanas</span>
      <span>${c.p < ALFA ? "Confiable" : "No confiable"} (azar: ${c.p < 0.001 ? "<0.1%" : c.p < 0.1 ? (c.p * 100).toFixed(1) + "%" : pctE(c.p)})</span><span class="an-h-clic">Clic para ver en Cuadrantes →</span>`;
  }
  function hallazgos(H) {
    const todas = Object.values(H.celdas).filter(c => !c.pocos), ok = todas.filter(c => c.p < ALFA);
    const esperados = todas.length * ALFA;
    const fila = c => `<button type="button" class="an-h-hall" data-an="par:${c.a}|${c.b}"><i style="background:${colorCelda(c)}"></i><span>${porId(c.a).nombre} y ${porId(c.b).nombre}</span><small>${c.ix >= 0 ? c.juntos : c.contra} de ${c.n}</small></button>`;
    const juntos = ok.filter(c => c.ix > 0).sort((a, b) => a.p - b.p), contra = ok.filter(c => c.ix < 0).sort((a, b) => a.p - b.p);
    const casi = todas.filter(c => c.p >= ALFA && Math.abs(c.ix) >= 0.5).sort((a, b) => a.p - b.p).slice(0, 4);
    return `
      <div class="an-q-veredicto an-v-${ok.length > esperados * 2 ? "juntos" : "azar"}"><b>${ok.length} de ${todas.length} pares confiables</b>
        <span>${ok.length <= Math.max(1, esperados * 2)
          ? `Por puro azar se esperarían unos ${Math.max(1, Math.round(esperados))}: con ${H.S[0] ? "los datos de este periodo" : "estos datos"} casi ningún par muestra una relación que se distinga de la casualidad. Cada producto sigue, sobre todo, su propia oferta.`
          : `Más de lo que daría el azar (unos ${Math.round(esperados)}): hay productos cuyos precios sí tienden a moverse en la misma dirección o en sentido contrario.`}</span></div>
      ${juntos.length ? `<div class="an-h-grupo"><span class="an-etq">Se mueven juntos (confiable)</span>${juntos.slice(0, 6).map(fila).join("")}</div>` : ""}
      ${contra.length ? `<div class="an-h-grupo"><span class="an-etq">Van en sentido contrario (confiable)</span>${contra.slice(0, 6).map(fila).join("")}</div>` : ""}
      ${casi.length ? `<div class="an-h-grupo"><span class="an-etq">Parecen relacionados, pero puede ser casualidad</span>${casi.map(fila).join("")}</div>` : ""}`;
  }
  function principalH() {
    const H = matriz();
    const tipos = seg("tipoCalor", op.tipoCalor, [["todos", "Todos"], ["Hortaliza", "Hortalizas"], ["Fruta", "Frutas"]]);
    if (H.ids.length < 3) return `<div class="an-titulo"><h3>¿Qué productos se mueven juntos?</h3></div><div class="an-h-filtro">${tipos}</div>
      <div class="an-vacio"><b>Muy pocos productos</b><span>Esta fuente cotiza menos de tres productos de este tipo en el periodo.</span></div>`;
    return `
      <div class="an-titulo"><h3>¿Qué productos se mueven juntos?</h3><p>${H.ids.length} productos · ${Object.keys(H.celdas).length} pares · cambio semanal · ${periodoTxt(H.S)}</p></div>
      <div class="an-h-filtro">${tipos}</div>
      <div class="an-lectura" aria-live="polite">${lecturaH(H)}</div>
      <div class="an-q-cuerpo">
        <div class="an-graf an-graf-h" data-an-graf></div>
        <div class="an-q-lado">${hallazgos(H)}</div>
      </div>
      <div class="an-h-escala">
        <span>Sentido contrario</span>
        <i style="background:linear-gradient(90deg, var(--an-2), var(--an-neutro), var(--an-1))"></i>
        <span>Se mueven juntos</span>
        <span class="an-h-ley"><b class="an-h-ley-ok"></b>Lleno con punto: confiable</span>
        <span class="an-h-ley"><b class="an-h-ley-tenue"></b>Tenue: puede ser casualidad</span>
        <span class="an-h-ley"><b class="an-h-ley-vacia"></b>Pocos datos</span>
      </div>
      <p class="an-nota">Cada celda compara dos productos semana a semana, con el mismo cálculo de Cuadrantes: cuántas semanas fueron en la misma dirección y cuántas en sentido contrario (cambios menores a 2% no cuentan).
        El color va del naranja (casi siempre en sentido contrario) al azul (casi siempre juntos), pasando por gris (tan seguido de una forma como de otra).
        Una celda se pinta llena solo si el reparto es tan desigual que saldría por azar menos de 1% de las veces; si no, queda tenue. Con muchos pares, siempre habrá algunos que parezcan relacionados por suerte: por eso se compara cuántos pares confiables hay contra los que daría el azar.
        Se usa la variedad principal de cada producto. Que dos precios se muevan juntos no quiere decir que uno cause al otro.</p>`;
  }
  function pintarH() {
    const g = caja?.querySelector("[data-an-graf]");
    if (!g) return;
    const H = matriz();
    if (H.ids.length < 3) return;
    g.innerHTML = calor(H, Math.max(300, Math.floor(g.clientWidth)));
    const l = caja.querySelector(".an-lectura");
    if (l) l.innerHTML = lecturaH(H);
  }
  // Del mapa de calor (o de un hallazgo) a Cuadrantes con ese par en la lista
  function abrirPar(a, b) {
    let items = op.items.filter(x => x !== a && x !== b);
    items = [a, b, ...items].slice(0, MAX);
    op.items = items; op.qa = a; op.qb = b; op.vista = "cuadrantes"; qCursor = null; hCursor = null;
    pintar();
    caja.querySelector(".an-main").scrollTop = 0;
  }

  // ---------- Ventana ----------
  const seg = (nombre, valor, opciones) => `<div class="an-seg" role="radiogroup">${opciones.map(([v, t]) =>
    `<button type="button" role="radio" aria-checked="${valor === v}" class="${valor === v ? "on" : ""}" data-an="${nombre}:${v}">${t}</button>`).join("")}</div>`;
  function lado() {
    const cat = catalogo(), q = op.buscar.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const lista = cat.filter(c => !q || c.nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q));
    const lleno = op.items.length >= MAX;
    return `
      <div class="an-bloque"><span class="an-etq">Fuente</span>${seg("fuente", op.fuente, Object.values(FUENTES).map(f => [f.id, f.nombre]))}
        <p class="an-sub">${FUENTES[op.fuente].desc}</p></div>
      <div class="an-bloque"><span class="an-etq">Productos <small>${op.items.length} de ${MAX}</small></span>
        <div class="an-elegidos">${op.items.map(id => { const c = porId(id); return c ? `<button type="button" class="an-chip" data-an="quitar:${id}" aria-label="Quitar ${c.nombre}" style="--c:${color(id)}"><i></i>${c.nombre}<span aria-hidden="true">✕</span></button>` : ""; }).join("")}</div>
        <label class="an-buscar"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 16l4.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><input type="search" placeholder="Agregar producto" value="${op.buscar.replace(/"/g, "&quot;")}" data-an-buscar autocomplete="off"></label>
        <div class="an-lista">${lista.map(c => {
          const on = op.items.includes(c.id), dis = !on && (lleno || !c.util);
          return `<button type="button" class="an-op${on ? " on" : ""}" data-an="${on ? "quitar" : "agregar"}:${c.id}"${dis ? " disabled" : ""} title="${!c.util ? "Pocos datos este año" : lleno && !on ? "Máximo 5 productos" : ""}">
            <i${on ? ` style="background:${color(c.id)}"` : ""}></i><span>${c.nombre}</span><small>${c.util ? c.tipo : "sin datos"}</small></button>`;
        }).join("") || '<p class="an-sub">Sin coincidencias.</p>'}</div></div>
      <div class="an-bloque"><span class="an-etq">Periodo</span>${seg("periodo", op.periodo, PERIODOS)}</div>
      <div class="an-bloque"${op.vista !== "lineas" ? " hidden" : ""}><span class="an-etq">Escala</span>${seg("escala", op.escala, [["indice", "Índice base 100"], ["precio", "Precio"]])}</div>
      <div class="an-bloque"${op.vista !== "lineas" ? " hidden" : ""}><span class="an-etq">Frecuencia</span>${seg("tf", op.tf, [["S", "Semanal"], ["D", "Diario"]])}</div>`;
  }
  function principal() {
    const d = D();
    if (!d) return `<div class="an-vacio">Cargando la serie diaria…</div>`;
    if (op.vista === "calor") return principalH();
    if (op.items.length < 2) return `<div class="an-vacio"><b>Elige al menos dos productos</b><span>Agrégalos desde la lista de la izquierda (hasta ${MAX}).</span></div>`;
    if (op.vista === "cuadrantes") return principalQ();
    const S = series();
    if (S.length < 2) return `<div class="an-vacio"><b>Sin datos en este periodo</b><span>Prueba con un periodo más largo.</span></div>`;
    const unidades = [...new Set(S.map(s => s.u))];
    const titulo = op.escala === "indice"
      ? `Índice base 100 · cada serie vale 100 en su primer dato del periodo`
      : `Precio · ${unidades.length === 1 ? unidades[0] : "unidades distintas (" + unidades.join(", ") + "): los niveles no se comparan entre sí"}`;
    return `
      <div class="an-titulo"><h3>¿Se mueven juntos?</h3><p>${titulo} · ${TF() === "S" ? "promedio semanal" : "precio diario"} · ${periodoTxt(S)}</p></div>
      <div class="an-lectura" aria-live="polite">${lectura(S)}</div>
      <div class="an-graf" data-an-graf></div>
      <div class="an-leyenda">${S.map(s => `<span><i style="background:${color(s.id)}"></i>${s.c.nombre}</span>`).join("")}${op.escala === "indice" ? '<span><i class="an-l-base"></i>100 = primer dato</span>' : ""}</div>
      ${tabla(S)}
      <p class="an-nota">${op.escala === "indice"
        ? "Índice base 100: cada serie se divide entre su primer dato del periodo y se multiplica por 100; 120 quiere decir 20% más caro que al inicio. Así se comparan productos que se venden en cajas o unidades distintas. "
        : ""}Fuente: ${op.fuente === "frontera"
        ? "USDA AMS Market News, precio FOB del producto mexicano en la frontera (convencional), un dato por día hábil; en kg cuando la caja trae peso, si no, por caja."
        : "SNIIM (Secretaría de Economía), mediana del precio frecuente de calidad primera en las centrales de abasto, $/kg, un dato por día hábil."}
        Semanal: promedio de los días hábiles de cada semana (de lunes a viernes). Las líneas se cortan donde el producto deja de cotizar más de tres semanas.</p>`;
  }
  function pintarGrafico() {
    if (op.vista === "cuadrantes") return pintarQ();
    if (op.vista === "calor") return pintarH();
    const g = caja?.querySelector("[data-an-graf]");
    if (!g || op.vista !== "lineas") return;
    const S = series(), W = Math.max(320, Math.floor(g.clientWidth)), H = Math.max(260, Math.min(520, Math.floor(window.innerHeight * 0.5)));
    g.innerHTML = lineas(S, W, H);
    const l = caja.querySelector(".an-lectura");
    if (l) l.innerHTML = lectura(S);
  }
  function pintar() {
    if (!caja) return;
    asignarColores();
    const busco = document.activeElement?.matches?.("[data-an-buscar]"), pos = busco ? document.activeElement.selectionStart : 0;
    const scrollLista = caja.querySelector(".an-lista")?.scrollTop ?? 0;
    caja.querySelector(".an-lado").innerHTML = lado();
    caja.querySelector(".an-main").innerHTML = principal();
    caja.querySelectorAll(".an-tabs [data-an]").forEach(b => { const on = b.dataset.an === "vista:" + op.vista; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
    const li = caja.querySelector(".an-lista");
    if (li) li.scrollTop = scrollLista;
    if (busco) { const i = caja.querySelector("[data-an-buscar]"); i.focus(); i.setSelectionRange(pos, pos); }
    pintarGrafico();
    // Enlace: fuente y series; en cuadrantes, además la vista y el par (posiciones en la lista): cuadrantes~frontera~0~1
    const cab = op.vista === "cuadrantes" && op.items.length >= 2 ? ["cuadrantes", op.fuente, op.items.indexOf(op.qa), op.items.indexOf(op.qb)].join("~")
      : op.vista === "calor" ? "calor~" + op.fuente : op.fuente;
    window.AnalisisEntrada?.escribir([cab, ...op.items].join("."));
  }

  function crear() {
    caja = document.createElement("div");
    caja.className = "an";
    caja.setAttribute("role", "dialog");
    caja.setAttribute("aria-modal", "true");
    caja.setAttribute("aria-labelledby", "anTitulo");
    caja.innerHTML = `
      <header class="an-cab">
        <div class="an-marca"><span class="an-etq">Collecta · Mapa Agroalimentario</span><h2 id="anTitulo">Analizar precios</h2></div>
        <div class="an-tabs" role="tablist">
          <button type="button" role="tab" data-an="vista:lineas">Líneas</button>
          <button type="button" role="tab" data-an="vista:calor">Mapa de calor</button>
          <button type="button" role="tab" data-an="vista:cuadrantes">Cuadrantes</button>
        </div>
        <button type="button" class="an-cerrar" data-an="cerrar" aria-label="Cerrar y volver al mapa"><span>Volver al mapa</span>✕</button>
      </header>
      <div class="an-cuerpo">
        <aside class="an-lado" aria-label="Opciones del comparativo"></aside>
        <section class="an-main" aria-label="Gráfico comparativo"></section>
      </div>`;
    document.body.appendChild(caja);

    caja.addEventListener("click", ev => {
      if (ev.target.closest?.(".an-hit-h")) { if (hCursor) abrirPar(hCursor[0], hCursor[1]); return; }
      const b = ev.target.closest("[data-an]");
      if (!b || b.disabled) return;
      const [a, v] = b.dataset.an.split(/:(.*)/s);
      if (a === "cerrar") return window.AnalisisEntrada.pedirCierre();
      if (a === "vista") { op.vista = v; cursor = null; qCursor = null; hCursor = null; }
      else if (a === "tipoCalor") { op.tipoCalor = v; hCursor = null; }
      else if (a === "par") { const [x, y] = v.split("|"); return abrirPar(x, y); }
      else if (a === "invertir") { [op.qa, op.qb] = [op.qb, op.qa]; qCursor = null; }
      else if (a === "fuente") return cambiarFuente(v);
      else if (a === "periodo") { op.periodo = v; qCursor = null; }
      else if (a === "escala") op.escala = v;
      else if (a === "tf") { op.tf = v; cursor = null; qCursor = null; }
      else if (a === "quitar") op.items = op.items.filter(x => x !== v);
      else if (a === "agregar" && op.items.length < MAX && !op.items.includes(v)) op.items = [...op.items, v];
      pintar();
      caja.querySelector(`[data-an="${CSS.escape(b.dataset.an)}"]`)?.focus({ preventScroll: true });
    });
    caja.addEventListener("change", ev => {
      const s = ev.target.closest?.("select[data-an-q]");
      if (!s) return;
      const otro = s.dataset.anQ === "qa" ? "qb" : "qa";
      if (op[otro] === s.value) op[otro] = op[s.dataset.anQ];   // elegir en un eje el producto del otro los intercambia
      op[s.dataset.anQ] = s.value;
      qCursor = null;
      pintar();
      caja.querySelector(`select[data-an-q="${s.dataset.anQ}"]`)?.focus({ preventScroll: true });
    });
    caja.addEventListener("input", ev => { if (ev.target.matches("[data-an-buscar]")) { op.buscar = ev.target.value; pintar(); } });
    caja.addEventListener("pointermove", ev => {
      const hh = ev.target.closest?.(".an-hit-h");
      if (hh && hCel) {   // mapa de calor: la celda bajo el puntero (solo la mitad de abajo de la matriz)
        const r = hh.ownerSVGElement.getBoundingClientRect(), k = +hh.dataset.w / r.width;
        const j = Math.floor(((ev.clientX - r.left) * k - hCel.LW) / hCel.cel), i = Math.floor(((ev.clientY - r.top) * k) / hCel.cel);
        const nuevo = i >= 0 && j >= 0 && i < hCel.N && j < i ? [hCel.ids[i], hCel.ids[j]] : null;
        if (String(nuevo) === String(hCursor)) return;
        hCursor = nuevo;
        hh.style.cursor = nuevo ? "pointer" : "default";
        return pintarH();
      }
      const hq = ev.target.closest?.(".an-hit-q");
      if (hq) {   // cuadrantes: el punto más cercano al puntero, a menos de 30 px
        const r = hq.ownerSVGElement.getBoundingClientRect(), k = +hq.dataset.w / r.width;
        const mx = (ev.clientX - r.left) * k, my = (ev.clientY - r.top) * k;
        let best = null, bd = 30 * k;
        qPts.forEach(p => { const d = Math.hypot(p.px - mx, p.py - my); if (d < bd) { bd = d; best = p.j; } });
        if (best === qCursor) return;
        qCursor = best;
        return pintarQ();
      }
      const hit = ev.target.closest?.(".an-hit");
      if (!hit) return;
      const r = hit.getBoundingClientRect(), fr = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
      const t = +hit.dataset.t0 + fr * (+hit.dataset.t1 - +hit.dataset.t0);
      // se ajusta al día o semana con dato más cercano de cualquier serie
      const S = series(), cand = S.flatMap(s => s.pts.map(p => p.t.getTime()));
      const t2 = cand.reduce((m, c) => Math.abs(c - t) < Math.abs(m - t) ? c : m, cand[0]);
      if (t2 === cursor) return;
      cursor = t2;
      pintarGrafico();
    });
    caja.addEventListener("pointerout", ev => {
      if (ev.target.closest?.(".an-hit-h") && !ev.relatedTarget?.closest?.(".an-hit-h")) { if (hCursor) { hCursor = null; pintarH(); } return; }
      if (ev.target.closest?.(".an-hit-q") && !ev.relatedTarget?.closest?.(".an-hit-q")) { if (qCursor != null) { qCursor = null; pintarQ(); } return; }
      if (!ev.target.closest?.(".an-hit") || ev.relatedTarget?.closest?.(".an-hit")) return;
      if (cursor != null) { cursor = null; pintarGrafico(); }
    });
    document.addEventListener("keydown", ev => { if (ev.key === "Escape" && caja && !caja.hidden) window.AnalisisEntrada.pedirCierre(); });
    ro = new ResizeObserver(() => pintarGrafico());
    ro.observe(caja.querySelector(".an-main"));
  }

  function cambiarFuente(f) {
    if (!FUENTES[f]) return;
    const prods = [...new Set(op.items.map(id => id.split("~")[0]))];
    op.fuente = f;
    cursor = null;
    const seguir = () => {
      const nuevos = prods.map(serieDe).filter(Boolean);   // mismos productos en la otra fuente, si los cotiza
      op.items = nuevos.length >= 2 ? nuevos.slice(0, MAX) : porOmision(prods[0]);
      pintar();
    };
    if (D()) return seguir();
    pintar();   // "Cargando…"
    window.Paleta.cargar(FUENTES[f].archivo, () => !!FUENTES[f].datos()).then(seguir)
      .catch(() => { caja.querySelector(".an-main").innerHTML = '<div class="an-vacio"><b>No se pudo cargar la serie.</b></div>'; });
  }

  // ---------- Abrir y cerrar con animación (la ventana crece desde el botón) ----------
  const reducir = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  function recorte(rect) {
    if (!rect) return "inset(48% 48% 48% 48% round 14px)";
    const W = window.innerWidth, H = window.innerHeight;
    return `inset(${rect.top}px ${Math.max(0, W - rect.right)}px ${Math.max(0, H - rect.bottom)}px ${rect.left}px round 10px)`;
  }
  let rectOrigen = null;
  function abrir(ctx = {}, rect = null, origen = null) {
    if (!caja) crear();
    origenEl = origen;
    rectOrigen = rect;
    if (ctx.fuente?.includes("~")) {   // enlace a una vista: cuadrantes~frontera~0~1
      const [v, f, ia, ib] = ctx.fuente.split("~");
      ctx.fuente = f;
      if (v === "cuadrantes") { op.vista = v; ctx.par = [+ia, +ib]; }
      if (v === "calor") op.vista = v;
    }
    if (ctx.fuente && FUENTES[ctx.fuente]) op.fuente = ctx.fuente;
    const preparar = () => {
      if (ctx.items?.length) op.items = ctx.items.filter(id => porId(id)?.util).slice(0, MAX);
      else op.items = porOmision(ctx.k, ctx.semilla);
      if (op.items.length < 2 && !ctx.items) op.items = porOmision(null);
      if (ctx.par) { op.qa = op.items[ctx.par[0]] ?? null; op.qb = op.items[ctx.par[1]] ?? null; }
      op.buscar = ""; cursor = null; qCursor = null;
      pintar();
    };
    caja.hidden = false;
    caja.classList.remove("cerrando");
    if (!reducir()) {
      caja.style.transition = "none";
      caja.style.clipPath = recorte(rect);
      caja.classList.remove("lista");
      void caja.offsetWidth;
      caja.style.transition = "";
      requestAnimationFrame(() => { caja.style.clipPath = "inset(0 0 0 0 round 0px)"; caja.classList.add("lista"); });
    } else caja.classList.add("lista");
    if (D()) preparar();
    else {
      caja.querySelector(".an-main").innerHTML = principal();
      window.Paleta.cargar(FUENTES[op.fuente].archivo, () => !!D()).then(preparar)
        .catch(() => { caja.querySelector(".an-main").innerHTML = '<div class="an-vacio"><b>No se pudo cargar la serie.</b></div>'; });
    }
    caja.querySelector(".an-cerrar").focus({ preventScroll: true });
  }
  function cerrar() {
    if (!caja || caja.hidden) return;
    const fin = () => { caja.hidden = true; caja.classList.remove("cerrando"); caja.style.clipPath = ""; };
    const r = origenEl?.isConnected ? origenEl.getBoundingClientRect() : rectOrigen;
    if (reducir()) fin();
    else {
      caja.classList.add("cerrando");
      caja.classList.remove("lista");
      caja.style.clipPath = recorte(r && r.width ? r : null);
      setTimeout(fin, 380);
    }
    origenEl?.isConnected && origenEl.focus?.({ preventScroll: true });
  }

  window.Analisis = { abrir, cerrar };
})();

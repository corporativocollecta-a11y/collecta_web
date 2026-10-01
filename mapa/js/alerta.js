// ============================================================================
// Alerta de oferta (SIAP, Avance de Siembras y Cosechas al mismo corte de cada año; window.ALERTA_OFERTA, carga diferida).
// Cíclicos: superficie por cosechar (sembrada − cosechada − siniestrada), es decir, lo que falta por salir al mercado,
// contra el mismo corte del año anterior. Perennes: producción acumulada a la fecha contra el año anterior.
// Se exige un mínimo de superficie para no alarmar por cambios grandes sobre bases muy chicas.
// ============================================================================
(function () {
  const A = () => window.ALERTA_OFERTA;
  const fmt = n => Math.round(n).toLocaleString("es-MX");
  const fmtT = t => t >= 1e6 ? (t / 1e6).toFixed(2) + " Mt" : t >= 1e3 ? fmt(t / 1e3) + " mil t" : fmt(t) + " t";
  const pctVar = x => x == null ? "—" : (x >= 0 ? "+" : "−") + Math.abs(x * 100).toFixed(0) + "%";
  const MIN_HA = 500;          // superficie por cosechar mínima (en ambos años) para emitir señal nacional
  const MIN_HA_ESTADO = 100;
  const MIN_T = 5000;          // producción a la fecha mínima para perennes
  const NIVELES = [
    // Lenguaje de oferta, no de precio: la prueba 2019–2026 no encontró que la señal anticipe el precio
    [0.15, "Mucha más oferta por venir", "def"], [0.05, "Más oferta que en años anteriores", "alerta-tag"],
    [-0.05, "Oferta similar", "ok"], [-0.15, "Menos oferta que en años anteriores", "ok"], [-Infinity, "Mucha menos oferta por venir", "exc"]
  ];
  const nivel = s => s == null ? ["Sin señal", ""] : NIVELES.find(([u]) => s >= u).slice(1);
  let cargando = null;
  const cargar = () => cargando ??= window.Paleta.cargar("data/alerta_oferta.js", () => !!window.ALERTA_OFERTA);

  const pendiente = v => Math.max(0, v[0] - v[1] - v[2]);
  // Señal de un registro {año: [sembrada, cosechada, siniestrada, producción]}
  // Base = promedio de los dos años anteriores al mismo corte (un solo año atípico no dispara la alerta)
  function senal(reg, perenne, minHa = MIN_HA, minT = MIN_T) {
    const a = A().anio, act = reg[a];
    const previos = [reg[a - 1], reg[a - 2]].filter(Boolean);
    if (!act || !previos.length) return null;
    const med = f => previos.reduce((x, v) => x + f(v), 0) / previos.length;
    if (perenne) { const b = med(v => v[3]); return b >= minT && act[3] > 0 ? act[3] / b - 1 : null; }
    const b = med(pendiente);
    return b >= minHa && pendiente(act) >= minHa * 0.2 ? pendiente(act) / b - 1 : null;
  }
  const base = () => `el promedio ${A().anio - 2}–${A().anio - 1}`;
  function calcular(k) {
    const p = A()?.productos?.[k];
    if (!p) return null;
    const s = senal(p.nacional, p.perenne);
    const estados = Object.entries(p.estados).map(([id, reg]) => ({ id, reg, s: senal(reg, p.perenne, MIN_HA_ESTADO, 1000),
      peso: p.perenne ? reg[A().anio][3] : pendiente(reg[A().anio]) }))
      .filter(e => e.peso > 0).sort((a, b) => b.peso - a.peso);
    return { k, p, s, nivel: nivel(s), estados };
  }
  // Color por estado para el mapa: más oferta por venir → naranja; menos → lima (mide oferta: en la prueba 2019–2026, scripts/backtest_alerta.py, no anticipó precios)
  function colorEstado(k, id) {
    const p = A()?.productos?.[k], reg = p?.estados?.[id];
    const t = window.Paleta.tokens();
    if (!reg) return null;
    const s = senal(reg, p.perenne, MIN_HA_ESTADO, 1000);
    if (s == null) return t.sin;
    return s >= 0.15 ? t.def : s >= 0.05 ? t.med : s > -0.05 ? t.neutro : s > -0.15 ? t.auto : t.exc;
  }
  const leyendaHTML = k => `<h4>Oferta por venir vs. ${A().anio - 2}–${A().anio - 1}: ${window.PRODUCTOS?.[k]?.nombre ?? k}</h4>` +
    [["+15% o más (mucha más oferta)", 0.2], ["+5% a +15%", 0.1], ["Similar (±5%)", 0], ["−5% a −15%", -0.1], ["−15% o menos (mucha menos oferta)", -0.2], ["Sin señal", null]]
      .map(([t, s]) => { const T = window.Paleta.tokens(); const c = s == null ? T.sin : s >= 0.15 ? T.def : s >= 0.05 ? T.med : s > -0.05 ? T.neutro : s > -0.15 ? T.auto : T.exc;
        return `<div class="fila"><span class="sw" style="background:${c}"></span>${t}</div>`; }).join("") +
    `<div class="fila pie">SIAP, avance al ${A().corte}</div>`;

  // Sección de la pestaña Producto
  function html(k) {
    const R = calcular(k);
    if (!R) return '<p class="sub">El avance mensual del SIAP no incluye este producto.</p>';
    const a = A().anio, n = R.p.nacional, pe = R.p.perenne;
    const nombreEstado = id => window.ESTADOS.find(e => e.id === id)?.nombre ?? id;
    return `
      <div class="kpis">
        <div class="kpi ${R.s != null && R.s >= 0.15 ? "alerta" : "destacado"}"><div class="v">${R.nivel[0]}</div>
          <div class="l">${pe ? `Producción a la fecha: ${fmtT(n[a][3])}, ${pctVar(R.s)} contra ${base()} al mismo corte.`
            : `Superficie por cosechar: ${fmt(pendiente(n[a]))} ha, ${pctVar(R.s)} contra ${base()} al mismo corte.`}</div></div>
      </div>
      <div class="desplaza"><table class="compacta">
        <tr><th>Al ${A().corte.replace(/ de \d{4}$/, "")}</th>${A().anios.map(y => `<th class="num">${y}</th>`).join("")}</tr>
        <tr><td>Sembrada (ha)</td>${A().anios.map(y => `<td class="num">${fmt(n[y][0])}</td>`).join("")}</tr>
        <tr><td>Cosechada (ha)</td>${A().anios.map(y => `<td class="num">${fmt(n[y][1])}</td>`).join("")}</tr>
        <tr><td>Siniestrada (ha)</td>${A().anios.map(y => `<td class="num">${fmt(n[y][2])}</td>`).join("")}</tr>
        ${pe ? "" : `<tr class="resaltado"><td>Por cosechar (ha)</td>${A().anios.map(y => `<td class="num">${fmt(pendiente(n[y]))}</td>`).join("")}</tr>`}
        <tr${pe ? ' class="resaltado"' : ""}><td>Producción a la fecha</td>${A().anios.map(y => `<td class="num">${fmtT(n[y][3])}</td>`).join("")}</tr>
      </table></div>
      <h4 class="mini">Por estado</h4>
      <div class="desplaza"><table class="compacta">
        <tr><th>Estado</th><th class="num">${pe ? "Producción" : "Por cosechar"}</th><th class="num">vs. ${A().anio - 2}–${A().anio - 1}</th><th>Señal</th></tr>
        ${R.estados.slice(0, 10).map(e => { const [t, c] = nivel(e.s); return `<tr class="clic" data-id="${e.id}"><td>${nombreEstado(e.id)}</td>
          <td class="num">${pe ? fmtT(e.peso) : fmt(e.peso) + " ha"}</td><td class="num">${pctVar(e.s)}</td><td>${c ? `<span class="tag ${c}">${t}</span>` : `<span class="est">${t}</span>`}</td></tr>`; }).join("")}
      </table></div>
      <p class="sub">SIAP, Avance de Siembras y Cosechas, situación al ${A().corte} contra el promedio de los dos años anteriores al mismo corte (ciclos otoño-invierno y primavera-verano más perennes; riego y temporal). ${pe
        ? "En perennes la señal es la producción acumulada a la fecha."
        : "La superficie por cosechar (sembrada − cosechada − siniestrada) es lo que falta por salir al mercado en los próximos meses; lo ya cosechado a la fecha puede ir arriba aunque falte menos por cosechar (la cosecha se adelantó)."} Sin señal cuando la base es muy chica (menos de ${MIN_HA} ha por cosechar o ${fmt(MIN_T)} t). Mide oferta, no anticipa precios: en una prueba con 2019–2026 esta señal no anticipó el precio de mayoreo en Estados Unidos. No considera rendimientos, clima ni demanda. En el mapa, elige <i>Oferta por venir</i> para verlo por estado.</p>
      ${R.p.excluidos?.length ? `<p class="sub">No entran al total nacional ${R.p.excluidos.map(nombreEstado).join(", ")}: en algún año su avance registra más cosecha o superficie de la que el estado produce en todo el año (probable error de captura del SIAP).</p>` : ""}`;
  }
  function resumen(k) {
    const R = calcular(k);
    if (!R) return "";
    return `${R.nivel[0]}: ${R.p.perenne ? "producción a la fecha" : "superficie por cosechar"} ${pctVar(R.s)} contra ${base()}`;
  }

  // Bloque del tablero Resumen: productos con más y con menos oferta por venir
  function tableroHTML() {
    if (!A()) return "";
    const lista = Object.keys(A().productos).filter(k => window.PRODUCTOS?.[k]).map(calcular).filter(r => r && r.s != null);
    const mas = lista.filter(r => r.s >= 0.05).sort((a, b) => b.s - a.s).slice(0, 6);
    const menos = lista.filter(r => r.s <= -0.05).sort((a, b) => a.s - b.s).slice(0, 6);
    const chip = r => `<button class="chip-alerta" type="button" data-prod="${r.k}"><i style="background:${window.PRODUCTOS[r.k].color}"></i>${window.PRODUCTOS[r.k].nombre} <b>${pctVar(r.s)}</b></button>`;
    return `
      <div class="alerta-oferta">
        <span class="etq">Alerta de oferta · SIAP al ${A().corte}</span>
        <h3>Lo que viene en los próximos meses</h3>
        ${mas.length ? `<p class="sub"><b>Más oferta que en años anteriores</b></p><div class="chips-alerta">${mas.map(chip).join("")}</div>` : ""}
        ${menos.length ? `<p class="sub"><b>Menos oferta que en años anteriores</b></p><div class="chips-alerta">${menos.map(chip).join("")}</div>` : ""}
        <p class="sub">Cíclicos: superficie sembrada que falta por cosechar; perennes: producción a la fecha; contra ${base()} al mismo corte. Detalle por estado en la pestaña Producto.</p>
      </div>`;
  }

  window.Alerta = { cargar, calcular, html, resumen, tableroHTML, colorEstado, leyendaHTML, disponible: k => !!A()?.productos?.[k] };
})();

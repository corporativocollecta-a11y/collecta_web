// ============================================================================
// Planear la venta de un estado (pestaña Exportar con un estado elegido): con el volumen que se espera vender, compara
// cada mes de cosecha dos canales y propone el que más deja por kg:
//   - exportar: neto típico en la frontera (data/neto_semanal.js, PreciosEUA.netoMensual: FOB × tipo de cambio −
//     flete al cruce, mediana de años anteriores);
//   - mercado nacional: precio frecuente del SNIIM en cada central de abasto (data/precios_sniim.js, mediana del año ×
//     estacionalidad nacional del mes) × (1 − margen del mayorista) − flete del estado a esa central, con la misma tarifa
//     ajustada por diésel. El SNIIM registra el precio al que el mayorista revende en la central (ya trae su margen),
//     mientras que el FOB es la primera venta: sin descontar ese margen el mercado nacional sale siempre ganando.
//     Solo centrales con al menos 200 cotizaciones en el año (con menos, la mejor de 43 suele ser una plaza chica).
// El volumen se reparte por mes según la cosecha mensual del estado (avance del SIAP, data/avance_siap.js). Todo es un
// techo de referencia: el FOB y el mayoreo incluyen empaque, comercialización y márgenes que no se descuentan.
// ============================================================================
(function () {
  const MES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const mxn = n => "$" + n.toFixed(2);
  const fmt = n => Math.round(n).toLocaleString("es-MX");
  const millones = n => n >= 1e6 ? "$" + (n / 1e6).toFixed(1) + " millones" : "$" + fmt(n);
  const S = () => window.PRECIOS_SNIIM;

  // Mejor central de abasto para el mes m: precio de la central × estacionalidad nacional − flete del estado
  const MIN_COT = 200;
  function mejorCentral(k, entidad, m, tarifa, margen) {
    const p = S()?.productos?.[k];
    if (!p?.mercados || !p.mensual) return null;
    const vals = p.mensual.filter(x => x != null);
    if (vals[m] == null && p.mensual[m] == null) return null;
    const factor = p.mensual[m] / (vals.reduce((a, b) => a + b, 0) / vals.length);
    let mejor = null;
    Object.entries(p.mercados).forEach(([id, [precio, n]]) => {
      const c = S().centrales[id];
      if (!c || n < MIN_COT) return;
      const flete = window.Modelo.distanciaKm(entidad, c) * tarifa / 1000;
      const neto = precio * factor * (1 - margen) - flete;
      if (!mejor || neto > mejor.n) mejor = { n: neto, central: c.nombre, flete };
    });
    return mejor;
  }
  // Reparto del volumen por mes: cosecha mensual del estado (SIAP); si no hay, partes iguales en los meses con precio
  function reparto(k, id, meses) {
    const m = window.AVANCE_SIAP?.productos?.[k]?.[id];
    const tot = m ? m.reduce((a, b) => a + b, 0) : 0;
    if (tot > 0) {
      // meses con menos de 3% de la cosecha no se planean (la misma regla que la "mejor ventana" del precio neto)
      const fuertes = m.map(x => x / tot >= 0.03 ? x : 0), suma = fuertes.reduce((a, b) => a + b, 0);
      return { partes: fuertes.map(x => x / suma), fuente: "cosecha mensual del estado (avance del SIAP); los meses con menos de 3% de su cosecha se omiten" };
    }
    const con = meses.filter(Boolean).length || 1;
    return { partes: meses.map(x => x ? 1 / con : 0), fuente: "partes iguales (sin calendario de cosecha del estado)" };
  }

  function tabla(k, id, volumen, tarifaSim, margen) {
    const entidad = window.Modelo?.calcular(k, {}).filas.find(f => f.id === id);
    if (!entidad) return "";
    const tarifa = window.PreciosEUA?.tarifaEstado ? PreciosEUA.tarifaEstado(id, tarifaSim).tarifa : tarifaSim ?? 2.2;
    const exp = window.PreciosEUA?.netoMensual(k, entidad, tarifaSim) ?? Array(12).fill(null);
    const nac = MES.map((_, m) => mejorCentral(k, entidad, m, tarifa, margen));
    const opciones = MES.map((_, m) => ({ exp: exp[m], nac: nac[m] }));
    const { partes, fuente } = reparto(k, id, opciones.map(o => o.exp || o.nac));
    let total = 0, soloNac = 0, soloExp = 0, hayExp = false, hayNac = false;
    const filas = MES.map((nombre, m) => {
      const o = opciones[m], vol = volumen * partes[m];
      if (vol <= 0 || (!o.exp && !o.nac)) return "";
      const mejorExp = o.exp && (!o.nac || o.exp.n >= o.nac.n);
      const neto = mejorExp ? o.exp.n : o.nac.n;
      total += vol * 1000 * neto;
      if (o.nac) { soloNac += vol * 1000 * o.nac.n; hayNac = true; }
      if (o.exp) { soloExp += vol * 1000 * o.exp.n; hayExp = true; }
      return `<tr><td>${nombre}</td><td class="num">${fmt(vol)} t</td>
        <td class="num">${o.exp ? `${mxn(o.exp.n)}<br><span class="est">por <span translate="no">${PreciosEUA.nombreCruce(o.exp.c).split(",")[0].split(" (")[0]}</span></span>` : "—"}</td>
        <td class="num">${o.nac ? `${mxn(o.nac.n)}<br><span class="est" translate="no">${o.nac.central}</span>` : "—"}</td>
        <td><span class="tag ${mejorExp ? "ok" : "alerta-tag"}">${mejorExp ? "Exportar" : "Mercado nacional"}</span></td>
        <td class="num">${millones(vol * 1000 * neto)}</td></tr>`;
    }).join("");
    if (!filas) return '<p class="sub">No hay precios de frontera ni de centrales de abasto para este producto en los meses de cosecha del estado.</p>';
    const sinExp = !hayExp ? `<div class="nota">El USDA no publica un precio en la frontera para ${window.PRODUCTOS?.[k]?.nombre?.toLowerCase() ?? "este producto"} con el que calcular el neto de exportar: la tabla solo compara centrales de abasto. Que no aparezca exportar no significa que no convenga.</div>` : "";
    const ganancia = hayNac ? total - soloNac : null;
    return `
      <div class="kpis">
        <div class="kpi destacado"><div class="v">${millones(total)}</div><div class="l">ingreso estimado vendiendo cada mes por el canal que más deja</div></div>
        ${hayNac && ganancia > 1000 ? `<div class="kpi"><div class="v">+${millones(ganancia)}</div><div class="l">contra vender todo en el mercado nacional</div></div>` : ""}
      </div>
      ${sinExp}
      <div class="desplaza"><table class="compacta">
        <tr><th>Mes</th><th class="num">Volumen</th><th class="num">Exportar $/kg</th><th class="num">Nacional $/kg</th><th>Conviene</th><th class="num">Ingreso</th></tr>
        ${filas}
      </table></div>
      <p class="sub"><span>Reparto del volumen: ${fuente}.</span>
        <span>Exportar: neto típico en la frontera (precio FOB del USDA × tipo de cambio, mediana de años anteriores) menos el flete al cruce${window.PreciosEUA?.cuotaAD?.(k) ? ` y la cuota antidumping de ${(PreciosEUA.cuotaAD(k) * 100).toFixed(2)}%` : ""}.</span>
        <span>Mercado nacional: precio frecuente del SNIIM en la central que más deja (mediana ${S()?.anio ?? ""} × estacionalidad del mes, centrales con al menos ${MIN_COT} cotizaciones), menos ${Math.round(margen * 100)}% de margen del mayorista (el SNIIM registra su precio de reventa) y el flete del estado a esa central.</span>
        <span>Flete de ${tarifa.toFixed(2)} pesos por tonelada-km.</span>
        <span>Es un techo para comparar canales: ambos precios incluyen empaque, comercialización y márgenes que no se descuentan, y no considera calidad, contratos ni acceso fitosanitario.</span></p>`;
  }

  function llenar(el) {
    el.dataset.lleno = "1";
    const { k, e } = el.dataset, tarifa = el.dataset.tarifa ? +el.dataset.tarifa : null;
    const prod = +el.dataset.prod || 100;
    const pintar = () => {
      // volumen inicial: 1% de la producción del estado, redondeado a decenas, entre 10 y 1,000 t
      const def = Math.min(1000, Math.max(10, Math.round(prod * 0.01 / 10) * 10));
      el.innerHTML = `<div class="ctrl"><label>Volumen a vender en el año (toneladas) <b><input type="number" class="vol-plan" min="1" step="10" value="${def}" style="width:110px"></b></label></div>
        <div class="ctrl"><label>Margen del mayorista en la central <b class="txt-margen">25%</b></label><input type="range" class="mar-plan" min="0" max="50" step="5" value="25"></div>
        <div class="res-plan"></div>`;
      const inp = el.querySelector(".vol-plan"), mar = el.querySelector(".mar-plan"), res = el.querySelector(".res-plan");
      const rehacer = () => {
        el.querySelector(".txt-margen").textContent = mar.value + "%";
        res.innerHTML = tabla(k, e, Math.max(0, +inp.value || 0), tarifa, +mar.value / 100);
      };
      inp.oninput = rehacer;
      mar.oninput = rehacer;
      rehacer();
    };
    const bajar = () => Promise.all([
      window.PreciosEUA?.cargarNeto?.() ?? Promise.resolve(),
      window.Paleta.cargar("data/avance_siap.js", () => !!window.AVANCE_SIAP).catch(() => {})
    ]).then(pintar).catch(pintar);
    window.Seccion ? window.Seccion.alAbrir(el, bajar) : bajar();
  }
  const revisar = raiz => raiz.querySelectorAll?.("[data-planear]:not([data-lleno='1'])").forEach(llenar);
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) { if (n.matches?.("[data-planear]:not([data-lleno='1'])")) llenar(n); revisar(n); } })))
    .observe(document.body, { childList: true, subtree: true });

  // Mejor central del año (sin estacionalidad), para la ficha de decisión de la pestaña Exportar
  function centralAnual(k, entidad, tarifa, margen = 0.25) {
    const p = S()?.productos?.[k];
    if (!p?.mercados || !entidad) return null;
    const netos = [];
    Object.entries(p.mercados).forEach(([id, [precio, n]]) => {
      const c = S().centrales[id];
      if (!c || n < MIN_COT) return;
      netos.push({ n: precio * (1 - margen) - window.Modelo.distanciaKm(entidad, c) * tarifa / 1000, central: c.nombre });
    });
    if (!netos.length) return null;
    netos.sort((a, b) => a.n - b.n);
    // típico = mediana de las centrales (la que más paga suele ser una plaza lejana o chica: se da aparte)
    return { n: netos[Math.floor(netos.length / 2)].n, mejor: netos.at(-1), centrales: netos.length };
  }
  window.Planeador = {
    centralAnual,
    marca: (k, f, tarifa) => `<div data-planear data-k="${k}" data-e="${f.id}" data-prod="${Math.round(f.prod)}" data-tarifa="${tarifa ?? ""}"></div>`,
    disponible: k => !!(S()?.productos?.[k]?.mercados || window.PRECIOS_EUA?.productos?.[k]?.frontera)
  };
})();

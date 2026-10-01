// ============================================================================
// Pronóstico de 8 semanas del precio de mayoreo en México (centrales de abasto, SNIIM; carga diferida).
// window.PRONOSTICO_SNIIM (scripts/procesar_pronostico_sniim.py): serie semanal de la variedad principal, p50 y banda
// 20–80% del error que tuvo el método en la historia. El panel deja <div data-pron-sniim data-k="…"> y este módulo
// lo llena al cargar los datos (igual que js/embarques.js).
// ============================================================================
(function () {
  const D = () => window.PRONOSTICO_SNIIM;
  const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const pct = x => (x * 100).toFixed(0) + "%";
  const pctVar = x => (x >= 0 ? "+" : "−") + Math.abs(x * 100).toFixed(0) + "%";
  let carga = null;
  const cargar = () => carga ??= window.Paleta.cargar("data/pronostico_sniim.js", () => !!window.PRONOSTICO_SNIIM);
  const semana = (iso, h) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + 7 * h); return d; };
  const nombre = d => `${d.getDate()} ${MES[d.getMonth()]}`;

  function html(k) {
    const pr = D()?.productos?.[k];
    if (!pr) return '<p class="sub">El SNIIM no tiene historia suficiente de este producto para pronosticar.</p>';
    const n = pr.serie.length, u = n - 1;
    const hist = pr.serie.map((v, i) => [i, v]).filter(([i, v]) => i > u - 52 && v != null);
    const fut = pr.p50.map((v, h) => [u + h + 1, v, pr.p20[h], pr.p80[h]]).filter(x => x[1] != null);
    const vals = [...hist.map(x => x[1]), ...fut.flatMap(x => [x[1], x[2], x[3]])].filter(v => v != null);
    const max = Math.max(...vals) * 1.1, W = 320, Hh = 120, i1 = u - 51;
    const x = i => 26 + (i - i1) / (60 - 1) * (W - 32), y = v => Hh - 16 - v / max * (Hh - 24);
    const banda = fut.filter(f => f[2] != null && f[3] != null);
    const area = banda.length ? `<polygon points="${banda.map(f => `${x(f[0]).toFixed(1)},${y(f[3]).toFixed(1)}`).join(" ")} ${[...banda].reverse().map(f => `${x(f[0]).toFixed(1)},${y(f[2]).toFixed(1)}`).join(" ")}" fill="var(--c-importa)" opacity=".18"/>` : "";
    const ult = hist.at(-1)?.[1];
    const futura = `<polyline points="${[[u, ult], ...fut.map(f => [f[0], f[1]])].filter(z => z[1] != null).map(([i, v]) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}" fill="none" stroke="var(--c-importa)" stroke-width="2" stroke-dasharray="4 3"/>`;
    const inicio = pr.inicio;
    const grafica = `
      <svg class="estac" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Precio semanal de mayoreo y pronóstico">
        ${[0.5, 1].map(f => `<line x1="26" x2="${W - 6}" y1="${y(max / 1.1 * f)}" y2="${y(max / 1.1 * f)}" stroke="var(--linea)"/><text x="0" y="${y(max / 1.1 * f) + 3}">${Math.round(max / 1.1 * f)}</text>`).join("")}
        ${area}<polyline points="${hist.map(([i, v]) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}" fill="none" stroke="var(--productor)" stroke-width="2"/>${futura}
        <line x1="${x(u)}" x2="${x(u)}" y1="4" y2="${Hh - 16}" stroke="var(--tenue)" stroke-dasharray="2 2"/>
        <text x="${x(i1)}" y="${Hh - 2}">${semana(inicio, i1).toISOString().slice(0, 7)}</text><text x="${x(u) - 18}" y="${Hh - 2}">${pr.ultima.slice(0, 7)}</text>
      </svg>
      <div class="leyenda-cadena"><span><i style="background:var(--productor)"></i>Precio observado ($/kg)</span><span><i style="background:var(--c-importa)"></i>Pronóstico y banda 20–80%</span></div>`;
    const tabla = `
      <div class="desplaza"><table class="compacta">
        <tr><th>Semana del</th><th class="num">Precio $/kg</th></tr>
        ${pr.p50.map((v, h) => `<tr><td>${nombre(semana(pr.ultima, h + 1))}</td><td class="num">${v != null ? v.toFixed(2) : "—"}${pr.p20[h] != null ? `<br><span class="est">${pr.p20[h].toFixed(2)}–${pr.p80[h].toFixed(2)}</span>` : ""}</td></tr>`).join("")}
      </table></div>`;
    const mape = pr.mape.filter(m => m != null);
    const confiable = pr.mape[1] ?? pr.mape[0];
    return `
      ${grafica}
      ${tabla}
      ${mape.length ? `<div class="nota"><b>Qué tan bueno es:</b> <span>Probado sobre los dos últimos años, se equivocó en promedio ${pr.mape.map((m, j) => m == null ? null : `${pct(m)} a ${[1, 4, 8][j]} semana${j ? "s" : ""}`).filter(Boolean).join(", ")}.</span>
        <span>Suponer que el precio no cambia se equivoca ${pr.mapeIngenuo.filter(m => m != null).map(m => pct(m)).join(", ")}.</span>
        <span>${pr.metodo.includes("e") ? `La estacionalidad mejora el pronóstico a partir de la semana ${pr.metodo.indexOf("e") + 1}; antes se usa el último precio.` : "En este producto la estacionalidad no mejora a la referencia: se muestra el último precio."}</span>
        <span>${confiable != null && confiable > 0.25 ? "El error es alto: úsalo solo como orientación." : "Sirve para anticipar la tendencia, no el precio exacto."}</span>
        <span>Nivel reciente: ${pr.factor.toFixed(2)}× lo normal para estas semanas.</span></div>` : ""}
      <p class="sub"><span>Precio frecuente de <span translate="no">${pr.variedad}</span> (primera calidad), mediana semanal de todas las centrales de abasto que reporta el SNIIM, en pesos por kg.</span> <span>Método: la misma semana en años anteriores (desde 2019) ajustada por cómo vienen las últimas cuatro semanas frente a esas mismas semanas de otros años; en cada semana del horizonte se usa ese método o el último precio, el que haya acertado más en la prueba.</span></p>`;
  }
  function resumen(k) {
    const pr = D()?.productos?.[k];
    if (!pr) return "Sin historia suficiente para pronosticar";
    const ult = pr.serie.filter(v => v != null).at(-1), fin = pr.p50.filter(v => v != null).at(-1);
    return ult && fin ? `Precio en 8 semanas: $${fin.toFixed(2)} el kg (${pctVar(fin / ult - 1)} contra la última semana)` : "Pronóstico de 8 semanas";
  }
  function llenar(el) {
    el.dataset.lleno = "1";
    const k = el.dataset.k;
    const pintar = () => {
      el.innerHTML = html(k);
      const r = el.closest("details.seccion")?.querySelector("summary [data-auto]");
      if (r) r.textContent = resumen(k);
    };
    if (D()) return pintar();
    el.innerHTML = '<p class="sub">Cargando precios del SNIIM…</p>';
    const bajar = () => cargar().then(pintar).catch(() => { el.innerHTML = '<p class="sub">No se pudo cargar el pronóstico.</p>'; });
    if (!window.Seccion) return bajar();
    if (window.Seccion.alAbrir(el, bajar)) {
      const r = el.closest("details.seccion")?.querySelector("summary [data-auto]");
      if (r) r.textContent = "Ábrela para ver el pronóstico de las próximas 8 semanas";
    }
  }
  const revisar = raiz => raiz.querySelectorAll?.("[data-pron-sniim]:not([data-lleno='1'])").forEach(llenar);
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) { if (n.matches?.("[data-pron-sniim]:not([data-lleno='1'])")) llenar(n); revisar(n); } })))
    .observe(document.body, { childList: true, subtree: true });
  window.PronosticoSNIIM = { marca: k => `<div data-pron-sniim data-k="${k}"></div>`, cargar };
})();

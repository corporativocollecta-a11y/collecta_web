// ============================================================================
// Pérdidas por siniestro en 10 años (window.SINIESTROS, scripts/procesar_siniestros.py): qué parte de lo sembrado se
// pierde cada año por producto, estado y modalidad, según los cierres municipales del SIAP (sin causa: helada,
// granizo, lluvia, sequía o plaga). Sección en Producto y dato del estado en Entidad.
// ============================================================================
(function () {
  const S = () => window.SINIESTROS;
  const pct = x => x == null ? "—" : x > 0 && x < 0.001 ? "<0.1%" : (x * 100).toFixed(x < 0.1 ? 1 : 0) + "%";
  const prom = v => { const x = v.filter(y => y != null); return x.length ? x.reduce((a, b) => a + b, 0) / x.length : null; };
  const disponible = k => !!S()?.productos?.[k];

  function resumen(k) {
    const p = S()?.productos?.[k];
    if (!p) return "";
    const a = S().anios, m = prom(p.nacional), i = p.nacional.indexOf(Math.max(...p.nacional.filter(x => x != null)));
    return m < 0.001 ? `Casi sin pérdidas registradas en ${a[0]}–${a.at(-1)}` : `Se pierde en promedio ${pct(m)} de lo sembrado · peor año ${a[i]} (${pct(p.nacional[i])})`;
  }
  function html(k) {
    const p = S()?.productos?.[k];
    if (!p) return "";
    const A = S().anios, max = Math.max(0.01, ...p.nacional.filter(x => x != null));
    const W = 300, H = 80, bw = (W - 20) / A.length;
    const barras = p.nacional.map((v, i) => v == null ? "" : `<rect x="${(20 + i * bw + 2).toFixed(1)}" y="${(H - 14 - v / max * (H - 24)).toFixed(1)}" width="${(bw - 4).toFixed(1)}" height="${(v / max * (H - 24)).toFixed(1)}" fill="var(--c-importa)"><title>${A[i]}: ${pct(v)}</title></rect>`).join("");
    const estados = Object.entries(p.estados).map(([id, [ha, serie]]) => ({ id, ha, m: prom(serie), peor: Math.max(...serie.filter(x => x != null)) }))
      .filter(e => e.m != null).sort((a, b) => b.m - a.m);
    const nombre = id => window.ESTADOS?.find(e => e.id === id)?.nombre ?? id;
    const casiNada = prom(p.nacional) < 0.001;
    return `
      <svg class="estac" viewBox="0 0 ${W} ${H}" role="img" aria-label="Parte de lo sembrado que se perdió cada año">
        ${barras}
        ${A.map((a, i) => i % 2 === 0 ? `<text x="${(20 + i * bw + bw / 2 - 8).toFixed(1)}" y="${H - 2}">${a}</text>` : "").join("")}
        <text x="0" y="12">${pct(max)}</text>
      </svg>
      ${casiNada ? "" : `<div class="kpis">
        <div class="kpi"><div class="v">${pct(p.riego)}</div><div class="l">pérdida promedio en riego</div></div>
        <div class="kpi"><div class="v">${pct(p.temporal)}</div><div class="l">pérdida promedio en temporal</div></div>
      </div>
      ${estados.length > 1 ? `<h4 class="mini">Estados donde más se pierde</h4>
        <div class="desplaza"><table class="compacta">
          <tr><th>Estado</th><th class="num">Sembrada (ha/año)</th><th class="num">Pérdida promedio</th><th class="num">Peor año</th></tr>
          ${estados.slice(0, 6).map(e => `<tr class="clic" data-id="${e.id}"><td>${nombre(e.id)}</td><td class="num">${Math.round(e.ha).toLocaleString("es-MX")}</td><td class="num">${pct(e.m)}</td><td class="num">${pct(e.peor)}</td></tr>`).join("")}
        </table></div>` : ""}`}
      <p class="sub">Superficie siniestrada entre superficie sembrada (SIAP, cierre municipal ${A[0]}–${A.at(-1)}): lo que se sembró y no llegó a cosecharse por un daño. El SIAP no publica la causa (helada, granizo, lluvia, sequía o plaga). En perennes casi no registra siniestros. Se excluyen ${S().excluidos?.length ?? 0} registros municipales que parecen errores de captura (siembran más de 3 veces lo normal y pierden casi todo). Estados con al menos 200 ha sembradas al año.</p>`;
  }
  // Dato del estado para la pestaña Entidad
  function estadoTexto(k, id) {
    const e = S()?.productos?.[k]?.estados?.[id];
    if (!e) return "";
    const m = prom(e[1]);
    return m == null ? "" : `pierde en promedio ${pct(m)} de lo sembrado (SIAP ${S().anios[0]}–${S().anios.at(-1)})`;
  }
  window.Siniestros = { disponible, html, resumen, estadoTexto };
})();

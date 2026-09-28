// ============================================================================
// Riesgo climático: Monitor de Sequía de CONAGUA (window.SEQUIA) cruzado con la producción municipal del SIAP.
// Qué parte de la producción de cada producto está hoy en municipios con sequía, nacional y por estado.
// ============================================================================
(function () {
  const S = () => window.SEQUIA;
  const fmt = n => Math.round(n).toLocaleString("es-MX");
  const fmtT = t => t >= 1e6 ? (t / 1e6).toFixed(2) + " Mt" : t >= 1e3 ? fmt(t / 1e3) + " mil t" : fmt(t) + " t";
  const pct = x => (x * 100).toFixed(0) + "%";
  const NIVELES = ["Sin sequía", "Anormalmente seco (D0)", "Sequía moderada (D1)", "Sequía severa (D2)", "Sequía extrema (D3)", "Sequía excepcional (D4)"];
  const COLORES = ["var(--c-sin)", "#E9D98A", "#F2B25B", "#F2703A", "#C8432B", "#7A1F12"];
  const fechaTexto = () => new Date(S().fecha + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });

  // Producción del producto por nivel de sequía actual; estado opcional (clave de 2 dígitos)
  function exposicion(clave, estado) {
    const prod = window.PRODUCCION_MUNICIPAL?.productos?.[clave];
    if (!S() || !prod) return null;
    const porNivel = [0, 0, 0, 0, 0, 0];
    let total = 0, anioSeco = 0;
    for (const [cve, [t]] of Object.entries(prod)) {
      if (estado && cve.slice(0, 2) !== estado) continue;
      const m = S().municipios[cve];
      if (!m) continue;
      porNivel[m[0]] += t;
      anioSeco += t * m[1] / 100;
      total += t;
    }
    if (!total) return null;
    return { porNivel, total, conSequia: porNivel.slice(2).reduce((a, b) => a + b, 0), anioSeco };
  }

  function barras(x) {
    return `<div class="cadena"><span class="b" style="height:14px">${x.porNivel.map((t, i) => t > 0 ? `<i style="width:${t / x.total * 100}%;background:${COLORES[i]}" title="${NIVELES[i]}: ${fmtT(t)}"></i>` : "").join("")}</span></div>
      <div class="leyenda-cadena">${x.porNivel.map((t, i) => t > 0 ? `<span><i style="background:${COLORES[i]}"></i>${NIVELES[i]} ${pct(t / x.total)}</span>` : "").join("")}</div>`;
  }

  function balanceHTML(clave, nombre) {
    const x = exposicion(clave);
    if (!x) return "";
    return `
      <h3>Riesgo de sequía <span class="tag ok">CONAGUA ${S().fecha.slice(0, 4)}</span></h3>
      <div class="kpis"><div class="kpi ${x.conSequia / x.total >= 0.25 ? "alerta" : "destacado"}"><div class="v">${pct(x.conSequia / x.total)}</div>
        <div class="l">de la producción de ${nombre.toLowerCase()} está en municipios con sequía moderada o peor (corte del ${fechaTexto()}).
        En ${S().anio}, la zona productora (ponderada por producción) pasó ${pct(x.anioSeco / x.total)} del año en sequía moderada o peor.</div></div></div>
      ${barras(x)}
      <p class="sub">Monitor de Sequía de México (CONAGUA/SMN), corte quincenal por municipio, cruzado con la producción municipal del SIAP. La sequía afecta distinto a cultivos de riego y de temporal.</p>`;
  }

  function entidadHTML(clave, estado, nombreEstado) {
    const x = exposicion(clave, estado);
    if (!x) return "";
    return `
      <h3>Sequía en ${nombreEstado} <span class="tag ok">CONAGUA</span></h3>
      <p class="sub"><b>${pct(x.conSequia / x.total)}</b> de su producción está en municipios con sequía moderada o peor al ${fechaTexto()}.</p>
      ${barras(x)}`;
  }

  // Para la vista municipal: nivel actual de un municipio
  const nivel = cve => S()?.municipios?.[cve]?.[0] ?? 0;
  const ESCALA = NIVELES.map((t, i) => [i, COLORES[i], t]);

  window.Sequia = { disponible: () => !!S(), exposicion, balanceHTML, entidadHTML, nivel, ESCALA, NIVELES, fecha: () => S()?.fecha };
})();

// ============================================================================
// Estacionalidad: producción mensual nacional (Panorama SIAP) vs. precio mensual
// de mayoreo (SNIIM) y al consumidor (PROFECO); cobertura de la demanda con la
// cosecha de cada mes; escenario de escalonamiento de cosecha / almacenamiento.
// ============================================================================
(function () {
  const MES = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const MES_L = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const mxn = n => "$" + n.toFixed(2);
  const pct = x => (x * 100).toFixed(0) + "%";
  const ALMACENABLES = { manzana: 1, papa: 1, cebolla: 1, naranja: 1 };

  function pearson(a, b) {
    const pares = a.map((x, i) => [x, b[i]]).filter(([x, y]) => x != null && y != null);
    const n = pares.length;
    if (n < 6) return null;
    const mx = pares.reduce((s, p) => s + p[0], 0) / n, my = pares.reduce((s, p) => s + p[1], 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    pares.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; });
    return { r: sxy / Math.sqrt(sxx * syy), pendiente: sxy / sxx, mx, my };
  }

  // Serie de producción mensual bajo un escenario de escalonamiento (0 = actual, 1 = cosecha pareja todo el año)
  const escalonar = (serie, s) => serie.map(v => v + s * (100 / 12 - v));

  function grafica(prod, may, cons) {
    const W = 360, H = 150, top = 14, base = 120, bw = W / 12;
    const maxP = Math.max(...prod, 1);
    const linea = (serie, color, dash) => {
      if (!serie) return "";
      const v = serie.map((x, i) => [x, i]).filter(([x]) => x != null);
      if (v.length < 2) return "";
      const lo = Math.min(...v.map(p => p[0])), hi = Math.max(...v.map(p => p[0]));
      const y = x => base - 8 - (x - lo) / ((hi - lo) || 1) * (base - top - 16);
      const pts = v.map(([x, i]) => `${(i + 0.5) * bw},${y(x)}`).join(" ");
      return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" ${dash ? 'stroke-dasharray="4 3"' : ""}/>` +
        v.map(([x, i]) => `<circle cx="${(i + 0.5) * bw}" cy="${y(x)}" r="2.6" fill="${color}"><title>${MES_L[i]}: ${mxn(x)}/kg</title></circle>`).join("");
    };
    return `<svg viewBox="0 0 ${W} ${H}" class="estac" role="img" aria-label="Producción mensual y precios">
      ${prod.map((v, i) => `<rect x="${i * bw + 3}" y="${base - v / maxP * (base - top)}" width="${bw - 6}" height="${v / maxP * (base - top)}" rx="2" fill="#a8d5a2"><title>${MES_L[i]}: ${v.toFixed(1)}% de la producción anual</title></rect>`).join("")}
      ${linea(may, "#c0392b")}${linea(cons, "#7b4fa0", true)}
      ${MES.map((m, i) => `<text x="${(i + 0.5) * bw}" y="${base + 14}" text-anchor="middle">${m}</text>`).join("")}
      <line x1="0" x2="${W}" y1="${base}" y2="${base}" stroke="#ccc"/>
    </svg>
    <div class="leyenda-cadena"><span><i style="background:#a8d5a2"></i>Producción (% anual, Panorama)</span>
      ${may ? `<span><i style="background:#c0392b"></i>Mayoreo (SNIIM)</span>` : ""}
      ${cons ? `<span><i style="background:#7b4fa0"></i>Consumidor (PROFECO)</span>` : ""}</div>`;
  }

  function balanceHTML(res, esc) {
    const p = res.producto;
    const prod0 = p.produccionMensual;
    if (!prod0) return "";
    const s = (esc.escalonamiento ?? 0) / 100;
    const prod = escalonar(prod0, s);
    const may = window.PRECIOS_SNIIM?.productos?.[res.clave]?.mensual ?? null;
    const cons = window.PRECIOS_CONSUMIDOR?.productos?.[res.clave]?.mensual ?? null;
    const n = res.nacional;

    // Cobertura mensual: cosecha del mes (menos exportación proporcional) + importación pareja vs. demanda mensual
    // exportación oficial (la misma del encabezado y la línea ejecutiva), no la del modelo limitada al excedente
    const exportable = Math.max(0, n.produccion - (res.producto.exportacion ?? n.exportacion));
    const cobertura = prod.map(v => (exportable * v / 100 + n.importacionReportada / 12) / (n.demanda / 12));
    const faltan = cobertura.map((c, i) => [c, i]).filter(([c]) => c < 0.9).map(([, i]) => MES_L[i]);
    const anual = cobertura.reduce((s, c) => s + c, 0) / 12;
    // meses de cosecha baja: por debajo de 90% de un mes promedio (independiente del nivel anual)
    const bajos = prod.map((v, i) => [v, i]).filter(([v]) => v * 12 / 100 < 0.9).map(([, i]) => MES_L[i]);
    const color = c => c < 0.5 ? "#c0392b" : c < 0.9 ? "#f0a35e" : c < 1.3 ? "#a8d5a2" : c < 2 ? "#3fa05f" : "#145a32";

    // Relación precio–cosecha y efecto estimado del escalonamiento sobre el precio de mayoreo
    const rel = may ? pearson(prod0, may) : null;
    let efecto = "";
    if (rel && rel.r <= -0.3) {
      const precio1 = may.map((x, i) => x == null ? null : Math.max(0.1, x + rel.pendiente * (prod[i] - prod0[i])));
      const v = arr => { const f = arr.filter(x => x != null); return Math.max(...f) / Math.min(...f) - 1; };
      efecto = s > 0 ? `<p class="sub">Escenario: con ${pct(s)} de la cosecha redistribuida, la brecha entre el mes más caro y el más barato
        del mayoreo pasaría de <b>${pct(v(may))}</b> a <b>≈ ${pct(v(precio1))}</b> (estimación lineal con la relación observada precio–cosecha).</p>` : "";
    }
    const lectura = !rel ? "" : rel.r <= -0.5 ? `El precio sigue claramente a la cosecha: sube cuando la producción nacional baja.`
      : rel.r <= -0.2 ? `Cuando hay menos cosecha el precio tiende a subir, aunque no siempre (relación moderada).`
      : `El precio no sigue a la cosecha nacional: pesan más las importaciones, el almacenamiento, la calidad o la exportación.`;

    const iMin = may ? may.indexOf(Math.min(...may.filter(x => x != null))) : -1;
    const iMax = may ? may.indexOf(Math.max(...may.filter(x => x != null))) : -1;
    const iPico = prod0.indexOf(Math.max(...prod0));

    return `
      <h3>Estacionalidad: cosecha vs. precio <span class="tag ok">Panorama · SNIIM · PROFECO</span></h3>
      ${grafica(prod, may, cons)}
      <p class="sub">Mayor cosecha en <b>${MES_L[iPico]}</b> (${prod0[iPico].toFixed(1)}% del año).
        ${may ? `Mayoreo más barato en <b>${MES_L[iMin]}</b> (${mxn(may[iMin])}) y más caro en <b>${MES_L[iMax]}</b> (${mxn(may[iMax])}).` : ""} ${lectura}</p>
      <h4 class="mini">Cobertura de la demanda con la cosecha de cada mes</h4>
      <div class="cobertura">${cobertura.map((c, i) => `<div style="background:${color(c)}" title="${MES_L[i]}: ${pct(c)} de la demanda mensual"><span>${MES[i]}</span></div>`).join("")}</div>
      <p class="sub">${anual < 0.9
        ? `En el año, la disponibilidad nacional cubre solo <b>${pct(anual)}</b> del consumo usado (ver nota de consumo), por lo que casi todos los meses aparecen en déficit.
           Meses de cosecha más baja (menos de 90% de un mes promedio): <b>${bajos.join(", ") || "ninguno"}</b>.`
        : faltan.length ? `Meses en que la cosecha nacional no alcanza a cubrir la demanda: <b>${faltan.join(", ")}</b>.` : "La cosecha cubre la demanda todos los meses."}
        ${ALMACENABLES[res.clave] ? "Este producto se almacena (frigorífico o bodega), por lo que parte de la cosecha abastece meses posteriores." : ""}
        Supone exportación proporcional a la cosecha e importación pareja en el año.</p>
      <div class="ctrl"><label>Escenario: escalonar la cosecha (siembras escalonadas, invernadero, almacenamiento) <b>${pct(s)}</b></label>
        <input type="range" id="sEscalon" min="0" max="100" step="10" value="${s * 100}"></div>
      ${efecto}`;
  }

  // Resumen de una línea: mes de mayor cosecha y mes más caro del mayoreo
  function resumen(res) {
    const prod = res.producto.produccionMensual;
    if (!prod) return "";
    const may = window.PRECIOS_SNIIM?.productos?.[res.clave]?.mensual ?? null;
    const iPico = prod.indexOf(Math.max(...prod));
    const iMax = may ? may.indexOf(Math.max(...may.filter(x => x != null))) : -1;
    return `Mayor cosecha en ${MES_L[iPico]}` + (iMax >= 0 ? ` · mayoreo más caro en ${MES_L[iMax]}` : "");
  }

  window.Estacionalidad = { balanceHTML, resumen };
})();

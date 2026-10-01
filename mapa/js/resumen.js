// ============================================================================
// Resumen nacional: indicadores de todos los productos, lista de productos
// con buscador/filtro y tablero comparativo con hallazgos automáticos.
// ============================================================================
(function () {
  const fmt = n => Math.round(n).toLocaleString("es-MX");
  const fmtT = t => t >= 1e6 ? (t / 1e6).toFixed(2) + " Mt" : t >= 1e3 ? fmt(t / 1e3) + " mil t" : fmt(t) + " t";
  const usd = v => v >= 1e9 ? "US$" + (v / 1e9).toFixed(2) + " mil M" : v >= 1e6 ? "US$" + fmt(v / 1e6) + " M" : v > 0 ? "< US$1 M" : "—";
  const pct = x => (x * 100).toFixed(0) + "%";
  const quitarAcentos = t => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  function colorAuto(r) {
    if (r < 0.9) return "var(--def)";
    if (r < 1.1) return "var(--transporte)";
    return "var(--productor)";
  }

  // Indicadores por producto con el escenario vigente de cada uno
  function indicadores(escenarios) {
    return Object.keys(window.PRODUCTOS).map(k => {
      const r = Modelo.calcular(k, escenarios[k] ?? {});
      const p = r.producto;
      const may = window.PRECIOS_SNIIM?.productos?.[k]?.precio ?? null;
      const cons = window.PRECIOS_CONSUMIDOR?.productos?.[k]?.precio ?? null;
      const final = Math.max(cons ?? 0, may ?? 0);
      return {
        k, nombre: p.nombre, tipo: p.tipo, color: p.color,
        prod: r.nacional.produccion, auto: r.nacional.autosuficiencia,
        alProductor: final > 0 ? p.precioRural / final : null,
        exportUSD: p.valorExportUSD ?? 0, exportT: p.exportacion, importT: p.importacion,
        consumidor: cons, mensual: p.produccionMensual ?? null,
        brecha: p.consumoOficial && r.pcAparente > 0 ? r.pcAparente / p.consumoPC - 1 : null
      };
    });
  }

  function listaHTML(ind, filtro, tipo, activo) {
    const q = quitarAcentos(filtro.trim());
    const visibles = ind.filter(x => (tipo === "todos" || x.tipo === tipo) && (!q || quitarAcentos(x.nombre).includes(q)));
    if (!visibles.length) return `<p class="sin-resultados">No hay productos que coincidan con “${filtro}”.</p>`;
    const grupos = [["Hortaliza", "Hortalizas"], ["Fruta", "Frutas"], ["Otro", "Otros cultivos"]];
    return grupos.map(([t, titulo]) => {
      const items = visibles.filter(x => x.tipo === t).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
      if (!items.length) return "";
      return `<div class="grupo">${titulo}</div>` + items.map(x => `
        <button class="chip${x.k === activo ? " activo" : ""}" data-k="${x.k}" type="button">
          <span class="punto" style="background:${x.color}"></span>
          <span class="nombre">${x.nombre}</span>
          <span class="meta">${x.meta ?? fmtT(x.prod) + (x.alProductor != null ? ` · $${Math.round(x.alProductor * 100)}/100` : "")}</span>
          <span class="indic" title="Autosuficiencia nacional"><b>${pct(x.auto)}</b>
            <span class="mini-barra"><i style="width:${Math.min(100, x.auto / 2 * 100)}%;background:${colorAuto(x.auto)}"></i></span></span>
        </button>`).join("");
    }).join("");
  }

  function chispa(serie, color) {
    if (!serie) return "";
    const max = Math.max(...serie, 1);
    return `<svg class="chispa" viewBox="0 0 64 20" aria-hidden="true">${serie.map((v, i) =>
      `<rect x="${i * 5.33 + 0.5}" y="${20 - v / max * 19}" width="4.3" height="${v / max * 19}" rx="1" fill="${color}"/>`).join("")}</svg>`;
  }

  const ORDENES = {
    alProductor: ["Al productor", (a, b) => (a.alProductor ?? 9) - (b.alProductor ?? 9)],
    auto: ["Autosuficiencia", (a, b) => a.auto - b.auto],
    exportUSD: ["Exportación", (a, b) => b.exportUSD - a.exportUSD],
    prod: ["Producción", (a, b) => b.prod - a.prod]
  };

  function panelHTML(ind, orden) {
    const totalUSD = ind.reduce((s, x) => s + x.exportUSD, 0);
    const conPrecio = ind.filter(x => x.alProductor != null);
    const minP = conPrecio.reduce((a, b) => b.alProductor < a.alProductor ? b : a, conPrecio[0]);
    const maxP = conPrecio.reduce((a, b) => b.alProductor > a.alProductor ? b : a, conPrecio[0]);
    const deficit = ind.filter(x => x.auto < 1);
    const brechas = ind.filter(x => x.brecha != null && x.brecha < -0.25).sort((a, b) => a.brecha - b.brecha);
    const topExp = [...ind].sort((a, b) => b.exportUSD - a.exportUSD)[0];
    const filas = [...ind].sort(ORDENES[orden][1]);
    const anio = window.PRODUCCION_SIAP?.anio ?? "";

    return `
      <div class="resumen-cabeza">
        <span class="etq">Panorama nacional ${anio}</span>
        <h2>${ind.length} frutas y hortalizas, de la parcela al plato</h2>
        <p class="sub">Elige un producto en la lista o en la tabla para ver su mapa, su cadena de precio y sus escenarios.</p>
      </div>
      <div class="cifras-resumen">
        <div><b>${usd(totalUSD)}</b><span>exportados en ${anio}</span></div>
        <div><b>$${Math.round(minP.alProductor * 100)}–${Math.round(maxP.alProductor * 100)}</b><span>de cada $100 que paga el consumidor llegan al productor, según el producto</span></div>
        <div><b>${deficit.length}</b><span>${deficit.length === 1 ? "producto no cubre" : "productos no cubren"} su consumo</span></div>
      </div>
      <div class="orden" role="group" aria-label="Ordenar tabla">${Object.entries(ORDENES).map(([k, [t]]) =>
        `<button type="button" data-orden="${k}" aria-pressed="${k === orden}">${t}</button>`).join("")}</div>
      <div class="desplaza"><table class="tabla-resumen">
        <thead><tr><th>Producto</th><th class="num">Autosuf.</th><th class="num">Al productor<br><span class="est">de cada $100</span></th><th class="num">Exporta US$</th><th>Cosecha</th></tr></thead>
        <tbody>${filas.map(x => `
          <tr class="clic" data-prod="${x.k}">
            <td><span class="prod"><i style="background:${x.color}"></i>${x.nombre}</span></td>
            <td class="num"><span class="tag ${x.auto < 0.9 ? "def" : x.auto < 2 ? "ok" : "exc"}">${pct(x.auto)}</span></td>
            <td class="num">${x.alProductor != null ? "$" + Math.round(x.alProductor * 100) : "—"}</td>
            <td class="num">${x.exportUSD >= 1e9 ? (x.exportUSD / 1e9).toFixed(2) + " mil M" : x.exportUSD >= 1e6 ? fmt(x.exportUSD / 1e6) + " M" : x.exportUSD > 0 ? "< 1 M" : "—"}</td>
            <td title="Producción mensual (Panorama SIAP)">${chispa(x.mensual, x.color)}</td>
          </tr>`).join("")}</tbody>
      </table></div>
      <div class="hallazgos">
        <span class="etq">Lo que muestran los datos</span>
        ${minP ? `<p class="hallazgo"><span><b>${minP.nombre}</b> es el producto donde menos llega al campo: $${Math.round(minP.alProductor * 100)} de cada $100 que paga el consumidor. En <b>${maxP.nombre}</b> llegan $${Math.round(maxP.alProductor * 100)}.</span></p>` : ""}
        ${topExp ? `<p class="hallazgo"><span><b>${topExp.nombre}</b> es el principal producto de exportación: ${usd(topExp.exportUSD)}, ${pct(topExp.exportUSD / totalUSD)} del total de estos productos.</span></p>` : ""}
        ${brechas.length ? `<p class="hallazgo"><span>En <b>${brechas.map(x => x.nombre.split(" ")[0].toLowerCase()).join(", ")}</b> la disponibilidad ${anio} quedó por debajo del consumo oficial (hasta ${pct(-brechas[0].brecha)} menos): la cosecha bajó y la exportación se mantuvo.</span></p>` : ""}
        ${deficit.length ? `<p class="hallazgo"><span>México importa una parte relevante de lo que consume en <b>${deficit.map(x => x.nombre.toLowerCase()).join(", ")}</b>.</span></p>` : ""}
      </div>`;
  }

  window.Resumen = { indicadores, listaHTML, panelHTML };
})();

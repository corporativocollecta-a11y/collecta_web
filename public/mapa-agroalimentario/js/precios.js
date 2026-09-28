// ============================================================================
// Precios de mayoreo y red de abasto observada (SNIIM, window.PRECIOS_SNIIM)
// - Capa de mapa: estado de origen → central de abasto (rutas reportadas por el SNIIM),
//   centrales coloreadas por precio relativo al promedio nacional.
// - Contenido de paneles: precio mayoreo vs. precio rural, estacionalidad, variedades,
//   centrales más baratas/caras y abastecimiento observado por estado.
// ============================================================================
(function () {
  const fmt = n => Math.round(n).toLocaleString("es-MX");
  const mxn = n => "$" + n.toFixed(2);
  const pct = x => (x * 100).toFixed(0) + "%";

  const S = () => window.PRECIOS_SNIIM;
  const datos = clave => S()?.productos?.[clave];
  const consumidor = clave => window.PRECIOS_CONSUMIDOR?.productos?.[clave];
  const central = id => S().centrales[id];
  const estadoPorId = id => window.ESTADOS.find(e => e.id === id);
  // El SNIIM reporta el punto de embarque: "CDMX" suele ser reenvío desde la CEDA, no producción local
  const nombreOrigen = o => o.startsWith("IMP:") ? (o === "IMP:Importación" ? "Importación" : o.slice(4) + " (import.)")
    : o === "09" ? "CDMX (reenvío CEDA)" : (estadoPorId(o)?.nombre ?? o);

  function colorRel(r) { // precio de la central / promedio nacional
    if (r < 0.85) return "#1e7a45";
    if (r < 0.95) return "#74b86f";
    if (r <= 1.05) return "#e9d98a";
    if (r <= 1.15) return "#f0a35e";
    return "#c0392b";
  }

  function crearCapa(mapa) {
    const grupo = L.layerGroup();
    function dibujar(res) {
      grupo.clearLayers();
      const d = datos(res.clave);
      if (!d) return;
      const maxN = Math.max(...d.rutas.map(r => r[2]));
      // rutas (solo orígenes nacionales; un umbral evita saturar el mapa)
      d.rutas.filter(r => !r[0].startsWith("IMP:") && r[2] >= maxN * 0.03).forEach(([o, id, n, p]) => {
        const e = estadoPorId(o), c = central(id);
        if (!e || !c || e.id === c.estado && Math.abs(e.lat - c.lat) < 0.3) return;
        L.polyline([[e.lat, e.lon], [c.lat, c.lon]], {
          color: res.producto.color, weight: 0.8 + 6 * Math.sqrt(n / maxN), opacity: 0.45
        }).bindTooltip(`${e.nombre} → ${c.nombre}<br>${fmt(n)} días-reporte · ${mxn(p)}/kg`).addTo(grupo);
      });
      Object.entries(d.mercados).forEach(([id, [p, n]]) => {
        const c = central(id); if (!c) return;
        const top = d.rutas.filter(r => String(r[1]) === String(id)).slice(0, 3);
        const totN = d.rutas.filter(r => String(r[1]) === String(id)).reduce((s, r) => s + r[2], 0);
        L.circleMarker([c.lat, c.lon], {
          radius: 5 + 5 * Math.sqrt(n / d.observaciones * Object.keys(d.mercados).length),
          color: "#1f2a24", weight: 1, fillColor: colorRel(p / d.precio), fillOpacity: 0.95
        }).bindTooltip(`<b>${c.nombre}</b><br>Mayoreo: <b>${mxn(p)}/kg</b> (${pct(p / d.precio)} del promedio)<br>
          Abastecida por: ${top.map(r => `${nombreOrigen(r[0])} ${pct(r[2] / totN)}`).join(", ")}`).addTo(grupo);
      });
    }
    return {
      dibujar, mostrar: () => grupo.addTo(mapa), ocultar: () => grupo.remove(),
      leyendaHTML: () => `<div class="fila" style="margin-top:6px"><b>Precio en central (SNIIM)</b></div>` +
        [["< 85% del promedio", 0.8], ["85–95%", 0.9], ["95–105%", 1], ["105–115%", 1.1], ["> 115%", 1.3]]
          .map(([t, v]) => `<div class="fila"><span class="sw" style="background:${colorRel(v)}"></span>${t}</div>`).join("")
    };
  }

  // Descomposición de precio: rural (SIAP) → logística modelada → mayoreo observado (SNIIM)
  function descomposicion(res) {
    const d = datos(res.clave), p = res.producto;
    if (!d) return null;
    const logistica = res.logistica.centrales.transporteKg; // situación actual: vía centrales
    const brecha = d.precio - p.precioRural;
    return { rural: p.precioRural, mayoreo: d.precio, brecha, logistica,
             intermediacion: brecha - logistica, margenObservado: (brecha - logistica) / p.precioRural };
  }

  function balanceHTML(res) {
    const d = datos(res.clave);
    if (!d) return "";
    const x = descomposicion(res);
    const mercados = Object.entries(d.mercados).filter(([, v]) => v[1] >= 20).sort((a, b) => a[1][0] - b[1][0]);
    const fila = ([id, [p]]) => `<div class="barra-h"><span class="n">${central(id).nombre}</span><span class="b"><i style="width:${Math.min(100, p / mercados.at(-1)[1][0] * 100)}%;background:${colorRel(p / d.precio)}"></i></span><span class="x">${mxn(p)}</span></div>`;
    const variedades = Object.entries(d.variedades).sort((a, b) => b[1][1] - a[1][1]);
    return `
      <h3>Precios de mayoreo ${S().anio} <span class="tag ok">SNIIM</span></h3>
      <div class="kpis">
        <div class="kpi"><div class="v">${mxn(x.rural)}</div><div class="l">Precio medio rural (SIAP)</div></div>
        <div class="kpi"><div class="v">${mxn(x.mayoreo)}</div><div class="l">Precio de mayoreo promedio en ${Object.keys(d.mercados).length} centrales</div></div>
        <div class="kpi destacado"><div class="v">+${mxn(x.brecha)}/kg (${pct(x.brecha / x.rural)})</div>
          <div class="l">Diferencia entre lo que recibe el productor y el precio en central de abasto. El transporte modelado explica
          ≈ ${mxn(x.logistica)}/kg; el resto, <b>${mxn(x.intermediacion)}/kg</b>, corresponde a acopio, intermediación, empaque y margen comercial.</div></div>
      </div>
      ${consumidorHTML(res, x)}
      ${variedades.length > 1 ? `<h3>Por variedad</h3>${variedades.map(([v, [p, n]]) => `<div class="barra-h"><span class="n">${v}</span><span class="b"><i style="width:${Math.min(100, p / Math.max(...variedades.map(z => z[1][0])) * 100)}%"></i></span><span class="x">${mxn(p)}</span></div>`).join("")}` : ""}
      <h3>Centrales más baratas y más caras</h3>
      ${mercados.slice(0, 3).map(fila).join("")}
      <div class="sub" style="text-align:center;margin:2px 0">···</div>
      ${mercados.slice(-3).map(fila).join("")}
      <p class="sub">Promedio anual de precio frecuente, calidad primera, ${fmt(d.observaciones)} observaciones (día × origen × central).</p>`;
  }

  // Precio al consumidor (PROFECO QQP) y por tipo de comercio
  function consumidorHTML(res, x) {
    const c = consumidor(res.clave);
    if (!c) return "";
    const giros = Object.entries(c.giros).filter(([g]) => !/farmacia/i.test(g)).sort((a, b) => a[1][0] - b[1][0]);
    const maxG = Math.max(...giros.map(g => g[1][0]));
    const edos = Object.entries(c.estados).sort((a, b) => a[1][0] - b[1][0]);
    const fila = ([id, [p]]) => `<div class="barra-h"><span class="n">${estadoPorId(id)?.nombre ?? id}</span><span class="b"><i style="width:${p / edos.at(-1)[1][0] * 100}%;background:${colorRel(p / c.precio)}"></i></span><span class="x">${mxn(p)}</span></div>`;
    return `
      <div class="kpis" style="margin-top:8px">
        <div class="kpi"><div class="v">${mxn(c.precio)}</div><div class="l">Precio al consumidor (PROFECO, mediana ${window.PRECIOS_CONSUMIDOR.anio})</div></div>
        <div class="kpi"><div class="v">$${(x.rural / Math.max(c.precio, x.mayoreo) * 100).toFixed(0)} de cada $100</div><div class="l">llega al productor</div></div>
      </div>
      <p class="sub">Margen minorista (consumidor − mayoreo): ${mxn(Math.max(0, c.precio - x.mayoreo))}/kg · ${fmt(c.registros)} registros de precio en tiendas y mercados.</p>
      ${giros.length > 1 ? `<h3>Precio al consumidor por tipo de comercio</h3>${giros.map(([g, [p, n]]) =>
        `<div class="barra-h"><span class="n">${g.replace("Supermercado / Tienda de Autoservicio", "Supermercado")}</span><span class="b"><i style="width:${p / maxG * 100}%"></i></span><span class="x">${mxn(p)}</span></div>`).join("")}` : ""}
      ${Object.keys(c.variedades).length > 1 ? `<h3>Precio al consumidor por variedad</h3>${Object.entries(c.variedades).map(([v, [p]]) =>
        `<div class="barra-h"><span class="n">${v.split("/")[0].split(" o ")[0]}</span><span class="b"><i style="width:${p / Math.max(...Object.values(c.variedades).map(z => z[0])) * 100}%"></i></span><span class="x">${mxn(p)}</span></div>`).join("")}` : ""}
      ${edos.length > 5 ? `<h3>Estados más baratos y más caros para el consumidor</h3>${edos.slice(0, 3).map(fila).join("")}
        <div class="sub" style="text-align:center;margin:2px 0">···</div>${edos.slice(-3).map(fila).join("")}` : ""}`;
  }

  // Abastecimiento observado de las centrales de una entidad
  function entidadHTML(res, estadoId) {
    const d = datos(res.clave);
    if (!d) return "";
    const ids = Object.keys(d.mercados).filter(id => central(id).estado === estadoId);
    const salientes = d.rutas.filter(r => r[0] === estadoId && central(r[1]).estado !== estadoId);
    const destinosTot = salientes.reduce((s, r) => s + r[2], 0);
    let html = "";
    const c = consumidor(res.clave), ce = c?.estados?.[estadoId];
    if (ce) {
      const may = ids.length ? ids.reduce((s, id) => s + d.mercados[id][0], 0) / ids.length : null;
      html += `<h3>Precios en ${estadoPorId(estadoId).nombre}</h3>
        <div class="kpis">
          <div class="kpi"><div class="v">${mxn(ce[0])}</div><div class="l">Consumidor (PROFECO) · ${pct(ce[0] / c.precio)} de la mediana nacional</div></div>
          <div class="kpi"><div class="v">${may ? mxn(may) : "—"}</div><div class="l">Mayoreo en sus centrales (SNIIM)${may ? ` · margen minorista ${mxn(Math.max(0, ce[0] - may))}` : ""}</div></div>
        </div>`;
    }
    if (ids.length) {
      const rutas = d.rutas.filter(r => ids.includes(String(r[1])));
      const porOrigen = {};
      rutas.forEach(([o, , n]) => porOrigen[o] = (porOrigen[o] ?? 0) + n);
      const tot = Object.values(porOrigen).reduce((s, n) => s + n, 0);
      const orden = Object.entries(porOrigen).sort((a, b) => b[1] - a[1]).slice(0, 6);
      html += `<h3>Quién abastece sus centrales (observado, SNIIM)</h3>
        <p class="sub">${ids.map(id => `${central(id).nombre}: <b>${mxn(d.mercados[id][0])}/kg</b> (${pct(d.mercados[id][0] / d.precio)} del promedio)`).join(" · ")}</p>
        ${orden.map(([o, n]) => `<div class="barra-h"><span class="n">${nombreOrigen(o)}</span><span class="b"><i style="width:${n / tot * 100}%"></i></span><span class="x">${pct(n / tot)}</span></div>`).join("")}
        <p class="sub">% de los días-reporte en que cada origen surtió a sus centrales (frecuencia, no volumen).</p>`;
    }
    if (salientes.length) {
      const orden = [...salientes].sort((a, b) => b[2] - a[2]).slice(0, 6);
      html += `<h3>Centrales de otros estados que surte (observado)</h3>
        ${orden.map(([, id, n, p]) => `<div class="barra-h"><span class="n">${central(id).nombre}</span><span class="b"><i style="width:${n / destinosTot * 100}%"></i></span><span class="x">${mxn(p)}</span></div>`).join("")}
        <p class="sub">Presente en ${new Set(salientes.map(r => r[1])).size} centrales fuera de su estado. Cifra = precio promedio de su producto en esa central.</p>`;
    }
    return html;
  }

  window.Precios = { consumidor, disponible: clave => !!datos(clave), crearCapa, descomposicion, balanceHTML, entidadHTML };
})();

// ============================================================================
// Precios de mayoreo de EE. UU. (USDA AMS Market News, window.PRECIOS_EUA) para la vista de EE. UU.
// - Capa: mercados terminales coloreados por precio relativo a la mediana y cruces fronterizos con México.
// - Panel: precio por ciudad, por origen (México vs. EE. UU. vs. otros), estacionalidad y precio en la frontera.
// ============================================================================
(function () {
  const usd = n => n == null ? "—" : "US$" + n.toFixed(2);
  const pct = x => (x * 100).toFixed(0) + "%";
  const MESES = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

  const E = () => window.PRECIOS_EUA;
  const datos = k => E()?.productos?.[k];
  const disponible = k => !!(datos(k)?.precio || datos(k)?.volumen);
  const fmtT = t => t >= 1e6 ? (t / 1e6).toFixed(2) + " Mt" : t >= 1e3 ? Math.round(t / 1e3).toLocaleString("es-MX") + " mil t" : Math.round(t).toLocaleString("es-MX") + " t";
  // "MEXICO CROSSINGS THROUGH TEXAS" agrupa Pharr/McAllen, Laredo y el resto de Texas
  const NOMBRE_CRUCE = { McAllen: "Texas (Pharr, Laredo…)", Nogales: "Nogales, Arizona", "Otay Mesa": "Otay Mesa, California",
    Calexico: "Calexico y San Luis", Varios: "Varios cruces (AZ, CA, TX)" };

  // Lo que cruza de México: toneladas por paso fronterizo y por mes (USDA, embarques semanales)
  function volumenHTML(v, titulo) {
    if (!v?.total) return "";
    const cruces = Object.entries(v.cruces);
    const maxM = Math.max(...v.mensual, 1);
    const W = 300, H = 70, bw = (W - 20) / 12;
    return `
      <h3>${titulo} <span class="tag ok">USDA ${E().anio}</span></h3>
      <div class="kpis"><div class="kpi destacado"><div class="v">${fmtT(v.total)}</div>
        <div class="l">registradas por el USDA al cruzar de México en ${E().anio}</div></div></div>
      <h4 class="mini">Por dónde cruza</h4>
      ${cruces.map(([c, t]) => `<div class="barra-h"><span class="n">${NOMBRE_CRUCE[c] ?? c}</span><span class="b"><i style="width:${t / cruces[0][1] * 100}%;background:var(--c-importa)"></i></span><span class="x">${pct(t / v.total)}</span></div>`).join("")}
      <h4 class="mini">Cuándo cruza (t por mes)</h4>
      <svg class="estac" viewBox="0 0 ${W} ${H + 14}" role="img" aria-label="Volumen mensual">
        ${v.mensual.map((t, i) => `<rect x="${10 + i * bw + 2}" y="${H - t / maxM * (H - 6)}" width="${bw - 4}" height="${t / maxM * (H - 6)}" rx="2" fill="var(--c-importa)" opacity=".85"><title>${fmtT(t)}</title></rect>
          <text x="${10 + i * bw + bw / 2 - 3}" y="${H + 12}">${MESES[i]}</text>`).join("")}
      </svg>
      <p class="sub">Embarques semanales que el USDA registra en los cruces con México (reporte National Shipping Point Trends, 1,000 cwt = 45.4 t). No cubre todos los pasos: suele sumar entre 70% y 90% de lo que México reporta exportar a EE. UU.</p>`;
  }
  const mexicoHTML = k => volumenHTML(E()?.mexico?.[k], "Exportación a EE. UU.: por dónde y cuándo cruza");

  // Precio relativo a la mediana nacional: barato (lima) → caro (naranja)
  const colorRel = r => { const t = window.Paleta.tokens(); return r < 0.9 ? t.exc : r <= 1.1 ? t.neutro : t.def; };

  function crearCapa(mapa) {
    const grupo = window.L.layerGroup();
    function dibujar(k) {
      grupo.clearLayers();
      const d = datos(k);
      if (!d) return;
      const t = window.Paleta.tokens();
      const maxN = Math.max(...Object.values(d.mercados ?? {}).map(v => v[1]), 1);
      Object.entries(d.mercados ?? {}).forEach(([id, [p, n, mx]]) => {
        const m = E().mercados[id];
        window.L.circleMarker([m.lat, m.lon], {
          pane: "markerPane", radius: 6 + 8 * Math.sqrt(n / maxN), color: t.sel, weight: 1.5,
          fillColor: colorRel(p / d.precio), fillOpacity: 0.95
        }).bindTooltip(`<b>${m.nombre}</b> · mercado terminal<br>Mayoreo: <b>${usd(p)}/kg</b> (${pct(p / d.precio)} de la mediana)<br>
          Origen mexicano: ${pct(mx)} de las cotizaciones<br><span style="opacity:.7">${d.mercancia}, ${d.empaque}</span>`).addTo(grupo);
      });
      const f = d.frontera;
      Object.entries(E().cruces).forEach(([id, c]) => {
        const v = f?.cruces?.[id];
        const tCruce = d.volumen?.cruces?.[id];
        if (!v && !tCruce) return;
        window.L.marker([c.lat, c.lon], {
          icon: window.L.divIcon({ className: "cruce", iconSize: null,
            html: `<i style="--s:${tCruce ? 1 + 1.4 * Math.sqrt(tCruce / (d.volumen.total || 1)) : 1}"></i><span>${c.nombre.split(",")[0]}${v ? " · " + usd(v[0]) : ""}${tCruce ? " · " + fmtT(tCruce) : ""}</span>` })
        }).bindTooltip(`<b>Cruce ${c.nombre}</b>${tCruce ? `<br>Cruzan <b>${fmtT(tCruce)}</b> al año (${pct(tCruce / d.volumen.total)} de lo registrado)` : ""}
          ${v ? `<br>Precio FOB del producto mexicano: <b>${usd(v[0])}/kg</b><br><span style="opacity:.7">${f.mercancia}, ${f.empaque} · ${v[1]} cotizaciones</span>` : ""}`).addTo(grupo);
      });
    }
    return {
      dibujar, mostrar: () => grupo.addTo(mapa), ocultar: () => grupo.remove(),
      leyendaHTML: () => `<div class="fila" style="margin-top:8px"><b>Mercados terminales (USDA)</b></div>` +
        [["< 90% de la mediana", 0.8], ["90–110%", 1], ["> 110%", 1.3]]
          .map(([t, v]) => `<div class="fila"><span class="sw" style="background:${colorRel(v)}"></span>${t}</div>`).join("") +
        `<div class="fila"><span class="sw cruce-sw"></span>Cruce con México (precio FOB)</div>`
    };
  }

  // Líneas mensuales (US$/kg): mayoreo de origen mexicano, de origen EE. UU. y FOB en la frontera
  function estacionalidad(d) {
    const series = [["Mayoreo, origen México", d.mensual.mx, "var(--c-importa)", ""], ["Mayoreo, origen EE. UU.", d.mensual.eua, "var(--productor)", ""],
      ["Frontera (FOB)", d.frontera?.mensual, "var(--suave)", "4 3"]].filter(s => s[1]?.some(v => v != null));
    if (!series.length) return "";
    const vals = series.flatMap(s => s[1].filter(v => v != null));
    const max = Math.max(...vals) * 1.1, W = 300, H = 110, x = i => 18 + i * (W - 26) / 11, y = v => H - 16 - v / max * (H - 26);
    const linea = (v, c, dash) => {
      const pts = v.map((p, i) => p == null ? null : `${x(i).toFixed(1)},${y(p).toFixed(1)}`);
      const tramos = []; let actual = [];
      pts.forEach(p => { if (p) actual.push(p); else if (actual.length) { tramos.push(actual); actual = []; } });
      if (actual.length) tramos.push(actual);
      return tramos.map(tr => tr.length > 1 ? `<polyline points="${tr.join(" ")}" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="${dash}"/>`
        : `<circle cx="${tr[0].split(",")[0]}" cy="${tr[0].split(",")[1]}" r="2.5" fill="${c}"/>`).join("");
    };
    return `<h4 class="mini">Precio por mes (US$/kg)</h4>
      <svg class="estac" viewBox="0 0 ${W} ${H}" role="img" aria-label="Precio mensual">
        ${[0.5, 1].map(f => `<line x1="18" x2="${W - 8}" y1="${y(max * f / 1.1)}" y2="${y(max * f / 1.1)}" stroke="var(--linea)"/><text x="0" y="${y(max * f / 1.1) + 3}">${(max * f / 1.1).toFixed(1)}</text>`).join("")}
        ${series.map(s => linea(s[1], s[2], s[3])).join("")}
        ${MESES.map((m, i) => `<text x="${x(i) - 3}" y="${H - 2}">${m}</text>`).join("")}
      </svg>
      <div class="leyenda-cadena">${series.map(s => `<span><i style="background:${s[2]}"></i>${s[0]}</span>`).join("")}</div>`;
  }

  function panelHTML(k) {
    const d = datos(k);
    const vol = volumenHTML(d?.volumen, "Lo que cruza de México");
    if (!d?.precio) return vol;
    const f = d.frontera;
    const ciudades = Object.entries(d.mercados).sort((a, b) => a[1][0] - b[1][0]);
    const maxP = Math.max(...ciudades.map(c => c[1][0]));
    const brecha = f?.precio && d.mx.precio && f.mercancia === d.mercancia ? d.mx.precio / f.precio - 1 : null;
    return `
      <h3>Precios de mayoreo <span class="tag ok">USDA AMS ${E().anio}</span></h3>
      <div class="kpis">
        <div class="kpi"><div class="v">${usd(d.precio)}/kg</div><div class="l">Mediana en ${ciudades.length} mercados terminales</div></div>
        <div class="kpi"><div class="v">${pct(d.mx.parte)}</div><div class="l">de las cotizaciones son de origen mexicano${d.mx.precio ? ` · ${usd(d.mx.precio)}/kg` : ""}</div></div>
        ${f?.precio ? `<div class="kpi destacado"><div class="v">${usd(f.precio)}/kg al cruzar de México</div>
          <div class="l">Precio FOB en la frontera (${Object.entries(f.cruces).map(([c, v]) => `${E().cruces[c].nombre.split(",")[0]} ${usd(v[0])}`).join(" · ")}).
          ${brecha != null ? `En los mercados terminales el producto mexicano se vende ${brecha >= 0 ? pct(brecha) + " más caro" : pct(-brecha) + " más barato"} que en la frontera: flete, merma y margen del mayorista.` : ""}</div></div>` : ""}
      </div>
      <p class="sub">Referencia: ${d.mercancia}, ${d.empaque} (${d.kgEmpaque} kg)${f && f.empaque !== d.empaque ? `; en la frontera, ${f.mercancia}, ${f.empaque}` : ""}.</p>
      <h4 class="mini">Precio por ciudad</h4>
      ${ciudades.map(([id, [p, , mx]]) => `<div class="barra-h"><span class="n">${E().mercados[id].nombre}</span><span class="b"><i style="width:${p / maxP * 100}%;background:${colorRel(p / d.precio)}"></i></span><span class="x">${usd(p)}</span></div>`).join("")}
      <h4 class="mini">De dónde viene lo que se vende</h4>
      <table>
        <tr><th>Origen</th><th class="num">US$/kg</th><th class="num">% de cotizaciones</th></tr>
        ${d.origenes.map(([o, p, n, t]) => `<tr${t === "mx" ? ' class="resaltado"' : ""}><td>${o}</td><td class="num">${usd(p)}</td><td class="num">${pct(n)}</td></tr>`).join("")}
      </table>
      ${estacionalidad(d)}
      ${vol}
      <p class="sub">Precios diarios de mayoreo del USDA (Market News) en ${ciudades.length} mercados terminales y en los cruces de Nogales, McAllen y Otay Mesa, sin orgánicos. Precio = punto medio del rango más frecuente. La parte de origen mexicano cuenta cotizaciones, no volumen.</p>`;
  }

  window.PreciosEUA = { disponible, crearCapa, panelHTML, mexicoHTML };
})();

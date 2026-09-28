// ============================================================================
// Vistas regional (América Latina y el Caribe) y mundial: balance por país (FAOSTAT)
// Disponibilidad aparente = producción − exportación + importación.
// Autosuficiencia = producción / disponibilidad. Consumo aparente = disponibilidad / población.
// ============================================================================
(function () {
  const fmt = n => Math.round(n).toLocaleString("es-MX");
  const fmtT = t => t >= 1e6 ? (t / 1e6).toFixed(2) + " Mt" : t >= 1e3 ? fmt(t / 1e3) + " mil t" : fmt(t) + " t";
  const fmtP = n => n >= 1e6 ? (n / 1e6).toFixed(1) + " M" : fmt(n);
  const usd = miles => { const v = miles * 1000; return v >= 1e9 ? "US$" + (v / 1e9).toFixed(2) + " mil M" : v >= 1e6 ? "US$" + fmt(v / 1e6) + " M" : v > 0 ? "< US$1 M" : "—"; };
  const pct = x => (x * 100).toFixed(0) + "%";
  const MX = "484";

  // Fuente activa: "latam" (window.LATAM) o "global" (window.GLOBAL). Nota: L sombrea el global de Leaflet; aquí se usa window.L
  let fuente = "latam";
  const L = () => fuente === "global" ? window.GLOBAL : window.LATAM;
  const esGlobal = () => fuente === "global";
  const TX = () => esGlobal()
    ? { zona: "el mundo", Zona: "Mundo", adj: "mundial", de: "del mundo", etiqueta: "Mundo" }
    : { zona: "Latinoamérica", Zona: "Latinoamérica", adj: "regional", de: "de la región", etiqueta: "Latinoamérica y el Caribe" };
  let nombresES = null;
  try { nombresES = new Intl.DisplayNames(["es"], { type: "region" }); } catch (e) { nombresES = null; }
  const nombrePais = pa => {
    if (!pa) return "";
    if (pa.iso && nombresES) { try { return nombresES.of(pa.iso) || pa.nombre; } catch (e) { return pa.nombre; } }
    return pa.nombre;
  };
  const disponible = k => !!L()?.productos?.[k];
  // Nombre en la vista regional (FAOSTAT puede agrupar varios productos, p. ej. berries)
  const nombreProd = k => L()?.productos?.[k]?.nombre ?? window.PRODUCTOS[k]?.nombre ?? k;

  function calcular(k) {
    const P = L().productos[k], paises = L().paises;
    const filas = Object.entries(P.datos).map(([id, [prod, ha, exp, imp, expUSD, impUSD]]) => {
      const pa = paises[id] ?? { nombre: id };
      const disp = Math.max(0, prod - exp + imp);
      return {
        id, nombre: nombrePais(pa), lat: pa.lat, lon: pa.lon, pob: pa.pob,
        prod, ha, exp, imp, expUSD, impUSD, disp,
        auto: disp > 0 ? prod / disp : (prod > 0 ? 99 : 0),
        pc: pa.pob ? disp * 1000 / pa.pob : null,
        rend: ha > 0 ? prod / ha : null,
        serie: P.serie?.[id] ?? null
      };
    }).filter(f => f.lat != null);
    const tot = f => filas.reduce((s, x) => s + (x[f] || 0), 0);
    const T = { prod: tot("prod"), ha: tot("ha"), exp: tot("exp"), imp: tot("imp"), expUSD: tot("expUSD"), pob: filas.reduce((s, x) => s + (x.pob || 0), 0) };
    T.disp = T.prod - T.exp + T.imp;
    T.rend = T.ha > 0 ? T.prod / T.ha : null;
    T.pc = T.disp * 1000 / Object.values(paises).reduce((s, p) => s + (p.pob || 0), 0);
    const orden = [...filas].sort((a, b) => b.prod - a.prod);
    orden.forEach((f, i) => f.lugar = i + 1);
    return { k, P, filas, orden, T, mx: filas.find(f => f.id === MX), opp: oportunidades(k, filas) };
  }

  // Oportunidad para México: lo que cada país importa y NO le compra a México (volumen y valor).
  // La parte mexicana sale de la matriz bilateral de FAOSTAT (reportada por el exportador).
  function oportunidades(k, filas) {
    const lista = (C()?.productos?.[k] ?? []);
    if (!lista.length) return null;
    const desdeMX = {}, principal = {};
    lista.forEach(([o, d, t]) => {
      if (o === MX) desdeMX[d] = (desdeMX[d] ?? 0) + t;
      if (!principal[d] || t > principal[d][1]) principal[d] = [o, t];
    });
    const out = {};
    let total = 0;
    filas.forEach(f => {
      if (f.id === MX || !(f.imp > 0) || !(f.impUSD > 0)) return;
      const parteMX = Math.min(1, (desdeMX[f.id] ?? 0) / f.imp);
      const libreUSD = f.impUSD * (1 - parteMX);
      total += libreUSD;
      out[f.id] = { parteMX, libreT: f.imp * (1 - parteMX), libreUSD, precio: f.impUSD / f.imp, principal: principal[f.id]?.[0] };
    });
    Object.values(out).forEach(o => { o.parte = total > 0 ? o.libreUSD / total : 0; });
    return out;
  }
  const colorOpp = r => { const t = window.Paleta.tokens(); return r == null || r <= 0 ? t.sin : r < 0.01 ? t.auto : r < 0.05 ? t.exc : t.gran; };

  const colorAuto = r => window.Paleta.auto(r);
  const colorRel = r => window.Paleta.rel(r);
  const METRICAS = {
    auto: { titulo: "Autosuficiencia", valor: (f) => f.auto, color: colorAuto,
      rangos: [["Sin producción", 0], ["< 50% de su consumo", 0.3], ["50–99%", 0.7], ["Autosuficiente (1–2×)", 1.5], ["Excedentario (2–10×)", 5], ["Gran exportador (>10×)", 20]] },
    pc: { titulo: "Consumo aparente por persona", valor: (f, R) => f.pc != null && R.T.pc > 0 ? f.pc / R.T.pc : null, color: colorRel,
      rangos: [["Sin dato", null], ["< 50% del promedio", 0.3], ["50–85%", 0.7], ["85–115%", 1], ["115–200%", 1.5], ["> 2× el promedio", 3]] },
    opp: { titulo: "Oportunidad para México", valor: (f, R) => R.opp?.[f.id]?.parte ?? null, color: colorOpp,
      rangos: [["Sin importación o es México", null], ["< 1% del mercado disponible", 0.005], ["1–5%", 0.03], ["> 5% del mercado disponible", 0.1]] },
    rend: { titulo: "Rendimiento vs. promedio", valor: (f, R) => f.rend != null && R.T.rend ? f.rend / R.T.rend : null, color: colorRel,
      rangos: [["Sin dato", null], ["< 50% del promedio", 0.3], ["50–85%", 0.7], ["85–115%", 1], ["115–200%", 1.5], ["> 2× el promedio", 3]] }
  };

  function crearCapa(mapa) {
    const capa = window.L.layerGroup();
    let ultimo = null;
    function dibujar(R, metrica, seleccionado, alClic, verVolumen) {
      ultimo = [...arguments];
      capa.clearLayers();
      const M = METRICAS[metrica], geo = window.GEO_PAISES;
      if (!geo) window.Paleta.geoPaises().then(() => { if (ultimo) dibujar(...ultimo); }).catch(() => {});
      const porId = Object.fromEntries(R.filas.map(f => [f.id, f]));
      const tip = f => `<b>${f.nombre}</b><br>Producción: ${fmtT(f.prod)} (${pct(f.prod / R.T.prod)} ${TX().de}, lugar ${f.lugar})<br>
          Exporta ${fmtT(f.exp)} · importa ${fmtT(f.imp)}<br>Autosuficiencia: ${f.auto >= 10 ? f.auto.toFixed(0) + "×" : pct(f.auto)}
          ${f.pc != null ? `<br>Disponible: ${f.pc.toFixed(1)} kg por persona` : ""}`;
      if (geo) window.Paleta.coropletas(mapa, capa, geo, {
        color: id => porId[id] ? M.color(M.valor(porId[id], R)) : null, seleccionado,
        tooltip: id => tip(porId[id]), clic: alClic
      });
      const conForma = geo ? new Set(geo.features.map(f => f.properties.id)) : new Set();
      const maxP = Math.max(...R.filas.map(f => f.prod), 1);
      [...R.filas].sort((a, b) => b.prod - a.prod).forEach(f => {
        const r = f.prod > 0 ? 4 + 34 * Math.sqrt(f.prod / maxP) : 3;
        if (conForma.has(f.id)) { if (verVolumen && f.prod > 0) window.Paleta.volumen(capa, f.lat, f.lon, r); return; }
        // Islas pequeñas sin contorno a esta escala: punto
        const t = window.Paleta.tokens();
        window.L.circleMarker([f.lat, f.lon], {
          radius: geo ? 4 : r, color: f.id === seleccionado ? t.sel : t.borde, weight: f.id === seleccionado ? 3 : 1,
          fillColor: M.color(M.valor(f, R)), fillOpacity: 0.9
        }).bindTooltip(tip(f)).on("click", () => alClic(f.id)).addTo(capa);
      });
    }
    return { dibujar, mostrar: () => capa.addTo(mapa), ocultar: () => capa.remove() };
  }

  function leyendaHTML(R, metrica, nombreProducto, verVolumen) {
    const M = METRICAS[metrica];
    return `<h4>${M.titulo}: ${nombreProducto}</h4>` +
      M.rangos.map(([t, v]) => `<div class="fila"><span class="sw" style="background:${M.color(v)}"></span>${t}</div>`).join("") +
      `<div class="fila pie">${verVolumen ? "Círculo = volumen producido · " : ""}FAOSTAT ${L().anio}</div>`;
  }

  const etiqueta = r => r <= 0 ? `<span class="tag def">0%</span>` : r < 1 ? `<span class="tag def">${pct(r)}</span>` :
    `<span class="tag ${r < 2 ? "ok" : "exc"}">${r >= 10 ? r.toFixed(0) : r.toFixed(1)}×</span>`;

  function chispa(serie, color) {
    if (!serie || !serie.some(v => v > 0)) return "";
    const max = Math.max(...serie), min = Math.min(...serie);
    const pts = serie.map((v, i) => `${i * 15 + 2},${18 - (v - min) / ((max - min) || 1) * 15}`).join(" ");
    return `<svg class="chispa" viewBox="0 0 64 20" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.8"/></svg>`;
  }

  function productoHTML(R, producto) {
    const { T, mx, orden } = R;
    const anio = L().anio;
    const exportadores = [...R.filas].filter(f => f.exp > 0).sort((a, b) => b.expUSD - a.expUSD).slice(0, 6);
    const importadores = [...R.filas].filter(f => f.imp > 0).sort((a, b) => b.imp - a.imp).slice(0, 5);
    const deficit = R.filas.filter(f => f.auto < 1 && f.pob > 1e6).sort((a, b) => a.auto - b.auto);
    const barra = (n, v, max, txt) => `<div class="barra-h"><span class="n">${n}</span><span class="b"><i style="width:${Math.min(100, v / max * 100)}%"></i></span><span class="x">${txt}</span></div>`;
    const siap = producto.fuente && producto.nacional && !L().productos[R.k].nombre ? `<p class="sub">En México la FAO reporta ${fmtT(mx?.prod ?? 0)} en ${anio}; el SIAP registra ${fmtT(producto.nacional)} en ${window.PRODUCCION_SIAP?.anio ?? ""}. Para comparar países se usa FAOSTAT en todos.</p>` : "";
    return `
      <h2>${nombreProd(R.k)} en ${TX().zona}</h2>
      <p class="sub"><span class="tag ok">FAOSTAT ${anio}</span> ${R.filas.length} países con datos${R.P.grupo ? " · " + R.P.grupo : ""}</p>
      <div class="kpis">
        <div class="kpi"><div class="v">${fmtT(T.prod)}</div><div class="l">Producción ${TX().adj}</div></div>
        <div class="kpi"><div class="v">${usd(T.expUSD)}</div><div class="l">Exportación ${TX().adj} (${fmtT(T.exp)})</div></div>
        <div class="kpi"><div class="v">${T.pc.toFixed(1)} kg</div><div class="l">Disponible por persona (${TX().adj})</div></div>
        <div class="kpi"><div class="v">${pct(T.prod / (T.disp || 1))}</div><div class="l">Autosuficiencia ${TX().adj}</div></div>
        ${mx ? `<div class="kpi destacado"><div class="v">México: lugar ${mx.lugar} de ${orden.length}</div>
          <div class="l">Produce ${pct(mx.prod / T.prod)} ${TX().de} (${fmtT(mx.prod)}) y aporta ${pct(mx.expUSD / (T.expUSD || 1))} de su exportación.
          ${orden[0].id !== "484" ? `El líder es <b>${orden[0].nombre}</b> con ${pct(orden[0].prod / T.prod)}.` : `Le sigue <b>${orden[1]?.nombre ?? "—"}</b> con ${pct((orden[1]?.prod ?? 0) / T.prod)}.`}</div></div>` : ""}
      </div>
      ${siap}
      <h3>Principales productores</h3>
      <table>
        <tr><th>País</th><th class="num">Producción</th><th class="num">% total</th><th class="num">Autosuf.</th><th>5 años</th></tr>
        ${orden.slice(0, 10).map(f => `<tr class="clic${f.id === "484" ? " resaltado" : ""}" data-pais="${f.id}"><td>${f.nombre}</td><td class="num">${fmtT(f.prod)}</td>
          <td class="num">${pct(f.prod / T.prod)}</td><td class="num">${etiqueta(f.auto)}</td><td>${chispa(f.serie, producto.color)}</td></tr>`).join("")}
      </table>
      ${exportadores.length ? `<h3>Quién exporta (valor)</h3>${exportadores.map(f => barra(f.nombre, f.expUSD, exportadores[0].expUSD, usd(f.expUSD))).join("")}` : ""}
      ${importadores.length ? `<h3>Quién importa (volumen)</h3>${importadores.map(f => barra(f.nombre, f.imp, importadores[0].imp, fmtT(f.imp))).join("")}` : ""}
      ${rutasHTML(R.k)}
      ${oportunidadesHTML(R)}
      ${window.PreciosUE ? PreciosUE.html(R.k) : ""}
      ${window.Acceso ? Acceso.html(R.k) : ""}
      ${window.Historia ? Historia.marca("tendencias", R.k, esGlobal() ? {} : { paises: R.filas.map(f => f.id).join(",") }) : ""}
      ${deficit.length ? `<div class="nota">No cubren su consumo aparente: <b>${deficit.slice(0, 6).map(f => `${f.nombre} (${pct(f.auto)})`).join(", ")}</b>${deficit.length > 6 ? ` y ${deficit.length - 6} más` : ""}.
        ${mx && mx.auto > 1.2 ? `México tiene excedente (${mx.auto.toFixed(1)}×): una oportunidad de abasto.` : ""}</div>` : ""}
      <p class="sub">Disponibilidad aparente = producción − exportación + importación; incluye mermas y usos industriales. Países con menos de 1 millón de habitantes no se listan como deficitarios.</p>`;
  }

  function paisHTML(id, productoActual) {
    const pa = L().paises[id];
    const filas = Object.keys(L().productos).filter(k => window.PRODUCTOS[k]).map(k => {
      const R = calcular(k), f = R.filas.find(x => x.id === id);
      return f && { ...f, k, nombre: nombreProd(k), color: window.PRODUCTOS[k].color, share: f.prod / R.T.prod };
    }).filter(Boolean);
    const expTot = filas.reduce((s, f) => s + f.expUSD, 0);
    const lider = filas.filter(f => f.lugar === 1).map(f => f.nombre.toLowerCase());
    const deficit = filas.filter(f => f.auto < 1).sort((a, b) => b.imp - a.imp);
    return `
      <p class="sub"><a href="#" id="volverRegion">← ${TX().Zona}</a> · País</p>
      <h2>${nombrePais(pa)}</h2>
      <p class="sub">Población ${pa.pob ? fmtP(pa.pob) : "—"} (FAOSTAT ${L().anio})</p>
      <div class="kpis">
        <div class="kpi"><div class="v">${usd(expTot)}</div><div class="l">Exporta en estas ${filas.length} frutas y hortalizas</div></div>
        <div class="kpi"><div class="v">${lider.length}</div><div class="l">${lider.length === 1 ? "producto en que es" : "productos en que es"} primer productor ${TX().adj}</div></div>
        ${lider.length ? `<div class="kpi destacado"><div class="v" style="font-size:15px">Líder ${TX().adj} en ${lider.join(", ")}</div></div>` : ""}
      </div>
      ${deficit.length ? `<div class="nota">Depende de importaciones en <b>${deficit.slice(0, 6).map(f => f.nombre.toLowerCase()).join(", ")}</b>${deficit.length > 6 ? " y otros" : ""}.</div>` : ""}
      ${C() ? sociosHTML(id, productoActual) : ""}
      ${window.Historia ? Historia.marca("pais", productoActual, { pais: id, titulo: `${nombreProd(productoActual)} en ${nombrePais(pa)}: diez años` }) : ""}
      <h3>Portafolio de ${nombrePais(pa)}</h3>
      <table>
        <tr><th>Producto</th><th class="num">Producción</th><th class="num">Lugar</th><th class="num">Autosuf.</th><th class="num">kg/persona</th></tr>
        ${filas.sort((a, b) => b.prod - a.prod).map(f => `<tr class="clic" data-prod="${f.k}"><td><span class="prod"><i style="background:${f.color}"></i>${f.nombre}</span></td>
          <td class="num">${fmtT(f.prod)}</td><td class="num">${f.lugar}</td><td class="num">${etiqueta(f.auto)}</td><td class="num">${f.pc != null ? f.pc.toFixed(1) : "—"}</td></tr>`).join("")}
      </table>`;
  }

  // Indicadores para la lista de productos y el resumen regional
  function indicadores() {
    return Object.keys(L().productos).filter(k => window.PRODUCTOS[k]).map(k => {
      const R = calcular(k), p = window.PRODUCTOS[k];
      return {
        k, nombre: nombreProd(k), tipo: p.tipo, color: p.color, prod: R.T.prod, auto: R.T.prod / (R.T.disp || 1),
        alProductor: null, meta: `${fmtT(R.T.prod)} · MX #${R.mx?.lugar ?? "—"}`,
        lider: R.orden[0]?.nombre, mxLugar: R.mx?.lugar, mxShare: R.mx ? R.mx.prod / R.T.prod : 0, expUSD: R.T.expUSD, serie: null
      };
    });
  }

  function resumenHTML(ind) {
    const anio = L().anio;
    const primero = ind.filter(x => x.mxLugar === 1);
    const totalUSD = ind.reduce((s, x) => s + x.expUSD, 0);
    const lideres = {};
    ind.forEach(x => lideres[x.lider] = (lideres[x.lider] ?? 0) + 1);
    const ranking = Object.entries(lideres).sort((a, b) => b[1] - a[1]);
    return `
      <div class="resumen-cabeza">
        <span class="etq">${TX().etiqueta} · FAOSTAT ${anio}</span>
        <h2>${ind.length} frutas y hortalizas en ${Object.keys(L().paises).length} países</h2>
        <p class="sub">Elige un producto para ver quién produce, quién exporta y quién depende de importaciones. Haz clic en un país para ver su portafolio.</p>
      </div>
      <div class="cifras-resumen">
        <div><b>${usd(totalUSD)}</b><span>exportados ${esGlobal() ? "en el mundo" : "por la región"}</span></div>
        <div><b>${primero.length} de ${ind.length}</b><span>productos donde México es el primer productor</span></div>
        ${ranking[0]?.[0] === "México"
          ? `<div><b>${ranking[1] ? ranking[1][0] : "—"}</b><span>segundo país con más liderazgos (${ranking[1] ? ranking[1][1] : 0})</span></div>`
          : `<div><b>${ranking[0] ? ranking[0][0] : "—"}</b><span>país con más liderazgos (${ranking[0] ? ranking[0][1] : 0} productos)</span></div>`}
      </div>
      <table class="tabla-resumen">
        <thead><tr><th>Producto</th><th class="num">Total</th><th>Líder</th><th class="num">México</th><th class="num">Exporta US$</th></tr></thead>
        <tbody>${[...ind].sort((a, b) => b.expUSD - a.expUSD).map(x => `
          <tr class="clic" data-prod="${x.k}">
            <td><span class="prod"><i style="background:${x.color}"></i>${x.nombre}</span></td>
            <td class="num">${fmtT(x.prod)}</td><td>${x.lider}</td>
            <td class="num"><span class="tag ${x.mxLugar === 1 ? "exc" : x.mxLugar <= 3 ? "ok" : "def"}">#${x.mxLugar ?? "—"} · ${pct(x.mxShare)}</span></td>
            <td class="num">${x.expUSD * 1000 >= 1e9 ? (x.expUSD / 1e6).toFixed(2) + " mil M" : fmt(x.expUSD / 1000) + " M"}</td>
          </tr>`).join("")}</tbody>
      </table>
      <div class="hallazgos">
        <span class="etq">Lo que muestran los datos</span>
        <p class="hallazgo"><span>México es el primer productor ${TX().de} en <b>${primero.map(x => x.nombre.split(" ")[0].toLowerCase()).join(", ")}</b>.</span></p>
        <p class="hallazgo"><span>Otros líderes: ${ranking.filter(([p]) => p !== "México").map(([p, n]) => `<b>${p}</b> (${n})`).join(", ")}.</span></p>
        ${(() => {
          if (!C() || esGlobal()) return "";
          const { tot, destinos } = destinoRegional();
          const g = n => destinos.find(d => d[0] === n)?.[1] ?? 0;
          return `<p class="hallazgo"><span>De lo que exporta la región en estas frutas y hortalizas, <b>${pct(g("Estados Unidos") / tot)}</b> va a Estados Unidos,
            <b>${pct(g("Europa") / tot)}</b> a Europa, <b>${pct(g("Latinoamérica") / tot)}</b> se queda en Latinoamérica y <b>${pct(g("Asia y Oceanía") / tot)}</b> va a Asia (FAOSTAT ${C().anio}).</span></p>`;
        })()}
        <p class="hallazgo"><span>Las cifras de FAOSTAT para México pueden diferir de las del SIAP por revisiones y definiciones; en la vista México se usan las del SIAP.</span></p>
      </div>`;
  }

  // ---------- Comercio bilateral (FAOSTAT, matriz detallada) ----------
  const C = () => esGlobal() ? window.GLOBAL_COMERCIO : window.LATAM_COMERCIO;
  const nodo = id => L().paises[id] ?? C()?.anclas?.[id];
  const nombreNodo = id => L().paises[id] ? nombrePais(L().paises[id]) : (C()?.anclas?.[id]?.nombre ?? id);
  const flujos = k => C()?.productos?.[k] ?? [];

  // Arco curvo entre dos puntos (Bézier cuadrática), para que las rutas no se encimen en línea recta
  function arco(a, b) {
    const [y1, x1] = a, [y2, x2] = b;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1;
    const cx = mx - dy * 0.22, cy = my + dx * 0.22;
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      pts.push([(1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t * t * y2, (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t * t * x2]);
    }
    return pts;
  }

  function crearCapaComercio(mapa) {
    const capa = window.L.layerGroup();
    function dibujar(k, color, pais) {
      capa.clearLayers();
      let lista = flujos(k);
      if (pais) lista = lista.filter(f => f[0] === pais || f[1] === pais);
      lista = lista.slice(0, pais ? 15 : 12);
      if (!lista.length) return;
      const max = lista[0][2];
      const usados = new Set();
      const cImp = window.Paleta.tokens().importa;
      lista.forEach(([o, d, t, usdMiles]) => {
        const A = nodo(o), B = nodo(d);
        if (!A || !B) return;
        usados.add(o); usados.add(d);
        const entra = pais && d === pais;
        window.Paleta.ruta(capa, arco([A.lat, A.lon], [B.lat, B.lon]), entra ? cImp : color, 0.8 + 3 * Math.sqrt(t / max),
          `${nombreNodo(o)} → ${nombreNodo(d)}<br><b>${fmtT(t)}</b> · ${usd(usdMiles)}`);
      });
      // orígenes con brillo
      new Set(lista.map(f => f[0])).forEach(o => { const A = nodo(o); if (A) window.Paleta.origen(capa, A.lat, A.lon, "", color); });
      // anclas fuera de Latinoamérica como etiquetas
      [...usados].filter(id => !L().paises[id] && C().anclas?.[id]).forEach(id => {
        const A = C().anclas[id];
        window.L.marker([A.lat, A.lon], {
          icon: window.L.divIcon({ className: "ancla", html: `<span>${A.nombre}</span>`, iconSize: null }), interactive: false
        }).addTo(capa);
      });
    }
    return { dibujar, mostrar: () => capa.addTo(mapa), ocultar: () => capa.remove() };
  }

  // Dónde puede vender México: importadores con más compra que no viene de México
  function oportunidadesHTML(R) {
    if (!R.opp) return "";
    const top = Object.entries(R.opp).sort((a, b) => b[1].libreUSD - a[1].libreUSD).slice(0, 10);
    if (!top.length) return "";
    const fila = id => R.filas.find(f => f.id === id);
    return `
      <h3>Dónde puede vender México <span class="tag ok">FAOSTAT ${C().anio}</span></h3>
      <p class="sub">Países que más importan y cuánto de eso <b>no</b> le compran a México. Precio = valor ÷ volumen importado.</p>
      <table>
        <tr><th>País</th><th class="num">Compra fuera de México</th><th class="num">US$/kg</th><th class="num">De México</th><th>Hoy le vende</th>${window.Acceso ? "<th>Acceso</th>" : ""}</tr>
        ${top.map(([id, o]) => `<tr class="clic" data-pais="${id}"><td>${fila(id).nombre}</td><td class="num">${usd(o.libreUSD)}<br><span class="est">${fmtT(o.libreT)}</span></td>
          <td class="num">${o.precio.toFixed(2)}</td><td class="num">${o.parteMX > 0.005 ? pct(o.parteMX) : "—"}</td><td>${o.principal ? nombreNodo(o.principal) : "—"}</td>${window.Acceso ? `<td>${(c => c ? Acceso.etiqueta(c) : '<span class="est">—</span>')(Acceso.celda(R.k, L().paises[id]?.iso))}</td>` : ""}</tr>`).join("")}
      </table>
      <p class="sub">Ojo: Países Bajos, Bélgica y otros centros logísticos compran para reexportar a toda Europa. Es un punto de partida: no considera aranceles, requisitos fitosanitarios ni acceso sanitario para producto mexicano. Elige <i>Oportunidad para México</i> en el menú de color del mapa para verlo por país.</p>`;
  }

  function rutasHTML(k) {
    const lista = flujos(k);
    if (!lista.length) return "";
    const total = lista.reduce((s, f) => s + f[2], 0);
    const desdeLatam = lista.filter(f => L().paises[f[0]]);
    const exp = desdeLatam.reduce((s, f) => s + f[3], 0);
    const porDestino = {};
    // Latinoamérica: destinos agrupados (la región vs. anclas); mundo: principales países compradores
    desdeLatam.forEach(f => { const g = !esGlobal() && L().paises[f[1]] ? "Latinoamérica" : nombreNodo(f[1]); porDestino[g] = (porDestino[g] ?? 0) + f[3]; });
    const destinos = Object.entries(porDestino).sort((a, b) => b[1] - a[1]);
    return `
      <h3>Principales rutas comerciales <span class="tag ok">FAOSTAT ${C().anio}</span></h3>
      ${lista.slice(0, 8).map(([o, d, t, u]) => `<div class="ruta"><span>${nombreNodo(o)} <b>→</b> ${nombreNodo(d)}</span><span class="x">${fmtT(t)}</span><span class="x">${usd(u)}</span></div>`).join("")}
      ${destinos.length ? `<h4 class="mini">${esGlobal() ? "Principales compradores del mundo (valor)" : "A dónde va la exportación latinoamericana (valor)"}</h4>
        ${destinos.slice(0, 6).map(([g, v]) => `<div class="barra-h"><span class="n">${g}</span><span class="b"><i style="width:${v / destinos[0][1] * 100}%"></i></span><span class="x">${pct(v / exp)}</span></div>`).join("")}` : ""}
      <p class="sub">${esGlobal() ? "Según lo que reporta cada país exportador." : "Salidas de países latinoamericanos según el exportador; llegadas desde fuera de la región según el importador."} ${fmtT(total)} en las rutas registradas.</p>`;
  }

  function sociosHTML(id, k) {
    const lista = flujos(k);
    const ventas = lista.filter(f => f[0] === id).sort((a, b) => b[3] - a[3]);
    const compras = lista.filter(f => f[1] === id).sort((a, b) => b[2] - a[2]);
    // socios en todas las frutas y hortalizas
    const total = {};
    Object.values(C()?.productos ?? {}).forEach(ls => ls.forEach(f => { if (f[0] === id) total[f[1]] = (total[f[1]] ?? 0) + f[3]; }));
    const principales = Object.entries(total).sort((a, b) => b[1] - a[1]);
    const suma = principales.reduce((s, x) => s + x[1], 0);
    const nombreP = nombreProd(k).toLowerCase();
    const fila = (n, v, max, txt) => `<div class="barra-h"><span class="n">${n}</span><span class="b"><i style="width:${Math.min(100, v / max * 100)}%"></i></span><span class="x">${txt}</span></div>`;
    return `
      ${ventas.length ? `<h3>A quién le vende ${nombreP}</h3>${ventas.slice(0, 6).map(f => fila(nombreNodo(f[1]), f[3], ventas[0][3], usd(f[3]))).join("")}` : ""}
      ${compras.length ? `<h3>A quién le compra ${nombreP}</h3>${compras.slice(0, 6).map(f => fila(nombreNodo(f[0]), f[2], compras[0][2], fmtT(f[2]))).join("")}` : ""}
      ${principales.length ? `<h3>Sus principales clientes (todas estas frutas y hortalizas)</h3>
        ${principales.slice(0, 6).map(([d, v]) => fila(nombreNodo(d), v, principales[0][1], pct(v / suma))).join("")}` : ""}`;
  }

  // Destino de la exportación de toda la región, sumando productos (para el Resumen)
  function destinoRegional() {
    const porDestino = {};
    let tot = 0;
    Object.values(C()?.productos ?? {}).forEach(ls => ls.forEach(f => {
      if (!L().paises[f[0]]) return;
      const g = L().paises[f[1]] ? "Latinoamérica" : nombreNodo(f[1]);
      porDestino[g] = (porDestino[g] ?? 0) + f[3]; tot += f[3];
    }));
    return { tot, destinos: Object.entries(porDestino).sort((a, b) => b[1] - a[1]) };
  }

  window.Latam = {
    usar: r => { fuente = r === "global" ? "global" : "latam"; },
    datos: () => L(), claves: () => Object.keys(L()?.productos ?? {}).filter(k => window.PRODUCTOS[k]),
    nombre: nombreProd, disponible, calcular, crearCapa, leyendaHTML, productoHTML, paisHTML, indicadores, resumenHTML, METRICAS,
    comercioDisponible: () => !!C(), crearCapaComercio, rutasHTML, sociosHTML, destinoRegional };
})();

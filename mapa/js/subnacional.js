// ============================================================================
// Motor común de vistas por país (regiones subnacionales): EE. UU., Brasil, …
// Datos: window.SUBNACIONAL[código] con formato común (scripts/subnacional_comun.py).
// Demanda por región = población × consumo aparente nacional por persona
// (producción + importación − exportación). Las importaciones se reparten entre
// las regiones deficitarias según su déficit (estimación).
// ============================================================================
(function () {
  const fmt = n => Math.round(n).toLocaleString("es-MX");
  const fmtT = t => t >= 1e6 ? (t / 1e6).toFixed(2) + " Mt" : t >= 1e3 ? fmt(t / 1e3) + " mil t" : fmt(t) + " t";
  const fmtP = n => n >= 1e6 ? (n / 1e6).toFixed(1) + " M" : fmt(n);
  const usd = miles => { const v = miles * 1000; return v >= 1e9 ? "US$" + (v / 1e9).toFixed(2) + " mil M" : v >= 1e6 ? "US$" + fmt(v / 1e6) + " M" : v > 0 ? "< US$1 M" : "—"; };
  const pct = x => (x * 100).toFixed(0) + "%";
  let nombresES = null;
  try { nombresES = new Intl.DisplayNames(["es"], { type: "region" }); } catch (e) { nombresES = null; }
  const pais = (m49, iso) => { try { return (iso && nombresES?.of(iso)) || iso || m49; } catch (e) { return iso || m49; } };

  let codigo = null;
  const D = () => window.SUBNACIONAL?.[codigo];
  const paises = () => Object.entries(window.SUBNACIONAL ?? {}).map(([c, d]) => ({ codigo: c, nombre: d.pais })).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const usar = c => { codigo = c; };
  const disponible = k => !!D()?.productos?.[k];
  // Catálogo: productos del mapa de México más los que solo existen en vistas por país (data/productos_paises.js)
  const meta = k => window.PRODUCTOS[k] ?? window.PRODUCTOS_PAISES?.[k];
  const claves = () => Object.keys(D()?.productos ?? {}).filter(k => meta(k));
  const nombreProd = k => D()?.productos?.[k]?.nombre ?? meta(k)?.nombre ?? k;
  const reg = () => D().nivel;           // "estado", "provincia", …
  const unReg = () => (D()?.femenino ? "una " : "un ") + reg();
  const regs = () => D().nivelPlural;    // "estados", "provincias", …
  const Reg = () => reg().charAt(0).toUpperCase() + reg().slice(1);
  const Regs = () => regs().charAt(0).toUpperCase() + regs().slice(1);   // "Regiones", "Comunidades autónomas"…
  // Ubicación de un país de origen (vista mundial de FAOSTAT)
  const coordPais = m49 => window.GLOBAL?.paises?.[m49];

  // Confianza del dato: parte de las toneladas publicadas oficialmente por región (bandera 0) frente a estimadas (1)
  function confianza(k, c = codigo) {
    const d = window.SUBNACIONAL?.[c];
    const lista = k ? [d?.productos?.[k]].filter(Boolean) : Object.values(d?.productos ?? {});
    let pub = 0, tot = 0;
    lista.forEach(P => Object.values(P.regiones).forEach(([t, e]) => { tot += t; if (e !== 1) pub += t; }));
    const parte = tot > 0 ? pub / tot : 0;
    return { parte, nivel: parte >= 0.9 ? "oficial" : parte >= 0.3 ? "mixto" : "estimado" };
  }
  const CONFIANZA = { oficial: ["Dato oficial por región", "ok"], mixto: ["Dato mixto: oficial y estimado", "alerta-tag"], estimado: ["Dato estimado por región", "def"] };
  function confianzaHTML(k) {
    const c = confianza(k), [t, cl] = CONFIANZA[c.nivel];
    return `<span class="tag ${cl}" title="${Math.round(c.parte * 100)}% de las toneladas vienen publicadas por región; el resto se reparte con superficie, población u otra clave">${t}</span>`;
  }

  function calcular(k) {
    const P = D().productos[k], C = P.comercio;
    const pobNac = Object.values(D().regiones).reduce((s, e) => s + (e.pob || 0), 0);
    // Importación: la mayor entre lo que registra el país y lo que reportan sus proveedores
    const impOrig = (C?.origenes ?? []).reduce((s, o) => s + o[2], 0);
    const imp = Math.max(C?.imp ?? 0, impOrig);
    const ajustado = !!C && impOrig > (C.imp ?? 0) * 1.1;
    const consumo = Math.max(0, P.nacional + imp - (C?.exp ?? 0));
    const pc = pobNac > 0 ? consumo * 1000 / pobNac : 0;
    const filas = Object.entries(D().regiones).map(([id, e]) => {
      const [prod, est] = P.regiones[id] ?? [0, null];
      const demanda = (e.pob || 0) * pc / 1000;
      return { id, nombre: e.nombre, lat: e.lat, lon: e.lon, pob: e.pob, prod, estimado: est === 1,
        demanda, auto: demanda > 0 ? prod / demanda : 0, deficit: Math.max(0, demanda - prod) };
    });
    const sumaDef = filas.reduce((s, f) => s + f.deficit, 0);
    const desdeMX = C?.desdeMX?.[0] ?? 0;
    filas.forEach(f => {
      // Lo importado que se reexporta no llega a las regiones: se reparte a lo sumo el déficit total
      f.imp = sumaDef > 0 ? Math.min(imp, sumaDef) * f.deficit / sumaDef : 0;
      f.depImp = f.demanda > 0 ? Math.min(1, f.imp / f.demanda) : 0;
      f.mx = sumaDef > 0 ? desdeMX * f.deficit / sumaDef : 0;
    });
    const orden = [...filas].filter(f => f.prod > 0).sort((a, b) => b.prod - a.prod);
    orden.forEach((f, i) => f.lugar = i + 1);
    return { k, P, C, filas, orden, pc, consumo, imp, ajustado, pobNac, desdeMX,
      autoNac: consumo > 0 ? P.nacional / consumo : 0, impConsumo: consumo > 0 ? Math.min(1, imp / consumo) : 0,
      mxConsumo: consumo > 0 ? Math.min(1, desdeMX / consumo) : 0, reexporta: imp > consumo * 1.05 };
  }

  const colorAuto = r => window.Paleta.auto(r);
  const colorImp = r => window.Paleta.imp(r);
  const METRICAS = {
    auto: { titulo: "Autosuficiencia", valor: f => f.auto, color: colorAuto,
      rangos: [["Sin producción", 0], ["< 50% de su demanda", 0.3], ["50–99%", 0.7], ["Autosuficiente (1–2×)", 1.5], ["Excedentario (2–10×)", 5], ["Gran abastecedor (>10×)", 20]] },
    imp: { titulo: "Dependencia de importaciones (estimada)", valor: f => f.depImp, color: colorImp,
      rangos: [["No importa", 0], ["< 20% de su consumo", 0.1], ["20–40%", 0.3], ["40–60%", 0.5], ["> 60%", 0.7]] }
  };

  function arco(a, b) {
    const [y1, x1] = a, [y2, x2] = b;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1;
    const cx = mx - dy * 0.2, cy = my + dx * 0.2, pts = [];
    for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push([(1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t * t * y2, (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t * t * x2]); }
    return pts;
  }

  function crearCapa(mapa) {
    const capa = window.L.layerGroup();
    let ultimo = null;
    function dibujar(R, metrica, seleccionado, conImport, color, alClic, verVolumen) {
      ultimo = [...arguments];
      capa.clearLayers();
      const M = METRICAS[metrica], cc = codigo, geo = window.GEO_SUB?.[cc];
      // Los contornos se cargan la primera vez que se abre el país; mientras tanto se ven burbujas
      if (!geo) window.Paleta.geoRegiones(cc).then(() => { if (codigo === cc && ultimo) dibujar(...ultimo); }).catch(() => {});
      const porId = Object.fromEntries(R.filas.map(f => [f.id, f]));
      const tip = f => `<b>${f.nombre}</b><br>Producción: ${fmtT(f.prod)}${f.estimado ? " (estimada)" : ""}<br>
          Demanda: ${fmtT(f.demanda)} · autosuficiencia ${f.auto >= 10 ? f.auto.toFixed(0) + "×" : pct(f.auto)}
          ${f.imp > 0 ? `<br>Importado (estimado): ${fmtT(f.imp)}, ${pct(f.depImp)} de su consumo` : ""}`;
      if (geo) window.Paleta.coropletas(mapa, capa, geo, {
        color: id => porId[id] ? M.color(M.valor(porId[id])) : null, seleccionado,
        tooltip: id => tip(porId[id]), clic: alClic
      });
      if (conImport && R.imp > 0 && R.C?.origenes?.length) {
        // Tres principales orígenes → regiones con más déficit (reparto proporcional; estimación)
        const cImp = window.Paleta.tokens().importa;
        const totalOrig = R.C.origenes.reduce((s, o) => s + o[2], 0) || 1;
        const destinos = [...R.filas].filter(f => f.imp > 0).sort((a, b) => b.imp - a.imp).slice(0, 5);
        const trazos = [];
        R.C.origenes.slice(0, 3).forEach(o => {
          const P = coordPais(o[0]); if (!P) return;
          destinos.forEach(f => trazos.push({ o, P, f, t: f.imp * o[2] / totalOrig }));
          window.Paleta.origen(capa, P.lat, P.lon, pais(o[0], o[1]), cImp);
        });
        const max = Math.max(...trazos.map(x => x.t), 1);
        trazos.forEach(({ o, P, f, t }) => window.Paleta.ruta(capa, arco([P.lat, P.lon], [f.lat, f.lon]), cImp,
          0.8 + 2.6 * Math.sqrt(t / max), `${pais(o[0], o[1])} → ${f.nombre}<br><b>${fmtT(t)}</b> (estimado)`));
      }
      const maxP = Math.max(...R.filas.map(f => f.prod), 1);
      [...R.filas].sort((a, b) => b.prod - a.prod).forEach(f => {
        const r = f.prod > 0 ? 4 + 30 * Math.sqrt(f.prod / maxP) : 3;
        if (geo) { if (verVolumen && f.prod > 0) window.Paleta.volumen(capa, f.lat, f.lon, r); return; }
        window.L.circleMarker([f.lat, f.lon], {
          radius: r, color: f.id === seleccionado ? window.Paleta.tokens().sel : window.Paleta.tokens().borde, weight: f.id === seleccionado ? 3 : 1.2,
          fillColor: M.color(M.valor(f)), fillOpacity: 0.85
        }).bindTooltip(tip(f)).on("click", () => alClic(f.id)).addTo(capa);
      });
    }
    return { dibujar, mostrar: () => capa.addTo(mapa), ocultar: () => capa.remove() };
  }

  function leyendaHTML(metrica, nombre, verVolumen) {
    const M = METRICAS[metrica];
    return `<h4>${M.titulo}: ${nombre}</h4>` + M.rangos.map(([t, v]) => `<div class="fila"><span class="sw" style="background:${M.color(v)}"></span>${t}</div>`).join("") +
      `<div class="fila pie">${verVolumen ? "Círculo = volumen producido · " : ""}${D().fuenteCorta}</div>`;
  }

  const etiqueta = r => r <= 0 ? `<span class="tag def">0%</span>` : r < 1 ? `<span class="tag def">${pct(r)}</span>` :
    `<span class="tag ${r < 2 ? "ok" : "exc"}">${r >= 10 ? r.toFixed(0) : r.toFixed(1)}×</span>`;
  const barra = (n, v, max, txt) => `<div class="barra-h"><span class="n">${n}</span><span class="b"><i style="width:${Math.min(100, v / (max || 1) * 100)}%"></i></span><span class="x">${txt}</span></div>`;

  const S = (id, html, resumen, op) => window.Seccion ? window.Seccion.envolver(id, html, resumen, op) : html;
  const AUTO = '<span data-auto>Cargando la serie…</span>';   // el módulo de historia lo llena al cargar

  function productoHTML(R) {
    const { P, C } = R;
    const fuente = P.fuenteProduccion === "FAOSTAT" ? `FAOSTAT ${P.anioProduccion} (sin dato oficial por ${reg()})` : `${D().fuenteCorta}`;
    const publicados = R.filas.filter(f => f.prod > 0 && !f.estimado).length;
    const conProd = R.filas.filter(f => f.prod > 0).length;
    const deficit = [...R.filas].filter(f => f.pob > 3e6 && f.auto < 0.5).sort((a, b) => b.demanda - a.demanda).slice(0, 6);
    const recibe = [...R.filas].filter(f => f.imp > 0).sort((a, b) => b.imp - a.imp).slice(0, 6);
    return `
      <h2>${nombreProd(R.k)} en ${D().pais}</h2>
      <p class="sub">${confianzaHTML(R.k)} <span class="tag ok">${fuente}</span> <span class="tag ok">Población ${D().anioPoblacion}</span> ${C ? `<span class="tag ok">FAOSTAT ${D().anioComercio}</span>` : ""}</p>
      <div class="kpis">
        <div class="kpi"><div class="v">${fmtT(P.nacional)}</div><div class="l">Producción nacional</div></div>
        <div class="kpi"><div class="v">${fmtT(R.consumo)}</div><div class="l">Consumo aparente · ${R.pc.toFixed(1)} kg por persona</div></div>
        <div class="kpi"><div class="v">${C ? fmtT(R.imp) : "—"}</div><div class="l">Importación${C ? " · " + usd(C.impUSD) : ""}</div></div>
        <div class="kpi"><div class="v">${C ? fmtT(C.exp) : "—"}</div><div class="l">Exportación${C ? " · " + usd(C.expUSD) : ""}</div></div>
        <div class="kpi destacado"><div class="v">Autosuficiencia ${pct(R.autoNac)} · importado ${pct(R.impConsumo)}</div>
          <div class="l">${R.autoNac >= 1 ? `${D().pais} produce todo lo que consume${C?.exp ? ` y exporta ${fmtT(C.exp)}` : ""}.` : `${D().pais} importa ${pct(R.impConsumo)} de lo que consume.`}
          ${R.reexporta ? ` Importa ${fmtT(R.imp)}, más de lo que consume: parte de lo importado se reexporta.` : ""}
          ${R.desdeMX > 0 ? ` México le vende ${fmtT(R.desdeMX)} (${usd(C.desdeMX[1])}), ${pct(R.mxConsumo)} de su consumo.` : ""}</div></div>
      </div>
      ${P.nota ? `<div class="nota">${P.nota}</div>` : ""}
      ${R.ajustado ? `<div class="nota" style="border-left-color:var(--transporte)">Sus proveedores reportan haberle vendido más de lo que ${D().pais} registra como importación (${fmtT(C.imp)}); se usa la cifra mayor.</div>` : ""}
      ${R.orden.length ? S("regiones", `<h3>Principales ${regs()} ${D().femenino ? "productoras" : "productores"}</h3>
      <table>
        <tr><th>${Reg()}</th><th class="num">Producción</th><th class="num">% nacional</th><th class="num">Autosuf.</th></tr>
        ${R.orden.slice(0, 10).map(f => `<tr class="clic" data-region="${f.id}"><td>${f.nombre}${f.estimado ? ' <span class="est">(est.)</span>' : ""}</td>
          <td class="num">${fmtT(f.prod)}</td><td class="num">${pct(f.prod / P.nacional)}</td><td class="num">${etiqueta(f.auto)}</td></tr>`).join("")}
      </table>
      <p class="sub">${publicados} de ${conProd} ${regs()} con cifra oficial publicada. ${D().metodo}</p>`,
        `${R.orden[0].nombre}: ${pct(R.orden[0].prod / P.nacional)} de la producción nacional`, { abierta: true }) :
      `<div class="nota">${D().pais} casi no produce este producto: su consumo depende de importaciones.</div>`}
      ${recibe.length ? S("reparto", `<h3>${Regs()} que más importan (estimado)</h3>${recibe.map(f => barra(f.nombre, f.imp, recibe[0].imp, fmtT(f.imp))).join("")}
        <p class="sub">Estimación: la importación se reparte entre ${regs()} según su déficit (demanda − producción propia).</p>`,
        `Más importado: ${recibe[0].nombre}, ${fmtT(recibe[0].imp)}`) : ""}
      ${deficit.length ? `<div class="nota">${Regs()} grandes que no cubren ni la mitad de su demanda: <b>${deficit.map(f => `${f.nombre} (${pct(f.auto)})`).join(", ")}</b>.</div>` : ""}
      <p class="sub">Demanda por ${reg()} = población ${D().anioPoblacion} × consumo aparente nacional (producción + importación − exportación).</p>
      ${D().codigo === "US" && window.Embarques ? S("embarques", `<h3>Quién abastece a EE. UU. cada semana <span class="tag ok">USDA</span></h3>${Embarques.marca("oferta", R.k, "eua")}`, AUTO, { abierta: true }) : ""}
      ${D().codigo === "US" && window.PreciosEUA ? S("mayoreo", window.PreciosEUA.panelHTML(R.k), window.PreciosEUA.panelResumen(R.k)) : ""}
      ${window.Historia ? S("historia", `<h3>${D().pais} en diez años</h3>${Historia.marca("pais", R.k, { pais: D().m49, titulo: "" })}`, AUTO) : ""}`;
  }

  // Pestaña Exportar: comercio exterior del país en este producto y lo que significa para México
  function exportarHTML(R) {
    const { C } = R;
    const d = D(), ue = d.codigo === "GR" ? "EL" : d.codigo;
    const secUSA = d.codigo === "US" && window.PreciosEUA
      ? window.PreciosEUA.seccionesExportar(R.k, window.PreciosEUA.volumenPais(R.k), "Lo que cruza de México").map(([id, h, r]) => S(id, h, r)).join("") : "";
    const acceso = window.Acceso?.celda(R.k, d.codigo);
    return `
      <h2>Comercio exterior: ${nombreProd(R.k)} en ${d.pais}</h2>
      <p class="sub">${C ? `<span class="tag ok">FAOSTAT ${d.anioComercio}</span>` : ""} Qué compra y vende ${d.pais}, cuánto le vende México y en qué condiciones.</p>
      ${C ? `<div class="kpis">
        <div class="kpi"><div class="v">${fmtT(R.imp)}</div><div class="l">Importación · ${usd(C.impUSD)} · ${pct(R.impConsumo)} de su consumo</div></div>
        <div class="kpi"><div class="v">${fmtT(C.exp)}</div><div class="l">Exportación · ${usd(C.expUSD)}</div></div>
        <div class="kpi destacado"><div class="v">${R.desdeMX > 0 ? `México le vende ${fmtT(R.desdeMX)}` : "México no le vende"}</div>
          <div class="l">${R.desdeMX > 0 ? `${usd(C.desdeMX[1])}, ${pct(R.mxConsumo)} de su consumo y ${pct(R.imp > 0 ? Math.min(1, R.desdeMX / R.imp) : 0)} de lo que importa.` : `Matriz bilateral de FAOSTAT ${d.anioComercio}.`}</div></div>
      </div>` : `<div class="nota">Sin datos de comercio de FAOSTAT para este producto: el balance supone que lo producido se consume en el país.</div>`}
      ${C?.origenes?.length ? S("origenes", `<h3>De dónde importa (volumen)</h3>${C.origenes.map(o => barra(pais(o[0], o[1]), o[2], C.origenes[0][2], fmtT(o[2]))).join("")}`,
        `Primer proveedor: ${pais(C.origenes[0][0], C.origenes[0][1])}, ${pct(C.origenes[0][2] / (C.origenes.reduce((a, o) => a + o[2], 0) || 1))} del volumen`, { abierta: true }) : ""}
      ${C?.destinos?.length ? S("destinos", `<h3>A dónde exporta (valor)</h3>${C.destinos.map(o => barra(pais(o[0], o[1]), o[3], C.destinos[0][3], usd(o[3]))).join("")}`,
        `Primer destino: ${pais(C.destinos[0][0], C.destinos[0][1])}, ${usd(C.destinos[0][3])}`) : ""}
      ${acceso ? S("acceso", `<h3>Acceso de México a este mercado</h3>${window.Acceso.mercadoHTML(R.k, d.codigo)}
        <p class="sub">Acceso fitosanitario y arancel para producto fresco de origen México. No incluye límites de residuos ni normas de comercialización.</p>`,
        window.Acceso.resumenMercado(R.k, d.codigo)) : ""}
      ${secUSA}
      ${d.codigo === "US" && window.Embarques ? S("pronostico", `<h3>Pronóstico de 8 semanas <span class="tag ok">USDA</span></h3>${Embarques.marca("pronostico", R.k, "eua")}`, AUTO) : ""}
      ${d.codigo === "CA" && window.PreciosCanada?.disponible(R.k) ? S("canada", PreciosCanada.html(R.k), PreciosCanada.resumen(R.k), { abierta: true }) : ""}
      ${window.PreciosUE ? S("europa", PreciosUE.html(R.k, ue), PreciosUE.resumen(R.k, ue)) : ""}
      ${window.Mercado && d.m49 ? `<p class="sub"><a href="#" class="enlace-mercado" data-mercado="${d.m49}">Ver el mercado de ${d.pais} como comprador: qué importa y a quién le compra →</a></p>` : ""}`;
  }

  function regionHTML(id) {
    const e = D().regiones[id];
    const filas = claves().map(k => { const R = calcular(k), f = R.filas.find(x => x.id === id); return { ...f, k, nombre: nombreProd(k), color: meta(k).color }; });
    const lider = filas.filter(f => f.lugar === 1).map(f => f.nombre.toLowerCase());
    const impTot = filas.reduce((s, f) => s + f.imp, 0);
    return `
      <p class="sub"><a href="#" id="volverPaisSub">← ${D().pais}</a> · ${Reg()}</p>
      <h2>${e.nombre}</h2>
      <p class="sub">Población ${e.pob ? fmtP(e.pob) : "—"} (${D().anioPoblacion})</p>
      <div class="kpis">
        <div class="kpi"><div class="v">${fmtT(impTot)}</div><div class="l">Importado en estas frutas y hortalizas (estimado)</div></div>
        <div class="kpi"><div class="v">${lider.length}</div><div class="l">${lider.length === 1 ? "producto en que es" : "productos en que es"} primer productor nacional</div></div>
        ${lider.length ? `<div class="kpi destacado"><div class="v" style="font-size:15px">Líder nacional en ${lider.join(", ")}</div></div>` : ""}
      </div>
      <h3>Portafolio de ${e.nombre}</h3>
      <table>
        <tr><th>Producto</th><th class="num">Producción</th><th class="num">Demanda</th><th class="num">Autosuf.</th><th class="num">Importado</th></tr>
        ${filas.sort((a, b) => b.auto - a.auto).map(f => `<tr class="clic" data-prod="${f.k}"><td><span class="prod"><i style="background:${f.color}"></i>${f.nombre}${f.estimado ? ' <span class="est">(est.)</span>' : ""}</span></td>
          <td class="num">${fmtT(f.prod)}</td><td class="num">${fmtT(f.demanda)}</td><td class="num">${etiqueta(f.auto)}</td><td class="num">${f.depImp > 0 ? pct(f.depImp) : "—"}</td></tr>`).join("")}
      </table>
      <p class="sub">"Importado" = parte estimada de su consumo que llega del extranjero.</p>`;
  }

  function indicadores() {
    return claves().map(k => {
      const R = calcular(k), p = meta(k);
      return { k, nombre: nombreProd(k), tipo: p.tipo, color: p.color, prod: R.P.nacional, auto: R.autoNac, alProductor: null,
        meta: `${fmtT(R.P.nacional)} · importa ${pct(R.impConsumo)}`, impConsumo: R.impConsumo, mxConsumo: R.mxConsumo,
        lider: R.orden[0]?.nombre ?? "—", desdeMX: R.desdeMX, desdeMXusd: R.C?.desdeMX?.[1] ?? 0,
        expUSD: R.C?.expUSD ?? 0, impUSD: R.C?.impUSD ?? 0 };
    });
  }

  function resumenHTML(ind) {
    const d = D();
    const usdMX = ind.reduce((s, x) => s + x.desdeMXusd, 0);
    const conMX = usdMX > 0;
    const exp = ind.reduce((s, x) => s + x.expUSD, 0), imp = ind.reduce((s, x) => s + x.impUSD, 0);
    const autos = ind.filter(x => x.auto >= 1);
    const dependientes = ind.filter(x => x.impConsumo >= 0.5).sort((a, b) => b.impConsumo - a.impConsumo);
    const orden = [...ind].sort((a, b) => b.impConsumo - a.impConsumo);
    return `
      <div class="resumen-cabeza">
        <span class="etq">${d.pais} · ${d.fuente}</span>
        <h2>${ind.length} frutas y hortalizas en ${Object.keys(d.regiones).length} ${regs()}</h2>
        <p class="sub">Cuánto produce cada ${reg()}, si cubre su demanda y cuánto de lo que consume se importa. Haz clic en ${unReg()} para ver su portafolio.</p>
      </div>
      <div class="cifras-resumen">
        <div><b>${usd(exp)}</b><span>exporta ${d.pais} en estos productos</span></div>
        <div><b>${usd(imp)}</b><span>importa</span></div>
        <div><b>${autos.length} de ${ind.length}</b><span>productos en que es autosuficiente</span></div>
      </div>
      <div class="desplaza"><table class="tabla-resumen">
        <thead><tr><th>Producto</th><th class="num">Producción</th><th>${Reg()} líder</th><th class="num">Autosuf.</th><th class="num">Importado</th>${conMX ? '<th class="num">De México</th>' : ""}</tr></thead>
        <tbody>${orden.map(x => `
          <tr class="clic" data-prod="${x.k}">
            <td><span class="prod"><i style="background:${x.color}"></i>${x.nombre}</span></td>
            <td class="num">${fmtT(x.prod)}</td><td>${x.lider}</td>
            <td class="num"><span class="tag ${x.auto < 0.9 ? "def" : x.auto < 2 ? "ok" : "exc"}">${pct(x.auto)}</span></td>
            <td class="num">${x.impConsumo > 0.005 ? pct(x.impConsumo) : "—"}</td>
            ${conMX ? `<td class="num">${x.mxConsumo > 0.005 ? pct(x.mxConsumo) : "—"}</td>` : ""}
          </tr>`).join("")}</tbody>
      </table></div>
      <div class="hallazgos">
        <span class="etq">Lo que muestran los datos</span>
        ${dependientes.length ? `<p class="hallazgo"><span>${d.pais} importa más de la mitad de lo que consume en <b>${dependientes.map(x => x.nombre.split(" (")[0].toLowerCase()).join(", ")}</b>.</span></p>` : ""}
        ${autos.length ? `<p class="hallazgo"><span>Es autosuficiente en <b>${autos.map(x => x.nombre.split(" (")[0].toLowerCase()).join(", ")}</b>.</span></p>` : ""}
        ${conMX ? `<p class="hallazgo"><span>México le vende <b>${usd(usdMX)}</b> en estos productos.</span></p>` : ""}
        <p class="hallazgo"><span>${d.metodo}</span></p>
      </div>`;
  }

  window.Subnacional = { exportarHTML, confianza, confianzaHTML, unReg, meta, paises, usar, datos: D, disponible, claves, nombre: nombreProd, calcular, crearCapa, leyendaHTML, productoHTML, regionHTML, indicadores, resumenHTML };
})();

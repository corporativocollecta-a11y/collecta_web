// ============================================================================
// Vista municipal: coropleta por municipio (producción, autosuficiencia local o
// rendimiento), detalle de municipio y ranking de municipios productores.
// Datos: SIAP cierre agrícola municipal (window.PRODUCCION_MUNICIPAL) y polígonos
// CONABIO/INEGI + población Censo 2020 (window.MUNICIPIOS_GEO, carga diferida).
// ============================================================================
(function () {
  const fmt = n => Math.round(n).toLocaleString("es-MX");
  const fmtT = t => t >= 1e6 ? (t / 1e6).toFixed(2) + " Mt" : t >= 1e3 ? fmt(t / 1e3) + " mil t" : fmt(t) + " t";
  const fmtP = n => n >= 1e6 ? (n / 1e6).toFixed(1) + " M" : fmt(n);
  const pct = x => x < 0.01 && x > 0 ? (x * 100).toFixed(1) + "%" : (x * 100).toFixed(0) + "%";

  const ESCALA_T = [[0, "#f3f1ea", "Sin producción"], [1, "#e1eedb", "< 1 mil t"], [1000, "#b5d9a6", "1–10 mil t"],
    [10000, "#74b86f", "10–50 mil t"], [50000, "#3a8f4a", "50–200 mil t"], [200000, "#145a32", "> 200 mil t"]];
  const ESCALA_REND = [[0, "#f3f1ea", "Sin producción"], [0.001, "#c0392b", "< 50% del promedio"], [0.5, "#f0a35e", "50–90%"],
    [0.9, "#e9e4a6", "90–110%"], [1.1, "#74b86f", "110–150%"], [1.5, "#145a32", "> 150% del promedio"]];
  const ESCALA_AUTO = [[0, "#f3f1ea", "Sin producción"], [0.001, "#c0392b", "< 50% de su demanda"], [0.5, "#f0a35e", "50–99%"],
    [1, "#a8d5a2", "Autosuficiente (1–2×)"], [2, "#3fa05f", "Excedentario (2–10×)"], [10, "#145a32", "Gran abastecedor (>10×)"]];
  const color = (escala, v) => { let c = escala[0][1]; for (const [min, col] of escala) if (v >= min) c = col; return c; };

  const nombreEstado = id => (window.ESTADOS.find(e => e.id === id) || {}).nombre || id;

  // Población municipal: Censo 2020 escalado con el crecimiento de su entidad según CONAPO (si está cargado)
  function proyectarPoblacion() {
    const factor = {};
    window.ESTADOS.forEach(e => factor[e.id] = e.pob2020 ? e.pob / e.pob2020 : 1);
    window.MUNICIPIOS_GEO.features.forEach(f => {
      const pr = f.properties;
      pr.p2020 = pr.p;
      pr.p = Math.round(pr.p * (factor[pr.c.slice(0, 2)] ?? 1));
    });
  }

  let geoPromesa = null;
  function cargarGeo() {
    if (window.MUNICIPIOS_GEO) return Promise.resolve();
    return geoPromesa ??= new Promise((ok, error) => {
      const s = document.createElement("script");
      s.src = "data/municipios_geo.js";
      s.onload = () => { proyectarPoblacion(); ok(); }; s.onerror = () => error(new Error("No se pudo cargar data/municipios_geo.js"));
      document.head.appendChild(s);
    });
  }

  // Datos municipales de un producto bajo el escenario vigente
  function datos(clave, esc, pc) {
    const base = window.PRODUCCION_MUNICIPAL?.productos?.[clave] ?? {};
    const filas = {};
    let totT = 0, totHa = 0;
    for (const [cve, [t, ha, valor]] of Object.entries(base)) {
      const f = (esc.factorProd?.[cve.slice(0, 2)] ?? 1) * (esc.factorProdNacional ?? 1);
      filas[cve] = { cve, t: t * f, ha, valor, rend: ha > 0 ? t / ha : 0 };
      totT += t * f; totHa += ha;
    }
    return { filas, totT, rendNacional: totHa > 0 ? totT / totHa : 0, pc };
  }

  let _pob = null;
  function indicePob() {
    if (!_pob && window.MUNICIPIOS_GEO) {
      _pob = {}; _nombres = {};
      window.MUNICIPIOS_GEO.features.forEach(f => { _pob[f.properties.c] = f.properties.p; _nombres[f.properties.c] = f.properties.n; });
    }
    return _pob || {};
  }
  let _nombres = null;
  const nombreMun = cve => (indicePob(), _nombres?.[cve]) || window.MUNICIPIOS_NOMBRES?.[cve] || cve;   // nombres sin cargar el mapa municipal

  function crear(mapa, ctx) {
    const renderer = L.canvas({ padding: 0.3 });
    let capa = null, visible = false, d = null;

    function valor(feature) {
      const c = feature.properties.c, f = d.filas[c];
      const metrica = ctx.metrica();
      if (metrica === "sequia") return window.Sequia ? window.Sequia.nivel(c) : 0;
      if (metrica === "rendimiento") return f && f.ha > 0 ? f.rend / d.rendNacional : 0;
      if (metrica === "autosuficiencia") {
        const dem = feature.properties.p * d.pc / 1000;
        return f && dem > 0 ? f.t / dem : 0;
      }
      return f ? f.t : 0;
    }
    function escala() {
      return { rendimiento: ESCALA_REND, autosuficiencia: ESCALA_AUTO, sequia: window.Sequia?.ESCALA }[ctx.metrica()] ?? ESCALA_T;
    }
    function estilo(feature) {
      const sel = feature.properties.c === ctx.seleccionado();
      return {
        renderer, fillColor: color(escala(), valor(feature)),
        fillOpacity: ctx.metrica() === "sequia" ? (d.filas[feature.properties.c] ? 0.9 : 0.4) : valor(feature) > 0 ? 0.85 : 0.35,
        color: sel ? "#111" : "#ffffff", weight: sel ? 2.5 : 0.3, opacity: sel ? 1 : 0.7
      };
    }
    function tooltip(feature) {
      const { c, n, p } = feature.properties, f = d.filas[c];
      const dem = p * d.pc / 1000;
      const seq = window.Sequia?.disponible() ? `<br>Sequía (${window.Sequia.fecha()}): <b>${window.Sequia.NIVELES[window.Sequia.nivel(c)]}</b>` : "";
      return `<b>${n}</b>, ${nombreEstado(c.slice(0, 2))}${seq}<br>` + (f
        ? `Producción: ${fmtT(f.t)} (${pct(f.t / d.totT)} nacional)<br>Rendimiento: ${f.rend.toFixed(1)} t/ha
           (${pct(f.rend / d.rendNacional)} del promedio)<br>` +
          (p ? `Cubre ${dem > 0 ? (f.t / dem >= 10 ? (f.t / dem).toFixed(0) + "×" : pct(f.t / dem)) : "—"} de su demanda local` : "Sin población censal 2020")
        : `Sin producción registrada<br>Población: ${p ? fmt(p) : "sin dato censal"}`);
    }

    async function mostrar(res) {
      await cargarGeo();
      d = datos(res.clave, ctx.escenario(), res.pc);
      if (!capa) {
        capa = L.geoJSON(window.MUNICIPIOS_GEO, {
          style: estilo,
          onEachFeature: (feature, layer) => {
            layer.on("mouseover", () => layer.bindTooltip(tooltip(feature), { sticky: true }).openTooltip());
            layer.on("click", () => ctx.alSeleccionar(feature.properties.c));
          }
        });
      }
      if (!visible) { capa.addTo(mapa); visible = true; }
      capa.setStyle(estilo);
      leyenda();
    }
    function ocultar() { if (capa && visible) { capa.remove(); visible = false; } }

    function leyenda() {
      const titulo = { produccion: "Producción municipal", rendimiento: "Rendimiento vs. promedio nacional",
        autosuficiencia: "Autosuficiencia municipal", sequia: `Sequía al ${window.Sequia?.fecha() ?? ""} (CONAGUA); resaltados los municipios productores de` }[ctx.metrica()];
      const extra = ctx.metrica() === "rendimiento" ? `<div class="fila" style="margin-top:6px;color:#5f6b64">Promedio nacional: ${d.rendNacional.toFixed(1)} t/ha</div>` : "";
      document.getElementById("leyenda").innerHTML = `<h4>${titulo}: ${ctx.nombreProducto()}</h4>` +
        escala().map(([, c, t]) => `<div class="fila"><span class="sw" style="background:${c};border-radius:2px"></span>${t}</div>`).join("") + extra +
        `<div class="fila" style="margin-top:6px;color:#5f6b64">SIAP ${window.PRODUCCION_MUNICIPAL?.anio ?? ""} · límites CONABIO/INEGI</div>`;
    }

    function enfocar(cve) {
      if (!capa) return;
      capa.eachLayer(l => { if (l.feature.properties.c === cve) mapa.fitBounds(l.getBounds(), { maxZoom: 8 }); });
    }

    return { mostrar, ocultar, enfocar };
  }

  // ---------- Contenido de paneles ----------
  function ranking(res, esc, n = 10) {
    const d = datos(res.clave, esc, res.pc);
    return Object.values(d.filas).sort((a, b) => b.t - a.t).slice(0, n).map(f => ({ ...f, share: f.t / d.totT, rendRel: f.rend / d.rendNacional }));
  }

  function topHTML(res, esc) {
    if (!window.PRODUCCION_MUNICIPAL?.productos?.[res.clave]) return "";
    const d = datos(res.clave, esc, res.pc);
    const lista = ranking(res, esc, 10);
    const n = Object.keys(d.filas).length;
    const top10 = lista.reduce((s, f) => s + f.share, 0);
    return `<h3>Principales municipios productores</h3>
      <p class="sub">${fmt(n)} municipios producen ${res.producto.nombre.toLowerCase()}; los 10 primeros concentran el ${pct(top10)}.</p>
      <table>
        <tr><th>Municipio</th><th class="num">Producción</th><th class="num">% nac.</th><th class="num">t/ha</th></tr>
        ${lista.map(f => `<tr class="clic mun" data-cve="${f.cve}"><td>${nombreMun(f.cve)}<br><span class="est">${nombreEstado(f.cve.slice(0, 2))}</span></td>
          <td class="num">${fmtT(f.t)}</td><td class="num">${pct(f.share)}</td>
          <td class="num">${f.ha > 0 ? f.rend.toFixed(1) : "—"}</td></tr>`).join("")}
      </table>`;
  }

  function detalleHTML(cve, res, esc, portafolio) {
    const pob = indicePob()[cve];
    const d = datos(res.clave, esc, res.pc);
    const f = d.filas[cve];
    const dem = (pob || 0) * res.pc / 1000;
    const orden = Object.values(d.filas).sort((a, b) => b.t - a.t).findIndex(x => x.cve === cve) + 1;
    const fe = res.filas.find(x => x.id === cve.slice(0, 2));
    const auto = f && dem > 0 ? f.t / dem : 0;

    const port = portafolio.map(({ clave, nombre, pc, esc: e }) => {
      const dd = datos(clave, e, pc), x = dd.filas[cve];
      const dm = (pob || 0) * pc / 1000;
      return { clave, nombre, t: x?.t ?? 0, dem: dm, auto: x && dm > 0 ? x.t / dm : 0, rendRel: x?.ha ? x.rend / dd.rendNacional : null };
    }).sort((a, b) => b.auto - a.auto);

    const etiqueta = r => r <= 0 ? `<span class="tag def">0%</span>` : r < 1 ? `<span class="tag def">${pct(r)}</span>` :
      `<span class="tag ${r < 2 ? "ok" : "exc"}">${r >= 10 ? r.toFixed(0) : r.toFixed(1)}×</span>`;

    return `
      <p class="sub"><a href="#" id="volverEstado">← ${nombreEstado(cve.slice(0, 2))}</a> · Municipio · clave INEGI ${cve}</p>
      <h2>${nombreMun(cve)}</h2>
      <p class="sub">Población ${pob ? fmt(pob) + (window.POBLACION_CONAPO ? ` (${window.POBLACION_CONAPO.anio}, Censo 2020 ajustado por CONAPO estatal)` : " (Censo 2020)") : "sin dato censal 2020 (municipio de reciente creación)"} · ${res.producto.nombre}</p>
      ${f ? `<div class="kpis">
        <div class="kpi"><div class="v">${fmtT(f.t)}</div><div class="l">Producción · lugar ${orden} de ${Object.keys(d.filas).length} municipios</div></div>
        <div class="kpi"><div class="v">${pct(f.t / d.totT)}</div><div class="l">de la producción nacional<br>${fe && fe.prod > 0 ? pct(f.t / fe.prod) + " de su estado" : ""}</div></div>
        <div class="kpi"><div class="v">${f.ha > 0 ? f.rend.toFixed(1) + " t/ha" : "—"}</div><div class="l">Rendimiento · ${f.ha > 0 ? pct(f.rend / d.rendNacional) + " del promedio nacional" : ""}<br>${fmt(f.ha)} ha cosechadas</div></div>
        <div class="kpi"><div class="v">${f.valor >= 1e9 ? "$" + (f.valor / 1e9).toFixed(2) + " mil M" : "$" + fmtP(f.valor)}</div><div class="l">Valor de la producción (MXN)</div></div>
        <div class="kpi destacado"><div class="v">${pob ? (auto >= 1 ? "Se autoabastece" : "No se autoabastece") + " · " + etiqueta(auto) : "—"}</div>
          <div class="l">Su producción alcanza para <b>${fmtP(f.t * 1000 / res.pc)}</b> personas${pob ? ` (su población: ${fmtP(pob)})` : ""}.</div></div>
      </div>` : `<div class="nota">No registra producción de ${res.producto.nombre.toLowerCase()} en el SIAP ${window.PRODUCCION_MUNICIPAL?.anio ?? ""}.
        Su demanda local estimada es de ${fmtT(dem)} al año, que se abastece desde otros municipios.</div>`}
      <h3>Portafolio de ${nombreMun(cve)}</h3>
      <table>
        <tr><th>Producto</th><th class="num">Producción</th><th class="num">Demanda</th><th class="num">Cobertura</th><th class="num">Rend.</th></tr>
        ${port.map(x => `<tr class="clic" data-prod="${x.clave}"><td>${x.nombre}</td><td class="num">${fmtT(x.t)}</td>
          <td class="num">${fmtT(x.dem)}</td><td class="num">${etiqueta(x.auto)}</td>
          <td class="num">${x.rendRel == null ? "—" : pct(x.rendRel)}</td></tr>`).join("")}
      </table>
      <p class="sub">Rend. = rendimiento del municipio respecto al promedio nacional del cultivo. Brechas de rendimiento
      grandes señalan potencial de mejora (tecnificación, riego, asistencia técnica).</p>`;
  }

  // Resumen de una línea de la tabla de municipios
  function topResumen(res, esc) {
    if (!window.PRODUCCION_MUNICIPAL?.productos?.[res.clave]) return "";
    const n = Object.keys(datos(res.clave, esc, res.pc).filas).length;
    const top10 = ranking(res, esc, 10).reduce((s, f) => s + f.share, 0);
    return `${fmt(n)} municipios producen; los 10 primeros suman ${pct(top10)}`;
  }

  window.Municipal = { crear, topHTML, topResumen, detalleHTML, cargarGeo, nombreMun, disponible: () => !!window.PRODUCCION_MUNICIPAL };
})();

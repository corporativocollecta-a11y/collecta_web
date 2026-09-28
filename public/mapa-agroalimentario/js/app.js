// ============================================================================
// Interfaz: mapa, panel de balance, detalle por entidad y simulador
// ============================================================================
(function () {
  const fmt = n => Math.round(n).toLocaleString("es-MX");
  const fmtT = t => t >= 1e6 ? (t / 1e6).toFixed(2) + " Mt" : t >= 1e3 ? fmt(t / 1e3) + " mil t" : fmt(t) + " t";
  const fmtP = n => n >= 1e6 ? (n / 1e6).toFixed(1) + " M" : fmt(n);
  const pct = x => (x * 100).toFixed(0) + "%";
  const mxn = n => "$" + n.toFixed(2);
  const mxnGrande = n => n >= 1e9 ? "$" + (n / 1e9).toFixed(2) + " mil M" : "$" + (n / 1e6).toFixed(0) + " M";

  const estado = {
    producto: "jitomate",
    entidad: "25",
    region: "mx",          // "mx" | "latam"
    pais: null,            // código M49 del país seleccionado en la vista LATAM
    metricaLatam: "auto",
    paisSub: null,         // país de la vista por regiones (código de window.SUBNACIONAL)
    regionSub: null,       // región seleccionada en esa vista
    metricaSub: "auto",
    nivel: "estatal",      // "estatal" | "municipal"
    municipio: null,       // CVEGEO seleccionado
    metricaMun: "produccion",
    escenarios: {} // por producto
  };
  const escenario = () => (estado.escenarios[estado.producto] ??= {
    factorProd: {}, factorExport: 1, factorProdNacional: 1,
    tarifa: 2.2, mermaPor1000: 4, margenCentral: 20, ruta: "directo"
  });
  let res = null;

  // ---------- Mapa ----------
  const mapa = L.map("mapa", { zoomSnap: 0.25, zoomControl: false });
  L.control.zoom({ position: "bottomright" }).addTo(mapa);
  const MEXICO = [[14.5, -117.5], [32.8, -86.5]];
  const LATINOAMERICA = [[-55, -126], [41, -24]];
  const MUNDO = [[-48, -160], [68, 170]];
  // Encuadre que deja libre el espacio de los paneles flotantes en pantallas anchas
  function encuadrar() {
    const ancho = window.innerWidth > 900;
    const css = getComputedStyle(document.documentElement);
    const izq = ancho ? parseFloat(css.getPropertyValue("--ancho-catalogo")) + 28 : 10;
    const der = ancho ? parseFloat(css.getPropertyValue("--ancho-panel")) + 28 : 10;
    mapa.stop();
    mapa.fitBounds(estado.region === "latam" ? LATINOAMERICA : estado.region === "global" ? MUNDO : estado.region === "sub" ? Subnacional.datos().limites : MEXICO, { paddingTopLeft: [izq, ancho ? 60 : 10], paddingBottomRight: [der, 10], animate: false });
  }
  encuadrar();
  let anchoPrevio = window.innerWidth > 900;
  new ResizeObserver(() => {
    mapa.invalidateSize();
    const ancho = window.innerWidth > 900;
    if (ancho !== anchoPrevio) { anchoPrevio = ancho; encuadrar(); }
  }).observe(document.getElementById("mapa"));

  // Mapa base claro u oscuro según el tema
  const BASES = {
    claro: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    oscuro: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
  };
  const temaOscuro = () => {
    const t = document.documentElement.dataset.theme;
    return t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  };
  const nuevaBase = () => L.tileLayer(temaOscuro() ? BASES.oscuro : BASES.claro, {
    attribution: "Esri, HERE, Garmin, © OpenStreetMap", maxZoom: 12
  }).addTo(mapa).bringToBack();
  // Versión publicada (window.MAPA_VECTORIAL): sin mosaicos externos; contornos de Natural Earth incluidos con la página
  let capaBase = window.MAPA_VECTORIAL ? null : nuevaBase();
  let capaVectorial = null;
  const estiloBase = () => {
    const c = getComputedStyle(document.documentElement);
    return { color: c.getPropertyValue("--linea").trim(), weight: 0.8, fillColor: c.getPropertyValue("--papel-2").trim(), fillOpacity: 1 };
  };
  async function cargarBaseVectorial() {
    if (!window.MAPA_VECTORIAL || !window.topojson) return;
    mapa.createPane("base");
    mapa.getPane("base").style.zIndex = 250;
    mapa.attributionControl.addAttribution("Contornos: Natural Earth");
    const [paisesTopo, euaTopo] = await Promise.all([
      fetch("data/base/paises-50m.json").then(r => r.json()),
      fetch("data/base/eua-estados-10m.json").then(r => r.json())
    ]);
    const paises = L.geoJSON(topojson.feature(paisesTopo, paisesTopo.objects.countries), { pane: "base", interactive: false, style: estiloBase });
    const estados = L.geoJSON(topojson.mesh(euaTopo, euaTopo.objects.states, (a, b) => a !== b), {
      pane: "base", interactive: false, style: () => ({ ...estiloBase(), fill: false, weight: 0.5 })
    });
    capaVectorial = L.layerGroup([paises, estados]).addTo(mapa);
  }
  cargarBaseVectorial();
  // Se reemplaza la capa en vez de usar setUrl: con zoom fraccionario, setUrl pide mosaicos con zoom no entero
  const actualizarBase = () => {
    if (capaVectorial) {
      capaVectorial.eachLayer(g => g.setStyle(f => g === capaVectorial.getLayers()[0] ? estiloBase() : { ...estiloBase(), fill: false, weight: 0.5 }));
      return;
    }
    if (capaBase) capaBase.remove();
    capaBase = nuevaBase();
  };
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", actualizarBase);
  const capaFlujos = L.layerGroup().addTo(mapa);
  const capaBurbujas = L.layerGroup().addTo(mapa);
  const capaCentrales = L.layerGroup();

  window.CENTRALES.forEach(c => {
    L.marker([c.lat, c.lon], {
      icon: L.divIcon({ className: "", html: '<div style="width:14px;height:14px;background:#1f2a24;border:2px solid #fff;transform:rotate(45deg)"></div>' })
    }).bindTooltip(c.nombre).addTo(capaCentrales);
  });

  function colorAutosuf(r) {
    if (r <= 0.001) return "#cfcfcf";
    if (r < 0.5) return "#c0392b";
    if (r < 1) return "#f0a35e";
    if (r < 2) return "#a8d5a2";
    if (r < 10) return "#3fa05f";
    return "#145a32";
  }

  function dibujarLeyenda() {
    const rangos = [["Sin producción relevante", 0], ["< 50% de su demanda", 0.3], ["50–99%", 0.7],
      ["Autosuficiente (1–2×)", 1.5], ["Excedentario (2–10×)", 5], ["Gran abastecedor (>10×)", 20]];
    document.getElementById("leyenda").innerHTML =
      `<h4>Autosuficiencia: ${res.producto.nombre}</h4>` +
      rangos.map(([t, v]) => `<div class="fila"><span class="sw" style="background:${colorAutosuf(v)}"></span>${t}</div>`).join("") +
      `<div class="fila" style="margin-top:6px;color:#5f6b64">Tamaño = volumen producido</div>` +
      (document.getElementById("verRed").checked && Precios.disponible(res.clave) ? capaPrecios.leyendaHTML() : "");
  }

  const capaPrecios = Precios.crearCapa(mapa);
  const capaMunicipal = Municipal.crear(mapa, {
    escenario, metrica: () => estado.metricaMun, seleccionado: () => estado.municipio,
    nombreProducto: () => res.producto.nombre,
    alSeleccionar: cve => { seleccionarMunicipio(cve); }
  });

  function seleccionarMunicipio(cve, enfocar = false) {
    estado.municipio = cve; estado.entidad = cve.slice(0, 2);
    activarTab("entidad"); dibujarMapa(); renderBalance(); renderEntidad();
    if (enfocar) capaMunicipal.enfocar(cve);
  }

  const capaLatam = Latam.crearCapa(mapa);
  const capaComercio = Latam.crearCapaComercio(mapa);
  const capaSub = Subnacional.crearCapa(mapa);

  function dibujarMapa() {
    capaBurbujas.clearLayers();
    capaFlujos.clearLayers();
    if (estado.region === "sub") {
      capaPrecios.ocultar(); capaMunicipal.ocultar(); capaCentrales.remove(); capaLatam.ocultar(); capaComercio.ocultar();
      const R = Subnacional.calcular(estado.producto);
      capaSub.dibujar(R, estado.metricaSub, estado.regionSub, document.getElementById("verImportSub").checked,
        Subnacional.meta(estado.producto).color, id => { estado.regionSub = id; activarTab("entidad"); dibujarMapa(); renderRegionSub(); });
      capaSub.mostrar();
      document.getElementById("leyenda").innerHTML = Subnacional.leyendaHTML(estado.metricaSub, Subnacional.nombre(estado.producto));
      return;
    }
    capaSub.ocultar();
    if (estado.region !== "mx") {
      capaPrecios.ocultar(); capaMunicipal.ocultar(); capaCentrales.remove();
      const R = Latam.calcular(estado.producto);
      capaLatam.dibujar(R, estado.metricaLatam, estado.pais, id => { estado.pais = id; activarTab("entidad"); dibujarMapa(); renderPaisLatam(); });
      capaLatam.mostrar();
      if (Latam.comercioDisponible() && document.getElementById("verRutas").checked) {
        capaComercio.dibujar(estado.producto, window.PRODUCTOS[estado.producto].color, estado.pais);
        capaComercio.mostrar();
      } else capaComercio.ocultar();
      document.getElementById("leyenda").innerHTML = Latam.leyendaHTML(R, estado.metricaLatam, Latam.nombre(estado.producto));
      return;
    }
    capaLatam.ocultar();
    capaComercio.ocultar();
    capaPrecios.ocultar();
    if (estado.nivel === "municipal") {
      const aviso = document.getElementById("cargandoMun");
      const primeraCarga = !window.MUNICIPIOS_GEO;
      if (primeraCarga) aviso.hidden = false;
      capaMunicipal.mostrar(res)
        .then(() => { if (primeraCarga) renderBalance(); }) // los nombres de municipio llegan con los polígonos
        .catch(e => { aviso.textContent = e.message; })
        .finally(() => { if (window.MUNICIPIOS_GEO) aviso.hidden = true; });
      return;
    }
    capaMunicipal.ocultar();
    if (document.getElementById("verRed").checked && Precios.disponible(res.clave)) {
      capaPrecios.dibujar(res); capaPrecios.mostrar();
    }
    const maxProd = Math.max(...res.filas.map(f => f.prod));
    const verFlujos = document.getElementById("verFlujos").checked;
    const verImport = document.getElementById("verImport").checked;
    const viaCentral = escenario().ruta === "centrales";

    if (verFlujos) {
      const maxT = Math.max(...res.flujos.map(f => f.t), 1);
      res.flujos
        .filter(fl => fl.t > maxT * 0.01 && (verImport || !fl.importado))
        .forEach(fl => {
          const pts = viaCentral && !fl.importado
            ? [[fl.origen.lat, fl.origen.lon], [fl.central.lat, fl.central.lon], [fl.destino.lat, fl.destino.lon]]
            : [[fl.origen.lat, fl.origen.lon], [fl.destino.lat, fl.destino.lon]];
          L.polyline(pts, {
            color: fl.importado ? "#7b4fa0" : res.producto.color,
            weight: 1 + 9 * Math.sqrt(fl.t / maxT), opacity: 0.55,
            dashArray: fl.importado ? "6 6" : null
          }).bindTooltip(`${fl.origen.nombre} → ${fl.destino.nombre}<br><b>${fmtT(fl.t)}</b> (${fmt(fl.kmDirecto)} km)${fl.importado ? "<br>Importación" : ""}`)
            .addTo(capaFlujos);
        });
    }

    res.filas.forEach(f => {
      const r = f.prod > 0 ? 4 + 34 * Math.sqrt(f.prod / maxProd) : 3;
      const m = L.circleMarker([f.lat, f.lon], {
        radius: r, color: f.id === estado.entidad ? "#111" : "#fff",
        weight: f.id === estado.entidad ? 3 : 1.2,
        fillColor: colorAutosuf(f.autosuf),
        fillOpacity: document.getElementById("verRed").checked && Precios.disponible(res.clave) ? 0.35 : 0.85
      });
      m.bindTooltip(`<b>${f.nombre}</b><br>Producción: ${fmtT(f.prod)}${f.estimado ? " (est.)" : ""}<br>
        Demanda local: ${fmtT(f.demanda)}<br>Autosuficiencia: ${f.autosuf >= 10 ? f.autosuf.toFixed(0) + "×" : pct(f.autosuf)}<br>
        Abastece a ${fmtP(f.personas)} personas`);
      m.on("click", () => { estado.entidad = f.id; estado.municipio = null; activarTab("entidad"); render(); });
      m.addTo(capaBurbujas);
    });
    dibujarLeyenda();
  }

  // ---------- Panel: Balance nacional ----------
  function renderBalance() {
    const n = res.nacional, p = res.producto;
    const top = [...res.filas].sort((a, b) => b.prod - a.prod).slice(0, 12);
    const nota = (p.nota ? `<div class="nota">${p.nota}</div>` : "") + (res.inconsistente
      ? `<div class="nota" style="border-color:#c0392b">⚠ La exportación ${p.fuenteComercio ? "oficial" : "preliminar"} (${fmtT(p.exportacion)})
         es mayor o casi igual a la producción ${p.fuente ?? ""} (${fmtT(p.nacional)}): las dos fuentes no cuadran
         (posible sub-registro de producción en invernadero, o diferencias de cobertura de la fracción arancelaria).
         Se usa el consumo per cápita de referencia y la exportación del modelo se limita al excedente.</div>` : "") + notaConsumo(res);
    const fuente = (p.fuente ? `<span class="tag ok">Producción: ${p.fuente}</span> ` : `<span class="tag def">Producción preliminar</span> `) +
      (p.fuenteComercio ? `<span class="tag ok">Comercio: ${p.fuenteComercio}</span> ` : `<span class="tag def">Comercio preliminar</span> `);
    const pctFino = s => (s < 0.01 || s > 0.99) && s < 1 ? (s * 100).toFixed(1) + "%" : pct(s);
    const barras = obj => Object.entries(obj).map(([pais, s]) =>
      `<div class="barra-h"><span class="n">${pais}</span><span class="b"><i style="width:${s * 100}%"></i></span><span class="x">${pctFino(s)}</span></div>`).join("");
    const usd = v => v >= 1e9 ? `US$${(v / 1e9).toFixed(2)} mil M` : v >= 1e6 ? `US$${fmt(v / 1e6)} M` : `US$${fmt(v / 1e3)} mil`;
    document.getElementById("tab-balance").innerHTML = `
      <h2>${p.nombre}</h2>
      <p class="sub">${fuente}${p.consumoOficial ? `<span class="tag ok">Consumo: Panorama SIAP ${window.CONSUMO_OFICIAL.publicacion}</span> ` : ""}${p.tipo}
        · consumo usado: <b>${res.pc.toFixed(1)} kg/persona/año</b>
        ${escenario().consumoPC != null ? "(escenario)" : res.base === "oficial" && p.consumoOficial ? `(oficial, Panorama p. ${p.paginaPanorama})` : res.inconsistente ? "(referencia)" : "(consumo aparente " + (window.POBLACION_CONAPO?.anio ?? "") + ")"}
        · población ${fmtP(n.pobTotal)}${window.POBLACION_CONAPO ? ` (CONAPO ${window.POBLACION_CONAPO.anio})` : " (Censo 2020)"}</p>
      <div class="kpis">
        <div class="kpi"><div class="v">${fmtT(n.produccion)}</div><div class="l">Producción nacional</div></div>
        <div class="kpi"><div class="v">${fmtT(n.demanda)}</div><div class="l">Consumo nacional estimado</div></div>
        <div class="kpi"><div class="v">${fmtT(p.exportacion)}</div><div class="l">Exportación ${p.fuenteComercio ? "oficial" : "(preliminar)"}${p.valorExportUSD ? ` · ${usd(p.valorExportUSD)}` : ""}${
          n.exportacion < p.exportacion * 0.99 ? `<br>modelo: ${fmtT(n.exportacion)} (limitada al excedente)` : ""}</div></div>
        <div class="kpi ${n.importacionModelo > n.demanda * 0.05 ? "alerta" : ""}"><div class="v">${fmtT(n.importacionReportada)}</div><div class="l">Importación ${p.fuenteComercio ? "oficial" : "(preliminar)"}${p.valorImportUSD ? ` · ${usd(p.valorImportUSD)}` : ""}<br>${n.importacionModelo > n.importacionReportada * 1.5 + 1000 ? "faltante para cubrir el consumo usado" : "necesaria según modelo"}: ${fmtT(n.importacionModelo)}</div></div>
        <div class="kpi destacado"><div class="v">${pct(n.autosuficiencia)}</div>
          <div class="l">Autosuficiencia nacional. La producción alcanzaría para <b>${fmtP(n.personasProduccion)}</b> de personas
          (población: ${fmtP(n.pobTotal)}); después de exportar alcanza para <b>${fmtP(n.personasTrasExport)}</b>.</div></div>
      </div>
      ${nota}
      ${Precios.balanceHTML(res)}
      ${Estacionalidad.balanceHTML(res, escenario())}
      <h3>Destino de las exportaciones (por volumen)</h3>
      ${barras(p.destinos)}
      ${p.origenes && Object.keys(p.origenes).length ? `<h3>Origen de las importaciones</h3>${barras(p.origenes)}` : ""}
      ${p.fracciones ? `<p class="sub">Fracciones arancelarias (SA): ${p.fracciones.join(", ")}</p>` : ""}
      <h3>Principales entidades productoras</h3>
      <table>
        <tr><th>Entidad</th><th class="num">Producción</th><th class="num">Abastece a</th><th class="num">Veces su población</th></tr>
        ${top.map(f => `<tr class="clic" data-id="${f.id}"><td>${f.nombre}${f.estimado ? ' <span class="est">(est.)</span>' : ""}</td>
          <td class="num">${fmtT(f.prod)}</td><td class="num">${fmtP(f.personas)}</td>
          <td class="num">${etiqueta(f.autosuf)}</td></tr>`).join("")}
      </table>
      <p class="sub" style="margin-top:10px">${n.entidadesAutosuf} de 32 entidades cubren su propia demanda.
      Excedente sin mercado asignado (industria, merma o sub-registro): ${fmtT(n.excedenteSinMercado)}.</p>
      ${Municipal.topHTML(res, escenario())}`;
    enlazarFilas("#tab-balance");
    const esc_ = document.getElementById("sEscalon");
    if (esc_) esc_.onchange = () => { escenario().escalonamiento = +esc_.value; renderBalance(); };
    document.querySelectorAll("#tab-balance tr.mun").forEach(tr => tr.onclick = () => {
      cambiarNivel("municipal");
      seleccionarMunicipio(tr.dataset.cve, true);
    });
  }

  function cambiarNivel(nivel) {
    estado.nivel = nivel;
    document.querySelector(`input[name=nivel][value=${nivel}]`).checked = true;
    document.getElementById("ctrlEstatal").hidden = nivel !== "estatal";
    document.getElementById("ctrlMunicipal").hidden = nivel !== "municipal";
    if (nivel === "estatal") estado.municipio = null;
  }

  // Contraste entre consumo oficial (año de datos del Panorama) y disponibilidad aparente del año analizado
  function notaConsumo(res) {
    const p = res.producto;
    if (!p.consumoOficial || res.pcAparente <= 0) return "";
    const brecha = res.pcAparente / p.consumoPC - 1;
    if (Math.abs(brecha) < 0.15) return `<p class="sub">El consumo oficial (${p.consumoPC} kg, datos ${window.CONSUMO_OFICIAL.anioDatos}) coincide con la
      disponibilidad aparente ${window.POBLACION_CONAPO?.anio ?? ""} (${res.pcAparente.toFixed(1)} kg): balance consistente.</p>`;
    const cambioProd = p.produccionRef ? p.nacional / p.produccionRef - 1 : null;
    return `<div class="nota" style="border-color:#e67e22"><b>Consumo oficial vs. disponibilidad ${window.POBLACION_CONAPO?.anio ?? ""}:</b>
      el Panorama reporta ${p.consumoPC} kg por persona (datos ${window.CONSUMO_OFICIAL.anioDatos}), pero con la producción y el comercio
      ${window.POBLACION_CONAPO?.anio ?? ""} la disponibilidad interna alcanza para <b>${res.pcAparente.toFixed(1)} kg</b> (${brecha > 0 ? "+" : ""}${pct(brecha)}).
      ${cambioProd != null ? `La producción pasó de ${fmtT(p.produccionRef)} (${window.CONSUMO_OFICIAL.anioDatos}) a ${fmtT(p.nacional)} (${cambioProd > 0 ? "+" : ""}${pct(cambioProd)}).` : ""}
      ${brecha < 0 ? "Con el consumo oficial, el modelo muestra un faltante que no se cubrió con importaciones: el mercado interno recibió menos producto." : "Hay más producto disponible que el consumo oficial: excedente para merma, industria o inventario."}
      Cambia la base en <i>Simulador</i>.</div>`;
  }

  function etiqueta(r) {
    if (r < 1) return `<span class="tag def">${pct(r)}</span>`;
    if (r < 2) return `<span class="tag ok">${r.toFixed(1)}×</span>`;
    return `<span class="tag exc">${r >= 10 ? r.toFixed(0) : r.toFixed(1)}×</span>`;
  }

  function enlazarFilas(sel) {
    document.querySelectorAll(`${sel} tr.clic[data-id]`).forEach(tr => tr.onclick = () => {
      estado.entidad = tr.dataset.id; estado.municipio = null; activarTab("entidad"); render();
    });
  }

  // ---------- Panel: Entidad ----------
  function renderEntidad() {
    if (estado.municipio) return renderMunicipio();
    const f = res.filas.find(x => x.id === estado.entidad);
    const recibe = res.flujos.filter(fl => fl.destino.id === f.id).sort((a, b) => b.t - a.t);
    const envia = res.flujos.filter(fl => fl.origen.id === f.id).sort((a, b) => b.t - a.t);
    const esc = escenario();

    // Portafolio: todos los productos para esta entidad (con escenario de cada uno)
    const portafolio = Object.keys(window.PRODUCTOS).map(k => {
      const r = k === estado.producto ? res : Modelo.calcular(k, estado.escenarios[k] ?? {});
      const fila = r.filas.find(x => x.id === f.id);
      return { ...fila, k, nombre: r.producto.nombre };
    }).sort((a, b) => b.autosuf - a.autosuf);

    document.getElementById("tab-entidad").innerHTML = `
      <h2>${f.nombre}</h2>
      <p class="sub">Población ${fmt(f.pob)}${window.POBLACION_CONAPO ? ` (CONAPO ${window.POBLACION_CONAPO.anio})` : ""} · ${res.producto.nombre}${f.estimado ? " · producción estimada (entidad no desglosada)" : ""}</p>
      <div class="kpis">
        <div class="kpi"><div class="v">${fmtT(f.prod)}</div><div class="l">Producción</div></div>
        <div class="kpi"><div class="v">${fmtT(f.demanda)}</div><div class="l">Demanda propia</div></div>
        <div class="kpi destacado"><div class="v">${f.autosuf >= 1 ? "Sí se autoabastece" : "No se autoabastece"} · ${etiqueta(f.autosuf)}</div>
          <div class="l">Su producción alcanza para <b>${fmtP(f.personas)}</b> personas: ${f.autosuf >= 1
            ? `cubre a su población y a <b>${fmtP(f.personas - f.pob)}</b> mexicanos más (o mercado de exportación).`
            : `le faltan <b>${fmtT(f.deficit)}</b> para cubrir a su población.`}</div></div>
        <div class="kpi"><div class="v">${fmtT(f.exporta)}</div><div class="l">Aporte estimado a exportación</div></div>
        <div class="kpi"><div class="v">${fmtT(f.envia)}</div><div class="l">Envía a otras entidades</div></div>
      </div>
      ${recibe.length ? `<h3>Quién la abastece (modelo)</h3>
        ${recibe.slice(0, 8).map(fl => barra(fl.origen.nombre, fl.t, f.deficit)).join("")}` : ""}
      ${envia.length ? `<h3>A dónde envía su excedente (modelo)</h3>
        ${envia.slice(0, 8).map(fl => barra(fl.destino.nombre, fl.t, f.envia)).join("")}` : ""}
      ${Precios.entidadHTML(res, f.id)}
      <div class="ctrl">
        <label>Escenario: variación de producción en ${f.abr} <b id="lblFactor">${pctVar(esc.factorProd[f.id] ?? 1)}</b></label>
        <input type="range" id="rngFactor" min="0" max="2" step="0.05" value="${esc.factorProd[f.id] ?? 1}">
        <p class="sub">Simula sequía, helada, plaga (−) o expansión de superficie / tecnificación (+).</p>
      </div>
      <h3>Portafolio de ${f.nombre}: ¿de qué se autoabastece?</h3>
      <table>
        <tr><th>Producto</th><th class="num">Producción</th><th class="num">Demanda</th><th class="num">Cobertura</th></tr>
        ${portafolio.map(x => `<tr class="clic" data-prod="${x.k}"><td>${x.nombre}${x.estimado ? ' <span class="est">(est.)</span>' : ""}</td>
          <td class="num">${fmtT(x.prod)}</td><td class="num">${fmtT(x.demanda)}</td><td class="num">${etiqueta(x.autosuf)}</td></tr>`).join("")}
      </table>`;

    document.getElementById("rngFactor").oninput = e => {
      esc.factorProd[f.id] = parseFloat(e.target.value);
      document.getElementById("lblFactor").textContent = pctVar(esc.factorProd[f.id]);
      recalcular(); dibujarMapa(); renderBalance(); renderSimulador();
    };
    document.getElementById("rngFactor").onchange = () => renderEntidad();
    document.querySelectorAll("#tab-entidad tr.clic").forEach(tr => tr.onclick = () => seleccionarProducto(tr.dataset.prod));
  }

  function renderMunicipio() {
    const cont = document.getElementById("tab-entidad");
    const pintar = () => {
      const portafolio = Object.keys(window.PRODUCTOS).map(k => {
        const e = estado.escenarios[k] ?? {};
        const r = k === estado.producto ? res : Modelo.calcular(k, e);
        return { clave: k, nombre: r.producto.nombre, pc: r.pc, esc: e };
      });
      cont.innerHTML = Municipal.detalleHTML(estado.municipio, res, escenario(), portafolio);
      document.getElementById("volverEstado").onclick = ev => {
        ev.preventDefault(); estado.municipio = null; dibujarMapa(); renderEntidad();
      };
      cont.querySelectorAll("tr.clic[data-prod]").forEach(tr => tr.onclick = () => seleccionarProducto(tr.dataset.prod));
    };
    // La población municipal viene con los polígonos: se cargan si aún no están
    if (window.MUNICIPIOS_GEO) pintar();
    else { cont.innerHTML = '<p class="sub">Cargando municipios…</p>'; Municipal.cargarGeo().then(pintar); }
  }

  const pctVar = f => (f >= 1 ? "+" : "") + Math.round((f - 1) * 100) + "%";
  const barra = (n, t, tot) => `<div class="barra-h"><span class="n">${n}</span><span class="b"><i style="width:${Math.min(100, t / (tot || 1) * 100)}%"></i></span><span class="x">${fmtT(t)}</span></div>`;

  // ---------- Panel: Simulador ----------
  function renderSimulador() {
    const esc = escenario(), L_ = res.logistica, p = res.producto;
    const ctrl = (id, txt, min, max, step, val, fmtV) =>
      `<div class="ctrl"><label>${txt} <b id="v-${id}">${fmtV(val)}</b></label>
       <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
    const precioDir = p.precioRural + L_.directo.costoKg;
    const precioCen = p.precioRural + L_.centrales.costoKg;
    const sniim = Precios.disponible(res.clave) ? window.PRECIOS_SNIIM.productos[res.clave] : null;

    // Cadena de precio observada: rural (SIAP) + transporte (modelo) + intermediación = mayoreo (SNIIM)
    //                             + margen minorista = precio al consumidor (PROFECO)
    const cons = window.PRECIOS_CONSUMIDOR?.productos?.[res.clave] ?? null;
    let cadena = "";
    if (sniim) {
      const reduccion = (esc.reduccionIntermediacion ?? 0) / 100;
      const redMin = (esc.reduccionMinorista ?? 0) / 100;
      const transpActual = L_.centrales.transporteKg;
      const transpNuevo = esc.ruta === "directo" ? L_.directo.transporteKg : transpActual;
      const intermediacion = Math.max(0, sniim.precio - p.precioRural - transpActual);
      const menudeo = cons ? Math.max(0, cons.precio - sniim.precio) : 0;
      const finalHoy = cons ? Math.max(cons.precio, sniim.precio) : sniim.precio;
      const nuevo = p.precioRural + transpNuevo + intermediacion * (1 - reduccion) + menudeo * (1 - redMin);
      const ahorroKg = finalHoy - nuevo;
      // transporte: solo el volumen que se mueve entre entidades; márgenes: todo el consumo nacional
      const ahorroAnual = ((transpActual - transpNuevo) * L_.toneladasMovidas
        + (intermediacion * reduccion + menudeo * redMin) * res.nacional.demanda) * 1000;
      const barra = (etq, partes, total) => `<div class="cadena"><span class="n">${etq}</span><span class="b">${partes.map(([v, c, t]) =>
        `<i style="width:${v / finalHoy * 100}%;background:${c}" title="${t}: ${mxn(v)}"></i>`).join("")}</span><span class="x">${mxn(total)}</span></div>`;
      const seg = (r, tr, im, me) => [[r, "#3a8f4a", "Productor (SIAP)"], [tr, "#e9b949", "Transporte y merma (modelo)"],
        [im, "#c0392b", "Acopio, intermediación y margen mayorista"], [me, "#7b4fa0", "Margen minorista"]];
      cadena = `
        <h3>Cadena de precio: productor → ${cons ? "consumidor" : "central de abasto"}</h3>
        ${barra("Hoy (observado)", seg(p.precioRural, transpActual, intermediacion, menudeo), finalHoy)}
        ${barra("Escenario", seg(p.precioRural, transpNuevo, intermediacion * (1 - reduccion), menudeo * (1 - redMin)), nuevo)}
        <div class="leyenda-cadena"><span><i style="background:#3a8f4a"></i>Productor ${mxn(p.precioRural)} (${pct(p.precioRural / finalHoy)})</span>
          <span><i style="background:#e9b949"></i>Transporte ${mxn(transpActual)}</span>
          <span><i style="background:#c0392b"></i>Intermediación ${mxn(intermediacion)}</span>
          ${cons ? `<span><i style="background:#7b4fa0"></i>Minorista ${mxn(menudeo)}</span>` : ""}</div>
        ${cons ? `<p class="sub">De cada $100 que paga el consumidor, el productor recibe <b>$${(p.precioRural / finalHoy * 100).toFixed(0)}</b>.
          Mayoreo SNIIM ${mxn(sniim.precio)} · consumidor PROFECO ${mxn(cons.precio)} (mediana ${window.PRECIOS_CONSUMIDOR.anio}).</p>` : ""}
        ${ctrl("sInterm", "Reducción de la intermediación mayorista (compra directa, centros de acopio, cooperativas)", 0, 80, 5, esc.reduccionIntermediacion ?? 0, v => v + "%")}
        ${cons ? ctrl("sMinor", "Reducción del margen minorista (mercados sobre ruedas, venta directa, canales cortos)", 0, 80, 5, esc.reduccionMinorista ?? 0, v => v + "%") : ""}
        <div class="nota">Con ${esc.ruta === "directo" ? "ruta directa región → región, " : ""}${pct(reduccion)} menos intermediación mayorista${cons ? ` y ${pct(redMin)} menos margen minorista` : ""},
          el precio ${cons ? "al consumidor" : "de mayoreo"} pasaría de <b>${mxn(finalHoy)}</b> a <b>${mxn(nuevo)}/kg</b>:
          ahorro de <b>${mxn(ahorroKg)}/kg</b> (${pct(ahorroKg / finalHoy)}), ≈ <b>${mxnGrande(Math.max(0, ahorroAnual))}</b> al año
          sobre el consumo nacional. El productor mantiene su precio; parte del ahorro podría destinarse a pagarle mejor.</div>`;
    }

    document.getElementById("tab-simulador").innerHTML = `
      <h2>Simulador de abasto y logística</h2>
      <p class="sub">${p.nombre}: modifica supuestos y compara la ruta vía centrales de abasto contra una distribución directa región-región.</p>
      <h3>Oferta y demanda</h3>
      ${p.consumoOficial ? `<div class="ctrl"><label>Base de consumo</label>
        <select id="sBase"><option value="oficial" ${res.base === "oficial" ? "selected" : ""}>Oficial: Panorama SIAP ${window.CONSUMO_OFICIAL.publicacion} (${p.consumoPC} kg, datos ${window.CONSUMO_OFICIAL.anioDatos})</option>
        <option value="aparente" ${res.base === "aparente" ? "selected" : ""}>Aparente ${window.POBLACION_CONAPO?.anio ?? ""}: producción − exportación + importación (${res.pcAparente.toFixed(1)} kg)</option></select></div>` : ""}
      ${ctrl("sConsumo", "Consumo per cápita (kg/año)", 0.5, Math.ceil(Math.max(p.consumoPC, res.pc) * 2.5), 0.1, res.pc.toFixed(1), v => (+v).toFixed(1))}
      ${ctrl("sProdNac", "Producción nacional (variación)", 0.5, 1.5, 0.05, esc.factorProdNacional, pctVar)}
      ${ctrl("sExport", "Exportaciones (variación)", 0, 2, 0.05, esc.factorExport, pctVar)}
      <h3>Costos logísticos</h3>
      ${ctrl("sTarifa", "Flete (MXN por tonelada-km)", 0.8, 5, 0.1, esc.tarifa, v => "$" + (+v).toFixed(2))}
      ${ctrl("sMerma", "Merma por cada 1,000 km (%)", 0, 15, 0.5, esc.mermaPor1000, v => (+v).toFixed(1) + "%")}
      ${sniim ? "" : ctrl("sMargen", "Sobreprecio por intermediación en central (% del precio rural)", 0, 80, 5, esc.margenCentral, v => v + "%")}
      <div class="ctrl"><label>Ruta mostrada en el mapa</label>
        <select id="sRuta"><option value="directo" ${esc.ruta === "directo" ? "selected" : ""}>Directa región → región</option>
        <option value="centrales" ${esc.ruta === "centrales" ? "selected" : ""}>Vía central de abasto más cercana al destino</option></select></div>
      ${cadena}
      <h3>Logística (${fmtT(L_.toneladasMovidas)} movidas entre entidades e importación)</h3>
      <div class="comparativo">
        <div class="kpi"><h4>Vía centrales de abasto</h4>
          <div><span>Distancia media</span><b>${fmt(L_.centrales.km)} km</b></div>
          <div><span>Flete total</span><b>${mxnGrande(L_.centrales.costo)}</b></div>
          <div><span>Merma</span><b>${fmtT(L_.centrales.merma)}</b></div>
          <div><span>Transporte + merma/kg</span><b>${mxn(L_.centrales.transporteKg)}</b></div>
          ${sniim ? "" : `<div><span>Precio llegada est.</span><b>${mxn(precioCen)}</b></div>`}</div>
        <div class="kpi destacado" style="grid-column:auto"><h4>Directa región → región</h4>
          <div><span>Distancia media</span><b>${fmt(L_.directo.km)} km</b></div>
          <div><span>Flete total</span><b>${mxnGrande(L_.directo.costo)}</b></div>
          <div><span>Merma</span><b>${fmtT(L_.directo.merma)}</b></div>
          <div><span>Transporte + merma/kg</span><b>${mxn(L_.directo.transporteKg)}</b></div>
          ${sniim ? "" : `<div><span>Precio llegada est.</span><b>${mxn(precioDir)}</b></div>`}</div>
      </div>
      ${sniim ? `<p class="sub">Solo transporte: la ruta directa ahorra ${mxn(L_.centrales.transporteKg - L_.directo.transporteKg)}/kg
        frente a pasar por la central más cercana al destino. El componente mayor del precio suele ser la intermediación (arriba).</p>`
      : `<div class="nota">Ahorro potencial: <b>${mxn(L_.ahorroKg)} por kg</b> (${pct(L_.ahorroKg / precioCen)} del precio de llegada) ·
        <b>${mxnGrande(L_.ahorroTotal)}</b> al año en ${p.nombre.toLowerCase()} movido internamente.</div>`}
      <button class="btn" id="sReset">Restablecer escenario</button>
      <p class="sub" style="margin-top:12px">Modelo simplificado: asignación de costo mínimo por distancia (no considera estacionalidad,
      capacidad de carreteras, cadena de frío ni contratos existentes). Sirve para comparar escenarios, no como pronóstico.</p>`;

    const enlazar = (id, campo, parse = parseFloat) => {
      const el = document.getElementById(id);
      if (!el) return; // control no disponible para este producto (falta alguna fuente)
      el.oninput = () => {
        esc[campo] = parse(el.value);
        recalcular(); dibujarMapa(); renderBalance();
        // actualizar solo resultados sin perder el foco del slider
        const valor = document.getElementById("v-" + id);
        if (valor) valor.textContent = el.value;
      };
      el.onchange = () => renderSimulador();
    };
    enlazar("sConsumo", "consumoPC");
    enlazar("sProdNac", "factorProdNacional");
    enlazar("sExport", "factorExport");
    enlazar("sTarifa", "tarifa");
    enlazar("sMerma", "mermaPor1000");
    if (sniim) enlazar("sInterm", "reduccionIntermediacion");
    if (sniim && cons) enlazar("sMinor", "reduccionMinorista");
    else enlazar("sMargen", "margenCentral");
    document.getElementById("sBase")?.addEventListener("change", e => {
      esc.baseConsumo = e.target.value; delete esc.consumoPC; render();
    });
    document.getElementById("sRuta").onchange = e => { esc.ruta = e.target.value; dibujarMapa(); renderSimulador(); };
    document.getElementById("sReset").onclick = () => { delete estado.escenarios[estado.producto]; render(); };
  }

  // ---------- Panel: Fuentes ----------
  function renderFuentes() {
    document.getElementById("tab-fuentes").innerHTML = `
      <h2>Fuentes y metodología</h2>
      <div class="nota"><b>Estado de los datos:</b> la producción por entidad y el precio medio rural provienen del SIAP (cierre agrícola municipal) cuando existe data/produccion_siap.js. Exportación, importación y países provienen de la estadística oficial de comercio exterior (INEGI/SE vía UN Comtrade). Los precios de mayoreo son del SNIIM y los precios al consumidor de PROFECO. El consumo per cápita es el del Panorama Agroalimentario del SIAP y la población, la proyección CONAPO del año analizado.
      Todas las cifras en uso provienen de fuentes oficiales; los scripts de <code>scripts/</code> permiten actualizarlas a otro año.</div>
      <h3>Fuentes oficiales integradas</h3>
      <ul class="fuentes">
        <li><b>SIAP – Cierre de la producción agrícola (municipal)</b>: superficie, volumen, rendimiento, precio medio rural y valor por cultivo, municipio, ciclo y modalidad. Datos abiertos: <a href="https://nube.agricultura.gob.mx/datosAbiertos/Agricola.php" target="_blank">nube.agricultura.gob.mx/datosAbiertos</a> (integrado: cierre 2025)</li>
        <li><b>SIAP – <a href="https://nube.agricultura.gob.mx/panorama_dgsiap/" target="_blank">Panorama Agroalimentario 2025</a></b> (datos 2024): consumo anual per cápita por producto (se indica la página de cada ficha), producción de referencia y <b>producción mensual nacional (%)</b>, extraída por posición de cada etiqueta de mes y validada (los 12 meses suman 100%).</li>
        <li><b>CONAPO – Proyecciones de población</b> (vía Data México): población 2025 por entidad. <b>INEGI – Censo 2020</b>: población municipal, escalada con el crecimiento de su entidad.</li>
        <li><b>Comercio exterior de México (INEGI/SE), vía <a href="https://comtradeplus.un.org/" target="_blank">UN Comtrade</a></b>: exportación e importación en toneladas y USD por país y fracción arancelaria (integrado: 2025, producto fresco).</li>
        <li><b>SNIIM – Precios de mercados nacionales</b>: precios de mayoreo en centrales de abasto (origen/destino).</li>
        <li><b>SNIIM (SE) – Mercados nacionales de frutas y hortalizas</b>: precio diario de mayoreo por variedad, estado de origen y central de abasto (integrado: 2025, 43 centrales, calidad primera). El origen es el punto de embarque reportado (p. ej. "CDMX" = reenvío desde la CEDA).</li>
        <li><b>PROFECO – <a href="https://datos.profeco.gob.mx/datos_abiertos/qqp.php" target="_blank">Quién es Quién en los Precios</a></b>: precio al público por producto, presentación, tipo de comercio y estado (integrado: 2025, ≈450 mil registros de frutas y hortalizas frescas a granel; mediana por kg). La muestra está dominada por supermercados (~90% de los registros); para chile y plátano se excluyen variedades que no están en la muestra de mayoreo (habanero, de árbol, macho, etc.).</li>
        <li><b>España</b> – selector <i>Ver país…</i>: producción 2025 por provincia (sumada por comunidad autónoma) de la estadística de superficies y producciones del MAPA (provisional; patata 2024), población del INE al 1 de enero de 2025 y comercio de FAOSTAT. Plátano de Canarias: producción de FAOSTAT.</li>
        <li><b>Italia</b> – selector <i>Ver país…</i>: producción cosechada 2025 por región del ISTAT (campo e invernadero), población residente al 1 de enero de 2025 del ISTAT y comercio de FAOSTAT.</li>
        <li><b>Turquía</b> – selector <i>Ver país…</i>: producción 2025 por provincia (81 il) del sistema MEDAS de TÜİK, población 2025 del registro ADNKS y comercio de FAOSTAT.</li>
        <li><b>Perú</b> – selector <i>Ver país…</i>: producción enero-diciembre 2025 por región del boletín "El Agro en Cifras" del MIDAGRI (preliminar), población 2025 del INEI y comercio de FAOSTAT.</li>
        <li><b>Canadá</b> – selector <i>Ver país…</i>: producción 2025 por provincia de Statistics Canada (frutas, hortalizas de campo, invernadero y papa; cifras suprimidas repartidas según superficie), población estimada 2025 y comercio de FAOSTAT.</li>
        <li><b>Chile</b> – selector <i>Ver país…</i>: superficie por región de hortalizas (INE, ESH 2024) y frutales (catastros CIREN-ODEPA) para repartir la producción nacional de FAOSTAT 2024 (estimado); papa y tomate industrial con producción oficial por región (INE 2024/25); población del Censo 2024.</li>
        <li><b>Colombia</b> – selector <i>Ver país…</i>: producción oficial por municipio de las Evaluaciones Agropecuarias Municipales (EVA) 2025 del Ministerio de Agricultura y la UPRA (datos.gov.co), sumada por departamento; población de las proyecciones 2025 del DANE (publicadas por el DNP en TerriData) y comercio de FAOSTAT.</li>
        <li><b>Brasil</b> – selector <i>Ver país…</i>: producción oficial por estado de la Producción Agrícola Municipal (PAM) 2025 del IBGE, población estimada 2025 del IBGE (API SIDRA) y comercio de FAOSTAT.</li>
        <li><b>Estados Unidos</b> – selector <i>Ver país…</i>: producción por estado de USDA NASS Quick Stats 2025 (mercado fresco; donde NASS reserva el dato, reparto con la superficie del Censo Agropecuario 2022), población 2025 del Census Bureau y comercio de FAOSTAT, incluida la exportación de México a EE. UU.</li>
        <li><b>ENIGH (INEGI)</b>: gasto y consumo de alimentos en hogares, para ajustar consumo por región.</li>
        <li><b>FAOSTAT (FAO)</b> – vista <i>Latinoamérica</i>: producción, superficie, exportación e importación (t y USD) y población de 34 países de América Latina y el Caribe, año 2024, desde las descargas masivas de la región Américas. Para comparar países se usa FAOSTAT también para México, cuyas cifras pueden diferir de las del SIAP. El comercio bilateral viene de la matriz detallada de comercio de FAOSTAT: salidas de países latinoamericanos según el exportador y llegadas desde fuera de la región según el importador. La vista <i>Mundo</i> usa los archivos mundiales de FAOSTAT (231 países; sin agregados regionales) y solo lo que reporta cada exportador.</li>
      </ul>
      <h3>Metodología</h3>
      <ul class="fuentes">
        <li><b>Demanda</b> = población CONAPO × consumo per cápita. Por defecto se usa el <b>consumo oficial</b> del Panorama
          Agroalimentario (calculado por el SIAP con datos del año anterior). En el simulador puede cambiarse al <b>consumo aparente</b>
          del año analizado ((producción − exportación + importación) ÷ población). Cuando difieren más de 15%, el balance lo señala:
          en frutas coinciden (±3%); en jitomate, chile y cebolla la producción 2025 cayó frente a 2024 sin que bajaran las exportaciones.</li>
        <li><b>Estacionalidad</b>: cosecha mensual (Panorama) contra precio mensual de mayoreo (SNIIM) y consumidor (PROFECO); r = correlación de Pearson
          entre % de cosecha y precio. La cobertura mensual supone exportación proporcional a la cosecha e importación pareja, y no considera almacenamiento.
          El escenario de escalonamiento acerca cada mes al promedio (8.3%) y estima el precio con la pendiente observada precio–cosecha (solo si r ≤ −0.3).</li>
        <li><b>Autosuficiencia</b> = producción / demanda de la entidad. "Abastece a N personas" = producción ÷ consumo per cápita.</li>
        <li><b>Exportación</b>: se atribuye a entidades excedentarias en proporción a su excedente.</li>
        <li><b>Flujos internos</b>: asignación de costo mínimo por distancia carretera aproximada (1.25 × línea recta). Son estimaciones del modelo, no registros de movimiento.</li>
        <li><b>Importación</b>: déficit no cubierto por producción nacional, ingresando por Nuevo Laredo.</li>
      </ul>`;
  }

  // ---------- Orquestación ----------
  function recalcular() { res = Modelo.calcular(estado.producto, escenario()); }

  function render() {
    if (estado.region === "sub") return renderSub();
    if (estado.region !== "mx") return renderLatam();
    if (!window.PRODUCTOS[estado.producto]) estado.producto = "jitomate";  // producto que solo existe en vistas por país
    recalcular();
    indicadores = Resumen.indicadores(estado.escenarios);
    renderLista(); renderResumen();
    dibujarMapa(); renderBalance(); renderEntidad(); renderSimulador();
  }

  // ---------- Lista de productos y resumen nacional ----------
  let indicadores = [];
  const filtro = { texto: "", tipo: "todos" };
  let ordenResumen = "alProductor";

  function renderLista() {
    const nav = document.getElementById("productos");
    nav.innerHTML = Resumen.listaHTML(indicadores, filtro.texto, filtro.tipo, estado.producto);
    nav.querySelectorAll(".chip").forEach(c => c.onclick = () => seleccionarProducto(c.dataset.k, true));
    document.getElementById("contadorProductos").textContent = indicadores.length;
  }

  function renderResumen() {
    const cont = document.getElementById("tab-resumen");
    cont.innerHTML = Resumen.panelHTML(indicadores, ordenResumen);
    cont.querySelectorAll("tr.clic[data-prod]").forEach(tr => tr.onclick = () => seleccionarProducto(tr.dataset.prod, true));
    cont.querySelectorAll("[data-orden]").forEach(b => b.onclick = () => { ordenResumen = b.dataset.orden; renderResumen(); });
  }

  // ---------- Vista Latinoamérica (FAOSTAT) ----------
  function renderLatam() {
    if (!Latam.disponible(estado.producto)) estado.producto = Latam.claves()[0];
    indicadores = Latam.indicadores();
    renderLista();
    const R = Latam.calcular(estado.producto);
    const cont = document.getElementById("tab-resumen");
    cont.innerHTML = Latam.resumenHTML(indicadores);
    cont.querySelectorAll("tr.clic[data-prod]").forEach(tr => tr.onclick = () => seleccionarProducto(tr.dataset.prod, true));
    const bal = document.getElementById("tab-balance");
    bal.innerHTML = Latam.productoHTML(R, window.PRODUCTOS[estado.producto]);
    bal.querySelectorAll("tr.clic[data-pais]").forEach(tr => tr.onclick = () => {
      estado.pais = tr.dataset.pais; activarTab("entidad"); dibujarMapa(); renderPaisLatam();
    });
    dibujarMapa();
    renderPaisLatam();
  }

  function renderPaisLatam() {
    const cont = document.getElementById("tab-entidad");
    if (!estado.pais) {
      cont.innerHTML = '<p class="sub">Haz clic en un país del mapa o de la tabla de productores para ver su portafolio.</p>';
      return;
    }
    cont.innerHTML = Latam.paisHTML(estado.pais, estado.producto);
    document.getElementById("volverRegion").onclick = e => {
      e.preventDefault(); estado.pais = null; activarTab("balance"); dibujarMapa(); renderPaisLatam();
    };
    cont.querySelectorAll("tr.clic[data-prod]").forEach(tr => tr.onclick = () => { estado.producto = tr.dataset.prod; render(); activarTab("balance"); });
  }

  // ---------- Vista por país con regiones (motor común) ----------
  function renderSub() {
    if (!Subnacional.disponible(estado.producto)) estado.producto = Subnacional.claves()[0];
    indicadores = Subnacional.indicadores();
    renderLista();
    const cont = document.getElementById("tab-resumen");
    cont.innerHTML = Subnacional.resumenHTML(indicadores);
    cont.querySelectorAll("tr.clic[data-prod]").forEach(tr => tr.onclick = () => seleccionarProducto(tr.dataset.prod, true));
    const bal = document.getElementById("tab-balance");
    bal.innerHTML = Subnacional.productoHTML(Subnacional.calcular(estado.producto));
    bal.querySelectorAll("tr.clic[data-region]").forEach(tr => tr.onclick = () => {
      estado.regionSub = tr.dataset.region; activarTab("entidad"); dibujarMapa(); renderRegionSub();
    });
    dibujarMapa();
    renderRegionSub();
  }

  function renderRegionSub() {
    const cont = document.getElementById("tab-entidad");
    if (!estado.regionSub) {
      cont.innerHTML = `<p class="sub">Haz clic en ${Subnacional.unReg()} del mapa o de la tabla de productores para ver su portafolio.</p>`;
      return;
    }
    cont.innerHTML = Subnacional.regionHTML(estado.regionSub);
    document.getElementById("volverPaisSub").onclick = e => {
      e.preventDefault(); estado.regionSub = null; activarTab("balance"); dibujarMapa(); renderRegionSub();
    };
    cont.querySelectorAll("tr.clic[data-prod]").forEach(tr => tr.onclick = () => { estado.producto = tr.dataset.prod; render(); activarTab("balance"); });
  }

  function cambiarRegion(region) {
    estado.region = region;
    estado.pais = null;
    estado.regionSub = null;
    if (region === "latam" || region === "global") Latam.usar(region);
    if (region === "sub") Subnacional.usar(estado.paisSub);
    const latam = region !== "mx";
    document.getElementById("ctrlSub").hidden = region !== "sub";
    document.getElementById("fuenteSub").textContent = region === "sub" ? Subnacional.datos().fuenteCorta : "";
    const selector = document.getElementById("paisSub");
    selector.classList.toggle("activo", region === "sub");
    if (region !== "sub") selector.value = "";
    else document.querySelectorAll("input[name=region]").forEach(r => { r.checked = false; });
    document.getElementById("fuenteLatam").textContent = region === "latam" || region === "global" ? "FAOSTAT " + Latam.datos().anio : "";
    document.getElementById("ctrlNivel").hidden = latam;
    document.getElementById("ctrlCentrales").hidden = latam;
    document.getElementById("ctrlLatam").hidden = !(region === "latam" || region === "global");
    if (latam) {
      document.getElementById("ctrlEstatal").hidden = true;
      document.getElementById("ctrlMunicipal").hidden = true;
    } else {
      cambiarNivel(estado.nivel);
    }
    document.querySelector('.tab[data-tab="simulador"]').hidden = latam;
    const nivelSub = region === "sub" ? Subnacional.datos().nivel : "";
    document.querySelector('.tab[data-tab="entidad"]').textContent = region === "sub" ? nivelSub.charAt(0).toUpperCase() + nivelSub.slice(1) : latam ? "País" : "Entidad";
    if (latam && document.querySelector(".tab.activo")?.dataset.tab === "simulador") activarTab("balance");
    actualizarAviso();
    encuadrar();
    render();
  }

  function actualizarAviso() {
    const aviso = document.querySelector(".aviso");
    if (estado.region === "sub") {
      const d = Subnacional.datos();
      aviso.textContent = `${d.pais} · ${d.fuente}`;
      aviso.title = d.metodo;
      return;
    }
    if (estado.region !== "mx") {
      const D = Latam.datos(), global = estado.region === "global";
      aviso.textContent = `FAOSTAT ${D.anio} · ${Object.keys(D.paises).length} ${global ? "países del mundo" : "países de América Latina y el Caribe"}`;
      aviso.title = "Producción, superficie, comercio, población y matriz de comercio bilateral: FAOSTAT (FAO)";
      return;
    }
    if (!window.PRODUCCION_SIAP) return;
    aviso.textContent = "Fuentes oficiales " + window.PRODUCCION_SIAP.anio + " · SIAP · INEGI · SNIIM · PROFECO · CONAPO";
    aviso.title = `Producción: SIAP ${window.PRODUCCION_SIAP.anio} · ` +
      (window.COMERCIO_OFICIAL ? `Comercio: INEGI/Comtrade ${window.COMERCIO_OFICIAL.anio} · ` : "") +
      (window.PRECIOS_CONSUMIDOR ? `Precios: SNIIM y PROFECO ${window.PRECIOS_CONSUMIDOR.anio} · ` : "") +
      (window.CONSUMO_OFICIAL ? `Consumo: Panorama SIAP ${window.CONSUMO_OFICIAL.publicacion} · Población: CONAPO ${window.POBLACION_CONAPO.anio}` : "");
  }

  function seleccionarProducto(k, abrirDetalle = false) {
    estado.producto = k;
    if (abrirDetalle && document.querySelector(".tab.activo")?.dataset.tab === "resumen") activarTab("balance");
    render();
  }

  function activarTab(nombre) {
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("activo", t.dataset.tab === nombre));
    document.querySelectorAll(".pestana").forEach(p => p.classList.toggle("activo", p.id === "tab-" + nombre));
  }

  document.getElementById("buscar").addEventListener("input", e => { filtro.texto = e.target.value; renderLista(); });
  document.querySelectorAll("input[name=tipo]").forEach(r => r.onchange = () => { filtro.tipo = r.value; renderLista(); });

  // Tema claro/oscuro (se guarda por navegador)
  document.getElementById("btnTema").onclick = () => {
    const nuevo = temaOscuro() ? "light" : "dark";
    document.documentElement.dataset.theme = nuevo;
    try { localStorage.setItem("tema", nuevo); } catch (e) {}
    actualizarBase();
  };

  // Guía rápida: se muestra la primera vez y con el botón "?"
  const guia = document.getElementById("guia");
  const cerrarGuia = () => { guia.hidden = true; try { localStorage.setItem("guiaVista", "1"); } catch (e) {} };
  document.getElementById("btnAyuda").onclick = () => { guia.hidden = false; document.getElementById("cerrarGuia").focus(); };
  document.getElementById("cerrarGuia").onclick = cerrarGuia;
  guia.addEventListener("click", e => { if (e.target === guia) cerrarGuia(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !guia.hidden) cerrarGuia(); });
  try { if (!localStorage.getItem("guiaVista")) guia.hidden = false; } catch (e) {}
  document.querySelectorAll(".tab").forEach(t => t.onclick = () => activarTab(t.dataset.tab));
  document.getElementById("verFlujos").onchange = dibujarMapa;
  document.getElementById("verImport").onchange = dibujarMapa;
  document.getElementById("verRed").onchange = dibujarMapa;
  document.getElementById("verCentrales").onchange = e => e.target.checked ? capaCentrales.addTo(mapa) : capaCentrales.remove();
  document.querySelectorAll("input[name=nivel]").forEach(r => r.onchange = () => {
    cambiarNivel(r.value); dibujarMapa(); renderEntidad();
  });
  document.getElementById("metricaMun").onchange = e => { estado.metricaMun = e.target.value; dibujarMapa(); };
  if (!Municipal.disponible()) document.querySelector("input[name=nivel][value=municipal]").disabled = true;

  document.querySelectorAll("input[name=region]").forEach(r => r.onchange = () => cambiarRegion(r.value));
  document.getElementById("verRutas").onchange = dibujarMapa;
  if (!window.LATAM_COMERCIO) document.getElementById("ctrlRutas").hidden = true;
  document.getElementById("metricaLatam").onchange = e => { estado.metricaLatam = e.target.value; dibujarMapa(); };
  if (window.LATAM) document.getElementById("fuenteLatam").textContent = "FAOSTAT " + window.LATAM.anio;
  else document.querySelector("input[name=region][value=latam]").disabled = true;
  if (!window.GLOBAL) document.querySelector("input[name=region][value=global]").disabled = true;
  // Selector de países con vista por regiones
  const selectorPais = document.getElementById("paisSub");
  Subnacional.paises().forEach(p => selectorPais.insertAdjacentHTML("beforeend", `<option value="${p.codigo}">${p.nombre}</option>`));
  selectorPais.onchange = () => {
    if (selectorPais.value) { estado.paisSub = selectorPais.value; cambiarRegion("sub"); }
    else { document.querySelector("input[name=region][value=mx]").checked = true; cambiarRegion("mx"); }
  };
  document.getElementById("metricaSub").onchange = e => { estado.metricaSub = e.target.value; dibujarMapa(); };
  document.getElementById("verImportSub").onchange = dibujarMapa;
  actualizarAviso();
  renderFuentes();
  render();
})();

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
    entidadElegida: false,   // hasta que la persona elige un estado, se usa el que más produce el producto
    region: "mx",          // "mx" | "latam"
    pais: null,            // código M49 del país seleccionado en la vista LATAM
    metricaLatam: "auto",
    paisSub: null,         // país de la vista por regiones (código de window.SUBNACIONAL)
    regionSub: null,       // región seleccionada en esa vista
    metricaSub: "auto",
    nivel: "estatal",      // "estatal" | "municipal"
    municipio: null,       // CVEGEO seleccionado
    metricaMun: "produccion",
    metricaMx: "auto",     // color de los estados de México: autosuficiencia u oferta por venir (alerta SIAP)
    mercado: null,         // país comprador (M49) abierto en la pestaña Exportar (vista por mercado de destino)
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
  function encuadrar(animar = false) {
    const ancho = window.innerWidth > 900;
    const esc = document.querySelector(".escenario"), caja = esc.getBoundingClientRect();
    const izq = ancho && !esc.classList.contains("sin-catalogo") ? document.querySelector(".catalogo").getBoundingClientRect().right - caja.left + 20 : 16;
    const der = ancho && !esc.classList.contains("sin-panel") ? caja.right - document.querySelector(".panel").getBoundingClientRect().left + 20 : 16;
    // Arriba: barra de capas y titular; en móvil, abajo: la hoja del panel
    const tit = document.getElementById("titular").getBoundingClientRect();
    const arriba = Math.max(60, tit.height ? tit.bottom - caja.top - (ancho ? 40 : 0) : 150);
    const abajo = ancho ? 16 : (document.querySelector(".panel")?.getBoundingClientRect().height ?? 0) + 12;
    mapa.stop();
    mapa.fitBounds(estado.region === "latam" ? LATINOAMERICA : estado.region === "global" ? MUNDO : estado.region === "sub" ? Subnacional.datos().limites : MEXICO, { paddingTopLeft: [izq, arriba], paddingBottomRight: [der, abajo], animate: animar });
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
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { Paleta.refrescar(); actualizarBase(); });
  const capaFlujos = L.layerGroup().addTo(mapa);
  const capaBurbujas = L.layerGroup().addTo(mapa);
  const capaCentrales = L.layerGroup();

  window.CENTRALES.forEach(c => {
    L.marker([c.lat, c.lon], {
      icon: L.divIcon({ className: "", html: '<div class="central"></div>' })
    }).bindTooltip(c.nombre).addTo(capaCentrales);
  });

  const colorAutosuf = r => Paleta.auto(r);
  const capaTerritorios = L.layerGroup().addTo(mapa);
  const verVolumen = () => document.getElementById("verVolumen").checked;

  function dibujarLeyenda() {
    const rangos = [["Sin producción relevante", 0], ["< 50% de su demanda", 0.3], ["50–99%", 0.7],
      ["Autosuficiente (1–2×)", 1.5], ["Excedentario (2–10×)", 5], ["Gran abastecedor (>10×)", 20]];
    document.getElementById("leyenda").innerHTML =
      `<h4>Autosuficiencia: ${res.producto.nombre}</h4>` +
      rangos.map(([t, v]) => `<div class="fila"><span class="sw" style="background:${colorAutosuf(v)}"></span>${t}</div>`).join("") +
      `<div class="fila pie">${verVolumen() ? "Círculo = volumen producido · " : ""}SIAP ${window.PRODUCCION_SIAP?.anio ?? ""}</div>` +
      (document.getElementById("verRed").checked && Precios.disponible(res.clave) ? capaPrecios.leyendaHTML() : "");
  }

  const capaPrecios = Precios.crearCapa(mapa);
  const capaMunicipal = Municipal.crear(mapa, {
    escenario, metrica: () => estado.metricaMun, seleccionado: () => estado.municipio,
    nombreProducto: () => res.producto.nombre,
    alSeleccionar: cve => { seleccionarMunicipio(cve); }
  });

  function seleccionarMunicipio(cve, enfocar = false) {
    estado.municipio = cve; estado.entidad = cve.slice(0, 2); estado.entidadElegida = true;
    activarTab("entidad"); dibujarMapa(); renderBalance(); renderEntidad();
    if (enfocar) capaMunicipal.enfocar(cve);
  }

  // Curva suave entre dos puntos (para que las rutas no se encimen)
  function arcoMX([y1, x1], [y2, x2]) {
    const cx = (x1 + x2) / 2 - (y2 - y1) * 0.18, cy = (y1 + y2) / 2 + (x2 - x1) * 0.18, pts = [];
    for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push([(1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t * t * y2, (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t * t * x2]); }
    return pts;
  }

  const capaLatam = Latam.crearCapa(mapa);
  const capaComercio = Latam.crearCapaComercio(mapa);
  const capaSub = Subnacional.crearCapa(mapa);
  const capaEUA = window.PreciosEUA ? PreciosEUA.crearCapa(mapa) : null;
  const capaEmb = window.Embarques ? Embarques.crearCapa(mapa) : null;
  const verEmbarques = () => capaEmb && estado.paisSub === "US" && document.getElementById("verEmbarquesEUA").checked;
  const verPreciosEUA = () => capaEUA && estado.paisSub === "US" && document.getElementById("verMercadosEUA").checked && PreciosEUA.disponible(estado.producto);

  function dibujarMapa() {
    guardarURL();
    capaBurbujas.clearLayers();
    capaFlujos.clearLayers();
    capaTerritorios.clearLayers();
    renderTitular();
    if (estado.region === "sub") {
      capaPrecios.ocultar(); capaMunicipal.ocultar(); capaCentrales.remove(); capaLatam.ocultar(); capaComercio.ocultar();
      const R = Subnacional.calcular(estado.producto);
      capaSub.dibujar(R, estado.metricaSub, estado.regionSub, document.getElementById("verImportSub").checked,
        Subnacional.meta(estado.producto).color, id => { estado.regionSub = id; activarTab("entidad"); dibujarMapa(); renderRegionSub(); abrirHoja(); },
        verVolumen());
      capaSub.mostrar();
      document.getElementById("leyenda").innerHTML = Subnacional.leyendaHTML(estado.metricaSub, Subnacional.nombre(estado.producto), verVolumen()) +
        (verPreciosEUA() ? capaEUA.leyendaHTML() : "") + (verEmbarques() ? capaEmb.leyendaHTML() : "");
      if (verEmbarques()) { capaEmb.dibujar(estado.producto); capaEmb.mostrar(); } else capaEmb?.ocultar();
      if (verPreciosEUA()) { capaEUA.dibujar(estado.producto); capaEUA.mostrar(); } else capaEUA?.ocultar();
      return;
    }
    capaSub.ocultar();
    capaEUA?.ocultar();
    capaEmb?.ocultar();
    if (estado.region !== "mx") {
      capaPrecios.ocultar(); capaMunicipal.ocultar(); capaCentrales.remove();
      const R = Latam.calcular(estado.producto);
      capaLatam.dibujar(R, estado.metricaLatam, estado.pais, id => { estado.pais = id; activarTab("entidad"); dibujarMapa(); renderPaisLatam(); abrirHoja(); }, verVolumen());
      capaLatam.mostrar();
      if (Latam.comercioDisponible() && document.getElementById("verRutas").checked) {
        capaComercio.dibujar(estado.producto, Subnacional.meta(estado.producto).color, estado.pais);
        capaComercio.mostrar();
      } else capaComercio.ocultar();
      document.getElementById("leyenda").innerHTML = Latam.leyendaHTML(R, estado.metricaLatam, Latam.nombre(estado.producto), verVolumen());
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

    const T = Paleta.tokens();
    const porId = Object.fromEntries(res.filas.map(f => [f.id, f]));
    const tip = f => `<b>${f.nombre}</b><br>Producción: ${fmtT(f.prod)}${f.estimado ? " (est.)" : ""}<br>
        Demanda local: ${fmtT(f.demanda)}<br>Autosuficiencia: ${f.autosuf >= 10 ? f.autosuf.toFixed(0) + "×" : pct(f.autosuf)}<br>
        Abastece a ${fmtP(f.personas)} personas`;
    const clicEntidad = id => { estado.entidad = id; estado.entidadElegida = true; estado.municipio = null; if (document.querySelector(".tab.activo")?.dataset.tab !== "exportar") activarTab("entidad"); render(); abrirHoja(); };
    const geo = window.GEO_SUB?.MX;
    if (!geo) Paleta.geoRegiones("MX").then(() => { if (estado.region === "mx" && estado.nivel === "estatal") dibujarMapa(); }).catch(() => {});
    const conPrecios = document.getElementById("verRed").checked && Precios.disponible(res.clave);
    const porOferta = estado.metricaMx === "oferta" && window.Alerta?.disponible(res.clave);
    if (geo) Paleta.coropletas(mapa, capaTerritorios, geo, {
      color: id => porOferta ? Alerta.colorEstado(res.clave, id) ?? Paleta.tokens().sin : porId[id] ? colorAutosuf(porId[id].autosuf) : null, seleccionado: estado.entidad,
      tooltip: id => tip(porId[id]), clic: clicEntidad
    });

    if (verFlujos) {
      // Solo las 20 rutas principales: trazo fino animado sobre un halo tenue
      const lista = res.flujos.filter(fl => verImport || !fl.importado).sort((a, b) => b.t - a.t).slice(0, 20);
      const maxT = Math.max(...lista.map(f => f.t), 1);
      const origenes = new Map();
      lista.forEach(fl => {
        const pts = viaCentral && !fl.importado
          ? [[fl.origen.lat, fl.origen.lon], [fl.central.lat, fl.central.lon], [fl.destino.lat, fl.destino.lon]]
          : arcoMX([fl.origen.lat, fl.origen.lon], [fl.destino.lat, fl.destino.lon]);
        const c = fl.importado ? T.importa : res.producto.color;
        Paleta.ruta(capaFlujos, pts, c, 0.8 + 3 * Math.sqrt(fl.t / maxT),
          `${fl.origen.nombre} → ${fl.destino.nombre}<br><b>${fmtT(fl.t)}</b> (${fmt(fl.kmDirecto)} km)${fl.importado ? "<br>Importación" : ""}`);
        origenes.set(fl.origen.nombre, [fl.origen.lat, fl.origen.lon, c]);
      });
      origenes.forEach(([la, lo, c]) => Paleta.origen(capaFlujos, la, lo, "", c));
    }

    res.filas.forEach(f => {
      const r = f.prod > 0 ? 4 + 34 * Math.sqrt(f.prod / maxProd) : 3;
      if (geo) { if (verVolumen() && f.prod > 0) Paleta.volumen(capaBurbujas, f.lat, f.lon, r); return; }
      L.circleMarker([f.lat, f.lon], {
        radius: r, color: f.id === estado.entidad ? T.sel : T.borde, weight: f.id === estado.entidad ? 3 : 1.2,
        fillColor: colorAutosuf(f.autosuf), fillOpacity: conPrecios ? 0.35 : 0.85
      }).bindTooltip(tip(f)).on("click", () => clicEntidad(f.id)).addTo(capaBurbujas);
    });
    dibujarLeyenda();
    if (porOferta) document.getElementById("leyenda").innerHTML = Alerta.leyendaHTML(res.clave);
  }

  // ---------- Secciones plegables y utilidades de los paneles ----------
  const S = (id, html, resumen, op) => Seccion.envolver(id, html, resumen, op);
  const AUTO = '<span data-auto>Cargando la serie…</span>';   // js/historia.js lo llena al cargar la serie
  const pctFino = s => (s < 0.01 || s > 0.99) && s < 1 ? (s * 100).toFixed(1) + "%" : pct(s);
  const barras = obj => Object.entries(obj ?? {}).map(([pais, s]) =>
    `<div class="barra-h"><span class="n">${pais}</span><span class="b"><i style="width:${s * 100}%"></i></span><span class="x">${pctFino(s)}</span></div>`).join("");
  const usd = v => v >= 1e9 ? `US$${(v / 1e9).toFixed(2)} mil M` : v >= 1e6 ? `US$${fmt(v / 1e6)} M` : `US$${fmt(v / 1e3)} mil`;

  // Resumen ejecutivo de una línea: dónde se produce, cuánto se exporta y a dónde, si alcanza para el consumo y la
  // oferta por venir (alerta SIAP). Cada parte va en su <span> para que js/idioma.js la traduzca por separado.
  function resumenEjecutivo(res) {
    const n = res.nacional, p = res.producto;
    const lider = [...res.filas].sort((a, b) => b.prod - a.prod)[0];
    const partes = [];
    if (n.produccion > 0 && lider?.prod > 0) partes.push(`${fmtT(n.produccion)} al año, ${pct(lider.prod / n.produccion)} en ${lider.nombre}`);
    const exp = p.exportacion / (n.produccion || 1);
    const dest = Object.entries(p.destinos ?? {}).sort((a, b) => b[1] - a[1])[0];
    if (p.exportacion > 0 && exp >= 0.01) partes.push(dest ? `exporta ${pct(Math.min(1, exp))}, ${pctFino(dest[1])} de eso a ${dest[0]}` : `exporta ${pct(Math.min(1, exp))}`);
    // Con las cifras oficiales (las mismas del encabezado): lo que queda en el país = producción − exportación + importación
    const disp = n.produccion - (p.exportacion ?? 0) + (p.importacion ?? 0), imp = (p.importacion ?? 0) / (disp || 1);
    if (imp >= 0.05) partes.push(`importa ${pct(Math.min(1, imp))} de lo que consume`);
    const cubre = disp / (n.demanda || 1);
    partes.push(cubre < 0.9 ? `lo que queda en el país cubre ${pct(cubre)} del consumo de referencia`
      : cubre > 1.1 ? `lo que queda en el país supera ${pct(cubre - 1)} el consumo de referencia` : "lo que queda en el país cubre su consumo");
    const al = window.Alerta?.disponible(res.clave) ? Alerta.calcular(res.clave) : null;
    if (al?.s != null) {
      const s = al.s, r = Math.round(s * 100);
      const cuanto = s >= 0.15 ? "mucho mayor que en" : s >= 0.05 ? "mayor que en" : s > -0.05 ? "similar a" : s > -0.15 ? "menor que en" : "mucho menor que en";
      partes.push(`oferta por venir ${cuanto} años anteriores (${r > 0 ? "+" : r < 0 ? "−" : "±"}${Math.abs(r)}%)`);
    }
    return `<p class="ejecutivo">${partes.map(x => `<span>${x}</span>`).join(" · ")}</p>`;
  }

  // Ficha de decisión al inicio de Exportar: acceso y arancel en EE. UU., neto por kg exportando contra venderlo en una
  // central de abasto (del estado elegido o el que más produce) y los mejores meses. El detalle sigue más abajo.
  function fichaDecision(k, f, tarifa, secUSA) {
    if (!f) return "";
    const acc = window.Acceso?.celda(k, "US");
    const exp = window.PreciosEUA?.netoMejor(k, f, tarifa);
    const nac = window.Planeador?.centralAnual(k, f, tarifa);
    const meses = window.PreciosEUA?.calendarioResumen(k)?.split(" · ")[0];
    if (!acc && !exp && !nac) return "";
    const mxn2 = n => "$" + n.toFixed(2);
    const gana = exp && nac ? (exp.neto >= nac.n ? "exp" : "nac") : null;
    return `<div class="ficha-decision">
      <span class="etq">Lo esencial para decidir · ${f.nombre}</span>
      <div class="kpis">
        ${acc ? `<div class="kpi"><div class="v" style="font-size:15px">${window.Acceso.etiqueta(acc)}</div><div class="l">Acceso a EE. UU.: <span${window.Acceso.tn()}>${window.Acceso.arancel(acc) ?? ""}</span></div></div>` : ""}
        ${exp ? `<div class="kpi${gana === "exp" ? " destacado" : ""}"><div class="v">${mxn2(exp.neto)}/kg</div><div class="l">exportando por <span translate="no">${exp.nombre.split(",")[0]}</span> (precio en la frontera menos flete${exp.ad ? " y antidumping" : ""}; mediana del año)</div></div>` : ""}
        ${nac ? `<div class="kpi${gana === "nac" ? " destacado" : ""}"><div class="v">${mxn2(nac.n)}/kg</div><div class="l">vendiendo en el mercado nacional: típico de ${nac.centrales} centrales de abasto (mayoreo menos 25% de margen del mayorista y el flete); hasta ${mxn2(nac.mejor.n)} en <span translate="no">${nac.mejor.central}</span></div></div>` : ""}
      </div>
      ${!exp && nac ? `<p class="sub">El USDA no publica un precio en la frontera para ${res.producto.nombre.toLowerCase()}: no se puede calcular el neto de exportar.</p>` : ""}
      ${meses ? `<p class="sub">${meses} en EE. UU. Mes a mes, en <i>Planear la venta</i>.</p>` : `<p class="sub">Mes a mes, en <i>Planear la venta</i>.</p>`}
    </div>`;
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
    const primero = obj => Object.entries(obj ?? {}).sort((a, b) => b[1] - a[1])[0];
    const origen1 = primero(p.origenes);
    document.getElementById("tab-balance").innerHTML = `
      <h2>${p.nombre}</h2>
      ${resumenEjecutivo(res)}
      ${window.AlertasPrecio ? AlertasPrecio.productoHTML(res.clave) : ""}
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
          <div class="l">Producción entre consumo, antes de exportar. La producción alcanzaría para <b>${fmtP(n.personasProduccion)}</b> de personas
          (población: ${fmtP(n.pobTotal)}); después de exportar alcanza para <b>${fmtP(n.personasTrasExport)}</b>.</div></div>
      </div>
      ${nota}
      ${S("precios", Precios.balanceHTML(res), Precios.resumen(res), { abierta: true })}
      ${window.PronosticoSNIIM ? S("pronostico_mx", `<h3>Pronóstico de 8 semanas en las centrales <span class="tag ok">SNIIM</span></h3>${PronosticoSNIIM.marca(res.clave)}`, AUTO) : ""}
      ${window.Alerta?.disponible(res.clave) ? S("alerta", `<h3>Siembras y cosechas: alerta de oferta <span class="tag ok">SIAP</span></h3>${Alerta.html(res.clave)}`, Alerta.resumen(res.clave),
        { abierta: Math.abs(Alerta.calcular(res.clave).s ?? 0) >= 0.15 }) : ""}
      ${S("estacionalidad", Estacionalidad.balanceHTML(res, escenario()), Estacionalidad.resumen(res))}
      ${window.Clima?.disponible(res.clave) ? S("clima", `<h3>Helada y lluvia fuerte en los próximos días <span class="tag ok">SMN</span></h3>${Clima.html(res.clave)}`, Clima.resumen(res.clave)) : ""}
      ${window.Sequia ? S("sequia", Sequia.balanceHTML(res.clave, res.producto.nombre), Sequia.resumen(res.clave)) : ""}
      ${window.Costos?.disponible(res.clave) ? S("costos", `<h3>Costo de producción contra precio al productor <span class="tag ok">FIRA · SIAP</span></h3>${Costos.html(res.clave)}`, Costos.resumen(res.clave)) : ""}
      ${window.Siniestros?.disponible(res.clave) ? S("siniestros", `<h3>Pérdidas por siniestro en diez años <span class="tag ok">SIAP</span></h3>${Siniestros.html(res.clave)}`, Siniestros.resumen(res.clave)) : ""}
      ${window.Historia && res.clave !== "arandano" ? S("historia", `<h3>México en diez años <span class="tag ok">FAOSTAT</span></h3><p class="sub">Cifras de FAOSTAT (hasta 2024) para comparar con otros países: pueden diferir del SIAP y de la estadística de comercio 2025 que usa el resto del panel.</p>${Historia.marca("pais", res.clave, { pais: "484", titulo: "" })}`, AUTO) : ""}
      ${origen1 ? S("importaciones", `<h3>Origen de las importaciones</h3>${barras(p.origenes)}`, `Primer origen: ${origen1[0]}, ${pctFino(origen1[1])} del volumen importado`) : ""}
      ${S("entidades", `<h3>Principales entidades productoras</h3>
      <table>
        <tr><th>Entidad</th><th class="num">Producción</th><th class="num">Abastece a</th><th class="num">Veces su población</th></tr>
        ${top.map(f => `<tr class="clic" data-id="${f.id}"><td>${f.nombre}${f.estimado ? ' <span class="est">(est.)</span>' : ""}</td>
          <td class="num">${fmtT(f.prod)}</td><td class="num">${fmtP(f.personas)}</td>
          <td class="num">${etiqueta(f.autosuf)}</td></tr>`).join("")}
      </table>
      <p class="sub" style="margin-top:10px">${n.entidadesAutosuf} de 32 entidades cubren su propia demanda.
      Excedente sin mercado asignado (industria, merma o sub-registro): ${fmtT(n.excedenteSinMercado)}.</p>`,
        `${top[0].nombre}: ${pct(top[0].prod / (n.produccion || 1))} de la producción · ${n.entidadesAutosuf} de 32 entidades se autoabastecen`, { abierta: true })}
      ${S("municipios", Municipal.topHTML(res, escenario()), Municipal.topResumen(res, escenario()))}`;
    enlazarFilas("#tab-balance");
    document.querySelectorAll('#tab-balance details[data-sec="alerta"] tr.clic[data-id]').forEach(tr => tr.onclick = () => {
      estado.entidad = tr.dataset.id; estado.entidadElegida = true; estado.metricaMx = "oferta"; document.getElementById("metricaMx").value = "oferta"; render();
    });
    const esc_ = document.getElementById("sEscalon");
    if (esc_) esc_.onchange = () => { escenario().escalonamiento = +esc_.value; renderBalance(); };
    document.querySelectorAll("#tab-balance tr.mun").forEach(tr => tr.onclick = () => {
      cambiarNivel("municipal");
      seleccionarMunicipio(tr.dataset.cve, true);
    });
  }

  // ---------- Panel: Exportar (comercio exterior de México) ----------
  function renderExportar() {
    if (estado.mercado && window.Mercado) return renderMercado();
    const n = res.nacional, p = res.producto, k = res.clave;
    const f = res.filas.find(x => x.id === estado.entidad);
    const destino1 = Object.entries(p.destinos ?? {}).sort((a, b) => b[1] - a[1])[0];
    const secUSA = window.PreciosEUA ? PreciosEUA.seccionesExportar(k, PreciosEUA.volumenMexico(k), "Exportación a EE. UU.: por dónde y cuándo cruza") : [];
    const opp = window.Latam ? Latam.oportunidadesMundo(k) : { html: "" };
    const tarifa = escenario().tarifa;
    const cont = document.getElementById("tab-exportar");
    cont.innerHTML = `
      <h2>Exportar: ${p.nombre}</h2>
      <p class="sub">${p.fuenteComercio ? `<span class="tag ok">Comercio: ${p.fuenteComercio}</span>` : `<span class="tag def">Comercio preliminar</span>`}
        ${p.fracciones ? ` Fracciones arancelarias (SA): ${p.fracciones.join(", ")}` : ""}</p>
      <div class="kpis">
        <div class="kpi"><div class="v">${fmtT(p.exportacion)}</div><div class="l">Exportación ${p.fuenteComercio ? "oficial" : "(preliminar)"}${p.valorExportUSD ? ` · ${usd(p.valorExportUSD)}` : ""}</div></div>
        <div class="kpi"><div class="v">${n.produccion > 0 ? pct(Math.min(1, p.exportacion / n.produccion)) : "—"}</div><div class="l">de la producción nacional se exporta</div></div>
        ${destino1 ? `<div class="kpi destacado"><div class="v">${pctFino(destino1[1])} va a ${destino1[0]}</div>
          <div class="l">${p.valorExportUSD && p.exportacion ? `<span>Precio medio de exportación: US$${(p.valorExportUSD / p.exportacion / 1000).toFixed(2)} el kg.</span> ` : ""}<span>Importación: ${fmtT(n.importacionReportada)}${p.valorImportUSD ? ` · ${usd(p.valorImportUSD)}` : ""}.</span></div></div>` : ""}
      </div>
      ${fichaDecision(k, f, tarifa, secUSA)}
      ${window.Mercado ? Mercado.selectorHTML() : ""}
      ${destino1 ? S("destinos", `<h3>Destino de las exportaciones (por volumen)</h3>${barras(p.destinos)}`,
        `Primer destino: ${destino1[0]}, ${pctFino(destino1[1])} del volumen`, { abierta: true }) : ""}
      ${secUSA.map(([id, h, r]) => S(id, h, r)).join("")}
      ${window.Embarques ? S("embarques", `<h3>Quién abastece a EE. UU. cada semana <span class="tag ok">USDA</span></h3>${Embarques.marca("oferta", k, "mx")}`, AUTO) : ""}
      ${window.Embarques ? S("pronostico", `<h3>Pronóstico de 8 semanas en EE. UU. <span class="tag ok">USDA</span></h3>${Embarques.marca("pronostico", k, "mx")}`, AUTO) : ""}
      ${f && !estado.entidadElegida ? `<p class="sub nota-estado">Las secciones por estado muestran <b>${f.nombre}</b>, el que más produce ${p.nombre.toLowerCase()}. Toca tu estado en el mapa para verlas con el tuyo.</p>` : ""}
      ${window.PreciosEUA && f?.prod > 0 ? S("neto", PreciosEUA.netoHTML(k, f, p.precioRural, tarifa, res.filas), PreciosEUA.netoResumen(k, f, p.precioRural, tarifa)) : ""}
      ${window.Planeador?.disponible(k) && f?.prod > 0 ? S("plan", `<h3>Planear la venta de ${f.nombre} <span class="tag ok">USDA · SNIIM · SIAP</span></h3>${Planeador.marca(k, f, tarifa)}`, `Exportar o vender en México, mes a mes, con el volumen que esperas`) : ""}
      ${window.Acceso ? S("acceso", Acceso.html(k), Acceso.resumen(k)) : ""}
      ${opp.html ? S("oportunidades", opp.html, opp.resumen) : ""}
      ${window.PreciosUE ? S("europa", PreciosUE.html(k), PreciosUE.resumen(k)) : ""}`;
    cont.querySelectorAll("tr.clic[data-id]").forEach(tr => tr.onclick = () => {
      estado.entidad = tr.dataset.id; estado.entidadElegida = true; estado.municipio = null; render();
    });
    enlazarMercados(cont);
  }

  // Enlaces a la vista por mercado de destino (tabla "Dónde puede vender México", selector de país comprador)
  function enlazarMercados(cont) {
    cont.querySelectorAll("[data-mercado]").forEach(el => el.onclick = e => { e.preventDefault(); abrirMercado(el.dataset.mercado); });
    const sel = cont.querySelector("select.selector-mercado");
    if (sel) sel.onchange = () => { if (sel.value) abrirMercado(sel.value); };
  }
  function abrirMercado(id) {
    estado.mercado = id;
    // En Mundo y Latinoamérica el país comprador se resalta en el mapa con sus rutas de comercio
    if ((estado.region === "latam" || estado.region === "global") && Latam.datos().paises[id]) { estado.pais = id; dibujarMapa(); renderPaisLatam(); }
    activarTab("exportar"); abrirHoja();
    renderMercado();
    guardarURL();
  }
  function renderMercado() {
    const cont = document.getElementById("tab-exportar");
    if (!estado.mercado || !window.Mercado) return;
    Mercado.pintar(cont, estado.mercado, estado.producto, {
      volver: () => { estado.mercado = null; renderExportarActual(); guardarURL(); },
      producto: k => { estado.producto = k; render(); },   // sigue en la vista del mercado, con otro producto
      mercado: id => abrirMercado(id)
    });
  }
  // Pestaña Exportar de la vista activa
  function renderExportarActual() {
    if (estado.mercado && window.Mercado) return renderMercado();
    const cont = document.getElementById("tab-exportar");
    if (estado.region === "mx") return renderExportar();
    if (estado.region === "sub") cont.innerHTML = Subnacional.exportarHTML(Subnacional.calcular(estado.producto));
    else cont.innerHTML = Latam.exportarHTML(Latam.calcular(estado.producto));
    enlazarMercados(cont);
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
    // Cambio de producción con la MISMA fuente (cierre SIAP del año anterior, data/produccion_anterior.js); el Panorama a
    // veces usa otra definición (chile: 3.22 Mt contra 2.46 Mt del cierre 2024)
    const prev = window.PRODUCCION_ANTERIOR, prodAnt = prev?.productos?.[res.clave];
    const cambioProd = prodAnt ? p.nacional / prodAnt - 1 : null;
    const otraDef = prodAnt && p.produccionRef && Math.abs(p.produccionRef / prodAnt - 1) > 0.1;
    return `<div class="nota" style="border-color:#e67e22"><b>Consumo oficial vs. disponibilidad ${window.POBLACION_CONAPO?.anio ?? ""}:</b>
      el Panorama reporta ${p.consumoPC} kg por persona (datos ${window.CONSUMO_OFICIAL.anioDatos}), pero con la producción y el comercio
      ${window.POBLACION_CONAPO?.anio ?? ""} la disponibilidad interna alcanza para <b>${res.pcAparente.toFixed(1)} kg</b> (${brecha > 0 ? "+" : ""}${pct(brecha)}).
      ${cambioProd != null ? `<span>Según el cierre del SIAP, la producción pasó de ${fmtT(prodAnt)} (${prev.anio}) a ${fmtT(p.nacional)} (${cambioProd > 0 ? "+" : ""}${pct(cambioProd)}).</span>` : ""}
      ${otraDef ? `<span>Ojo: el Panorama calcula su consumo con una producción ${prev.anio} de ${fmtT(p.produccionRef)}, distinta de la del cierre del SIAP (${fmtT(prodAnt)}; otra definición del producto), así que su consumo por persona no es del todo comparable con estas cifras.</span>` : ""}
      <span>${brecha < 0 ? "Con el consumo oficial, el modelo muestra un faltante que no se cubrió con importaciones: el mercado interno recibió menos producto." : "Hay más producto disponible que el consumo oficial: excedente para merma, industria o inventario."}</span>
      Cambia la base en <i>Simulador</i>.</div>`;
  }

  function etiqueta(r) {
    if (r < 1) return `<span class="tag def">${pct(r)}</span>`;
    if (r < 2) return `<span class="tag ok">${r.toFixed(1)}×</span>`;
    return `<span class="tag exc">${r >= 10 ? r.toFixed(0) : r.toFixed(1)}×</span>`;
  }

  function enlazarFilas(sel) {
    document.querySelectorAll(`${sel} tr.clic[data-id]`).forEach(tr => tr.onclick = () => {
      estado.entidad = tr.dataset.id; estado.entidadElegida = true; estado.municipio = null; activarTab("entidad"); render();
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
      ${!estado.entidadElegida && !estado.municipio ? `<p class="sub nota-estado">Es el estado que más produce ${res.producto.nombre.toLowerCase()}. Toca otro estado en el mapa para verlo.</p>` : ""}
      <p class="sub">Población ${fmt(f.pob)}${window.POBLACION_CONAPO ? ` (CONAPO ${window.POBLACION_CONAPO.anio})` : ""} · ${res.producto.nombre}${f.estimado ? " · producción estimada (entidad no desglosada)" : ""}</p>
      <div class="kpis">
        <div class="kpi"><div class="v">${fmtT(f.prod)}</div><div class="l">Producción${window.Siniestros?.estadoTexto(res.clave, f.id) ? `<br>${Siniestros.estadoTexto(res.clave, f.id)}` : ""}${window.Costos?.estadoTexto(res.clave, f.id) ? `<br>${Costos.estadoTexto(res.clave, f.id)}` : ""}</div></div>
        <div class="kpi"><div class="v">${fmtT(f.demanda)}</div><div class="l">Demanda propia${res.regional ? `<br>consume por persona ${pct(f.indiceConsumo)} del promedio nacional (ENIGH)` : ""}</div></div>
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
      ${window.Sequia && f.prod > 0 ? Sequia.entidadHTML(res.clave, f.id, f.nombre) : ""}
      ${window.PreciosEUA && f.prod > 0 && PreciosEUA.netoResumen(res.clave, f, res.producto.precioRural, escenario().tarifa)
        ? `<p class="sub"><a href="#" data-ir-tab="exportar">Si ${f.nombre} exporta a EE. UU.: ${PreciosEUA.netoResumen(res.clave, f, res.producto.precioRural, escenario().tarifa).split(": ")[1]} → Exportar</a></p>` : ""}
      ${Precios.entidadHTML(res, f.id)}
      <div class="ctrl">
        <label>Escenario: variación de producción en <span translate="no">${f.abr}</span> <b id="lblFactor">${pctVar(esc.factorProd[f.id] ?? 1)}</b></label>
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
    document.querySelectorAll("#tab-entidad [data-ir-tab]").forEach(a => a.onclick = e => { e.preventDefault(); activarTab(a.dataset.irTab); });
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
        ${window.Paleta.precioNoComparable[res.clave] ? `<div class="nota">Esta cadena compara precios de productos distintos: ${window.Paleta.precioNoComparable[res.clave]}</div>` : ""}
        ${cons && !window.Paleta.precioNoComparable[res.clave] ? `<p class="sub">De cada $100 que paga el consumidor, el productor recibe <b>$${(p.precioRural / finalHoy * 100).toFixed(0)}</b>.
          Mayoreo SNIIM ${mxn(sniim.precio)} · consumidor PROFECO ${mxn(cons.precio)} (mediana ${window.PRECIOS_CONSUMIDOR.anio}).</p>` : ""}
        ${ctrl("sInterm", "Reducción de la intermediación mayorista (compra directa, centros de acopio, cooperativas)", 0, 80, 5, esc.reduccionIntermediacion ?? 0, v => v + "%")}
        ${cons ? ctrl("sMinor", "Reducción del margen minorista (mercados sobre ruedas, venta directa, canales cortos)", 0, 80, 5, esc.reduccionMinorista ?? 0, v => v + "%") : ""}
        <div class="nota">Con ${esc.ruta === "directo" ? "ruta directa región → región, " : ""}${pct(reduccion)} menos intermediación mayorista${cons ? ` y ${pct(redMin)} menos margen minorista` : ""},
          el precio ${cons ? "al consumidor" : "de mayoreo"} pasaría de <b>${mxn(finalHoy)}</b> a <b>${mxn(nuevo)}/kg</b>:
          ahorro de <b>${mxn(ahorroKg)}/kg</b> (${pct(ahorroKg / finalHoy)}), ≈ <b>${mxnGrande(Math.max(0, ahorroAnual))}</b> al año
          (el ahorro en márgenes se aplica a todo el consumo nacional; el de transporte, solo a las ${fmtT(L_.toneladasMovidas)} que se mueven entre estados). El productor mantiene su precio; parte del ahorro podría destinarse a pagarle mejor.</div>`;
    }

    document.getElementById("tab-simulador").innerHTML = `
      <h2>Simulador de abasto y logística</h2>
      <p class="sub">${p.nombre}: modifica supuestos y compara la ruta vía centrales de abasto contra una distribución directa región-región.</p>
      <h3>Oferta y demanda</h3>
      ${p.consumoOficial ? `<div class="ctrl"><label>Base de consumo</label>
        <select id="sBase"><option value="oficial" ${res.base === "oficial" ? "selected" : ""}>Oficial: Panorama SIAP ${window.CONSUMO_OFICIAL.publicacion} (${p.consumoPC} kg, datos ${window.CONSUMO_OFICIAL.anioDatos})</option>
        <option value="aparente" ${res.base === "aparente" ? "selected" : ""}>Aparente ${window.POBLACION_CONAPO?.anio ?? ""}: producción − exportación + importación (${res.pcAparente.toFixed(1)} kg)</option></select></div>` : ""}
      ${window.CONSUMO_REGIONAL?.productos?.[estado.producto] ? `<div class="ctrl"><label>Consumo por estado</label>
        <select id="sRegional"><option value="si" ${res.regional ? "selected" : ""}>Según la ENIGH ${window.CONSUMO_REGIONAL.anio}: cada estado con su consumo por persona</option>
        <option value="no" ${res.regional ? "" : "selected"}>Igual en todo el país</option></select></div>` : ""}
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
    document.getElementById("sRegional")?.addEventListener("change", e => { esc.consumoRegional = e.target.value === "si"; render(); });
    document.getElementById("sBase")?.addEventListener("change", e => {
      esc.baseConsumo = e.target.value; delete esc.consumoPC; render();
    });
    document.getElementById("sRuta").onchange = e => { esc.ruta = e.target.value; dibujarMapa(); renderSimulador(); };
    document.getElementById("sReset").onclick = () => { delete estado.escenarios[estado.producto]; render(); };
  }

  // ---------- Frescura de los datos (data/frescura.js, scripts/construir_frescura.py) ----------
  const MES_CORTO = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  function frescura() {
    const F = window.FRESCURA?.fuentes ?? [];
    const hoy = new Date();
    return F.map(f => { const edad = Math.round((hoy - new Date(f.al + "T12:00:00")) / 864e5); return { ...f, edad, ok: edad <= f.cada + f.retraso + 7 }; });
  }
  function frescuraHTML() {
    const F = frescura();
    if (!F.length) return "";
    const g = window.FRESCURA.generado.split("-").map(Number);
    return `<h3>Qué tan al día están los datos</h3>
      <div class="desplaza"><table class="compacta">
        <tr><th>Fuente</th><th>Datos hasta</th><th>Se publica</th><th>Estado</th></tr>
        ${F.map(f => `<tr><td>${f.nombre}</td><td>${f.periodo}</td><td>${f.cada <= 1 ? "cada día" : f.cada <= 8 ? "cada semana" : f.cada <= 16 ? "cada quincena" : f.cada <= 31 ? "cada mes" : "cada año"}</td>
          <td>${f.ok ? '<span class="tag ok">Al día</span>' : '<span class="tag def">Atrasado</span>'}</td></tr>`).join("")}
      </table></div>
      <p class="sub">"Al día" = la fuente no ha publicado nada más reciente según su calendario habitual (incluido su retraso normal de publicación). Revisado el ${g[2]} ${MES_CORTO[g[1] - 1]} ${g[0]}; los datos semanales se actualizan solos cada martes.</p>`;
  }

  // ---------- Panel: Fuentes ----------
  function renderFuentes() {
    document.getElementById("tab-fuentes").innerHTML = `
      <h2>Fuentes y metodología</h2>
      ${frescuraHTML()}
      <div class="nota"><b>Estado de los datos:</b> la producción por entidad y el precio medio rural provienen del SIAP (cierre agrícola municipal). Exportación, importación y países provienen de la estadística oficial de comercio exterior (INEGI/SE vía UN Comtrade). Los precios de mayoreo son del SNIIM y los precios al consumidor de PROFECO. El consumo per cápita es el del Panorama Agroalimentario del SIAP y la población, la proyección CONAPO del año analizado. Todas las cifras en uso provienen de fuentes oficiales.</div>
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
        <li><b>Bélgica</b> – selector <i>Ver país…</i>: papa 2024 por provincia de Eurostat; demás productos de FAOSTAT 2024 repartidos por la superficie de la encuesta de explotaciones 2023 (estimado); población de Eurostat al 1 de enero de 2025 y comercio de FAOSTAT.</li>
        <li><b>Grecia</b> – selector <i>Ver país…</i>: producción 2024 por región (periferia) de la Encuesta Agrícola Anual de ELSTAT (último año publicado), población de Eurostat al 1 de enero de 2025 y comercio de FAOSTAT.</li>
        <li><b>Países Bajos</b> – selector <i>Ver país…</i>: producción 2025 por provincia de CBS StatLine (papa y cebolla publicadas; hortalizas de invernadero y campo, fresa, manzana y pera repartidas por superficie de cada cultivo), población de CBS al 1 de enero de 2025 y comercio de FAOSTAT.</li>
        <li><b>Portugal</b> – selector <i>Ver país…</i>: producción 2025 por región NUTS II (versión 2024) de las estadísticas de producción vegetal del INE de Portugal (frutas, papa y tomate para industria; las hortalizas solo tienen dato nacional), población estimada 2025 del INE y comercio de FAOSTAT.</li>
        <li><b>Corea del Sur</b> – selector <i>Ver país…</i>: producción 2024 por provincia (manzana, pera y cebolla 2025) de la Encuesta de producción de cultivos de Estadística de Corea (KOSIS), población registrada de junio de 2026 y comercio de FAOSTAT.</li>
        <li><b>Nueva Zelanda</b> – selector <i>Ver país…</i>: producción nacional de FAOSTAT 2024 repartida por región (16 consejos regionales) según la superficie de frutales y hortalizas de la encuesta agropecuaria 2024 y el censo agropecuario 2022 de Stats NZ (estimado), población estimada 2025 de Stats NZ y comercio de FAOSTAT.</li>
        <li><b>Costa Rica</b> – selector <i>Ver país…</i>: producción nacional 2024 de la Encuesta Nacional Agropecuaria del INEC (o FAOSTAT) repartida por provincia según la superficie del Censo Agropecuario 2014 (estimado), población del Censo 2022 y comercio de FAOSTAT.</li>
        <li><b>Guatemala</b> – selector <i>Ver país…</i>: producción de FAOSTAT 2024 repartida por departamento según la superficie del Mapa de Cobertura y Uso de la Tierra 2020 del MAGA (El Agro en Cifras 2023; estimado), población estimada 2023 del INE y comercio de FAOSTAT.</li>
        <li><b>Honduras</b> – selector <i>Ver país…</i>: producción por departamento del Censo Agropecuario Nacional 2024 del INE (año agrícola 2023-2024, preliminar; banano y plátano de FAOSTAT repartidos según el censo), proyecciones de población 2024 del INE y comercio de FAOSTAT.</li>
        <li><b>Australia</b> – selector <i>Ver país…</i>: producción 2024-25 por estado del ABS (Australian Agriculture: Horticulture, cifras de Hort Innovation) y población del ABS a junio de 2025.</li>
        <li><b>Ecuador</b> – selector <i>Ver país…</i>: producción 2025 por provincia de la ESPAC del INEC y proyección de población 2025 del INEC.</li>
        <li><b>Filipinas</b> – selector <i>Ver país…</i>: producción 2025 por región de la Philippine Statistics Authority (OpenSTAT) y Censo de Población 2024.</li>
        <li><b>Francia</b> – selector <i>Ver país…</i>: producción 2025 (provisional) por región de la Statistique agricole annuelle de Agreste, incluidas las regiones de ultramar; población de Eurostat.</li>
        <li><b>Japón</b> – selector <i>Ver país…</i>: cosecha 2024 por prefectura del Ministerio de Agricultura (MAFF, vía e-Stat); las prefecturas no encuestadas reciben el resto nacional según población (estimado).</li>
        <li><b>Polonia</b> – selector <i>Ver país…</i>: cosecha 2025 de frutas y papa por voivodato del GUS (Bank Danych Lokalnych).</li>
        <li><b>Chile</b> – selector <i>Ver país…</i>: superficie por región de hortalizas (INE, ESH 2024) y frutales (catastros CIREN-ODEPA) para repartir la producción nacional de FAOSTAT 2024 (estimado); papa y tomate industrial con producción oficial por región (INE 2024/25); población del Censo 2024.</li>
        <li><b>Colombia</b> – selector <i>Ver país…</i>: producción oficial por municipio de las Evaluaciones Agropecuarias Municipales (EVA) 2025 del Ministerio de Agricultura y la UPRA (datos.gov.co), sumada por departamento; población de las proyecciones 2025 del DANE (publicadas por el DNP en TerriData) y comercio de FAOSTAT.</li>
        <li><b>Brasil</b> – selector <i>Ver país…</i>: producción oficial por estado de la Producción Agrícola Municipal (PAM) 2025 del IBGE, población estimada 2025 del IBGE (API SIDRA) y comercio de FAOSTAT.</li>
        <li><b>Acceso a mercados</b>: USDA APHIS ACIR y USITC HTS (EE. UU.); CFIA AIRS y CBSA (Canadá); Reglamento (UE) 2019/2072 y EU Access2Markets; DEFRA y UK Trade Tariff (Reino Unido); MAFF y Aduana de Japón; GACC y arancel de China 2026; APQA y arancel de Corea. Consulta: septiembre de 2026.</li>
        <li><b>Competencia en EE. UU.</b>: importaciones mensuales de EE. UU. por país de origen (UN Comtrade, reporte de EE. UU., 2025); calendario comercial con los embarques semanales del USDA por procedencia (National Shipping Point Trends).</li>
        <li><b>Precios en la Unión Europea</b>: precio en empacadora por país productor, semanal 2025 (Comisión Europea, Agri-food data portal); tipos de cambio promedio 2025 de la Reserva Federal (H.10).</li>
        <li><b>Sequía</b>: Monitor de Sequía de México por municipio (CONAGUA / Servicio Meteorológico Nacional), último corte quincenal, cruzado con la producción municipal del SIAP.</li>
        <li><b>Historia de 10 años</b>: producción, exportación e importación 2015–2024 por país (FAOSTAT).</li>
        <li><b>Estados Unidos</b> – selector <i>Ver país…</i>: producción por estado de USDA NASS Quick Stats 2025 (mercado fresco; donde NASS reserva el dato, reparto con la superficie del Censo Agropecuario 2022), población 2025 del Census Bureau y comercio de FAOSTAT, incluida la exportación de México a EE. UU. Precios de mayoreo 2025 de USDA AMS Market News: 11 mercados terminales y precio FOB del producto mexicano en los cruces de Nogales, McAllen y Otay Mesa.</li>
        <li><b>ENIGH 2024 (INEGI, nueva serie)</b>: kilos comprados por los hogares en la semana de referencia, por producto y estado, con el factor de expansión. Da un índice del consumo por persona de cada estado frente al nacional (con pocos hogares en la muestra se acerca a 1) que reparte la demanda nacional entre estados sin cambiar el total. Mide lo que compran los hogares: no incluye restaurantes ni industria. Se puede apagar en el simulador.</li>
        <li><b>FAOSTAT (FAO)</b> – vista <i>Latinoamérica</i>: producción, superficie, exportación e importación (t y USD) y población de 34 países de América Latina y el Caribe, año 2024, desde las descargas masivas de la región Américas. Para comparar países se usa FAOSTAT también para México, cuyas cifras pueden diferir de las del SIAP. El comercio bilateral viene de la matriz detallada de comercio de FAOSTAT: salidas de países latinoamericanos según el exportador y llegadas desde fuera de la región según el importador. La vista <i>Mundo</i> usa los archivos mundiales de FAOSTAT (231 países; sin agregados regionales) y solo lo que reporta cada exportador.</li>
      </ul>
      <h3>Metodología</h3>
      <ul class="fuentes">
        <li><b>Demanda</b> = población CONAPO × consumo per cápita. Por defecto se usa el <b>consumo oficial</b> del Panorama
          Agroalimentario (calculado por el SIAP con datos del año anterior). En el simulador puede cambiarse al <b>consumo aparente</b>
          del año analizado ((producción − exportación + importación) ÷ población). Cuando difieren más de 15%, el balance lo señala:
          en la mayoría de las frutas coinciden de cerca (fresa y arándano quedan por arriba del consumo oficial); en jitomate, chile y cebolla la producción 2025 cayó frente a 2024 sin que bajaran las exportaciones.</li>
        <li><b>Estacionalidad</b>: cosecha mensual (Panorama) contra precio mensual de mayoreo (SNIIM) y consumidor (PROFECO); r = correlación de Pearson
          entre % de cosecha y precio. La cobertura mensual supone exportación proporcional a la cosecha e importación pareja, y no considera almacenamiento.
          El escenario de escalonamiento acerca cada mes al promedio (8.3%) y estima el precio con la pendiente observada precio–cosecha (solo si r ≤ −0.3).</li>
        <li><b>Autosuficiencia</b> = producción / demanda de la entidad. "Abastece a N personas" = producción ÷ consumo per cápita.</li>
        <li><b>Exportación</b>: se atribuye a entidades excedentarias en proporción a su excedente.</li>
        <li><b>Flujos internos</b>: asignación de costo mínimo por distancia carretera aproximada (1.25 × línea recta). Son estimaciones del modelo, no registros de movimiento.</li>
        <li><b>Importación</b>: déficit no cubierto por producción nacional, ingresando por Nuevo Laredo.</li>
      </ul>`;
  }

  // ---------- Titular sobre el mapa: tres cifras clave del producto en la vista activa ----------
  function renderTitular() {
    const el = document.getElementById("titular");
    if (!el) return;
    let ojo, titulo, kpis;
    if (estado.region === "sub") {
      const R = Subnacional.calcular(estado.producto), d = Subnacional.datos();
      ojo = `${d.pais} · ${d.fuenteCorta}`;
      titulo = Subnacional.nombre(estado.producto) + ` <small class="confianza">${Subnacional.confianzaHTML(estado.producto)}</small>`;
      kpis = [[fmtT(R.P.nacional), "producción"], [R.pc.toFixed(1) + " kg", "consumo por persona al año"],
        [R.C ? pct(R.impConsumo) : "—", "de lo que consume es importado"]];
    } else if (estado.region !== "mx") {
      const R = Latam.calcular(estado.producto), D = Latam.datos();
      const f = estado.pais ? R.filas.find(x => x.id === estado.pais) : null;
      titulo = Latam.nombre(estado.producto);
      if (f) {
        ojo = `${f.nombre} · FAOSTAT ${D.anio}`;
        kpis = [[fmtT(f.prod), "producción"], [f.pc != null ? f.pc.toFixed(1) + " kg" : "—", "disponible por persona al año"],
          [f.disp > 0 ? pct(Math.min(1, f.imp / f.disp)) : "—", "de lo que consume es importado"]];
      } else {
        ojo = `${estado.region === "global" ? "Mundo" : "Latinoamérica y el Caribe"} · FAOSTAT ${D.anio}`;
        kpis = [[fmtT(R.T.prod), "producción"], [R.T.pc.toFixed(1) + " kg", "disponible por persona al año"],
          [R.T.disp > 0 ? pct(Math.min(1, R.T.imp / R.T.disp)) : "—", "importado (suma de países)"]];
      }
    } else {
      const n = res.nacional, p = res.producto;
      const consumo = n.produccion - (p.exportacion ?? 0) + (p.importacion ?? 0);
      ojo = `México · SIAP ${window.PRODUCCION_SIAP?.anio ?? ""}`;
      titulo = p.nombre;
      kpis = [[fmtT(n.produccion), "producción"], [res.pc.toFixed(1) + " kg", "consumo por persona al año"],
        [consumo > 0 ? pct(Math.min(1, (p.importacion ?? 0) / consumo)) : "—", "de lo que consume es importado"]];
    }
    el.innerHTML = `<span class="etq">${ojo}</span><h2>${titulo}</h2>
      <div class="kpis-grandes">${kpis.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join("")}</div>`;
  }

  // ---------- Paneles plegables (escritorio) y hoja inferior (móvil) ----------
  const escenarioEl = document.querySelector(".escenario");
  function plegar(clase) {
    escenarioEl.classList.toggle(clase);
    setTimeout(() => { mapa.invalidateSize(); encuadrar(true); }, 280);
  }
  document.getElementById("plegarCatalogo").onclick = () => plegar("sin-catalogo");
  document.getElementById("abrirCatalogo").onclick = () => plegar("sin-catalogo");
  document.getElementById("plegarPanel").onclick = () => plegar("sin-panel");
  document.getElementById("abrirPanel").onclick = () => plegar("sin-panel");
  // El titular va justo debajo de la barra de capas, que puede ocupar una o dos líneas
  const controlesEl = document.querySelector(".controles-mapa");
  new ResizeObserver(() => escenarioEl.style.setProperty("--bajo-controles", controlesEl.offsetTop + controlesEl.offsetHeight + 12 + "px")).observe(controlesEl);
  const panelEl = document.querySelector(".panel");
  function abrirHoja() { if (window.innerWidth <= 900) panelEl.classList.add("expandida"); }
  document.getElementById("asaHoja").onclick = () => panelEl.classList.toggle("expandida");
  document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", abrirHoja));

  // ---------- Orquestación ----------
  function recalcular() { res = Modelo.calcular(estado.producto, escenario()); }

  function render() {
    if (estado.region === "sub") return renderSub();
    if (estado.region !== "mx") return renderLatam();
    if (!window.PRODUCTOS[estado.producto]) estado.producto = "jitomate";  // producto que solo existe en vistas por país
    recalcular();
    // Sin estado elegido, las pestañas Entidad y Exportar muestran el estado que más produce (no siempre Sinaloa)
    if (!estado.entidadElegida) estado.entidad = [...res.filas].sort((a, b) => b.prod - a.prod)[0]?.id ?? estado.entidad;
    indicadores = Resumen.indicadores(estado.escenarios);
    renderLista(); renderResumen();
    dibujarMapa(); renderBalance(); renderExportar(); renderEntidad(); renderSimulador();
    guardarURL();
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
    // La alerta de oferta va justo debajo de las cifras principales, antes de la tabla larga
    if (window.Alerta) (cont.querySelector(".cifras-resumen") ?? cont.lastElementChild)?.insertAdjacentHTML("afterend", Alerta.tableroHTML());
    // Movimientos de precio y embarques de la semana (data/alertas_precio.js), arriba de la alerta de oferta
    if (window.AlertasPrecio) (cont.querySelector(".cifras-resumen") ?? cont.lastElementChild)?.insertAdjacentHTML("afterend", AlertasPrecio.tableroHTML());
    cont.querySelectorAll(".fila-alerta[data-prod]").forEach(b => b.onclick = () => seleccionarProducto(b.dataset.prod, true));
    cont.querySelectorAll(".chip-alerta[data-prod]").forEach(b => b.onclick = () => {
      estado.metricaMx = "oferta"; document.getElementById("metricaMx").value = "oferta"; seleccionarProducto(b.dataset.prod, true);
    });
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
    bal.innerHTML = Latam.productoHTML(R, Subnacional.meta(estado.producto));
    bal.querySelectorAll("tr.clic[data-pais]").forEach(tr => tr.onclick = () => {
      estado.pais = tr.dataset.pais; activarTab("entidad"); dibujarMapa(); renderPaisLatam();
    });
    renderExportarActual();
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
    renderExportarActual();
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
    document.getElementById("ctrlMercadosEUA").hidden = !(region === "sub" && estado.paisSub === "US" && window.PRECIOS_EUA);
    document.getElementById("ctrlEmbarquesEUA").hidden = !(region === "sub" && estado.paisSub === "US" && window.Embarques);
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
    // Punto ámbar si alguna fuente semanal o mensual se atrasó (detalle en la pestaña Fuentes)
    const atrasadas = frescura().filter(f => !f.ok && f.cada <= 31);
    aviso.classList.toggle("atrasado", atrasadas.length > 0);
    aviso.title = `Producción: SIAP ${window.PRODUCCION_SIAP.anio} · ` +
      (window.COMERCIO_OFICIAL ? `Comercio: INEGI/Comtrade ${window.COMERCIO_OFICIAL.anio} · ` : "") +
      (window.PRECIOS_CONSUMIDOR ? `Precios: SNIIM y PROFECO ${window.PRECIOS_CONSUMIDOR.anio} · ` : "") +
      (window.CONSUMO_OFICIAL ? `Consumo: Panorama SIAP ${window.CONSUMO_OFICIAL.publicacion} · Población: CONAPO ${window.POBLACION_CONAPO.anio}` : "");
    if (atrasadas.length) aviso.title += ` · Atrasado: ${atrasadas.map(f => f.nombre).join(", ")}`;
  }

  function seleccionarProducto(k, abrirDetalle = false) {
    estado.producto = k;
    if (abrirDetalle && document.querySelector(".tab.activo")?.dataset.tab === "resumen") activarTab("balance");
    render();
  }

  function activarTab(nombre) {
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("activo", t.dataset.tab === nombre));
    document.querySelectorAll(".pestana").forEach(p => p.classList.toggle("activo", p.id === "tab-" + nombre));
    guardarURL();
  }

  // ---------- Enlaces directos: la vista actual vive en el #hash de la URL ----------
  // #v=mx|latam|global|<código de país>&p=<producto>&m=<métrica>&s=<entidad, país o región seleccionada>&t=<pestaña>
  const idiomaInicial = new URLSearchParams(location.hash.slice(1)).get("l");   // idioma.js se carga después
  let urlLista = false;   // no se escribe el #hash hasta haber leído el del enlace recibido
  const enRecorrido = () => new URLSearchParams(location.hash.slice(1)).has("tour");
  function guardarURL() {
    if (!urlLista || enRecorrido()) return;
    const tab = document.querySelector(".tab.activo")?.dataset.tab;
    const v = estado.region === "sub" ? estado.paisSub : estado.region;
    const sel = estado.region === "sub" ? estado.regionSub : estado.region === "mx" ? (estado.entidadElegida ? estado.entidad : null) : estado.pais;
    const m = estado.region === "sub" ? estado.metricaSub : estado.region === "mx" ? null : estado.metricaLatam;
    const q = new URLSearchParams({ v, p: estado.producto });
    if (m) q.set("m", m);
    if (estado.region === "mx" && estado.nivel === "estatal" && estado.metricaMx !== "auto") q.set("me", estado.metricaMx);
    if (estado.region === "mx" && estado.nivel === "municipal") { q.set("n", "mun"); if (estado.metricaMun !== "produccion") q.set("mm", estado.metricaMun); }
    if (sel) q.set("s", sel);
    if (tab && tab !== "resumen") q.set("t", tab);
    if (estado.mercado && tab === "exportar") q.set("mc", estado.mercado);
    if (window.Idioma ? Idioma.activo() : idiomaInicial === "en") q.set("l", "en");
    // La comparación abierta también viaja en el enlace (antes de que cargue js/comparar.js se conserva la del enlace recibido)
    const cmp = window.Comparar ? Comparar.actual() : new URLSearchParams(location.hash.slice(1)).get("cmp");
    if (cmp) q.set("cmp", cmp);
    try { history.replaceState(null, "", "#" + q.toString()); } catch (e) { /* vista previa sin historial */ }
  }
  function aplicarURL() {
    urlLista = true;
    const q = new URLSearchParams(location.hash.slice(1));
    if (q.has("tour")) { render(); return true; }   // el recorrido (js/recorrido.js) pone cada vista
    return aplicarVista(q);
  }
  // Pone la vista descrita por un enlace directo (v, p, m, s, t, mc, n, mm), venga de donde venga
  function aplicarVista(q) {
    // el código de país se acepta en minúsculas (#v=us) aunque los datos usan mayúsculas (US)
    const v0 = q.get("v"), v = v0 && window.SUBNACIONAL?.[v0.toUpperCase()] ? v0.toUpperCase() : v0;
    if (!v) return false;
    if (q.get("p")) estado.producto = q.get("p");
    estado.mercado = q.get("mc") || null;
    const tab = q.get("t");
    if (v === "latam" || v === "global") {
      if (q.get("m")) { estado.metricaLatam = q.get("m"); document.getElementById("metricaLatam").value = q.get("m"); }
      document.querySelector(`input[name=region][value=${v}]`).checked = true;
      cambiarRegion(v);
      if (q.get("s")) { estado.pais = q.get("s"); dibujarMapa(); renderPaisLatam(); }
    } else if (v !== "mx" && window.SUBNACIONAL?.[v]) {
      if (q.get("m")) { estado.metricaSub = q.get("m"); document.getElementById("metricaSub").value = q.get("m"); }
      estado.paisSub = v;
      document.getElementById("paisSub").value = v;
      cambiarRegion("sub");
      if (q.get("s")) { estado.regionSub = q.get("s"); dibujarMapa(); renderRegionSub(); }
    } else {
      if (q.get("s")) { estado.entidad = q.get("s"); estado.entidadElegida = true; }
      estado.municipio = null;
      estado.metricaMun = q.get("mm") || "produccion";
      estado.metricaMx = q.get("me") || "auto";
      document.getElementById("metricaMx").value = estado.metricaMx;
      document.getElementById("metricaMun").value = estado.metricaMun;
      cambiarNivel(q.get("n") === "mun" && Municipal.disponible() ? "municipal" : "estatal");
      if (estado.region !== "mx") { document.querySelector("input[name=region][value=mx]").checked = true; cambiarRegion("mx"); }
      else render();
    }
    if (tab) activarTab(tab);
    if (estado.mercado) renderMercado();
    guardarURL();
    return true;
  }
  document.getElementById("btnEnlace").onclick = async () => {
    guardarURL();
    const b = document.getElementById("btnEnlace");
    try { await navigator.clipboard.writeText(location.href); b.title = "Enlace copiado"; b.classList.add("copiado"); }
    catch (e) { prompt("Copia este enlace:", location.href); }
    setTimeout(() => { b.classList.remove("copiado"); b.title = "Copiar enlace a esta vista"; }, 1800);
  };

  document.getElementById("buscar").addEventListener("input", e => { filtro.texto = e.target.value; renderLista(); });
  document.querySelectorAll("input[name=tipo]").forEach(r => r.onchange = () => { filtro.tipo = r.value; renderLista(); });

  // Tema claro/oscuro (se guarda por navegador)
  // Ficha en PDF: se imprime la vista actual en tema claro (el mapa oscuro no se imprime bien) con enlace a la vista
  let temaPrevio = null;
  function prepararFicha() {
    guardarURL();
    const hoy = new Date().toLocaleDateString(document.documentElement.lang === "en" ? "en-US" : "es-MX", { year: "numeric", month: "long", day: "numeric" });
    document.getElementById("pieFicha").innerHTML = `<b>Collecta · Mapa Agroalimentario</b> · ${document.querySelector(".aviso").textContent} · ${hoy}<br>${location.href}`;
  }
  window.addEventListener("beforeprint", prepararFicha);
  window.addEventListener("afterprint", () => {
    if (!temaPrevio) return;
    document.documentElement.dataset.theme = temaPrevio; temaPrevio = null;
    Paleta.refrescar(); actualizarBase(); dibujarMapa();
  });
  document.getElementById("btnFicha").onclick = () => {
    if (temaOscuro()) {
      temaPrevio = "dark";
      document.documentElement.dataset.theme = "light";
      Paleta.refrescar(); actualizarBase(); dibujarMapa();
      setTimeout(() => window.print(), 1500);   // tiempo para que carguen los mosaicos claros
    } else window.print();
  };

  document.getElementById("btnTema").onclick = () => {
    const nuevo = temaOscuro() ? "light" : "dark";
    document.documentElement.dataset.theme = nuevo;
    try { localStorage.setItem("tema", nuevo); } catch (e) {}
    Paleta.refrescar();
    actualizarBase();
    dibujarMapa();
  };

  // Menú "⋯" de la cabecera en pantallas angostas (en escritorio los botones se ven en línea)
  const acciones = document.querySelector(".acciones"), btnMas = document.getElementById("btnMas");
  const cerrarMenu = () => { acciones.classList.remove("abierto"); btnMas.setAttribute("aria-expanded", "false"); };
  btnMas.onclick = e => { e.stopPropagation(); const abrir = !acciones.classList.contains("abierto"); acciones.classList.toggle("abierto", abrir); btnMas.setAttribute("aria-expanded", String(abrir)); };
  document.getElementById("menuAcciones").addEventListener("click", () => setTimeout(cerrarMenu, 0));
  document.addEventListener("click", e => { if (!e.target.closest(".acciones")) cerrarMenu(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarMenu(); });

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
  document.getElementById("verVolumen").onchange = dibujarMapa;
  document.getElementById("verImport").onchange = dibujarMapa;
  document.getElementById("verRed").onchange = dibujarMapa;
  document.getElementById("verCentrales").onchange = e => e.target.checked ? capaCentrales.addTo(mapa) : capaCentrales.remove();
  document.querySelectorAll("input[name=nivel]").forEach(r => r.onchange = () => {
    cambiarNivel(r.value); dibujarMapa(); renderEntidad();
  });
  document.getElementById("metricaMun").onchange = e => { estado.metricaMun = e.target.value; dibujarMapa(); };
  document.getElementById("metricaMx").onchange = e => { estado.metricaMx = e.target.value; dibujarMapa(); };
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
  // México más los países con vista por regiones
  document.getElementById("lema").textContent = `Del campo a la mesa · ${Subnacional.paises().length + 1} países`;
  // En el selector se marca el país cuya producción regional es mayormente estimada
  Subnacional.paises().forEach(p => selectorPais.insertAdjacentHTML("beforeend",
    `<option value="${p.codigo}">${p.nombre}${Subnacional.confianza(null, p.codigo).nivel === "estimado" ? " (estimado)" : ""}</option>`));
  selectorPais.onchange = () => {
    if (selectorPais.value) { estado.paisSub = selectorPais.value; cambiarRegion("sub"); }
    else { document.querySelector("input[name=region][value=mx]").checked = true; cambiarRegion("mx"); }
  };
  document.getElementById("metricaSub").onchange = e => { estado.metricaSub = e.target.value; dibujarMapa(); };
  document.getElementById("verImportSub").onchange = dibujarMapa;
  document.getElementById("verMercadosEUA").onchange = dibujarMapa;
  document.getElementById("verEmbarquesEUA").onchange = dibujarMapa;
  actualizarAviso();
  renderFuentes();
  if (!aplicarURL()) render();

  // Para el modo presentación (js/recorrido.js): ir a una vista descrita como enlace directo y volver a escribir la URL
  window.App = {
    irA: vista => { aplicarVista(new URLSearchParams(vista)); encuadrar(true); },
    guardarURL, abrirHoja, render,
    plegarCatalogo: plegado => { if (escenarioEl.classList.contains("sin-catalogo") !== plegado) plegar("sin-catalogo"); },
    catalogoPlegado: () => escenarioEl.classList.contains("sin-catalogo")
  };
})();

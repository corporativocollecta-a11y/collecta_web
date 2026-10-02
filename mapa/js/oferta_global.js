// ============================================================================
// Oferta, demanda y rutas de comercio en el mundo (window.OFERTA_GLOBAL, scripts/analisis_oferta_demanda.py, FAOSTAT):
// qué países producen más de lo que consumen y cuánto, cuáles no se cubren, cuánto se comercia de ida y vuelta y cuánto
// se podrían acortar las rutas si cada país deficitario se abasteciera de los excedentes más cercanos.
// Dos vistas: "mundo" (vista mundial, pestaña Producto) y "mx" (México, pestaña Balance). Carga diferida (~130 kB).
// ============================================================================
(function () {
  const O = () => window.OFERTA_GLOBAL;
  const fmt = n => Math.round(n).toLocaleString("es-MX");
  const fmtT = t => t >= 1e6 ? (t / 1e6).toFixed(2) + " Mt" : t >= 1e3 ? fmt(t / 1e3) + " mil t" : fmt(t) + " t";
  const pct = x => x == null ? "—" : Math.round(x * 100) + "%";
  const km = n => n == null ? "—" : fmt(n) + " km";
  let es = null;
  try { es = new Intl.DisplayNames(["es"], { type: "region" }); } catch (e) { es = null; }
  // nombre en español por ISO (la vista en inglés lo traduce como nombre de país)
  const pais = m => { const iso = O().iso?.[m]; try { return iso && es ? es.of(iso) : O().nombres[m] ?? m; } catch (e) { return O().nombres[m] ?? m; } };
  const lista = os => os.slice(0, 2).map(o => `${pais(o[0])} ${pct(o[2])}`).join(", ") || "—";

  function mundoHTML(k) {
    const p = O()?.productos?.[k];
    if (!p) return '<p class="sub">Sin datos de comercio bilateral para este producto.</p>';
    const A = O().anio;
    return `
      <div class="kpis">
        <div class="kpi"><div class="v">${pct(p.parteComercio)}</div><div class="l">del consumo mundial cruza una frontera (${fmtT(p.comercio)} de ${fmtT(p.consumo)})</div></div>
        <div class="kpi"><div class="v">${pct(p.parteCruzado)}</div><div class="l">del comercio es de ida y vuelta: países que importan lo mismo que exportan (temporadas, reexportación o variedades)</div></div>
        <div class="kpi destacado"><div class="v">${pct(p.ahorro)}</div><div class="l">menos toneladas-kilómetro si cada país con faltante se abasteciera de los excedentes más cercanos (límite teórico)</div></div>
      </div>
      <h4 class="mini">Producen más de lo que consumen</h4>
      <div class="desplaza"><table class="compacta">
        <tr><th>País</th><th class="num">Excedente</th><th class="num">Sobre su consumo</th></tr>
        ${p.excedentes.slice(0, 8).map(([m, t, r]) => `<tr${m === "484" ? ' class="resaltado"' : ""}><td>${pais(m)}</td><td class="num">${fmtT(t)}</td><td class="num">${r == null ? "casi todo se exporta" : r >= 2 ? (r + 1).toFixed(0) + "× su consumo" : "+" + pct(r)}</td></tr>`).join("")}
      </table></div>
      <h4 class="mini">No cubren su consumo</h4>
      <div class="desplaza"><table class="compacta">
        <tr><th>País</th><th class="num">Faltante</th><th class="num">De su consumo</th></tr>
        ${p.deficits.slice(0, 8).map(([m, t, r]) => `<tr${m === "484" ? ' class="resaltado"' : ""}><td>${pais(m)}</td><td class="num">${fmtT(t)}</td><td class="num">${pct(r)}</td></tr>`).join("")}
      </table></div>
      <p class="sub">${p.nExcedente} países con excedente y ${p.nDeficit} con faltante. Consumo aparente = producción − exportación + importación (FAOSTAT ${A}); incluye mermas y usos industriales.</p>
      <h4 class="mini">Dónde se podrían acortar las rutas</h4>
      <div class="desplaza"><table class="compacta">
        <tr><th>Compra</th><th>Hoy le venden</th><th>Más cerca</th></tr>
        ${p.reasignar.slice(0, 8).map(r => `<tr${r.pais === "484" ? ' class="resaltado"' : ""}><td><b>${pais(r.pais)}</b><br><span class="est">${fmtT(r.importa)}</span></td>
          <td>${lista(r.origenesReal)}<br><span class="est">${km(r.kmReal)} en promedio</span></td>
          <td>${r.kmOpt == null ? '<span class="est">ninguno: también exporta (reexportación o temporada)</span>' : `${lista(r.origenesOpt)}<br><span class="est">${km(r.kmOpt)} en promedio</span>`}</td></tr>`).join("")}
      </table></div>
      <p class="sub">Rutas: matriz de comercio de FAOSTAT ${A} (lo que reporta el importador o, si falta, el exportador), distancia en línea recta entre países.
        Hoy cada tonelada recorre en promedio ${km(p.kmMedio)}. El límite teórico resuelve un problema de transporte: abastece la importación neta de cada país
        con la exportación neta de los demás al menor número de toneladas-kilómetro (${fmt(p.tkmOpt)} contra ${fmt(p.tkmReal)} millones).
        Con datos anuales no ve temporadas (un país importa en su contraestación lo que exporta en su cosecha), variedades, calidad, contratos, precios ni acceso
        fitosanitario: indica dónde hay rutas largas que vale la pena revisar, no un plan.</p>
      ${p.mexico ? `<h4 class="mini">México</h4>${mexicoHTML(k, true)}` : ""}`;
  }

  function mexicoHTML(k, enMundo) {
    const p = O()?.productos?.[k], mx = p?.mexico;
    if (!mx) return '<p class="sub">México no registra comercio de este producto en FAOSTAT.</p>';
    const A = O().anio;
    const neto = mx.neto;
    const exc = p.excedentes.find(e => e[0] === "484"), def = p.deficits.find(e => e[0] === "484");
    const filas = (os, col) => os.map(o => `<tr><td>${pais(o[0])}</td><td class="num">${fmtT(o[1])}</td><td class="num">${pct(o[2])}</td><td class="num">${km(o[3])}</td></tr>`).join("");
    return `
      <div class="kpis">
        <div class="kpi destacado"><div class="v">${neto >= 0 ? "Excedente" : "Faltante"} ${fmtT(Math.abs(neto))}</div>
          <div class="l">${neto >= 0 ? `México exporta más de lo que importa${exc?.[2] != null ? ` (${pct(exc[2])} de su consumo)` : ""}` : `México importa más de lo que exporta${def?.[2] != null ? ` (${pct(def[2])} de su consumo)` : ""}`}</div></div>
        <div class="kpi"><div class="v">${fmtT(mx.importa)}</div><div class="l">importa${mx.kmImport ? `, a ${km(mx.kmImport)} en promedio` : ""}</div></div>
        <div class="kpi"><div class="v">${fmtT(mx.exporta)}</div><div class="l">exporta</div></div>
      </div>
      ${mx.origenesReal.length ? `<h4 class="mini">De dónde importa México</h4>
      <div class="desplaza"><table class="compacta"><tr><th>Origen</th><th class="num">Toneladas</th><th class="num">Parte</th><th class="num">Distancia</th></tr>${filas(mx.origenesReal)}</table></div>
      <p class="sub">${neto >= 0 ? "Como México tiene excedente, en el límite teórico no importaría: lo que compra es de temporada, de otra variedad o para reexportar."
        : mx.origenesOpt.length ? `En el reparto de menor distancia para todo el mundo, el faltante de México vendría de ${mx.origenesOpt.map(o => `${pais(o[0])} (${km(o[3])})`).join(", ")}: los excedentes más cercanos ya cubren a otros países con menos distancia.` : ""}</p>` : ""}
      ${mx.destinos.length ? `<h4 class="mini">A dónde vende México</h4>
      <div class="desplaza"><table class="compacta"><tr><th>Destino</th><th class="num">Toneladas</th><th class="num">Parte</th><th class="num">Distancia</th></tr>${filas(mx.destinos)}</table></div>
      ${mx.destinosOpt.length ? `<p class="sub">En el reparto de menor distancia, el excedente de México iría a ${mx.destinosOpt.map(o => `${pais(o[0])} (${pct(o[2])})`).join(", ")}.</p>` : ""}` : ""}
      <p class="sub">FAOSTAT ${A}, matriz de comercio por país de origen y destino; las cifras de comercio pueden diferir de las de INEGI que usa el resto del panel.${enMundo ? "" : `
        Detalle mundial en la vista Mundo, pestaña Producto.`}</p>`;
  }

  function llenar(el) {
    el.dataset.lleno = "1";
    const { k, vista } = el.dataset;
    const pintar = () => { el.innerHTML = vista === "mx" ? mexicoHTML(k) : mundoHTML(k); };
    const bajar = () => window.Paleta.cargar("data/oferta_global.js", () => !!window.OFERTA_GLOBAL).then(pintar)
      .catch(() => { el.innerHTML = '<p class="sub">No se pudo cargar el análisis mundial.</p>'; });
    window.Seccion ? window.Seccion.alAbrir(el, bajar) : bajar();
  }
  const revisar = raiz => raiz.querySelectorAll?.("[data-oferta]:not([data-lleno='1'])").forEach(llenar);
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) { if (n.matches?.("[data-oferta]:not([data-lleno='1'])")) llenar(n); revisar(n); } })))
    .observe(document.body, { childList: true, subtree: true });

  window.OfertaGlobal = { marca: (k, vista = "mundo") => `<div data-oferta data-k="${k}" data-vista="${vista}"><span class="sub">Cargando el análisis mundial…</span></div>` };
})();

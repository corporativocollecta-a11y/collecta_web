// ============================================================================
// Vista por mercado de destino (pestaña Exportar): un país comprador visto desde México.
// - Qué frutas y hortalizas importa y a quién se las compra: FAOSTAT, matriz detallada de comercio según lo que reporta
//   el propio comprador (window.MERCADOS, scripts/procesar_mercados.py; carga diferida).
// - Cuánto paga por kilo (valor ÷ volumen importado) y la parte que le vende México.
// - Acceso y arancel para México (window.ACCESO) si el país está entre los 7 mercados revisados.
// - Productos con oportunidad: lo que compra fuera de México en productos que México ya exporta, sin acceso cerrado,
//   ordenado por valor y por lo que paga frente al precio medio de exportación de México (FAOSTAT, window.GLOBAL).
// ============================================================================
(function () {
  const MX = "484";
  const fmt = n => Math.round(n).toLocaleString("es-MX");
  const fmtT = t => t >= 1e6 ? (t / 1e6).toFixed(2) + " Mt" : t >= 1e3 ? fmt(t / 1e3) + " mil t" : fmt(t) + " t";
  const usd = miles => { const v = miles * 1000; return v >= 1e9 ? "US$" + (v / 1e9).toFixed(2) + " mil M" : v >= 1e6 ? "US$" + fmt(v / 1e6) + " M" : v > 0 ? "< US$1 M" : "—"; };
  const pct = x => x > 0 && x < 0.01 ? "<1%" : (x * 100).toFixed(0) + "%";
  const G = () => window.GLOBAL;
  const M = () => window.MERCADOS;
  let nombresES = null;
  try { nombresES = new Intl.DisplayNames(["es"], { type: "region" }); } catch (e) { nombresES = null; }
  const nombrePais = id => {
    if (id === "otros") return "Otros";
    const p = G()?.paises?.[id];
    try { return (p?.iso && nombresES?.of(p.iso)) || p?.nombre || id; } catch (e) { return p?.nombre ?? id; }
  };
  const meta = k => window.PRODUCTOS?.[k] ?? window.PRODUCTOS_PAISES?.[k];
  const nombreProd = k => G()?.productos?.[k]?.nombre ?? window.LATAM?.productos?.[k]?.nombre ?? meta(k)?.nombre ?? k;
  const color = k => meta(k)?.color ?? "var(--productor)";
  const S = (id, html, resumen, op) => window.Seccion ? window.Seccion.envolver("mc-" + id, html, resumen, op) : html;
  const barra = (n, v, max, txt, resaltar) => `<div class="barra-h"><span class="n">${n}</span><span class="b"><i style="width:${Math.min(100, v / (max || 1) * 100)}%${resaltar ? ";background:var(--c-importa)" : ""}"></i></span><span class="x">${txt}</span></div>`;

  const cargar = () => M() ? Promise.resolve() : window.Paleta.cargar("data/mercados.js", () => !!window.MERCADOS);

  // Países compradores para el selector: los que más importan en estas frutas y hortalizas (FAOSTAT, sin cargar MERCADOS)
  let listaCache = null;
  function lista() {
    if (listaCache) return listaCache;
    const tot = {};
    Object.values(G()?.productos ?? {}).forEach(P => Object.entries(P.datos).forEach(([id, d]) => { if (id !== MX) tot[id] = (tot[id] ?? 0) + (d[5] || 0); }));
    listaCache = Object.entries(tot).filter(([, v]) => v >= 100000).sort((a, b) => b[1] - a[1]).slice(0, 70).map(([id]) => id)
      .sort((a, b) => nombrePais(a).localeCompare(nombrePais(b), "es"));
    return listaCache;
  }
  const en = () => document.documentElement.lang === "en";   // el traductor no toca el atributo label de <optgroup>
  const DESTACADOS = ["840", "124", "276", "826", "250", "528", "724", "392", "156", "410"];
  function selectorHTML(actual) {
    if (!G()) return "";
    const opcion = id => `<option value="${id}"${id === actual ? " selected" : ""}>${nombrePais(id)}</option>`;
    return `
      <div class="selector-mercado-caja">
        <label for="selMercado"><b>Ver un mercado de destino</b><span class="sub">Qué importa un país, a quién le compra, cuánto paga y dónde tiene oportunidad México.</span></label>
        <select class="selector-mercado" id="selMercado">
          <option value="">Elige un país comprador…</option>
          <optgroup label="${en() ? "Main buyers" : "Principales"}">${DESTACADOS.filter(id => G().paises[id]).map(opcion).join("")}</optgroup>
          <optgroup label="${en() ? "All" : "Todos"}">${lista().map(opcion).join("")}</optgroup>
        </select>
      </div>`;
  }

  // Datos de un mercado: por producto, importación, precio, parte de México, primer proveedor, acceso y oportunidad
  function calcular(id) {
    const m = M()?.mercados?.[id];
    if (!m) return null;
    const iso = G()?.paises?.[id]?.iso;
    const filas = Object.entries(m).map(([k, [t, u, espejo, prov]]) => {
      const mx = prov.find(p => p[0] === MX);
      const mxT = mx?.[1] ?? 0, mxU = mx?.[2] ?? 0;
      const primero = prov.find(p => p[0] !== "otros");
      const G_mx = G()?.productos?.[k]?.datos?.[MX];
      const mxExpU = G_mx?.[4] ?? 0, mxExpT = G_mx?.[2] ?? 0;
      const acc = window.Acceso?.celda(k, iso) ?? null;
      const precio = t > 0 ? u / t : null;            // miles de US$ por t = US$ por kg
      const precioMX = mxExpT > 0 ? mxExpU / mxExpT : null;
      return { k, t, u, espejo, prov, precio, mxT, mxU, parteMX: u > 0 ? mxU / u : 0, libreU: Math.max(0, u - mxU),
        primero, mxExpU, precioMX, acc, relPrecio: precio && precioMX ? precio / precioMX : null };
    }).filter(f => ["Fruta", "Hortaliza", "Grano"].includes(meta(f.k)?.tipo));   // sin café ni cacao ("Otros cultivos")
    const U = filas.reduce((s, f) => s + f.u, 0), T = filas.reduce((s, f) => s + f.t, 0);
    const mxU = filas.reduce((s, f) => s + f.mxU, 0);
    // Oportunidad: compra fuera de México ≥ US$5 M, México exporta ≥ US$20 M de ese producto al mundo, acceso no cerrado
    const opp = filas.filter(f => f.libreU >= 5000 && f.mxExpU >= 20000 && f.acc?.estado !== "cerrado")
      .map(f => ({ ...f, puntos: f.libreU * Math.min(2, Math.max(0.5, f.relPrecio ?? 1)) * (f.acc?.estado === "con_condiciones" ? 0.8 : 1) }))
      .sort((a, b) => b.puntos - a.puntos).slice(0, 8);
    const proveedores = {};
    filas.forEach(f => f.prov.forEach(([p, , u]) => { proveedores[p] = (proveedores[p] ?? 0) + u; }));
    return { id, iso, filas: filas.sort((a, b) => b.u - a.u), U, T, mxU, opp, espejo: filas.some(f => f.espejo),
      proveedores: Object.entries(proveedores).sort((a, b) => a[0] === "otros" ? 1 : b[0] === "otros" ? -1 : b[1] - a[1]),
      mercadoAcceso: window.Acceso?.mercadoDe(iso) ?? null };
  }

  const etiquetaAcceso = f => f.acc ? window.Acceso.etiqueta(f.acc) : '<span class="est">—</span>';
  const arancel = f => { if (!f.acc) return ""; const en = document.documentElement.lang === "en"; return (en && f.acc.arancel_en) || f.acc.arancel || ""; };

  function html(R, k) {
    const nombre = nombrePais(R.id);
    const f = R.filas.find(x => x.k === k);
    const provMax = R.proveedores.find(p => p[0] !== "otros")?.[1] ?? 1;
    const mxLugar = R.proveedores.filter(p => p[0] !== "otros").findIndex(p => p[0] === MX) + 1;
    const accesoResumen = R.mercadoAcceso ? (() => {
      const cuenta = { abierto: 0, con_condiciones: 0, cerrado: 0 };
      R.filas.forEach(x => { if (x.acc) cuenta[x.acc.estado] = (cuenta[x.acc.estado] ?? 0) + 1; });
      return cuenta;
    })() : null;
    const razon = o => `Paga US$${o.precio.toFixed(2)} el kg${o.relPrecio ? `, ${o.relPrecio.toFixed(1)}× el precio medio de exportación de México` : ""}${o.parteMX >= 0.005 ? `; México ya le vende ${pct(o.parteMX)}` : ""}`;
    return `
      <p class="sub"><a href="#" data-mc="volver">← Exportar</a> · Mercado de destino</p>
      <h2>${nombre} como comprador</h2>
      <p class="sub"><span class="tag ok">FAOSTAT ${M().anio}</span> Lo que reporta ${nombre} como importación, en ${R.filas.length} frutas y hortalizas del mapa.</p>
      ${selectorHTML(R.id)}
      <div class="kpis">
        <div class="kpi"><div class="v">${usd(R.U)}</div><div class="l">importa al año (${fmtT(R.T)}) · US$${(R.U / (R.T || 1)).toFixed(2)} el kg en promedio</div></div>
        <div class="kpi"><div class="v">${pct(R.mxU / (R.U || 1))}</div><div class="l">le compra a México (${usd(R.mxU)})${mxLugar ? ` · lugar ${mxLugar} entre sus proveedores` : ""}</div></div>
        <div class="kpi destacado"><div class="v">${R.opp.length ? `${R.opp.length} productos con oportunidad` : "Sin oportunidades claras"}</div>
          <div class="l">${R.opp.length ? `Compra ${usd(R.opp.reduce((s, o) => s + o.libreU, 0))} fuera de México en productos que México ya exporta y que puede venderle.` : "En lo que México exporta, este mercado ya le compra a México, compra poco o tiene el acceso cerrado."}</div></div>
      </div>
      ${R.opp.length ? S("oportunidad", `<h3>Productos con oportunidad para México</h3>
        <div class="desplaza"><table class="compacta">
          <tr><th>Producto</th><th class="num">Compra fuera de México</th><th>Acceso</th></tr>
          ${R.opp.map(o => `<tr class="clic" data-mc-prod="${o.k}"><td><span class="prod"><i style="background:${color(o.k)}"></i>${nombreProd(o.k)}</span><span class="est razon">${razon(o)}</span></td>
            <td class="num">${usd(o.libreU)}</td>
            <td>${etiquetaAcceso(o)}${arancel(o) ? `<span class="est razon"${window.Acceso.tn()}>${arancel(o)}</span>` : ""}</td></tr>`).join("")}
        </table></div>
        <p class="sub">Productos que ${nombre} compra a otros proveedores por al menos US$5 M, que México ya exporta (al menos US$20 M al año) y sin acceso cerrado para México. Se ordenan por lo que compra fuera de México y por lo que paga frente al precio medio de exportación de México; "con condiciones" pesa menos. Toca un producto para verlo en el mapa.</p>`,
        `${nombreProd(R.opp[0].k)}: ${usd(R.opp[0].libreU)} fuera de México`, { abierta: true }) : ""}
      ${f ? S("producto", `<h3>${nombreProd(k)} en ${nombre}</h3>
        <div class="kpis">
          <div class="kpi"><div class="v">${usd(f.u)}</div><div class="l">importa (${fmtT(f.t)})</div></div>
          <div class="kpi"><div class="v">US$${f.precio?.toFixed(2) ?? "—"}</div><div class="l">paga por kilo${f.precioMX ? ` · México exporta a US$${f.precioMX.toFixed(2)} en promedio` : ""}</div></div>
        </div>
        <h4 class="mini">A quién se lo compra</h4>
        ${f.prov.map(([p, t, u]) => barra(nombrePais(p), u, f.prov[0][2], `${pct(u / (f.u || 1))}`, p === MX)).join("")}
        ${window.Acceso?.mercadoHTML(k, R.iso) ? `<h4 class="mini">Acceso para México</h4>${window.Acceso.mercadoHTML(k, R.iso)}` : ""}`,
        `México vende ${pct(f.parteMX)} · primer proveedor: ${nombrePais(f.primero?.[0])}`, { abierta: true }) : ""}
      ${S("importa", `<h3>Qué importa</h3>
        <div class="desplaza"><table class="compacta">
          <tr><th>Producto</th><th class="num">Importa</th><th class="num">US$/kg</th><th class="num">De México</th><th>Primer proveedor</th></tr>
          ${R.filas.map(x => `<tr class="clic${x.k === k ? " resaltado" : ""}" data-mc-prod="${x.k}"><td><span class="prod"><i style="background:${color(x.k)}"></i>${nombreProd(x.k)}</span></td>
            <td class="num">${usd(x.u)}<br><span class="est">${fmtT(x.t)}</span></td><td class="num">${x.precio != null ? x.precio.toFixed(2) : "—"}</td>
            <td class="num">${x.parteMX > 0.005 ? pct(x.parteMX) : "—"}</td><td>${x.primero ? nombrePais(x.primero[0]) : "—"}</td></tr>`).join("")}
        </table></div>`, `Lo que más compra: ${nombreProd(R.filas[0].k)}, ${usd(R.filas[0].u)}`)}
      ${S("proveedores", `<h3>A quién le compra</h3>
        ${R.proveedores.slice(0, 10).map(([p, u]) => barra(nombrePais(p), u, provMax, pct(u / (R.U || 1)), p === MX)).join("")}
        <p class="sub">Suma de los productos del mapa, por valor. En naranja, México.</p>`,
        `Primer proveedor: ${nombrePais(R.proveedores[0][0])}, ${pct(R.proveedores[0][1] / (R.U || 1))} del valor`)}
      ${accesoResumen ? S("acceso", `<h3>Acceso y aranceles para México</h3>
        <div class="desplaza"><table class="acceso compacta">
          <tr><th>Producto</th><th>Situación</th><th>Arancel</th></tr>
          ${R.filas.filter(x => x.acc).map(x => `<tr><td>${nombreProd(x.k)}</td><td>${window.Acceso.etiqueta(x.acc)}</td><td class="est"${window.Acceso.tn()}>${arancel(x)}</td></tr>`).join("")}
        </table></div>
        <p class="sub">Revisión de acceso fitosanitario y arancel para producto fresco de origen México (${window.ACCESO.actualizado}). En la pestaña Exportar de cada producto está el requisito y la fuente.</p>`,
        `Abierto en ${accesoResumen.abierto}, con condiciones en ${accesoResumen.con_condiciones} y cerrado en ${accesoResumen.cerrado} productos`) : ""}
      <p class="sub">Fuente: FAOSTAT, matriz detallada de comercio ${M().anio}, según lo que reporta ${nombre} como importador${R.espejo ? " (donde no reporta, lo que declaran sus proveedores)" : ""}. Precio = valor ÷ volumen importado. ${R.mercadoAcceso ? "" : "Este país no está entre los 7 mercados con revisión de acceso."}</p>`;
  }

  function pintar(cont, id, k, cb) {
    if (!M()) {
      cont.innerHTML = `<p class="sub"><a href="#" data-mc="volver">← Exportar</a></p><p class="sub">Cargando el mercado de ${nombrePais(id)}…</p>`;
      cont.querySelector("[data-mc=volver]").onclick = e => { e.preventDefault(); cb.volver(); };
      cargar().then(() => pintar(cont, id, k, cb)).catch(() => { cont.innerHTML += '<p class="sub">No se pudo cargar data/mercados.js.</p>'; });
      return;
    }
    const R = calcular(id);
    cont.innerHTML = R ? html(R, k)
      : `<p class="sub"><a href="#" data-mc="volver">← Exportar</a></p><h2>${nombrePais(id)}</h2><p class="sub">Sin registros de importación de estas frutas y hortalizas en FAOSTAT ${M().anio} (solo se incluyen países que compran al menos US$20 M al año).</p>${selectorHTML(id)}`;
    cont.querySelector("[data-mc=volver]").onclick = e => { e.preventDefault(); cb.volver(); };
    cont.querySelectorAll("[data-mc-prod]").forEach(tr => tr.onclick = () => cb.producto(tr.dataset.mcProd));
    const sel = cont.querySelector("select.selector-mercado");
    if (sel) sel.onchange = () => { if (sel.value) cb.mercado(sel.value); };
  }

  window.Mercado = { selectorHTML: () => selectorHTML(null), pintar, calcular, cargar, nombrePais };
})();

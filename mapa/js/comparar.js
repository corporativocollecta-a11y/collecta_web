// ============================================================================
// Comparar lado a lado: dos países (un producto), dos productos (un país) o dos estados de México (un producto),
// con las cifras clave y las series de 10 años en la misma gráfica.
// - Países y productos: FAOSTAT 2024 (window.GLOBAL) y serie 2015–2024 (window.HISTORIA, js/historia.js).
// - Estados: SIAP 2025 (modelo del mapa, producción municipal, sequía) y serie 2016–2025 (window.HISTORIA_ESTADOS,
//   scripts/procesar_historia_estados.py; carga diferida).
// Enlace directo: #…&cmp=<modo>.<A>.<B>.<producto o país>  (ej. cmp=paises.484.604.arandano)
// ============================================================================
(function () {
  const fmt = n => Math.round(n).toLocaleString("es-MX");
  const fmtT = t => t == null ? "—" : t >= 1e6 ? (t / 1e6).toFixed(2) + " Mt" : t >= 1e3 ? fmt(t / 1e3) + " mil t" : fmt(t) + " t";
  const usd = miles => { if (miles == null) return "—"; const v = miles * 1000; return v >= 1e9 ? "US$" + (v / 1e9).toFixed(2) + " mil M" : v >= 1e6 ? "US$" + fmt(v / 1e6) + " M" : v > 0 ? "< US$1 M" : "—"; };
  const mxnG = v => v == null ? "—" : v >= 1e9 ? "$" + (v / 1e9).toFixed(2) + " mil M" : "$" + fmt(v / 1e6) + " M";
  const pct = x => x == null ? "—" : (x * 100).toFixed(0) + "%";
  const pctVar = x => x == null ? "—" : (x >= 0 ? "+" : "−") + Math.abs(x * 100).toFixed(0) + "%";
  const G = () => window.GLOBAL;
  let nombresES = null;
  try { nombresES = new Intl.DisplayNames(["es"], { type: "region" }); } catch (e) { nombresES = null; }
  const nombrePais = id => { const p = G()?.paises?.[id]; try { return (p?.iso && nombresES?.of(p.iso)) || p?.nombre || id; } catch (e) { return p?.nombre ?? id; } };
  const meta = k => window.PRODUCTOS?.[k] ?? window.PRODUCTOS_PAISES?.[k];
  const nombreProd = k => G()?.productos?.[k]?.nombre ?? window.LATAM?.productos?.[k]?.nombre ?? meta(k)?.nombre ?? k;
  const nombreEstado = id => window.ESTADOS?.find(e => e.id === id)?.nombre ?? id;
  const COLOR = ["var(--productor)", "var(--c-importa)"];

  const MODOS = { paises: "Dos países", productos: "Dos productos", estados: "Dos estados" };
  const DEF = { paises: ["484", "604", "arandano"], productos: ["jitomate", "aguacate", "484"], estados: ["16", "14", "aguacate"] };
  let modo = "paises", sel = { ...DEF }, caja = null;

  // ---------- Datos ----------
  // FAOSTAT: [prod, ha, exp, imp, expUSD, impUSD] por país y producto; lugares mundiales en producción y exportación
  function filaFAO(k, id) {
    const P = G()?.productos?.[k];
    const d = P?.datos?.[id];
    if (!d) return null;
    const [prod, ha, exp, imp, expUSD, impUSD] = d;
    const todos = Object.entries(P.datos);
    const lugar = i => 1 + todos.filter(([, x]) => (x[i] || 0) > (d[i] || 0)).length;
    const totExpUSD = todos.reduce((s, [, x]) => s + (x[4] || 0), 0);
    const disp = Math.max(0, prod - exp + imp), pob = G().paises[id]?.pob;
    const serie = window.HISTORIA?.productos?.[k]?.[id];
    return { prod, ha, exp, imp, expUSD, impUSD, rend: ha > 0 ? prod / ha : null, precioExp: exp > 0 ? expUSD / exp : null,
      lugarProd: prod > 0 ? lugar(0) : null, lugarExp: expUSD > 0 ? lugar(4) : null, parteExp: totExpUSD > 0 ? expUSD / totExpUSD : 0,
      auto: disp > 0 ? prod / disp : null, pc: pob && disp ? disp * 1000 / pob : null,
      serieProd: serie?.[0], serieExp: serie?.[1], cambioProd: serie ? window.Historia.cambio(serie[0]) : null,
      cambioExp: serie && serie[1].some(v => v > 0) ? window.Historia.cambio(serie[1]) : null };
  }
  // SIAP por estado: modelo del mapa (producción, demanda), producción municipal (ha, valor) y sequía
  function filaEstado(k, id) {
    const R = window.Modelo.calcular(k, {});
    const f = R.filas.find(x => x.id === id);
    if (!f) return null;
    const orden = [...R.filas].sort((a, b) => b.prod - a.prod);
    let ha = 0, valor = 0;
    Object.entries(window.PRODUCCION_MUNICIPAL?.productos?.[k] ?? {}).forEach(([cve, [, h, v]]) => { if (cve.slice(0, 2) === id) { ha += h; valor += v; } });
    const s = window.HISTORIA_ESTADOS?.productos?.[k]?.[id];
    const seq = window.Sequia?.exposicion(k, id);
    return { prod: f.prod, demanda: f.demanda, auto: f.autosuf, pob: f.pob, lugar: f.prod > 0 ? orden.findIndex(x => x.id === id) + 1 : null,
      parte: R.nacional.produccion > 0 ? f.prod / R.nacional.produccion : 0, ha, rend: ha > 0 ? f.prod / ha : null, valor,
      precioRural: f.prod > 0 && valor > 0 ? valor / f.prod / 1000 : null, sequia: seq ? seq.conSequia / seq.total : null,
      serieProd: s?.[0], serieRend: s ? s[0].map((t, i) => s[1][i] > 0 ? t / s[1][i] : null) : null,
      cambioProd: s ? window.Historia.cambio(s[0]) : null };
  }

  // ---------- Gráfica de líneas: dos series (A y B) en la misma escala, o como índice (primeros 2 años = 100) ----------
  function grafica(titulo, anios, series, formato, indice) {
    const validas = series.filter(s => s.v?.some(x => x != null && x > 0));
    if (!validas.length) return "";
    const base = v => { const b = (v[0] + v[1]) / 2; return b > 0 ? v.map(x => x == null ? null : x / b * 100) : null; };
    const datos = validas.map(s => ({ ...s, v: indice ? base(s.v) : s.v })).filter(s => s.v);
    const vals = datos.flatMap(s => s.v.filter(x => x != null));
    const max = Math.max(...vals, 1) * 1.08;
    const W = 320, H = 130, x = i => 34 + i * (W - 42) / (anios.length - 1), y = v => H - 18 - v / max * (H - 28);
    // Años sin dato cortan la línea en tramos (no se unen con una recta engañosa)
    const linea = s => {
      const tramos = [[]];
      s.v.forEach((v, i) => { if (v == null) { if (tramos.at(-1).length) tramos.push([]); } else tramos.at(-1).push(`${x(i).toFixed(1)},${y(v).toFixed(1)}`); });
      const ult = tramos.filter(t => t.length).at(-1)?.at(-1);
      return tramos.filter(t => t.length).map(t => t.length > 1 ? `<polyline points="${t.join(" ")}" fill="none" stroke="${s.c}" stroke-width="2.4" stroke-linejoin="round"/>`
        : `<circle cx="${t[0].split(",")[0]}" cy="${t[0].split(",")[1]}" r="2.4" fill="${s.c}"/>`).join("") +
        (ult ? `<circle cx="${ult.split(",")[0]}" cy="${ult.split(",")[1]}" r="3.2" fill="${s.c}"/>` : "");
    };
    const eje = f => `<line x1="34" x2="${W - 6}" y1="${y(max / 1.08 * f)}" y2="${y(max / 1.08 * f)}" stroke="var(--linea)"/><text x="0" y="${y(max / 1.08 * f) + 3}">${indice ? Math.round(max / 1.08 * f) : formato(max / 1.08 * f)}</text>`;
    return `
      <figure class="cmp-grafica">
        <figcaption>${titulo}${indice ? " · índice, primeros dos años = 100" : ""}</figcaption>
        <svg class="estac" viewBox="0 0 ${W} ${H}" role="img" aria-label="${titulo}">
          ${[0.5, 1].map(eje).join("")}
          ${datos.map(linea).join("")}
          ${anios.map((a, i) => i % 3 === 0 || i === anios.length - 1 ? `<text x="${x(i)}" y="${H - 3}" text-anchor="${i === anios.length - 1 ? "end" : "middle"}">${a}</text>` : "").join("")}
        </svg>
        <div class="leyenda-cadena">${datos.map(s => `<span><i style="background:${s.c}"></i>${s.n}</span>`).join("")}</div>
      </figure>`;
  }
  const corto = v => fmtT(v).replace(" mil t", "k").replace(" Mt", "M").replace(" t", "");

  // ---------- Tabla de cifras: indicador | A | B ----------
  function tabla(nombres, filas) {
    return `<div class="desplaza"><table class="cmp-tabla">
      <tr><th>Indicador</th><th class="num"><i class="cmp-punto" style="background:${COLOR[0]}"></i>${nombres[0]}</th><th class="num"><i class="cmp-punto" style="background:${COLOR[1]}"></i>${nombres[1]}</th></tr>
      ${filas.filter(Boolean).map(([etq, a, b, mayor]) => `<tr><td>${etq}</td><td class="num${mayor === 0 ? " gana" : ""}">${a}</td><td class="num${mayor === 1 ? " gana" : ""}">${b}</td></tr>`).join("")}
    </table></div>`;
  }
  // Cuál de los dos valores es mayor (para resaltarlo); null si no aplica
  const mayor = (a, b, menorGana) => a == null || b == null || a === b ? null : (a > b) !== !!menorGana ? 0 : 1;

  function cuerpoPaises() {
    const [a, b, k] = sel.paises;
    const A = filaFAO(k, a), B = filaFAO(k, b), n = [nombrePais(a), nombrePais(b)];
    if (!A && !B) return `<p class="sub">Sin datos de FAOSTAT para ${nombreProd(k).toLowerCase()} en estos países.</p>`;
    const v = (o, c) => o?.[c] ?? null;
    const anios = window.Historia.anios();
    return `
      ${tarjetas(n, [A, B].map(o => o ? [fmtT(o.prod), `producción ${G().anio}${o.lugarProd ? ` · lugar ${o.lugarProd} mundial` : ""}`] : ["—", "sin dato"]))}
      ${tabla(n, [
        ["Producción", fmtT(v(A, "prod")), fmtT(v(B, "prod")), mayor(v(A, "prod"), v(B, "prod"))],
        ["Superficie cosechada", A?.ha ? fmt(A.ha) + " ha" : "—", B?.ha ? fmt(B.ha) + " ha" : "—", mayor(v(A, "ha"), v(B, "ha"))],
        ["Rendimiento", A?.rend ? A.rend.toFixed(1) + " t/ha" : "—", B?.rend ? B.rend.toFixed(1) + " t/ha" : "—", mayor(v(A, "rend"), v(B, "rend"))],
        ["Exportación", fmtT(v(A, "exp")), fmtT(v(B, "exp")), mayor(v(A, "exp"), v(B, "exp"))],
        ["Valor exportado", usd(v(A, "expUSD")), usd(v(B, "expUSD")), mayor(v(A, "expUSD"), v(B, "expUSD"))],
        ["Parte de la exportación mundial", pct(v(A, "parteExp")), pct(v(B, "parteExp")), mayor(v(A, "parteExp"), v(B, "parteExp"))],
        ["Lugar como exportador", A?.lugarExp ?? "—", B?.lugarExp ?? "—", mayor(v(A, "lugarExp"), v(B, "lugarExp"), true)],
        ["Precio medio de exportación", A?.precioExp ? "US$" + A.precioExp.toFixed(2) + "/kg" : "—", B?.precioExp ? "US$" + B.precioExp.toFixed(2) + "/kg" : "—", mayor(v(A, "precioExp"), v(B, "precioExp"))],
        ["Importación", fmtT(v(A, "imp")), fmtT(v(B, "imp")), null],
        ["Autosuficiencia", pct(v(A, "auto")), pct(v(B, "auto")), mayor(v(A, "auto"), v(B, "auto"))],
        ["Disponible por persona", A?.pc != null ? A.pc.toFixed(1) + " kg" : "—", B?.pc != null ? B.pc.toFixed(1) + " kg" : "—", null],
        ["Producción en 10 años", pctVar(v(A, "cambioProd")), pctVar(v(B, "cambioProd")), mayor(v(A, "cambioProd"), v(B, "cambioProd"))],
        ["Exportación en 10 años", pctVar(v(A, "cambioExp")), pctVar(v(B, "cambioExp")), mayor(v(A, "cambioExp"), v(B, "cambioExp"))]
      ])}
      <div class="cmp-graficas">
        ${grafica(`Producción de ${nombreProd(k).toLowerCase()}`, anios, [{ n: n[0], v: A?.serieProd, c: COLOR[0] }, { n: n[1], v: B?.serieProd, c: COLOR[1] }], corto)}
        ${grafica(`Exportación de ${nombreProd(k).toLowerCase()}`, anios, [{ n: n[0], v: A?.serieExp, c: COLOR[0] }, { n: n[1], v: B?.serieExp, c: COLOR[1] }], corto)}
      </div>
      <p class="sub">FAOSTAT ${G().anio} y serie ${anios[0]}–${anios.at(-1)}. En la columna con el valor mayor, la cifra se resalta. Cambio en 10 años: promedio de los dos primeros años contra los dos últimos. Las cifras de la FAO para México pueden diferir de las del SIAP.</p>`;
  }

  function cuerpoProductos() {
    const [a, b, id] = sel.productos;
    const A = filaFAO(a, id), B = filaFAO(b, id), n = [nombreProd(a), nombreProd(b)];
    const v = (o, c) => o?.[c] ?? null;
    const anios = window.Historia.anios();
    return `
      ${tarjetas(n, [A, B].map(o => o ? [fmtT(o.prod), `producción ${G().anio}${o.lugarProd ? ` · lugar ${o.lugarProd} mundial` : ""}`] : ["—", "sin dato"]))}
      ${tabla(n, [
        ["Producción", fmtT(v(A, "prod")), fmtT(v(B, "prod")), mayor(v(A, "prod"), v(B, "prod"))],
        ["Lugar mundial en producción", A?.lugarProd ?? "—", B?.lugarProd ?? "—", mayor(v(A, "lugarProd"), v(B, "lugarProd"), true)],
        ["Rendimiento", A?.rend ? A.rend.toFixed(1) + " t/ha" : "—", B?.rend ? B.rend.toFixed(1) + " t/ha" : "—", null],
        ["Exportación", fmtT(v(A, "exp")), fmtT(v(B, "exp")), mayor(v(A, "exp"), v(B, "exp"))],
        ["Valor exportado", usd(v(A, "expUSD")), usd(v(B, "expUSD")), mayor(v(A, "expUSD"), v(B, "expUSD"))],
        ["Parte de la exportación mundial", pct(v(A, "parteExp")), pct(v(B, "parteExp")), mayor(v(A, "parteExp"), v(B, "parteExp"))],
        ["Lugar como exportador", A?.lugarExp ?? "—", B?.lugarExp ?? "—", mayor(v(A, "lugarExp"), v(B, "lugarExp"), true)],
        ["Precio medio de exportación", A?.precioExp ? "US$" + A.precioExp.toFixed(2) + "/kg" : "—", B?.precioExp ? "US$" + B.precioExp.toFixed(2) + "/kg" : "—", mayor(v(A, "precioExp"), v(B, "precioExp"))],
        ["Importación", fmtT(v(A, "imp")), fmtT(v(B, "imp")), null],
        ["Autosuficiencia", pct(v(A, "auto")), pct(v(B, "auto")), mayor(v(A, "auto"), v(B, "auto"))],
        ["Producción en 10 años", pctVar(v(A, "cambioProd")), pctVar(v(B, "cambioProd")), mayor(v(A, "cambioProd"), v(B, "cambioProd"))],
        ["Exportación en 10 años", pctVar(v(A, "cambioExp")), pctVar(v(B, "cambioExp")), mayor(v(A, "cambioExp"), v(B, "cambioExp"))]
      ])}
      <div class="cmp-graficas">
        ${grafica(`Producción en ${nombrePais(id)}`, anios, [{ n: n[0], v: A?.serieProd, c: COLOR[0] }, { n: n[1], v: B?.serieProd, c: COLOR[1] }], corto, true)}
        ${grafica(`Exportación de ${nombrePais(id)}`, anios, [{ n: n[0], v: A?.serieExp, c: COLOR[0] }, { n: n[1], v: B?.serieExp, c: COLOR[1] }], corto, true)}
      </div>
      <p class="sub">FAOSTAT ${G().anio} y serie ${anios[0]}–${anios.at(-1)}. Como los volúmenes de dos productos son muy distintos, las gráficas muestran un índice (promedio de los dos primeros años = 100); las toneladas están en la tabla.</p>`;
  }

  function cuerpoEstados() {
    const [a, b, k] = sel.estados;
    const H = window.HISTORIA_ESTADOS;
    const A = filaEstado(k, a), B = filaEstado(k, b), n = [nombreEstado(a), nombreEstado(b)];
    const v = (o, c) => o?.[c] ?? null;
    const anios = H?.anios ?? [];
    return `
      ${tarjetas(n, [A, B].map(o => o ? [fmtT(o.prod), `producción SIAP ${window.PRODUCCION_SIAP?.anio ?? ""}${o.lugar ? ` · lugar ${o.lugar} nacional` : ""}`] : ["—", "sin dato"]))}
      ${tabla(n, [
        ["Producción", fmtT(v(A, "prod")), fmtT(v(B, "prod")), mayor(v(A, "prod"), v(B, "prod"))],
        ["Parte de la producción nacional", pct(v(A, "parte")), pct(v(B, "parte")), mayor(v(A, "parte"), v(B, "parte"))],
        ["Superficie cosechada", A?.ha ? fmt(A.ha) + " ha" : "—", B?.ha ? fmt(B.ha) + " ha" : "—", mayor(v(A, "ha"), v(B, "ha"))],
        ["Rendimiento", A?.rend ? A.rend.toFixed(1) + " t/ha" : "—", B?.rend ? B.rend.toFixed(1) + " t/ha" : "—", mayor(v(A, "rend"), v(B, "rend"))],
        ["Valor de la producción", mxnG(A?.valor || null), mxnG(B?.valor || null), mayor(v(A, "valor"), v(B, "valor"))],
        ["Precio medio rural", A?.precioRural ? "$" + A.precioRural.toFixed(2) + "/kg" : "—", B?.precioRural ? "$" + B.precioRural.toFixed(2) + "/kg" : "—", mayor(v(A, "precioRural"), v(B, "precioRural"))],
        ["Demanda de su población", fmtT(v(A, "demanda")), fmtT(v(B, "demanda")), null],
        ["Autosuficiencia", A ? pct(A.auto) : "—", B ? pct(B.auto) : "—", mayor(v(A, "auto"), v(B, "auto"))],
        window.Sequia ? ["Producción en municipios con sequía", pct(v(A, "sequia")), pct(v(B, "sequia")), mayor(v(A, "sequia"), v(B, "sequia"), true)] : null,
        H ? ["Producción en 10 años", pctVar(v(A, "cambioProd")), pctVar(v(B, "cambioProd")), mayor(v(A, "cambioProd"), v(B, "cambioProd"))] : null
      ])}
      ${H ? `<div class="cmp-graficas">
        ${grafica(`Producción de ${nombreProd(k).toLowerCase()}`, anios, [{ n: n[0], v: A?.serieProd, c: COLOR[0] }, { n: n[1], v: B?.serieProd, c: COLOR[1] }], corto)}
        ${grafica("Rendimiento (t/ha)", anios, [{ n: n[0], v: A?.serieRend, c: COLOR[0] }, { n: n[1], v: B?.serieRend, c: COLOR[1] }], x => x.toFixed(0))}
      </div>` : '<p class="sub">Cargando la serie de 10 años del SIAP…</p>'}
      <p class="sub">SIAP, cierre de la producción agrícola municipal ${anios[0] ?? ""}–${anios.at(-1) ?? ""}, sumado por estado; población CONAPO; sequía: Monitor de Sequía de CONAGUA (último corte) sobre la producción municipal. Autosuficiencia y demanda con el consumo per cápita del mapa.</p>`;
  }

  const tarjetas = (n, cifras) => `<div class="cmp-tarjetas">${cifras.map(([v, l], i) => `
    <div class="cmp-tarjeta" style="--c:${COLOR[i]}"><span class="etq">${n[i]}</span><b>${v}</b><span class="l">${l}</span></div>`).join("")}</div>`;

  // ---------- Controles ----------
  function opciones(lista, actual) { return lista.map(([v, t]) => `<option value="${v}"${v === actual ? " selected" : ""}>${t}</option>`).join(""); }
  function listaPaises() {
    return Object.keys(G()?.paises ?? {}).map(id => [id, nombrePais(id)]).sort((a, b) => a[1].localeCompare(b[1], "es"));
  }
  const listaProdFAO = () => Object.keys(G()?.productos ?? {}).filter(k => ["Fruta", "Hortaliza", "Grano"].includes(meta(k)?.tipo)).map(k => [k, nombreProd(k)]).sort((a, b) => a[1].localeCompare(b[1], "es"));
  const listaProdMX = () => Object.keys(window.PRODUCTOS ?? {}).map(k => [k, window.PRODUCTOS[k].nombre]).sort((a, b) => a[1].localeCompare(b[1], "es"));
  const listaEstados = () => (window.ESTADOS ?? []).map(e => [e.id, e.nombre]).sort((a, b) => a[1].localeCompare(b[1], "es"));

  function controles() {
    const [a, b, c] = sel[modo];
    const L = modo === "paises" ? [listaPaises(), listaPaises(), listaProdFAO(), "Producto"]
      : modo === "productos" ? [listaProdFAO(), listaProdFAO(), listaPaises(), "País"]
      : [listaEstados(), listaEstados(), listaProdMX(), "Producto"];
    return `
      <div class="cmp-controles">
        <label class="cmp-a"><span class="etq"><i class="cmp-punto" style="background:${COLOR[0]}"></i>A</span><select data-i="0">${opciones(L[0], a)}</select></label>
        <button class="boton-icono cmp-cambiar" type="button" data-accion="invertir" aria-label="Intercambiar A y B" title="Intercambiar A y B">⇄</button>
        <label class="cmp-b"><span class="etq"><i class="cmp-punto" style="background:${COLOR[1]}"></i>B</span><select data-i="1">${opciones(L[1], b)}</select></label>
        <label class="cmp-c"><span class="etq">${L[3]}</span><select data-i="2">${opciones(L[2], c)}</select></label>
      </div>`;
  }

  function pintar() {
    const cuerpo = modo === "paises" ? cuerpoPaises() : modo === "productos" ? cuerpoProductos() : cuerpoEstados();
    const [a, b, c] = sel[modo];
    const titulo = modo === "paises" ? `${nombrePais(a)} y ${nombrePais(b)} en ${nombreProd(c).toLowerCase()}`
      : modo === "productos" ? `${nombreProd(a)} y ${nombreProd(b)} en ${nombrePais(c)}` : `${nombreEstado(a)} y ${nombreEstado(b)} en ${nombreProd(c).toLowerCase()}`;
    caja.querySelector(".cmp-contenido").innerHTML = `
      <div class="cmp-modos segmentado" role="radiogroup" aria-label="Qué comparar">${Object.entries(MODOS).map(([m, t]) =>
        `<label><input type="radio" name="cmpModo" value="${m}"${m === modo ? " checked" : ""}>${t}</label>`).join("")}</div>
      ${controles()}
      <h2 class="cmp-titulo">${titulo}</h2>
      ${cuerpo}`;
    caja.querySelectorAll("input[name=cmpModo]").forEach(r => r.onchange = () => { modo = r.value; preparar(); });
    caja.querySelectorAll(".cmp-controles select").forEach(s => s.onchange = () => { sel[modo] = [...sel[modo]]; sel[modo][+s.dataset.i] = s.value; preparar(); });
    caja.querySelector("[data-accion=invertir]").onclick = () => { const [x, y, z] = sel[modo]; sel[modo] = [y, x, z]; preparar(); };
    escribirURL();
  }

  // Carga las series que hagan falta (FAOSTAT o SIAP) y pinta
  function preparar() {
    const cargas = [window.Historia?.cargar?.() ?? Promise.resolve()];
    if (modo === "estados" && !window.HISTORIA_ESTADOS) cargas.push(window.Paleta.cargar("data/historia_estados.js", () => !!window.HISTORIA_ESTADOS).catch(() => {}));
    pintar();
    Promise.all(cargas).then(() => { if (caja && !caja.hidden) pintar(); });
  }

  // ---------- Ventana ----------
  function crear() {
    caja = document.createElement("div");
    caja.className = "comparar";
    caja.hidden = true;
    caja.setAttribute("role", "dialog");
    caja.setAttribute("aria-modal", "true");
    caja.setAttribute("aria-labelledby", "cmpTitulo");
    caja.innerHTML = `
      <div class="cmp-hoja">
        <div class="cmp-cabeza">
          <div><span class="etq">Collecta · Mapa Agroalimentario</span><h2 id="cmpTitulo">Comparar lado a lado</h2></div>
          <div class="cmp-acciones">
            <button class="boton-icono" type="button" data-accion="imprimir" aria-label="Descargar comparación en PDF" title="Descargar comparación en PDF">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
            </button>
            <button class="boton-icono" type="button" data-accion="cerrar" aria-label="Cerrar comparación" title="Cerrar comparación">✕</button>
          </div>
        </div>
        <div class="cmp-contenido"></div>
      </div>`;
    document.body.appendChild(caja);
    caja.addEventListener("click", e => {
      if (e.target === caja || e.target.closest("[data-accion=cerrar]")) cerrar();
      if (e.target.closest("[data-accion=imprimir]")) window.print();
    });
  }
  // Sin argumentos, se abre con el contexto de la vista: en México dos estados del producto actual (el elegido y el
  // mayor productor); en Mundo, Latinoamérica o un país, México contra el país elegido (o el mayor productor)
  function contexto() {
    const q = new URLSearchParams(location.hash.slice(1));
    const v = q.get("v"), p = q.get("p"), s = q.get("s");
    if (v === "mx" && window.PRODUCTOS?.[p]) {
      const orden = [...window.Modelo.calcular(p, {}).filas].sort((a, b) => b.prod - a.prod).map(f => f.id);
      const a = s && orden.includes(s) ? s : orden[0];
      return ["estados", [a, orden.find(id => id !== a), p]];
    }
    const k = G()?.productos?.[p] ? p : "arandano";
    const fuente = v === "latam" && window.LATAM?.productos?.[k] ? window.LATAM : G();   // en Latinoamérica, el mayor productor de la región
    const orden = Object.entries(fuente?.productos?.[k]?.datos ?? {}).sort((x, y) => y[1][0] - x[1][0]).map(([id]) => id);
    const b = v === "latam" || v === "global" ? (s && s !== "484" && G()?.paises?.[s] ? s : orden.find(id => id !== "484"))
      : window.SUBNACIONAL?.[v]?.m49 ?? orden.find(id => id !== "484");
    return ["paises", ["484", b, k]];
  }
  function abrir(m, valores) {
    if (!caja) crear();
    if (!m) [m, valores] = contexto();
    if (m && MODOS[m]) modo = m;
    if (valores) sel[modo] = valores;
    caja.hidden = false;
    document.body.classList.add("comparando");
    const guia = document.getElementById("guia");   // quien llega por un enlace a una comparación no necesita la guía
    if (guia) guia.hidden = true;
    preparar();
    caja.querySelector("[data-accion=cerrar]").focus({ preventScroll: true });
  }
  function cerrar() {
    if (!caja || caja.hidden) return;
    caja.hidden = true;
    document.body.classList.remove("comparando");
    try { const q = new URLSearchParams(location.hash.slice(1)); q.delete("cmp"); history.replaceState(null, "", "#" + q.toString()); } catch (e) { /* sin historial */ }
  }
  function escribirURL() {
    try { const q = new URLSearchParams(location.hash.slice(1)); if (q.has("tour")) return; q.set("cmp", [modo, ...sel[modo]].join(".")); history.replaceState(null, "", "#" + q.toString()); } catch (e) { /* sin historial */ }
  }
  document.addEventListener("keydown", e => { if (e.key === "Escape" && caja && !caja.hidden) cerrar(); });
  document.getElementById("btnComparar")?.addEventListener("click", () => abrir());

  // Enlace directo: cmp=paises.484.604.arandano
  const cmp = new URLSearchParams(location.hash.slice(1)).get("cmp");
  if (cmp) { const [m, ...v] = cmp.split("."); if (MODOS[m] && v.length === 3) setTimeout(() => abrir(m, v), 0); }

  window.Comparar = { abrir, cerrar, actual: () => caja && !caja.hidden ? [modo, ...sel[modo]].join(".") : null };
})();

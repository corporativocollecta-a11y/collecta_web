// ============================================================================
// Granos y leguminosas: lo que no tienen las frutas y hortalizas.
//   balanzaHTML  balanza disponibilidad-consumo del SIAP (window.BALANZAS_SIAP): oferta (inventario, producción,
//                importación) y demanda (consumo humano y pecuario, exportación, mermas) del ciclo comercial actual
//                (con meses estimados) contra el anterior, e inventario final
//   psdHTML      México y el mundo con proyección (USDA FAS PSD, window.PSD_GRANOS): producción, importación y consumo de
//                México por ciclo, lugar como importador e inventario mundial entre consumo
//   precioHTML   precio internacional (Banco Mundial / FMI, window.PRECIOS_GRANOS) en pesos por kg contra el mayoreo
//                (SNIIM) y el precio al productor (SIAP)
//   importacionHTML  de dónde llega lo que importa México y quién exporta en el mundo (pestaña Exportar)
// ============================================================================
(function () {
  const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const fmt = n => Math.round(n).toLocaleString("es-MX");
  const mt = miles => miles >= 1000 ? (miles / 1000).toFixed(2) + " Mt" : fmt(miles) + " mil t";   // entrada en miles de t
  const pct = x => Math.round(x * 100) + "%";
  const pctVar = x => (x >= 0 ? "+" : "−") + Math.abs(Math.round(x * 100)) + "%";
  const B = () => window.BALANZAS_SIAP?.productos ?? {};
  const PSD = () => window.PSD_GRANOS?.productos ?? {};
  const PG = () => window.PRECIOS_GRANOS;
  const BALANZA = { maiz_blanco: ["maiz_blanco"], maiz_amarillo: ["maiz_amarillo"], frijol: ["frijol"], arroz: ["arroz"],
    trigo: ["trigo_panificable", "trigo_cristalino"] };
  const PSD_CLAVE = { maiz_blanco: "maiz", maiz_amarillo: "maiz", trigo: "trigo", sorgo: "sorgo", cebada: "cebada", arroz: "arroz", soya: "soya" };
  const esGrano = k => window.PRODUCTOS?.[k]?.tipo === "Grano";
  const nombre = k => (window.PRODUCTOS?.[k]?.nombre ?? k).toLowerCase();
  let es = null;
  try { es = new Intl.DisplayNames(["es"], { type: "region" }); } catch (e) { es = null; }
  const PAIS_ISO = { "United States": "US", "Brazil": "BR", "Argentina": "AR", "Ukraine": "UA", "Canada": "CA", "Russia": "RU", "Australia": "AU",
    "European Union": null, "Japan": "JP", "Mexico": "MX", "China": "CN", "Vietnam": "VN", "Korea, South": "KR", "Egypt": "EG", "India": "IN",
    "Thailand": "TH", "Pakistan": "PK", "Indonesia": "ID", "Philippines": "PH", "Saudi Arabia": "SA", "Iran": "IR", "Turkey": "TR",
    "Kazakhstan": "KZ", "Paraguay": "PY", "South Africa": "ZA", "Colombia": "CO", "Peru": "PE", "Algeria": "DZ", "Morocco": "MA",
    "Nigeria": "NG", "Iraq": "IQ", "Bangladesh": "BD", "Burma": "MM", "Cambodia": "KH", "Uruguay": "UY", "Taiwan": "TW", "Malaysia": "MY" };
  const paisPSD = n => n === "European Union" ? "Unión Europea" : (() => { try { return PAIS_ISO[n] && es ? es.of(PAIS_ISO[n]) : n; } catch (e) { return n; } })();

  // Suma de los componentes de la balanza (el trigo junta panificable y cristalino) por ciclo
  function balanza(k) {
    const partes = (BALANZA[k] ?? []).map(b => B()[b]).filter(Boolean);
    if (!partes.length || partes.length < (BALANZA[k] ?? []).length) return null;
    const ciclos = Object.keys(partes[0]).sort();
    const factor = k === "arroz" ? 1 / 0.72 : 1;   // arroz: la balanza está en arroz pulido; el mapa usa palay
    const suma = c => {
      const r = { oferta: {}, demanda: {}, meses: partes[0][c].meses, estimadoDesde: partes[0][c].estimadoDesde, publicado: partes[0][c].publicado,
        reporte: partes[0][c].reporte, mensual: {} };
      partes.forEach(p => {
        const x = p[c];
        if (!x) return;
        ["oferta", "demanda"].forEach(g => Object.entries(x[g]).forEach(([n, v]) => { r[g][n] = (r[g][n] ?? 0) + v * factor; }));
        Object.entries(x.mensual).forEach(([n, v]) => { r.mensual[n] = (r.mensual[n] ?? v.map(() => 0)).map((a, i) => a + (v[i] ?? 0) * factor); });
      });
      return r;
    };
    return { ciclos, datos: Object.fromEntries(ciclos.map(c => [c, suma(c)])), partes: (BALANZA[k] ?? []).length };
  }

  function barras(meses, series, estimadoDesde) {
    const W = 300, H = 120, n = meses.length, bw = (W - 30) / n;
    const tot = meses.map((_, i) => series.reduce((a, s) => a + (s[1][i] ?? 0), 0));
    const max = Math.max(...tot, 1);
    const y = v => (H - 18) * (1 - v / max);
    return `<svg class="estac" viewBox="0 0 ${W} ${H}" role="img" aria-label="Oferta mensual">
      ${estimadoDesde != null && estimadoDesde < n ? `<rect x="${24 + estimadoDesde * bw}" y="0" width="${(n - estimadoDesde) * bw}" height="${H - 18}" fill="var(--linea)" opacity=".35"/>` : ""}
      ${meses.map((m, i) => { let acum = 0; return series.map(([, v, c]) => { const h = (H - 18) * (v[i] ?? 0) / max; const r = `<rect x="${24 + i * bw + 1}" y="${y(acum + (v[i] ?? 0))}" width="${bw - 2}" height="${h}" fill="${c}"/>`; acum += v[i] ?? 0; return r; }).join(""); }).join("")}
      <text x="0" y="10">${mt(max)}</text>
      ${meses.map((m, i) => i % 2 ? "" : `<text x="${24 + i * bw}" y="${H - 4}">${MES[(["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"].indexOf(m.split(" ")[0]) + 12) % 12]}</text>`).join("")}
    </svg>`;
  }

  function balanzaHTML(k) {
    const b = balanza(k);
    if (!b) return "";
    const [ant, act] = b.ciclos.length > 1 ? b.ciclos.slice(-2) : [null, b.ciclos[0]];
    const A = ant ? b.datos[ant] : null, C = b.datos[act];
    const fila = (titulo, g, n, fuerte) => {
      const a = A?.[g]?.[n], c = C[g]?.[n];
      if (a == null && c == null) return "";
      return `<tr${fuerte ? ' class="resaltado"' : ""}><td>${titulo}</td>${ant ? `<td class="num">${a != null ? mt(a) : "—"}</td>` : ""}<td class="num">${c != null ? mt(c) : "—"}</td>
        ${ant ? `<td class="num">${a && c != null ? pctVar(c / a - 1) : "—"}</td>` : ""}</tr>`;
    };
    const total = (x, g) => x ? Object.values(x[g]).reduce((s, v) => s + v, 0) : null;
    const consumo = x => x ? (x.demanda["consumo humano"] ?? 0) + (x.demanda["consumo pecuario"] ?? 0) : 0;
    const finalC = total(C, "oferta") - total(C, "demanda"), finalA = A ? total(A, "oferta") - total(A, "demanda") : null;
    const impC = C.oferta.importaciones ?? 0;
    const depC = consumo(C) ? impC / consumo(C) : 0;
    const mesesInv = consumo(C) ? finalC / (consumo(C) / 12) : null;
    const prod = C.mensual.produccion, imp = C.mensual.importaciones;
    return `
      <div class="kpis">
        <div class="kpi destacado"><div class="v">${pct(depC)}</div><div class="l">del consumo se cubre con importación (ciclo ${act}${C.estimadoDesde != null && C.estimadoDesde < C.meses.length ? "; con meses estimados" : ""})</div></div>
        <div class="kpi"><div class="v">${mt(finalC)}</div><div class="l">inventario al cierre del ciclo${mesesInv != null ? ` ≈ ${mesesInv.toFixed(1)} meses de consumo` : ""}${finalA != null ? ` (${pctVar(finalC / finalA - 1)} contra ${ant})` : ""}</div></div>
      </div>
      <div class="desplaza"><table class="compacta">
        <tr><th>Miles de toneladas</th>${ant ? `<th class="num">${ant}</th>` : ""}<th class="num">${act}</th>${ant ? '<th class="num">Cambio</th>' : ""}</tr>
        ${fila("Inventario inicial", "oferta", "inventario")}${fila("Producción", "oferta", "produccion")}${fila("Importación", "oferta", "importaciones")}
        <tr class="resaltado"><td>Oferta total</td>${ant ? `<td class="num">${mt(total(A, "oferta"))}</td>` : ""}<td class="num">${mt(total(C, "oferta"))}</td>${ant ? `<td class="num">${pctVar(total(C, "oferta") / total(A, "oferta") - 1)}</td>` : ""}</tr>
        ${fila("Consumo humano", "demanda", "consumo humano")}${fila("Consumo pecuario", "demanda", "consumo pecuario")}${fila("Exportación", "demanda", "exportaciones")}${fila("Mermas", "demanda", "mermas")}
        <tr class="resaltado"><td>Demanda total</td>${ant ? `<td class="num">${mt(total(A, "demanda"))}</td>` : ""}<td class="num">${mt(total(C, "demanda"))}</td>${ant ? `<td class="num">${pctVar(total(C, "demanda") / total(A, "demanda") - 1)}</td>` : ""}</tr>
      </table></div>
      ${prod && imp ? `<h4 class="mini">Oferta por mes del ciclo ${act} (miles de t)</h4>${barras(C.meses, [["Producción", prod, "var(--productor)"], ["Importación", imp, "var(--c-importa)"]], C.estimadoDesde)}
        <div class="leyenda-cadena"><span><i style="background:var(--productor)"></i>Producción</span><span><i style="background:var(--c-importa)"></i>Importación</span>${C.estimadoDesde != null && C.estimadoDesde < C.meses.length ? '<span><i style="background:var(--linea)"></i>Meses estimados</span>' : ""}</div>` : ""}
      <p class="sub">SIAP, análisis de balanzas disponibilidad-consumo (reporte de ${C.reporte?.replace(/(\d{4})/, " $1")}, publicado el ${C.publicado ?? "—"}); ciclo comercial de ${C.meses[0]} a ${C.meses.at(-1)}.
        ${b.partes > 1 ? "Suma del trigo panificable y el cristalino. " : ""}${k === "arroz" ? "Convertido a arroz palay (pulido ÷ 0.72) para compararlo con la producción del mapa. " : ""}Inventario al cierre = oferta − demanda.</p>`;
  }

  // Línea simple (miles de t) para la serie del USDA
  function lineas(anios, series, proyectado) {
    const W = 300, H = 120, n = anios.length, x = i => 26 + i * (W - 34) / (n - 1);
    const vals = series.flatMap(s => s[1]).filter(v => v != null);
    const max = Math.max(...vals, 1) * 1.1, y = v => (H - 18) - v / max * (H - 26);
    return `<svg class="estac" viewBox="0 0 ${W} ${H}" role="img" aria-label="Balance por ciclo">
      ${proyectado ? `<rect x="${x(n - 1) - 6}" y="0" width="12" height="${H - 18}" fill="var(--linea)" opacity=".35"/>` : ""}
      ${[0.5, 1].map(f => `<line x1="26" x2="${W - 8}" y1="${y(max * f / 1.1)}" y2="${y(max * f / 1.1)}" stroke="var(--linea)"/><text x="0" y="${y(max * f / 1.1) + 3}">${(max * f / 1.1 / 1000).toFixed(0)} Mt</text>`).join("")}
      ${series.map(([, v, c, d]) => `<polyline points="${v.map((p, i) => `${x(i).toFixed(1)},${y(p ?? 0).toFixed(1)}`).join(" ")}" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="${d ?? ""}"/>`).join("")}
      ${anios.map((a, i) => i % 3 && i !== n - 1 ? "" : `<text x="${x(i) - 10}" y="${H - 4}">${a}</text>`).join("")}
    </svg>`;
  }

  function psdHTML(k) {
    const d = PSD()[PSD_CLAVE[k]];
    if (!d) return "";
    const m = d.mexico, w = d.mundo, n = d.anios.length, u = n - 1;
    const imp = m.importacion?.[u] ?? 0, cons = m.consumo?.[u] ?? 0;
    const ratio = i => w.inventario[i] / w.consumo[i];
    const series = [["Producción", m.produccion, "var(--productor)"], ["Importación", m.importacion, "var(--c-importa)"], ["Consumo", m.consumo, "var(--suave)", "4 3"]]
      .filter(s => s[1]?.some(v => v));
    const exp = d.exportadores.slice(0, 4), totExp = w.exportacion?.[u] ?? 0;
    return `
      <div class="kpis">
        <div class="kpi destacado"><div class="v">${d.lugarMexicoImportacion ? d.lugarMexicoImportacion + "º" : "—"}</div><div class="l">importador del mundo en ${d.anios[u]} (proyección del USDA)${PSD_CLAVE[k] === "maiz" ? "; el USDA no separa blanco y amarillo" : ""}</div></div>
        <div class="kpi"><div class="v">${cons ? pct(imp / cons) : "—"}</div><div class="l">del consumo de México importado en ${d.anios[u]} (${mt(imp)} de ${mt(cons)})</div></div>
        <div class="kpi"><div class="v">${pct(ratio(u))}</div><div class="l">inventario mundial entre consumo al cierre de ${d.anios[u]} (${(() => { const d2 = Math.round((ratio(u) - ratio(u - 1)) * 100); return (d2 >= 0 ? "+" : "−") + Math.abs(d2); })()} pts contra ${d.anios[u - 1]}): más alto, más holgura y precios más bajos</div></div>
      </div>
      <h4 class="mini">México por ciclo comercial (el último es proyección)</h4>
      ${lineas(d.anios, series, true)}
      <div class="leyenda-cadena">${series.map(s => `<span><i style="background:${s[2]}"></i>${s[0]}</span>`).join("")}</div>
      ${exp.length ? `<p class="sub">Principales exportadores ${d.anios[u]}: ${exp.map(e => `${paisPSD(e[0])} ${totExp ? pct(e[1] / totExp) : mt(e[1])}`).join(", ")} del comercio mundial.</p>` : ""}
      <p class="sub">USDA FAS, Production, Supply and Distribution (PSD), con la proyección del último informe WASDE; años comerciales del USDA${PSD_CLAVE[k] === "arroz" ? ", arroz pulido" : ""}. Puede diferir de la balanza del SIAP (otro calendario y otras fuentes).</p>`;
  }

  function precioHTML(k) {
    const P = PG(), ref = P?.productos?.[k];
    const s = ref && P.series[ref];
    if (!s?.length) return "";
    const tc = m => P.tc[m] ?? P.tc[Object.keys(P.tc).sort().at(-1)];
    const ult = s.slice(-36).map(([m, v]) => [m, v * tc(m) / 1000 * (k === "arroz" ? 1 : 1)]);
    const sn = window.PRECIOS_SNIIM?.productos?.[k];
    const anioSn = String(window.PRECIOS_SNIIM?.anio ?? "");
    const rural = window.PRODUCTOS?.[k]?.precioRural;
    const serieSn = sn?.mensual ? ult.map(([m]) => m.startsWith(anioSn) ? sn.mensual[+m.slice(5) - 1] : null) : null;
    const W = 300, H = 120, n = ult.length, x = i => 26 + i * (W - 34) / (n - 1);
    const vals = [...ult.map(v => v[1]), ...(serieSn ?? []).filter(v => v != null), rural ?? 0];
    const max = Math.max(...vals) * 1.15, y = v => (H - 18) - v / max * (H - 26);
    const linea = (v, c, d) => {
      const tramos = []; let a = [];
      v.forEach((p, i) => { if (p != null) a.push(`${x(i).toFixed(1)},${y(p).toFixed(1)}`); else if (a.length) { tramos.push(a); a = []; } });
      if (a.length) tramos.push(a);
      return tramos.map(t => `<polyline points="${t.join(" ")}" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="${d ?? ""}"/>`).join("");
    };
    const [mU, pU] = s.at(-1), hace = s.find(([m]) => m === `${+mU.slice(0, 4) - 1}${mU.slice(4)}`);
    const nota = P.notas?.[k];
    return `
      <div class="kpis">
        <div class="kpi destacado"><div class="v">US$${fmt(pU)}/t</div><div class="l">precio internacional en ${MES[+mU.slice(5) - 1]} ${mU.slice(0, 4)} ($${(pU * tc(mU) / 1000).toFixed(2)} pesos por kg)${hace ? `, ${pctVar(pU / hace[1] - 1)} contra hace un año` : ""}</div></div>
        ${sn ? `<div class="kpi"><div class="v">$${sn.precio.toFixed(2)}/kg</div><div class="l">mayoreo nacional (SNIIM ${anioSn}, mediana de ${Object.keys(sn.mercados ?? {}).length} centrales)</div></div>` : ""}
        ${rural ? `<div class="kpi"><div class="v">$${rural.toFixed(2)}/kg</div><div class="l">precio al productor (SIAP)</div></div>` : ""}
      </div>
      <svg class="estac" viewBox="0 0 ${W} ${H}" role="img" aria-label="Precio internacional y nacional">
        ${[0.5, 1].map(f => `<line x1="26" x2="${W - 8}" y1="${y(max * f / 1.15)}" y2="${y(max * f / 1.15)}" stroke="var(--linea)"/><text x="0" y="${y(max * f / 1.15) + 3}">$${(max * f / 1.15).toFixed(0)}</text>`).join("")}
        ${linea(ult.map(v => v[1]), "var(--c-importa)")}
        ${serieSn ? linea(serieSn, "var(--minorista)") : ""}
        ${rural ? `<line x1="26" x2="${W - 8}" y1="${y(rural)}" y2="${y(rural)}" stroke="var(--productor)" stroke-dasharray="4 3"/>` : ""}
        ${ult.map(([m], i) => i % 6 ? "" : `<text x="${x(i) - 8}" y="${H - 4}">${MES[+m.slice(5) - 1]} ${m.slice(2, 4)}</text>`).join("")}
      </svg>
      <div class="leyenda-cadena"><span><i style="background:var(--c-importa)"></i>Internacional (pesos/kg)</span>${serieSn ? '<span><i style="background:var(--minorista)"></i>Mayoreo SNIIM</span>' : ""}${rural ? '<span><i style="background:var(--productor)"></i>Productor SIAP</span>' : ""}</div>
      <p class="sub">Internacional: ${P.referencias?.[ref] ?? ref} (${P.fuente}), convertido con el tipo de cambio de cada mes; no incluye flete, aranceles ni manejo hasta México.
        ${k === "arroz" ? "Es precio de arroz blanco; el mayoreo del SNIIM es arroz pulido y el del productor, palay (más barato por kg). " : ""}${nota ? nota : ""}</p>`;
  }

  function importacionHTML(k) {
    const p = window.PRODUCTOS?.[k];
    if (!p) return "";
    const o = Object.entries(p.origenes ?? {}).filter(([n]) => n !== "Otros");
    const d = PSD()[PSD_CLAVE[k]], u = d ? d.anios.length - 1 : 0;
    if (!o.length && !d) return "";
    return `
      ${o.length ? `<h4 class="mini">De dónde llega lo que importa México</h4>
        ${o.map(([n, v]) => `<div class="barra-h"><span class="n">${n}</span><span class="b"><i style="width:${Math.round(v * 100)}%;background:var(--c-importa)"></i></span><span class="x">${pct(v)}</span></div>`).join("")}
        <p class="sub">${p.paisesFuente ?? ""}${p.fuenteComercio ? ` · volumen: ${p.fuenteComercio}` : ""}.</p>` : ""}
      ${d ? `<h4 class="mini">Quién importa en el mundo (${d.anios[u]})</h4>
        <p class="sub">${d.importadores.slice(0, 5).map(e => `<b>${paisPSD(e[0])}</b> ${mt(e[1])}`).join(" · ")}</p>` : ""}
      ${p.comtradeMexico?.importacion != null && p.importacion > (p.comtradeMexico.importacion || 0) * 1.3 ? `<p class="sub">Lo que México reporta a Naciones Unidas (Comtrade) es menor: ${mt((p.comtradeMexico.importacion || 0) / 1000)} importadas. Se usa la balanza del SIAP o lo que reportan los países exportadores.</p>` : ""}`;
  }

  window.Granos = {
    esGrano, balanzaHTML, psdHTML, precioHTML, importacionHTML,
    tieneBalanza: k => !!balanza(k), tienePSD: k => !!PSD()[PSD_CLAVE[k]], tienePrecio: k => !!PG()?.series?.[PG()?.productos?.[k]],
    resumenBalanza: k => { const b = balanza(k); if (!b) return ""; const c = b.datos[b.ciclos.at(-1)]; const cons = (c.demanda["consumo humano"] ?? 0) + (c.demanda["consumo pecuario"] ?? 0);
      return `Ciclo ${b.ciclos.at(-1)}: importación ${mt(c.oferta.importaciones ?? 0)}, ${cons ? pct((c.oferta.importaciones ?? 0) / cons) : "—"} del consumo`; },
    resumenPSD: k => { const d = PSD()[PSD_CLAVE[k]]; if (!d) return ""; const u = d.anios.length - 1;
      return `${d.anios[u]}: México ${d.lugarMexicoImportacion}º importador del mundo · inventario mundial ${pct(d.mundo.inventario[u] / d.mundo.consumo[u])} del consumo`; },
    resumenPrecio: k => { const P = PG(), s = P?.series?.[P?.productos?.[k]]; if (!s?.length) return ""; const [m, v] = s.at(-1);
      return `Internacional US$${fmt(v)}/t en ${MES[+m.slice(5) - 1]} ${m.slice(0, 4)}`; },
  };
})();

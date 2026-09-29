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
  // Cadena frontera → ciudad: precio FOB en el cruce + flete en camión (US$ por carga ÷ kg por carga) contra el mayoreo
  // de cada ciudad. Solo si frontera y mayoreo cotizan la misma mercancía.
  function rutasCadena(k) {
    const d = datos(k), f = d?.frontera, F = E()?.fletes;
    if (!d?.precio || !f?.precio || !F || f.mercancia !== d.mercancia) return [];
    return Object.entries(d.mercados ?? {}).map(([ciudad, [mayoreo]]) => {
      const opciones = Object.entries(f.cruces).map(([cruce, [fob]]) => {
        const r = F.rutas[cruce]?.[ciudad];
        return r ? { cruce, fob, fleteCarga: r[0], flete: r[0] / F.cargaKg } : null;
      }).filter(Boolean).map(o => ({ ...o, llega: o.fob + o.flete })).sort((a, b) => a.llega - b.llega);
      return opciones.length ? { ciudad, mayoreo, ...opciones[0] } : null;
    }).filter(Boolean).sort((a, b) => (b.mayoreo - b.llega) - (a.mayoreo - a.llega));
  }
  function cadenaHTML(k) {
    const rutas = rutasCadena(k);
    if (!rutas.length) return "";
    const F = E().fletes;
    return `
      <h3>De la frontera a cada ciudad <span class="tag ok">USDA ${E().anio}</span></h3>
      <table>
        <tr><th>Ciudad</th><th class="num">Frontera</th><th class="num">Flete</th><th class="num">Llega en</th><th class="num">Mayoreo</th><th class="num">Diferencia (% del mayoreo)</th></tr>
        ${rutas.map(r => `<tr><td>${E().mercados[r.ciudad].nombre}<br><span class="est">desde ${E().cruces[r.cruce].nombre.split(",")[0]}</span></td>
          <td class="num">${usd(r.fob)}</td><td class="num">${usd(r.flete)}</td><td class="num">${usd(r.llega)}</td><td class="num">${usd(r.mayoreo)}</td>
          <td class="num">${r.mayoreo - r.llega >= 0 ? "+" : ""}${pct((r.mayoreo - r.llega) / r.mayoreo)}</td></tr>`).join("")}
      </table>
      <p class="sub">US$/kg. Flete = tarifa mediana ${E().anio} por camión refrigerado del cruce a la ciudad (USDA National Truck Rate Report) ÷ ${Math.round(F.cargaKg).toLocaleString("es-MX")} kg por carga (40,000 lb). Se elige el cruce que deja el producto más barato en cada ciudad. La diferencia cubre descarga, merma, financiamiento y el margen del importador y del mayorista. Referencia: ${datos(k).mercancia}.</p>`;
  }

  // Calendario comercial: de dónde viene lo que se vende en EE. UU. cada mes y a qué precio
  function calendarioHTML(k) {
    const c = E()?.calendario?.[k];
    if (!c) return "";
    const otros = Object.values(c.otros ?? {}).reduce((a, s) => a.map((x, i) => x + s[i]), Array(12).fill(0));
    const tot = c.eua.map((x, i) => x + c.mx[i] + otros[i]);
    const maxT = Math.max(...tot, 1);
    const precio = datos(k)?.mensual?.todos ?? null;
    const pv = precio?.filter(v => v != null) ?? [];
    const pMed = pv.length ? [...pv].sort((a, b) => a - b)[Math.floor(pv.length / 2)] : null;
    const altos = precio && pMed ? precio.map((v, i) => [v, i]).filter(([v]) => v != null && v >= pMed * 1.05).sort((a, b) => b[0] - a[0]) : [];
    const MES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const parteMX = i => tot[i] > 0 ? c.mx[i] / tot[i] : 0;
    const W = 300, H = 110, bw = (W - 30) / 12, y = t => H - 16 - t / maxT * (H - 26);
    const pMax = pv.length ? Math.max(...pv) * 1.1 : 1, yp = v => H - 16 - v / pMax * (H - 26);
    const barras = tot.map((_, i) => {
      let base = H - 16;
      return [[c.eua[i], "var(--productor)"], [c.mx[i], "var(--c-importa)"], [otros[i], "var(--c-neutro)"]].map(([t, col]) => {
        const h = t / maxT * (H - 26); base -= h;
        return h > 0 ? `<rect x="${24 + i * bw + 2}" y="${base}" width="${bw - 4}" height="${h}" fill="${col}"${altos.some(a => a[1] === i) ? "" : ' opacity=".55"'}/>` : "";
      }).join("");
    }).join("");
    const linea = precio ? `<polyline points="${precio.map((v, i) => v == null ? null : `${24 + i * bw + bw / 2},${yp(v)}`).filter(Boolean).join(" ")}" fill="none" stroke="var(--tinta)" stroke-width="1.6" stroke-dasharray="3 2"/>` : "";
    return `
      <h3>Calendario comercial en EE. UU. <span class="tag ok">USDA ${E().anio}</span></h3>
      <svg class="estac" viewBox="0 0 ${W} ${H}" role="img" aria-label="Abasto y precio por mes">
        ${barras}${linea}
        ${MESES.map((m, i) => `<text x="${24 + i * bw + bw / 2 - 3}" y="${H - 3}">${m}</text>`).join("")}
      </svg>
      <div class="leyenda-cadena"><span><i style="background:var(--productor)"></i>EE. UU.</span><span><i style="background:var(--c-importa)"></i>México</span>${otros.some(x => x > 0) ? `<span><i style="background:var(--c-neutro)"></i>${Object.keys(c.otros).slice(0, 3).join(", ")}</span>` : ""}${precio ? `<span><i style="background:var(--tinta)"></i>precio mayoreo</span>` : ""}</div>
      ${altos.length ? `<div class="nota"><b>Mejores meses para vender:</b> ${altos.slice(0, 4).map(([v, i]) => `${MES[i]} (US$${v.toFixed(2)}/kg, México ${(parteMX(i) * 100).toFixed(0)}% del abasto)`).join(" · ")}. Precio mediano del año: US$${pMed.toFixed(2)}/kg.</div>` : ""}
      <p class="sub">Barras: toneladas embarcadas por mes según su procedencia (reporte semanal de embarques del USDA; la producción de EE. UU. que no pasa por los distritos reportados no aparece). Los meses resaltados tienen precio de mayoreo al menos 5% arriba de la mediana del año.</p>`;
  }
  // Competencia: importaciones mensuales de EE. UU. por país de origen (UN Comtrade, window.COMPETENCIA_EUA)
  let nombresES = null;
  try { nombresES = new Intl.DisplayNames(["es"], { type: "region" }); } catch (e) { nombresES = null; }
  const nombrePais = m49 => { if (m49 === "otros") return "Otros"; const p = window.GLOBAL?.paises?.[m49]; try { return (p?.iso && nombresES?.of(p.iso)) || p?.nombre || m49; } catch (e) { return p?.nombre ?? m49; } };
  const COLORES = ["#8aa0b8", "#cdbb72", "#a98ad6", "#6f8f63", "#d98e73", "#7fb3a8", "#b5a7c9", "#9aa5a0"];
  function competenciaHTML(k) {
    const C = window.COMPETENCIA_EUA?.productos?.[k];
    if (!C) return "";
    const MESL = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    // Las claves M49 parecen números: el navegador las ordena por código, así que se reordenan por volumen ("otros" al final)
    const suma = v => v.reduce((a, b) => a + b, 0);
    const orig = Object.entries(C.origenes).sort((a, b) => a[0] === "otros" ? 1 : b[0] === "otros" ? -1 : suma(b[1]) - suma(a[1]));
    const tot = Array.from({ length: 12 }, (_, i) => orig.reduce((s, [, v]) => s + v[i], 0));
    const maxT = Math.max(...tot, 1);
    const color = (o, j) => o === "484" ? "var(--c-importa)" : o === "otros" ? "var(--linea)" : COLORES[j % COLORES.length];
    const W = 300, H = 110, bw = (W - 30) / 12;
    const barras = tot.map((_, i) => {
      let base = H - 16;
      return orig.map(([o, v], j) => { const h = v[i] / maxT * (H - 26); base -= h; return h > 0 ? `<rect x="${24 + i * bw + 2}" y="${base}" width="${bw - 4}" height="${h}" fill="${color(o, j)}"><title>${nombrePais(o)}: ${fmtT(v[i])}</title></rect>` : ""; }).join("");
    }).join("");
    const mx = C.origenes["484"] ?? Array(12).fill(0);
    const parte = mx.reduce((a, b) => a + b, 0) / (C.total || 1);
    // Temporada de cada competidor: meses con al menos la mitad de su mes más fuerte
    const temporada = v => { const m = Math.max(...v); const meses = v.map((x, i) => x >= m * 0.5 ? i : -1).filter(i => i >= 0); return meses.length === 12 ? "todo el año" : meses.map(i => MESL[i]).join(", "); };
    const rivales = orig.filter(([o]) => o !== "484" && o !== "otros").slice(0, 3);
    const flojos = mx.map((x, i) => [x / (tot[i] || 1), i]).filter(([p]) => p < 0.5 && tot.some(t => t > 0)).map(([, i]) => MESL[i]);
    return `
      <h3>Competencia en EE. UU. <span class="tag ok">Comtrade ${window.COMPETENCIA_EUA.anio}</span></h3>
      <p class="sub">EE. UU. importó ${fmtT(C.total)}; México aportó <b>${pct(parte)}</b>.${flojos.length && flojos.length < 12 ? ` México tiene menos de la mitad del mercado en <b>${flojos.join(", ")}</b>.` : ""}</p>
      <svg class="estac" viewBox="0 0 ${W} ${H}" role="img" aria-label="Importaciones de EE. UU. por origen y mes">
        ${barras}
        ${MESES.map((m, i) => `<text x="${24 + i * bw + bw / 2 - 3}" y="${H - 3}">${m}</text>`).join("")}
      </svg>
      <div class="leyenda-cadena">${orig.slice(0, 6).map(([o], j) => `<span><i style="background:${color(o, j)}"></i>${nombrePais(o)}</span>`).join("")}</div>
      ${rivales.length ? `<h4 class="mini">Cuándo entra cada competidor</h4>${rivales.map(([o, v]) => `<div class="ruta temporada"><span>${nombrePais(o)}</span><span class="x">${fmtT(v.reduce((a, b) => a + b, 0))}</span><span class="x">${temporada(v)}</span></div>`).join("")}` : ""}
      <p class="sub">Importaciones de EE. UU. por país de origen y mes, según EE. UU. (UN Comtrade), producto fresco.</p>`;
  }
  // Cuánto le queda al productor de un estado si vende en la frontera: precio FOB (US$ → pesos) menos flete al cruce.
  // No descuenta empaque, enfriado, agente aduanal ni margen del exportador, que van dentro del precio FOB.
  function netoHTML(k, entidad, precioRural, tarifa) {
    const f = datos(k)?.frontera;
    const tc = E()?.tipoCambio?.valor;
    if (!f?.precio || !tc || !entidad) return "";
    const opciones = Object.entries(f.cruces).map(([id, [p]]) => {
      const c = E().cruces[id];
      const km = window.Modelo.distanciaKm(entidad, c);
      const flete = km * (tarifa ?? 2.2) / 1000;   // MXN por kg (tarifa en MXN por tonelada-km)
      return { id, nombre: c.nombre, km, fob: p * tc, flete, neto: p * tc - flete };
    }).sort((a, b) => b.neto - a.neto);
    const mejor = opciones[0];
    const mxn = n => "$" + n.toFixed(2);
    return `
      <h3>Si ${entidad.nombre} exporta a EE. UU. <span class="tag ok">USDA ${E().anio}</span></h3>
      <div class="kpis">
        <div class="kpi destacado"><div class="v">${mxn(mejor.neto)}/kg por ${mejor.nombre.split(",")[0]}</div>
          <div class="l">Precio en la frontera ${mxn(mejor.fob)}/kg (US$${(mejor.fob / tc).toFixed(2)} × ${tc}) menos flete de ${Math.round(mejor.km).toLocaleString("es-MX")} km (${mxn(mejor.flete)}/kg).
          ${precioRural ? `Es <b>${(mejor.neto / precioRural).toFixed(1)}×</b> el precio medio rural nacional (${mxn(precioRural)}/kg, SIAP).` : ""}</div></div>
      </div>
      ${opciones.length > 1 ? opciones.map(o => `<div class="ruta"><span>${o.nombre}</span><span class="x">${Math.round(o.km).toLocaleString("es-MX")} km</span><span class="x">${mxn(o.neto)}/kg</span></div>`).join("") : ""}
      <p class="sub">Referencia: ${f.mercancia}, ${f.empaque}. Flete con la tarifa del simulador (${tarifa ?? 2.2} pesos por tonelada-km). El precio FOB incluye empaque, enfriado, agente aduanal y margen del exportador, que no se descuentan aquí: es el techo de lo que podría llegarle al productor. Tipo de cambio: ${E().tipoCambio.fuente}.</p>`;
  }
  const mexicoHTML = k => calendarioHTML(k) + competenciaHTML(k) + cadenaHTML(k) + volumenHTML(E()?.mexico?.[k], "Exportación a EE. UU.: por dónde y cuándo cruza");

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
      rutasCadena(k).forEach(r => {
        const a = E().cruces[r.cruce], b = E().mercados[r.ciudad];
        window.Paleta.ruta(grupo, [[a.lat, a.lon], [(a.lat + b.lat) / 2 + 2, (a.lon + b.lon) / 2], [b.lat, b.lon]], t.importa, 1.2,
          `${a.nombre.split(",")[0]} → ${b.nombre}<br>Flete: <b>US$${Math.round(r.fleteCarga).toLocaleString("es-MX")}</b> por camión (${usd(r.flete)}/kg)<br>Llega en ${usd(r.llega)}/kg · mayoreo ${usd(r.mayoreo)}/kg`);
      });
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
    const vol = calendarioHTML(k) + competenciaHTML(k) + cadenaHTML(k) + volumenHTML(d?.volumen, "Lo que cruza de México");
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

  window.PreciosEUA = { disponible, crearCapa, panelHTML, mexicoHTML, netoHTML };
})();

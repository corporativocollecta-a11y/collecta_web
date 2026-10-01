// ============================================================================
// Embarques semanales por origen y pronóstico de 8 semanas (USDA AMS; carga diferida).
// - window.EMBARQUES (scripts/procesar_embarques.py): toneladas por semana de cada zona productora de EE. UU., cada
//   cruce con México y cada puerto de importación.
// - window.PRONOSTICO (scripts/procesar_pronostico.py): oferta y precio de las próximas 8 semanas con su banda y el
//   error que tuvo el método en la historia.
// Los paneles dejan un marcador <div data-embarques="oferta|pronostico" data-k="…" data-vista="eua|mx"> y este módulo
// lo llena al cargar los datos (igual que js/historia.js). La capa del mapa se dibuja en la vista de EE. UU.
// ============================================================================
(function () {
  const fmt = n => Math.round(n).toLocaleString("es-MX");
  const fmtT = t => t >= 1e6 ? (t / 1e6).toFixed(2) + " Mt" : t >= 1e3 ? fmt(t / 1e3) + " mil t" : fmt(t) + " t";
  const pct = x => (x * 100).toFixed(0) + "%";
  const pctVar = x => (x >= 0 ? "+" : "−") + Math.abs(x * 100).toFixed(0) + "%";
  const E = () => window.EMBARQUES, P = () => window.PRONOSTICO;
  const GRUPOS = { eua: ["EE. UU.", "var(--productor)"], mx: ["México", "var(--c-importa)"], imp: ["Importación", "var(--minorista)"], mixto: ["Mixto (CA/AZ y cruces)", "var(--transporte)"] };
  const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const MESES_L = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const nombreOrigen = m => document.documentElement.lang === "en" && m[5] ? m[5] : window.Paleta.usdaES(m[0]);
  const fecha = i => { const d = new Date(E().semanas[i] + "T12:00:00"); return `${d.getDate()} ${MES[d.getMonth()]} ${d.getFullYear()}`; };

  let cargando = null, semana = null;
  const escuchas = [];
  const cargar = () => cargando ??= Promise.all([
    window.Paleta.cargar("data/embarques.js", () => !!window.EMBARQUES),
    window.Paleta.cargar("data/pronostico.js", () => !!window.PRONOSTICO).catch(() => {}),
    window.Paleta.cargar("data/avance_siap.js", () => !!window.AVANCE_SIAP).catch(() => {}),
    window.Paleta.cargar("data/origen_exportacion.js", () => !!window.ORIGEN_EXPORTACION).catch(() => {})
  ]);

  // t de un origen en la semana i
  // las correcciones del USDA llegan como toneladas negativas: se muestran como 0
  const valor = (k, o, i) => { const s = E()?.productos?.[k]?.[o]; if (!s) return 0; const j = i - s[0]; return j >= 0 && j < s[1].length ? Math.max(0, s[1][j] ?? 0) : 0; };
  const ultimaSemana = k => Math.max(...Object.values(E()?.productos?.[k] ?? {}).map(([i0, v]) => { let j = v.length - 1; while (j >= 0 && !v[j]) j--; return i0 + j; }), -1);
  const semanaDe = k => { const u = ultimaSemana(k); return semana != null && semana <= u ? semana : u; };
  const disponible = k => !!E()?.productos?.[k] && ultimaSemana(k) >= 0;

  function porOrigen(k, i) {
    return Object.keys(E().productos[k]).map(o => ({ o, t: valor(k, o, i), antes: valor(k, o, i - 52), meta: E().origenes[o] }))
      .filter(x => x.t > 0 || x.antes > 0).sort((a, b) => b.t - a.t);
  }
  function porGrupo(k, i) {
    const g = { eua: 0, mx: 0, imp: 0, mixto: 0 };
    Object.keys(E().productos[k]).forEach(o => { g[E().origenes[o][3]] += valor(k, o, i); });
    return g;
  }

  // ---------- Origen estimado por estado de lo que cruza de México ----------
  // El USDA no dice de qué estado viene lo que cruza. El volumen de cada cruce se reparte entre los estados según:
  //  1. lo que la Secretaría de Economía registra que cada estado exportó a EE. UU. ese mes (data/origen_exportacion.js,
  //     scripts/procesar_origen_exportacion.py); si el mes aún no se publica, el mismo mes del año anterior. En 2025
  //     coincidió 94% con el registro mes a mes, contra 62% del método 2;
  //  2. sin registro: su excedente exportable (producción SIAP − demanda propia, modelo del mapa).
  // En ambos casos, cada estado sale por los cruces según su cercanía (peso exp(−km/400), km ≈ 1.25 × línea recta
  // desde la capital del estado).
  // Estados autorizados para exportar a EE. UU. cuando el acceso lo restringe (data/acceso.js: aguacate Hass solo de
  // Michoacán o Jalisco)
  const AUTORIZADOS = { aguacate: ["16", "14"] };
  const CRUCES_MX = { mx_tx: [26.20, -98.23], mx_nog: [31.34, -110.94], mx_otay: [32.55, -116.94], mx_cal: [32.60, -115.10] };
  // Partes registradas por la SE para el mes de la semana i (o el mismo mes de hasta 3 años antes). La Ciudad de
  // México se quita: ahí está el domicilio de comercializadoras, no huertas.
  function registro(k, i) {
    const p = window.ORIGEN_EXPORTACION?.productos?.[k];
    if (!p) return null;
    const [a, m] = E().semanas[i].slice(0, 7).split("-").map(Number);
    for (let x = a; x >= a - 3; x--) {
      const clave = `${x}-${String(m).padStart(2, "0")}`, partes = p[clave];
      if (partes && Object.keys(partes).some(e => e !== "09")) return { partes, anio: x, mes: m, propio: x === a };
    }
    return null;
  }
  function estadosEstimados(k, i, factores = null) {
    if (!window.Modelo || !window.PRODUCTOS?.[k]) return null;
    const reg = factores ? null : registro(k, i);
    // Con el avance mensual del SIAP: cosecha del mes de esa semana menos el consumo mensual del estado; sin él, el
    // excedente anual (producción − demanda)
    const mensual = window.AVANCE_SIAP?.productos?.[k];
    const mes = +E().semanas[i].slice(5, 7) - 1;
    const filas = window.Modelo.calcular(k, {}).filas.map(f => ({ ...f, exc: reg ? (f.id === "09" || !(f.prod > 0) || f.estimado ? 0 : reg.partes[f.id] ?? 0)
      : (factores ? factores[f.id] ?? 0 : 1) * (mensual ? Math.max(0, (mensual[f.id]?.[mes] ?? 0) - f.demanda / 12) : Math.max(0, f.prod - f.demanda)) }))
      .filter(f => f.exc > 0 && (!AUTORIZADOS[k] || AUTORIZADOS[k].includes(f.id)));
    if (!filas.length) return null;
    const km = (f, [la, lo]) => 1.25 * window.Modelo.distanciaKm(f, { lat: la, lon: lo });
    const reparto = {};
    Object.entries(CRUCES_MX).forEach(([c, xy]) => {
      const t = valor(k, c, i);
      if (!t) return;
      const pesos = filas.map(f => {
        // cercanía relativa: qué tanto le conviene este cruce frente a los demás
        const todos = Object.values(CRUCES_MX).map(z => Math.exp(-km(f, z) / 400));
        return f.exc * Math.exp(-km(f, xy) / 400) / todos.reduce((a, b) => a + b, 0);
      });
      const suma = pesos.reduce((a, b) => a + b, 0) || 1;
      filas.forEach((f, j) => { reparto[f.id] = (reparto[f.id] ?? { nombre: f.nombre, t: 0, cruces: {} }); const x = t * pesos[j] / suma; reparto[f.id].t += x; reparto[f.id].cruces[c] = (reparto[f.id].cruces[c] ?? 0) + x; });
    });
    const lista = Object.values(reparto).sort((a, b) => b.t - a.t);
    if (lista.length) lista.registro = reg;
    return lista.length ? lista : null;
  }
  function estadosHTML(k, i) {
    const lista = estadosEstimados(k, i);
    if (!lista) return "";
    const tot = lista.reduce((s, x) => s + x.t, 0);
    const corto = { mx_tx: "Texas", mx_nog: "Nogales", mx_otay: "Otay Mesa", mx_cal: "Calexico/San Luis" };
    return `<h4 class="mini">De qué estados viene lo que cruzó (estimado)</h4>
      ${lista.slice(0, 8).map(x => `<div class="barra-h"><span class="n">${x.nombre}</span><span class="b"><i style="width:${x.t / lista[0].t * 100}%;background:var(--c-importa)"></i></span><span class="x">${pct(x.t / tot)}</span></div>`).join("")}
      <p class="sub">${lista.registro ? `El USDA reporta el cruce, no el estado de origen. Se reparte según lo que la Secretaría de Economía registra que cada estado exportó a EE. UU. en ${MESES_L[lista.registro.mes - 1]} de ${lista.registro.anio}${lista.registro.propio ? "" : " (el mes de esta semana aún no se publica)"}, en valor y por domicilio del exportador; cada estado se asigna a los cruces por cercanía${AUTORIZADOS[k] ? "; solo estados autorizados para exportar a Estados Unidos" : ""}` : `Estimación, no registro: el USDA reporta el cruce, no el estado de origen. Se reparte lo que cruzó cada semana entre los estados con excedente ${window.AVANCE_SIAP?.productos?.[k] ? `(cosecha del mes según el avance mensual del SIAP ${window.AVANCE_SIAP.anio}, menos su consumo)` : `(producción SIAP ${window.PRODUCCION_SIAP?.anio ?? ""} menos su consumo)`} según su cercanía a cada cruce${AUTORIZADOS[k] ? "; solo estados autorizados para exportar a EE. UU." : ""}`}. Principal ruta de ${lista[0].nombre}: ${corto[Object.entries(lista[0].cruces).sort((a, b) => b[1] - a[1])[0][0]]}.</p>`;
  }

  // ---------- Oferta: quién abastece a EE. UU. en la semana elegida y en las últimas 52 ----------
  function ofertaHTML(k, vista) {
    if (!disponible(k)) return '<p class="sub">El USDA no reporta embarques semanales de este producto.</p>';
    const i = semanaDe(k), u = ultimaSemana(k);
    const lista = porOrigen(k, i), total = lista.reduce((s, x) => s + x.t, 0), totalAntes = lista.reduce((s, x) => s + x.antes, 0);
    const g = porGrupo(k, i);
    const desde = Math.max(0, u - 51);
    const semanas52 = Array.from({ length: u - desde + 1 }, (_, j) => desde + j);
    const tot52 = semanas52.map(s => porGrupo(k, s));
    const max = Math.max(...tot52.map(x => x.eua + x.mx + x.imp + x.mixto), 1);
    const W = 320, Hh = 110, bw = (W - 8) / semanas52.length;
    const barras = semanas52.map((s, j) => {
      let y = Hh - 14;
      return ["eua", "mx", "imp", "mixto"].map(gr => { const h = tot52[j][gr] / max * (Hh - 22); y -= h;
        return h > 0 ? `<rect x="${4 + j * bw}" y="${y}" width="${Math.max(1, bw - 0.6)}" height="${h}" fill="${GRUPOS[gr][1]}"${s === i ? "" : ' opacity=".6"'}/>` : ""; }).join("");
    }).join("");
    const marcas = semanas52.filter((s, j) => j === 0 || E().semanas[s].slice(5, 7) !== E().semanas[s - 1]?.slice(5, 7)).filter((_, j) => j % 2 === 0)
      .map(s => `<text x="${4 + (s - desde) * bw}" y="${Hh - 2}">${MES[+E().semanas[s].slice(5, 7) - 1]}</text>`).join("");
    const cursor = `<line x1="${4 + (i - desde + 0.5) * bw}" x2="${4 + (i - desde + 0.5) * bw}" y1="4" y2="${Hh - 14}" stroke="var(--tinta)" stroke-dasharray="2 2"/>`;
    return `
      <div class="emb-semana">
        <label for="embSemana"><span class="etq">Semana del ${fecha(i)}</span></label>
        <input type="range" id="embSemana" min="${desde}" max="${u}" step="1" value="${i}" data-k="${k}" aria-label="Semana">
      </div>
      <div class="kpis">
        <div class="kpi"><div class="v">${fmtT(total)}</div><div class="l">embarcadas esa semana${totalAntes ? ` · ${pctVar(total / totalAntes - 1)} contra la misma semana de ${+E().semanas[i].slice(0, 4) - 1}` : ""}</div></div>
        <div class="kpi"><div class="v">${total ? pct(g.mx / total) : "—"}</div><div class="l">cruzó de México${total ? ` · EE. UU. ${pct(g.eua / total)} · importación ${pct(g.imp / total)}` : ""}</div></div>
      </div>
      <svg class="estac" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Embarques por semana y origen">${barras}${cursor}${marcas}</svg>
      <div class="leyenda-cadena">${Object.entries(GRUPOS).filter(([gr]) => tot52.some(x => x[gr] > 0)).map(([, [n, c]]) => `<span><i style="background:${c}"></i>${n}</span>`).join("")}</div>
      <div class="desplaza"><table class="compacta">
        <tr><th>Origen</th><th class="num">Semana</th><th class="num">Año anterior</th><th class="num">Parte</th></tr>
        ${lista.slice(0, 10).map(x => `<tr${x.meta[3] === "mx" ? ' class="resaltado"' : ""}><td><i class="cmp-punto" style="background:${GRUPOS[x.meta[3]][1]}"></i><span translate="no">${nombreOrigen(x.meta)}</span>${x.meta[6] ? `<br><span class="est">${x.meta[6].join(", ")}</span>` : ""}</td>
          <td class="num">${fmtT(x.t)}</td><td class="num">${x.antes ? fmtT(x.antes) : "—"}</td><td class="num">${total ? pct(x.t / total) : "—"}</td></tr>`).join("")}
      </table></div>
      ${vista === "mx" ? estadosHTML(k, i) : ""}
      <p class="sub">USDA AMS, embarques semanales por zona de origen (reporte National Shipping Point Trends; 1,000 cwt = 45.4 t), desde febrero de 2021. No cubre toda la producción: solo los distritos y cruces que reporta el USDA. ${vista === "eua" ? "En el mapa, círculos del tamaño de lo embarcado esa semana; mueve la semana para ver cómo cambia el abasto." : "El USDA no dice de qué estado de México viene lo que cruza."}</p>`;
  }
  function ofertaResumen(k) {
    if (!disponible(k)) return "";
    const i = semanaDe(k), g = porGrupo(k, i), t = g.eua + g.mx + g.imp + g.mixto;
    return `Semana del ${fecha(i)}: ${fmtT(t)}, ${t ? pct(g.mx / t) : "—"} de México`;
  }

  // ---------- Pronóstico de 8 semanas ----------
  function pronosticoHTML(k) {
    const p = P()?.productos?.[k];
    const pr = p?.precio?.mayoreo ?? p?.precio?.frontera;
    if (!p || (!pr && !Object.keys(p.oferta ?? {}).length)) return '<p class="sub">Sin historia suficiente del USDA para pronosticar este producto.</p>';
    const S = P().semanas;
    let grafica = "";
    if (pr) {
      const [i0, serie] = pr.serie, u = pr.ultima;
      const hist = serie.map((v, j) => [i0 + j, v]).filter(([i]) => i > u - 52);
      const fut = pr.p50.map((v, h) => [u + h + 1, v, pr.p20[h], pr.p80[h]]).filter(x => x[1] != null);
      const vals = [...hist.map(x => x[1]), ...fut.flatMap(x => [x[1], x[2], x[3]])].filter(v => v != null);
      const max = Math.max(...vals) * 1.1, W = 320, Hh = 120, i1 = u - 51;
      const x = i => 26 + (i - i1) / (60 - 1) * (W - 32), y = v => Hh - 16 - v / max * (Hh - 24);
      const linea = hist.filter(([, v]) => v != null).map(([i, v]) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
      const banda = fut.filter(f => f[2] != null && f[3] != null);
      const area = banda.length ? `<polygon points="${banda.map(f => `${x(f[0]).toFixed(1)},${y(f[3]).toFixed(1)}`).join(" ")} ${[...banda].reverse().map(f => `${x(f[0]).toFixed(1)},${y(f[2]).toFixed(1)}`).join(" ")}" fill="var(--c-importa)" opacity=".18"/>` : "";
      const futura = `<polyline points="${[[u, hist.at(-1)?.[1]], ...fut.map(f => [f[0], f[1]])].filter(z => z[1] != null).map(([i, v]) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}" fill="none" stroke="var(--c-importa)" stroke-width="2" stroke-dasharray="4 3"/>`;
      grafica = `
        <svg class="estac" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Precio semanal y pronóstico">
          ${[0.5, 1].map(f => `<line x1="26" x2="${W - 6}" y1="${y(max / 1.1 * f)}" y2="${y(max / 1.1 * f)}" stroke="var(--linea)"/><text x="0" y="${y(max / 1.1 * f) + 3}">${(max / 1.1 * f).toFixed(2)}</text>`).join("")}
          ${area}<polyline points="${linea}" fill="none" stroke="var(--productor)" stroke-width="2"/>${futura}
          <line x1="${x(u)}" x2="${x(u)}" y1="4" y2="${Hh - 16}" stroke="var(--tenue)" stroke-dasharray="2 2"/>
          <text x="${x(i1)}" y="${Hh - 2}">${S[i1]?.slice(0, 7) ?? ""}</text><text x="${x(u) - 18}" y="${Hh - 2}">${S[u]?.slice(0, 7) ?? ""}</text>
        </svg>
        <div class="leyenda-cadena"><span><i style="background:var(--productor)"></i>Precio observado (US$/kg)</span><span><i style="background:var(--c-importa)"></i>Pronóstico y rango probable (el precio real cayó ahí 6 de cada 10 veces)</span></div>`;
    }
    const semanasFut = Array.from({ length: P().horizonte }, (_, h) => p.ultima + h + 1);
    const nombreSemana = i => { const d = new Date(S[0] + "T12:00:00"); d.setDate(d.getDate() + 7 * i); return `${d.getDate()} ${MES[d.getMonth()]}`; };
    const oferta = p.oferta ?? {};
    const tabla = `
      <div class="desplaza"><table class="compacta">
        <tr><th>Semana del</th>${pr ? '<th class="num">Precio US$/kg</th>' : ""}${["eua", "mx", "imp"].filter(g => oferta[g]).map(g => `<th class="num">${GRUPOS[g][0]}</th>`).join("")}</tr>
        ${semanasFut.map((i, h) => `<tr><td>${nombreSemana(i)}</td>${pr ? `<td class="num">${pr.p50[h] != null ? pr.p50[h].toFixed(2) : "—"}${pr.p20[h] != null ? `<br><span class="est">${pr.p20[h].toFixed(2)}–${pr.p80[h].toFixed(2)}</span>` : ""}</td>` : ""}
          ${["eua", "mx", "imp"].filter(g => oferta[g]).map(g => `<td class="num">${oferta[g][h] != null ? fmtT(oferta[g][h]) : "—"}</td>`).join("")}</tr>`).join("")}
      </table></div>`;
    const confiable = pr?.mape?.length ? pr.mape[1] ?? pr.mape[0] : null;
    return `
      ${grafica}
      ${tabla}
      ${pr ? `<div class="nota"><b>Qué tan bueno es:</b> <span>Probado sobre los dos últimos años, se equivocó en promedio ${pr.mape.map((m, j) => `${pct(m)} a ${[1, 4, 8][j]} semana${j ? "s" : ""}`).join(", ")}.</span>
        <span>Suponer que el precio no cambia se equivoca ${(pr.mapeIngenuo ?? []).map(m => pct(m)).join(", ")}.</span>
        <span>${(pr.metodo ?? "").includes("e") ? `La estacionalidad mejora el pronóstico a partir de la semana ${pr.metodo.indexOf("e") + 1}; antes se usa el último precio.` : "En este producto la estacionalidad no mejora a la referencia: se muestra el último precio."}</span>
        <span>${confiable != null && confiable > 0.25 ? "El error es alto: úsalo solo como orientación." : "Sirve para anticipar la tendencia, no el precio exacto."}</span>
        <span>${Math.abs(pr.factor - 1) < 0.05 ? "Hoy el precio está en su nivel normal para estas fechas." : `Hoy el precio está ${Math.round(Math.abs(pr.factor - 1) * 100)}% ${pr.factor > 1 ? "arriba" : "abajo"} de lo normal para estas fechas.`}</span></div>` : ""}
      <p class="sub"><span>Oferta: la misma semana en años anteriores ajustada por el nivel reciente, sin prueba de error.</span>
        <span>Precio: la misma semana en años anteriores (USDA, desde 2021) ajustada por cómo vienen las últimas cuatro semanas frente a esas mismas semanas de otros años.</span>
        <span>Precio de referencia:</span> <span translate="no">${window.Paleta.usdaES(pr?.referencia ?? "—")}</span> <span>${p.precio?.mayoreo ? "(mayoreo en Los Ángeles, Chicago y Nueva York)." : "(FOB en la frontera)."}</span>
        <span>No anticipa heladas, plagas, cambios de aranceles ni choques de demanda.</span> <span>Calculado el ${P().generado}.</span></p>`;
  }
  function pronosticoResumen(k) {
    const pr = P()?.productos?.[k]?.precio?.mayoreo ?? P()?.productos?.[k]?.precio?.frontera;
    if (!pr) return "Sin historia suficiente para pronosticar";
    const ult = pr.serie[1].at(-1) ?? pr.serie[1].filter(v => v != null).at(-1);
    const fin = pr.p50.filter(v => v != null).at(-1);
    return ult && fin ? `Precio en 8 semanas: US$${fin.toFixed(2)} el kg (${pctVar(fin / ult - 1)} contra la última semana)` : "Pronóstico de 8 semanas";
  }

  // ---------- Llenado diferido de los marcadores ----------
  function llenar(el) {
    el.dataset.lleno = "1";
    const { embarques: modo, k, vista } = el.dataset;
    const pintar = () => {
      el.innerHTML = modo === "pronostico" ? pronosticoHTML(k) : ofertaHTML(k, vista);
      const r = el.closest("details.seccion")?.querySelector("summary [data-auto]");
      if (r) r.textContent = modo === "pronostico" ? pronosticoResumen(k) : ofertaResumen(k);
      const rango = el.querySelector("#embSemana");
      if (rango) rango.oninput = () => { semana = +rango.value; el.dataset.lleno = ""; llenar(el); escuchas.forEach(f => f(k, semana)); };
    };
    if (E()) return pintar();
    el.innerHTML = '<p class="sub">Cargando embarques del USDA…</p>';
    const bajar = () => cargar().then(pintar).catch(() => { el.innerHTML = '<p class="sub">No se pudieron cargar los embarques.</p>'; });
    // En una sección cerrada, los embarques (~400 kB con pronóstico y origen) se bajan hasta que se abre
    if (!window.Seccion) return bajar();
    if (window.Seccion.alAbrir(el, bajar)) {
      const r = el.closest("details.seccion")?.querySelector("summary [data-auto]");
      if (r) r.textContent = modo === "pronostico" ? "Ábrela para ver el pronóstico de las próximas 8 semanas" : "Ábrela para ver quién abastece a EE. UU. semana a semana";
    }
  }
  const revisar = raiz => raiz.querySelectorAll?.("[data-embarques]:not([data-lleno='1'])").forEach(llenar);
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) { if (n.matches?.("[data-embarques]:not([data-lleno='1'])")) llenar(n); revisar(n); } })))
    .observe(document.body, { childList: true, subtree: true });
  const marca = (modo, k, vista) => `<div data-embarques="${modo}" data-k="${k}" data-vista="${vista}"></div>`;

  // ---------- Capa del mapa (vista de EE. UU.): círculo por origen del tamaño de lo embarcado esa semana ----------
  function crearCapa(mapa) {
    const grupo = window.L.layerGroup();
    let actual = null;
    function dibujar(k) {
      actual = k;
      grupo.clearLayers();
      if (!E()) { cargar().then(() => { if (actual === k) dibujar(k); }); return; }
      if (!disponible(k)) return;
      const i = semanaDe(k), lista = porOrigen(k, i).filter(x => x.t > 0);
      const max = Math.max(...Object.keys(E().productos[k]).map(o => Math.max(...E().productos[k][o][1])), 1);
      const t = window.Paleta.tokens();
      lista.forEach(x => {
        const [nombre, lat, lon, tipo] = x.meta;
        const color = tipo === "mx" ? t.importa : tipo === "imp" ? getComputedStyle(document.documentElement).getPropertyValue("--minorista").trim() : tipo === "mixto" ? getComputedStyle(document.documentElement).getPropertyValue("--transporte").trim() : t.exc;
        window.L.circleMarker([lat, lon], { pane: "markerPane", radius: 4 + 26 * Math.sqrt(x.t / max), color, weight: 1.5, fillColor: color, fillOpacity: 0.45 })
          .bindTooltip(`<b>${nombreOrigen(x.meta)}</b><br>Semana del ${fecha(i)}: <b>${fmtT(x.t)}</b>${x.antes ? `<br>Misma semana del año anterior: ${fmtT(x.antes)}` : ""}${x.meta[6] ? `<br><span style="opacity:.7">${x.meta[6].join(", ")}</span>` : ""}`)
          .addTo(grupo);
      });
    }
    escuchas.push(k => { if (k === actual) dibujar(k); });
    return {
      dibujar, mostrar: () => grupo.addTo(mapa), ocultar: () => grupo.remove(),
      leyendaHTML: () => `<div class="fila" style="margin-top:8px"><b>Embarques de la semana (USDA)</b></div>` +
        ["eua", "mx", "imp"].map(g => `<div class="fila"><span class="sw" style="background:${GRUPOS[g][1]};border-radius:50%"></span>${GRUPOS[g][0]}</div>`).join("")
    };
  }

  // estadosEstimados se expone para la validación contra Data México (scripts/validar_origen_estados.py)
  window.Embarques = { cargar, marca, crearCapa, disponible: k => !E() || disponible(k), estadosEstimados };
})();

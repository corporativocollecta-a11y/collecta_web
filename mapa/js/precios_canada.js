// ============================================================================
// Canadá: precio de mayoreo en Toronto y Montreal por país de origen (window.PRECIOS_CANADA, InfoHort de Agriculture
// and Agri-Food Canada; scripts/procesar_precios_canada.py), en US$/kg, frente al mayoreo del producto mexicano en las
// terminales de EE. UU. (window.PRECIOS_EUA). Va en la pestaña Exportar, en la ficha de decisión y en la vista de Canadá.
// ============================================================================
(function () {
  const C = () => window.PRECIOS_CANADA;
  const MESES = new Proxy(["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
    { get: (a, i) => i === "0" && document.documentElement.lang === "en" ? "J" : Reflect.get(a, i) });
  const MESES_L = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const usd = n => "US$" + n.toFixed(2);
  const pct = x => Math.round(x * 100) + "%";
  const pctVar = x => (x >= 0 ? "+" : "−") + Math.abs(Math.round(x * 100)) + "%";
  const fecha = iso => { const [a, m, d] = iso.split("-").map(Number); return `${d} de ${MESES_L[m - 1]} de ${a}`; };

  const datos = k => C()?.productos?.[k];
  // mayoreo del producto mexicano en las terminales de EE. UU. (misma medida: precio de reventa del mayorista)
  const eua = k => { const p = window.PRECIOS_EUA?.productos?.[k]; return p?.mx?.precio ?? p?.precio ?? null; };
  const tc = () => window.PRECIOS_EUA?.tipoCambio?.valor;

  // Meses en que México tiene al menos 20% de las cotizaciones y su precio es el más alto del año
  function mejoresMeses(d) {
    return d.mensualMX.map((v, i) => [v, i]).filter(([v, i]) => v != null && (d.parteMes[i] ?? 0) >= 0.2)
      .sort((a, b) => b[0] - a[0]).slice(0, 2).sort((a, b) => a[1] - b[1]).map(([, i]) => MESES_L[i]);
  }

  function grafica(d) {
    const series = [["Origen México", d.mensualMX, "var(--c-importa)", ""], ["Otros orígenes", d.mensualOtros, "var(--suave)", "4 3"]]
      .filter(s => s[1].some(v => v != null));
    if (!series.length) return "";
    const vals = series.flatMap(s => s[1].filter(v => v != null));
    const max = Math.max(...vals) * 1.15, W = 300, H = 118, x = i => 18 + i * (W - 26) / 11, y = v => H - 24 - v / max * (H - 34);
    const linea = (v, c, dash) => {
      const tramos = []; let actual = [];
      v.forEach((p, i) => { if (p != null) actual.push(`${x(i).toFixed(1)},${y(p).toFixed(1)}`); else if (actual.length) { tramos.push(actual); actual = []; } });
      if (actual.length) tramos.push(actual);
      return tramos.map(tr => tr.length > 1 ? `<polyline points="${tr.join(" ")}" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="${dash}"/>`
        : `<circle cx="${tr[0].split(",")[0]}" cy="${tr[0].split(",")[1]}" r="2.5" fill="${c}"/>`).join("");
    };
    // franja inferior: parte de las cotizaciones con producto mexicano en cada mes
    const barras = d.parteMes.map((p, i) => p ? `<rect x="${(x(i) - 8).toFixed(1)}" y="${(H - 18 + 8 * (1 - p)).toFixed(1)}" width="16" height="${(8 * p).toFixed(1)}" fill="var(--c-importa)" opacity=".45"><title>${MESES_L[i]}: ${pct(p)} de las cotizaciones son de México</title></rect>` : "").join("");
    return `<h4 class="mini">Precio por mes en Toronto y Montreal (US$/kg)</h4>
      <svg class="estac" viewBox="0 0 ${W} ${H}" role="img" aria-label="Precio mensual en Canadá">
        ${[0.5, 1].map(f => `<line x1="18" x2="${W - 8}" y1="${y(max * f / 1.15)}" y2="${y(max * f / 1.15)}" stroke="var(--linea)"/><text x="0" y="${y(max * f / 1.15) + 3}">${(max * f / 1.15).toFixed(1)}</text>`).join("")}
        ${series.map(s => linea(s[1], s[2], s[3])).join("")}
        ${barras}
        ${MESES.map((m, i) => `<text x="${x(i) - 3}" y="${H - 1}">${m}</text>`).join("")}
      </svg>
      <div class="leyenda-cadena">${series.map(s => `<span><i style="background:${s[2]}"></i>${s[0]}</span>`).join("")}<span><i style="background:var(--c-importa);opacity:.45"></i>Parte de México en las cotizaciones</span></div>`;
  }

  function html(k) {
    const d = datos(k);
    if (!d) return "";
    const D = C(), us = eua(k), t = tc();
    const hayMX = d.precioMX != null && d.nMX >= 10;
    const fl = D.fletes ?? {};
    const mejores = hayMX ? mejoresMeses(d) : [];
    const mercados = Object.entries(d.mercados);
    const otros = d.rivales.filter(r => r[0] !== "México").slice(0, 3);
    return `
      <h3>Canadá: mayoreo en Toronto y Montreal <span class="tag ok">InfoHort ${D.hasta.slice(0, 4)}</span></h3>
      <div class="kpis">
        ${hayMX ? `<div class="kpi destacado"><div class="v">${usd(d.precioMX)}/kg</div>
          <div class="l">producto mexicano${t ? ` ($${(d.precioMX * t).toFixed(2)} pesos)` : ""}, mediana del último año; ${pct(d.nMX / d.n)} de las cotizaciones son de México</div></div>`
        : `<div class="kpi"><div class="v">Sin México</div><div class="l">en el último año no hubo cotizaciones de origen México; lo abastecen ${d.rivales.slice(0, 2).map(r => r[0]).join(" y ")}</div></div>`}
        ${hayMX && us && !d.noComparable ? `<div class="kpi"><div class="v">${pctVar(d.precioMX / us - 1)}</div><div class="l">frente al mayoreo del producto mexicano en EE. UU. (${usd(us)}/kg, USDA)</div></div>` : ""}
        ${otros.length && d.precioOtros != null ? `<div class="kpi"><div class="v">${usd(d.precioOtros)}/kg</div><div class="l">${hayMX ? "otros orígenes" : "todos los orígenes"}: ${otros.map(r => `${r[0]} ${pct(r[1])}`).join(", ")} de las cotizaciones</div></div>`
          : hayMX ? `<div class="kpi"><div class="v">Solo México</div><div class="l">no hubo cotizaciones de otros orígenes en el último año</div></div>` : ""}
      </div>
      ${hayMX && mejores.length ? `<p class="sub">Mejores meses con producto mexicano: ${mejores.join(" y ")}.</p>` : ""}
      ${grafica(d)}
      ${mercados.length ? `<div class="desplaza"><table class="compacta">
        <tr><th>Mercado</th><th class="num">México US$/kg</th><th class="num">Todos US$/kg</th><th class="num">Parte de México</th><th class="num">Flete estimado</th></tr>
        ${mercados.map(([m, v]) => `<tr><td translate="no">${m}</td><td class="num">${v[0] != null ? v[0].toFixed(2) : "—"}</td><td class="num">${v[3].toFixed(2)}</td><td class="num">${pct(v[2])}</td>
          <td class="num">${fl[m] ? `${fl[m].usdKg.toFixed(2)} <span class="est">desde <span translate="no">${fl[m].cruce}</span></span>` : "—"}</td></tr>`).join("")}
      </table></div>` : ""}
      <p class="sub">Precio que piden los mayoristas de Toronto y Montreal a las tiendas (InfoHort, Agriculture and Agri-Food Canada), del ${fecha(D.desde)} al ${fecha(D.hasta)};
        <span translate="no">${document.documentElement.lang === "en" ? d.variedadEn ?? d.variedad : d.variedad}</span>, sin orgánicos; por kg según el peso del empaque${d.noComparable === "peso" ? " (InfoHort no publica el peso de la caja: se supone la caja estándar de 25 lb, así que el precio por kg es aproximado y no se compara con EE. UU.)" : ""}.${d.noComparable === "variedad" ? " La variedad no es la misma que la referencia del USDA, así que no se compara con EE. UU." : ""} La gráfica usa todos los años desde ${D.historiaDesde.slice(0, 4)}.
        Dólares canadienses a US$ con ${D.cadPorUsd.valor.toFixed(4)} por dólar (${D.cadPorUsd.fuente}).
        El flete estimado usa la tarifa por km de los camiones refrigerados del USDA desde la frontera a las ciudades del este de EE. UU.; no incluye el cruce a Canadá.
        Como en EE. UU., es el precio de reventa: incluye flete, merma y el margen del importador y del mayorista.</p>`;
  }

  function resumen(k) {
    const d = datos(k);
    if (!d) return "";
    const us = eua(k);
    if (d.precioMX == null || d.nMX < 10) return `Sin producto mexicano en el último año · ${d.rivales[0]?.[0] ?? ""} ${pct(d.rivales[0]?.[1] ?? 0)} de las cotizaciones`;
    return `México ${usd(d.precioMX)}/kg, ${pct(d.nMX / d.n)} de las cotizaciones` + (us && !d.noComparable ? ` · ${pctVar(d.precioMX / us - 1)} frente a EE. UU.` : "");
  }

  // Una línea para la ficha de decisión (solo si hay producto mexicano en Canadá)
  function lineaFicha(k) {
    const d = datos(k), us = eua(k);
    if (!d || d.precioMX == null || d.nMX < 10) return "";
    const fl = C().fletes?.Toronto;
    return `En Canadá (mayoreo de Toronto y Montreal) el producto mexicano se vende en ${usd(d.precioMX)}/kg` +
      (us && !d.noComparable ? `, ${pctVar(d.precioMX / us - 1)} frente al mayoreo en EE. UU.` : d.noComparable === "peso" ? " (aproximado)" : "") +
      (fl ? `; el flete estimado a Toronto es de ${usd(fl.usdKg)}/kg.` : ".");
  }

  window.PreciosCanada = { html, resumen, lineaFicha, disponible: k => !!datos(k) };
})();

// ============================================================================
// Alertas de precio y oferta de la semana (window.ALERTAS_PRECIO, scripts/construir_alertas.py): movimientos fuertes
// del precio en EE. UU. (USDA) y en México (SNIIM), contra el año anterior, del pronóstico a 8 semanas y de lo que
// cruza de México. Bloque "Movimientos de la semana" en Resumen y lista por producto bajo su línea ejecutiva.
// ============================================================================
(function () {
  const A = () => window.ALERTAS_PRECIO;
  const pct = x => Math.abs(Math.round(x * 100)) + "%";
  const fmt = n => Math.round(n).toLocaleString("es-MX");
  const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const MES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mesAnio = (m, ingles) => m ? `${(ingles ? MES_EN : MES)[+m.slice(5) - 1]} ${m.slice(0, 4)}` : "";
  const fecha = iso => { const [, m, d] = iso.split("-").map(Number); return `${d} ${MES[m - 1]}`; };

  // En inglés el texto se arma directamente (lleva translate="no"): la variedad de referencia mezcla nombres del SNIIM
  // en español y del USDA en inglés, que el traductor por plantillas no cubre
  const en = () => document.documentElement.lang === "en";
  const REF_EN = { bola: "round", saladette: "Roma", amarillo: "yellow", globo: "globe", "cáscara de papel": "papershell", fresa: "strawberry",
    "tomate saladette": "Roma tomato", "pimiento morrón": "bell pepper", "lechuga iceberg": "iceberg lettuce", "melón chino": "cantaloupe",
    "limón persa": "Persian lime", "calabaza amarilla": "yellow squash", durazno: "peach" };
  function texto(a) {
    const sube = a.cambio > 0, c = pct(a.cambio);
    const nombre = (window.PRODUCTOS?.[a.k]?.nombre ?? "").toLowerCase();
    const refES = a.ref ? window.Paleta.usdaES(a.ref).toLowerCase() : "";
    const ref = !a.ref || a.ref.toLowerCase() === nombre || refES === nombre ? "" : en() ? (REF_EN[refES] ?? REF_EN[a.ref.toLowerCase()] ?? a.ref.toLowerCase()) : refES;
    const v = ref ? ` (${ref})` : "";
    if (en()) {
      const err = a.error != null ? ` (usually off by ±${pct(a.error)})` : "";
      switch (a.tipo) {
        case "precio_eua": return `U.S. price${v} ${sube ? "rose" : "fell"} ${c} in two weeks (US$${a.precio.toFixed(2)} per kg)`;
        case "precio_mx": return `Mexico wholesale${v} ${sube ? "rose" : "fell"} ${c} in two weeks ($${a.precio.toFixed(2)} MXN per kg)`;
        case "anual_eua": return `U.S. price${v} ${c} ${sube ? "higher" : "lower"} than a year ago`;
        case "anual_mx": return `Mexico wholesale${v} ${c} ${sube ? "higher" : "lower"} than a year ago`;
        case "pronostico_eua": return `U.S. forecast${v}: ${sube ? "up" : "down"} ${c} in 8 weeks${err}`;
        case "pronostico_mx": return `Mexico forecast${v}: ${sube ? "up" : "down"} ${c} in 8 weeks${err}`;
        case "embarques_mx": return `Crossings from Mexico ${c} ${sube ? "above" : "below"} a year ago (${fmt(a.t)} t in two weeks)`;
        case "internacional_mes": return `International price ${sube ? "rose" : "fell"} ${c} in the month (US$${fmt(a.precio)}/t, ${mesAnio(a.mes, true)})`;
        case "internacional_anual": return `International price ${c} ${sube ? "higher" : "lower"} than a year ago (US$${fmt(a.precio)}/t, ${mesAnio(a.mes, true)})`;
        default: return "";
      }
    }
    switch (a.tipo) {
      case "precio_eua": return `Precio en EE. UU.${v} ${sube ? "subió" : "bajó"} ${c} en dos semanas (US$${a.precio.toFixed(2)} el kg)`;
      case "precio_mx": return `Mayoreo en México${v} ${sube ? "subió" : "bajó"} ${c} en dos semanas ($${a.precio.toFixed(2)} el kg)`;
      case "anual_eua": return `Precio en EE. UU.${v} ${c} ${sube ? "más alto" : "más bajo"} que hace un año`;
      case "anual_mx": return `Mayoreo en México${v} ${c} ${sube ? "más caro" : "más barato"} que hace un año`;
      case "pronostico_eua": return `Pronóstico en EE. UU.${v}: ${sube ? "sube" : "baja"} ${c} en 8 semanas (suele fallar ±${pct(a.error)})`;
      case "pronostico_mx": return `Pronóstico en México${v}: ${sube ? "sube" : "baja"} ${c} en 8 semanas (suele fallar ±${pct(a.error)})`;
      case "embarques_mx": return `Cruzó de México ${c} ${sube ? "más" : "menos"} que hace un año (${fmt(a.t)} t en dos semanas)`;
      case "internacional_mes": return `Precio internacional ${sube ? "subió" : "bajó"} ${c} en el mes (US$${fmt(a.precio)} la tonelada, ${mesAnio(a.mes)})`;
      case "internacional_anual": return `Precio internacional ${c} ${sube ? "más alto" : "más bajo"} que hace un año (US$${fmt(a.precio)} la tonelada, ${mesAnio(a.mes)})`;
      default: return "";
    }
  }
  // para quién es buena noticia: precio alto o menos competencia = productor; precio bajo = comprador
  const clase = a => a.tipo === "embarques_mx" ? "ok" : a.cambio > 0 ? "alerta-tag" : "exc";
  const porProducto = () => {
    const g = {};
    (A()?.alertas ?? []).filter(a => window.PRODUCTOS?.[a.k]).forEach(a => (g[a.k] ??= []).push(a));
    return Object.entries(g).sort((x, y) => Math.max(...y[1].map(a => Math.abs(a.cambio))) - Math.max(...x[1].map(a => Math.abs(a.cambio))));
  };

  function tableroHTML() {
    const g = porProducto();
    if (!g.length) return "";
    return `
      <div class="alerta-oferta alertas-precio">
        <span class="etq">Movimientos de la semana · USDA al ${fecha(A().semanaEUA)} · SNIIM al ${fecha(A().semanaMX)}</span>
        <h3>Precios y embarques que se movieron fuerte</h3>
        <div class="lista-alertas">
          ${g.slice(0, 8).map(([k, as]) => `<button class="fila-alerta" type="button" data-prod="${k}">
            <span class="prod"><i style="background:${window.PRODUCTOS[k].color}"></i>${window.PRODUCTOS[k].nombre}</span>
            <span class="txt">${as.slice(0, 2).map(a => `<span class="tag ${clase(a)}">${a.cambio > 0 ? "▲" : "▼"} ${pct(a.cambio)}</span> <span translate="${en() ? "no" : "yes"}">${texto(a)}</span>`).join("<br>")}</span></button>`).join("")}
        </div>
        <p class="sub">${A().alertas.length} señales en ${g.length} productos. Umbrales: precio ±15% en dos semanas, ±30% contra hace un año; pronóstico ±20% en 8 semanas (solo si suele fallar menos de ±30%); embarques de México ±30% contra hace un año; precio internacional de granos ±8% en el mes o ±25% contra hace un año. Detalle en cada producto.</p>
      </div>`;
  }
  function productoHTML(k) {
    const as = (A()?.alertas ?? []).filter(a => a.k === k);
    if (!as.length) return "";
    return `<div class="alertas-producto">${as.map(a => `<div><span class="tag ${clase(a)}">${a.cambio > 0 ? "▲" : "▼"} ${pct(a.cambio)}</span> <span translate="${en() ? "no" : "yes"}">${texto(a)}</span></div>`).join("")}</div>`;
  }
  window.AlertasPrecio = { tableroHTML, productoHTML, disponible: () => !!A()?.alertas?.length };
})();

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
  const fecha = iso => { const [, m, d] = iso.split("-").map(Number); return `${d} ${MES[m - 1]}`; };

  function texto(a) {
    const sube = a.cambio > 0, c = pct(a.cambio);
    const v = a.ref && a.ref.toLowerCase() !== (window.PRODUCTOS?.[a.k]?.nombre ?? "").toLowerCase() ? ` (${window.Paleta.usdaES(a.ref).toLowerCase()})` : "";
    switch (a.tipo) {
      case "precio_eua": return `Precio en EE. UU.${v} ${sube ? "subió" : "bajó"} ${c} en dos semanas (US$${a.precio.toFixed(2)} el kg)`;
      case "precio_mx": return `Mayoreo en México${v} ${sube ? "subió" : "bajó"} ${c} en dos semanas ($${a.precio.toFixed(2)} el kg)`;
      case "anual_eua": return `Precio en EE. UU.${v} ${c} ${sube ? "más alto" : "más bajo"} que hace un año`;
      case "anual_mx": return `Mayoreo en México${v} ${c} ${sube ? "más caro" : "más barato"} que hace un año`;
      case "pronostico_eua": return `Pronóstico en EE. UU.${v}: ${sube ? "sube" : "baja"} ${c} en 8 semanas (suele fallar ±${pct(a.error)})`;
      case "pronostico_mx": return `Pronóstico en México${v}: ${sube ? "sube" : "baja"} ${c} en 8 semanas (suele fallar ±${pct(a.error)})`;
      case "embarques_mx": return `Cruzó de México ${c} ${sube ? "más" : "menos"} que hace un año (${fmt(a.t)} t en dos semanas)`;
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
            <span class="txt">${as.slice(0, 2).map(a => `<span class="tag ${clase(a)}">${a.cambio > 0 ? "▲" : "▼"} ${pct(a.cambio)}</span> <span>${texto(a)}</span>`).join("<br>")}</span></button>`).join("")}
        </div>
        <p class="sub">${A().alertas.length} señales en ${g.length} productos. Umbrales: precio ±15% en dos semanas, ±30% contra hace un año; pronóstico ±20% en 8 semanas (solo si suele fallar menos de ±30%); embarques de México ±30% contra hace un año. Detalle en cada producto.</p>
      </div>`;
  }
  function productoHTML(k) {
    const as = (A()?.alertas ?? []).filter(a => a.k === k);
    if (!as.length) return "";
    return `<div class="alertas-producto">${as.map(a => `<div><span class="tag ${clase(a)}">${a.cambio > 0 ? "▲" : "▼"} ${pct(a.cambio)}</span> <span>${texto(a)}</span></div>`).join("")}</div>`;
  }
  window.AlertasPrecio = { tableroHTML, productoHTML, disponible: () => !!A()?.alertas?.length };
})();

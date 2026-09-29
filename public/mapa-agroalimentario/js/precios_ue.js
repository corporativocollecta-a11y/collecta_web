// ============================================================================
// Precios en la Unión Europea (Comisión Europea, window.PRECIOS_UE): precio en empacadora de cada país productor,
// en US$/kg, frente al precio FOB del producto mexicano en la frontera con EE. UU. (window.PRECIOS_EUA).
// ============================================================================
(function () {
  const U = () => window.PRECIOS_UE;
  let nombresES = null;
  try { nombresES = new Intl.DisplayNames(["es"], { type: "region" }); } catch (e) { nombresES = null; }
  const nombre = iso => { const c = iso === "EL" ? "GR" : iso; try { return nombresES?.of(c) ?? c; } catch (e) { return c; } };

  function html(k, soloPais) {
    const d = U()?.productos?.[k];
    if (!d || !Object.keys(d).length) return "";
    const filas = Object.entries(d).filter(([p]) => !soloPais || p === soloPais).sort((a, b) => b[1][1] - a[1][1]);
    if (!filas.length) return "";
    const mx = window.PRECIOS_EUA?.productos?.[k]?.frontera?.precio;
    const pct = x => (x >= 0 ? "+" : "") + (x * 100).toFixed(0) + "%";
    return `
      <h3>${soloPais ? "Precio al productor" : "Precio del productor europeo"} <span class="tag ok">Comisión Europea ${U().anio}</span></h3>
      <table>
        <tr><th>País</th><th class="num">€/kg</th><th class="num">US$/kg</th>${mx ? '<th class="num">vs. México en frontera</th>' : ""}</tr>
        ${filas.map(([p, [eur, usd, n]]) => `<tr><td>${nombre(p)}</td><td class="num">${eur.toFixed(2)}</td><td class="num">${usd.toFixed(2)}</td>${mx ? `<td class="num">${pct(usd / mx - 1)}</td>` : ""}</tr>`).join("")}
      </table>
      <p class="sub">Mediana ${U().anio} del precio en empacadora (lo que recibe el productor al empacar), semanal, todas las variedades sin orgánicos (en jitomate incluye cherry); ${U().usdPorEur} US$ por euro (Reserva Federal).${mx ? ` México en la frontera con EE. UU.: US$${mx.toFixed(2)}/kg (USDA, FOB). No incluye flete a Europa, aranceles ni certificaciones.` : ""}</p>`;
  }

  // Resumen de una línea: país con el precio más alto (o el país de la vista) frente a México en la frontera
  function resumen(k, soloPais) {
    const d = U()?.productos?.[k];
    if (!d) return "";
    const filas = Object.entries(d).filter(([p]) => !soloPais || p === soloPais).sort((a, b) => b[1][1] - a[1][1]);
    if (!filas.length) return "";
    const mx = window.PRECIOS_EUA?.productos?.[k]?.frontera?.precio;
    const [p, [, usd]] = filas[0];
    return `${soloPais ? "Productor en " : "Más alto: "}${nombre(p)}, US$${usd.toFixed(2)} el kg` + (mx ? ` · México en la frontera, US$${mx.toFixed(2)}` : "");
  }

  window.PreciosUE = { html, resumen };
})();

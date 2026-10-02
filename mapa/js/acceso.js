// ============================================================================
// Acceso a mercados para fruta y hortaliza fresca de México (window.ACCESO, scripts/construir_acceso.py):
// estado fitosanitario (abierto / con condiciones / cerrado), requisito principal y arancel, con la fuente de cada dato.
// ============================================================================
(function () {
  const A = () => window.ACCESO;
  const ETIQUETA = { abierto: ["Abierto", "ok"], con_condiciones: ["Con condiciones", "alerta-tag"], cerrado: ["Cerrado", "def"], sin_dato: ["Sin dato", ""] };
  // País (ISO2) → mercado de la matriz
  const UE = new Set(["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"]);
  const mercadoDe = iso => iso === "US" ? "EUA" : iso === "CA" ? "CAN" : iso === "GB" ? "RU" : iso === "JP" ? "JPN" : iso === "CN" ? "CHN" : iso === "KR" ? "KOR" : UE.has(iso) ? "UE" : null;

  const celda = (k, iso) => { const m = mercadoDe(iso); return m ? A()?.productos?.[k]?.[m] : null; };
  const etiqueta = e => { const [t, c] = ETIQUETA[e?.estado] ?? ETIQUETA.sin_dato; return `<span class="tag ${c}">${t}</span>`; };

  // En inglés se usan los campos *_en de los datos (el traductor de la interfaz no cubre el texto de cada requisito)
  const en = () => document.documentElement.lang === "en";
  const req = e => en() && e.requisito_en ? e.requisito_en : e.requisito;
  const arancel = e => en() && e.arancel_en ? e.arancel_en : e.arancel;
  const tn = () => en() ? ' translate="no"' : "";   // texto que ya viene en inglés de los datos
  const nombreMercado = info => en() && info.nombre_en ? info.nombre_en : info.nombre;

  function html(k) {
    const P = A()?.productos?.[k];
    if (!P) return "";
    return `
      <h3>Acceso a mercados <span class="tag ok">consulta ${A().actualizado}</span></h3>
      <table class="acceso">
        <tr><th>Mercado</th><th>Situación</th><th class="num">Arancel</th></tr>
        ${Object.entries(A().mercados).map(([m, info]) => { const e = P[m]; return e ? `
          <tr><td><b${tn()}>${nombreMercado(info)}</b><br><span class="est"${tn()}>${req(e)}</span> <a href="${e.url}" target="_blank" rel="noopener">fuente</a></td>
          <td>${etiqueta(e)}</td><td class="num"><span${tn()}>${arancel(e) ?? "—"}</span>${e.url_arancel ? ` <a href="${e.url_arancel}" target="_blank" rel="noopener">↗</a>` : ""}</td></tr>` : ""; }).join("")}
      </table>
      <p class="sub">Acceso fitosanitario y arancel para producto fresco de origen México. "Abierto" en UE, Japón y Corea significa que no figura entre los productos prohibidos ni con requisitos especiales. No incluye límites de residuos de plaguicidas, normas de comercialización ni registro de huertos. Los protocolos cambian: verificar antes de embarcar.</p>`;
  }

  // Resumen de una línea (nombres en español: la versión en inglés los traduce al pintar)
  function resumen(k) {
    const P = A()?.productos?.[k];
    if (!P) return "";
    const est = Object.entries(A().mercados).filter(([m]) => P[m]).map(([m, info]) => [info.nombre, P[m].estado]);
    const abiertos = est.filter(x => x[1] === "abierto").length, cond = est.filter(x => x[1] === "con_condiciones").length;
    const cerrados = est.filter(x => x[1] === "cerrado").map(x => `<b>${x[0]}</b>`);
    const base = abiertos && cond ? `Abierto en ${abiertos} y con condiciones en ${cond} de ${est.length} mercados`
      : abiertos ? `Abierto en ${abiertos} de ${est.length} mercados` : cond ? `Con condiciones en ${cond} de ${est.length} mercados` : `Sin acceso abierto en los ${est.length} mercados`;
    return base + (cerrados.length && (abiertos || cond) ? ` · cerrado en ${cerrados.join(", ")}` : "");
  }

  // Situación de un solo mercado (vista por país y mercado de destino); iso = código ISO2 del país comprador
  function mercadoHTML(k, iso) {
    const m = mercadoDe(iso), e = celda(k, iso);
    if (!e) return "";
    return `<div class="acceso-mercado">${etiqueta(e)} <b${tn()}>${nombreMercado(A().mercados[m])}</b> · arancel <span${tn()}>${arancel(e) ?? "—"}</span>
      <br><span class="est"${tn()}>${req(e)}</span> <a href="${e.url}" target="_blank" rel="noopener">fuente</a></div>`;
  }

  // Resumen de un solo mercado: situación y arancel (en inglés se usan los campos *_en)
  function resumenMercado(k, iso) {
    const e = celda(k, iso);
    if (!e) return "";
    const est = { abierto: ["Abierto", "Open"], con_condiciones: ["Con condiciones", "With conditions"], cerrado: ["Cerrado", "Closed"] }[e.estado] ?? ["Sin dato", "No data"];
    return `<span${tn()}>${est[en() ? 1 : 0]} · ${en() ? "tariff" : "arancel"} ${arancel(e) ?? "—"}</span>`;
  }

  window.Acceso = { html, arancel, tn, celda, etiqueta, mercadoDe, resumen, resumenMercado, mercadoHTML, estado: (k, iso) => celda(k, iso)?.estado ?? null };
})();

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
  const nombreMercado = info => en() && info.nombre_en ? info.nombre_en : info.nombre;

  function html(k) {
    const P = A()?.productos?.[k];
    if (!P) return "";
    return `
      <h3>Acceso a mercados <span class="tag ok">consulta ${A().actualizado}</span></h3>
      <table class="acceso">
        <tr><th>Mercado</th><th>Situación</th><th class="num">Arancel</th></tr>
        ${Object.entries(A().mercados).map(([m, info]) => { const e = P[m]; return e ? `
          <tr><td><b>${nombreMercado(info)}</b><br><span class="est">${req(e)}</span> <a href="${e.url}" target="_blank" rel="noopener">fuente</a></td>
          <td>${etiqueta(e)}</td><td class="num">${arancel(e) ?? "—"}${e.url_arancel ? ` <a href="${e.url_arancel}" target="_blank" rel="noopener">↗</a>` : ""}</td></tr>` : ""; }).join("")}
      </table>
      <p class="sub">Acceso fitosanitario y arancel para producto fresco de origen México. "Abierto" en UE, Japón y Corea significa que no figura entre los productos prohibidos ni con requisitos especiales. No incluye límites de residuos de plaguicidas, normas de comercialización ni registro de huertos. Los protocolos cambian: verificar antes de embarcar.</p>`;
  }

  window.Acceso = { html, celda, etiqueta, mercadoDe };
})();

// ============================================================================
// Helada y lluvia fuerte en los próximos días (window.CLIMA_SMN, scripts/procesar_clima_smn.py): pronóstico por
// municipio del SMN cruzado con la producción municipal del SIAP. El pronóstico vence: solo se muestra si se generó
// hace 3 días o menos; si no, la sección avisa que está vencido.
// ============================================================================
(function () {
  const C = () => window.CLIMA_SMN;
  const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const pct = x => x < 0.01 && x > 0 ? "<1%" : (x * 100).toFixed(0) + "%";
  const fecha = iso => { const [a, m, d] = iso.split("-").map(Number); return `${d} ${MES[m - 1]}`; };
  const fmt = n => Math.round(n).toLocaleString("es-MX");
  const ALERTAS = {
    helada: ["Helada (0 °C o menos)", "exc"], riesgoHelada: ["Riesgo de helada (3 °C o menos)", "alerta-tag"],
    lluviaMuyFuerte: ["Lluvia muy fuerte (50 mm o más en un día)", "exc"], lluviaFuerte: ["Lluvia fuerte (25 mm o más en un día)", "alerta-tag"]
  };
  const edad = () => C() ? Math.round((Date.now() - new Date(C().generado + "T12:00:00")) / 864e5) : Infinity;
  const vigente = () => edad() <= 3;
  const disponible = k => !!C()?.productos?.[k];

  function resumen(k) {
    const p = C()?.productos?.[k];
    if (!p) return "";
    if (!vigente()) return `Pronóstico vencido (del ${fecha(C().generado)})`;
    const a = p.alertas;
    const partes = [];
    if (a.helada > 0.005) partes.push(`${pct(a.helada)} de la producción con helada`);
    else if (a.riesgoHelada > 0.005) partes.push(`${pct(a.riesgoHelada)} con riesgo de helada`);
    if (a.lluviaFuerte > 0.005) partes.push(`${pct(a.lluviaFuerte)} con lluvia fuerte`);
    if (partes.length) return partes.join(" · ");
    return p.municipios.length ? `Menos de 1% de la producción con helada o lluvia fuerte (${p.municipios.length} municipios con alerta)` : "Sin heladas ni lluvias fuertes en las zonas productoras";
  }
  function html(k) {
    const p = C()?.productos?.[k];
    if (!p) return "";
    const D = C();
    if (!vigente()) return `<p class="sub">El pronóstico guardado es del ${fecha(D.generado)} y ya venció. Se renueva con <code>python scripts/procesar_clima_smn.py</code> (conviene correrlo a diario).</p>`;
    const a = p.alertas;
    const nombreA = id => ALERTAS[id][0].split(" (")[0].toLowerCase();
    return `
      <div class="kpis">
        ${Object.entries(ALERTAS).map(([id, [t, cls]]) => `<div class="kpi${a[id] > 0.05 && cls === "exc" ? " alerta" : ""}"><div class="v">${pct(a[id])}</div><div class="l">de la producción con ${t[0].toLowerCase() + t.slice(1)}</div></div>`).join("")}
      </div>
      ${p.municipios.length ? `<h4 class="mini">Municipios productores con alerta</h4>
        <div class="desplaza"><table class="compacta">
          <tr><th>Municipio</th><th class="num">Producción</th><th>Alerta</th><th>Día</th></tr>
          ${p.municipios.map(([cve, n, e, t, al, dia, v]) => `<tr><td translate="no">${n}, ${e}</td><td class="num">${fmt(t)} t</td>
            <td><span class="tag ${ALERTAS[al][1]}">${nombreA(al)}</span> ${al.startsWith("lluvia") ? `${v} mm` : `${v} °C`}</td><td>${fecha(dia)}</td></tr>`).join("")}
        </table></div>` : ""}
      <p class="sub"><span>Pronóstico por municipio del Servicio Meteorológico Nacional (CONAGUA) para los próximos ${D.dias.length} días: temperatura mínima y lluvia acumulada de cada día, cruzadas con la producción municipal del SIAP.</span> <span>Parte de la producción = toneladas de los municipios con la alerta en algún día del pronóstico.</span> <span>Clasificación de lluvias del SMN: fuertes de 25 a 50 mm, muy fuertes de 50 a 75 mm.</span> <span>Generado el ${fecha(D.generado)}; vence en pocos días.</span></p>`;
  }
  window.Clima = { disponible, html, resumen, vigente };
})();

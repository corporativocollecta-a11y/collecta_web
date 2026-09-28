// ============================================================================
// Historia de 10 años (FAOSTAT, window.HISTORIA, se carga al primer uso).
// Los paneles dejan un marcador <div data-historia="pais|tendencias" data-k="…" data-pais="M49">
// y este módulo lo llena en cuanto aparece (MutationObserver), sin acoplarse a cada vista.
// ============================================================================
(function () {
  const H = () => window.HISTORIA;
  const fmt = n => Math.round(n).toLocaleString("es-MX");
  const fmtT = t => t >= 1e6 ? (t / 1e6).toFixed(2) + " Mt" : t >= 1e3 ? fmt(t / 1e3) + " mil t" : fmt(t) + " t";
  const pct = x => (x >= 0 ? "+" : "") + (x * 100).toFixed(0) + "%";
  let nombresES = null;
  try { nombresES = new Intl.DisplayNames(["es"], { type: "region" }); } catch (e) { nombresES = null; }
  const nombre = id => { const p = window.GLOBAL?.paises?.[id]; try { return (p?.iso && nombresES?.of(p.iso)) || p?.nombre || id; } catch (e) { return p?.nombre ?? id; } };

  // Cambio entre el promedio de los 2 primeros y los 2 últimos años (suaviza años atípicos)
  const cambio = s => { const a = (s[0] + s[1]) / 2, b = (s.at(-1) + s.at(-2)) / 2; return a > 0 ? b / a - 1 : null; };

  function graficaHTML(k, id, titulo) {
    const d = H()?.productos?.[k]?.[id];
    if (!d) return "";
    const anios = H().anios;
    const series = [["Producción", d[0], "var(--productor)"], ["Exportación", d[1], "var(--c-importa)"], ["Importación", d[2], "var(--c-neutro)"]]
      .filter(s => s[1].some(v => v > 0));
    const max = Math.max(...series.flatMap(s => s[1]), 1) * 1.08;
    const W = 300, Hh = 110, x = i => 26 + i * (W - 34) / (anios.length - 1), y = v => Hh - 16 - v / max * (Hh - 24);
    const linea = (v, c) => `<polyline points="${v.map((p, i) => `${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(" ")}" fill="none" stroke="${c}" stroke-width="2"/>`;
    const cp = cambio(d[0]);
    return `
      <h3>${titulo ?? "Diez años"} <span class="tag ok">FAOSTAT ${anios[0]}–${anios.at(-1)}</span></h3>
      <svg class="estac" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Serie de 10 años">
        ${[0.5, 1].map(f => `<line x1="26" x2="${W - 6}" y1="${y(max / 1.08 * f)}" y2="${y(max / 1.08 * f)}" stroke="var(--linea)"/><text x="0" y="${y(max / 1.08 * f) + 3}">${fmtT(max / 1.08 * f).replace(" mil t", "k").replace(" Mt", "M").replace(" t", "")}</text>`).join("")}
        ${series.map(s => linea(s[1], s[2])).join("")}
        ${anios.map((a, i) => i % 3 === 0 || i === anios.length - 1 ? `<text x="${x(i) - 9}" y="${Hh - 2}">${a}</text>` : "").join("")}
      </svg>
      <div class="leyenda-cadena">${series.map(s => `<span><i style="background:${s[2]}"></i>${s[0]} ${fmtT(s[1].at(-1))}</span>`).join("")}</div>
      ${cp != null ? `<p class="sub">Producción ${anios[0]}–${anios[1]} → ${anios.at(-2)}–${anios.at(-1)}: <b>${pct(cp)}</b>${d[1].some(v => v > 0) && cambio(d[1]) != null ? ` · exportación <b>${pct(cambio(d[1]))}</b>` : ""}${d[2].some(v => v > 0) && cambio(d[2]) != null ? ` · importación <b>${pct(cambio(d[2]))}</b>` : ""}.</p>` : ""}`;
  }

  // Entre los 20 mayores productores: quién crece y quién cae
  function tendenciasHTML(k, ids) {
    const P = H()?.productos?.[k];
    if (!P) return "";
    const candidatos = Object.entries(P).filter(([id, s]) => (!ids || ids.has(id)) && s[0].at(-1) > 0)
      .sort((a, b) => b[1][0].at(-1) - a[1][0].at(-1)).slice(0, 20)
      .map(([id, s]) => ({ id, prod: s[0].at(-1), c: cambio(s[0]) })).filter(x => x.c != null);
    if (candidatos.length < 4) return "";
    const orden = [...candidatos].sort((a, b) => b.c - a.c);
    const fila = x => `<div class="barra-h"><span class="n">${nombre(x.id)}</span><span class="b"><i style="width:${Math.min(100, Math.abs(x.c) * 100)}%;background:${x.c >= 0 ? "var(--productor)" : "var(--c-def)"}"></i></span><span class="x">${pct(x.c)}</span></div>`;
    return `
      <h3>Quién crece y quién cae <span class="tag ok">FAOSTAT ${H().anios[0]}–${H().anios.at(-1)}</span></h3>
      <p class="sub">Cambio en producción entre los 20 mayores productores (promedio de los 2 primeros años contra los 2 últimos).</p>
      <h4 class="mini">Crecen más</h4>${orden.slice(0, 5).filter(x => x.c > 0).map(fila).join("") || '<p class="sub">Ninguno creció.</p>'}
      <h4 class="mini">Caen más</h4>${orden.slice(-5).reverse().filter(x => x.c < 0).map(fila).join("") || '<p class="sub">Ninguno cayó.</p>'}`;
  }

  function llenar(el) {
    el.dataset.lleno = "1";
    const { historia, k, pais, titulo, paises } = el.dataset;
    const pintar = () => {
      el.innerHTML = historia === "tendencias" ? tendenciasHTML(k, paises ? new Set(paises.split(",")) : null) : graficaHTML(k, pais, titulo);
    };
    if (H()) return pintar();
    window.Paleta.cargar("data/historia.js", () => !!window.HISTORIA).then(pintar).catch(() => { el.innerHTML = ""; });
  }
  const revisar = raiz => raiz.querySelectorAll?.("[data-historia]:not([data-lleno])").forEach(llenar);
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) { if (n.matches?.("[data-historia]:not([data-lleno])")) llenar(n); revisar(n); } })))
    .observe(document.body, { childList: true, subtree: true });
  revisar(document);

  // Marcador para insertar en cualquier panel
  const marca = (tipo, k, extra = {}) => `<div data-historia="${tipo}" data-k="${k}"${Object.entries(extra).map(([a, v]) => ` data-${a}="${String(v).replace(/"/g, "&quot;")}"`).join("")}></div>`;
  window.Historia = { marca };
})();

// ============================================================================
// Gráficos de precio a lo largo del año. Primer gráfico: precio en la frontera del producto mexicano durante el año
// en curso (USDA AMS, punto de embarque de Phoenix; volumen del reporte 1662). Datos: data/frontera_diaria.js ←
// scripts/procesar_frontera_diaria.py.
// Diseño "estilo trading" aprobado en el lienzo de diseño:
// - Encabezado con el último precio y su cambio; selector 1D / 1S / 1M, rango bajo–alto, unidad y media móvil.
// - Línea azul con brillo y nodos (precio del día o promedio de la semana o del mes), etiquetas en el más alto,
//   el más bajo y el último; eje de precios a la derecha; volumen semanal que cruza de México debajo.
// - Cursor: al pasar sobre el gráfico se leen los datos de ese día, semana o mes.
// - Dos tamaños: "panel" (sección del panel de análisis) y "grande" (vista ampliada en una ventana sobre el mapa).
// Segunda fuente, mismo diseño: precio de mayoreo en México (SNIIM, centrales de abasto; data/mayoreo_diario.js ←
// scripts/procesar_mayoreo_diario.py, carga diferida). Sin volumen ni demanda (el SNIIM no los publica); su banda es
// la dispersión entre centrales (percentiles 10–90 de las cotizaciones del día).
// La interacción va por delegación en document, así sobrevive a los repintados del panel. Cada bloque lleva su fuente
// en data-gfr-fuente; antes de pintarlo se fija la fuente activa (F).
// ============================================================================
(function () {
  const FUENTES = {
    frontera: { id: "frontera", datos: () => window.FRONTERA_DIARIA, moneda: "US$", titulo: "Precio en la frontera", tag: "USDA AMS",
      volumen: true, demanda: true, alto: "Máximo", bajo: "Mínimo", rango: "Rango" },
    mayoreo: { id: "mayoreo", datos: () => window.MAYOREO_MX, moneda: "$", titulo: "Precio de mayoreo en México", tag: "SNIIM",
      volumen: false, demanda: false, alto: "Alto (centrales)", bajo: "Bajo (centrales)", rango: "Rango entre centrales",
      archivo: "data/mayoreo_diario.js" }
  };
  let F = FUENTES.frontera;   // fuente del bloque que se está pintando
  const usar = fuente => { F = FUENTES[fuente] ?? FUENTES.frontera; };
  const D = () => F.datos();
  const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const MES_L = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const UP = "#9FD36A", DN = "#F2703A", AZUL = "#4CC3FF", AZUL2 = "#7FD6FF", AMARILLO = "#E7B653";
  const NOMBRE_CRUCE = { McAllen: "McAllen, Texas", Nogales: "Nogales, Arizona", "Otay Mesa": "Otay Mesa, California", Calexico: "Calexico y San Luis" };
  const PERIODO_MA = { D: 20, S: 4, M: 3 }, TXT_MA = { D: "20 días", S: "4 semanas", M: "3 meses" };
  const VS = { D: "vs día anterior", S: "promedio vs semana anterior", M: "promedio vs mes anterior" };
  // Tamaños del gráfico (unidades del viewBox del SVG, que se escala al ancho disponible)
  const TAM = {
    panel: { W: 340, AX: 38, PH: 200, VH: 50, GAP: 10, fs: 9.5, nodo: 2.6, cursor: 4, etiquetas: "clave", nodos: "mes" },
    grande: { W: 1120, AX: 58, PH: 400, VH: 92, GAP: 14, fs: 11, nodo: 3.4, cursor: 5.5, etiquetas: "mes", nodos: "semana" }
  };
  const op = { tf: "S", rango: false, ma: true, kg: false, variedad: {} };   // se recuerda entre productos y repintados
  let uid = 0;

  const disponible = k => !!D()?.productos?.[k]?.dias?.length;
  const tn = () => window.Acceso?.tn?.() ?? "";
  const fd = md => { const [m, d] = md.split("-").map(Number); return `${d} ${MES[m - 1]}`; };
  const n2 = v => v == null ? "—" : v.toFixed(2);
  const ton = v => v == null ? "—" : Math.round(v).toLocaleString("es-MX") + " t";
  const sg = v => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2);
  const sp = v => (v >= 0 ? "+" : "−") + Math.abs(v * 100).toFixed(1) + "%";
  // Año que muestra cada producto: el anterior completo mientras el año en curso tenga pocos días
  // Serie que se muestra: la variedad elegida (chile serrano, jitomate bola…) o el producto
  const ficha = k => {
    const b = D().productos[k], vs = b?.variantes;
    return vs ? vs[op.variedad[F.id + ":" + k] ?? b.varOmision ?? 0] ?? b : b;
  };
  const usaKg = k => op.kg && !!ficha(k)?.kgEmpaque;   // cajas sin peso escrito: solo US$ por caja
  const sinVolumen = k => !Object.keys(ficha(k)?.volSemana ?? {}).length;   // el reporte 1662 no trae esa mercancía
  const anioDe = k => ficha(k)?.anio ?? D().anio;
  const lunes = (md, anio) => {
    const [m, d] = md.split("-").map(Number), t = new Date(Date.UTC(anio, m - 1, d));
    t.setUTCDate(t.getUTCDate() - (t.getUTCDay() + 6) % 7);
    return t.toISOString().slice(0, 10);
  };
  const ticker = k => k.normalize("NFD").replace(/[^a-z]/gi, "").slice(0, 4).toUpperCase();

  // ---------- Series: día, semana o mes ----------
  // c = precio del día o promedio del periodo · h, l = extremos del rango · u = precio del último día del periodo
  // dem = demanda que califica el USDA (1 baja – 5 muy buena) · volProm = toneladas por semana (para comparar meses)
  function serie(k) {
    const p = ficha(k), A = anioDe(k), f = usaKg(k) ? 1 / p.kgEmpaque : 1, vol = p.volSemana ?? {}, dem = p.demanda ?? [];
    const dias = p.dias.map((d, j) => ({ md: d[0], c: d[1] * f, l: d[2] * f, h: d[3] * f, sem: lunes(d[0], A), cr: d[4], dem: dem[j] ?? null }));
    const agrupar = clave => {
      const g = new Map();
      dias.forEach(d => { const c = clave(d); if (!g.has(c)) g.set(c, []); g.get(c).push(d); });
      return [...g.entries()];
    };
    const conPrev = a => { a.forEach((x, j) => { x.prev = j ? a[j - 1].c : null; }); return a; };
    const semanas = conPrev(agrupar(d => d.sem).map(([sem, ds]) => ({ ...periodo(ds, "Semana del " + fd(ds[0].md), vol[sem] ?? null), sem, volProm: vol[sem] ?? null })));
    const semI = new Map(semanas.map((s, j) => [s.sem, j]));
    let out;
    if (op.tf === "D") {
      out = conPrev(dias.map(d => ({ ...d, titulo: "Día " + fd(d.md), u: d.c, vol: vol[d.sem] ?? null, semI: semI.get(d.sem) })));
    } else if (op.tf === "S") {
      out = semanas;
    } else {
      out = conPrev(agrupar(d => d.md.slice(0, 2)).map(([m, ds]) => {
        const vs = semanas.filter(s => s.md.slice(0, 2) === m && s.vol != null);   // semana → mes de su primer día hábil
        const total = vs.length ? vs.reduce((a, s) => a + s.vol, 0) : null;
        return { ...periodo(ds, `${MES_L[+m - 1]} ${A}`, total), volProm: total == null ? null : total / vs.length };
      }));
    }
    return { p, v: out, dias, semanas };
  }
  function periodo(ds, titulo, vol) {
    const dm = ds.map(x => x.dem).filter(x => x != null);
    return { md: ds[0].md, titulo, vol, c: ds.reduce((a, x) => a + x.c, 0) / ds.length,
      h: Math.max(...ds.map(x => x.h)), l: Math.min(...ds.map(x => x.l)), u: ds.at(-1).c,
      dem: dm.length ? dm.reduce((a, b) => a + b, 0) / dm.length : null };
  }
  const sube = x => x.prev == null || x.c >= x.prev;

  // ---------- Demanda (USDA) y lectura combinada de precio y volumen ----------
  const NIVELES = [[1.75, "Baja", "#2F6FA8"], [2.5, "Algo baja", "#6FA3CF"], [3.5, "Normal", "#55615A"], [4.25, "Buena", "#D9913F"], [9, "Muy buena", "#F7B955"]];
  const nivel = v => v == null ? null : NIVELES.find(n => v < n[0]);
  function lectura(a, b, cual, sinVol) {
    if (!a || !b) return "";
    const dp = a.c / b.c - 1, P = Math.abs(dp) < 0.02 ? 0 : Math.sign(dp);
    if (a.volProm == null || b.volProm == null)
      return `Precio ${P > 0 ? "al alza" : P < 0 ? "a la baja" : "estable"} (${sp(dp)} vs ${cual}); ${sinVol
        ? "el USDA no reporta el volumen que cruza de México de esta mercancía, así que no hay lectura de precio contra volumen."
        : "el volumen de este periodo aún no se publica."}`;
    const dv = a.volProm / b.volProm - 1, V = Math.abs(dv) < 0.05 ? 0 : Math.sign(dv);
    const txt = {
      "1,1": "La demanda está jalando: sube el precio aunque cruza más producto.",
      "-1,1": "Sobra producto: cruza más y el precio baja.",
      "1,-1": "Falta producto: cruza menos y el precio sube.",
      "-1,-1": "La demanda se enfría: cruza menos y aun así baja el precio.",
      "0,0": "Mercado estable: precio y volumen casi sin cambio.",
      "0,1": "El precio aguanta aunque cruza más producto.",
      "0,-1": "El precio se sostiene aunque cruza menos producto.",
      "1,0": "El precio sube con el mismo volumen.",
      "-1,0": "El precio baja con el mismo volumen."
    }[`${P},${V}`];
    return `${txt} <span class="gfr-cifras">Precio ${sp(dp)} · volumen ${sp(dv)} vs ${cual}.</span>`;
  }

  // ---------- Gráfico (SVG) ----------
  function grafico(k, modo, i, S) {
    const T = TAM[modo], { v } = S, N = v.length, PW = T.W - T.AX, slot = PW / N;
    const lo = Math.min(...v.map(x => x.l)), hi = Math.max(...v.map(x => x.h));
    const crudo = (hi - lo) / (modo === "grande" ? 5 : 4), pot = 10 ** Math.floor(Math.log10(crudo));
    const paso = [1, 2, 2.5, 5, 10].map(m => m * pot).find(x => x >= crudo);
    const yMin = Math.max(0, Math.floor((lo - paso * 0.4) / paso) * paso), yMax = Math.ceil((hi + paso * 0.6) / paso) * paso;
    const y = q => (yMax - q) / (yMax - yMin) * T.PH;
    const cx = j => (j + 0.5) * slot, f1 = n => n.toFixed(1);
    // Alturas: precio (0–PH), volumen (V0–V0+VH), franja de demanda (D0–D0+DH) y meses
    const VH = F.volumen ? T.VH : 0, DH = F.demanda ? (modo === "grande" ? 16 : 11) : 0;
    const V0 = T.PH + T.GAP, D0 = V0 + VH + (F.demanda ? T.fs + 8 : 0), H = D0 + DH + T.fs + 8, id = `gfr${++uid}`;

    const ejes = [];
    for (let q = yMin; q <= yMax + 1e-9; q += paso)
      ejes.push(`<line x1="0" x2="${PW}" y1="${f1(y(q))}" y2="${f1(y(q))}" class="g-rejilla"/><text x="${PW + 6}" y="${f1(y(q) + T.fs * 0.35)}" class="g-eje">${q.toFixed(paso < 1 ? 2 : 0)}</text>`);

    const linea = v.map((x, j) => `${f1(cx(j))},${f1(y(x.c))}`).join(" ");
    const banda = op.rango ? `<polygon points="${v.map((x, j) => `${f1(cx(j))},${f1(y(x.h))}`).join(" ")} ${v.map((x, j) => `${f1(cx(j))},${f1(y(x.l))}`).reverse().join(" ")}" fill="${AZUL}" fill-opacity=".1"/>` : "";
    const per = PERIODO_MA[op.tf];
    const ma = op.ma ? v.map((x, j) => j < per - 1 ? null : `${f1(cx(j))},${f1(y(v.slice(j - per + 1, j + 1).reduce((a, b) => a + b.c, 0) / per))}`).filter(Boolean).join(" ") : "";

    // Nodos y etiquetas: más alto, más bajo y último; en el tamaño grande, nodo en cada semana o mes y etiqueta en cada mes
    const iMax = v.reduce((m, x, j) => x.c > v[m].c ? j : m, 0), iMin = v.reduce((m, x, j) => x.c < v[m].c ? j : m, 0);
    const clave = j => j === iMax || j === iMin || j === N - 1;
    const conNodo = j => clave(j) || (op.tf === "M") || (op.tf === "S" && T.nodos === "semana");
    const conEtq = j => clave(j) || (op.tf === "M" && T.etiquetas === "mes");
    const nodos = v.map((x, j) => conNodo(j) ? `<circle cx="${f1(cx(j))}" cy="${f1(y(x.c))}" r="${T.nodo}" class="g-nodo" filter="url(#${id}b)"/>` : "").join("");
    const etiquetas = v.map((x, j) => {
      if (!conEtq(j)) return "";
      const t = n2(x.c), w = t.length * T.fs * 0.62 + 8, h = T.fs + 6;
      const ex = Math.min(Math.max(cx(j), w / 2), PW - w / 2), ey = y(x.c) - T.nodo - 5 - h;
      return `<g class="g-etq"><rect x="${f1(ex - w / 2)}" y="${f1(ey)}" width="${f1(w)}" height="${h}" rx="3"/><text x="${f1(ex)}" y="${f1(ey + h - 4)}" text-anchor="middle">${t}</text></g>`;
    }).join("");

    // Volumen: por semana; en la vista diaria, una barra que abarca los días de cada semana
    let barras;
    if (op.tf === "D") {
      const g = {};
      v.forEach((x, j) => { (g[x.sem] ??= []).push(j); });
      barras = Object.values(g).map(js => ({ x: js[0] * slot + 0.5, w: js.length * slot - 1, vol: v[js[0]].vol, col: "#6B7A6E" }));
    } else {
      const w = Math.max(1.5, slot * 0.62);
      barras = v.map((x, j) => ({ x: cx(j) - w / 2, w, vol: x.vol, col: sube(x) ? UP : DN }));
    }
    const vmax = Math.max(1, ...barras.map(b => b.vol ?? 0));
    const vol = !F.volumen ? "" : barras.filter(b => b.vol).map(b => { const h = b.vol / vmax * (T.VH - T.fs - 8); return `<rect x="${f1(b.x)}" y="${f1(V0 + T.VH - h)}" width="${f1(b.w)}" height="${f1(h)}" fill="${b.col}" opacity=".5"/>`; }).join("");

    // Franja de demanda: una celda por día, semana o mes, del azul (baja) al naranja (muy buena)
    const celdas = v.map((x, j) => {
      const n = nivel(x.dem);
      return n ? `<rect x="${f1(j * slot + (slot > 3 ? 0.5 : 0))}" y="${D0}" width="${f1(slot > 3 ? slot - 1 : slot + 0.2)}" height="${DH}" fill="${n[2]}"/>` : "";
    }).join("");

    // Meses en el eje horizontal
    let ant = "";
    const meses = v.map((x, j) => {
      const m = x.md.slice(0, 2);
      if (m === ant) return "";
      ant = m;
      const xx = op.tf === "M" ? cx(j) : j * slot;
      return `<text x="${f1(xx)}" y="${H - 2}" class="g-mes"${op.tf === "M" ? ' text-anchor="middle"' : ""}>${MES[+m - 1].toUpperCase()}</text>`;
    }).join("");

    const L = v[N - 1], h = v[i], tag = (yy, txt, fondo, tinta) => {
      const w = txt.length * T.fs * 0.62 + 8;
      return `<rect x="${PW + 1}" y="${f1(yy - T.fs / 2 - 3)}" width="${f1(w)}" height="${T.fs + 6}" rx="2" fill="${fondo}"/><text x="${PW + 5}" y="${f1(yy + T.fs * 0.35)}" class="g-tag" fill="${tinta}">${txt}</text>`;
    };
    return `
      <svg class="gfr-svg" viewBox="0 0 ${T.W} ${H}" role="img" aria-label="${F.titulo} durante ${anioDe(k)}" style="font-size:${T.fs}px">
        <defs><filter id="${id}b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="${modo === "grande" ? 5 : 3.5}" result="h"/><feMerge><feMergeNode in="h"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        ${ejes.join("")}
        <line x1="${PW}" x2="${PW}" y1="0" y2="${T.PH}" class="g-borde"/>
        ${banda}
        <polyline points="${linea}" fill="none" stroke="${AZUL}" stroke-opacity=".35" stroke-width="${modo === "grande" ? 7 : 5}" stroke-linejoin="round" stroke-linecap="round" filter="url(#${id}b)"/>
        <polyline points="${linea}" fill="none" stroke="${AZUL2}" stroke-width="${modo === "grande" ? 2.2 : 1.8}" stroke-linejoin="round" stroke-linecap="round"/>
        ${ma ? `<polyline points="${ma}" fill="none" stroke="${AMARILLO}" stroke-width="${modo === "grande" ? 1.6 : 1.3}" stroke-linejoin="round"/>` : ""}
        ${nodos}${etiquetas}
        ${F.volumen ? `<line x1="0" x2="${PW}" y1="${V0}" y2="${V0}" class="g-borde"/>
        <text x="0" y="${V0 + T.fs + 3}" class="g-eje g-vol-t">VOLUMEN QUE CRUZA · t/semana</text>
        ${sinVolumen(k) ? `<text x="${PW / 2}" y="${V0 + T.VH / 2 + T.fs}" text-anchor="middle" class="g-eje">El USDA no reporta el volumen que cruza de México de esta mercancía</text>` : ""}
        ${modo === "grande" ? `<text x="${PW + 6}" y="${V0 + T.fs + 3}" class="g-eje">${ton(vmax === 1 ? null : vmax)}</text>` : ""}
        ${vol}` : ""}
        ${F.demanda ? `<text x="0" y="${D0 - 4}" class="g-eje g-vol-t">DEMANDA · CALIFICACIÓN USDA</text>
        ${celdas}` : ""}
        ${meses}
        <line x1="${f1(cx(i))}" x2="${f1(cx(i))}" y1="0" y2="${Math.max(T.PH, D0 + DH)}" class="g-cursor"/>
        <line x1="0" x2="${PW}" y1="${f1(y(h.c))}" y2="${f1(y(h.c))}" class="g-cursor g-cursor-h"/>
        <circle cx="${f1(cx(i))}" cy="${f1(y(h.c))}" r="${T.cursor}" class="g-punto" filter="url(#${id}b)"/>
        ${tag(y(L.c), n2(L.c), sube(L) ? UP : DN, "#0B120D")}
        ${i !== N - 1 ? tag(y(h.c), n2(h.c), "#EEEBE3", "#0B120D") : ""}
        <rect class="gfr-hit" x="0" y="0" width="${PW}" height="${Math.max(T.PH, D0 + DH)}" fill="transparent" data-n="${N}" data-pw="${PW}" data-w="${T.W}"/>
      </svg>`;
  }

  // ---------- Bloque completo ----------
  function vista(k, modo, iSel) {
    const S = serie(k), { p, v } = S, N = v.length, i = iSel != null && iSel < N ? iSel : N - 1, h = v[i], L = v[N - 1];
    const grande = modo === "grande", A = anioDe(k);
    const todos = S.dias.map(d => d.c), prom = todos.reduce((a, b) => a + b, 0) / todos.length;
    const mayoreo = F.id === "mayoreo";
    const unidad = mayoreo ? "$/kg" : usaKg(k) ? "US$/kg" : "US$/caja";
    const cruces = Object.keys(p.cruces ?? {}).map(c => NOMBRE_CRUCE[c] ?? c);
    const btn = (accion, on, txt, extra = "") => `<button type="button" class="gfr-btn${on ? " on" : ""}" data-gfr-accion="${accion}" aria-pressed="${on}"${extra}>${txt}</button>`;
    const stats = [
      [op.tf === "D" ? "Precio del día" : "Precio promedio", n2(h.c)], [F.alto, n2(h.h)], [F.bajo, n2(h.l)], ["Último día", n2(h.u)],
      ["Cambio", h.prev != null ? sp(h.c / h.prev - 1) : "—", h.prev != null ? (sube(h) ? UP : DN) : null],
      mayoreo ? ["Centrales", String(p.centrales ?? "—")] : [op.tf === "M" ? "Volumen mes" : "Volumen semana", ton(h.vol)]
    ];
    if (grande) stats.push([`Promedio ${A}`, n2(prom)], [`Rango ${A}`, `${n2(Math.min(...todos))}–${n2(Math.max(...todos))}`]);
    const base = D().productos[k], variantes = base.variantes;
    const nombre = (window.PRODUCTOS?.[k]?.nombre ?? k) + (variantes ? ` · ${p.nombre}` : "");
    const selVariedad = variantes ? `<label class="gfr-variedad"><span>Variedad</span><select data-gfr-variedad="${k}">${variantes.map((x, j) =>
      `<option value="${j}"${x === p ? " selected" : ""}>${x.nombre}</option>`).join("")}</select></label>` : "";
    const kgTxt = mayoreo ? "" : p.kgEmpaque ? ` (${p.kgEmpaque} kg)` : " (la caja no trae peso: solo US$ por caja)";
    // Demanda del día o promedio del periodo, y lectura de precio contra volumen (en la vista diaria, de su semana)
    const dn = nivel(h.dem), sem = S.semanas;
    const lect = op.tf === "D"
      ? (h.semI > 0 ? `<b>Semana del ${fd(sem[h.semI].md)}:</b> ${lectura(sem[h.semI], sem[h.semI - 1], "semana anterior", sinVolumen(k))}` : "")
      : lectura(h, v[i - 1], op.tf === "S" ? "semana anterior" : "mes anterior", sinVolumen(k));
    return `
      <div class="gfr-cab">
        <div class="gfr-id">
          <span class="gfr-ticker">${mayoreo ? `<b>${ticker(k)} · MAYOREO MX</b> ${p.centrales} CENTRALES DE ABASTO · SNIIM`
            : `<b>${ticker(k)} · MX→US</b> FOB ${(cruces.length === 1 ? cruces[0] : cruces.join(" · ")).toUpperCase()}`}</span>
          ${grande ? `<div class="gfr-nombre"><span>${nombre}</span><small>${mayoreo ? "Precio frecuente por kg · calidad primera · SNIIM, Secretaría de Economía"
            : `<span${tn()}>${window.Paleta.usdaES(p.empaque)}</span>${kgTxt} · convencional · USDA AMS`}</small></div>` : ""}
        </div>
        <div class="gfr-precio">
          <b>${n2(S.dias.at(-1).c)}</b>
          <span><i style="color:${sube(L) ? UP : DN}">${L.prev != null ? `${sg(L.c - L.prev)} (${sp(L.c / L.prev - 1)})` : ""}</i><small>${unidad} · ${VS[op.tf]} · al ${fd(S.dias.at(-1).md)} ${A}</small></span>
        </div>
      </div>
      <div class="gfr-controles">
        <div class="gfr-grupo" role="group" aria-label="Periodo">${[["D", "1D", "Diario"], ["S", "1S", "Semanal"], ["M", "1M", "Mensual"]].map(([t, l, ti]) => btn("tf:" + t, op.tf === t, l, ` title="${ti}"`)).join("")}</div>
        ${btn("rango", op.rango, `<svg width="15" height="9" viewBox="0 0 16 10" aria-hidden="true"><path d="M1 3 L6 1 L10 4 L15 2 L15 8 L10 9 L6 7 L1 8 Z" fill="${AZUL}" fill-opacity=".4"/></svg>Rango`, ' data-suelto="1"')}
        ${selVariedad}
        ${p.kgEmpaque ? `<div class="gfr-grupo" role="group" aria-label="Unidad">${btn("unidad:caja", !usaKg(k), grande ? "US$/caja" : "Caja")}${btn("unidad:kg", usaKg(k), grande ? "US$/kg" : "Kg")}</div>` : ""}
        ${btn("ma", op.ma, `<svg width="15" height="9" viewBox="0 0 16 10" aria-hidden="true"><path d="M1 8 C5 8 6 2 9 3 S13 6 15 2" fill="none" stroke="${AMARILLO}" stroke-width="1.8" stroke-linecap="round"/></svg>Media`, ' data-suelto="1"')}
        ${grande ? "" : btn("ampliar", false, `<svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Ampliar`, ' data-suelto="1" aria-label="Ampliar el gráfico"')}
      </div>
      ${A < D().anio ? `<div class="gfr-aviso">Todavía hay pocos días de ${D().anio} para este producto: se muestra ${A} completo hasta que el año nuevo junte al menos un mes de cotizaciones.</div>` : ""}
      <div class="gfr-stats${grande ? " ocho" : ""}">${stats.map(([t, val, col]) => `<div><span>${t}</span><b${col ? ` style="color:${col}"` : ""}>${val}</b></div>`).join("")}</div>
      ${F.demanda ? `<div class="gfr-senal">
        <span class="gfr-dem"><i style="background:${dn?.[2] ?? "#55615A"}"></i>Demanda ${op.tf === "D" ? "del día" : "promedio"}: <b>${dn ? dn[1] : "sin calificar"}</b></span>
        ${lect ? `<span class="gfr-lect">${lect}</span>` : ""}
      </div>` : ""}
      <div class="gfr-tarjeta">
        <div class="gfr-lectura">
          <b>${h.titulo}</b>
          ${grande ? `<span>${op.tf === "D" ? "Precio" : "Promedio"} <em>${n2(h.c)}</em></span><span>${mayoreo ? "Alto" : "Máx"} <em>${n2(h.h)}</em></span><span>${mayoreo ? "Bajo" : "Mín"} <em>${n2(h.l)}</em></span><span>Último <em>${n2(h.u)}</em></span>${h.prev != null ? `<span style="color:${sube(h) ? UP : DN}">${sg(h.c - h.prev)} ${sp(h.c / h.prev - 1)}</span>` : ""}` : ""}
          <span class="gfr-leyenda">
            ${grande ? `<span><i class="l-precio"></i>Precio</span>` : ""}
            ${op.rango ? `<span><i class="l-rango"></i>${F.rango}</span>` : ""}
            ${op.ma ? `<span><i class="l-ma"></i>Media ${TXT_MA[op.tf]}</span>` : ""}
          </span>
        </div>
        ${grafico(k, modo, i, S)}
        ${F.demanda ? `<div class="gfr-escala"><span>Demanda</span>${NIVELES.map(n => `<span><i style="background:${n[2]}"></i>${n[1]}</span>`).join("")}</div>` : ""}
      </div>
      ${mayoreo ? `<p class="gfr-nota">Precio de mayoreo (precio frecuente) de ${p.nombre ? "la variedad " + p.nombre : "este producto"}, calidad primera, por kg, en ${p.centrales} centrales de abasto que reporta el SNIIM, un dato por día hábil del 1 de enero al ${fd(S.dias.at(-1).md)} de ${A}.
        Línea: mediana de las cotizaciones del día (todas las centrales y orígenes) o promedio de la semana o del mes; etiquetas en el más alto, el más bajo y el último.
        Rango entre centrales: percentiles 10 y 90 de las cotizaciones del día (qué tan distinto se vende en cada central). Se descartan cotizaciones fuera de 1/3–3× la mediana del año.
        El SNIIM no publica volumen ni demanda. Media móvil de ${TXT_MA[op.tf]}. Fuente: SNIIM, Secretaría de Economía.</p>` : `<p class="gfr-nota">Precio FOB del producto mexicano al cruzar por ${cruces.join(", ")}: <span${tn()}>${window.Paleta.usdaES(p.mercancia)}${p.presentacion && p.presentacion !== "n/a" ? ", " + p.presentacion : ""}, ${window.Paleta.usdaES(p.empaque)}</span>${kgTxt}, sin orgánicos, un dato por día hábil del 1 de enero al ${fd(S.dias.at(-1).md)} de ${A}.
        Línea: precio de cada día (1D) o promedio de los días hábiles de la semana o del mes (1S, 1M); etiquetas en el más alto, el más bajo y el último. Rango: bajo–alto que reportó el USDA.
        Volumen: toneladas de esta mercancía que cruzaron de México cada semana (USDA, reporte 1662); verde si el precio subió contra el periodo anterior, naranja si bajó. Media móvil de ${TXT_MA[op.tf]}.
        Demanda: la calificación que da cada día el reportero del USDA a la actividad de los compradores en el cruce (de baja a muy buena), promediada en la semana o el mes; es un termómetro del mercado, no consumo medido.
        Lectura: compara el precio y el volumen con el periodo anterior; cambios menores a 2% en precio o a 5% en volumen se toman como estables. Fuente: USDA AMS Market News.</p>`}`;
  }

  function html(fuente, k) {
    usar(fuente);
    if (!D()) {   // datos de carga diferida: se pintan cuando llegan (ver llenar)
      return `<h3>${F.titulo} ${window.FRONTERA_DIARIA?.anio ?? ""} <span class="tag ok">${F.tag}</span></h3>
        <div class="gfr" data-gfr-fuente="${fuente}" data-gfr-k="${k}" data-gfr-modo="panel" data-pendiente="1"><p class="gfr-nota">Cargando la serie diaria…</p></div>`;
    }
    if (!disponible(k)) return "";
    return `<h3>${F.titulo} ${anioDe(k)} <span class="tag ok">${F.tag}</span></h3><div class="gfr" data-gfr-fuente="${fuente}" data-gfr-k="${k}" data-gfr-modo="panel">${vista(k, "panel")}</div>`;
  }
  function resumen(fuente, k) {
    usar(fuente);
    if (!D()) return "Cargando la serie diaria…";
    if (!disponible(k)) return "";
    const p = ficha(k), f = usaKg(k) ? 1 / p.kgEmpaque : 1, c = p.dias.map(d => d[1] * f), M = F.moneda;
    const u = F.id === "mayoreo" ? "el kg" : usaKg(k) ? "el kg" : "la caja";
    return `${p.nombre ? p.nombre + ": " : ""}Último ${M}${n2(c.at(-1))} ${u} · promedio ${anioDe(k)} ${M}${n2(c.reduce((a, b) => a + b, 0) / c.length)} · de ${M}${n2(Math.min(...c))} a ${M}${n2(Math.max(...c))}`;
  }
  const fronteraHTML = k => html("frontera", k), fronteraResumen = k => resumen("frontera", k);
  const mayoreoHTML = k => html("mayoreo", k), mayoreoResumen = k => resumen("mayoreo", k);
  // Antes de cargar data/mayoreo_diario.js se sabe qué productos tiene el SNIIM por el panel de precios (data/precios_sniim.js)
  const disponibleMayoreo = k => window.MAYOREO_MX ? !!window.MAYOREO_MX.productos?.[k]?.dias?.length : !!window.PRECIOS_SNIIM?.productos?.[k];

  // ---------- Interacción ----------
  function pintar(el) {
    const fuente = el.dataset.gfrFuente ?? "frontera", k = el.dataset.gfrK;
    usar(fuente);
    if (!D()) return;
    delete el.dataset.pendiente;
    el.innerHTML = disponible(k) ? vista(k, el.dataset.gfrModo, el.dataset.i ? +el.dataset.i : null)
      : `<p class="gfr-nota">El SNIIM no tiene suficientes cotizaciones de este producto en ${D().anio}.</p>`;
    const r = el.closest("details.seccion")?.querySelector("summary .sec-resumen");
    if (r) r.textContent = resumen(fuente, k);
  }
  // Bloques de carga diferida: se baja su archivo cuando la sección está abierta (o al abrirla) y se pintan
  const cargando = {};
  function llenar(el) {
    const f = FUENTES[el.dataset.gfrFuente];
    if (!f?.archivo || el.dataset.esperando) return;
    el.dataset.esperando = "1";
    const bajar = () => (cargando[f.id] ??= window.Paleta.cargar(f.archivo, () => !!f.datos()))
      .then(() => document.querySelectorAll(`.gfr[data-pendiente][data-gfr-fuente="${f.id}"]`).forEach(pintar))
      .catch(() => { el.innerHTML = '<p class="gfr-nota">No se pudo cargar la serie diaria.</p>'; });
    window.Seccion ? window.Seccion.alAbrir(el, bajar) : bajar();
  }
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (n.nodeType !== 1) return;
    if (n.matches?.(".gfr[data-pendiente]")) llenar(n);
    n.querySelectorAll?.(".gfr[data-pendiente]").forEach(llenar);
  }))).observe(document.body, { childList: true, subtree: true });
  const todos = () => document.querySelectorAll(".gfr[data-gfr-k]:not([data-pendiente])").forEach(pintar);

  function abrir(k, fuente = "frontera") {
    cerrar();
    usar(fuente);
    const m = document.createElement("div");
    m.className = "gfr-modal";
    m.innerHTML = `<div class="gfr-modal-caja" role="dialog" aria-modal="true" aria-label="${F.titulo}, vista ampliada">
      <button type="button" class="gfr-btn gfr-cerrar" data-gfr-accion="cerrar" aria-label="Cerrar">✕</button>
      <div class="gfr" data-gfr-fuente="${fuente}" data-gfr-k="${k}" data-gfr-modo="grande">${vista(k, "grande")}</div></div>`;
    document.body.appendChild(m);
    m.querySelector(".gfr-cerrar").focus();
  }
  function cerrar() { document.querySelector(".gfr-modal")?.remove(); }

  document.addEventListener("click", ev => {
    if (ev.target.classList?.contains("gfr-modal")) return cerrar();   // clic fuera de la ventana
    const b = ev.target.closest?.("[data-gfr-accion]");
    if (!b) return;
    const [a, val] = b.dataset.gfrAccion.split(":"), caja = b.closest(".gfr");
    if (a === "cerrar") return cerrar();
    if (a === "ampliar") return abrir(caja.dataset.gfrK, caja.dataset.gfrFuente);
    if (a === "tf") { op.tf = val; document.querySelectorAll(".gfr[data-i]").forEach(e => delete e.dataset.i); }
    else if (a === "rango") op.rango = !op.rango;
    else if (a === "ma") op.ma = !op.ma;
    else if (a === "unidad") op.kg = val === "kg";
    todos();
    document.querySelector(`.gfr[data-gfr-modo="${caja.dataset.gfrModo}"] [data-gfr-accion="${b.dataset.gfrAccion}"]`)?.focus();
  });
  document.addEventListener("change", ev => {
    const s = ev.target.closest?.("select[data-gfr-variedad]");
    if (!s) return;
    const caja = s.closest(".gfr"), modo = caja.dataset.gfrModo;   // antes de repintar: después el <select> ya no está
    op.variedad[(caja.dataset.gfrFuente ?? "frontera") + ":" + s.dataset.gfrVariedad] = +s.value;   // antes de repintar: después el <select> ya no está en la página
    document.querySelectorAll(".gfr[data-i]").forEach(e => delete e.dataset.i);
    todos();
    document.querySelector(`.gfr[data-gfr-modo="${modo}"] select[data-gfr-variedad]`)?.focus();
  });
  document.addEventListener("keydown", ev => { if (ev.key === "Escape" && document.querySelector(".gfr-modal")) cerrar(); });

  // Cursor: el índice bajo el puntero; solo se repinta cuando cambia
  function mover(ev) {
    const hit = ev.target.closest?.(".gfr-hit");
    if (!hit) return;
    const caja = hit.closest(".gfr"), sv = hit.ownerSVGElement, r = sv.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width * +hit.dataset.w;
    const i = Math.max(0, Math.min(+hit.dataset.n - 1, Math.floor(x / (+hit.dataset.pw / +hit.dataset.n))));
    if (caja.dataset.i === String(i)) return;
    caja.dataset.i = i;
    pintar(caja);
  }
  function salir(ev) {
    const hit = ev.target.closest?.(".gfr-hit");
    if (!hit || ev.relatedTarget?.closest?.(".gfr-hit")) return;
    const caja = hit.closest(".gfr");
    if (caja.dataset.i == null) return;
    delete caja.dataset.i;
    pintar(caja);
  }
  document.addEventListener("pointermove", mover);
  document.addEventListener("pointerdown", mover);
  document.addEventListener("pointerout", salir);

  window.Graficos = { disponible: k => (usar("frontera"), disponible(k)), fronteraHTML, fronteraResumen,
    disponibleMayoreo, mayoreoHTML, mayoreoResumen, abrir };
})();

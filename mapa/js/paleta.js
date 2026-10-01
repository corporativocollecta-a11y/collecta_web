// ============================================================================
// Paleta del mapa (tokens de css/styles.css, cambian con el tema), carga diferida de contornos
// y utilidades comunes de dibujo: coropletas, rutas con brillo y puntos de origen.
// ============================================================================
(function () {
  let cache = null;
  const tokens = () => {
    if (cache) return cache;
    const c = getComputedStyle(document.documentElement), v = n => c.getPropertyValue(n).trim();
    return (cache = {
      sin: v("--c-sin"), def: v("--c-def"), med: v("--c-med"), auto: v("--c-auto"), exc: v("--c-exc"), gran: v("--c-gran"),
      neutro: v("--c-neutro"), i4: v("--c-imp-alta"), borde: v("--c-borde"), sel: v("--c-sel"), importa: v("--c-importa"),
      ruta: v("--c-ruta")
    });
  };
  const refrescar = () => { cache = null; };

  const auto = r => { const t = tokens(); return r == null || r <= 0.001 ? t.sin : r < 0.5 ? t.def : r < 1 ? t.med : r < 2 ? t.auto : r < 10 ? t.exc : t.gran; };
  const imp = r => { const t = tokens(); return r <= 0.001 ? t.sin : r < 0.2 ? t.neutro : r < 0.4 ? t.med : r < 0.6 ? t.def : t.i4; };
  const rel = r => { const t = tokens(); return r == null ? t.sin : r < 0.5 ? t.def : r < 0.85 ? t.med : r <= 1.15 ? t.neutro : r <= 2 ? t.exc : t.gran; };

  // Carga un script de datos una sola vez (funciona también sin servidor, con file://)
  const cargas = {};
  function cargar(src, listo) {
    if (listo()) return Promise.resolve();
    return (cargas[src] ??= new Promise((ok, mal) => {
      const s = document.createElement("script");
      s.src = src; s.onload = () => ok(); s.onerror = () => { delete cargas[src]; mal(new Error("No se pudo cargar " + src)); };
      document.head.appendChild(s);
    }));
  }
  const geoRegiones = cc => cargar(`data/geo/${cc.toLowerCase()}.js`, () => !!window.GEO_SUB?.[cc]).then(() => window.GEO_SUB[cc]);
  const geoPaises = () => cargar("data/geo/paises.js", () => !!window.GEO_PAISES).then(() => window.GEO_PAISES);

  function panel(mapa, nombre, z) {
    if (!mapa.getPane(nombre)) mapa.createPane(nombre).style.zIndex = z;
    return nombre;
  }

  // Territorios coloreados; op: { color(id) → color o null (sin datos), seleccionado, tooltip(id), clic(id) }
  function coropletas(mapa, capa, geo, op) {
    const t = tokens(), pane = panel(mapa, "territorios", 350);
    const L = window.L.geoJSON(geo, {
      pane,
      filter: f => op.color(f.properties.id) != null,
      style: f => {
        const sel = f.properties.id === op.seleccionado;
        return { fillColor: op.color(f.properties.id), fillOpacity: sel ? 0.95 : 0.8, color: sel ? t.sel : t.borde,
          weight: sel ? 2.4 : 0.7, opacity: 1, className: "territorio" };
      },
      onEachFeature: (f, capaF) => {
        capaF.bindTooltip(() => op.tooltip(f.properties.id), { sticky: true });
        capaF.on({
          click: () => op.clic(f.properties.id),
          mouseover: () => { capaF.setStyle({ weight: 2, color: t.sel }); capaF.bringToFront(); },
          mouseout: () => L.resetStyle(capaF)
        });
      }
    });
    L.addTo(capa);
    return L;
  }

  // Ruta curva: halo tenue + trazo fino animado (sentido origen → destino)
  function ruta(capa, pts, color, grosor, tooltip) {
    const pane = "overlayPane";
    window.L.polyline(pts, { pane, color, weight: grosor * 3 + 3, opacity: 0.13, lineCap: "round", interactive: false }).addTo(capa);
    const l = window.L.polyline(pts, { pane, color, weight: grosor, opacity: 0.9, lineCap: "round", className: "ruta-flujo" });
    if (tooltip) l.bindTooltip(tooltip, { sticky: true });
    return l.addTo(capa);
  }
  // Punto de origen con brillo y etiqueta
  function origen(capa, lat, lon, texto, color) {
    return window.L.marker([lat, lon], {
      icon: window.L.divIcon({ className: "origen", iconSize: null,
        html: `<i style="--c:${color}"></i>${texto ? `<span>${texto}</span>` : ""}` }),
      interactive: false
    }).addTo(capa);
  }
  // Burbuja de volumen (opcional sobre las coropletas): círculo hueco
  function volumen(capa, lat, lon, radio) {
    const t = tokens();
    return window.L.circleMarker([lat, lon], { radius: radio, color: t.sel, weight: 1.2, opacity: 0.8, fillColor: t.sel, fillOpacity: 0.08, interactive: false }).addTo(capa);
  }

  window.Paleta = { tokens, refrescar, auto, imp, rel, cargar, geoRegiones, geoPaises, coropletas, ruta, origen, volumen };
})();

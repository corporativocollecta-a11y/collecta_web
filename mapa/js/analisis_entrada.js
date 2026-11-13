// ============================================================================
// Entrada al modo "Analizar precios" (comparativo entre productos a pantalla completa).
// Este archivo es mínimo y se carga con la página: conecta el botón del encabezado y los botones "Comparar" de los
// gráficos de precio, y lee el enlace directo (#…&an=frontera.brocoli.zanahoria). El módulo completo (js/analisis.js)
// y sus datos se bajan solo cuando alguien abre el modo, para no hacer más pesada la carga del mapa.
// El modo tiene su propia entrada en el historial: el botón "atrás" del navegador lo cierra.
// ============================================================================
(function () {
  const ARCHIVO = "js/analisis.js";
  let abierto = false, empujado = false;

  const hashQ = () => new URLSearchParams(location.hash.slice(1));
  const cargar = () => window.Paleta.cargar(ARCHIVO, () => !!window.Analisis);

  // ctx: { fuente, k, items } · origen: elemento desde el que crece la ventana (botón pulsado)
  function abrir(ctx = {}, origen = null, desdeEnlace = false) {
    if (abierto) return;
    abierto = true;
    if (!ctx.k && !ctx.items) ctx.k = hashQ().get("p");
    if (origen?.closest?.(".gfr-modal")) document.querySelector(".gfr-modal")?.remove();   // la vista ampliada cede su lugar
    const rect = origen?.getBoundingClientRect?.() ?? null;
    if (!desdeEnlace) {
      try { history.pushState({ analisis: 1 }, "", location.hash || "#"); empujado = true; } catch (e) { empujado = false; }
    }
    document.body.classList.add("analizando");
    cargar().then(() => window.Analisis.abrir(ctx, rect, origen))
      .catch(() => { abierto = false; document.body.classList.remove("analizando"); alert("No se pudo cargar el análisis de precios."); });
  }
  // Cierre pedido por la ventana (✕, Escape, clic en "Volver al mapa"): si el modo agregó una entrada al historial,
  // se regresa por ella; el evento popstate termina de cerrar.
  function pedirCierre() {
    if (!abierto) return;
    if (empujado) { empujado = false; history.back(); return; }
    cerrado();
  }
  function cerrado() {
    if (!abierto) return;
    abierto = false;
    window.Analisis?.cerrar();
    document.body.classList.remove("analizando");
    try { const q = hashQ(); if (q.has("an")) { q.delete("an"); history.replaceState(null, "", "#" + q.toString()); } } catch (e) { /* sin historial */ }
  }
  window.addEventListener("popstate", () => { if (abierto) { empujado = false; cerrado(); } });

  // Lo que el modo escribe en el enlace: an=<fuente>.<producto>.<producto>… (lo conserva app.js al reescribir el #hash)
  let estadoURL = null;
  function escribir(valor) {
    estadoURL = valor;
    try { const q = hashQ(); if (q.has("tour")) return; q.set("an", valor); history.replaceState(history.state, "", "#" + q.toString()); } catch (e) { /* sin historial */ }
  }
  const actual = () => abierto ? estadoURL ?? hashQ().get("an") : null;

  document.getElementById("btnAnalizar")?.addEventListener("click", ev => abrir({}, ev.currentTarget));

  // Enlace directo
  const an = hashQ().get("an");
  if (an) {
    const [fuente, ...items] = an.split(".");
    if (items.length) setTimeout(() => {
      const guia = document.getElementById("guia");
      if (guia) guia.hidden = true;
      estadoURL = an;
      abrir({ fuente, items }, null, true);
    }, 0);
  }

  window.AnalisisEntrada = { abrir, pedirCierre, escribir, actual };
})();

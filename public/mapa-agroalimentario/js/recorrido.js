// ============================================================================
// Modo presentación: recorrido guiado por los hallazgos del reporte 2025.
// Cada paso es una vista del mapa escrita como enlace directo (v, p, m, s, t, n, mm) más una sección que se abre.
// Se abre con #tour (o #tour=3 para empezar en el paso 3) y con el botón de la cabecera.
// Teclado: → / Espacio / AvPág siguiente, ← / RePág anterior, Inicio / Fin, Esc sale.
// Textos en español e inglés dentro de cada paso (no pasan por el traductor de plantillas).
// ============================================================================
(function () {
  const PASOS = [
    { vista: "v=mx&p=jitomate&t=resumen",
      es: ["De cada $100, al campo llegan entre $10 y $35",
        "En los 26 productos con precio al consumidor de PROFECO, el productor recibe entre $10 y $35 de cada $100: casi siempre la parte más chica. El transporte es el tramo menor, de $2 a $5 por kilo. El tablero ordena los productos por lo que llega al campo."],
      en: ["Of every $100, growers get $10 to $35",
        "In the 26 products with a PROFECO retail price, growers receive MX$10 to MX$35 of every MX$100: almost always the smallest share. Transport is the smallest link, MX$2 to MX$5 per kilo. The dashboard ranks products by what reaches the farm."] },
    { vista: "v=mx&p=jitomate&t=balance", abrir: "entidades",
      es: ["Menos jitomate en la mesa, las mismas exportaciones",
        "En 2025 la cosecha de jitomate cayó 16% y la exportación solo 4%. Lo que quedó para el mercado interno alcanza para 8.5 kg por persona, contra 14 kg de consumo oficial. Lo mismo pasó con el chile y la cebolla."],
      en: ["Less tomato at home, the same exports",
        "In 2025 the tomato harvest fell 16% and exports only 4%. What was left for the domestic market covers 8.5 kg per person, against 14 kg of official consumption. The same happened with chili and onion."] },
    { vista: "v=mx&p=aguacate&s=16&t=entidad",
      es: ["Un estado, casi toda la oferta",
        "Michoacán aporta 73% del aguacate, 89% de la zarzamora y 60% de la fresa. En diez productos un solo estado produce 60% o más: un choque sanitario, climático o comercial ahí afecta a casi toda la oferta nacional."],
      en: ["One state, nearly all the supply",
        "Michoacán grows 73% of avocados, 89% of blackberries and 60% of strawberries. In ten products a single state produces 60% or more: a health, weather or trade shock there hits almost the entire national supply."] },
    { vista: "v=US&p=jitomate&m=imp&t=exportar", abrir: "origenes",
      es: ["Un solo cliente",
        "México exportó US$15.7 mil millones de estas frutas y hortalizas en 2025; en cada producto, 86% o más del volumen va a Estados Unidos. Allá cubre 75% del jitomate y 77% del aguacate que se consume: Estados Unidos produce solo una cuarta parte de su jitomate."],
      en: ["A single customer",
        "Mexico exported US$15.7 billion of these fruits and vegetables in 2025; for every product, 86% or more of the volume goes to the United States. There it supplies 75% of the tomatoes and 77% of the avocados consumed: the U.S. grows only a quarter of its tomatoes."] },
    { vista: "v=US&p=jitomate&m=auto&t=exportar", abrir: "flete",
      es: ["Del cruce al mayoreo, +73%",
        "El jitomate saladette cruza la frontera a US$0.97 el kilo y se vende a US$1.68 en el mayoreo de Estados Unidos. El flete explica poco: un tráiler refrigerado de Nogales a Los Ángeles cuesta US$0.09 por kilo. La diferencia se queda entre importador y mayorista."],
      en: ["From border to wholesale, +73%",
        "Roma tomatoes cross the border at US$0.97 per kilo and sell for US$1.68 in U.S. wholesale markets. Freight explains little: a reefer truck from Nogales to Los Angeles costs US$0.09 per kilo. The gap stays with importers and wholesalers."] },
    { vista: "v=global&p=aguacate&m=auto&t=exportar", abrir: "exportadores",
      es: ["Primer exportador del mundo, con 2% de la cosecha",
        "Con datos de la FAO para 231 países, México vende 12.9% de todo lo que se exporta en el mundo en estas frutas y hortalizas, por delante de España y Países Bajos, con solo 2.1% de la producción mundial. En aguacate, papaya y jitomate es el número uno."],
      en: ["World's top exporter, with 2% of the harvest",
        "With FAO data for 231 countries, Mexico sells 12.9% of world exports of these fruits and vegetables, ahead of Spain and the Netherlands, with only 2.1% of world production. It ranks first in avocado, papaya and tomato."] },
    { vista: "v=global&p=jitomate&m=opp&t=exportar", abrir: "oportunidades",
      es: ["Miles de millones fuera de Estados Unidos",
        "Alemania, Reino Unido, Francia y Países Bajos compran cientos o miles de millones de dólares en productos donde México es líder, y casi no le compran a México. Solo en jitomate, Alemania importa US$1,728 millones de otros proveedores."],
      en: ["Billions outside the United States",
        "Germany, the UK, France and the Netherlands buy hundreds of millions to billions of dollars of products Mexico leads in, and buy almost nothing from Mexico. In tomatoes alone, Germany imports US$1.73 billion from other suppliers."] },
    { vista: "v=mx&p=esparrago&n=mun&mm=sequia&t=balance", abrir: "sequia",
      es: ["La sequía ya toca la cosecha",
        "Cruzamos el Monitor de Sequía de CONAGUA con la producción de cada municipio: 52% del espárrago y una cuarta parte del limón, la cebolla y el plátano se cultivan hoy en municipios con sequía moderada o peor."],
      en: ["Drought already reaches the harvest",
        "We crossed CONAGUA's Drought Monitor with each municipality's production: 52% of asparagus and a quarter of limes, onions and bananas are grown today in municipalities with moderate or worse drought."] }
  ];
  const TXT = {
    es: { etq: "Presentación", ant: "Anterior", sig: "Siguiente", fin: "Terminar", salir: "Salir de la presentación", reporte: "Reporte completo", ayuda: "← → para avanzar · Esc para salir" },
    en: { etq: "Presentation", ant: "Previous", sig: "Next", fin: "Finish", salir: "Exit presentation", reporte: "Full report", ayuda: "← → to move · Esc to exit" }
  };
  const idioma = () => document.documentElement.lang === "en" ? "en" : "es";

  let paso = -1, tarjeta = null, catalogoAntes = false;

  function crearTarjeta() {
    tarjeta = document.createElement("section");
    tarjeta.className = "recorrido";
    tarjeta.setAttribute("role", "dialog");
    tarjeta.setAttribute("aria-live", "polite");
    tarjeta.setAttribute("translate", "no");
    document.querySelector(".escenario").appendChild(tarjeta);
    tarjeta.addEventListener("click", e => {
      const b = e.target.closest("[data-rec]");
      if (!b) return;
      const accion = b.dataset.rec;
      if (accion === "ant") ir(paso - 1);
      else if (accion === "sig") paso === PASOS.length - 1 ? salir() : ir(paso + 1);
      else if (accion === "salir") salir();
      else if (accion === "ir") ir(+b.dataset.n);
    });
  }

  function pintar() {
    const L = idioma(), t = TXT[L], P = PASOS[paso], [titulo, texto] = P[L];
    const ultimo = paso === PASOS.length - 1;
    const reporte = document.querySelector(".acciones a.boton-texto")?.href;
    tarjeta.setAttribute("aria-label", `${t.etq} ${paso + 1} / ${PASOS.length}`);
    tarjeta.innerHTML = `
      <div class="rec-cabeza">
        <span class="etq">${t.etq} · ${paso + 1} / ${PASOS.length}</span>
        <button class="rec-cerrar" type="button" data-rec="salir" aria-label="${t.salir}" title="${t.salir}">✕</button>
      </div>
      <h2>${titulo}</h2>
      <p>${texto}</p>
      <div class="rec-pie">
        <div class="rec-puntos" role="tablist">${PASOS.map((_, i) => `<button type="button" data-rec="ir" data-n="${i}" aria-label="${i + 1}"${i === paso ? ' aria-current="step"' : ""}></button>`).join("")}</div>
        <div class="rec-botones">
          <button class="btn" type="button" data-rec="ant"${paso === 0 ? " disabled" : ""} aria-label="${t.ant}">‹</button>
          <button class="boton-primario" type="button" data-rec="sig">${ultimo ? t.fin : t.sig + " ›"}</button>
        </div>
      </div>
      <p class="rec-ayuda">${ultimo && reporte ? `<a href="${reporte}" target="_blank" rel="noopener">${t.reporte} ↗</a> · ` : ""}${t.ayuda}</p>`;
  }

  function ir(n) {
    if (n < 0 || n >= PASOS.length) return;
    paso = n;
    const q = new URLSearchParams(location.hash.slice(1));
    const l = q.get("l");
    try { history.replaceState(null, "", `#tour=${paso + 1}${l ? "&l=" + l : ""}`); } catch (e) { /* vista previa sin historial */ }
    window.App.irA(PASOS[paso].vista);
    pintar();
    const sec = PASOS[paso].abrir;
    // La sección se abre después de pintar el panel; se desplaza para que quede a la vista
    if (sec) setTimeout(() => {
      const d = window.Seccion?.abrir(sec);
      if (d && window.innerWidth > 900) d.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 120);
  }

  function iniciar(n = 0) {
    if (!tarjeta) crearTarjeta();
    if (paso < 0) {
      catalogoAntes = window.App.catalogoPlegado();
      if (window.innerWidth > 900) window.App.plegarCatalogo(true);   // más mapa en pantalla
      document.body.classList.add("en-recorrido");
      const guia = document.getElementById("guia");
      if (guia) guia.hidden = true;
    }
    tarjeta.hidden = false;
    ir(Math.min(Math.max(0, n), PASOS.length - 1));
    tarjeta.querySelector(".boton-primario")?.focus({ preventScroll: true });
  }

  function salir() {
    if (paso < 0) return;
    paso = -1;
    tarjeta.hidden = true;
    document.body.classList.remove("en-recorrido");
    if (window.innerWidth > 900) window.App.plegarCatalogo(catalogoAntes);
    const l = new URLSearchParams(location.hash.slice(1)).get("l");
    try { history.replaceState(null, "", l ? "#l=" + l : "#"); } catch (e) { /* vista previa sin historial */ }
    window.App.guardarURL();   // la URL vuelve a describir la vista actual
  }

  document.addEventListener("keydown", e => {
    if (paso < 0 || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest?.("input, select, textarea")) return;
    const k = e.key;
    if (k === "ArrowRight" || k === "PageDown" || (k === " " && !e.target.closest?.("button, a, summary"))) { e.preventDefault(); paso === PASOS.length - 1 ? salir() : ir(paso + 1); }
    else if (k === "ArrowLeft" || k === "PageUp") { e.preventDefault(); ir(paso - 1); }
    else if (k === "Home") { e.preventDefault(); ir(0); }
    else if (k === "End") { e.preventDefault(); ir(PASOS.length - 1); }
    else if (k === "Escape") { e.preventDefault(); salir(); }
  });

  // Con el idioma cambia el texto del paso (el traductor no toca la tarjeta)
  new MutationObserver(() => { if (paso >= 0) pintar(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  const desdeHash = () => {
    const q = new URLSearchParams(location.hash.slice(1));
    if (!q.has("tour")) return false;
    iniciar((parseInt(q.get("tour"), 10) || 1) - 1);
    return true;
  };
  window.addEventListener("hashchange", () => { if (paso < 0) desdeHash(); });
  document.getElementById("btnRecorrido")?.addEventListener("click", () => iniciar(0));
  desdeHash();

  window.Recorrido = { iniciar, salir, pasos: () => PASOS.length, activo: () => paso >= 0 };
})();

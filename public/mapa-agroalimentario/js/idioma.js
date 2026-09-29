// ============================================================================
// Versión en inglés. La interfaz se escribe en español; este módulo traduce el texto ya pintado.
// Cada texto se normaliza: los nombres conocidos (productos, países, meses, regiones) se cambian por "@" y las cifras
// por "#". La plantilla resultante se busca en window.TRADUCCION_EN (data/traduccion_en.js) y se rearma con los
// nombres traducidos y las mismas cifras. Lo que no tenga traducción se queda en español.
// ============================================================================
(function () {
  const PRODUCTOS_EN = {
    "Jitomate": "Tomato", "Chile verde y pimiento morrón": "Green chili and bell pepper", "Aguacate": "Avocado", "Limón": "Lime",
    "Naranja": "Orange", "Plátano": "Banana", "Mango": "Mango", "Papa": "Potato", "Cebolla": "Onion", "Brócoli": "Broccoli",
    "Fresa": "Strawberry", "Pepino": "Cucumber", "Manzana": "Apple", "Tomate verde": "Tomatillo", "Calabacita": "Zucchini",
    "Zanahoria": "Carrot", "Lechuga": "Lettuce", "Sandía": "Watermelon", "Melón": "Melon", "Papaya": "Papaya", "Piña": "Pineapple",
    "Uva": "Grape", "Toronja": "Grapefruit", "Pera": "Pear", "Durazno": "Peach", "Berenjena": "Eggplant", "Coliflor": "Cauliflower",
    "Espárrago": "Asparagus", "Arándano": "Blueberry", "Frambuesa": "Raspberry", "Guayaba": "Guava", "Nopal": "Nopal (cactus pad)",
    "Nuez": "Pecan", "Nuez pecanera": "Pecan", "Zarzamora": "Blackberry", "Cereza": "Cherry", "Kiwi": "Kiwi", "Mandarina": "Mandarin",
    "Chabacano (albaricoque)": "Apricot", "Granada": "Pomegranate", "Arándano rojo (cranberry)": "Cranberry",
    "Col (repollo y col china)": "Cabbage (incl. napa)", "Caqui": "Persimmon", "Tomate de árbol": "Tree tomato (tamarillo)",
    "Lulo": "Lulo (naranjilla)", "Maracuyá": "Passion fruit", "Uchuva": "Goldenberry", "Gulupa": "Purple passion fruit",
    "Granadilla": "Sweet granadilla", "Cebolla de rama": "Green onion", "Brócoli y coliflor": "Broccoli and cauliflower",
    "Pimiento y chile": "Pepper and chili", "Pimiento (paprika)": "Sweet pepper", "Pimiento (piman)": "Green pepper (piman)",
    "Mandarina (mikan)": "Mandarin (mikan)", "Lechuga y endibia": "Lettuce and endive",
    "Berries (arándano, frambuesa, zarzamora)": "Berries (blueberry, raspberry, blackberry)",
    "Berries (arándano y frambuesa)": "Berries (blueberry and raspberry)", "Chile y morrón": "Chili and bell pepper",
    "Frutas": "Fruit", "Hortalizas": "Vegetables", "Fruta": "Fruit", "Hortaliza": "Vegetable",
    "tomate bola": "round tomato", "tomate saladette": "Roma tomato", "pimiento morrón": "bell pepper", "chile jalapeño": "jalapeño",
    "limón persa": "Persian lime", "limón amarillo": "lemon", "calabaza amarilla": "yellow squash", "lechuga iceberg": "iceberg lettuce",
    "lechuga romana": "romaine", "durazno": "peach", "nectarina": "nectarine", "arándano": "blueberry", "frambuesa": "raspberry",
    "melón chino": "cantaloupe", "melón gota de miel": "honeydew",
    "Ciruela": "Plum", "Coco": "Coconut", "Ajo": "Garlic", "Ejote": "Green bean", "Chile seco": "Dried chili",
    "Café": "Coffee", "Cacao": "Cocoa", "Café verde (oro)": "Green coffee", "Cacao en grano": "Cocoa beans",
    "Mandarina y clementina": "Mandarin and clementine",
  };
  const MESES_EN = {
    enero: "January", febrero: "February", marzo: "March", abril: "April", mayo: "May", junio: "June", julio: "July",
    agosto: "August", septiembre: "September", octubre: "October", noviembre: "November", diciembre: "December",
    ene: "Jan", feb: "Feb", mar: "Mar", abr: "Apr", may: "May", jun: "Jun", jul: "Jul", ago: "Aug", sep: "Sep", oct: "Oct",
    nov: "Nov", dic: "Dec",
  };
  const ESTADOS_EUA_EN = {
    "Hawái": "Hawaii", "Luisiana": "Louisiana", "Míchigan": "Michigan", "Misisipi": "Mississippi", "Misuri": "Missouri",
    "Nuevo Hampshire": "New Hampshire", "Nueva Jersey": "New Jersey", "Nuevo México": "New Mexico", "Nueva York": "New York",
    "Carolina del Norte": "North Carolina", "Dakota del Norte": "North Dakota", "Oregón": "Oregon", "Pensilvania": "Pennsylvania",
    "Carolina del Sur": "South Carolina", "Dakota del Sur": "South Dakota", "Virginia Occidental": "West Virginia",
    "Distrito de Columbia": "District of Columbia", "Los Ángeles": "Los Angeles", "Filadelfia": "Philadelphia",
  };

  let nombres = null, regex = null;
  function construirNombres() {
    nombres = { ...ESTADOS_EUA_EN };
    Object.entries(PRODUCTOS_EN).forEach(([es, en]) => { nombres[es] = en; nombres[es.toLowerCase()] = en.toLowerCase(); });
    // Países: nombre en español del navegador → nombre en inglés
    try {
      const es = new Intl.DisplayNames(["es"], { type: "region" }), en = new Intl.DisplayNames(["en"], { type: "region" });
      Object.values(window.GLOBAL?.paises ?? {}).forEach(p => { if (p.iso) { try { nombres[es.of(p.iso)] = en.of(p.iso); } catch (e) { /* código sin nombre */ } } });
    } catch (e) { /* sin Intl.DisplayNames */ }
    Object.assign(nombres, { "EE. UU.": "U.S.", "Latinoamérica": "Latin America", "Latinoamérica y el Caribe": "Latin America and the Caribbean",
      "Mundo": "World", "Países Bajos": "Netherlands", "Corea del Sur": "South Korea", "Nueva Zelanda": "New Zealand" });
    // Regiones y estados: se conservan (no se traducen), pero se marcan como nombre para no multiplicar plantillas
    const propios = new Set();
    (window.ESTADOS ?? []).forEach(e => propios.add(e.nombre));
    Object.values(window.SUBNACIONAL ?? {}).forEach(d => Object.values(d.regiones).forEach(r => propios.add(r.nombre)));
    Object.values(window.PRECIOS_EUA?.mercados ?? {}).forEach(m => propios.add(m.nombre));
    propios.forEach(n => { if (!(n in nombres)) nombres[n] = n; });
    Object.entries(MESES_EN).forEach(([es, en]) => { nombres[es] = en; });
    const claves = Object.keys(nombres).filter(k => k.length > 2).sort((a, b) => b.length - a.length)
      .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    regex = new RegExp(`(?<![\\p{L}])(${claves.join("|")})(?![\\p{L}])`, "gu");
  }

  function normalizar(t) {
    if (!regex) construirNombres();
    const noms = [], nums = [];
    const s = t.replace(regex, m => { noms.push(m); return "@"; }).replace(/[+−-]?\d[\d.,]*/g, m => { nums.push(m); return "#"; });
    return { s, noms, nums };
  }
  function traducir(t) {
    const limpio = t.trim();
    if (!limpio) return null;
    if (!regex) construirNombres();
    if (nombres[limpio] && nombres[limpio] !== limpio) return t.replace(limpio, nombres[limpio]);
    const { s, noms, nums } = normalizar(limpio);
    const en = window.TRADUCCION_EN?.[s];
    if (en == null) return null;
    let i = 0, j = 0;
    return t.replace(limpio, en.replace(/@/g, () => { const n = noms[j++] ?? ""; return nombres[n] ?? n; }).replace(/#/g, () => nums[i++] ?? ""));
  }

  let activo = false;
  const originales = new WeakMap();
  function traducirNodo(n) {
    if (n.nodeType === 3) {
      if (n.parentElement?.closest("script,style,[translate=no]")) return;
      const orig = originales.get(n) ?? n.nodeValue;
      const en = traducir(orig);
      if (en != null && en !== n.nodeValue) { originales.set(n, orig); n.nodeValue = en; }
      return;
    }
    if (n.nodeType !== 1) return;
    if (n.closest?.("[translate=no]")) return;   // p. ej. la tarjeta del modo presentación, que ya trae su texto en inglés
    ["placeholder", "title", "aria-label"].forEach(a => {
      const v = n.getAttribute?.(a);
      if (!v) return;
      const en = traducir(v);
      if (en != null) { n.dataset["es" + a.replace("-", "")] ??= v; n.setAttribute(a, en); }
    });
    const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let x;
    while ((x = w.nextNode())) if (x !== n) traducirNodo(x);
  }
  // Una sola reescritura por nodo: se evita el ciclo observador → cambio → observador
  // En una pestaña oculta el navegador no ejecuta requestAnimationFrame: ahí se usa un temporizador
  const siguienteCuadro = f => document.hidden ? setTimeout(f, 16) : requestAnimationFrame(f);
  let pendiente = new Set(), programado = false;
  const obs = new MutationObserver(ms => {
    if (!activo) return;
    ms.forEach(m => { if (m.type === "characterData") pendiente.add(m.target); m.addedNodes.forEach(n => pendiente.add(n)); });
    if (!programado) { programado = true; siguienteCuadro(() => { programado = false; const p = pendiente; pendiente = new Set(); obs.disconnect(); p.forEach(traducirNodo); conectar(); }); }
  });
  const conectar = () => obs.observe(document.body, { childList: true, subtree: true, characterData: true });

  function usar(idioma) {
    activo = idioma === "en";
    document.documentElement.lang = activo ? "en" : "es";
    if (activo) document.title = document.title.replace("Mapa Agroalimentario", "Agri-Food Map");
    try { localStorage.setItem("idioma", activo ? "en" : "es"); } catch (e) { /* sin almacenamiento */ }
    try {   // el idioma también viaja en el enlace directo
      const q = new URLSearchParams(location.hash.slice(1));
      if (activo) q.set("l", "en"); else q.delete("l");
      history.replaceState(null, "", "#" + q.toString());
    } catch (e) { /* vista previa sin historial */ }
    const b = document.getElementById("btnIdioma");
    if (b) b.textContent = activo ? "ES" : "EN";
    // Las plantillas (≈130 kB) se cargan la primera vez que se pide el inglés
    if (activo) window.Paleta.cargar("data/traduccion_en.js", () => !!window.TRADUCCION_EN)
      .then(() => { obs.disconnect(); traducirNodo(document.body); conectar(); });
    else location.reload();   // volver al español: el texto original se pinta de nuevo
  }

  // Herramienta de mantenimiento: plantillas visibles sin traducción (para completar data/traduccion_en.js)
  function pendientes() {
    const faltan = new Set();
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const t = (originales.get(n) ?? n.nodeValue).trim();
      if (!t || !/\p{L}{3}/u.test(t) || n.parentElement.closest("script,style")) continue;
      const { s } = normalizar(t);
      if (!(s in (window.TRADUCCION_EN ?? {})) && !(t in nombres)) faltan.add(s);
    }
    return [...faltan];
  }

  window.Idioma = { usar, traducir, normalizar, pendientes, activo: () => activo };
  document.getElementById("btnIdioma")?.addEventListener("click", () => usar(activo ? "es" : "en"));
  let inicial = "es";
  try { inicial = new URLSearchParams(location.hash.slice(1)).get("l") || localStorage.getItem("idioma") || "es"; } catch (e) { /* sin almacenamiento */ }
  if (inicial === "en") setTimeout(() => usar("en"), 0);
})();

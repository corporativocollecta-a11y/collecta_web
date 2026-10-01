// ============================================================================
// Secciones plegables de los paneles (Producto, Exportar): título + resumen de una línea siempre visibles y el
// detalle dentro de un <details>. Los módulos siguen devolviendo HTML que empieza con <h3>: ese <h3> pasa a ser
// el título de la sección. Se recuerda qué secciones abrió la persona, aunque el panel se vuelva a pintar.
// ============================================================================
(function () {
  const abiertas = new Set();

  // html: bloque que empieza con <h3>…</h3>; resumen: texto de una línea (puede llevar <b>)
  function envolver(id, html, resumen, opciones = {}) {
    if (!html || !html.trim()) return "";
    const m = html.match(/^\s*<h3>([\s\S]*?)<\/h3>/);
    const titulo = opciones.titulo ?? (m ? m[1] : "");
    const cuerpo = m ? html.slice(m[0].length) : html;
    const abierta = abiertas.has(id) || (opciones.abierta && !abiertas.has("-" + id));
    return `
      <details class="seccion" data-sec="${id}"${abierta ? " open" : ""}>
        <summary><span class="sec-titulo">${titulo}</span>${resumen ? `<span class="sec-resumen">${resumen}</span>` : ""}</summary>
        <div class="sec-cuerpo">${cuerpo}</div>
      </details>`;
  }

  // "toggle" no burbujea: se escucha en captura para todo el documento
  document.addEventListener("toggle", e => {
    const d = e.target;
    if (!d.matches?.("details.seccion")) return;
    const id = d.dataset.sec;
    if (d.open) { abiertas.add(id); abiertas.delete("-" + id); } else { abiertas.delete(id); abiertas.add("-" + id); }
  }, true);

  // Ficha en PDF: las secciones abiertas se imprimen completas y las cerradas solo con su resumen de una línea,
  // así quien imprime decide qué entra en la ficha (ver @media print en css/styles.css)

  // Abre una sección (y la deja abierta en los siguientes repintados); devuelve el elemento si ya está en pantalla
  function abrir(id, raiz = document) {
    abiertas.add(id); abiertas.delete("-" + id);
    const d = raiz.querySelector(`.pestana.activo details.seccion[data-sec="${id}"]`);
    if (d) d.open = true;
    return d;
  }

  // Carga diferida de verdad: si el elemento está dentro de una sección cerrada, fn() espera a que se abra (así los
  // datos pesados, como data/historia.js de 914 kB, no se bajan con solo mostrar la pestaña). Devuelve true si esperó.
  const pendientes = new Map();   // <details> → [fn]
  function alAbrir(el, fn) {
    const d = el.closest("details.seccion");
    if (!d || d.open) { fn(); return false; }
    if (!pendientes.has(d)) pendientes.set(d, []);
    pendientes.get(d).push(fn);
    return true;
  }
  document.addEventListener("toggle", e => {
    const d = e.target;
    if (!d.open || !pendientes.has(d)) return;
    const fns = pendientes.get(d);
    pendientes.delete(d);
    fns.forEach(f => f());
  }, true);

  window.Seccion = { envolver, abrir, alAbrir };
})();

// ============================================================================
// Revisión automática del mapa (paso 9): recorre vistas con Chrome sin pantalla (protocolo DevTools, sin instalar
// nada: Node 22+ trae WebSocket) y revisa en cada una:
//   1. errores de consola y excepciones de JavaScript;
//   2. desborde horizontal a 375 px (ancho de teléfono) y elementos más anchos que la pantalla;
//   3. textos sin traducción al inglés (Idioma.pendientes(), con todas las secciones abiertas).
// Levanta su propio servidor (servidor.js) en un puerto 8093–8392. Escribe analisis/qa_<fecha>.md y
// data/fuentes/plantillas_pendientes.json (plantillas sin traducir, para scripts/traducir_en.py).
// Uso: node scripts/qa_mapa.mjs [--rapido]      (sale con código 1 si encuentra problemas)
// ============================================================================
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// puerto y perfil propios de cada corrida: un Chrome que quedó abierto de una corrida cortada no estorba
const PUERTO = 8093 + (process.pid % 300), CDP = 9333 + (process.pid % 300);
const RAPIDO = process.argv.includes("--rapido");
const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(existsSync);
const espera = ms => new Promise(r => setTimeout(r, ms));

const PRODUCTOS = RAPIDO ? ["jitomate", "aguacate"] : ["jitomate", "aguacate", "limon", "cebolla", "fresa", "manzana", "chile"];
const VISTAS = [
  ...PRODUCTOS.flatMap(p => ["balance", "exportar"].map(t => `v=mx&p=${p}&t=${t}`)),
  "v=mx&p=jitomate&s=25&t=exportar", "v=mx&p=limon&s=30&t=entidad", "v=mx&p=jitomate&t=resumen", "v=mx&p=jitomate&t=simulador",
  "v=mx&p=jitomate&t=fuentes", "v=mx&p=jitomate&me=oferta",
  "v=latam&p=aguacate", "v=global&p=arandano", "v=global&p=jitomate&t=exportar&mc=124",
  // granos: balanza, USDA, precio internacional e importación; maíz grano en la vista mundial
  "v=mx&p=maiz_amarillo&t=balance", "v=mx&p=maiz_blanco&t=exportar", "v=mx&p=frijol&s=32&t=entidad", "v=global&p=maiz", "v=latam&p=frijol",
  ...(RAPIDO ? [] : ["v=us&p=jitomate", "v=br&p=naranja", "v=es&p=jitomate", "v=ca&p=papa", "v=global&p=uva&t=exportar&mc=276"])
];

// --------- cliente mínimo del protocolo DevTools ---------
async function conectar() {
  for (let i = 0; i < 40; i++) {
    try {
      const lista = await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json();
      const pagina = lista.find(t => t.type === "page");
      if (pagina) return pagina.webSocketDebuggerUrl;
    } catch { /* Chrome todavía arranca */ }
    await espera(250);
  }
  throw new Error("Chrome no abrió el puerto de depuración");
}
function cliente(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const pend = new Map(), oyentes = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const { ok, ko } = pend.get(m.id); pend.delete(m.id); m.error ? ko(new Error(m.error.message)) : ok(m.result); }
    else if (m.method) oyentes.forEach(f => f(m));
  };
  const abierto = new Promise(r => { ws.onopen = r; });
  return {
    abierto,
    enviar: (method, params = {}) => new Promise((ok, ko) => { const i = ++id; pend.set(i, { ok, ko }); ws.send(JSON.stringify({ id: i, method, params })); }),
    escuchar: f => oyentes.push(f),
    cerrar: () => ws.close()
  };
}
async function evaluar(c, expr) {
  const r = await c.enviar("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
}

// Abre todas las secciones plegables de la pestaña activa y espera a que se llenen las cargas diferidas
const ABRIR = `(async () => {
  for (let i = 0; i < 2; i++) {
    document.querySelectorAll(".pestana.activo details.seccion, details.seccion").forEach(d => d.open = true);
    await new Promise(r => setTimeout(r, 1500));
  }
  return true;
})()`;
// Desborde horizontal: la página, y los elementos visibles que se salen de la pantalla (fuera de zonas con scroll propio)
const DESBORDE = `(() => {
  const w = innerWidth, fuera = [];
  const conScroll = el => { for (let x = el.parentElement; x; x = x.parentElement) { const s = getComputedStyle(x); if (/(auto|scroll|hidden)/.test(s.overflowX)) return true; } return false; };
  document.querySelectorAll("body *").forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width && r.height && (r.right > w + 1) && !conScroll(el) && getComputedStyle(el).position !== "fixed")
      fuera.push((el.id ? "#" + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\\s+/)[0] : "")) + " (" + Math.round(r.right - w) + " px)");
  });
  return { pagina: document.documentElement.scrollWidth - w, fuera: [...new Set(fuera)].slice(0, 8) };
})()`;

async function main() {
  if (!CHROME) throw new Error("No se encontró Chrome ni Edge");
  const servidor = spawn(process.execPath, [path.join(RAIZ, "servidor.js")], { env: { ...process.env, PORT: String(PUERTO) }, stdio: "ignore" });
  const perfil = path.join(tmpdir(), `qa-mapa-chrome-${process.pid}`);
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${CDP}`, `--user-data-dir=${perfil}`, "--no-first-run",
    "--disable-gpu", "--window-size=1280,900", "about:blank"], { stdio: "ignore" });
  const resultados = [], pendientes = new Set();
  let c;
  try {
    c = cliente(await conectar());
    await c.abierto;
    await c.enviar("Runtime.enable");
    await c.enviar("Page.enable");
    let errores = [];
    c.escuchar(m => {
      if (m.method === "Runtime.exceptionThrown") errores.push("Excepción: " + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).split("\n")[0]);
      if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errores.push("console.error: " + m.params.args.map(a => a.value ?? a.description ?? "").join(" ").slice(0, 200));
    });
    const base = `http://localhost:${PUERTO}/`;
    for (const ancho of [1280, 375]) {
      await c.enviar("Emulation.setDeviceMetricsOverride", { width: ancho, height: ancho > 800 ? 900 : 812, deviceScaleFactor: 1, mobile: ancho < 800 });
      for (const [i, v] of VISTAS.entries()) {
        if (ancho === 375 && RAPIDO && i > 6) break;
        errores = [];
        // primera visita de cada ancho: carga completa; después basta con cambiar el hash (como al navegar en la app)
        await c.enviar("Page.navigate", { url: `${base}?qa=${ancho}-${i}#${v}` });
        await espera(2500);
        await evaluar(c, `localStorage.setItem("guiaVista", "1"); const g = document.getElementById("guia"); if (g) g.hidden = true; true`).catch(() => {});
        await evaluar(c, ABRIR).catch(e => errores.push("No se pudieron abrir las secciones: " + e.message));
        const des = ancho === 375 ? await evaluar(c, DESBORDE) : null;
        let faltan = [];
        if (ancho === 1280) {
          // inglés: se activa, se reabren las secciones y se piden las plantillas visibles sin traducción
          // se espera a que lleguen las plantillas (si no, todo saldría como "sin traducir")
          const listo = await evaluar(c, `(async () => { if (!window.Idioma) return false; window.Idioma.usar("en");
            for (let i = 0; i < 60 && !window.TRADUCCION_EN; i++) await new Promise(r => setTimeout(r, 250));
            await new Promise(r => setTimeout(r, 800)); return !!window.TRADUCCION_EN; })()`).catch(() => false);
          if (!listo) errores.push("No cargó data/traduccion_en.js");
          await evaluar(c, ABRIR).catch(() => {});
          faltan = listo ? await evaluar(c, `window.Idioma.pendientes()`).catch(() => []) : [];
          faltan.forEach(f => pendientes.add(f));
          await evaluar(c, `localStorage.setItem("idioma", "es"); true`).catch(() => {});
        }
        resultados.push({ ancho, vista: v, errores: [...new Set(errores)], desborde: des, faltan: faltan.length });
        process.stdout.write(`${ancho} px · ${v}: ${errores.length} errores${des ? `, desborde ${des.pagina} px${des.fuera.length ? " (" + des.fuera.length + " elementos)" : ""}` : ""}${ancho === 1280 ? `, ${faltan.length} textos sin traducir` : ""}\n`);
      }
    }
  } finally {
    c?.cerrar();
    chrome.kill();
    servidor.kill();
    setTimeout(() => { try { rmSync(perfil, { recursive: true, force: true }); } catch { /* Chrome aún cierra */ } }, 1500);
  }
  // --------- informe ---------
  const hoy = new Date().toISOString().slice(0, 10);
  const conError = resultados.filter(r => r.errores.length);
  const desbordes = resultados.filter(r => r.desborde && (r.desborde.pagina > 0 || r.desborde.fuera.length));
  const md = [`# Revisión automática del mapa · ${hoy}`, "",
    `${resultados.length} visitas (${VISTAS.length} vistas a 1280 px y a 375 px). Script: \`node scripts/qa_mapa.mjs\`.`, "",
    `## Errores de consola (${conError.length})`, ...(conError.length ? conError.map(r => `- **${r.ancho} px · ${r.vista}**: ${r.errores.join(" · ")}`) : ["Ninguno."]), "",
    `## Desborde horizontal a 375 px (${desbordes.length})`, ...(desbordes.length ? desbordes.map(r => `- **${r.vista}**: página ${r.desborde.pagina} px; ${r.desborde.fuera.join(", ") || "—"}`) : ["Ninguno."]), "",
    `## Textos sin traducir al inglés (${pendientes.size})`, ...(pendientes.size ? [...pendientes].sort().map(p => `- ${p}`) : ["Ninguno."])];
  mkdirSync(path.join(RAIZ, "analisis"), { recursive: true });
  writeFileSync(path.join(RAIZ, "analisis", `qa_${hoy}.md`), md.join("\n") + "\n", "utf8");
  writeFileSync(path.join(RAIZ, "data", "fuentes", "plantillas_pendientes.json"), JSON.stringify([...pendientes].sort(), null, 1), "utf8");
  console.log(`\n${conError.length} vistas con errores · ${desbordes.length} con desborde a 375 px · ${pendientes.size} textos sin traducir`);
  console.log(`-> analisis/qa_${hoy}.md`);
  process.exit(conError.length || desbordes.length || pendientes.size ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });

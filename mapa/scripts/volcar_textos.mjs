// ============================================================================
// Vuelca el texto que el mapa muestra en cada vista (todas las secciones abiertas) para revisarlo como lo vería la
// persona usuaria: analisis/textos/<vista>.txt. Mismo motor que scripts/qa_mapa.mjs (Chrome sin pantalla, DevTools).
// Uso: node scripts/volcar_textos.mjs
// ============================================================================
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUERTO = 8400 + (process.pid % 300), CDP = 9700 + (process.pid % 300);
const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(existsSync);
const espera = ms => new Promise(r => setTimeout(r, ms));
const VISTAS = [
  ...["jitomate", "aguacate", "limon", "cebolla", "fresa", "chile", "manzana", "papa", "mango", "arandano"].flatMap(p =>
    ["balance", "exportar"].map(t => `v=mx&p=${p}&t=${t}`)),
  "v=mx&p=jitomate&s=25&t=entidad", "v=mx&p=jitomate&s=25&t=exportar", "v=mx&p=aguacate&s=16&t=entidad", "v=mx&p=limon&s=30&t=exportar",
  "v=mx&p=cebolla&s=08&t=entidad", "v=mx&p=jitomate&t=resumen", "v=mx&p=jitomate&t=simulador", "v=mx&p=jitomate&t=fuentes",
  "v=latam&p=aguacate", "v=global&p=arandano", "v=global&p=jitomate&t=exportar&mc=124", "v=US&p=jitomate", "v=ES&p=jitomate", "v=BR&p=naranja"
];

async function conectar() {
  for (let i = 0; i < 40; i++) {
    try { const l = await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json(); const p = l.find(t => t.type === "page"); if (p) return p.webSocketDebuggerUrl; } catch { }
    await espera(250);
  }
  throw new Error("Chrome no abrió el puerto");
}
function cliente(url) {
  const ws = new WebSocket(url); let id = 0; const pend = new Map();
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const { ok, ko } = pend.get(m.id); pend.delete(m.id); m.error ? ko(new Error(m.error.message)) : ok(m.result); } };
  return { abierto: new Promise(r => { ws.onopen = r; }), enviar: (method, params = {}) => new Promise((ok, ko) => { const i = ++id; pend.set(i, { ok, ko }); ws.send(JSON.stringify({ id: i, method, params })); }), cerrar: () => ws.close() };
}
const evaluar = async (c, expr) => (await c.enviar("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;

const servidor = spawn(process.execPath, [path.join(RAIZ, "servidor.js")], { env: { ...process.env, PORT: String(PUERTO) }, stdio: "ignore" });
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${CDP}`, `--user-data-dir=${path.join(tmpdir(), "volcar-" + process.pid)}`, "--no-first-run", "--disable-gpu", "--window-size=1366,900", "about:blank"], { stdio: "ignore" });
const destino = path.join(RAIZ, "analisis", "textos");
mkdirSync(destino, { recursive: true });
try {
  const c = cliente(await conectar()); await c.abierto; await c.enviar("Runtime.enable"); await c.enviar("Page.enable");
  for (const [i, v] of VISTAS.entries()) {
    await c.enviar("Page.navigate", { url: `http://localhost:${PUERTO}/?t=${i}#${v}` });
    await espera(2500);
    const texto = await evaluar(c, `(async () => {
      localStorage.setItem("guiaVista", "1"); const g = document.getElementById("guia"); if (g) g.hidden = true;
      for (let j = 0; j < 3; j++) { document.querySelectorAll(".pestana.activo details.seccion").forEach(d => d.open = true); await new Promise(r => setTimeout(r, 1500)); }
      const cab = [...document.querySelectorAll(".mapa-cabecera, .titular, .kpis-mapa, header")].map(e => e.innerText).join("\\n");
      const p = document.querySelector(".pestana.activo");
      return "URL: #${v}\\n\\n== Encabezado ==\\n" + (document.querySelector(".aviso")?.innerText ?? "") + "\\n" + cab + "\\n\\n== Panel (" + (p?.id ?? "?") + ") ==\\n" + (p?.innerText ?? "");
    })()`);
    writeFileSync(path.join(destino, `${String(i).padStart(2, "0")}_${v.replace(/[^a-z0-9]+/gi, "_")}.txt`), texto ?? "", "utf8");
    process.stdout.write(`${v}: ${(texto ?? "").length} caracteres\n`);
  }
  c.cerrar();
} finally { chrome.kill(); servidor.kill(); }
process.exit(0);

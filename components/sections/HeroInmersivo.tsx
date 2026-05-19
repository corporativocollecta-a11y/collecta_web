"use client";

import { useEffect, useRef } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";

// ─────────────────────────────────────────────────────────────────────────────
// HeroInmersivo — full-bleed cinematic hero with:
//   • parallax background photo (assets/header.jpeg)
//   • diagonal sun shafts
//   • golden sun motes that descend and get absorbed by leaf HUD nodes
//     (chlorophyll-green flash on absorption)
//   • leaf HUD nodes with IoT sensor cards (PH, NDVI, T°, CO₂, growth)
//   • soil dust particles (multiply blend, below leaves)
//   • data pulses traveling between leaf nodes
//   • hex grid that lights up near the cursor
//   • cursor-reactive node halos
//   • click ripples on the page and on CTAs
// ─────────────────────────────────────────────────────────────────────────────

export interface HeroCTA {
  label: string;
  variant?: "primary" | "ghost";
  href?: string;
  onClick?: () => void;
}

export interface HeroStat {
  value: string;
  label: string;
}

export interface HeroLeafNode {
  /** Normalized X coord (0..1) — aligns with a sprout in the photo. */
  nx: number;
  /** Normalized Y coord (0..1). */
  ny: number;
  /** Node short ID shown in the card header. */
  id: string;
  /** If true, the card hangs to the LEFT of the anchor instead of right. */
  flip?: boolean;
  /** Two key/value pairs displayed inside the card. */
  data: [string, string][];
  /** Progress bar fill, 0..1. */
  bar: number;
}

export interface HeroInmersivoProps {
  /** Background photo URL. @default "/hero/header.jpeg" */
  backgroundImage?: string;
  kicker?: string;
  /** Title can be split in two lines; second line gets the accent color. */
  titleLine1?: string;
  titleLine2?: string;
  subtitle?: string;
  ctas?: HeroCTA[];
  stats?: HeroStat[];
  /** Leaf HUD nodes — coordinates should match the sprouts in `backgroundImage`. */
  leafNodes?: HeroLeafNode[];
  /** Render the floating IoT sensor cards over the leaves.
      When false, the absorption hotspots stay (golden motes still "explode"
      into green chlorophyll flashes when they reach a leaf) but the cards
      themselves don't appear. @default true */
  showHudCards?: boolean;
  chipTL?: string;
  chipTR?: string;
  chipBL?: string;
  chipBR?: string;
  scrollLabel?: string;
  className?: string;
}

const DEFAULTS = {
  backgroundImage: "/hero/brocoli-hero.jpeg",
  kicker: "Quiénes somos · Ecosistema",
  titleLine1: "Rediseñando",
  titleLine2: "la cadena alimentaria",
  subtitle:
    "Un ecosistema integrado de producción, tecnología y comercialización que impulsa la transformación de la agroindustria en América Latina.",
  ctas: [
    { label: "Clientes", variant: "primary" as const, href: "#clientes" },
    { label: "Productores", variant: "primary" as const, href: "#productores" },
    { label: "Aliados", variant: "ghost" as const, href: "#aliados" },
  ],
  stats: [
    { value: "+1K", label: "hectáreas" },
    { value: "340", label: "productores" },
    { value: "98.7%", label: "trazabilidad" },
    { value: "24/7", label: "monitoreo" },
  ],
  leafNodes: [
    { nx: 0.15, ny: 0.58, id: "N-01", flip: false, data: [["PH", "6.4"], ["HUM", "78%"]],   bar: 0.78 },
    { nx: 0.31, ny: 0.56, id: "N-02", flip: false, data: [["NDVI", "0.81"], ["CLR", "92%"]], bar: 0.92 },
    { nx: 0.48, ny: 0.62, id: "N-03", flip: true,  data: [["T°", "24.1°C"], ["LUX", "38K"]], bar: 0.66 },
    { nx: 0.64, ny: 0.54, id: "N-04", flip: false, data: [["CO₂", "412"], ["RAD", "94%"]],   bar: 0.94 },
    { nx: 0.84, ny: 0.46, id: "N-05", flip: true,  data: [["CREC", "+12%"], ["H2O", "0.42"]], bar: 0.42 },
  ] as HeroLeafNode[],
  chipTL: "Sistema · activo",
  chipTR: "LATAM · 19.43°N  99.13°W",
  chipBL: "v.2026 · trazabilidad e2e",
  chipBR: "24 nodos sincronizados",
  scrollLabel: "Explorar",
};

export default function HeroInmersivo(props: HeroInmersivoProps) {
  const t = useT();
  // i18n fallback: when a text prop wasn't provided, use the translated
  // string for the active locale. Explicit props (including "") win.
  const i18nDefaults = {
    titleLine1: t('hero.title.line1'),
    titleLine2: t('hero.title.line2'),
    subtitle: t('hero.subtitle'),
    chipTL: t('hero.status'),
    chipTR: t('hero.location'),
  };
  const cfg = { showHudCards: true, ...DEFAULTS, ...i18nDefaults, ...props };
  const heroRef = useRef<HTMLElement | null>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dustCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const netRef = useRef<SVGSVGElement | null>(null);
  const hexRef = useRef<SVGSVGElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);
  const hudLayerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const canvas = fxCanvasRef.current;
    const dustCv = dustCanvasRef.current;
    const netSvg = netRef.current;
    const hexSvg = hexRef.current;
    const bgLayer = bgRef.current;
    const hudLayer = hudLayerRef.current;
    if (!hero || !canvas || !dustCv || !netSvg || !hexSvg || !hudLayer) return;

    const ctx = canvas.getContext("2d")!;
    const dctx = dustCv.getContext("2d")!;
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const mouse = { x: 0.5, y: 0.5, mx: 0, my: 0, inside: false, tx: 0.5, ty: 0.5 };

    // Leaf "hotspots" — augmented with runtime fields (_el, px, py).
    type Leaf = HeroLeafNode & { _el?: HTMLDivElement; px?: number; py?: number };
    const LEAFS: Leaf[] = cfg.leafNodes.map(l => ({ ...l }));

    type Mote = {
      x: number; y: number; vy: number; r: number; a: number;
      hue: number; target: Leaf | null; seed: number; twinkle: number;
    };
    type Absorption = { x: number; y: number; t: number; hue: number };
    type Puff = { x: number; y: number; vx: number; vy: number; r: number; t: number; life: number };
    type Burst = { x: number; y: number; t: number };
    type Hex = { x: number; y: number; el: SVGPolygonElement };
    type SoilNode = { x: number; y: number; r: number; phase: number; glow: number };
    type SoilEdge = { i: number; j: number; d: number };
    type SoilWave = { x: number; y: number; t: number };

    const motes: Mote[] = [];
    const absorptions: Absorption[] = [];
    const puffs: Puff[] = [];
    const bursts: Burst[] = [];
    const hexes: Hex[] = [];
    const soilNodes: SoilNode[] = [];
    const soilEdges: SoilEdge[] = [];
    const soilWaves: SoilWave[] = [];

    let W = 0, H = 0;

    function spawnMote(initial: boolean): Mote {
      const willHit = Math.random() < 0.72 && LEAFS.length > 0;
      const target = willHit ? LEAFS[Math.floor(Math.random() * LEAFS.length)] : null;
      // Spawn the mote on the same X column as its target — purely vertical fall.
      const baseX = target ? target.nx * W : Math.random() * W;
      return {
        x: baseX,
        y: initial ? Math.random() * H * 0.35 : -10 - Math.random() * 80,
        vy: 0.25 + Math.random() * 0.55,
        r: 0.7 + Math.random() * 1.6,
        a: 0.55 + Math.random() * 0.4,
        hue: 42 + Math.random() * 18,
        target,
        seed: Math.random() * Math.PI * 2,
        twinkle: 0.4 + Math.random() * 0.6,
      };
    }

    function seedSoilNet() {
      soilNodes.length = 0;
      soilEdges.length = 0;
      const N = Math.round(Math.min(46, (W * H) / 19000));
      for (let i = 0; i < N; i++) {
        // 62% of soil nodes cluster around the base of each plant; 38% scatter.
        let nx: number, ny: number;
        if (Math.random() < 0.62 && LEAFS.length) {
          const l = LEAFS[Math.floor(Math.random() * LEAFS.length)];
          const spread = 0.09 + Math.random() * 0.07;
          nx = l.nx + (Math.random() - 0.5) * 2 * spread;
          ny = 0.74 + Math.random() * 0.22;
        } else {
          nx = Math.random();
          ny = 0.80 + Math.random() * 0.16;
        }
        soilNodes.push({
          x: Math.max(8, Math.min(W - 8, nx * W)),
          y: Math.max(H * 0.72, Math.min(H - 6, ny * H)),
          r: 1.4 + Math.random() * 1.9,
          phase: Math.random() * Math.PI * 2,
          glow: 0,
        });
      }
      // Edges between near neighbours so the mesh feels triangulated.
      const MAX = Math.min(W, H) * 0.13;
      for (let i = 0; i < soilNodes.length; i++) {
        for (let j = i + 1; j < soilNodes.length; j++) {
          const a = soilNodes[i], b = soilNodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < MAX) soilEdges.push({ i, j, d });
        }
      }
    }
    function seedMotes(initial: boolean) {
      motes.length = 0;
      const N = Math.round(Math.min(120, (W * H) / 16000));
      for (let i = 0; i < N; i++) motes.push(spawnMote(initial));
    }

    function buildHexes() {
      hexes.length = 0;
      hexSvg!.innerHTML = "";
      const size = 28;
      const w = Math.sqrt(3) * size;
      const h = 2 * size;
      const cols = Math.ceil(W / w) + 2;
      const rows = Math.ceil(H / (h * 0.75)) + 2;
      const frag = document.createDocumentFragment();
      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const x = col * w + (row % 2 ? w / 2 : 0);
          const y = row * h * 0.75;
          const pts: string[] = [];
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i - Math.PI / 2;
            pts.push(
              `${(x + Math.cos(a) * size * 0.94).toFixed(1)},${(y + Math.sin(a) * size * 0.94).toFixed(1)}`
            );
          }
          const p = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
          p.setAttribute("points", pts.join(" "));
          hexes.push({ x, y, el: p });
          frag.appendChild(p);
        }
      }
      hexSvg!.appendChild(frag);
    }

    function buildHUD() {
      hudLayer!.innerHTML = "";
      // Skip rendering the IoT sensor cards but keep LEAFS coords intact —
      // motes still get absorbed (chlorophyll flash) at the same hotspots.
      if (!cfg.showHudCards) return;
      LEAFS.forEach((l, i) => {
        const el = document.createElement("div");
        el.className = "hud" + (l.flip ? " flip" : "");
        el.style.animationDelay = 0.4 + i * 0.12 + "s";
        el.innerHTML = `
          <span class="anchor"></span>
          <div class="card">
            <span class="id">${l.id}</span>
            ${l.data
              .map(
                ([k, v]) =>
                  `<div class="row"><span class="k">${k}</span><span class="v">${v}</span></div>`
              )
              .join("")}
            <div class="bar"><i style="--w:${(l.bar * 100).toFixed(0)}%"></i></div>
          </div>`;
        hudLayer!.appendChild(el);
        l._el = el;
      });
    }
    function layoutHUD() {
      LEAFS.forEach((l) => {
        if (!l._el) return;
        l._el.style.left = l.nx * W + "px";
        l._el.style.top = l.ny * H + "px";
        l.px = l.nx * W;
        l.py = l.ny * H;
      });
    }

    function resize() {
      const r = hero!.getBoundingClientRect();
      W = r.width; H = r.height;
      for (const c of [canvas!, dustCv!]) {
        c.width = W * DPR; c.height = H * DPR;
        c.style.width = W + "px"; c.style.height = H + "px";
      }
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      dctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      seedMotes(true);
      buildHexes();
      // Ensure every LEAF has px/py — needed by motes/soil net even when
      // there is no HUD card (because layoutHUD only sets coords when _el exists).
      LEAFS.forEach(l => { l.px = l.nx * W; l.py = l.ny * H; });
      layoutHUD();
      seedSoilNet();
    }

    function onMove(e: PointerEvent) {
      const r = hero!.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width;
      mouse.ty = (e.clientY - r.top) / r.height;
      mouse.mx = e.clientX - r.left;
      mouse.my = e.clientY - r.top;
      mouse.inside = true;
    }
    function onLeave() { mouse.inside = false; mouse.tx = 0.5; mouse.ty = 0.5; }
    function onDown(e: PointerEvent) {
      const r = hero!.getBoundingClientRect();
      bursts.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: 0 });
    }

    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    hero.addEventListener("pointerdown", onDown);

    // CTA ripple
    const btnHandlers: Array<{ el: HTMLElement; fn: (e: PointerEvent) => void }> = [];
    hero.querySelectorAll<HTMLElement>(".cta").forEach((btn) => {
      const fn = (e: PointerEvent) => {
        const r = btn.getBoundingClientRect();
        const rip = document.createElement("span");
        rip.className = "ripple";
        rip.style.left = e.clientX - r.left + "px";
        rip.style.top = e.clientY - r.top + "px";
        btn.appendChild(rip);
        setTimeout(() => rip.remove(), 700);
      };
      btn.addEventListener("pointerdown", fn);
      btnHandlers.push({ el: btn, fn });
    });

    // Soil network ripples — emit a radial wave from a random soil node every ~1.6s
    const waveTimer = window.setInterval(() => {
      if (!soilNodes.length) return;
      const n = soilNodes[Math.floor(Math.random() * soilNodes.length)];
      soilWaves.push({ x: n.x, y: n.y, t: 0 });
    }, 1600);

    let last = performance.now();
    let raf = 0;

    function tick(now: number) {
      const dt = Math.min(40, now - last); last = now;
      const t = now * 0.001;

      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;
      const mx = mouse.x * W, my = mouse.y * H;

      if (bgLayer) {
        // Sin movimiento autónomo — imagen estática alejada (scale 1.0).
        // Solo se mantiene el parallax sutil del mouse.
        const px = (mouse.x - 0.5) * -10;
        const py = (mouse.y - 0.5) * -5;
        bgLayer.style.transform = `translate3d(${px}px, ${py}px, 0) scale(1.0)`;
      }

      const SOIL_Y = H * 0.78;

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      // Motes — fall straight down on the column of their target leaf, no
      // horizontal drift. Absorbed when they reach the leaf's Y coordinate.
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i];

        // Absorption: mote reached the height of its target leaf.
        if (m.target && m.target.py !== undefined && m.y >= m.target.py) {
          absorptions.push({
            x: m.target.px ?? m.x,
            y: m.target.py,
            t: 0,
            hue: 140 + Math.random() * 30,
          });
          motes.splice(i, 1);
          motes.push(spawnMote(false));
          continue;
        }

        // Cursor proximity slows particles ("examined" feel).
        const dxm = mx - m.x, dym = my - m.y;
        if (Math.hypot(dxm, dym) < 90) m.vy *= 0.985;
        else m.vy += (0.45 - m.vy) * 0.002;

        m.y += m.vy * dt * 0.06;

        // Soil dispersion if the mote slipped past leaves and hit the dirt.
        if (m.y >= SOIL_Y + Math.random() * 40) {
          for (let k = 0; k < 2 + Math.random() * 2; k++) {
            puffs.push({
              x: m.x + (Math.random() - 0.5) * 10,
              y: SOIL_Y + 10 + Math.random() * (H - SOIL_Y - 12),
              vx: (Math.random() - 0.5) * 0.25,
              vy: -0.15 - Math.random() * 0.25,
              r: 1 + Math.random() * 2.4,
              t: 0,
              life: 0.8 + Math.random() * 0.6,
            });
          }
          motes.splice(i, 1);
          motes.push(spawnMote(false));
          continue;
        }

        // Render — halo, vertical trail, bright core.
        const tw = 0.7 + Math.sin(t * 4 + m.seed) * 0.3 * m.twinkle;
        const halo = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 8);
        halo.addColorStop(0, `hsla(${m.hue},95%,75%,${(m.a * 0.55 * tw).toFixed(3)})`);
        halo.addColorStop(1, `hsla(${m.hue},95%,60%,0)`);
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 8, 0, Math.PI * 2); ctx.fill();

        const grad = ctx.createLinearGradient(m.x, m.y - m.r * 9, m.x, m.y);
        grad.addColorStop(0, `hsla(${m.hue},90%,75%,0)`);
        grad.addColorStop(1, `hsla(${m.hue},95%,80%,${(m.a * 0.5).toFixed(3)})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = m.r * 0.8;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y - m.r * 9);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();

        ctx.fillStyle = `hsla(${m.hue},100%,88%,${Math.min(1, (m.a + 0.3) * tw).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
      }

      // Absorption flashes
      for (let i = absorptions.length - 1; i >= 0; i--) {
        const a = absorptions[i];
        a.t += dt * 0.0017;
        if (a.t > 1) { absorptions.splice(i, 1); continue; }
        const e = 1 - (1 - a.t) * (1 - a.t);
        const rad = 6 + e * 38;
        const al = (1 - a.t) * 0.85;
        ctx.strokeStyle = `hsla(${a.hue},90%,70%,${(al * 0.7).toFixed(3)})`;
        ctx.lineWidth = 1.6 * (1 - a.t) + 0.3;
        ctx.beginPath(); ctx.arc(a.x, a.y, rad, 0, Math.PI * 2); ctx.stroke();
        const g = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, rad * 0.9);
        g.addColorStop(0, `hsla(${a.hue},95%,80%,${(al * 0.8).toFixed(3)})`);
        g.addColorStop(1, `hsla(${a.hue},95%,60%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(a.x, a.y, rad * 0.9, 0, Math.PI * 2); ctx.fill();
      }

      // Click bursts
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.t += dt * 0.0011;
        if (b.t > 1) { bursts.splice(i, 1); continue; }
        const radius = b.t * 260;
        const alpha = (1 - b.t) ** 1.4;
        ctx.strokeStyle = `rgba(255,225,150,${alpha * 0.6})`;
        ctx.lineWidth = 2 * (1 - b.t);
        ctx.beginPath(); ctx.arc(b.x, b.y, radius, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = `rgba(140,240,190,${alpha * 0.45})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(b.x, b.y, radius * 0.55, 0, Math.PI * 2); ctx.stroke();
      }

      // ── Soil network: glowing mesh that ripples whenever a wave passes ──
      {
        const WAVE_THICK = 38;
        const WAVE_MAX = Math.max(W, H) * 0.65;
        for (const n of soilNodes) n.glow *= 0.93; // decay glow each frame
        for (let i = soilWaves.length - 1; i >= 0; i--) {
          const w = soilWaves[i];
          w.t += dt * 0.00045;
          const radius = w.t * WAVE_MAX;
          if (radius > WAVE_MAX) { soilWaves.splice(i, 1); continue; }
          for (const n of soilNodes) {
            const d = Math.hypot(n.x - w.x, n.y - w.y);
            const k = 1 - Math.abs(d - radius) / WAVE_THICK;
            if (k > 0) n.glow = Math.max(n.glow, k * (1 - w.t * 0.5));
          }
        }

        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        // edges
        const EDGE_MAX = Math.min(W, H) * 0.13;
        for (const e of soilEdges) {
          const a = soilNodes[e.i], b = soilNodes[e.j];
          const baseOp = 0.18 * (1 - e.d / EDGE_MAX);
          const wave = (a.glow + b.glow) * 0.5;
          const op = Math.min(0.9, baseOp + wave * 0.65);
          ctx.strokeStyle = `hsla(178, 85%, ${(58 + wave * 22).toFixed(0)}%, ${op.toFixed(3)})`;
          ctx.lineWidth = 0.6 + wave * 0.9;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        // node dots + halos
        for (const n of soilNodes) {
          const pulse = 0.5 + Math.sin(t * 1.8 + n.phase) * 0.5;
          const intensity = Math.min(1, 0.35 + n.glow * 0.9 + pulse * 0.15);
          const halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 9);
          halo.addColorStop(0, `hsla(178, 95%, 78%, ${(intensity * 0.55).toFixed(3)})`);
          halo.addColorStop(1, `hsla(178, 95%, 55%, 0)`);
          ctx.fillStyle = halo;
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 9, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = `hsla(178, 100%, ${(72 + intensity * 18).toFixed(0)}%, ${(0.65 + intensity * 0.35).toFixed(3)})`;
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r + n.glow * 1.4, 0, Math.PI * 2); ctx.fill();
        }
        // wave fronts — faint expanding rings
        for (const w of soilWaves) {
          const radius = w.t * WAVE_MAX;
          const al = (1 - w.t) * 0.18;
          if (al <= 0) continue;
          ctx.strokeStyle = `hsla(178, 90%, 65%, ${al.toFixed(3)})`;
          ctx.lineWidth = 1.1;
          ctx.beginPath(); ctx.arc(w.x, w.y, radius, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.restore();
      }

      ctx.globalCompositeOperation = "source-over";

      // Dust canvas (multiply)
      dctx.clearRect(0, 0, W, H);
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i];
        p.t += dt * 0.001;
        if (p.t > p.life) { puffs.splice(i, 1); continue; }
        p.x += p.vx; p.y += p.vy * 0.6;
        p.vy *= 0.985;
        const k = p.t / p.life;
        const rad = p.r * (1 + k * 2.2);
        const al = (1 - k) * 0.55;
        const g = dctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        g.addColorStop(0, `rgba(58,38,22,${al.toFixed(3)})`);
        g.addColorStop(1, `rgba(40,26,16,0)`);
        dctx.fillStyle = g;
        dctx.beginPath(); dctx.arc(p.x, p.y, rad, 0, Math.PI * 2); dctx.fill();
      }

      // Network: dashed lines + data pulses
      let parts = "";
      for (let i = 0; i < LEAFS.length; i++) {
        for (let j = i + 1; j < LEAFS.length; j++) {
          const a = LEAFS[i], b = LEAFS[j];
          const ax = a.px ?? 0, ay = a.py ?? 0, bx = b.px ?? 0, by = b.py ?? 0;
          const dx = ax - bx, dy = ay - by;
          const d = Math.hypot(dx, dy);
          if (d < W * 0.45) {
            const op = (1 - d / (W * 0.45)) * 0.22;
            parts += `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="rgba(140,230,192,${op.toFixed(3)})" stroke-width="0.7" stroke-dasharray="2 4"/>`;
          }
        }
      }
      for (const n of LEAFS) {
        const nx = n.px ?? 0, ny = n.py ?? 0;
        const md = Math.hypot(nx - mx, ny - my);
        const focus = mouse.inside && md < 200 ? 1 - md / 200 : 0;
        if (focus > 0.08) {
          parts += `<circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="${(8 + focus * 32).toFixed(1)}" fill="none" stroke="rgba(170,255,210,${(focus * 0.55).toFixed(3)})" stroke-width="0.9"/>`;
        }
      }
      netSvg!.innerHTML = parts;

      // Hex highlight near cursor
      if (hexes.length) {
        for (const h of hexes) {
          if (!mouse.inside) {
            h.el.setAttribute("fill", "transparent");
            h.el.setAttribute("stroke-opacity", "0.05");
            continue;
          }
          const d = Math.hypot(h.x - mx, h.y - my);
          const op = Math.max(0, 1 - d / 220);
          if (op > 0.02) {
            h.el.setAttribute("fill", `rgba(140,240,190,${(op * 0.14).toFixed(3)})`);
            h.el.setAttribute("stroke-opacity", (0.05 + op * 0.5).toFixed(3));
          } else {
            h.el.setAttribute("fill", "transparent");
            h.el.setAttribute("stroke-opacity", "0.05");
          }
        }
      }

      raf = requestAnimationFrame(tick);
    }

    buildHUD();
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(hero);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(waveTimer);
      ro.disconnect();
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      hero.removeEventListener("pointerdown", onDown);
      btnHandlers.forEach(({ el, fn }) => el.removeEventListener("pointerdown", fn));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section ref={heroRef} className={`hero-inmersivo ${cfg.className ?? ""}`}>
      <div className="bg" ref={bgRef}>
        {/* Responsive hero artwork: mobile-portrait crop on narrow viewports,
            wide desktop crop on tablet+. <picture> lets the browser pick the
            right asset so each device only downloads what it needs. */}
        <picture>
          <source media="(max-width: 1024px)" srcSet="/hero/brocoli-hero-mobile.jpeg" />
          <img src={cfg.backgroundImage} alt="" aria-hidden />
        </picture>
      </div>
      <div className="bg-overlay" aria-hidden />
      <div className="tint" />
      <div className="shafts" />

      {/* Capa de fundido al final del hero — funde con el color de la siguiente sección.
          Cubre solo los últimos 220px del hero para no invadir la tierra. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '220px',
          background:
            'linear-gradient(180deg, rgba(15,22,18,0) 0%, rgba(15,22,18,0.35) 30%, rgba(15,22,18,0.75) 65%, #0f1612 100%)',
          pointerEvents: 'none',
          zIndex: 6,
        }}
      />

      <svg className="hex-grid" ref={hexRef} preserveAspectRatio="none" />
      <canvas className="dust" ref={dustCanvasRef} />
      <canvas className="fx" ref={fxCanvasRef} />
      <svg className="network" ref={netRef} preserveAspectRatio="none" />
      <div className="hud-layer" ref={hudLayerRef} />
      <div className="scan" />

      <div className="frame" />
      <div className="corner tl" /><div className="corner tr" />
      <div className="corner bl" /><div className="corner br" />

      {cfg.chipTL ? <div className="chip tl"><span className="dot" /> {cfg.chipTL}</div> : null}
      {cfg.chipTR ? <div className="chip tr">{cfg.chipTR}</div> : null}
      {cfg.chipBL ? <div className="chip bl">{cfg.chipBL}</div> : null}
      {cfg.chipBR ? <div className="chip br"><span className="dot" /> {cfg.chipBR}</div> : null}

      <div className="content">
        {cfg.kicker ? (
          <div className="kicker"><span className="line" />{cfg.kicker}<span className="line" /></div>
        ) : null}
        <h1 className="title">
          {cfg.titleLine1}<br /><span className="accent">{cfg.titleLine2}</span>
        </h1>
        <p className="subtitle">{cfg.subtitle}</p>
        {cfg.ctas.length > 0 ? (
          <div className="ctas">
            {cfg.ctas.map((c, i) =>
              'href' in c && c.href ? (
                <a key={i} href={c.href} className={`cta ${c.variant === "ghost" ? "ghost" : ""}`}>{c.label}</a>
              ) : (
                <button key={i} type="button" onClick={() => 'onClick' in c && c.onClick?.()} className={`cta ${c.variant === "ghost" ? "ghost" : ""}`}>{c.label}</button>
              )
            )}
          </div>
        ) : null}
      </div>

      {cfg.stats.length > 0 ? (
        <div className="stats">
          {cfg.stats.map((s, i) => (
            <div key={i} className="stat-row">
              <div className="stat"><b>{s.value}</b>{s.label}</div>
              {i < cfg.stats.length - 1 && <div className="div" />}
            </div>
          ))}
        </div>
      ) : null}

      {cfg.scrollLabel ? (
        <div className="scroll"><span>{cfg.scrollLabel}</span><span className="bar" /></div>
      ) : null}

      <style jsx>{`
        .hero-inmersivo{
          position:relative;width:100%;min-height:760px;height:100vh;max-height:900px;
          overflow:hidden;isolation:isolate;background:#06120e;cursor:crosshair;
          font-family:"Geo","Geo Fallback",-apple-system,sans-serif;
          color:#eaf5ee;-webkit-font-smoothing:antialiased;
        }
        .bg{
          position:absolute;inset:0;background-color:#06120e;
          transition:transform .3s cubic-bezier(.2,.7,.3,1);will-change:transform;
          filter:saturate(1.12) contrast(1.10) brightness(1.0);
        }
        .bg picture, .bg img{
          display:block;width:100%;height:100%;
        }
        .bg img{
          object-fit:cover;object-position:center 55%;
        }
        /* Soft cinematic overlay layered on top of the responsive hero image:
           amber sunburst top-right + dark vertical fade at the top so the nav
           and copy stay legible. */
        .bg-overlay{
          position:absolute;inset:0;pointer-events:none;
          background:
            radial-gradient(ellipse 35% 30% at 88% 28%, rgba(255,170,80,.10) 0%, rgba(255,130,55,.04) 40%, transparent 75%),
            linear-gradient(180deg, rgba(2,12,7,1) 0%, rgba(3,16,9,1) 10%, rgba(5,20,11,.98) 16%, rgba(8,26,14,.88) 22%, rgba(10,30,16,.65) 30%, rgba(10,30,16,.42) 40%, rgba(10,30,16,.25) 50%, rgba(10,30,16,.10) 60%, transparent 68%);
        }
        /* Desktop wide (>=1280px): hero takes its aspect ratio from the new
           1376x768 image (16:9). Capped at 100vh so it never overflows the
           viewport on tall narrow screens. */
        @media (min-width: 1280px){
          .hero-inmersivo{
            height:auto;
            min-height:0;
            max-height:100vh;
            aspect-ratio: 1376 / 768;
          }
          .bg img{
            object-position:center;
          }
        }
        .tint{
          position:absolute;inset:0;pointer-events:none;mix-blend-mode:multiply;
          background:
            radial-gradient(ellipse 30% 25% at 88% 28%, rgba(255,170,80,.08) 0%, rgba(255,130,55,.03) 45%, transparent 78%),
            linear-gradient(180deg, rgba(8,32,18,.98) 0%, rgba(10,38,22,.92) 10%, rgba(10,36,21,.80) 18%, rgba(10,34,19,.58) 26%, rgba(10,32,18,.38) 36%, rgba(10,32,18,.22) 48%, rgba(10,32,18,.10) 58%, transparent 65%);
        }
        .shafts{
          position:absolute;inset:0;pointer-events:none;
          background:
            linear-gradient(115deg, transparent 35%, rgba(255,220,150,.06) 42%, transparent 50%),
            linear-gradient(120deg, transparent 55%, rgba(255,225,160,.05) 62%, transparent 70%),
            linear-gradient(108deg, transparent 18%, rgba(255,215,135,.04) 25%, transparent 35%);
          mix-blend-mode:screen;opacity:.9;
        }
        .fx, .network, .hex-grid, .hud-layer, .dust{
          position:absolute;inset:0;width:100%;height:100%;pointer-events:none;
        }
        .hud-layer{ z-index:3 }
        .fx{ mix-blend-mode:screen; opacity:1 }
        .network{ mix-blend-mode:screen; opacity:.95 }
        .dust{ mix-blend-mode:multiply; opacity:.9 }
        .hex-grid :global(polygon){
          fill:transparent;stroke:#8ce6c0;stroke-width:.6;stroke-opacity:.05;
          transition:fill .25s linear, stroke-opacity .25s linear;
        }

        /* HUD nodes — leaf data cards */
        .hud-layer :global(.hud){
          position:absolute;pointer-events:none;
          transform:translate(-50%,-50%);
          color:rgba(220,255,232,.92);
          font:500 9.5px/1.25 "Geo","Geo Fallback",-apple-system,sans-serif;
          letter-spacing:.14em;text-transform:uppercase;
          white-space:nowrap;
          opacity:0;animation:hudIn 1s ease-out forwards;
        }
        .hud-layer :global(.hud .anchor){
          position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
          width:10px;height:10px;border-radius:50%;
          background:radial-gradient(circle at center, #c9ffd9 0%, rgba(140,230,192,0) 70%);
          box-shadow:0 0 12px rgba(140,230,192,.6);
          animation:nodePulse 2.4s ease-in-out infinite;
        }
        .hud-layer :global(.hud .anchor::before){
          content:"";position:absolute;inset:-6px;border:1px solid rgba(140,230,192,.55);
          border-radius:50%;animation:ringPulse 2.4s ease-in-out infinite;
        }
        .hud-layer :global(.hud .anchor::after){
          content:"";position:absolute;inset:-14px;border:1px dashed rgba(140,230,192,.22);
          border-radius:50%;animation:ringPulseSlow 6s linear infinite;
        }
        .hud-layer :global(.hud .card){
          position:absolute;left:18px;top:-10px;
          padding:6px 10px 7px;
          background:linear-gradient(180deg, rgba(6,22,16,.78), rgba(6,22,16,.62));
          border:1px solid rgba(140,230,192,.32);
          border-radius:4px;
          backdrop-filter:blur(6px) saturate(140%);
          -webkit-backdrop-filter:blur(6px) saturate(140%);
          box-shadow:0 6px 24px rgba(0,0,0,.45), 0 0 0 1px rgba(0,0,0,.25) inset;
        }
        .hud-layer :global(.hud.flip .card){left:auto;right:18px}
        .hud-layer :global(.hud .card::before){
          content:"";position:absolute;left:-12px;top:50%;width:12px;height:1px;
          background:linear-gradient(90deg, rgba(140,230,192,0), rgba(140,230,192,.7));
        }
        .hud-layer :global(.hud.flip .card::before){
          left:auto;right:-12px;
          background:linear-gradient(270deg, rgba(140,230,192,0), rgba(140,230,192,.7));
        }
        .hud-layer :global(.hud .card .id){color:#8ce6c0;font-weight:600;font-size:9px;letter-spacing:.22em;display:block;margin-bottom:3px}
        .hud-layer :global(.hud .card .row){display:flex;gap:8px;align-items:baseline}
        .hud-layer :global(.hud .card .k){color:rgba(220,255,232,.55);font-size:8.5px}
        .hud-layer :global(.hud .card .v){color:#eaf5ee;font-size:10.5px;font-weight:500}
        .hud-layer :global(.hud .card .bar){
          margin-top:5px;width:62px;height:2px;background:rgba(140,230,192,.18);
          border-radius:2px;overflow:hidden;position:relative;
        }
        .hud-layer :global(.hud .card .bar i){
          position:absolute;left:0;top:0;height:100%;width:var(--w,60%);
          background:linear-gradient(90deg,#3aa07b,#8ce6c0);
          box-shadow:0 0 6px rgba(140,230,192,.6);
        }
        @keyframes hudIn{from{opacity:0;transform:translate(-50%,-46%)}to{opacity:1;transform:translate(-50%,-50%)}}
        @keyframes nodePulse{0%,100%{transform:translate(-50%,-50%) scale(.85);filter:brightness(.9)}50%{transform:translate(-50%,-50%) scale(1.15);filter:brightness(1.2)}}
        @keyframes ringPulse{0%{transform:scale(.6);opacity:.9}100%{transform:scale(2);opacity:0}}
        @keyframes ringPulseSlow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

        .scan{
          position:absolute;inset:0;pointer-events:none;opacity:.08;mix-blend-mode:overlay;
          background:repeating-linear-gradient(0deg, rgba(255,255,255,.5) 0 1px, transparent 1px 3px);
        }
        .frame{position:absolute;inset:18px;border:1px solid rgba(234,245,238,.12);pointer-events:none}
        .corner{position:absolute;width:22px;height:22px;border:1.5px solid rgba(140,230,192,.55);pointer-events:none}
        .corner.tl{left:14px;top:14px;border-right:0;border-bottom:0}
        .corner.tr{right:14px;top:14px;border-left:0;border-bottom:0}
        .corner.bl{left:14px;bottom:14px;border-right:0;border-top:0}
        .corner.br{right:14px;bottom:14px;border-left:0;border-top:0}
        .chip{
          position:absolute;display:flex;align-items:center;gap:10px;
          padding:8px 14px;border:1px solid rgba(140,230,192,.25);
          background:rgba(6,18,14,.45);backdrop-filter:blur(8px) saturate(140%);
          -webkit-backdrop-filter:blur(8px) saturate(140%);
          color:rgba(234,245,238,.85);font:11px/1 "Geo","Geo Fallback",-apple-system,sans-serif;
          letter-spacing:.08em;text-transform:uppercase;border-radius:999px;pointer-events:none;
        }
        .chip .dot{width:6px;height:6px;border-radius:50%;background:#8ce6c0;
          box-shadow:0 0 8px #8ce6c0,0 0 16px rgba(140,230,192,.5);
          animation:pulse 2s ease-in-out infinite}
        @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
        .chip.tl{left:46px;top:46px}
        .chip.tr{right:46px;top:46px}
        .chip.bl{left:46px;bottom:46px}
        .chip.br{right:46px;bottom:46px;text-transform:none;letter-spacing:0;font-size:11px}

        .content{
          position:absolute;inset:0;display:flex;flex-direction:column;
          align-items:center;justify-content:center;padding:14vh 24px 4vh;pointer-events:none;text-align:center;
        }
        /* Mobile (<=768px): anchor the copy near the top of the hero
           instead of centering it, so there's no large black void at
           the top of the viewport. 96px padding-top clears the 64px
           sticky header (h-16) plus a small breathing strip. */
        @media (max-width: 768px){
          .content{
            padding:120px 20px 4vh;
            justify-content:flex-start;
          }
          .subtitle{
            margin-top:20px !important;
          }
          .kicker{
            margin-bottom:18px;
          }
        }
        .kicker{
          pointer-events:auto;display:inline-flex;align-items:center;gap:14px;
          color:#8ce6c0;font:500 11px/1 "Geo","Geo Fallback",-apple-system,sans-serif;
          letter-spacing:.32em;text-transform:uppercase;margin-bottom:28px;
          opacity:0;animation:fadeUp .8s .2s ease-out forwards;
        }
        .kicker :global(.line){width:36px;height:1px;background:#8ce6c0;opacity:.6;display:inline-block}
        .title{
          pointer-events:auto;margin:0;
          font-family:"Geo","Geo Fallback",-apple-system,sans-serif;font-weight:400;
          font-size:clamp(48px,7.5vw,120px);line-height:.95;letter-spacing:.005em;color:#fff;
          text-shadow:
            0 2px 4px rgba(0,0,0,.7),
            0 4px 16px rgba(0,0,0,.65),
            0 0 32px rgba(0,0,0,.55),
            0 0 80px rgba(140,230,192,.18);
          max-width:1100px;text-wrap:balance;
          opacity:0;animation:fadeUp 1s .35s ease-out forwards;
        }
        .title :global(.accent){
          color:#00FF80;
          text-shadow:
            0 2px 4px rgba(0,0,0,.75),
            0 4px 16px rgba(0,0,0,.7),
            0 0 28px rgba(0,0,0,.6),
            0 0 24px rgba(0,255,128,.45),
            0 0 60px rgba(0,255,128,.28);
        }
        .subtitle{
          pointer-events:auto;max-width:1000px;margin:36px auto 0;
          font-size:clamp(28px,2.2vw,34px);line-height:1.45;color:#FFFFFF;font-weight:500;
          text-shadow:
            0 1px 3px rgba(0,0,0,.85),
            0 2px 12px rgba(0,0,0,.75),
            0 0 22px rgba(0,0,0,.55);
          opacity:0;animation:fadeUp 1s .5s ease-out forwards;
        }
        .ctas{
          pointer-events:auto;display:flex;gap:14px;margin-top:110px;flex-wrap:wrap;justify-content:center;
          opacity:0;animation:fadeUp 1s .7s ease-out forwards;
        }
        .cta{
          position:relative;overflow:hidden;appearance:none;border:0;cursor:pointer;
          padding:16px 37px;border-radius:999px;
          font:700 17px/1 "Geo","Geo Fallback",-apple-system,sans-serif;letter-spacing:.08em;color:#fff;
          background:#00FF80;
          text-shadow:
            0 1px 3px rgba(0,0,0,.8),
            0 2px 8px rgba(0,0,0,.6),
            0 0 14px rgba(0,0,0,.45);
          box-shadow:
            0 1px 0 rgba(255,255,255,.25) inset,
            0 -1px 0 rgba(0,0,0,.25) inset,
            0 8px 24px rgba(0,0,0,.35),
            0 0 0 1px rgba(0,255,128,.25);
          transition:transform .2s ease, box-shadow .25s ease, filter .2s ease;
          text-decoration:none;
        }
        .cta:hover{
          transform:translateY(-2px);filter:brightness(1.12);
          box-shadow:
            0 1px 0 rgba(255,255,255,.3) inset,
            0 -1px 0 rgba(0,0,0,.25) inset,
            0 14px 36px rgba(0,0,0,.45),
            0 0 0 1px rgba(140,230,192,.55),
            0 0 28px rgba(140,230,192,.4);
        }
        .cta:active{transform:translateY(0);filter:brightness(.95)}
        .cta.ghost{
          background:rgba(74,222,128,.55);color:#ffffff;
          backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
          box-shadow:
            inset 0 0 0 2px rgba(220,255,235,1),
            0 0 0 1px rgba(74,222,128,.70),
            0 0 32px rgba(74,222,128,.60),
            0 12px 36px rgba(0,0,0,.55);
          text-shadow:
            0 1px 3px rgba(0,0,0,.95),
            0 2px 10px rgba(0,0,0,.75),
            0 0 18px rgba(0,0,0,.55);
          animation:ctaPulse 3.6s ease-in-out 1.7s infinite;
        }
        .cta.ghost:hover{
          background:rgba(74,222,128,.45);
          transform:translateY(-3px);
          box-shadow:
            inset 0 0 0 1.5px rgba(220,255,230,1),
            0 0 0 1px rgba(74,222,128,.65),
            0 0 36px rgba(140,230,192,.65),
            0 16px 40px rgba(0,0,0,.55);
        }
        @keyframes ctaPulse {
          0%, 100% {
            box-shadow:
              inset 0 0 0 1.5px rgba(190,255,215,.85),
              0 0 0 1px rgba(74,222,128,.45),
              0 0 24px rgba(74,222,128,.40),
              0 10px 32px rgba(0,0,0,.50);
          }
          50% {
            box-shadow:
              inset 0 0 0 1.5px rgba(210,255,225,.95),
              0 0 0 1px rgba(74,222,128,.55),
              0 0 38px rgba(74,222,128,.62),
              0 10px 32px rgba(0,0,0,.50);
          }
        }
        .cta :global(.ripple){
          position:absolute;width:0;height:0;border-radius:50%;background:rgba(255,255,255,.55);
          transform:translate(-50%,-50%);animation:ripple .7s ease-out forwards;pointer-events:none;
        }
        @keyframes ripple{
          0%{width:0;height:0;opacity:.6}
          100%{width:520px;height:520px;opacity:0}
        }
        @keyframes fadeUp{
          from{opacity:0;transform:translateY(14px)}
          to{opacity:1;transform:translateY(0)}
        }
        .stats{
          position:absolute;left:50%;bottom:48px;transform:translateX(-50%);
          display:flex;gap:36px;pointer-events:auto;align-items:stretch;
          opacity:0;animation:fadeUp 1s .9s ease-out forwards;
        }
        .stat-row{display:flex;align-items:stretch;gap:36px}
        .stat{
          text-align:center;color:rgba(234,245,238,.7);
          font:500 10.5px/1.3 "Geo","Geo Fallback",-apple-system,sans-serif;
          letter-spacing:.16em;text-transform:uppercase;
        }
        .stat b{
          display:block;color:#8ce6c0;font-family:"Geo","Geo Fallback",-apple-system,sans-serif;
          font-weight:400;font-size:22px;letter-spacing:.02em;margin-bottom:4px;
          text-shadow:0 0 18px rgba(140,230,192,.4);
        }
        .div{width:1px;background:rgba(140,230,192,.18);align-self:stretch}
        .scroll{
          position:absolute;left:50%;bottom:14px;transform:translateX(-50%);
          color:rgba(234,245,238,.45);font:500 10px/1 "Geo","Geo Fallback",-apple-system,sans-serif;
          letter-spacing:.32em;text-transform:uppercase;
          display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;
        }
        .scroll .bar{width:1px;height:24px;background:linear-gradient(180deg,#8ce6c0,transparent);
          animation:dropdown 1.8s ease-in-out infinite}
        @keyframes dropdown{
          0%{transform:translateY(-10px);opacity:0}
          50%{opacity:1}
          100%{transform:translateY(10px);opacity:0}
        }
        @media (max-width: 760px){
          .chip,.frame,.corner,.scroll{display:none}
          .stats{gap:20px;bottom:30px}
          .stat b{font-size:16px}
        }
      `}</style>
    </section>
  );
}

import type { CSSProperties, ReactNode } from "react";
import { Package, Snowflake, Sprout, Store, Truck } from "lucide-react";

/* One small story per impact card (section 06), drawn in code, no figures.
   Each plays once when its card opens (the card remounts on open, so it replays), then
   holds its final frame; a couple of ambient loops keep the open card alive.
   Every element's resting style IS the final frame and the keyframes only say where it
   comes from, so with reduced motion (animations off) the finished picture shows.
   Only transform, opacity, clip-path and stroke-dashoffset move. */

const LIME = "#9fd36a";
const ORANGE = "#f2703a";
const INK = "#0a110c";
const DIM = "rgb(238 235 227 / 0.16)";
const FAINT = "rgb(238 235 227 / 0.07)";
const OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

/* play `name` once: from its keyframe to the element's own style */
const a = (name: string, dur: number, delay: number, origin = "center", ease = OUT): CSSProperties => ({
  animation: `${name} ${dur}s ${ease} ${delay}s both`,
  transformBox: "fill-box",
  transformOrigin: origin,
});
/* ambient loop, starting after the story */
const loop = (name: string, dur: number, delay: number, origin = "center"): CSSProperties => ({
  animation: `${name} ${dur}s ease-in-out ${delay}s infinite`,
  transformBox: "fill-box",
  transformOrigin: origin,
});
/* seamless linear loop (waves) */
const loop2 = (name: string, dur: number): CSSProperties => ({ animation: `${name} ${dur}s linear infinite` });
/* draw a stroke of known length */
const draw = (len: number, dur: number, delay: number): CSSProperties => ({
  strokeDasharray: len,
  strokeDashoffset: 0,
  ["--len" as string]: len,
  animation: `vz-draw ${dur}s ${OUT} ${delay}s both`,
});

const KEYFRAMES = `
@keyframes vz-fade{from{opacity:0}}
@keyframes vz-drop{from{opacity:0;transform:translateY(-26px)}}
@keyframes vz-pop{from{opacity:0;transform:scale(.5)}}
@keyframes vz-grow{from{transform:scaleY(.04)}}
@keyframes vz-draw{from{stroke-dashoffset:var(--len)}}
@keyframes vz-plot{from{clip-path:inset(34% 34% 34% 34% round 6px)}to{clip-path:inset(0 0 0 0 round 6px)}}
@keyframes vz-scan{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes vz-fly{from{transform:translateX(-196px)}}
@keyframes vz-come-go{0%{opacity:0;transform:translateY(-22px)}18%{opacity:1;transform:none}72%{opacity:1;transform:none}100%{opacity:0;transform:translateY(4px)}}
@keyframes vz-show-hide{0%{opacity:0}12%{opacity:1}75%{opacity:1}100%{opacity:0}}
@keyframes vz-rain{from{transform:translateY(-14px);opacity:0}30%{opacity:1}to{transform:translateY(18px);opacity:0}}
@keyframes vz-drip{0%{transform:translateY(-3px);opacity:0}25%{opacity:1}80%{transform:translateY(7px);opacity:1}100%{transform:translateY(8px);opacity:0}}
@keyframes vz-link{from{opacity:.35;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}
@keyframes vz-slide{from{transform:translateX(var(--from))}}
@keyframes vz-ping{0%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(2.6)}}
@keyframes vz-glow{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes vz-rise{from{opacity:0;transform:translateY(14px)}}
@keyframes vz-bob{0%,100%{transform:translateY(0) rotate(-1.4deg)}50%{transform:translateY(2.5px) rotate(1.4deg)}}
@keyframes vz-wave{from{transform:translateX(0)}to{transform:translateX(-40px)}}
@keyframes vz-ring{0%{opacity:.6;transform:scale(.95)}100%{opacity:0;transform:scale(1.35)}}
@keyframes vz-wander{0%,100%{transform:translate(0,0)}50%{transform:translate(var(--dx),var(--dy))}}
@keyframes vz-worm{from{transform:translateX(-18px)}to{transform:translateX(10px)}}
@keyframes vz-squirm{0%,100%{transform:scaleY(1)}50%{transform:scaleY(-1)}}
@keyframes vz-sprout{from{opacity:0;transform:scaleY(.04)}}
@media (prefers-reduced-motion: reduce){.vz *{animation:none!important}}
`;

function Frame({ viewBox = "0 0 240 120", className = "h-32 w-full", children }: { viewBox?: string; className?: string; children: ReactNode }) {
  return (
    <svg viewBox={viewBox} className={`vz ${className}`} aria-hidden>
      <style>{KEYFRAMES}</style>
      {children}
    </svg>
  );
}

/* ------------------------------------------------ 01 · the plot that grows
   The plot opens out from its centre and fills with seedlings from the middle outwards
   as it grows; then the house at its edge lights up (better living conditions). */
function Plot() {
  const rows = [30, 41, 52, 63, 74, 85, 96];
  const cols = Array.from({ length: 12 }, (_, c) => 40 + c * 14);
  return (
    <Frame>
      {/* the plot after the investment */}
      <g style={a("vz-plot", 1.6, 0.2, "center")}>
        <rect x="30" y="22" width="180" height="84" rx="6" fill="rgb(159 211 106 / 0.05)" stroke="rgb(159 211 106 / 0.45)" />
        {rows.map((y, r) => (
          <g key={y}>
            <line x1="36" y1={y} x2="204" y2={y} stroke="rgb(159 211 106 / 0.18)" strokeWidth="1" />
            {cols.map((x, c) => (
              <path
                key={x}
                d={`M${x} ${y} q3 -5 7 -4 q-3 5 -7 4 M${x} ${y} q-3 -4 -6 -3 q3 4 6 3`}
                fill={LIME}
                style={a("vz-pop", 0.45, 0.5 + Math.abs(r - 3) * 0.2 + Math.abs(c - 5.5) * 0.05, "bottom")}
              />
            ))}
          </g>
        ))}
      </g>
      {/* better living conditions: the house at the edge of the field lights up */}
      <g>
        <path d="M218 58 l9 -8 l9 8 v12 h-18 z" fill={INK} stroke={DIM} strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M218 58 l9 -8 l9 8 v12 h-18 z" fill="rgb(159 211 106 / 0.25)" stroke={LIME} strokeWidth="1.2" strokeLinejoin="round" style={a("vz-fade", 0.6, 2.2)} />
        <rect x="224" y="62" width="6" height="8" fill={LIME} style={{ animation: `vz-fade 0.6s ${OUT} 2.4s both, vz-glow 2.4s ease-in-out 3s infinite` }} />
      </g>
    </Frame>
  );
}

/* ------------------------------------------------ 02 · from guesswork to a map */
function PrecisionMap() {
  const COLS = 12;
  const ROWS = 5;
  const bad = { c: 8, r: 2 };
  const shade = (c: number, r: number) => 0.18 + (((c * 7 + r * 13) % 10) / 10) * 0.55;
  const cell = (c: number, r: number) => ({ x: 22 + c * 16.5, y: 26 + r * 16.5 });
  return (
    <Frame>
      {/* before: a field nobody can read */}
      {Array.from({ length: ROWS }, (_, r) =>
        Array.from({ length: COLS }, (_, c) => {
          const { x, y } = cell(c, r);
          return <rect key={`g${r}${c}`} x={x} y={y} width="14" height="14" rx="2" fill="rgb(238 235 227 / 0.06)" />;
        }),
      )}
      {/* after: the drone's pass leaves a crop-health map */}
      <g style={a("vz-scan", 2.4, 0.4, "left", "linear")}>
        {Array.from({ length: ROWS }, (_, r) =>
          Array.from({ length: COLS }, (_, c) => {
            const { x, y } = cell(c, r);
            const isBad = c === bad.c && r === bad.r;
            return <rect key={`m${r}${c}`} x={x} y={y} width="14" height="14" rx="2" fill={isBad ? ORANGE : LIME} opacity={isBad ? 0.9 : shade(c, r)} />;
          }),
        )}
      </g>
      {/* the decision: lock on the problem cell and fix it */}
      {(() => {
        const { x, y } = cell(bad.c, bad.r);
        return (
          <g>
            <g style={a("vz-pop", 0.4, 3.0)}>
              {[
                [x - 4, y - 4, 1, 1],
                [x + 18, y - 4, -1, 1],
                [x - 4, y + 18, 1, -1],
                [x + 18, y + 18, -1, -1],
              ].map(([px, py, sx, sy], k) => (
                <path key={k} d={`M${px} ${py + 5 * sy} V${py} H${px + 5 * sx}`} fill="none" stroke="#eeebe3" strokeWidth="1.5" />
              ))}
            </g>
            <rect x={x} y={y} width="14" height="14" rx="2" fill={LIME} opacity="0.75" style={a("vz-fade", 0.5, 3.7)} />
            <circle cx={x + 7} cy={y + 7} r="7" fill="none" stroke={LIME} style={{ ...loop("vz-ping", 1.8, 4.2), opacity: 0 }} />
          </g>
        );
      })()}
      {/* the drone and its scan beam */}
      <g style={a("vz-fly", 2.4, 0.4, "center", "linear")}>
        <path d="M218 16 l-10 88 h20 z" fill="rgb(159 211 106 / 0.1)" />
        <line x1="210" y1="12" x2="226" y2="12" stroke="#eeebe3" strokeWidth="1.4" />
        <rect x="214" y="10" width="8" height="5" rx="1.5" fill="#eeebe3" />
        <circle cx="209" cy="10" r="2.6" fill="none" stroke="#eeebe3" strokeWidth="1" />
        <circle cx="227" cy="10" r="2.6" fill="none" stroke="#eeebe3" strokeWidth="1" />
        <circle cx="218" cy="17" r="1.2" fill={LIME} />
      </g>
    </Frame>
  );
}

/* ------------------------------------------------ 03 · a polar bear on a floating block of ice
   Seen from behind, sitting still, looking out. The floe bobs on a slow swell. */
/* traced bear */
const BEAR = "M120.48 36.18 C121.39 36.18 122.54 36.40 123.34 36.57 C124.14 36.74 124.88 37.24 125.29 37.22 C125.70 37.20 125.53 36.63 125.81 36.44 C126.09 36.24 126.57 36.03 126.98 36.05 C127.39 36.07 127.95 36.29 128.28 36.57 C128.60 36.85 128.89 37.33 128.93 37.74 C128.97 38.15 128.73 38.67 128.54 39.04 C128.34 39.41 127.80 39.41 127.76 39.95 C127.72 40.49 128.13 40.99 128.28 42.29 C128.43 43.59 128.13 46.08 128.67 47.75 C129.21 49.42 130.73 50.57 131.53 52.3 C132.33 54.03 132.89 55.88 133.48 58.15 C134.06 60.42 134.71 64.26 135.04 65.95 C135.37 67.64 134.91 67.64 135.43 68.29 C135.95 68.94 137.55 69.05 138.16 69.85 C138.77 70.65 138.98 71.73 139.07 73.1 C139.16 74.47 138.51 76.91 138.68 78.04 C138.85 79.17 139.98 79.19 140.11 79.86 C140.24 80.53 140.13 81.46 139.46 82.07 C138.79 82.68 137.08 83.07 136.08 83.5 C135.08 83.93 135.00 84.43 133.48 84.67 C131.96 84.91 128.82 84.80 126.98 84.93 C125.14 85.06 123.73 85.39 122.43 85.45 C121.13 85.52 120.37 85.41 119.18 85.32 C117.99 85.23 117.23 85.04 115.28 84.93 C113.33 84.82 109.26 85.00 107.48 84.67 C105.70 84.34 105.51 83.50 104.62 82.98 C103.73 82.46 102.61 82.11 102.15 81.55 C101.70 80.99 101.72 80.08 101.89 79.6 C102.06 79.12 103.02 79.77 103.19 78.69 C103.36 77.61 102.74 74.57 102.93 73.1 C103.12 71.63 103.67 70.65 104.36 69.85 C105.05 69.05 106.57 69.37 107.09 68.29 C107.61 67.21 107.28 64.87 107.48 63.35 C107.68 61.83 107.72 61.03 108.26 59.19 C108.80 57.35 109.86 54.31 110.73 52.3 C111.60 50.28 112.96 48.98 113.46 47.1 C113.96 45.22 113.78 42.18 113.72 40.99 C113.66 39.80 113.29 40.36 113.07 39.95 C112.85 39.54 112.46 39.00 112.42 38.52 C112.38 38.04 112.55 37.46 112.81 37.09 C113.07 36.72 113.57 36.42 113.98 36.31 C114.39 36.20 114.91 36.29 115.28 36.44 C115.65 36.59 115.76 37.20 116.19 37.22 C116.62 37.24 117.16 36.74 117.88 36.57 C118.59 36.40 119.57 36.18 120.48 36.18 Z";
const BEAR_LINES = "M107.87 68.81 C108.17 69.16 109.15 70.02 109.69 70.89 C110.23 71.76 110.88 73.49 111.12 74.01 M135.04 68.81 C134.54 69.18 132.70 70.15 132.05 71.02 C131.40 71.89 131.29 73.51 131.14 74.01 M105.92 77.91 C106.01 78.34 106.14 79.69 106.44 80.51 C106.74 81.33 107.52 82.46 107.74 82.85 M136.86 77.91 C136.77 78.34 136.58 79.69 136.34 80.51 C136.10 81.33 135.58 82.46 135.43 82.85";
const EARS = "M113.72 38.39 C113.83 38.24 114.09 37.63 114.37 37.48 C114.65 37.33 115.24 37.48 115.41 37.48 M126.33 37.48 C126.50 37.46 127.09 37.22 127.37 37.35 C127.65 37.48 127.91 38.11 128.02 38.26";
const ICE_TOP = "M64.32 82.33 L72.38 79.21 L81.48 77.65 L91.88 75.05 L107.48 74.53 L125.68 74.53 L141.28 75.31 L163.38 76.35 L177.68 81.55 L172.48 89.09 L152.98 91.95 L124.38 94.03 L94.48 91.3 L85.38 88.31 L65.88 84.15 Z";
const ICE_FRONT = "M65.88 84.15 L85.38 88.31 L94.48 91.3 L124.38 94.03 L152.98 91.95 L172.48 89.09 L177.68 81.55 L177.16 88.31 L172.48 96.63 L152.98 101.05 L125.68 103.13 L94.48 100.53 L81.48 97.28 L67.18 94.03 Z";
const ICE_UNDER = "M68.48 94.55 L94.48 101.05 L125.68 103.65 L152.98 101.57 L172.48 97.15 L167.28 103.65 L146.48 107.29 L120.48 108.33 L91.88 106.25 L73.68 101.83 Z";
const ICE_CRACKS = "M76.28 85.45 L77.84 91.69 M108.78 93.51 L109.82 98.45 M143.88 92.73 L142.84 97.93 M167.28 90.13 L166.24 94.81";
function PolarBear() {
  const W = "M0 0 q10 -3 20 0 t20 0 q10 -3 20 0 t20 0 q10 -3 20 0 t20 0 q10 -3 20 0 t20 0 q10 -3 20 0 t20 0 q10 -3 20 0 t20 0 q10 -3 20 0 t20 0 q10 -3 20 0 t20 0";
  return (
    <Frame>
      {/* far horizon */}
      <line x1="0" y1="62" x2="240" y2="62" stroke={FAINT} />
      {/* the floe, the bear and their reflection rock together */}
      <g style={a("vz-rise", 1.1, 0.2)}>
        <g style={loop("vz-bob", 4.2, 1.2, "50% 90%")}>
          {/* submerged part of the ice, seen through the water */}
          <path d={ICE_UNDER} fill="none" stroke="rgb(159 211 106 / 0.18)" strokeDasharray="2 4" />
          {/* the floe, traced from the reference, in line */}
          <path d={ICE_FRONT} fill={INK} stroke="rgb(159 211 106 / 0.6)" strokeWidth="1.1" strokeLinejoin="round" />
          <path d={ICE_TOP} fill="rgb(159 211 106 / 0.08)" stroke={LIME} strokeWidth="1.3" strokeLinejoin="round" />
          <path d={ICE_CRACKS} stroke="rgb(159 211 106 / 0.35)" strokeWidth="0.8" strokeLinecap="round" />
          {/* the bear, from behind: one traced silhouette */}
          <g style={a("vz-fade", 0.8, 0.6)}>
            <path d={BEAR} fill={INK} stroke={LIME} strokeWidth="1.5" strokeLinejoin="round" />
            <path d={BEAR_LINES} fill="none" stroke="rgb(159 211 106 / 0.55)" strokeWidth="1.1" strokeLinecap="round" />
            <path d={EARS} fill="none" stroke="rgb(159 211 106 / 0.45)" strokeWidth="0.9" strokeLinecap="round" />
          </g>
        </g>
      </g>
      {/* the swell: two wave lines drifting, the nearer one faster */}
      <g transform="translate(0 99)">
        <path d={W} fill="none" stroke={LIME} strokeWidth="1.3" strokeLinecap="round" style={loop2("vz-wave", 3.6)} />
      </g>
      <g transform="translate(-12 108)">
        <path d={W} fill="none" stroke="rgb(159 211 106 / 0.45)" strokeWidth="1" strokeLinecap="round" style={loop2("vz-wave", 5.2)} />
      </g>
      <g transform="translate(-24 116)">
        <path d={W} fill="none" stroke="rgb(159 211 106 / 0.2)" strokeWidth="1" strokeLinecap="round" style={loop2("vz-wave", 7)} />
      </g>
      {/* rings where the floe meets the water */}
      <ellipse cx="121" cy="100" rx="60" ry="4.5" fill="none" stroke="rgb(159 211 106 / 0.5)" style={{ ...loop("vz-ring", 3.2, 1.4), opacity: 0 }} />
    </Frame>
  );
}

/* ------------------------------------------------ 04 · the soil being built
   A cross-section: organic layers thicken season by season, a branching root system
   reaches deep and wide, and the soil is alive: mycorrhizal threads pulse between the
   roots, microbes drift, and an earthworm works its way through. */

type Seg = { d: string; depth: number; w: number };

/* deterministic branching roots (no randomness between renders) */
function rootSystem(x0: number, y0: number): Seg[] {
  const segs: Seg[] = [];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const grow = (x: number, y: number, ang: number, len: number, depth: number) => {
    if (depth > 6 || len < 2.5 || y > 102) return;
    const rad = (ang * Math.PI) / 180;
    const x2 = x + Math.cos(rad) * len * (depth === 1 ? 1.35 : 1);
    const x2c = Math.max(16, Math.min(224, x2));
    const y2 = Math.min(110, y + Math.sin(rad) * Math.min(len, (110 - y) / Math.max(0.3, Math.sin(rad))));
    const bend = (rnd() - 0.5) * len * 0.5;
    const mx = (x + x2) / 2 + Math.cos(rad + Math.PI / 2) * bend;
    const my = (y + y2) / 2 + Math.sin(rad + Math.PI / 2) * bend;
    segs.push({ d: `M${x.toFixed(1)} ${y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2c.toFixed(1)} ${y2.toFixed(1)}`, depth, w: Math.max(0.45, 2 - depth * 0.28) });
    const n = depth < 2 ? 3 : 2;
    for (let k = 0; k < n; k++) {
      const spread = depth === 0 ? 50 : depth === 1 ? 34 : 28;
      const off = n === 3 ? (k - 1) * spread : (k === 0 ? -1 : 1) * spread * (0.6 + rnd() * 0.5);
      grow(x2c, y2, ang + off + (rnd() - 0.5) * 14, len * (0.74 + rnd() * 0.12), depth + 1);
    }
  };
  grow(x0, y0, 90, 20, 0);
  // a second, deeper taproot pulse so the system reaches the bottom of the section
  grow(x0, y0 + 20, 92, 24, 1);
  return segs;
}

function SoilBase() {
  const G = 34;
  const roots = rootSystem(120, G);
  const microbes = Array.from({ length: 26 }, (_, k) => ({
    x: 22 + ((k * 53) % 196),
    y: G + 10 + ((k * 29) % 66),
    dx: `${((k * 7) % 9) - 4}px`,
    dy: `${((k * 5) % 7) - 3}px`,
    dur: 4 + ((k * 3) % 5),
    rod: k % 3 === 0,
    rot: (k * 47) % 180,
  }));
  return (
    <Frame>
      {/* soil section */}
      <rect x="12" y={G} width="216" height={116 - G} rx="4" fill="rgb(238 235 227 / 0.03)" />
      {/* organic matter: one layer per season, the base thickens downwards */}
      {[0, 1, 2].map((k) => (
        <rect key={k} x="12" y={G + k * 11} width="216" height="11" fill={LIME} opacity={0.2 - k * 0.05} style={a("vz-grow", 0.7, 0.4 + k * 0.9, "top")} />
      ))}
      <line x1="12" y1={G} x2="228" y2={G} stroke="rgb(159 211 106 / 0.5)" />

      {/* mycorrhizal threads between the roots, pulsing */}
      <g style={a("vz-fade", 1, 3.2)}>
        <path
          d={`M40 ${G + 40} C60 ${G + 34} 78 ${G + 50} 98 ${G + 44} M142 ${G + 46} C162 ${G + 38} 182 ${G + 56} 204 ${G + 48} M70 ${G + 64} C90 ${G + 70} 104 ${G + 60} 116 ${G + 68} M126 ${G + 70} C146 ${G + 62} 160 ${G + 76} 180 ${G + 70}`}
          fill="none"
          stroke="rgb(238 235 227 / 0.35)"
          strokeWidth="0.7"
          strokeDasharray="1.5 2.5"
          style={loop("vz-glow", 3, 4)}
        />
      </g>

      {/* roots: a taproot and laterals, drawn outwards and downwards */}
      {roots.map((r, k) => (
        <path key={k} d={r.d} pathLength={1} fill="none" stroke={LIME} strokeWidth={r.w} strokeLinecap="butt" opacity={1 - r.depth * 0.09} style={draw(1, 0.55, 0.4 + r.depth * 0.38 + (k % 5) * 0.03)} />
      ))}

      {/* life in the soil: microbes drifting */}
      {microbes.map((m, k) => (
        <g key={k} style={a("vz-fade", 0.6, 1.2 + (k % 8) * 0.12)}>
          <g style={{ animation: `vz-wander ${m.dur}s ease-in-out ${-k * 0.37}s infinite`, ["--dx" as string]: m.dx, ["--dy" as string]: m.dy }}>
            {m.rod ? (
              <rect x={m.x - 2} y={m.y - 0.8} width="4" height="1.6" rx="0.8" fill="rgb(238 235 227 / 0.55)" transform={`rotate(${m.rot} ${m.x} ${m.y})`} />
            ) : (
              <circle cx={m.x} cy={m.y} r={k % 4 === 0 ? 1.4 : 0.9} fill={k % 5 === 0 ? LIME : "rgb(238 235 227 / 0.45)"} />
            )}
          </g>
        </g>
      ))}

      {/* an earthworm working through the lower soil */}
      <g style={a("vz-fade", 0.6, 1.6)}>
        <g style={{ animation: "vz-worm 7s ease-in-out 1.6s infinite alternate" }}>
          <path d={`M152 ${G + 66} q4 -3 8 0 t8 0 t8 0 t8 0`} fill="none" stroke="rgb(242 112 58 / 0.75)" strokeWidth="2.2" strokeLinecap="round" style={loop("vz-squirm", 1.4, 1.6)} />
        </g>
      </g>

      {/* the plant above, and cover crop between rows */}
      <path d={`M120 ${G} V${G - 18}`} stroke={LIME} strokeWidth="1.6" />
      <path d={`M120 ${G - 10} q-14 -4 -18 -14 q14 0 18 14 M120 ${G - 14} q12 -6 16 -16 q-14 2 -16 16`} fill="rgb(159 211 106 / 0.35)" stroke={LIME} strokeWidth="1" />
      {[34, 58, 182, 206].map((x, k) => (
        <path key={x} d={`M${x} ${G} q2 -6 6 -7 M${x} ${G} q-2 -5 -6 -6`} stroke="rgb(159 211 106 / 0.6)" strokeWidth="1" fill="none" style={a("vz-pop", 0.4, 1.2 + k * 0.4, "bottom")} />
      ))}
    </Frame>
  );
}

/* ------------------------------------------------ 05 · links that articulate
   Five loose links (campo, empaque, frío, transporte, mercado) swing in and interlock
   into one real chain: links alternate face-on and edge-on, each edge link passing
   through its neighbours, and each stage lights up as its link locks in. */
function ChainLinks() {
  const STEP = 38;
  const X0 = 44; // chain spans 20…220: centred in the 240 panel
  const Y = 77;
  const stages = [
    { Icon: Sprout, dx: "-20px", dy: "24px", r: "-28deg" },
    { Icon: Package, dx: "8px", dy: "-28px", r: "22deg" },
    { Icon: Snowflake, dx: "-12px", dy: "30px", r: "34deg" },
    { Icon: Truck, dx: "16px", dy: "-24px", r: "-18deg" },
    { Icon: Store, dx: "24px", dy: "22px", r: "26deg" },
  ];
  const join = (k: number) => 0.25 + k * 0.24; // when link k locks in
  return (
    <Frame>
      {/* the links: face-on ones first, edge-on ones pass over them */}
      {[0, 2, 4, 1, 3].map((k) => {
        const cx = X0 + k * STEP;
        const face = k % 2 === 0;
        const { Icon, dx, dy, r } = stages[k];
        return (
          <g key={k} style={{ ...a("vz-link", 0.8, join(k)), ["--dx" as string]: dx, ["--dy" as string]: dy, ["--r" as string]: r }}>
            {face ? (
              <>
                <rect x={cx - 24} y={Y - 13} width="48" height="26" rx="13" fill="none" stroke={DIM} strokeWidth="4" />
                <g style={a("vz-fade", 0.4, join(k) + 0.6)}>
                  <rect x={cx - 24} y={Y - 13} width="48" height="26" rx="13" fill="none" stroke={LIME} strokeWidth="1.5" />
                  <rect x={cx - 19} y={Y - 8} width="38" height="16" rx="8" fill="none" stroke="rgb(159 211 106 / 0.45)" strokeWidth="1" />
                </g>
              </>
            ) : (
              <>
                <rect x={cx - 26} y={Y - 4} width="52" height="8" rx="4" fill={INK} stroke={DIM} strokeWidth="2" />
                <g style={a("vz-fade", 0.4, join(k) + 0.6)}>
                  <rect x={cx - 26} y={Y - 4} width="52" height="8" rx="4" fill={INK} stroke={LIME} strokeWidth="1.5" />
                  <line x1={cx - 20} y1={Y} x2={cx + 20} y2={Y} stroke="rgb(159 211 106 / 0.45)" strokeWidth="1" />
                </g>
              </>
            )}
            {/* the stage this link stands for, hanging above it */}
            <g style={a("vz-pop", 0.4, join(k) + 0.7, "bottom")}>
              <line x1={cx} y1={face ? Y - 13 : Y - 4} x2={cx} y2="48" stroke="rgb(159 211 106 / 0.4)" strokeWidth="1" strokeDasharray="1.5 2" />
              <circle cx={cx} cy="39" r="10" fill={INK} stroke={LIME} strokeWidth="1.2" />
              <Icon x={cx - 6} y={33} width={12} height={12} color={LIME} strokeWidth={1.7} />
            </g>
          </g>
        );
      })}

    </Frame>
  );
}

/* ------------------------------------------------ 06 · producing pays off
   Three stacks of coins rise, each taller than the last: the field becomes profitable.
   A plant grows on the tallest stack, then a young sprout appears on the one beside it:
   the next generation takes over. */
function CoinStacks() {
  const G = 104; // table line
  const stacks = [
    { x: 70, n: 3 },
    { x: 120, n: 5 },
    { x: 170, n: 8 },
  ];
  const H = 6.2; // coin thickness
  const coin = (x: number, y: number) => (
    <>
      <path d={`M${x - 17} ${y} v-${H - 1.5} a17 5 0 0 1 34 0 v${H - 1.5} a17 5 0 0 1 -34 0 z`} fill={INK} stroke={LIME} strokeWidth="1.2" strokeLinejoin="round" />
      <ellipse cx={x} cy={y - H + 1.5} rx="17" ry="5" fill="rgb(159 211 106 / 0.14)" stroke={LIME} strokeWidth="1.2" />
    </>
  );
  let t = 0.2;
  const top = (s: { x: number; n: number }) => G - s.n * H + 1.5;
  return (
    <Frame>
      <line x1="30" y1={G + 3} x2="210" y2={G + 3} stroke={DIM} />
      {stacks.map((s, si) =>
        Array.from({ length: s.n }, (_, k) => {
          const d = t;
          t += 0.09;
          return (
            <g key={`${si}-${k}`} style={a("vz-drop", 0.45, d)}>
              {coin(s.x, G - k * H)}
            </g>
          );
        }),
      )}
      {/* a grown plant on the tallest stack */}
      {(() => {
        const x = stacks[2].x;
        const y = top(stacks[2]) - 2;
        return (
          <g>
            <path d={`M${x} ${y} V${y - 26}`} stroke={LIME} strokeWidth="1.8" style={a("vz-sprout", 0.7, t + 0.1, "bottom")} />
            <path
              d={`M${x} ${y - 12} q-15 -4 -19 -16 q15 1 19 16 M${x} ${y - 18} q13 -7 17 -19 q-15 4 -17 19`}
              fill="rgb(159 211 106 / 0.3)"
              stroke={LIME}
              strokeWidth="1.2"
              style={a("vz-pop", 0.5, t + 0.6, "bottom")}
            />
          </g>
        );
      })()}
      {/* and a young sprout on the stack beside it: the next generation */}
      {(() => {
        const x = stacks[1].x;
        const y = top(stacks[1]) - 2;
        return (
          <g style={a("vz-pop", 0.5, t + 1.3, "bottom")}>
            <path d={`M${x} ${y} V${y - 11}`} stroke={LIME} strokeWidth="1.5" />
            <path d={`M${x} ${y - 8} q-8 -2 -10 -9 q8 1 10 9 M${x} ${y - 10} q7 -4 9 -10 q-8 2 -9 10`} fill="rgb(159 211 106 / 0.3)" stroke={LIME} strokeWidth="1.1" />
            <circle cx={x} cy={y - 6} r="10" fill="none" stroke={LIME} style={{ ...loop("vz-ping", 2.2, t + 1.9), opacity: 0 }} />
          </g>
        );
      })()}
    </Frame>
  );
}

export function ImpactVisual({ i }: { i: number }) {
  switch (i) {
    case 0:
      return <Plot />;
    case 1:
      return <PrecisionMap />;
    case 2:
      return <PolarBear />;
    case 3:
      return <SoilBase />;
    case 4:
      return <ChainLinks />;
    default:
      return <CoinStacks />;
  }
}

"use client";

import { useRef } from "react";
import { useInView } from "motion/react";
import { cn } from "@/lib/utils";

/* The footer as the deepest layer of soil under the whole page: roots come down from
   above, the ground keeps darkening, and it's alive — microbes drift, fungal
   threads pulse between the roots, an earthworm crosses now and then. Background only:
   low contrast, behind the content, running only while on screen; reduced motion shows
   a still picture. Same line language as impact card 04. Wide and tall layouts get their
   own composition, since the phone footer is narrow and three times taller. */

const LIME = "#9fd36a";

type Seg = { d: string; depth: number; w: number };
type RootSpec = { x: number; seed: number; len: number; depth: number };
type Layout = {
  id: string;
  w: number;
  h: number;
  roots: RootSpec[];
  hyphae: string[];
  microbes: number;
  wormY: number;
};

/* deterministic branching root, drawn from the top edge downwards */
function root(
  { x, seed: s0, len, depth: maxDepth }: RootSpec,
  h: number,
): Seg[] {
  const segs: Seg[] = [];
  let seed = s0;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const grow = (
    x0: number,
    y: number,
    ang: number,
    l: number,
    depth: number,
  ) => {
    if (depth > maxDepth || l < 4 || y > h - 40) return;
    const rad = (ang * Math.PI) / 180;
    const x2 = x0 + Math.cos(rad) * l;
    const y2 = Math.min(h - 30, y + Math.sin(rad) * l);
    const bend = (rnd() - 0.5) * l * 0.45;
    const mx = (x0 + x2) / 2 + Math.cos(rad + Math.PI / 2) * bend;
    const my = (y + y2) / 2 + Math.sin(rad + Math.PI / 2) * bend;
    segs.push({
      d: `M${x0.toFixed(1)} ${y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`,
      depth,
      w: Math.max(0.5, 1.8 - depth * 0.25),
    });
    const n = depth < 2 ? 3 : 2;
    for (let k = 0; k < n; k++) {
      const spread = depth === 0 ? 34 : 26;
      const off =
        n === 3
          ? (k - 1) * spread
          : (k === 0 ? -1 : 1) * spread * (0.6 + rnd() * 0.5);
      grow(
        x2,
        y2,
        ang + off + (rnd() - 0.5) * 14,
        l * (0.72 + rnd() * 0.12),
        depth + 1,
      );
    }
  };
  grow(x, -4, 90, len, 0);
  return segs;
}

const WIDE: Layout = {
  id: "w",
  w: 1440,
  h: 620,
  roots: [
    { x: 150, seed: 3, len: 70, depth: 5 },
    { x: 470, seed: 11, len: 90, depth: 6 },
    { x: 820, seed: 7, len: 60, depth: 5 },
    { x: 1130, seed: 19, len: 95, depth: 6 },
    { x: 1360, seed: 5, len: 55, depth: 4 },
  ],
  hyphae: [
    "M60 250 C160 230 250 290 360 260 S540 240 640 280",
    "M700 330 C790 300 900 360 1010 320 S1180 300 1300 340",
    "M240 420 C330 440 430 400 540 430",
    "M880 470 C980 450 1080 500 1200 470 S1360 460 1420 490",
  ],
  microbes: 40,
  wormY: 550,
};
const TALL: Layout = {
  id: "t",
  w: 400,
  h: 1000,
  roots: [
    { x: 70, seed: 11, len: 130, depth: 6 },
    { x: 250, seed: 19, len: 160, depth: 6 },
    { x: 370, seed: 7, len: 110, depth: 5 },
  ],
  hyphae: [
    "M20 300 C90 280 150 330 230 300 S340 290 390 320",
    "M40 560 C120 590 200 540 300 570 S370 560 395 580",
    "M10 800 C90 780 170 830 260 800",
  ],
  microbes: 22,
  wormY: 930,
};

function Scene({ L, className }: { L: Layout; className?: string }) {
  const { id, w, h } = L;
  const roots = L.roots.map((r) => root(r, h));
  const microbes = Array.from({ length: L.microbes }, (_, k) => ({
    x: 14 + ((k * 211) % (w - 28)),
    y: 80 + ((k * 97) % (h - 120)),
    dx: `${(((k * 7) % 13) - 6) * 1.2}px`,
    dy: `${(((k * 5) % 9) - 4) * 1.2}px`,
    dur: 6 + ((k * 3) % 6),
    rod: k % 3 === 0,
    lime: k % 7 === 0,
    rot: (k * 47) % 180,
  }));
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMin slice"
      className={cn("absolute inset-0 size-full", className)}
    >
      <defs>
        <pattern
          id={`soil-grain-${id}`}
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="3" cy="4" r="0.7" fill="rgb(238 235 227 / 0.06)" />
          <circle cx="10" cy="9" r="0.5" fill="rgb(238 235 227 / 0.05)" />
          <circle cx="7" cy="12" r="0.6" fill="rgb(159 211 106 / 0.05)" />
        </pattern>
        <linearGradient id={`soil-fade-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#020403" stopOpacity="0" />
          <stop offset="1" stopColor="#020403" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {/* the page background already darkens into the soil; only grain here, no bands,
          so there's no step where the footer starts */}
      <rect width={w} height={h} fill={`url(#soil-grain-${id})`} />
      <rect width={w} height={h} fill={`url(#soil-fade-${id})`} />

      {/* fungal threads between the roots */}
      {L.hyphae.map((d, k) => (
        <path
          key={k}
          d={d}
          fill="none"
          stroke="rgb(238 235 227 / 0.12)"
          strokeWidth="0.8"
          strokeDasharray="2 4"
          style={{
            animation: `soil-glow ${4 + k}s ease-in-out ${k * 0.7}s infinite`,
          }}
        />
      ))}

      {/* roots coming down from everything above */}
      {roots.map((segs, r) => (
        <g key={r}>
          {segs.map((s, k) => (
            <path
              key={k}
              d={s.d}
              pathLength={1}
              fill="none"
              stroke={LIME}
              strokeWidth={s.w}
              strokeLinecap="round"
              opacity={0.17 - s.depth * 0.018}
              className="rt"
              style={{ transitionDelay: `${s.depth * 0.22}s` }}
            />
          ))}
        </g>
      ))}

      {/* microbes drifting */}
      {microbes.map((m, k) => (
        <g
          key={k}
          style={{
            ["--dx" as string]: m.dx,
            ["--dy" as string]: m.dy,
            animation: `soil-wander ${m.dur}s ease-in-out ${-k * 0.41}s infinite`,
          }}
        >
          {m.rod ? (
            <rect
              x={m.x - 2.5}
              y={m.y - 1}
              width="5"
              height="2"
              rx="1"
              fill="rgb(238 235 227 / 0.15)"
              transform={`rotate(${m.rot} ${m.x} ${m.y})`}
            />
          ) : (
            <circle
              cx={m.x}
              cy={m.y}
              r={k % 4 === 0 ? 1.6 : 1.1}
              fill={
                m.lime ? "rgb(159 211 106 / 0.28)" : "rgb(238 235 227 / 0.14)"
              }
            />
          )}
        </g>
      ))}

      {/* an earthworm crossing the deep soil, now and then */}
      <g
        style={{
          ["--to" as string]: `${w + 160}px`,
          animation: `soil-worm ${id === "w" ? 70 : 36}s linear 3s infinite`,
        }}
      >
        <path
          d={`M0 ${L.wormY} q6 -4 12 0 t12 0 t12 0 t12 0 t12 0`}
          fill="none"
          stroke="rgb(242 112 58 / 0.24)"
          strokeWidth="2.4"
          strokeLinecap="round"
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
            animation: "soil-squirm 1.4s ease-in-out infinite",
          }}
        />
      </g>
    </svg>
  );
}

export function FooterSoil() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.05 });
  const seen = useInView(ref, { amount: 0.15, once: true });

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "soil pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        !inView && "soil-paused",
        seen && "soil-seen",
      )}
    >
      <style>{`
        .soil-paused *{animation-play-state:paused!important}
        .soil .rt{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 2.4s cubic-bezier(0.23,1,0.32,1)}
        .soil-seen .rt{stroke-dashoffset:0}
        @keyframes soil-wander{0%,100%{transform:translate(0,0)}33%{transform:translate(var(--dx),calc(var(--dy) * -0.6))}66%{transform:translate(calc(var(--dx) * -0.5),var(--dy))}}
        @keyframes soil-glow{0%,100%{opacity:.45}50%{opacity:.7}}
        @keyframes soil-worm{0%{transform:translateX(-160px)}100%{transform:translateX(var(--to))}}
        @keyframes soil-squirm{0%,100%{transform:scaleY(1)}50%{transform:scaleY(-1)}}
        @media (prefers-reduced-motion: reduce){
          .soil *{animation:none!important}
          .soil .rt{transition:none;stroke-dashoffset:0}
        }
      `}</style>
      <Scene L={WIDE} className="max-sm:hidden" />
      <Scene L={TALL} className="sm:hidden" />
    </div>
  );
}

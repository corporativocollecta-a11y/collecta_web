"use client";

import Image from "next/image";
import { AnimatePresence, animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/lang-provider";
import type { Copy } from "@/lib/i18n";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const STAGE_MS = 3400;

/* Sample lot data (BRC-2291) — replace with the real passport fields. `a` is the mark's angle on the
   arc in degrees, counter-clockwise from 3 o'clock: the journey reads left to right like the sun. */
const STAGE_DATA = [
  { n: "01", a: 160, value: "P-07", unit: "" },
  { n: "02", a: 120, value: "06:40", unit: "" },
  { n: "03", a: 60, value: "1", unit: "°C" },
  { n: "04", a: 20, value: "36", unit: "h" },
];
const ROUTE = 2; // in transit: the stage that cools the scene

/* one entry per STAGE_DATA slot, same order */
const T: Copy<{ badge: string; alt: string; passport: string; stages: { label: string; caption: string }[] }> = {
  en: {
    badge: "LOT BRC-2291 · BROCCOLI",
    alt: "A furrow of broccoli in a Puebla field under a cloudy sky",
    passport: "Lot passport",
    stages: [
      { label: "Origin", caption: "Plot · Puebla, MX" },
      { label: "Cut", caption: "Harvested Sep 12" },
      { label: "Route", caption: "Constant temperature" },
      { label: "Destination", caption: "From cut to Reynosa, Tamps." },
    ],
  },
  es: {
    badge: "LOTE BRC-2291 · BRÓCOLI",
    alt: "Surco de brócoli en un campo de Puebla bajo un cielo con nubes",
    passport: "Pasaporte del lote",
    stages: [
      { label: "Origen", caption: "Parcela · Puebla, MX" },
      { label: "Corte", caption: "Cosechado el 12 sep" },
      { label: "Ruta", caption: "Temperatura constante" },
      { label: "Destino", caption: "Del corte a Reynosa, Tamps." },
    ],
  },
};

// arc geometry in the SVG's 200 × 100 box: centre at the bottom middle
const CX = 100;
const CY = 100;
const R = 78;
const at = (deg: number, r = R) => {
  const t = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(t), y: CY - r * Math.sin(t) };
};

export function LotOdometer() {
  const t = T[useLang()];
  const STAGES = STAGE_DATA.map((d, i) => ({ ...d, ...t.stages[i] }));
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.35 });
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!inView || !auto) return;
    const id = window.setInterval(() => setStage((s) => (s + 1) % STAGE_DATA.length), STAGE_MS);
    return () => window.clearInterval(id);
  }, [inView, auto]);

  const s = STAGES[stage];
  const sweep = 180 - s.a; // degrees travelled from the arc's start at 9 o'clock

  // the dot follows the arc itself (not a chord): tween the angle, derive the position
  const angle = useMotionValue(STAGE_DATA[0].a);
  const dotX = useTransform(angle, (d) => at(d).x);
  const dotY = useTransform(angle, (d) => at(d).y);
  useEffect(() => {
    const c = animate(angle, s.a, reduce ? { duration: 0 } : { duration: 0.7, ease: EASE_OUT });
    return () => c.stop();
  }, [angle, s.a, reduce]);
  const arcStart = at(180);
  const arcEnd = at(0);

  return (
    <div ref={rootRef}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl sm:aspect-[4/3] border border-(--line) bg-[#040806]">
        <Image
          src="/images/ecosistema/surco-brocoli.jpg"
          alt={t.alt}
          fill
          sizes="(min-width: 1024px) 56vw, 100vw"
          className="object-cover object-[50%_60%] sm:object-[50%_18%]"
        />
        {/* in transit the lot rides in the reefer: the scene cools */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[#6fa3d8] mix-blend-soft-light"
          initial={false}
          animate={{ opacity: stage === ROUTE ? 0.55 : 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#040806]/75 to-transparent" />

        <p className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-white/15 bg-[#0b120d]/45 px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] text-foreground/85 backdrop-blur-md sm:top-5 sm:left-5">
          <span className="live-dot" aria-hidden />
          {t.badge}
        </p>

        {/* the dome */}
        <div className="absolute inset-x-[3%] bottom-0 aspect-[2/1] sm:inset-x-[11%] overflow-hidden rounded-t-full border-x border-t border-white/15 bg-[#0b120d]/35 backdrop-blur-[3px]">
          <svg viewBox="0 0 200 100" className="absolute inset-0 size-full" aria-hidden>
            <path
              d={`M${arcStart.x},${arcStart.y} A${R},${R} 0 0 1 ${arcEnd.x},${arcEnd.y}`}
              fill="none"
              stroke="rgb(238 235 227 / 0.45)"
              strokeWidth="0.6"
              strokeDasharray="2.2 2.2"
            />
            {/* travelled part of the journey, solid */}
            <motion.path
              d={`M${arcStart.x},${arcStart.y} A${R},${R} 0 0 1 ${arcEnd.x},${arcEnd.y}`}
              fill="none"
              stroke="#9fd36a"
              strokeWidth="0.9"
              strokeLinecap="round"
              initial={false}
              animate={{ pathLength: sweep / 180 }}
              transition={{ duration: reduce ? 0 : 0.7, ease: EASE_OUT }}
            />
            {STAGES.map((m, k) => {
              const p = at(m.a);
              const l = at(m.a, R - 12);
              const reached = k <= stage;
              return (
                <g key={m.n}>
                  <circle cx={p.x} cy={p.y} r="1.5" fill={reached ? "#9fd36a" : "#0b120d"} stroke={reached ? "#9fd36a" : "rgb(238 235 227 / 0.6)"} strokeWidth="0.5" />
                  <text
                    x={l.x}
                    y={l.y}
                    textAnchor={m.a > 90 ? "start" : "end"}
                    dominantBaseline="middle"
                    className="hidden font-mono text-[4.6px] sm:inline"
                    letterSpacing="0.4"
                    fill={k === stage ? "#eeebe3" : "rgb(238 235 227 / 0.55)"}
                  >
                    {m.label.toUpperCase()}
                  </text>
                </g>
              );
            })}
            <motion.circle cx={dotX} cy={dotY} r="5.5" fill="#9fd36a" opacity="0.18" />
            <motion.circle cx={dotX} cy={dotY} r="3" fill="#eeebe3" />
          </svg>

          {/* the marks are the controls: 44px targets over each dot */}
          <ol aria-label={t.passport}>
            {STAGES.map((m, k) => {
              const p = at(m.a);
              return (
                <li key={m.n} className="absolute size-11 -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x / 2}%`, top: `${p.y}%` }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAuto(false);
                      setStage(k);
                    }}
                    aria-current={stage === k ? "step" : undefined}
                    aria-label={`${m.label}: ${m.value}${m.unit}, ${m.caption}`}
                    className="press size-full cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-primary"
                  />
                </li>
              );
            })}
          </ol>

          {/* centre readout */}
          <div className="pointer-events-none absolute inset-x-0 bottom-[14%] flex flex-col items-center text-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={s.n}
                initial={{ opacity: 0, transform: reduce ? "none" : "translateY(8px)" }}
                animate={{ opacity: 1, transform: "translateY(0px)" }}
                exit={{ opacity: 0, transform: reduce ? "none" : "translateY(-6px)" }}
                transition={{ duration: 0.26, ease: EASE_OUT }}
                className="flex flex-col items-center"
              >
                <span className="font-mono text-[9px] tracking-[0.18em] text-foreground/60 sm:text-[10px]">
                  <span className="text-primary uppercase sm:hidden">{s.label} · </span>
                  {s.n} / 04
                </span>
                <span className="mt-1 text-3xl leading-none font-light tracking-[-0.03em] tabular-nums sm:text-5xl">
                  {s.value}
                  {s.unit && <span className="ml-0.5 align-top text-lg text-foreground/70 sm:text-2xl">{s.unit}</span>}
                </span>
                <span className="mt-2 font-mono text-[9px] tracking-[0.14em] text-foreground/70 uppercase sm:text-[10px]">{s.caption}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {auto ? "" : `${s.label}: ${s.value}${s.unit}, ${s.caption}`}
      </p>
    </div>
  );
}

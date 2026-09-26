"use client";

import Image from "next/image";
import { PackageCheck, Scissors, Sprout, Store, type LucideIcon } from "lucide-react";
import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/lang-provider";
import type { Copy } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion";

/* Panel 04 — "Modelo Vertical". "Sin intermediarios, sin fragmentación", acted out:
   1. the chain is three loose, misaligned stretches in three different hands, and the lot's
      data is lost at every handoff ("—" over each station);
   2. each stretch welds into place and its owner drops out;
   3. the lot runs the single line and, station by station, the data from panels 01–03 arrives
      intact: one hand, nothing lost. One clock `t`, replayed each time the panel is seen. */

const STATIONS: { id: string; t: Copy<string>; Icon: LucideIcon; data: Copy<string> }[] = [
  { id: "plant", t: { en: "Planting", es: "Siembra" }, Icon: Sprout, data: { en: "P-07 · Puebla", es: "P-07 · Puebla" } },
  { id: "harvest", t: { en: "Harvest", es: "Cosecha" }, Icon: Scissors, data: { en: "Cut 06:40", es: "Corte 06:40" } },
  { id: "pack", t: { en: "Packing", es: "Empaque" }, Icon: PackageCheck, data: { en: "22 ct · 1 °C", es: "22 ct · 1 °C" } },
  { id: "sale", t: { en: "Sale", es: "Venta" }, Icon: Store, data: { en: "Via Reynosa", es: "Vía Reynosa" } },
];
// the hands a fragmented chain passes through, one per stretch
const HANDS: { id: string; t: Copy<string>; dy: number; tilt: number }[] = [
  { id: "aggregator", t: { en: "Aggregator", es: "Acopiador" }, dy: -16, tilt: -5 },
  { id: "broker", t: { en: "Broker", es: "Broker" }, dy: 14, tilt: 4 },
  { id: "carrier", t: { en: "Carrier", es: "Transportista" }, dy: -11, tilt: -3 },
];

const T: Copy<{
  chain: string;
  whole: string;
  handoffs: (n: number) => string;
  noData: string;
  stats: [string, string, string];
  owner: string;
}> = {
  en: {
    chain: "CHAIN · ",
    whole: "One single line",
    handoffs: (n) => `${n} handoff${n === 1 ? "" : "s"}`,
    noData: "no data",
    stats: ["Middlemen", "Handoffs", "Operators"],
    owner: "One party accountable, from planting to sale",
  },
  es: {
    chain: "CADENA · ",
    whole: "Una sola línea",
    handoffs: (n) => `${n} traspaso${n === 1 ? "" : "s"}`,
    noData: "sin dato",
    stats: ["Intermediarios", "Traspasos", "Operadores"],
    owner: "Un solo responsable, de la siembra a la venta",
  },
};

const HOLD = 900; // the broken chain is read first
const WELD_GAP = 450;
const WELD = 380;
const WELDED_AT = HOLD + (HANDS.length - 1) * WELD_GAP + WELD;
const RUN_AT = WELDED_AT + 250;
const RUN = 1800;
const DONE_AT = RUN_AT + RUN + 150;
const END = DONE_AT + 500;

const X = (k: number) => 12.5 + k * 75; // % across the track for 0..1
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export function OneLine() {
  const lang = useLang();
  const tx = T[lang];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.6 });
  const reduce = useReducedMotionSafe();
  const [clock, setClock] = useState(0);
  const t = reduce ? END : clock;

  useEffect(() => {
    if (reduce || !inView) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const e = now - t0;
      setClock(Math.min(e, END));
      if (e < END) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce]);

  const weld = HANDS.map((_, i) => easeOut(clamp((t - HOLD - i * WELD_GAP) / WELD)));
  const welded = weld.filter((w) => w === 1).length;
  const whole = welded === HANDS.length;
  const run = easeInOut(clamp((t - RUN_AT) / RUN));
  const running = t >= RUN_AT && t < DONE_AT;
  const done = t >= DONE_AT;
  const hands = HANDS.length - welded;

  return (
    <div ref={ref} className="rounded-2xl bg-[#0b120d] p-5 font-mono text-xs text-foreground shadow-[0_24px_48px_-24px_rgb(11_18_13/0.7)] sm:p-6">
      <div className="flex items-center justify-between border-b border-(--line) pb-3">
        <span className="text-foreground/60">
          <span className="hidden sm:inline">{tx.chain}</span>
          <span className="text-foreground">BRC-2291</span>
        </span>
        <span
          className={cn(
            "flex items-center gap-2 rounded-full border px-2.5 py-1 transition-colors duration-200 ease-(--ease-out)",
            whole ? "border-primary/40 text-primary" : "border-signal/40 text-signal",
          )}
        >
          <span className={cn("size-1.5 rounded-full", whole ? "bg-primary" : "animate-pulse bg-signal")} aria-hidden />
          {whole ? tx.whole : tx.handoffs(hands)}
        </span>
      </div>

      <div className="relative mt-5">
        {/* the track */}
        <div className="relative h-20">
          {HANDS.map((h, i) => {
            const w = weld[i];
            return (
              <div key={h.id} className="absolute top-1/2" style={{ left: `${X(i / 3)}%`, width: "25%" }}>
                {/* owner tag rides its stretch until the stretch welds */}
                <span
                  className="absolute left-1/2 rounded-full border border-signal/50 bg-[#1a120c] px-2.5 py-1 text-[11px] whitespace-nowrap text-signal"
                  style={{
                    top: `${h.dy + (h.dy < 0 ? -30 : 10)}px`,
                    opacity: 1 - w,
                    transform: `translate(-50%, ${(h.dy < 0 ? -1 : 1) * w * 10}px)`,
                  }}
                >
                  {h.t[lang]}
                </span>
                {/* the stretch: short, tilted, off-line, broken — then flush and full */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 h-1 -translate-y-1/2 rounded-full"
                  style={{
                    background:
                      w === 1
                        ? "rgb(159 211 106 / 0.35)"
                        : `repeating-linear-gradient(90deg, #f2703a 0 10px, transparent 10px 16px)`,
                    opacity: w === 1 ? 1 : 0.55 + w * 0.45,
                    transform: `translateY(${(1 - w) * h.dy}px) rotate(${(1 - w) * h.tilt}deg) scaleX(${0.58 + w * 0.42})`,
                  }}
                />
                {/* weld: a ring expands from the joint as the stretch snaps in */}
                <span
                  aria-hidden
                  className="absolute right-0 size-8 rounded-full border-2 border-primary"
                  style={{
                    top: 0,
                    opacity: w > 0.55 && w < 1 ? 1 - (w - 0.55) / 0.45 : 0,
                    transform: `translate(50%, -50%) scale(${0.95 + (w > 0.55 ? (w - 0.55) * 2.4 : 0)})`,
                  }}
                />
              </div>
            );
          })}

          {/* the single line lights up behind the lot as it runs */}
          <span
            aria-hidden
            className="absolute top-1/2 h-1 origin-left -translate-y-1/2 rounded-full bg-primary shadow-[0_0_12px_rgb(159_211_106/0.55)]"
            style={{ left: "12.5%", width: "75%", transform: `translateY(-50%) scaleX(${done ? 1 : run})` }}
          />

          {STATIONS.map(({ id, Icon }, i) => {
            const at = i / 3;
            const lit = done || (t >= RUN_AT && run >= at - 0.001);
            // a break mark sits on each interior joint while the chain is in pieces
            const broken = i > 0 && i < 3 && weld[i - 1] < 1;
            return (
              <div key={id} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${X(at)}%` }}>
                <span
                  className={cn(
                    "relative grid size-11 place-items-center rounded-full border-2 transition-colors duration-200 ease-(--ease-out)",
                    lit ? "border-primary bg-primary text-primary-foreground" : broken ? "border-signal/60 bg-[#0b120d] text-signal" : "border-foreground/25 bg-[#0b120d] text-foreground/60",
                  )}
                >
                  <Icon className="size-[18px]" aria-hidden />
                </span>
              </div>
            );
          })}

          {/* the lot itself */}
          {/* a full-width layer slides by transform (no layout per frame); the tag sits on its left edge */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10"
            style={{ transform: `translateX(${X(run).toFixed(2)}%)`, opacity: running ? 1 : 0, transition: "opacity 200ms" }}
          >
            <span className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#eeebe3] px-2 py-0.5 text-[10px] font-medium text-[#0b120d] shadow-[0_0_16px_4px_rgb(159_211_106/0.5)]">
              BRC-2291
            </span>
          </span>
        </div>
      </div>

      {/* one column per station: its name, then the data the lot carries through it */}
      <div className="mt-1 grid grid-cols-4 gap-1.5 text-center">
        {STATIONS.map((st, i) => {
          const got = done || (t >= RUN_AT && run >= i / 3 - 0.001);
          return (
            <div key={st.id} className="flex flex-col items-center gap-2">
              <span className={cn("text-[10px] tracking-[0.08em] uppercase transition-colors duration-200", got ? "text-foreground" : "text-foreground/50")}>{st.t[lang]}</span>
              <span
                className={cn(
                  "w-full rounded-md border px-1 py-1.5 text-[9px] leading-tight transition-[color,border-color,background-color] duration-200 sm:text-[10px]",
                  got ? "border-primary/40 bg-primary/10 text-primary" : "border-dashed border-foreground/15 text-foreground/30",
                )}
              >
                <span className="inline-block" style={{ transform: `translateY(${got ? 0 : 3}px)`, transition: "transform 220ms cubic-bezier(0.23,1,0.32,1)" }}>
                  {got ? st.data[lang] : tx.noData}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-(--line) pt-4">
        {(
          [
            [tx.stats[0], hands, hands === 0],
            [tx.stats[1], hands, hands === 0],
            [tx.stats[2], hands + 1, hands === 0],
          ] as const
        ).map(([k, v, ok]) => (
          <div key={k}>
            <div className="text-[9px] text-foreground/45 uppercase sm:text-[10px] sm:tracking-[0.06em]">{k}</div>
            <div className={cn("mt-1 text-3xl tabular-nums transition-colors duration-200", ok ? "text-primary" : "text-signal")}>{v}</div>
          </div>
        ))}
      </div>

      <div
        className="mt-4 flex items-center justify-center gap-3 rounded-full bg-primary px-4 py-2.5 text-primary-foreground"
        style={{
          opacity: done ? 1 : 0,
          transform: `translateY(${done ? 0 : 6}px)`,
          transition: "opacity 260ms cubic-bezier(0.23,1,0.32,1), transform 260ms cubic-bezier(0.23,1,0.32,1)",
        }}
      >
        <Image src="/images/isotipo.png" alt="" width={28} height={17} style={{ width: "auto" }} className="h-[17px] w-auto brightness-0" />
        {tx.owner}
      </div>
    </div>
  );
}

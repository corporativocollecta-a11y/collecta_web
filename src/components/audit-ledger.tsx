"use client";

import { Check } from "lucide-react";
import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/lang-provider";
import type { Copy } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion";

/* "Información verificable para auditorías": the lot record verifies itself.
   A scan line sweeps the rows, each value decodes as it's read, then the file gets stamped.
   Everything derives from one clock `t` (ms since the panel came into view). */

const ROWS: Copy<readonly (readonly [string, string])[]> = {
  en: [
    ["Plot", "P-07 · Puebla"],
    ["Cut", "06:40 · Sep 12"],
    ["Route", "1 °C steady"],
    ["Crossing", "Reynosa"],
    ["FSVP", "Documented"],
  ],
  es: [
    ["Parcela", "P-07 · Puebla"],
    ["Corte", "06:40 · 12 sep"],
    ["Ruta", "1 °C constante"],
    ["Cruce", "Reynosa"],
    ["FSVP", "Documentado"],
  ],
};

const T: Copy<{ file: string; lot: string; stamp: string }> = {
  en: { file: "FILE · ", lot: "LOT", stamp: "VERIFIED" },
  es: { file: "EXPEDIENTE · ", lot: "LOTE", stamp: "VERIFICADO" },
};

const ROW_GAP = 320; // ms between rows being read
const FIRST = 350;
const DECODE = 420; // ms for one value to resolve
const SCAN_END = FIRST + ROWS.es.length * ROW_GAP;
const STAMP_AT = SCAN_END + 250;
const END = STAMP_AT + 900;
const GLYPHS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";

// deterministic barcode: widths from the lot id so it never reshuffles between renders
const BARS = Array.from("BRC2291PUEBLAREYNOSA07").flatMap((c, i) => {
  const n = c.charCodeAt(0);
  return [1 + (n % 3), 1 + ((n >> 2) % 2) + (i % 2)];
});

function decode(text: string, t: number, start: number) {
  if (t < start) return null;
  const p = Math.min(1, (t - start) / DECODE);
  if (p === 1) return text;
  const shown = Math.floor(p * text.length);
  let out = text.slice(0, shown);
  for (let k = shown; k < text.length; k++) {
    const ch = text[k];
    out += ch === " " || ch === "·" ? ch : GLYPHS[(k * 7 + Math.floor(t / 45)) % GLYPHS.length];
  }
  return out;
}

export function AuditLedger() {
  const lang = useLang();
  const tx = T[lang];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.6 });
  const reduce = useReducedMotionSafe();
  const [clock, setClock] = useState(0);
  const t = reduce ? END : clock; // reduced motion: the file is simply already verified

  useEffect(() => {
    if (reduce || !inView) return;
    // every entry restarts the clock from 0 on the first frame, so the check replays
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

  const scan = Math.min(1, Math.max(0, (t - FIRST + ROW_GAP / 2) / (SCAN_END - FIRST)));
  const scanning = t > FIRST - ROW_GAP / 2 && t < SCAN_END + 120;
  const stamped = t >= STAMP_AT;
  const bars = Math.min(1, Math.max(0, (t - SCAN_END) / 600));

  return (
    <div ref={ref} className="relative overflow-hidden rounded-2xl border border-(--line) bg-background/80 p-5 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-(--line) pb-3">
        <span className="text-foreground/60">
          <span className="hidden sm:inline">{tx.file}</span><span className="text-foreground">{tx.lot} BRC-2291</span>
        </span>
      </div>

      <div className="relative">
        <dl className="mt-2">
          {ROWS[lang].map(([k, v], i) => {
            const start = FIRST + i * ROW_GAP;
            const val = decode(v, t, start);
            const done = t >= start + DECODE;
            return (
              <div key={k} className="flex items-center justify-between border-b border-(--line) py-2.5 last:border-b-0">
                <dt className={cn("uppercase transition-colors duration-200", val ? "text-foreground/55" : "text-foreground/30")}>{k}</dt>
                <dd className="flex items-center gap-2.5">
                  <span className={cn("tabular-nums", done ? "text-foreground" : "text-primary/80")}>{val ?? "· · · · · ·"}</span>
                  <span
                    className={cn(
                      "grid size-4 place-items-center rounded-full bg-primary text-primary-foreground transition-[opacity,transform] duration-200 ease-(--ease-out)",
                      done ? "scale-100 opacity-100" : "scale-95 opacity-0",
                    )}
                    aria-hidden
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>

        {/* scan line */}
        {/* a full-height layer slides by transform (no layout per frame); the line sits on its top edge */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ transform: `translateY(${(scan * 100).toFixed(2)}%)`, opacity: scanning ? 1 : 0, transition: "opacity 200ms" }}
        >
          <div className="absolute inset-x-0 top-0 h-10 -translate-y-1/2">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/12 to-transparent" />
            <div className="absolute inset-x-0 top-1/2 h-px bg-primary shadow-[0_0_12px_2px_rgb(159_211_106/0.6)]" />
          </div>
        </div>
      </div>

      {/* verification barcode; the stamp lands in the space to its right */}
      <div className="mt-4 border-t border-(--line) pt-4">
        <div className="flex h-8 max-w-[52%] items-stretch gap-[2px] overflow-hidden sm:max-w-none" style={{ clipPath: `inset(0 ${100 - bars * 100}% 0 0)` }} aria-hidden>
          {BARS.map((w, i) => (
            <span key={i} className={i % 2 ? "bg-transparent" : "bg-foreground/80"} style={{ width: `${w * 1.5}px` }} />
          ))}
        </div>
        <span className={cn("mt-2 block text-[10px] text-foreground/45 transition-opacity duration-300", bars === 1 ? "opacity-100" : "opacity-0")}>
          HASH 7F3A·C219
        </span>
      </div>

      {/* the stamp: presses down, never pops from nothing */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-4 bottom-5 rounded-md border-2 border-primary px-2 py-1 text-xs sm:right-6 sm:bottom-6 sm:px-3 sm:py-1.5 sm:text-sm font-semibold tracking-[0.2em] text-primary outline outline-1 outline-offset-2 outline-primary/60"
        style={{
          opacity: stamped ? 0.92 : 0,
          transform: `rotate(-9deg) scale(${stamped ? 1 : 1.12})`,
          transition: "opacity 180ms cubic-bezier(0.23,1,0.32,1), transform 220ms cubic-bezier(0.23,1,0.32,1)",
        }}
      >
        {tx.stamp}
      </div>
    </div>
  );
}

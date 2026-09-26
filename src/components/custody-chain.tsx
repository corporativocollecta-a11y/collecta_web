"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/lang-provider";
import type { Copy } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion";

/* "Auditable de extremo a extremo": each event of the lot is sealed as a block that
   carries the previous block's hash, a check pulse runs down the chain, and the whole
   history resolves into the QR printed on the crate. One clock `t` drives it all. */

const BLOCKS = [
  { ev: { en: "Plot", es: "Parcela" }, at: { en: "P-07 · Puebla", es: "P-07 · Puebla" }, hash: "3F9A·C1" },
  { ev: { en: "Harvest", es: "Cosecha" }, at: { en: "06:40 · Sep 12", es: "06:40 · 12 sep" }, hash: "7C2E·04" },
  { ev: { en: "Packing", es: "Empaque" }, at: { en: "Puebla", es: "Puebla" }, hash: "B815·9D" },
  { ev: { en: "Crossing", es: "Cruce" }, at: { en: "Reynosa", es: "Reynosa" }, hash: "E4A0·37" },
] satisfies { ev: Copy<string>; at: Copy<string>; hash: string }[];

const T: Copy<{ chain: string; sealed: string; sealing: string; genesis: string; qr: string; scan: string }> = {
  en: { chain: "CHAIN OF CUSTODY · ", sealed: "Sealed", sealing: "Sealing", genesis: "genesis", qr: "Lot QR code", scan: "Scan the lot" },
  es: { chain: "CADENA DE CUSTODIA · ", sealed: "Sellado", sealing: "Sellando", genesis: "génesis", qr: "Código QR del lote", scan: "Escanea el lote" },
};

// The crate's QR: https://t.me/oznocollecta_bot, error correction H. Real and scannable.
const QR = [
  "111111100010011011101001101111111",
  "100000100011100100111101001000001",
  "101110100001101001110011001011101",
  "101110100110101101010011101011101",
  "101110101100110110111001101011101",
  "100000100110101001001001001000001",
  "111111101010101010101010101111111",
  "000000001101011011001000100000000",
  "001100111010001010010101111010000",
  "011101000001001000010101011000101",
  "010100100000100111111001111000101",
  "101001010010111010100001000111010",
  "011110101001010100110100000100010",
  "101001000000110110111110100001000",
  "001001100101100000011100101010100",
  "001010010110010101001111000001110",
  "010110110010110010000100111011110",
  "000101000000011001011111011110111",
  "011101100110001110110010011100110",
  "101000011100001101100000000110010",
  "000011100010000010010100101001101",
  "101000010110111001000100100001001",
  "001011101000110111110001101101111",
  "011101010010011111110000010101001",
  "101101101100101000111110111110011",
  "000000001011100110110111100010110",
  "111111101101001000011101101011100",
  "100000100011000001111001100011111",
  "101110100100010010000011111111110",
  "101110101111001011100111000101100",
  "101110101111010110110001111001000",
  "100000100001001001101101110000001",
  "111111100011010000001001001111100",
];
const N = QR.length;
const finder = (x: number, y: number) => (x < 7 && y < 7) || (x >= N - 7 && y < 7) || (x < 7 && y >= N - 7);
// every dark module gets a reveal rank: finders first, then a scattered order (seeded, stable)
const MODULES = QR.flatMap((row, y) => [...row].flatMap((v, x) => (v === "1" ? [{ x, y }] : [])))
  .map((m) => ({ ...m, rank: finder(m.x, m.y) ? 0 : 0.15 + (((m.x * 73 + m.y * 151) % 97) / 97) * 0.85 }))
  .sort((a, b) => a.rank - b.rank);

const BLOCK_GAP = 380;
const FIRST = 250;
const BLOCK_IN = 260;
const DECODE = 380;
const CHAIN_END = FIRST + BLOCKS.length * BLOCK_GAP;
const PULSE = [CHAIN_END + 100, CHAIN_END + 900] as const;
const QR_START = PULSE[1] - 200;
const QR_DUR = 900;
const LOCK_AT = QR_START + QR_DUR + 80;
const END = LOCK_AT + 700;
const GLYPHS = "0123456789ABCDEF";

function decode(text: string, t: number, start: number) {
  if (t < start) return "····";
  const p = Math.min(1, (t - start) / DECODE);
  if (p === 1) return text;
  const shown = Math.floor(p * text.length);
  let out = text.slice(0, shown);
  for (let k = shown; k < text.length; k++) out += text[k] === "·" ? "·" : GLYPHS[(k * 5 + Math.floor(t / 40)) % 16];
  return out;
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));

export function CustodyChain() {
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

  const pulse = clamp((t - PULSE[0]) / (PULSE[1] - PULSE[0]));
  const pulsing = t > PULSE[0] && t < PULSE[1] + 150;
  const qr = clamp((t - QR_START) / QR_DUR);
  const locked = t >= LOCK_AT;
  const shownModules = MODULES.filter((m) => m.rank <= qr * 1.001 && qr > 0);

  return (
    <div ref={ref} className="rounded-2xl border border-(--line) bg-background/80 p-5 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-(--line) pb-3">
        <span className="text-foreground/60">
          <span className="hidden sm:inline">{tx.chain}</span>
          <span className="text-foreground">BRC-2291</span>
        </span>
        <span
          className={cn(
            "flex items-center gap-2 rounded-full border px-2.5 py-1 transition-colors duration-200 ease-(--ease-out)",
            locked ? "border-primary/40 text-primary" : "border-signal/40 text-signal",
          )}
        >
          <span className={cn("size-1.5 rounded-full", locked ? "bg-primary" : "animate-pulse bg-signal")} aria-hidden />
          {locked ? tx.sealed : tx.sealing}
        </span>
      </div>

      <div className="mt-4 grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
        {/* the chain: each block carries the previous hash */}
        <ol className="relative">
          <span aria-hidden className="absolute top-3 bottom-3 left-[11px] w-px bg-foreground/15" />
          <span
            aria-hidden
            className="absolute top-3 bottom-3 left-[11px] w-px bg-primary"
            style={{ clipPath: `inset(0 0 ${100 - clamp((t - FIRST) / (CHAIN_END - FIRST)) * 100}% 0)` }}
          />
          {pulsing && (
            <span
              aria-hidden
              className="absolute left-[7px] size-[9px] rounded-full bg-primary shadow-[0_0_10px_3px_rgb(159_211_106/0.7)]"
              style={{ top: `calc(12px + ${pulse} * (100% - 24px) - 4px)` }}
            />
          )}
          {BLOCKS.map((b, i) => {
            const start = FIRST + i * BLOCK_GAP;
            const inP = clamp((t - start) / BLOCK_IN);
            const sealed = t >= start + DECODE;
            const checked = pulse * BLOCKS.length > i + 0.5 || locked;
            return (
              <li
                key={b.hash}
                className="relative flex items-center gap-3 py-1.5"
                style={{ opacity: inP, transform: `translateY(${(1 - inP) * 8}px)` }}
              >
                <span
                  className={cn(
                    "relative z-10 grid size-[23px] shrink-0 place-items-center rounded-md border text-[10px] transition-colors duration-200",
                    checked ? "border-primary bg-primary text-primary-foreground" : sealed ? "border-primary/60 bg-background text-primary" : "border-foreground/20 bg-background text-foreground/40",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 rounded-lg border border-(--line) bg-card/70 px-3 py-2">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-foreground uppercase">{b.ev[lang]}</span>
                    <span className={cn("shrink-0 tabular-nums", sealed ? "text-primary" : "text-primary/60")}>#{decode(b.hash, t, start)}</span>
                  </span>
                  <span className="mt-0.5 flex justify-between gap-2 text-[10px] text-foreground/45">
                    <span className="truncate">{b.at[lang]}</span>
                    <span className="hidden shrink-0 sm:inline">{i === 0 ? tx.genesis : `← ${BLOCKS[i - 1].hash.slice(0, 4)}`}</span>
                  </span>
                </span>
              </li>
            );
          })}
        </ol>

        {/* the history resolves into the crate's QR */}
        <div className="flex items-center gap-4 border-t border-(--line) pt-4 sm:flex-col sm:gap-0 sm:border-t-0 sm:pt-0">
          <div className="relative p-2.5">
            <div className="rounded-md bg-[#eeebe3] p-1.5 transition-opacity duration-300" style={{ opacity: qr > 0 ? 1 : 0.18 }}>
              <svg viewBox={`0 0 ${N} ${N}`} className="block size-24 sm:size-32" role="img" aria-label={tx.qr}>
                {shownModules.map((m) => (
                  <rect key={`${m.x}-${m.y}`} x={m.x} y={m.y} width="1.02" height="1.02" fill="#0b120d" />
                ))}
              </svg>
            </div>
            {/* scanner brackets lock onto the code */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                opacity: locked ? 1 : 0,
                transform: `scale(${locked ? 1 : 1.08})`,
                transition: "opacity 180ms cubic-bezier(0.23,1,0.32,1), transform 240ms cubic-bezier(0.23,1,0.32,1)",
              }}
            >
              {["top-0 left-0 border-t-2 border-l-2 rounded-tl-md", "top-0 right-0 border-t-2 border-r-2 rounded-tr-md", "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-md", "right-0 bottom-0 border-r-2 border-b-2 rounded-br-md"].map((c) => (
                <span key={c} className={cn("absolute size-4 border-primary", c)} />
              ))}
            </div>
          </div>
          <span className={cn("text-[10px] text-foreground/55 transition-opacity duration-300 sm:mt-1 sm:text-center", locked ? "opacity-100" : "opacity-0")}>
            {tx.scan}
          </span>
        </div>
      </div>
    </div>
  );
}

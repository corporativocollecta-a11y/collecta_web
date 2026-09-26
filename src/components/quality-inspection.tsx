"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/lang-provider";
import type { Copy } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion";

/* Panel 03 — "Calidad Consistente". A scanned broccoli turns on an inspection plate
   (render-pipeline/calidad/crown_scene.py). The lime ring rises through it between frames
   60 and 120 of the 180-frame loop; this overlay reads the video clock, draws a leader line
   from each of the buyer's QC criteria to the part of the head it concerns as the ring
   passes that height, measures the caliber, and reads the lot like instruments. */

const FPS = 30;
const SCAN_START = 60;
const SCAN_END = 120;
const APPROVE_AT = SCAN_END + 6;

// the ring's height follows the same smoothstep the Blender scene uses
const ringHeight = (p: number) => p * p * (3 - 2 * p);

// where the head sits in the 4:3 frame (fractions of width / height), measured from the render
const CROWN = { left: 0.31, right: 0.69, top: 0.26 };

// sample lot, not a real inspection — replace with the lot's QC record
const TEMP = { value: 1, max: 4, okMax: 2 }; // °C
const ICE = { level: 3, of: 3 };
const COUNT = 22;
const WEIGHT = { value: 20, target: 20 }; // lbs

// `at`: ring height (0 plate → 1 top of the head) at which the defect is ruled out;
// `to`: the point on the broccoli the leader line lands on
// listed top to bottom like the head itself, so the rising ring ticks them from the bottom up
const CHECKS = [
  { t: { en: "Flowering", es: "Floración" }, at: 0.9, to: [0.52, 0.29] },
  { t: { en: "Limp crown", es: "Corona flácida" }, at: 0.76, to: [0.57, 0.35] },
  { t: { en: "Purple crown", es: "Corona morada" }, at: 0.62, to: [0.59, 0.42] },
  { t: { en: "Pale green", es: "Verde claro" }, at: 0.48, to: [0.55, 0.5] },
  { t: { en: "Brown stem", es: "Tallo café" }, at: 0.18, to: [0.51, 0.63] },
] as const;

const T: Copy<{
  video: string;
  caliber: string;
  inspection: string;
  approved: string;
  inspecting: string;
  pending: string;
  temp: string;
  ice: string;
  level: string;
  count: string;
  weight: string;
  target: string;
  checks: string;
  damage: string;
  model: string;
}> = {
  en: {
    video: "A broccoli crown turns on an inspection plate while a ring of green light passes over it from bottom to top",
    caliber: "size",
    inspection: "INSPECTION · ",
    approved: "Approved",
    inspecting: "Inspecting",
    pending: "Pending",
    temp: "Temperature",
    ice: "Top ice",
    level: "Level",
    count: "Count",
    weight: "Net weight",
    target: "target",
    checks: "Defects checked",
    damage: "Severe damage 0%",
    model: "3D model:",
  },
  es: {
    video: "Una corona de brócoli gira sobre una placa de inspección mientras un anillo de luz verde la recorre de abajo arriba",
    caliber: "calibre",
    inspection: "INSPECCIÓN · ",
    approved: "Aprobado",
    inspecting: "Inspeccionando",
    pending: "En espera",
    temp: "Temperatura",
    ice: "Hielo superior",
    level: "Nivel",
    count: "Conteo",
    weight: "Peso neto",
    target: "meta",
    checks: "Defectos revisados",
    damage: "Daño severo 0%",
    model: "Modelo 3D:",
  },
};
const CALIBER_AT = 0.55; // ring reaches the head's widest point

type Anchor = { x: number; y: number };

const draw = (on: boolean, ms: number) => ({
  strokeDashoffset: on ? 0 : 1,
  transition: `stroke-dashoffset ${ms}ms cubic-bezier(0.23,1,0.32,1)`,
});

export function QualityInspection() {
  const lang = useLang();
  const tx = T[lang];
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const reduce = useReducedMotionSafe();
  const [frame, setFrame] = useState(0);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const f = reduce ? APPROVE_AT : frame;

  // play only on screen; the overlay follows the video's own clock
  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduce) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          video.preload = "auto";
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(video);
    let raf = 0;
    const tick = () => {
      setFrame(Math.floor(video.currentTime * FPS));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  // leader lines start at each label: measure the labels against the video frame
  useEffect(() => {
    const root = rootRef.current;
    const fr = frameRef.current;
    if (!root || !fr) return;
    // the stacked panels scale this card; measure in its own (unscaled) pixels
    const measure = () => {
      const r = fr.getBoundingClientRect();
      const k = r.width / fr.offsetWidth || 1;
      setBox({ w: fr.offsetWidth, h: fr.offsetHeight });
      setAnchors(
        labelRefs.current.map((el) => {
          if (!el) return { x: 0, y: 0 };
          const b = el.getBoundingClientRect();
          return { x: (b.left - r.left) / k - 12, y: (b.top - r.top + b.height / 2) / k };
        }),
      );
    };
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, []);

  const p = Math.min(1, Math.max(0, (f - SCAN_START) / (SCAN_END - SCAN_START)));
  const h = ringHeight(p);
  const scanning = f >= SCAN_START && f < SCAN_END;
  const done = f >= SCAN_END;
  const approved = f >= APPROVE_AT;
  const passed = (at: number) => done || (scanning && h >= at);
  const scanned = done ? 1 : scanning ? p : 0;
  const caliber = passed(CALIBER_AT);

  const dimY = CROWN.top * box.h - 14;
  const dimX0 = CROWN.left * box.w;
  const dimX1 = CROWN.right * box.w;

  return (
    <div className="overflow-hidden rounded-2xl border border-(--line) bg-[#040806] font-mono text-xs">
      <div ref={rootRef} className="relative">
        <div ref={frameRef} className="relative aspect-[4/3]">
          <video
            ref={videoRef}
            className="absolute inset-0 size-full object-cover"
            poster="/images/calidad/corona-poster.webp"
            muted
            loop
            playsInline
            preload="none"
            aria-label={tx.video}
          >
            <source src="/images/calidad/corona.webm" type="video/webm" />
            <source src="/images/calidad/corona.mp4" type="video/mp4" />
          </video>
          {/* faint measuring grid, only behind the product */}
          <div aria-hidden className="grid-bg pointer-events-none absolute inset-0 opacity-25 [mask-image:radial-gradient(circle_at_50%_50%,black,transparent_62%)]" />

          {box.w > 0 && (
            <svg aria-hidden className="pointer-events-none absolute inset-0 size-full" viewBox={`0 0 ${box.w} ${box.h}`}>
              {/* caliber: a dimension line across the head, drawn when the ring reaches its widest point */}
              <g className="hidden sm:inline" style={{ opacity: caliber ? 1 : 0, transition: "opacity 200ms" }}>
                <line x1={dimX0} y1={dimY - 5} x2={dimX0} y2={dimY + 5} stroke="#9fd36a" />
                <line x1={dimX1} y1={dimY - 5} x2={dimX1} y2={dimY + 5} stroke="#9fd36a" />
                <line x1={dimX0} y1={dimY} x2={dimX1} y2={dimY} stroke="#9fd36a" pathLength={1} strokeDasharray="1" style={draw(caliber, 420)} />
                <line x1={dimX0} y1={dimY + 6} x2={dimX0} y2={dimY + 34} stroke="#9fd36a" strokeOpacity="0.35" strokeDasharray="2 3" />
                <line x1={dimX1} y1={dimY + 6} x2={dimX1} y2={dimY + 34} stroke="#9fd36a" strokeOpacity="0.35" strokeDasharray="2 3" />
              </g>

              {/* one leader per criterion: label → elbow → the part of the head it concerns */}
              <g className="hidden sm:inline">
                {CHECKS.map((c, i) => {
                  const a = anchors[i];
                  if (!a || !a.x) return null;
                  const tx = c.to[0] * box.w;
                  const ty = c.to[1] * box.h;
                  const knee = a.x - 14; // short stub off the label, then straight to the target
                  const on = passed(c.at);
                  return (
                    <g key={c.t.es}>
                      <path
                        d={`M${a.x},${a.y} H${knee} L${tx},${ty}`}
                        fill="none"
                        stroke="#9fd36a"
                        strokeOpacity={approved ? 0.5 : 0.9}
                        pathLength={1}
                        strokeDasharray="1"
                        style={draw(on, 380)}
                      />
                      <circle cx={tx} cy={ty} r="3" fill="#040806" stroke="#9fd36a" strokeWidth="1.25" style={{ opacity: on ? 1 : 0, transition: "opacity 160ms 260ms" }} />
                    </g>
                  );
                })}
              </g>
            </svg>
          )}

          <span
            className="pointer-events-none absolute hidden -translate-x-1/2 -translate-y-full rounded-sm sm:block bg-[#040806]/80 px-1.5 py-0.5 text-[10px] whitespace-nowrap text-primary transition-opacity duration-200"
            style={{ left: "50%", top: `calc(${CROWN.top * 100}% - 20px)`, opacity: caliber ? 1 : 0 }}
          >
            Ø 14 cm · {tx.caliber}
          </span>

          <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
            <span className="rounded-full border border-white/10 bg-[#0b120d]/60 px-2.5 py-1 text-foreground/70 backdrop-blur-sm">
              <span className="hidden sm:inline">{tx.inspection}</span>
              <span className="text-foreground">BRC-2291</span>
            </span>
            <span
              className={cn(
                "flex items-center gap-2 rounded-full border bg-[#0b120d]/60 px-2.5 py-1 backdrop-blur-sm transition-colors duration-200 ease-(--ease-out)",
                approved ? "border-primary/50 text-primary" : "border-signal/50 text-signal",
              )}
            >
              <span className={cn("size-1.5 rounded-full", approved ? "bg-primary" : "animate-pulse bg-signal")} aria-hidden />
              {approved ? tx.approved : scanning ? tx.inspecting : tx.pending}
            </span>
          </div>

          {/* sight brackets close on the head once it passes, like the QR scanner in panel 02 */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-[22%] right-[34%] bottom-[12%] left-[34%]"
            style={{
              opacity: approved ? 1 : 0,
              transform: `scale(${approved ? 1 : 1.06})`,
              transition: "opacity 180ms cubic-bezier(0.23,1,0.32,1), transform 240ms cubic-bezier(0.23,1,0.32,1)",
            }}
          >
            {["top-0 left-0 border-t-2 border-l-2 rounded-tl-md", "top-0 right-0 border-t-2 border-r-2 rounded-tr-md", "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-md", "right-0 bottom-0 border-r-2 border-b-2 rounded-br-md"].map((c) => (
              <span key={c} className={cn("absolute size-5 border-primary", c)} />
            ))}
          </div>

          <div aria-hidden className="absolute inset-x-4 bottom-4 h-px bg-foreground/15">
            <div className="h-px origin-left bg-primary" style={{ transform: `scaleX(${scanned})` }} />
          </div>
        </div>

        {/* instruments: under the video on phones, over its left edge from sm up */}
        <dl className="grid grid-cols-2 gap-x-5 gap-y-4 border-t border-(--line) p-4 sm:absolute sm:top-16 sm:left-4 sm:block sm:w-[7.5rem] sm:space-y-4 sm:border-0 sm:p-0">
          <div>
            <dt className="text-[10px] tracking-[0.08em] text-foreground/45 uppercase">{tx.temp}</dt>
            <dd className="mt-0.5 text-sm text-foreground">{TEMP.value} °C</dd>
            <dd aria-hidden className="relative mt-1.5 h-1 rounded-full bg-foreground/10">
              <span className="absolute inset-y-0 left-0 rounded-full bg-primary/30" style={{ width: `${(TEMP.okMax / TEMP.max) * 100}%` }} />
              <span
                className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_6px_rgb(159_211_106/0.8)]"
                style={{ left: `${(TEMP.value / TEMP.max) * 100}%` }}
              />
            </dd>
            <dd aria-hidden className="mt-1 flex justify-between text-[9px] text-foreground/35">
              <span>0°</span>
              <span>{TEMP.max}°</span>
            </dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-[0.08em] text-foreground/45 uppercase">{tx.ice}</dt>
            <dd className="mt-0.5 text-sm text-foreground">{tx.level} {ICE.level}</dd>
            <dd aria-hidden className="mt-1.5 flex gap-1">
              {Array.from({ length: ICE.of }, (_, i) => (
                <span key={i} className={cn("h-1.5 flex-1 rounded-sm", i < ICE.level ? "bg-[#cfe6f5]" : "bg-foreground/10")} />
              ))}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-[0.08em] text-foreground/45 uppercase">{tx.count}</dt>
            <dd className="mt-0.5 text-sm text-foreground">{COUNT} ct</dd>
            {/* one dot per crown in the box, filling as the lot is read */}
            <dd aria-hidden className="mt-1.5 grid grid-cols-11 gap-[3px]">
              {Array.from({ length: COUNT }, (_, i) => (
                <span
                  key={i}
                  className={cn("aspect-square rounded-full transition-colors duration-150", i < Math.round(scanned * COUNT) ? "bg-primary" : "bg-foreground/15")}
                />
              ))}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-[0.08em] text-foreground/45 uppercase">{tx.weight}</dt>
            <dd className="mt-0.5 text-sm text-foreground">{WEIGHT.value} lbs</dd>
            <dd aria-hidden className="relative mt-1.5 h-1 rounded-full bg-foreground/10">
              <span className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${(WEIGHT.value / WEIGHT.target) * 88}%` }} />
              <span className="absolute -top-1 h-3 w-px bg-foreground/60" style={{ left: "88%" }} />
            </dd>
            <dd aria-hidden className="mt-1 text-right text-[9px] text-foreground/35">{tx.target} {WEIGHT.target}</dd>
          </div>
        </dl>

        {/* criteria: over the right edge from sm up; each label anchors a leader line */}
        <ul className="space-y-2.5 border-t border-(--line) p-4 sm:absolute sm:top-24 sm:right-4 sm:w-36 sm:border-0 sm:p-0" aria-label={tx.checks}>
          {CHECKS.map((c, i) => {
            const ok = passed(c.at);
            return (
              <li key={c.t.es} className="flex items-center justify-between gap-2">
                <span
                  ref={(el) => {
                    labelRefs.current[i] = el;
                  }}
                  className={cn("transition-colors duration-200", ok ? "text-foreground/85" : "text-foreground/35")}
                >
                  {c.t[lang]}
                </span>
                <span
                  className={cn(
                    "grid size-4 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-[opacity,transform] duration-200 ease-(--ease-out)",
                    ok ? "scale-100 opacity-100" : "scale-95 opacity-0",
                  )}
                  aria-hidden
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>
              </li>
            );
          })}
          <li className={cn("mt-3 border-t border-(--line) pt-3 transition-opacity duration-300", approved ? "text-primary opacity-100" : "opacity-0")}>
            {tx.damage}
          </li>
        </ul>
      </div>

      <p className="border-t border-(--line) px-4 py-2 text-[9px] text-foreground/35">
        {tx.model}{" "}
        <a
          href="https://sketchfab.com/3d-models/broccoli-3d-scan-0acdfc046a5149cc890c992da89b48c0"
          className="underline-offset-2 hover:text-foreground/60 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          E. Uralsky
        </a>{" "}
        ·{" "}
        <a href="https://creativecommons.org/licenses/by/4.0/" className="underline-offset-2 hover:text-foreground/60 hover:underline" target="_blank" rel="noopener noreferrer">
          CC BY 4.0
        </a>
      </p>
    </div>
  );
}

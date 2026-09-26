"use client";

import Image from "next/image";
import { ChevronLeft, MoreVertical, QrCode, Sprout } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLang } from "@/components/lang-provider";
import type { Copy } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* "Escanea la caja": the crate with its real QR (render-pipeline/blender, --shot qr), a scan
   line crosses the QR, and a phone rises out of it showing the box's traceability view — the
   same blocks COS shows at /t/{código}: the box, who grew it and where, what was applied and
   when, and how it travelled. The screen is an aerial of the parcel with the lot's outline and a
   glass sheet that cycles through origin, handling and trip. All data is sample data. */

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const PANE_MS = 5000;
// where the QR sits in the crate render (fractions of the photo)
const QR = { left: 0.628, top: 0.542, width: 0.081, height: 0.125 };
// the lot's parcel on the aerial behind the phone screen (% of the screen)
const PARCEL =
  "36.1,33.3 55.3,26.6 68.7,23.8 86.9,26.6 67.7,31.9 76.8,35.2 52.7,42.3";
const PIN = { x: 55, y: 32.5 };

/* the bottom sheet cycles through the box's story, like the COS trace view: origin, handling, trip */
type Pane = {
  key: string;
  title: string;
  side: string;
  tiles: readonly (readonly [string, string])[];
  bar: { label: string; note: string; pct: number };
};
const PANES: Copy<readonly Pane[]> = {
  en: [
    {
      key: "origen",
      title: "Broccoli · Plot P-07",
      side: "2.4 ha",
      tiles: [
        ["Grower", "Partner"],
        ["Harvest", "Sep 21"],
        ["Cut", "#3 · 06:40"],
      ],
      bar: { label: "Cut to your warehouse", note: "4 days", pct: 100 },
    },
    {
      key: "manejo",
      title: "What was applied, when",
      side: "3 records",
      tiles: [
        ["Planting", "Jul 02"],
        ["Preventive", "Aug 06"],
        ["COFEPRIS", "✓ 7 d"],
      ],
      bar: { label: "Sealed records", note: "3 / 3", pct: 100 },
    },
    {
      key: "viaje",
      title: "How it traveled",
      side: "Lot BRC-2291",
      tiles: [
        ["Reefer", "1.0 °C"],
        ["Crossing", "Reynosa"],
        ["Arrival", "Thu 25"],
      ],
      bar: { label: "In range 0–2 °C", note: "100%", pct: 100 },
    },
  ],
  es: [
    {
      key: "origen",
      title: "Brócoli · Parcela P-07",
      side: "2.4 ha",
      tiles: [
        ["Productor", "Asociado"],
        ["Cosecha", "21 sep"],
        ["Corte", "#3 · 06:40"],
      ],
      bar: { label: "Del corte a tu bodega", note: "4 días", pct: 100 },
    },
    {
      key: "manejo",
      title: "Qué se aplicó y cuándo",
      side: "3 registros",
      tiles: [
        ["Siembra", "02 jul"],
        ["Preventivo", "06 ago"],
        ["COFEPRIS", "✓ 7 d"],
      ],
      bar: { label: "Registros sellados", note: "3 / 3", pct: 100 },
    },
    {
      key: "viaje",
      title: "Cómo viajó",
      side: "Lote BRC-2291",
      tiles: [
        ["Termo", "1.0 °C"],
        ["Cruce", "Reynosa"],
        ["Llegada", "jue 25"],
      ],
      bar: { label: "En rango 0–2 °C", note: "100%", pct: 100 },
    },
  ],
};

const T: Copy<{
  plot: string;
  screenTitle: string;
  box: string;
  eyebrow: string;
  h3: [string, string, string];
  body: string;
  alt: string;
  sample: string;
}> = {
  en: {
    plot: "Plot",
    screenTitle: "Traceability",
    box: "Box",
    eyebrow: "Traceability by the box",
    h3: ["Scan the box, know its ", "story", "."],
    body: "Every Collecta box carries a QR code. Scan it and you see who grew it, on which plot, what was applied and when, and how it traveled to your warehouse.",
    alt: "Collecta broccoli box with its label and traceability QR code",
    sample: "Sample view",
  },
  es: {
    plot: "Parcela",
    screenTitle: "Trazabilidad",
    box: "Caja",
    eyebrow: "Trazabilidad por caja",
    h3: ["Escanea la caja, conoce su ", "historia", "."],
    body: "Cada caja de Collecta lleva un QR. Al escanearlo ves quién la cultivó, en qué parcela, qué se aplicó y cuándo, y cómo viajó hasta tu bodega.",
    alt: "Caja de brócoli Collecta con su etiqueta y código QR de trazabilidad",
    sample: "Vista de ejemplo",
  },
};

function Glass({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "border border-white/15 bg-[#0b120d]/45 backdrop-blur-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

function PhoneScreen({ run, reduce }: { run: boolean; reduce: boolean }) {
  const lang = useLang();
  const tx = T[lang];
  const panes = PANES[lang];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!run || reduce) return;
    const id = window.setInterval(
      () => setI((v) => (v + 1) % PANES.es.length),
      PANE_MS,
    );
    return () => window.clearInterval(id);
  }, [run, reduce]);
  const pane = panes[i];

  return (
    <div className="relative aspect-[9/16] overflow-hidden rounded-[1.6rem] font-sans text-foreground">
      <Image
        src="/images/dashboard/parcela-aerea-v2.jpg"
        alt=""
        fill
        sizes="20vw"
        className="object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgb(5_9_6/0.55)_0%,transparent_22%,transparent_55%,rgb(5_9_6/0.6)_100%)]"
      />

      {/* parcel outline + neighbours */}
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
      >
        <motion.polygon
          points={PARCEL}
          fill="#9fd36a"
          fillOpacity={0.18}
          stroke="#eeebe3"
          strokeWidth={0.6}
          strokeDasharray="2 1.4"
          vectorEffect="non-scaling-stroke"
          initial={{ opacity: reduce ? 1 : 0 }}
          animate={run || reduce ? { opacity: 1 } : undefined}
          transition={{
            duration: 0.5,
            ease: EASE_OUT,
            delay: reduce ? 0 : 1.5,
          }}
        />
      </svg>
      {[
        { t: "P-04", x: 24, y: 48 },
        { t: "P-11", x: 78, y: 46 },
      ].map((n) => (
        <span
          key={n.t}
          className="absolute -translate-x-1/2 -translate-y-1/2 text-center text-[7px] leading-tight text-white/80 [text-shadow:0_1px_3px_rgb(0_0_0/0.7)]"
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
        >
          <span
            className="mx-auto mb-0.5 block size-2.5 rounded-full border border-white/70 bg-white/25"
            aria-hidden
          />
          {tx.plot} {n.t}
        </span>
      ))}
      <motion.span
        className="absolute -translate-x-1/2 -translate-y-full rounded-md bg-[#eeebe3] px-1.5 py-1 text-center text-[7.5px] leading-tight font-medium text-[#0b120d] shadow-md"
        style={{ left: `${PIN.x}%`, top: `${PIN.y}%` }}
        initial={{ opacity: reduce ? 1 : 0 }}
        animate={run || reduce ? { opacity: 1 } : undefined}
        transition={{ duration: 0.3, ease: EASE_OUT, delay: reduce ? 0 : 1.7 }}
      >
        <Sprout
          className="mx-auto mb-0.5 size-2.5 text-primary-foreground"
          aria-hidden
        />
        {tx.plot} P-07
        <span
          className="absolute top-full left-1/2 size-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-[#eeebe3]"
          aria-hidden
        />
      </motion.span>

      {/* status bar + header */}
      <div className="absolute inset-x-0 top-0 px-3 pt-2">
        <div className="flex items-center justify-between text-[8px] font-medium text-white/90">
          <span>9:41</span>
          <span className="h-3.5 w-12 rounded-full bg-[#050906]" aria-hidden />
          <span>5G</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <Glass className="grid size-6 place-items-center rounded-full">
            <ChevronLeft className="size-3.5" aria-hidden />
          </Glass>
          <span className="text-[11px] font-medium">{tx.screenTitle}</span>
          <Glass className="grid size-6 place-items-center rounded-full">
            <MoreVertical className="size-3" aria-hidden />
          </Glass>
        </div>
        <Glass className="mt-2 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[8.5px] text-white/80">
          <QrCode className="size-3" aria-hidden /> COL-2026-0418 · {tx.box} #0418
        </Glass>
      </div>

      {/* bottom sheet */}
      <Glass className="absolute inset-x-2 bottom-2 rounded-2xl p-2.5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pane.key}
            initial={{
              opacity: 0,
              transform: reduce ? "none" : "translateY(6px)",
            }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={{
              opacity: 0,
              transform: reduce ? "none" : "translateY(-4px)",
            }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
          >
            <div className="flex items-center justify-between text-[10px]">
              <span className="truncate font-medium">{pane.title}</span>
              <span className="shrink-0 pl-2 text-[8.5px] text-white/65">
                {pane.side}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {pane.tiles.map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-lg border border-white/12 bg-white/8 px-1.5 py-1.5"
                >
                  <div className="truncate text-[7.5px] text-white/60">{k}</div>
                  <div className="mt-0.5 truncate text-[10px] font-medium">
                    {v}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 rounded-lg border border-white/12 bg-white/8 px-2 py-1.5">
              <div className="flex items-center justify-between text-[8px] text-white/70">
                <span>{pane.bar.label}</span>
                <span className="rounded-full bg-primary/25 px-1.5 text-primary">
                  {pane.bar.note}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15">
                <motion.div
                  className="h-full origin-left rounded-full bg-primary"
                  initial={{ transform: reduce ? "scaleX(1)" : "scaleX(0)" }}
                  animate={{ transform: `scaleX(${pane.bar.pct / 100})` }}
                  transition={{
                    duration: 2.6,
                    ease: [0.33, 1, 0.68, 1],
                    delay: 0.5,
                  }}
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="mt-2 flex justify-center" aria-hidden>
          {panes.map((p, k) => (
            <span
              key={p.key}
              className={cn(
                "h-1 w-2.5 rounded-full transition-[scale,background-color] duration-300 ease-(--ease-out)",
                k === i ? "bg-primary" : "scale-x-40 bg-white/35",
              )}
            />
          ))}
        </div>
      </Glass>
    </div>
  );
}

export function TraceShowcase({ cta }: { cta: ReactNode }) {
  const reduce = !!useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const shown = useInView(stageRef, { once: true, amount: 0.3 });
  const visible = useInView(stageRef, { amount: 0.3 });
  const tx = T[useLang()];

  return (
    <div
      id="trazabilidad"
      className="grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-8"
    >
      <div className="relative z-10 lg:col-span-5 lg:pt-24">
        <p className="eyebrow flex items-center gap-2">
          <span className="live-dot" /> {tx.eyebrow}
        </p>
        <h3 className="text-fluid-2xl mt-5 leading-[0.98] font-semibold tracking-[-0.04em]">
          {tx.h3[0]}
          <span className="serif-em text-primary">{tx.h3[1]}</span>
          {tx.h3[2]}
        </h3>
        <p className="text-fluid-base mt-5 max-w-md text-foreground/70">
          {tx.body}
        </p>
        <div className="mt-8">{cta}</div>
      </div>

      {/* stage: the phone in front on the left, the crate on a steel packing table behind it on the right.
          From sm up it sits on a 5:4 stage; on phones the phone overlaps the crate's bottom edge. */}
      <div
        ref={stageRef}
        className="relative sm:mb-32 sm:aspect-[5/4] lg:-top-8 lg:left-14 lg:col-span-7"
      >
        <div
          aria-hidden
          className="absolute top-[40%] left-[8%] h-[30%] w-[58%] rounded-full bg-primary/12 blur-3xl"
        />

        {/* the crate is rendered on a transparent background with a shadow catcher: it sits right on the page; a wide fade keeps the shadow from ending at the frame */}
        <motion.div
          className="relative aspect-[4/3] w-full pointer-events-none [mask-image:radial-gradient(ellipse_50%_48%_at_56%_42%,black_62%,transparent_100%)] lg:[mask-image:radial-gradient(ellipse_58%_48%_at_53%_42%,black_58%,transparent_100%)] sm:absolute sm:top-[-6%] sm:right-[-19%] sm:w-[100%] lg:right-[-19%] lg:w-[104%]"
          initial={{
            clipPath: reduce ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)",
          }}
          animate={shown ? { clipPath: "inset(0% 0% 0% 0%)" } : undefined}
          transition={{ duration: 0.8, ease: EASE_OUT }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ transform: reduce ? "scale(1)" : "scale(1.06)" }}
            animate={shown ? { transform: "scale(1)" } : undefined}
            transition={{ duration: 1.2, ease: EASE_OUT }}
          >
            <Image
              src="/images/dashboard/caja-mesa-acero-v2.webp"
              alt={tx.alt}
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
            />
          </motion.div>

          {/* the scan: brackets lock on the QR, a line sweeps it once */}
          <div
            aria-hidden
            className="absolute"
            style={{
              left: `${QR.left * 100}%`,
              top: `${QR.top * 100}%`,
              width: `${QR.width * 100}%`,
              height: `${QR.height * 100}%`,
            }}
          >
            <motion.div
              className="absolute -inset-2"
              initial={{
                opacity: 0,
                transform: reduce ? "scale(1)" : "scale(1.5)",
              }}
              animate={
                shown ? { opacity: 1, transform: "scale(1)" } : undefined
              }
              transition={{
                duration: 0.45,
                ease: EASE_OUT,
                delay: reduce ? 0 : 0.8,
              }}
            >
              {[
                "top-0 left-0 border-t-2 border-l-2",
                "top-0 right-0 border-t-2 border-r-2",
                "bottom-0 left-0 border-b-2 border-l-2",
                "right-0 bottom-0 border-r-2 border-b-2",
              ].map((c) => (
                <span
                  key={c}
                  className={cn("absolute size-3 border-primary", c)}
                />
              ))}
            </motion.div>
            {/* the scan line only exists with motion on; hidden by CSS so server and client match */}
            <motion.span
              className="absolute inset-x-[-4px] inset-y-0 motion-reduce:hidden"
              initial={{ transform: "translateY(0%)", opacity: 0 }}
              animate={
                shown
                  ? {
                      transform: ["translateY(0%)", "translateY(100%)", "translateY(0%)"],
                      opacity: [0, 1, 1, 0],
                    }
                  : undefined
              }
              transition={{
                duration: 1.1,
                ease: [0.77, 0, 0.175, 1],
                delay: 1.0,
                times: [0, 0.5, 1],
              }}
            >
              <span className="absolute inset-x-0 top-0 h-0.5 bg-primary shadow-[0_0_10px_3px_rgb(159_211_106/0.7)]" />
            </motion.span>
          </div>
        </motion.div>

        {/* the phone stands in front, covering the table's cut edge on the left */}
        <motion.div
          className="relative z-10 -mt-24 mr-auto ml-1 w-[74%] max-w-[17rem] sm:absolute sm:bottom-[-15%] sm:left-0 sm:mx-0 sm:mt-0 sm:w-[31%] sm:max-w-none lg:left-[-2%] lg:w-[36%]"
          initial={{
            opacity: 0,
            transform: reduce ? "none" : "translateY(40px)",
          }}
          animate={
            shown ? { opacity: 1, transform: "translateY(0px)" } : undefined
          }
          transition={{
            duration: 0.7,
            ease: EASE_OUT,
            delay: reduce ? 0 : 1.0,
          }}
        >
          <div className="rounded-[2rem] border border-white/15 bg-[#050906] p-1.5 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.95)]">
            <PhoneScreen run={visible} reduce={reduce} />
          </div>
          <p className="mt-4 text-center font-mono text-[10px] text-foreground/40">
            {tx.sample}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

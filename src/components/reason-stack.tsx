"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion";
import { useRef, useSyncExternalStore, type ReactNode } from "react";
import { AuditLedger } from "@/components/audit-ledger";
import { CustodyChain } from "@/components/custody-chain";
import { useLang } from "@/components/lang-provider";
import { OneLine } from "@/components/one-line";
import { QualityInspection } from "@/components/quality-inspection";
import type { Copy } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* Four reasons as panels that stack on scroll: each one pins, the next slides over it,
   and the ones underneath step back a little so the pile reads as depth. */

/* Titles and copy: Spanish is the live site's original text, verbatim. */
const COPY: Copy<{ t: string; d: string }[]> = {
  en: [
    { t: "Operational data", d: "Verifiable information for audits, FSVP and day-to-day tracking, straight from our platform." },
    { t: "Full Traceability", d: "Auditable end to end. Complete control over food risks and food safety." },
    { t: "Consistent Quality", d: "Higher quality rates, fewer rejections, real-time communication." },
    { t: "Vertical Model", d: "One operator from planting to sale. No middlemen, no fragmentation." },
  ],
  es: [
    { t: "Datos operativos", d: "Información verificable para auditorías, FSVP y seguimiento operativo desde nuestra plataforma." },
    { t: "Trazabilidad Total", d: "Auditable de extremo a extremo. Control absoluto sobre riesgos alimentarios e inocuidad." },
    { t: "Calidad Consistente", d: "Mayor porcentaje de calidad, menos rechazos, comunicación en tiempo real." },
    { t: "Modelo Vertical", d: "Un solo operador desde la siembra hasta la venta. Sin intermediarios, sin fragmentación." },
  ],
};

const PANELS: { tone: string; muted: string; visual: ReactNode }[] = [
  {
    tone: "bg-card text-foreground",
    muted: "text-foreground/70",
    visual: <AuditLedger />,
  },
  {
    tone: "bg-[#1d2a21] text-foreground",
    muted: "text-foreground/70",
    visual: <CustodyChain />,
  },
  {
    tone: "bg-card text-foreground",
    muted: "text-foreground/70",
    visual: <QualityInspection />,
  },
  {
    tone: "bg-primary text-primary-foreground",
    muted: "text-primary-foreground/75",
    visual: <OneLine />,
  },
];

// Phones get a plain list: a pinned panel taller than the screen would hide its own bottom half.
const WIDE = "(min-width: 640px)";
function useWide() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(WIDE);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(WIDE).matches,
    () => true,
  );
}

function Panel({ i, progress, reduce }: { i: number; progress: MotionValue<number>; reduce: boolean }) {
  const p = PANELS[i];
  const copy = COPY[useLang()][i];
  const n = PANELS.length;
  // once the next panel starts covering this one, step it back; the last panel never recedes
  const start = (i + 1) / n;
  const scale = useTransform(progress, [start - 1 / n, start, 1], [1, 1, 1 - (n - 1 - i) * 0.035]);
  const transform = useTransform(scale, (v) => `scale(${v})`);
  const dim = useTransform(progress, [start - 1 / n, start, 1], [0, 0, i === n - 1 ? 0 : 0.35]);

  return (
    <li className="sm:sticky" style={{ top: `calc(6rem + ${i * 1.25}rem)` }}>
      <motion.article
        style={reduce ? undefined : { transform, transformOrigin: "50% 0%" }}
        className={cn("relative overflow-hidden rounded-[2rem] border border-(--line) shadow-[0_-12px_40px_rgb(0_0_0/0.35)]", p.tone)}
      >
        <div className="grid min-h-[26rem] gap-8 p-6 sm:p-10 lg:grid-cols-12 lg:items-center lg:gap-12 lg:p-14">
          <div className="lg:col-span-6">
            <span className={cn("font-mono text-sm", i === n - 1 ? "text-primary-foreground/70" : "text-primary")}>
              {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
            </span>
            <h4 className="text-fluid-2xl mt-5 leading-[0.98] font-semibold tracking-[-0.04em]">{copy.t}</h4>
            <p className={cn("text-fluid-base mt-5 max-w-md", p.muted)}>{copy.d}</p>
          </div>
          <div aria-hidden className="lg:col-span-5 lg:col-start-8">
            {p.visual}
          </div>
        </div>
        {!reduce && <motion.div aria-hidden style={{ opacity: dim }} className="pointer-events-none absolute inset-0 bg-[#040806]" />}
      </motion.article>
    </li>
  );
}

export function ReasonStack() {
  const ref = useRef<HTMLOListElement>(null);
  const wide = useWide();
  const reduce = useReducedMotionSafe() || !wide;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 96px", "end end"] });

  return (
    <ol ref={ref} className="relative space-y-6 pb-8">
      {PANELS.map((_, i) => (
        <Panel key={i} i={i} progress={scrollYProgress} reduce={reduce} />
      ))}
    </ol>
  );
}

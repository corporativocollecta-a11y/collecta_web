"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import {
  Cpu,
  Eye,
  PackageCheck,
  ScanLine,
  Snowflake,
  Sprout,
  Tractor,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/components/lang-provider";
import type { Copy } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ICONS: LucideIcon[] = [Sprout, Cpu, Eye, Tractor, PackageCheck, ScanLine, Snowflake, Building2];

/* one entry per ICONS slot, same order */
const T: Copy<{ label: string; stages: { name: string; tag: string }[] }> = {
  en: {
    label: "The full operating flow — COS monitors every stage",
    stages: [
      { name: "Field", tag: "Inputs" },
      { name: "Technology", tag: "Precision" },
      { name: "Supervision", tag: "Control" },
      { name: "Harvest", tag: "Quality" },
      { name: "Packing", tag: "Food safety" },
      { name: "Traceability", tag: "Verifiable" },
      { name: "Logistics", tag: "Cold chain" },
      { name: "Buyer", tag: "B2B" },
    ],
  },
  es: {
    label: "Flujo operativo completo — COS monitorea cada etapa",
    stages: [
      { name: "Campo", tag: "Insumos" },
      { name: "Tecnología", tag: "Precisión" },
      { name: "Supervisión", tag: "Control" },
      { name: "Cosecha", tag: "Calidad" },
      { name: "Empaque", tag: "Inocuidad" },
      { name: "Trazabilidad", tag: "Verificable" },
      { name: "Logística", tag: "Cadena de frío" },
      { name: "Cliente", tag: "B2B" },
    ],
  },
};

export function Pipeline() {
  const t = T[useLang()];
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 45%"] });
  const [active, setActive] = useState(-1);
  const scaleX = useTransform(scrollYProgress, [0, 1], ["scaleX(0)", "scaleX(1)"]);
  const scaleY = useTransform(scrollYProgress, [0, 1], ["scaleY(0)", "scaleY(1)"]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(ICONS.length - 1, Math.floor(v * ICONS.length)));
  });

  return (
    <div className="relative">
      <p className="eyebrow mb-8 flex items-center gap-2">
        <span className="live-dot" /> {t.label}
      </p>
      <ol ref={ref} className="relative grid grid-cols-1 gap-0 md:grid-cols-4 lg:grid-cols-8">
        {/* rail */}
        <div aria-hidden className="absolute top-0 bottom-0 left-[1.375rem] w-px bg-(--line) lg:top-[1.375rem] lg:right-0 lg:bottom-auto lg:left-0 lg:h-px lg:w-auto md:hidden lg:block" />
        <motion.div
          aria-hidden
          style={{ transform: scaleY }}
          className="absolute top-0 bottom-0 left-[1.375rem] w-px origin-top bg-primary md:hidden"
        />
        <motion.div
          aria-hidden
          style={{ transform: scaleX }}
          className="absolute top-[1.375rem] right-0 left-0 hidden h-px origin-left bg-primary lg:block"
        />
        {t.stages.map(({ name, tag }, i) => {
          const Icon = ICONS[i];
          const on = i <= active;
          return (
            <li key={i} className="relative flex gap-4 pb-8 lg:flex-col lg:pr-4 lg:pb-0">
              <span
                className={cn(
                  "relative z-10 grid size-11 shrink-0 place-items-center rounded-full border transition-[background-color,border-color,color] duration-300 ease-(--ease-out)",
                  on ? "border-primary bg-primary text-primary-foreground" : "border-(--line) bg-background text-foreground/60",
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <span className="eyebrow">{String(i + 1).padStart(2, "0")}</span>
                <p className={cn("mt-1 text-lg font-medium tracking-tight transition-colors duration-300", on ? "text-foreground" : "text-foreground/50")}>
                  {name}
                </p>
                <p className="text-sm text-muted-foreground">{tag}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

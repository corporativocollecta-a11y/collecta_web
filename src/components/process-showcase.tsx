"use client";

import Image from "next/image";
import { CalendarClock, Droplets, Eye, MapPin, Package, Route, Snowflake, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { useLang } from "@/components/lang-provider";
import type { Copy, Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* "Proceso operativo de abastecimiento" as three framed stations over a blurred field:
   planning is a COS screen drawn in code, origin and delivery are photographs with
   targeting tags laid over them. Spanish copy is the live site's, verbatim. */

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

type Tag = { x: number; y: number; label: Copy<string>; Icon: LucideIcon; side?: "left" | "right" };

const STEPS: { t: Copy<string>; d: Copy<string>; img?: string; alt?: Copy<string>; tags?: Tag[] }[] = [
  {
    t: { en: "Commercial planning", es: "Planeación comercial" },
    d: {
      en: "We define products, volumes, sizes, specs and delivery windows to give your supply a clear structure.",
      es: "Definimos productos, volúmenes, calibres, especificaciones y ventanas de entrega para estructurar el abasto.",
    },
    img: "/images/proceso/planeacion-surtido.jpg",
    alt: {
      en: "Broccoli, green beans, carrots, cauliflower, tomatoes and other vegetables laid out on a planning table",
      es: "Brócoli, ejote, zanahoria, coliflor, jitomate y otras hortalizas ordenadas sobre una mesa de planeación",
    },
    tags: [
      { x: 17, y: 25, label: { en: "Broccoli · 1,200 cs", es: "Brócoli · 1,200 cj" }, Icon: Package },
      { x: 71, y: 47, label: { en: "W39 · Thursday delivery", es: "S39 · entrega jueves" }, Icon: CalendarClock, side: "left" },
      { x: 56, y: 79, label: { en: "Tomatoes · 500 cs", es: "Jitomate · 500 cj" }, Icon: Package, side: "left" },
    ],
  },
  {
    t: { en: "Execution at origin", es: "Ejecución en origen" },
    d: {
      en: "We select plots, assign production, and put technical supervision and technology to work in the field.",
      es: "Seleccionamos parcelas, asignamos producción e integramos supervisión técnica y tecnología en campo.",
    },
    img: "/images/proceso/campo-coronas.jpg",
    alt: {
      en: "Broccoli plants with their crowns in a furrow at sunset",
      es: "Plantas de brócoli con sus coronas en un surco al atardecer",
    },
    tags: [
      { x: 54, y: 18, label: { en: "Plot P-07", es: "Parcela P-07" }, Icon: MapPin },
      { x: 29, y: 46, label: { en: "Technical supervision", es: "Supervisión técnica" }, Icon: Eye },
      { x: 80, y: 78, label: { en: "Humidity 68%", es: "Humedad 68%" }, Icon: Droplets, side: "left" },
    ],
  },
  {
    t: { en: "Packing and delivery", es: "Empaque y entrega" },
    d: {
      en: "We coordinate packing, the cold chain and shipping to the agreed delivery point.",
      es: "Coordinamos empaque, cadena de frío y envío al punto de entrega acordado.",
    },
    img: "/images/proceso/empaque-hielo.jpg",
    alt: {
      en: "Broccoli crowns packed in a box under a layer of crushed ice",
      es: "Coronas de brócoli empacadas en caja bajo una capa de hielo picado",
    },
    tags: [
      { x: 60, y: 24, label: { en: "22 ct · BRC-2291", es: "22 ct · BRC-2291" }, Icon: Package, side: "left" },
      { x: 24, y: 70, label: { en: "1 °C steady", es: "1 °C constante" }, Icon: Snowflake },
      { x: 88, y: 46, label: { en: "Via Reynosa", es: "Vía Reynosa" }, Icon: Route, side: "left" },
    ],
  },
];

const T: Copy<{ eyebrow: string; h3: [string, string, string] }> = {
  en: { eyebrow: "How we work", h3: ["Our operating process for ", "sourcing", ""] },
  es: { eyebrow: "Cómo trabajamos", h3: ["Proceso operativo de ", "abastecimiento", ""] },
};

function Corners() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {["-top-px -left-px border-t-2 border-l-2", "-top-px -right-px border-t-2 border-r-2", "-bottom-px -left-px border-b-2 border-l-2", "-right-px -bottom-px border-r-2 border-b-2"].map((c) => (
        <span key={c} className={cn("absolute size-4 border-foreground/85", c)} />
      ))}
    </span>
  );
}

function TagLayer({ tags, reduce, lang }: { tags: Tag[]; reduce: boolean; lang: Lang }) {
  return (
    <>
      {tags.map((g, i) => (
        <motion.div
          key={g.label[lang]}
          className="absolute"
          style={{ left: `${g.x}%`, top: `${g.y}%` }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.35 + i * 0.16 }}
        >
          {/* target: a small square that locks onto the point */}
          <motion.span
            aria-hidden
            className="absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-[3px] border border-primary"
            initial={{ transform: reduce ? "scale(1)" : "scale(1.6)" }}
            whileInView={{ transform: "scale(1)" }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.35 + i * 0.16 }}
          >
            <span className="absolute inset-[6px] rounded-full bg-primary" />
          </motion.span>
          <span
            className={cn(
              "absolute top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-md border border-white/15 bg-[#0b120d]/75 px-2 py-1 font-mono text-[10px] whitespace-nowrap text-foreground/90 backdrop-blur-sm",
              g.side === "left" ? "right-4" : "left-4",
            )}
          >
            <g.Icon className="size-3 text-primary" aria-hidden />
            {g.label[lang]}
          </span>
        </motion.div>
      ))}
    </>
  );
}

export function ProcessShowcase({ cta }: { cta: ReactNode }) {
  const reduce = !!useReducedMotion();
  const lang = useLang();
  const tx = T[lang];

  return (
    <div className="relative isolate overflow-hidden rounded-[2rem] border border-(--line)">
      <Image src="/images/proceso/fondo-campo.jpg" alt="" fill sizes="100vw" className="-z-20 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(11_18_13/0.35),rgb(11_18_13/0.8))]" />

      <div className="px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-sm border border-dashed border-foreground/30 px-2.5 py-1 font-mono text-[11px] tracking-[0.14em] text-foreground/80 uppercase">
              <span className="size-1.5 bg-primary" aria-hidden /> {tx.eyebrow}
            </p>
            <h3 className="text-fluid-2xl mt-5 max-w-xl leading-[1.02] font-semibold tracking-[-0.035em]">
              {tx.h3[0]}<span className="serif-em text-primary">{tx.h3[1]}</span>{tx.h3[2]}
            </h3>
          </div>
          {cta}
        </div>

        <ol className="mt-10 grid gap-4 md:grid-cols-3 lg:mt-12 lg:gap-5">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.t.es}
              className="relative flex flex-col border border-white/15 bg-[#0b120d]/35 p-4 backdrop-blur-[2px] sm:p-5"
              initial={{ opacity: 0, transform: reduce ? "none" : "translateY(18px)" }}
              whileInView={{ opacity: 1, transform: "translateY(0px)" }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: i * 0.08 }}
            >
              <Corners />
              <span className="font-mono text-xs text-foreground/70">[{String(i + 1).padStart(2, "0")}]</span>
              <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-sm border border-white/10">
                {s.img ? (
                  <>
                    <Image src={s.img} alt={s.alt?.[lang] ?? ""} fill sizes="(min-width: 768px) 30vw, 100vw" className="object-cover" />
                    <div aria-hidden className="absolute inset-0 bg-[#0b120d]/15" />
                    {s.tags && <TagLayer tags={s.tags} reduce={reduce} lang={lang} />}
                  </>
                ) : null}
              </div>
              <h4 className="mt-6 text-lg font-medium tracking-tight">{s.t[lang]}</h4>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70">{s.d[lang]}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </div>
  );
}

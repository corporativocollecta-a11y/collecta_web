"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Copy, Lang } from "@/lib/i18n";

/* Section 05 opener: the intro, then the three producer benefits as photo cards in a
   centred carousel (after a social-media showcase the user sent): the selected card sits
   in the middle, larger and lit, with its text inside the photo; the other two wait at the
   sides, smaller and dimmed. Tap a side card, an arrow or a dot to bring it forward; it
   also advances on its own while in view. Copy is the live site's, verbatim. */

type Gain = { t: string; d: string };
type Card = { t: string; d: string; src: string; alt: string; pos: string; gains: Gain[] };
type CardText = { t: string; d: string; alt: string };

/* "Lo que ganas siendo socio" (live-site copy, verbatim) folded into the step it comes from. */
const G = {
  insumos: {
    en: { t: "Inputs without debt", d: "Steady access to farm inputs, with no finance charges and no debt." },
    es: { t: "Insumos sin deuda", d: "Acceso continuo a insumos agrícolas sin cargos financieros ni endeudamiento." },
  },
  crecimiento: {
    en: { t: "Steady growth", d: "More acreage planted, season after season." },
    es: { t: "Crecimiento sostenido", d: "Más superficie de siembra, ciclo tras ciclo." },
  },
  mercados: {
    en: { t: "Competitive markets", d: "Your crop reaches high-value channels and demanding buyers." },
    es: { t: "Mercados competitivos", d: "Tu producción llega a canales de alto valor y clientes exigentes." },
  },
  pagos: {
    en: { t: "Transparent payments", d: "Clear, on-time settlements you can verify at every harvest." },
    es: { t: "Pagos transparentes", d: "Liquidaciones claras, a tiempo y verificables en cada cosecha." },
  },
  operacion: {
    en: { t: "Integrated operation", d: "Production and finances run together, under one orderly operation." },
    es: { t: "Operación integrada", d: "Producción y finanzas bajo una sola gestión ordenada." },
  },
} satisfies Record<string, Copy<Gain>>;

const CARDS: (Pick<Card, "src" | "pos"> & { copy: Copy<CardText>; gains: Copy<Gain>[] })[] = [
  {
    copy: {
      en: {
        t: "Support to produce",
        d: "We give growers resources to strengthen and increase their production in the field.",
        alt: "A tray of broccoli seedlings being handed over: four hands hold it at the edge of the field",
      },
      es: {
        t: "Apoyo para producir",
        d: "Brindamos recursos al agricultor para fortalecer y aumentar su producción en campo.",
        alt: "Entrega de una charola de plántula de brócoli: cuatro manos la sostienen a la orilla del campo",
      },
    },
    src: "/images/productores/entrega-charola-v2.jpg",
    pos: "50% 82%",
    gains: [G.insumos, G.crecimiento],
  },
  {
    copy: {
      en: {
        t: "Technical support and technology in the field",
        d: "We back the work in the field with follow-up and tools that cut down on failures during production.",
        alt: "A grower and a technician check a broccoli plant on a tablet while a drone flies over the field",
      },
      es: {
        t: "Acompañamiento y tecnología en campo",
        d: "Respaldamos el trabajo en campo con seguimiento y herramientas para reducir fallas durante la producción.",
        alt: "Productor y técnico revisan una planta de brócoli con una tableta mientras un dron sobrevuela el campo",
      },
    },
    src: "/images/productores/acompanamiento-dron.jpg",
    pos: "50% 48%",
    gains: [G.operacion],
  },
  {
    copy: {
      en: {
        t: "Sales in high-value markets",
        d: "We place the crop in export markets to protect the value of every harvest.",
        alt: "A grower's hands hold a head of broccoli in front of a refrigerated truck with boxes ready for export",
      },
      es: {
        t: "Venta en mercados de alto valor",
        d: "Colocamos la producción en mercados de exportación para cuidar el valor de cada cosecha.",
        alt: "Manos de un productor sostienen una corona de brócoli frente a un camión refrigerado con cajas listas para exportación",
      },
    },
    src: "/images/productores/venta-corona.jpg",
    pos: "50% 66%",
    gains: [G.mercados, G.pagos],
  },
];

/* the section's own copy: intro, heading and the carousel controls */
const T: Copy<{
  eyebrow: string;
  h2: [string, string];
  intro: string;
  cta: string;
  benefits: string;
  carousel: string;
  slide: string;
  of: string;
  gainsLabel: string;
  prev: string;
  next: string;
  show: string;
}> = {
  en: {
    eyebrow: "[05] For small and mid-sized growers",
    h2: ["Grow", "without going into debt"],
    intro:
      "At Collecta we want a serious, clear, long-term relationship with every grower. We're looking for growers who want to strengthen their work in the field and grow.",
    cta: "Become a partner",
    benefits: "Benefits for growers",
    carousel: "carousel",
    slide: "slide",
    of: "of",
    gainsLabel: "What you gain as a partner",
    prev: "Previous benefit",
    next: "Next benefit",
    show: "Show",
  },
  es: {
    eyebrow: "[05] Para pequeños y medianos productores",
    h2: ["Crecer", "sin endeudarse"],
    intro:
      "En Collecta queremos una relación seria, clara y de largo plazo con cada agricultor. Buscamos productores que quieran fortalecer su trabajo en campo y crecer.",
    cta: "Quiero ser socio",
    benefits: "Beneficios para el productor",
    carousel: "carrusel",
    slide: "diapositiva",
    of: "de",
    gainsLabel: "Lo que ganas siendo socio",
    prev: "Beneficio anterior",
    next: "Siguiente beneficio",
    show: "Ver",
  },
};
const N = CARDS.length;
const HOLD_MS = 5200;
const SIDE_SCALE = 0.74;

export function ProducerCarousel({ lang }: { lang: Lang }) {
  const t = T[lang];
  const cards: Card[] = CARDS.map(({ copy, gains, ...c }) => ({
    ...c,
    ...copy[lang],
    gains: gains.map((g) => g[lang]),
  }));
  const reduce = useReducedMotion() ?? false;
  const stage = useRef<HTMLDivElement>(null);
  const inView = useInView(stage, { amount: 0.4 });
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [gain, setGain] = useState<string | null>(null); // gain shown in the glass box

  useEffect(() => {
    if (!inView || paused || reduce) return; // no auto-advance under reduced motion
    const id = window.setTimeout(() => {
      setGain(null);
      setActive((a) => (a + 1) % N);
    }, HOLD_MS);
    return () => window.clearTimeout(id);
  }, [inView, paused, active, reduce]);

  const go = (i: number) => {
    setGain(null);
    setActive(((i % N) + N) % N);
  };

  // swipe on touch screens
  const startX = useRef<number | null>(null);
  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") startX.current = e.clientX;
  };
  const onUp = (e: PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
  };

  return (
    <div className="pt-16 sm:pt-20">
      {/* Intro */}
      <div className="page-col">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            <p className="eyebrow text-foreground/80">{t.eyebrow}</p>
            <h2 className="text-fluid-3xl mt-5 leading-[0.9] font-semibold tracking-[-0.05em]">
              {t.h2[0]} <span className="serif-em text-primary">{t.h2[1]}</span>
            </h2>
          </div>
          {/* top of the paragraph lines up with the top of "Crecer" (eyebrow + gap above the h2) */}
          <div className="lg:col-span-5 lg:pt-[3.1rem]">
            <p className="text-fluid-base max-w-lg text-foreground/80">
              {t.intro}
            </p>
            <a
              href="#contacto"
              className="press group mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-medium text-primary-foreground hover:bg-[#b3e083]"
            >
              {t.cta}
              <ArrowRight className="size-4 transition-transform duration-200 ease-(--ease-out) group-hover:translate-x-0.5" aria-hidden />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-14 page-col lg:mt-20">
        <h3 className="eyebrow">{t.benefits}</h3>

        <div
          ref={stage}
          role="region"
          aria-roledescription={t.carousel}
          aria-label={t.benefits}
          className="relative mt-6 h-[36rem] touch-pan-y sm:h-[34rem] lg:h-[38rem]"
          onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          onPointerDown={onDown}
          onPointerUp={onUp}
        >
          {cards.map((c, i) => {
            // slot: -1 left, 0 centre, 1 right
            const slot = ((i - active + N + 1) % N) - 1;
            const on = slot === 0;
            return (
              <article
                key={c.t}
                aria-roledescription={t.slide}
                aria-label={`${i + 1} ${t.of} ${N}: ${c.t}`}
                onClick={() => !on && go(i)}
                className={cn(
                  "absolute top-0 left-1/2 h-full w-[80%] overflow-hidden rounded-[1.75rem] border sm:w-[62%] lg:w-[46%]",
                  on ? "z-20 border-primary/40" : "z-10 cursor-pointer border-(--line)",
                )}
                style={{
                  transform: `translateX(calc(-50% + ${slot * (reduce ? 104 : 90)}%)) scale(${on ? 1 : SIDE_SCALE})`,
                  opacity: on ? 1 : 0.5,
                  transition: reduce
                    ? "opacity 300ms var(--ease-out)"
                    : "transform 500ms var(--ease-in-out), opacity 400ms var(--ease-out), border-color 250ms var(--ease-out)",
                }}
              >
                <Image src={c.src} alt={c.alt} fill sizes="(min-width: 1024px) 46vw, 80vw" className="object-cover" style={{ objectPosition: c.pos }} />
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgb(11_18_13/0.45)_0%,rgb(11_18_13/0)_28%,rgb(11_18_13/0)_45%,rgb(11_18_13/0.88)_100%)]" />

                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5 sm:p-6">
                  <span className="font-mono text-xs text-foreground/90">{String(i + 1).padStart(2, "0")} / 0{N}</span>
                  <Image src="/images/isotipo.png" alt="" width={40} height={24} style={{ width: "auto" }} className="h-6 w-auto opacity-85 brightness-0 invert" />
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                  <h4 className="serif-em text-[2rem] leading-[1] text-foreground sm:text-[2.5rem] lg:text-[2.75rem]">{c.t}</h4>
                  <div
                    className={cn(
                      "mt-4 rounded-2xl border border-foreground/15 bg-[rgb(11_18_13/0.55)] p-4 backdrop-blur-md transition-opacity duration-300 ease-(--ease-out)",
                      on ? "opacity-100" : "pointer-events-none opacity-0",
                    )}
                  >
                    {(() => {
                      const g = on ? c.gains.find((x) => x.t === gain) : undefined;
                      return (
                        <p aria-live="polite" className="min-h-[3em] text-sm leading-relaxed text-foreground/85 sm:text-[0.95rem]">
                          {g ? g.d : c.d}
                        </p>
                      );
                    })()}
                    <div className="mt-3 border-t border-foreground/10 pt-3">
                      <p className="sr-only">{t.gainsLabel}</p>
                      <ul className="flex flex-wrap gap-1.5">
                        {c.gains.map((g) => {
                          const sel = on && gain === g.t;
                          return (
                            <li key={g.t}>
                              <button
                                type="button"
                                tabIndex={on ? 0 : -1}
                                aria-pressed={sel}
                                onPointerEnter={(e) => e.pointerType === "mouse" && setGain(g.t)}
                                onPointerLeave={(e) => e.pointerType === "mouse" && setGain(null)}
                                onFocus={() => setGain(g.t)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setGain((cur) => (cur === g.t ? null : g.t));
                                }}
                                className={cn(
                                  "press inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-[background-color,border-color,color] duration-200 ease-(--ease-out)",
                                  sel ? "border-primary bg-primary text-primary-foreground" : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
                                )}
                              >
                                {g.t}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Controls */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label={t.prev}
            onClick={() => go(active - 1)}
            className="press grid size-11 place-items-center rounded-full border border-(--line) text-foreground/80 hover:border-foreground/30 hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          <div className="flex items-center gap-2">
            {cards.map((c, i) => (
              <button
                key={c.t}
                type="button"
                aria-label={`${t.show} ${c.t}`}
                aria-current={i === active ? "true" : undefined}
                onClick={() => go(i)}
                className="press grid size-6 place-items-center"
              >
                <span
                  className={cn(
                    "block h-1.5 w-6 rounded-full transition-[transform,background-color] duration-300 ease-(--ease-out)",
                    i === active ? "bg-primary" : "bg-foreground/30",
                  )}
                  style={{ transform: i === active ? "scaleX(1)" : "scaleX(0.25)" }}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label={t.next}
            onClick={() => go(active + 1)}
            className="press grid size-11 place-items-center rounded-full border border-(--line) text-foreground/80 hover:border-foreground/30 hover:text-foreground"
          >
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

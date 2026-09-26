"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import {
  ArrowRight,
  Cpu,
  Droplets,
  HandCoins,
  Link2,
  Sprout,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImpactVisual } from "@/components/impact-visuals";
import { useLang } from "@/components/lang-provider";
import type { Copy } from "@/lib/i18n";

/* Section 06 (after Eloqwnt, "UI Cards Animations For Booking Platform", Dribbble 25049627):
   one stack where a single card is open and the rest sit collapsed as pills above and
   below it. Opening the next item folds the current card into a pill and grows the next
   one in its place, so five problem → action pairs fit in one screen. The last item is
   the ageing of the people who farm, answered by all five actions at once.
   Copy is the live site's, verbatim. Visuals are drawn in code and carry no figures. */

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const HOLD_MS = 6000;

type Text = { t: string; d?: string; p: string }; // p: its "Por qué ahora" problem, kept for reference; only item 06 shows it
type Item = { k: string; Icon: LucideIcon } & Text;

const ITEMS: { k: string; Icon: LucideIcon; copy: Copy<Text> }[] = [
  {
    k: "01",
    Icon: HandCoins,
    copy: {
      en: {
        t: "We invest in making farms more productive",
        d: "We back high-potential growers who still work with too few resources to scale up and improve their living conditions.",
        p: "Little access to credit and crop insurance",
      },
      es: {
        t: "Invertimos en el desarrollo productivo del campo",
        d: "Fortalecemos a productores con alto potencial que todavía operan con recursos insuficientes para escalar y mejorar sus condiciones de vida.",
        p: "Poco acceso a crédito y seguro agrícola",
      },
    },
  },
  {
    k: "02",
    Icon: Cpu,
    copy: {
      en: {
        t: "We bring precision technology with a purpose",
        d: "We close the technology gap that keeps growers from working with better tools and making better decisions.",
        p: "Limited technology adoption across the sector",
      },
      es: {
        t: "Llevamos tecnología de precisión con propósito",
        d: "Cerramos la brecha tecnológica que le impide al productor trabajar con mejores herramientas y tomar mejores decisiones.",
        p: "Adopción tecnológica limitada en el sector",
      },
    },
  },
  {
    k: "03",
    Icon: Droplets,
    copy: {
      en: {
        t: "We shrink the environmental footprint",
        d: "Less food waste, more precise water use and fewer unnecessary agrochemicals.",
        p: "More food waste and more water stress",
      },
      es: {
        t: "Reducimos la huella ambiental",
        d: "Menos desperdicio de alimentos, uso más preciso del agua y menos agroquímicos innecesarios.",
        p: "Más desperdicio de alimentos y más estrés hídrico",
      },
    },
  },
  {
    k: "04",
    Icon: Sprout,
    copy: {
      en: {
        t: "We bring growers closer to sustainable practices",
        d: "We lower the environmental impact of farming and build an agricultural base that holds up over the long term.",
        p: "Food sovereignty is a national priority",
      },
      es: {
        t: "Acercamos al productor a prácticas sostenibles",
        d: "Bajamos el impacto ambiental de la producción y construimos una base agrícola que aguante el largo plazo.",
        p: "La soberanía alimentaria es prioridad nacional",
      },
    },
  },
  {
    k: "05",
    Icon: Link2,
    copy: {
      en: {
        t: "We bring order to a supply chain that has always been fragmented",
        d: "A traceable, connected supply chain, with more value for what growers produce and better conditions for getting quality food to market.",
        p: "Investment in agro-industrial processing is growing",
      },
      es: {
        t: "Ordenamos una cadena históricamente fragmentada",
        d: "Una cadena trazable y articulada, con más valor para la producción y mejores condiciones para llevar alimentos de calidad al mercado.",
        p: "Crece la inversión en transformación agroindustrial",
      },
    },
  },
  {
    k: "06",
    Icon: Users,
    copy: {
      en: {
        t: "We make farming worth it",
        d: "The farmers who work the land are aging. When farming pays, the next generation comes on its own.",
        p: "The farmers who work the land are aging",
      },
      es: {
        t: "Hacemos que producir valga la pena",
        d: "Los agricultores responsables del campo están envejeciendo. Cuando el campo es rentable, el relevo llega solo.",
        p: "Los agricultores responsables del campo están envejeciendo",
      },
    },
  },
];

/* list label and the open card's button */
const T: Copy<{ list: string; next: string; restart: string }> = {
  en: { list: "Why now, and where we make real change", next: "Next", restart: "Back to start" },
  es: { list: "Por qué ahora y dónde generamos cambio real", next: "Siguiente", restart: "Volver al inicio" },
};
const N = ITEMS.length;

export function ImpactStack() {
  const lang = useLang();
  const items: Item[] = ITEMS.map(({ copy, ...it }) => ({ ...it, ...copy[lang] }));
  const reduce = useReducedMotion() ?? false;
  const stage = useRef<HTMLDivElement>(null);
  const inView = useInView(stage, { amount: 0.5 });
  // drawings only start once the section is on screen, so the first story is seen
  const seen = useInView(stage, { amount: 0.4, once: true });
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!inView || paused || reduce) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % N), HOLD_MS);
    return () => window.clearTimeout(id);
  }, [inView, paused, active, reduce]);

  const layoutT = reduce
    ? { duration: 0 }
    : { type: "spring" as const, duration: 0.55, bounce: 0 };

  return (
    <div
      ref={stage}
      className="relative flex min-h-[46rem] items-center sm:min-h-[42rem] lg:min-h-[41rem]"
      onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* soft lime glow behind the open card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[6%] top-1/2 h-3/4 -translate-y-1/2 rounded-full bg-primary/[0.13] blur-[90px]"
      />

      <LayoutGroup>
        <ol
          className="relative flex w-full min-w-0 flex-col items-center gap-2"
          aria-label={T[lang].list}
        >
          {items.map((it, i) => {
            const open = i === active;
            const dist = Math.abs(i - active);
            return (
              <motion.li
                key={it.k}
                layout
                transition={{ layout: layoutT }}
                className={cn(
                  "relative w-full overflow-hidden",
                  open
                    ? "z-10 max-w-[44rem] rounded-[1.75rem] border border-transparent shadow-[0_40px_100px_-30px_rgb(159_211_106/0.3),0_20px_40px_-20px_rgb(0_0_0/0.8)] [background:radial-gradient(120%_80%_at_50%_0%,rgb(159_211_106/0.18),transparent_60%)_padding-box,linear-gradient(#0e1611,#0e1611)_padding-box,linear-gradient(180deg,rgb(159_211_106/0.6),rgb(159_211_106/0.12)_55%,rgb(238_235_227/0.08))_border-box]"
                    : "group/pill rounded-full border border-(--line) shadow-[inset_0_1px_0_rgb(238_235_227/0.06)] transition-[translate,border-color] duration-200 ease-(--ease-out) hover:-translate-y-px hover:border-primary/40",
                )}
                style={
                  open
                    ? { borderRadius: 28 }
                    : {
                        borderRadius: 999,
                        // pills taper away from the open card, like a lens
                        maxWidth: `${38 - (dist - 1) * 2.5}rem`,
                        // the neighbours catch the card's glow on the side facing it
                        background:
                          dist <= 2
                            ? `radial-gradient(70% 180% at 50% ${i < active ? 140 + (dist - 1) * 10 : -40 - (dist - 1) * 10}%, rgb(159 211 106 / ${dist === 1 ? 0.32 : 0.12}), transparent 70%), #111a14`
                            : "#111a14",
                      }
                }
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {open ? (
                    <motion.div
                      key="card"
                      layout="position"
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: 1,
                        transition: {
                          duration: 0.35,
                          ease: EASE_OUT,
                          delay: reduce ? 0 : 0.12,
                        },
                      }}
                      exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    >
                      <OpenCard
                        item={it}
                        i={i}
                        onNext={() => setActive((a) => (a + 1) % N)}
                        reduce={reduce}
                        seen={seen}
                      />
                    </motion.div>
                  ) : (
                    <motion.button
                      key="pill"
                      layout="position"
                      type="button"
                      onClick={() => setActive(i)}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: 1,
                        transition: {
                          duration: 0.25,
                          ease: EASE_OUT,
                          delay: reduce ? 0 : 0.1,
                        },
                      }}
                      exit={{ opacity: 0, transition: { duration: 0.1 } }}
                      className={cn(
                        "press flex h-12 w-full items-center gap-3 pr-5 pl-2 text-left text-sm transition-colors duration-200 ease-(--ease-out) hover:text-foreground",
                        dist === 1
                          ? "text-foreground/80"
                          : dist === 2
                            ? "text-foreground/60"
                            : "text-foreground/45",
                      )}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-full border border-primary/25 bg-primary/10 transition-colors duration-200 ease-(--ease-out) group-hover/pill:bg-primary/20">
                        <it.Icon
                          className="size-3.5 text-primary"
                          aria-hidden
                        />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{it.t}</span>
                      <span className="font-mono text-xs text-foreground/45">
                        {it.k}
                      </span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ol>
      </LayoutGroup>
    </div>
  );
}

function OpenCard({
  item,
  i,
  onNext,
  reduce,
  seen,
}: {
  item: Item;
  i: number;
  onNext: () => void;
  reduce: boolean;
  seen: boolean;
}) {
  const lang = useLang();
  const last = i === N - 1;
  const C = 2 * Math.PI * 15;
  return (
    <div className="p-5 sm:p-7">
      {/* top row: mode, step ring, next */}
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-3 text-sm text-foreground/80">
          <span className="grid size-10 place-items-center rounded-full border border-primary/35 bg-primary/12">
            <item.Icon className="size-4 text-primary" aria-hidden />
          </span>
        </p>
        <div className="flex items-center gap-2.5">
          <svg
            viewBox="0 0 36 36"
            className="size-10 -rotate-90 max-sm:hidden"
            aria-hidden
          >
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="rgb(238 235 227 / 0.12)"
              strokeWidth="2"
            />
            <motion.circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="#9fd36a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C * (1 - i / N) }}
              animate={{ strokeDashoffset: C * (1 - (i + 1) / N) }}
              transition={{
                duration: reduce ? 0 : 0.7,
                ease: EASE_OUT,
                delay: 0.2,
              }}
            />
            <text
              x="18"
              y="18"
              dy="3.5"
              textAnchor="middle"
              className="rotate-90 fill-foreground font-mono text-[9px]"
              style={{ transformOrigin: "18px 18px" }}
            >
              {item.k}
            </text>
          </svg>
          <button
            type="button"
            onClick={onNext}
            className="press inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-[#b3e083]"
          >
            {last ? T[lang].restart : T[lang].next}
            <ArrowRight className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>

      {/* same layout for every card; 06 is the closing one */}
      <>
        <Rise d={0.12} reduce={reduce} className="mt-6">
          <h3 className="text-fluid-xl max-w-[34rem] leading-[1.05] font-semibold tracking-[-0.03em] text-balance">
            {item.t}
          </h3>
        </Rise>
        <div className="mt-6 grid gap-5 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] sm:items-center">
          <Rise d={0.24} reduce={reduce}>
            <p className="border-l-2 border-primary/70 pl-4 text-sm leading-relaxed text-foreground/70">
              {item.d}
            </p>
          </Rise>
          <Rise d={0.3} reduce={reduce}>
            <Panel>
              {seen ? <ImpactVisual i={i} /> : <div className="h-32" />}
            </Panel>
          </Rise>
        </div>
      </>
    </div>
  );
}

/* Card content enters in a short stagger (60ms apart); reduced motion keeps the fade only. */
function Rise({
  d,
  reduce,
  className,
  children,
}: {
  d: number;
  reduce: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, transform: reduce ? "none" : "translateY(8px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={{ duration: 0.4, ease: EASE_OUT, delay: d }}
    >
      {children}
    </motion.div>
  );
}

/* A dark inset screen with a fine grid, so the drawing reads as an instrument. */
function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-(--line) bg-[#0a110c] bg-[linear-gradient(to_right,rgb(238_235_227/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(238_235_227/0.04)_1px,transparent_1px)] bg-[size:16px_16px] px-3 py-2 shadow-[inset_0_1px_0_rgb(238_235_227/0.05)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

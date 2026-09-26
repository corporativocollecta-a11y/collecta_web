"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion";
import { useLang } from "@/components/lang-provider";
import type { Copy } from "@/lib/i18n";

/* "Alineación global": the 17 SDGs as one huge wheel rising from the bottom of the
   section, turning left as the page scrolls, so each goal passes the top in turn.
   The six Collecta contributes to keep their official colour; the other eleven sit on
   black. */

const STEP = 360 / 17;
const R_IN = 500;
const R_ON = 985;
const R_OFF = 940;
const ICON_R = 735;
const ICON = 200;

/* official UN goal names in each language */
const GOALS: { n: number; c: string; t: Copy<string> }[] = [
  { n: 1, c: "#e5243b", t: { en: "No Poverty", es: "Fin de la pobreza" } },
  { n: 2, c: "#dda63a", t: { en: "Zero Hunger", es: "Hambre cero" } },
  { n: 3, c: "#4c9f38", t: { en: "Good Health and Well-being", es: "Salud y bienestar" } },
  { n: 4, c: "#c5192d", t: { en: "Quality Education", es: "Educación de calidad" } },
  { n: 5, c: "#ff3a21", t: { en: "Gender Equality", es: "Igualdad de género" } },
  { n: 6, c: "#26bde2", t: { en: "Clean Water and Sanitation", es: "Agua limpia y saneamiento" } },
  { n: 7, c: "#fcc30b", t: { en: "Affordable and Clean Energy", es: "Energía asequible y no contaminante" } },
  { n: 8, c: "#a21942", t: { en: "Decent Work and Economic Growth", es: "Trabajo decente y crecimiento económico" } },
  { n: 9, c: "#fd6925", t: { en: "Industry, Innovation and Infrastructure", es: "Industria, innovación e infraestructura" } },
  { n: 10, c: "#dd1367", t: { en: "Reduced Inequalities", es: "Reducción de las desigualdades" } },
  { n: 11, c: "#fd9d24", t: { en: "Sustainable Cities and Communities", es: "Ciudades y comunidades sostenibles" } },
  { n: 12, c: "#bf8b2e", t: { en: "Responsible Consumption and Production", es: "Producción y consumo responsables" } },
  { n: 13, c: "#3f7e44", t: { en: "Climate Action", es: "Acción por el clima" } },
  { n: 14, c: "#0a97d9", t: { en: "Life Below Water", es: "Vida submarina" } },
  { n: 15, c: "#56c02b", t: { en: "Life on Land", es: "Vida de ecosistemas terrestres" } },
  { n: 16, c: "#00689d", t: { en: "Peace, Justice and Strong Institutions", es: "Paz, justicia e instituciones sólidas" } },
  { n: 17, c: "#19486a", t: { en: "Partnerships for the Goals", es: "Alianzas para lograr los objetivos" } },
];
const OURS = new Set([2, 8, 12, 13, 15, 17]);
/* the UN's own page, in the page's language, for each goal we contribute to
   (the Spanish site names the climate page "climate-change-2") */
const UN = "https://www.un.org/sustainabledevelopment";
const LINKS: Copy<Record<number, string>> = {
  en: {
    2: `${UN}/hunger/`,
    8: `${UN}/economic-growth/`,
    12: `${UN}/sustainable-consumption-production/`,
    13: `${UN}/climate-change/`,
    15: `${UN}/biodiversity/`,
    17: `${UN}/globalpartnerships/`,
  },
  es: {
    2: `${UN}/es/hunger/`,
    8: `${UN}/es/economic-growth/`,
    12: `${UN}/es/sustainable-consumption-production/`,
    13: `${UN}/es/climate-change-2/`,
    15: `${UN}/es/biodiversity/`,
    17: `${UN}/es/globalpartnerships/`,
  },
};

const T: Copy<{
  sdg: string;
  contribute: string;
  link: (n: number, t: string) => string;
  credit: [string, string];
  supports: string;
  title: string;
  body: string;
  wheel: string;
}> = {
  en: {
    sdg: "SDG",
    contribute: "· We contribute",
    link: (n, t) => `SDG ${n}, ${t}: view on the United Nations website (opens in a new tab)`,
    credit: ["Icons: United Nations, used in line with its", "usage guidelines"],
    supports: "Collecta supports the",
    title: "Sustainable Development Goals",
    body: "Our model contributes directly to 6 of the 17 United Nations SDGs.",
    wheel:
      "Wheel of the 17 Sustainable Development Goals. Collecta contributes to SDGs 2, 8, 12, 13, 15 and 17; each one links to its page on the United Nations website.",
  },
  es: {
    sdg: "ODS",
    contribute: "· Contribuimos",
    link: (n, t) => `ODS ${n}, ${t}: ver en el sitio de Naciones Unidas (se abre en otra pestaña)`,
    credit: ["Íconos: Naciones Unidas, usados conforme a sus", "directrices de uso"],
    supports: "Collecta apoya los",
    title: "Objetivos de Desarrollo Sostenible",
    body: "Nuestro modelo contribuye directamente a 6 de los 17 ODS de Naciones Unidas.",
    wheel:
      "Rueda de los 17 Objetivos de Desarrollo Sostenible. Collecta contribuye a los ODS 2, 8, 12, 13, 15 y 17; cada uno enlaza a su página en el sitio de Naciones Unidas.",
  },
};

const rad = (d: number) => (d * Math.PI) / 180;
const pt = (r: number, a: number) =>
  `${(r * Math.cos(rad(a))).toFixed(2)} ${(r * Math.sin(rad(a))).toFixed(2)}`;
function sector(a0: number, a1: number, r0: number, r1: number) {
  return `M${pt(r0, a0)} L${pt(r1, a0)} A${r1} ${r1} 0 0 1 ${pt(r1, a1)} L${pt(r0, a1)} A${r0} ${r0} 0 0 0 ${pt(r0, a0)} Z`;
}
/* centre angle of goal i (0-based) with the wheel unturned: goal 9 at the top */
const angleOf = (i: number) => -90 + (i - 8) * STEP;
/* which goal sits at the top for a given rotation */
const topAt = (rot: number) => ((Math.round(8 - rot / STEP) % 17) + 17) % 17;

const REST = -(12 - 8) * STEP; // reduced motion: goal 13 at the top
const FIRST = (8 - 1) * STEP; // goal 2 at the top
const LAST = (8 - 16) * STEP; // goal 17 at the top

export function OdsWheel() {
  const lang = useLang();
  const t = T[lang];
  const links = LINKS[lang];
  const reduce = useReducedMotion() ?? false;
  // the label is text: branch it on the hydration-safe read, or server and client disagree
  const still = useReducedMotionSafe();
  const ref = useRef<HTMLDivElement>(null);
  // progress follows the pointer at the top of the hub: 0 when it comes into view near
  // the bottom of the screen, 1 when it nears the top
  const pointer = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: pointer,
    offset: ["start 0.9", "start 0.1"],
  });
  // down the page the wheel turns left (counter-clockwise). ODS 2 sits at the top when
  // the pointer appears and holds a moment; ODS 17 arrives before it leaves.
  const rot = useTransform(
    scrollYProgress,
    [0, 0.12, 0.88, 1],
    reduce ? [REST, REST, REST, REST] : [FIRST, FIRST, LAST, LAST],
  );
  // the turn is applied straight to the element, only in the browser: the server can't
  // know the scroll position, so rendering it would mismatch on hydration
  const wheel = useRef<SVGGElement>(null);
  const [top, setTop] = useState(() => topAt(FIRST));
  const apply = (v: number) => {
    if (wheel.current) wheel.current.style.transform = `rotate(${v}deg)`;
    const t = topAt(v);
    setTop((cur) => (cur === t ? cur : t));
  };
  useMotionValueEvent(rot, "change", apply);
  // place the wheel on mount (the label catches up on the first scroll)
  useEffect(() => {
    if (wheel.current)
      wheel.current.style.transform = `rotate(${rot.get()}deg)`;
  }, [rot]);

  // reduced motion: the wheel stays put at REST, so the label must match it
  const g = GOALS[still ? topAt(REST) : top];

  // the UN asks that its guidelines be linked wherever the icons are published
  const credit = (
    <p className="text-[11px] text-foreground/40">
      {t.credit[0]}{" "}
      <a
        href="https://www.un.org/sustainabledevelopment/wp-content/uploads/2023/09/E_SDG_Guidelines_Sep20238.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-foreground/70"
      >
        {t.credit[1]}
      </a>
      .
    </p>
  );
  const ours = OURS.has(g.n);

  const label = (
    <div className="flex min-h-16 flex-col items-center justify-start pt-[4%]">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.p
          key={g.n}
          initial={{
            opacity: 0,
            transform: reduce ? "none" : "translateY(6px)",
          }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="text-center"
        >
          {ours ? (
            <a
              href={links[g.n]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.link(g.n, g.t[lang])}
              className="press inline-flex min-h-8 items-center gap-2 rounded-full bg-primary px-3 py-1 font-mono text-[11px] tracking-[0.14em] text-primary-foreground uppercase hover:bg-[#b3e083] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            >
              {t.sdg} {g.n}
              <span className="font-sans tracking-normal normal-case">
                {t.contribute}
              </span>
              <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
          ) : (
            <span
              aria-hidden
              className="inline-flex items-center gap-2 rounded-full border border-(--line) px-3 py-1 font-mono text-[11px] tracking-[0.14em] text-foreground/50 uppercase"
            >
              {t.sdg} {g.n}
            </span>
          )}
          <span
            aria-hidden
            className={cn(
              "mt-2 block text-sm font-medium sm:text-base",
              ours ? "text-foreground" : "text-foreground/45",
            )}
          >
            {g.t[lang]}
          </span>
        </motion.p>
      </AnimatePresence>
    </div>
  );

  return (
    <div ref={ref} className="relative mt-28 sm:mt-36">
      {/* header: above the wheel on phones and tablets, inside its hub from lg up */}
      <div className="mx-auto max-w-xl px-4 text-center lg:hidden">
        {/* reads as one line with the title: the statement the UN asks for (p. 18) */}
        <p className="eyebrow flex items-center justify-center gap-2 text-foreground/80">
          <Image
            src="/images/isotipo.png"
            alt=""
            width={36}
            height={22}
            style={{ width: "auto" }}
            className="h-3.5 w-auto brightness-0 invert"
          />
          {t.supports}
        </p>
        <h3 className="text-fluid-xl mt-3 font-semibold tracking-[-0.03em]">
          {t.title}
        </h3>
        <p className="mt-3 text-foreground/70">
          {t.body}
        </p>
      </div>

      <div className="relative mt-10 overflow-hidden lg:mt-0">
        <div className="relative left-1/2 aspect-[2/1] w-[180vw] -translate-x-1/2 sm:w-[130vw] lg:w-[min(100%,100rem)]">
          {/* scroll anchor at the hub's pointer (hub top = (1000 - R_IN) / 1000 of the height) */}
          <div
            ref={pointer}
            aria-hidden
            className="pointer-events-none absolute inset-x-0 h-px"
            style={{ top: `${((1000 - R_IN) / 1000) * 100}%` }}
          />
          <svg
            viewBox="-1000 -1000 2000 1000"
            className="absolute inset-0 size-full [mask-image:linear-gradient(180deg,black_88%,transparent)]"
            aria-labelledby="ods-wheel-title"
          >
            <title id="ods-wheel-title">{t.wheel}</title>
            <g
              ref={wheel}
              style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
            >
              {/* keeps the group's box centred on the hub while it turns */}
              <circle r="1000" fill="none" />
              {GOALS.map((goal, i) => {
                const a = angleOf(i);
                const on = OURS.has(goal.n);
                const r1 = on ? R_ON : R_OFF;
                return (
                  <g key={goal.n}>
                    {on ? (
                      <a
                        href={links[goal.n]}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t.link(goal.n, goal.t[lang])}
                        className="group/ods cursor-pointer outline-none"
                      >
                        <path
                          d={sector(
                            a - STEP / 2 + 0.5,
                            a + STEP / 2 - 0.5,
                            R_IN,
                            r1,
                          )}
                          fill={on ? goal.c : "#000"}
                          stroke={on ? "#9fd36a" : "rgb(238 235 227 / 0.12)"}
                          strokeWidth="2"
                          className={
                            on
                              ? "[stroke-opacity:0] transition-[stroke-opacity] duration-200 ease-(--ease-out) group-hover/ods:[stroke-opacity:1] group-focus-visible/ods:[stroke-opacity:1] [stroke-width:10]"
                              : undefined
                          }
                        />
                        <image
                          href={`/images/ods/${lang === "en" ? "rueda-en" : "rueda"}/ods-${String(goal.n).padStart(2, "0")}.webp`}
                          x={-ICON / 2}
                          y={-ICON / 2}
                          width={ICON}
                          height={ICON}
                          transform={`rotate(${a} 0 0) translate(${on ? ICON_R + 20 : ICON_R} 0) rotate(90)`}
                        />
                        {/* a lime mark on the rim of each goal we contribute to (outside the icon) */}
                        {on && (
                          <circle
                            cx={+((R_ON - 38) * Math.cos(rad(a))).toFixed(2)}
                            cy={+((R_ON - 38) * Math.sin(rad(a))).toFixed(2)}
                            r="11"
                            fill="#9fd36a"
                            stroke="#0b120d"
                            strokeWidth="4"
                          />
                        )}
                      </a>
                    ) : (
                      <g aria-hidden>
                        <path
                          d={sector(
                            a - STEP / 2 + 0.5,
                            a + STEP / 2 - 0.5,
                            R_IN,
                            r1,
                          )}
                          fill={on ? goal.c : "#000"}
                          stroke={on ? "none" : "rgb(238 235 227 / 0.12)"}
                          strokeWidth="2"
                        />
                        <image
                          href={`/images/ods/${lang === "en" ? "rueda-en" : "rueda"}/ods-${String(goal.n).padStart(2, "0")}.webp`}
                          x={-ICON / 2}
                          y={-ICON / 2}
                          width={ICON}
                          height={ICON}
                          transform={`rotate(${a} 0 0) translate(${on ? ICON_R + 20 : ICON_R} 0) rotate(90)`}
                        />
                        {/* a lime mark on the rim of each goal we contribute to (outside the icon) */}
                        {on && (
                          <circle
                            cx={+((R_ON - 38) * Math.cos(rad(a))).toFixed(2)}
                            cy={+((R_ON - 38) * Math.sin(rad(a))).toFixed(2)}
                            r="11"
                            fill="#9fd36a"
                            stroke="#0b120d"
                            strokeWidth="4"
                          />
                        )}
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
            {/* hub */}
            <circle
              r={R_IN - 14}
              fill="#0b120d"
              stroke="rgb(159 211 106 / 0.25)"
              strokeWidth="2"
            />
            {/* the pointer at the top of the hub */}
            <path
              d={`M-14 ${-(R_IN - 14)} L0 ${-(R_IN - 38)} L14 ${-(R_IN - 14)} Z`}
              fill="#9fd36a"
            />
          </svg>

          {/* inside the hub: the goal now at the top (all sizes), then the copy (lg+) */}
          <div className="absolute inset-x-0 top-[52%] bottom-0 z-10 mx-auto flex w-[46%] flex-col items-center text-center lg:top-[51%]">
            {label}
            <div className="hidden flex-col items-center lg:flex">
              {/* reads as one line with the title: the statement the UN asks for (p. 18) */}
              <p className="eyebrow mt-[5%] flex items-center xl:mt-[10%] justify-center gap-2 text-foreground/80">
                <Image
                  src="/images/isotipo.png"
                  alt=""
                  width={40}
                  height={24}
                  style={{ width: "auto" }}
                  className="h-4 w-auto brightness-0 invert"
                />
                {t.supports}
              </p>
              <h3 className="mt-2 text-[clamp(1.25rem,0.6rem+1.6vw,2.25rem)] leading-tight font-semibold tracking-[-0.03em]">
                {t.title}
              </h3>
              <p className="mt-3 max-w-sm text-sm text-foreground/70 lg:text-base">
                {t.body}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 pt-4 pb-12 text-center sm:pb-18">{credit}</div>
    </div>
  );
}

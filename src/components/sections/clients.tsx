import { ArrowUpRight, CalendarClock, MessagesSquare, ShieldCheck, Snowflake, Waypoints } from "lucide-react";
import { ProcessShowcase } from "@/components/process-showcase";
import { ReasonStack } from "@/components/reason-stack";
import { TraceShowcase } from "@/components/trace-showcase";
import { NorthAmericaMap } from "@/components/north-america-map";
import { Reveal } from "@/components/reveal";
import type { Copy, Lang } from "@/lib/i18n";

/* Original "Por qué los clientes nos eligen" items, verbatim from the live site (es). */
const WHY_ICONS = [CalendarClock, MessagesSquare, ShieldCheck, Waypoints];
const WHY: Copy<{ t: string; d: string }[]> = {
  en: [
    { t: "Delivery scheduling", d: "Financial and strategic planning with full visibility." },
    { t: "Real-time communication", d: "Instant access to data, reports and order status." },
    { t: "Risk control", d: "Complete documentation, certifications and auditable traceability." },
    { t: "Continuity of supply", d: "Geographic and agronomic diversification to keep disruptions to a minimum." },
  ],
  es: [
    { t: "Programación de entregas", d: "Planeación financiera y estratégica con visibilidad total." },
    { t: "Comunicación en tiempo real", d: "Acceso inmediato a datos, reportes y estado de pedidos." },
    { t: "Control de riesgos", d: "Documentación completa, certificaciones y trazabilidad auditable." },
    { t: "Continuidad de abasto", d: "Diversificación geográfica y agronómica para minimizar interrupciones." },
  ],
};

const T: Copy<{
  eyebrow: string;
  h2: [string, string, string];
  whyEyebrow: string;
  notMiddleman: string;
  operator: [string, string, string];
  promise: string;
  coverage: string;
  coverageH: [string, string];
  coverageP: string;
  stats: [string, string][];
  origin: string;
  crossing: string;
  destination: string;
  reefer: string;
  talk: string;
  signIn: string;
}> = {
  en: {
    eyebrow: "[04] Buyers",
    h2: ["More than suppliers, ", "partners", " in your sourcing"],
    whyEyebrow: "Why buyers choose us",
    notMiddleman: "We are not a middleman.",
    operator: ["We are an integrated operator that takes full responsibility for the chain, from the ", "first furrow", " to final delivery."],
    promise: "For buyers who put quality, traceability and compliance first. Here is what your operation gets, and how far we reach today.",
    coverage: "Coverage area",
    coverageH: ["From Puebla to ", "North America"],
    coverageP: "We grow in central Mexico and deliver across the U.S. and Canada, with the cold chain running the whole way.",
    stats: [
      ["3", "Countries"],
      ["2", "Crossings"],
      ["1 °C", "Unbroken cold"],
    ],
    origin: "Origin · Puebla",
    crossing: "Border crossing · Nogales, Reynosa",
    destination: "Destination · U.S. and Canada",
    reefer: "Refrigerated transport end to end",
    talk: "Let's talk about your supply chain",
    signIn: "Already a buyer? Sign in to COS",
  },
  es: {
    eyebrow: "[04] Clientes",
    h2: ["Más que proveedores, ", "socios", " en tu abastecimiento"],
    whyEyebrow: "Por qué los clientes nos eligen",
    notMiddleman: "No somos un intermediario.",
    operator: ["Somos un operador integrado que asume la responsabilidad completa de la cadena, desde el ", "primer surco", " hasta la entrega final."],
    promise: "Para quienes priorizan calidad, trazabilidad y cumplimiento. Esto es lo que gana tu operación y hasta dónde llegamos hoy.",
    coverage: "Zona de cobertura",
    coverageH: ["De Puebla a ", "Norteamérica"],
    coverageP: "Producimos en el centro de México y entregamos en Estados Unidos y Canadá, con la cadena de frío encendida todo el camino.",
    stats: [
      ["3", "Países"],
      ["2", "Cruces"],
      ["1 °C", "Frío continuo"],
    ],
    origin: "Origen · Puebla",
    crossing: "Cruce fronterizo · Nogales, Reynosa",
    destination: "Destino · EE.UU. y Canadá",
    reefer: "Transporte refrigerado de punta a punta",
    talk: "Hablemos de tu cadena",
    signIn: "¿Ya eres cliente? Ingresa a COS",
  },
};

export function Clients({ lang }: { lang: Lang }) {
  const t = T[lang];
  return (
    <section id="clientes" className="page-col pt-18 pb-20 sm:pt-24 sm:pb-16 lg:pb-12">
      <Reveal className="max-w-5xl">
        <p className="eyebrow">{t.eyebrow}</p>
        <h2 className="text-fluid-2xl mt-5 leading-[0.98] font-semibold tracking-[-0.04em]">
          {t.h2[0]}<span className="serif-em text-primary">{t.h2[1]}</span>{t.h2[2]}
        </h2>
      </Reveal>

      {/* Why us: the statement, with the section's promise beside it, then the stacked reasons */}
      <div className="mt-14 border-t border-(--line) pt-10">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <Reveal className="lg:col-span-8">
            <p className="eyebrow">{t.whyEyebrow}</p>
            <h3 className="text-fluid-xl mt-5 leading-[1.12] font-medium tracking-[-0.025em]">
              {t.notMiddleman}{" "}
              <span className="text-foreground/55">
                {t.operator[0]}
                <span className="serif-em text-primary">{t.operator[1]}</span>
                {t.operator[2]}
              </span>
            </h3>
          </Reveal>
          {/* sits level with the statement, not the eyebrow, so the two read as one row */}
          <Reveal className="lg:col-span-4 lg:pt-10" delay={0.08}>
            <p className="text-fluid-base border-l-2 border-primary pl-5 text-foreground/75">
              {t.promise}
            </p>
          </Reveal>
        </div>
        <div className="mt-12">
          <ReasonStack />
        </div>
        <ul className="mt-10 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
          {WHY[lang].map(({ t: title, d }, i) => {
            const Icon = WHY_ICONS[i];
            return (
              <Reveal as="li" key={title} delay={0.05 * i} className="border-t border-(--line) py-6">
                <Icon className="size-5 text-primary" aria-hidden />
                <h4 className="mt-4 font-medium">{title}</h4>
                <p className="mt-1.5 text-sm text-foreground/65">{d}</p>
              </Reveal>
            );
          })}
        </ul>
      </div>

      {/* Coverage */}
      <Reveal className="mt-20 overflow-hidden rounded-[2rem] border border-(--line) bg-card">
        <div className="grid lg:grid-cols-12">
          <div className="flex flex-col p-6 sm:p-10 lg:col-span-4">
            <p className="eyebrow flex items-center gap-2">
              <span className="live-dot" /> {t.coverage}
            </p>
            <h3 className="text-fluid-xl mt-5 leading-[1.05] font-semibold tracking-[-0.03em]">
              {t.coverageH[0]}<span className="serif-em text-primary">{t.coverageH[1]}</span>
            </h3>
            <p className="mt-4 text-foreground/70">
              {t.coverageP}
            </p>

            <dl className="mt-8 grid grid-cols-3 gap-2 border-y border-(--line) py-5 font-mono text-[11px] tracking-[0.12em] uppercase">
              {t.stats.map(([v, k]) => (
                <div key={k}>
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="mt-1 text-lg tracking-normal text-foreground">{v}</dd>
                </div>
              ))}
            </dl>

            <ul className="mt-6 space-y-3 font-mono text-[11px] tracking-[0.1em] uppercase">
              <li className="flex items-center gap-3">
                <span className="size-3 rounded-full bg-signal" /> {t.origin}
              </li>
              <li className="flex items-center gap-3">
                <span className="size-2.5 rotate-45 border-2 border-primary" /> {t.crossing}
              </li>
              <li className="flex items-center gap-3">
                <span className="size-2.5 rounded-full bg-primary" /> {t.destination}
              </li>
            </ul>

            <p className="mt-auto flex items-center gap-2 pt-8 text-sm text-foreground/60">
              <Snowflake className="size-4 text-primary" aria-hidden /> {t.reefer}
            </p>
          </div>
          <div className="relative border-t border-(--line) bg-[#0b120d] lg:col-span-8 lg:border-t-0 lg:border-l">
            <div className="aspect-[1200/760] w-full">
              <NorthAmericaMap />
            </div>
          </div>
        </div>
      </Reveal>

      {/* Process */}
      <Reveal className="mt-28">
        <ProcessShowcase
          cta={
            <a
              href="#contacto"
              className="press inline-flex h-11 items-center gap-2 self-start rounded-md border border-primary/50 bg-primary/15 px-5 text-sm font-medium text-primary backdrop-blur-sm hover:bg-primary/25 lg:self-auto"
            >
              {t.talk} <ArrowUpRight className="size-4" aria-hidden />
            </a>
          }
        />
      </Reveal>

      {/* Dashboard */}
      <Reveal className="mt-16 sm:mt-20">
        <TraceShowcase
          cta={
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <a
                href="#contacto"
                className="press inline-flex h-12 items-center rounded-full bg-primary px-6 font-medium text-primary-foreground hover:bg-[#b3e083]"
              >
                {t.talk}
              </a>
              <a
                href="https://app.collectaproduce.com/"
                className="inline-flex min-h-11 items-center gap-1.5 text-sm text-foreground/70 underline-offset-4 transition-colors duration-150 ease-(--ease-out) hover:text-foreground hover:underline"
              >
                {t.signIn} <ArrowUpRight className="size-4" aria-hidden />
              </a>
            </div>
          }
        />
      </Reveal>
    </section>
  );
}

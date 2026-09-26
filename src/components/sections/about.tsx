import Image from "next/image";
import { Cpu, HandCoins, Handshake, Leaf, ScanLine } from "lucide-react";
import { Counter } from "@/components/counter";
import { Reveal } from "@/components/reveal";
import type { Copy, Lang } from "@/lib/i18n";

const ABOUT: Copy<{
  eyebrow: string;
  title: [string, string];
  p1: [string, string];
  p2: string;
  numbers: string;
  hectares: string;
  integrated: string;
  growers: string;
  crops: string;
  traceability: string;
}> = {
  en: {
    eyebrow: "[01] Who we are",
    title: ["A Mexican company,", "a global vision"],
    p1: [
      "Collecta grows and sells vegetables through one integrated operation, start to finish. We back production at the source, work side by side with farmers and look after every stage:",
      "planning, field production, harvest and packing.",
    ],
    p2: "All of it with traceability and food safety. That is how we deliver reliable supply and consistent quality to demanding buyers who share our vision for change.",
    numbers: "Operations by the numbers",
    hectares: "Hectares",
    integrated: "Under integrated operation",
    growers: "Growers · in the co-production network",
    crops: "Crops · vegetables",
    traceability: "Traceability · auditable",
  },
  es: {
    eyebrow: "[01] Quiénes somos",
    title: ["Una empresa mexicana,", "una visión global"],
    p1: [
      "Collecta produce y comercializa hortalizas con una operación integrada de principio a fin. Habilitamos la producción desde el origen, trabajamos de cerca con agricultores y cuidamos cada etapa:",
      "planeación, producción en campo, cosecha y empaque.",
    ],
    p2: "Todo con trazabilidad e inocuidad. Así entregamos abasto confiable y calidad consistente a clientes exigentes que comparten nuestra visión de transformación.",
    numbers: "Operación en números",
    hectares: "Hectáreas",
    integrated: "En operación integrada",
    growers: "Productores · en la red de coproducción",
    crops: "Cultivos · hortalizas",
    traceability: "Trazabilidad · auditable",
  },
};

export function About({ lang }: { lang: Lang }) {
  const t = ABOUT[lang];
  return (
    <section id="quienes-somos" className="page-col py-24 sm:py-32">
      <div className="grid gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 className="text-fluid-2xl mt-5 leading-[0.98] font-semibold tracking-[-0.04em]">
            {t.title[0]} <span className="serif-em text-primary">{t.title[1]}</span>
          </h2>
        </Reveal>
        <Reveal className="text-fluid-base space-y-5 text-foreground/75 lg:col-span-6 lg:col-start-7 lg:pt-10" delay={0.08}>
          <p>
            {t.p1[0]}{" "}
            <span className="text-foreground">{t.p1[1]}</span>
          </p>
          <p>{t.p2}</p>
        </Reveal>
      </div>

      <div className="mt-20">
        <p className="eyebrow mb-6">{t.numbers}</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-12 lg:grid-rows-2">
          <Reveal className="relative col-span-2 flex min-h-72 flex-col justify-between overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8 lg:col-span-6 lg:row-span-2">
            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
              <span className="font-mono text-xs tracking-[0.14em] uppercase">{t.hectares}</span>
              <span className="font-mono text-xs tracking-[0.14em] uppercase opacity-70">{t.integrated}</span>
            </div>
            <p className="text-[clamp(4.5rem,2rem+11vw,12rem)] leading-[0.8] font-semibold tracking-[-0.06em]">
              <Counter to={4000} suffix="+" />
            </p>
            <svg aria-hidden viewBox="0 0 400 120" className="pointer-events-none absolute right-0 bottom-0 w-2/3 opacity-25" fill="none">
              {Array.from({ length: 9 }, (_, i) => (
                <path key={i} d={`M0 ${120 - i * 12} Q 200 ${60 - i * 10} 400 ${110 - i * 13}`} stroke="currentColor" strokeWidth="1" />
              ))}
            </svg>
          </Reveal>
          <Reveal className="col-span-2 flex min-h-44 flex-col justify-between rounded-3xl border border-(--line) bg-card p-6 lg:col-span-6" delay={0.06}>
            <span className="eyebrow">{t.growers}</span>
            <p className="text-fluid-3xl leading-none font-semibold tracking-[-0.05em]">
              <Counter to={300} suffix="+" />
            </p>
          </Reveal>
          <Reveal className="flex min-h-44 flex-col justify-between rounded-3xl border border-(--line) bg-card p-6 lg:col-span-3" delay={0.12}>
            <span className="eyebrow">{t.crops}</span>
            <p className="text-fluid-3xl leading-none font-semibold tracking-[-0.05em]">
              <Counter to={9} />
            </p>
          </Reveal>
          <Reveal className="relative flex min-h-44 flex-col justify-between overflow-hidden rounded-3xl border border-(--line) bg-card p-6 lg:col-span-3" delay={0.18}>
            <span className="eyebrow">{t.traceability}</span>
            <p className="text-fluid-3xl leading-none font-semibold tracking-[-0.05em] text-primary">
              <Counter to={95} suffix="%" />
            </p>
            <div aria-hidden className="absolute inset-x-6 bottom-3 h-1 overflow-hidden rounded-full bg-foreground/10">
              <div className="h-full w-[95%] rounded-full bg-primary" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const MISSION_ICONS = [HandCoins, Handshake];
const VISION_ICONS = [ScanLine, Cpu, Leaf];

const MISSION: Copy<{
  eyebrow: string;
  title: [string, string];
  mission: string;
  missionText: [string, string, string];
  missionPillars: string[];
  vision: string;
  visionText: [string, string, string];
  visionPillars: string[];
}> = {
  en: {
    eyebrow: "[02] Why we exist",
    title: ["Why we exist and", "where we're headed"],
    mission: "Mission",
    missionText: ["Strengthen the", "growers", "who keep the world's food system running."],
    missionPillars: ["Financing", "No middlemen"],
    vision: "Vision",
    visionText: [
      "Transform the agri-food system from the root into an operation that is",
      "traceable, tech-driven and sustainable",
      ", creating value for growers, markets and communities.",
    ],
    visionPillars: ["Traceable", "Tech-driven", "Sustainable"],
  },
  es: {
    eyebrow: "[02] Nuestra razón de ser",
    title: ["Por qué existimos y", "hacia dónde vamos"],
    mission: "Misión",
    missionText: ["Fortalecer a los", "productores agrícolas", "que sostienen el sistema alimentario del mundo."],
    missionPillars: ["Financiamiento", "Sin intermediarios"],
    vision: "Visión",
    visionText: [
      "Transformar de raíz el sistema agroalimentario en una operación",
      "trazable, tecnológica y sostenible",
      ", que genere valor para productores, mercados y comunidades.",
    ],
    visionPillars: ["Trazable", "Tecnológica", "Sostenible"],
  },
};

function CardImage({ src, index, label, sizes }: { src: string; index: string; label: string; sizes: string }) {
  return (
    <div className="relative h-56 overflow-hidden sm:h-72 lg:h-[18rem]">
      <Image src={src} alt="" fill sizes={sizes} className="object-cover transition-transform duration-300 ease-(--ease-out) group-hover:scale-[1.03]" />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgb(22_33_26/0.9))]" />
      <span className="absolute top-5 left-5 flex items-center gap-2 rounded-full border border-(--line) bg-background/65 px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] uppercase backdrop-blur-md">
        <span className="text-primary">{index}</span> · {label}
      </span>
    </div>
  );
}

export function Mission({ lang }: { lang: Lang }) {
  const t = MISSION[lang];
  return (
    <section aria-labelledby="razon" className="page-col pb-18 sm:pb-24">
      <Reveal>
        <p className="eyebrow">{t.eyebrow}</p>
        <h2 id="razon" className="text-fluid-2xl mt-5 max-w-3xl leading-[0.98] font-semibold tracking-[-0.04em]">
          {t.title[0]} <span className="serif-em text-primary">{t.title[1]}</span>
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-3 lg:grid-cols-12">
        <Reveal as="article" className="group flex flex-col overflow-hidden rounded-3xl border border-(--line) bg-card lg:col-span-5">
          <CardImage src="/images/mision.jpeg" index="01" label={t.mission} sizes="(min-width: 1024px) 40vw, 100vw" />
          <div className="flex flex-1 flex-col p-6 sm:p-8">
            <p className="text-fluid-xl mb-8 leading-[1.15] font-medium tracking-[-0.025em]">
              {t.missionText[0]} <span className="serif-em text-primary">{t.missionText[1]}</span> {t.missionText[2]}
            </p>
            <ul className="mt-auto grid grid-cols-2 gap-2 border-t border-(--line) pt-6">
              {t.missionPillars.map((k, i) => ({ k, Icon: MISSION_ICONS[i] })).map(({ k, Icon }) => (
                <li key={k} className="flex flex-col gap-3 rounded-2xl border border-(--line) bg-background/40 p-4 sm:flex-row sm:items-center">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15">
                    <Icon className="size-4 text-primary" aria-hidden />
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.12em] uppercase">{k}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal as="article" delay={0.08} className="group flex flex-col overflow-hidden rounded-3xl border border-(--line) bg-card lg:col-span-7">
          <CardImage src="/images/vision.jpeg" index="02" label={t.vision} sizes="(min-width: 1024px) 58vw, 100vw" />
          <div className="flex flex-1 flex-col p-6 sm:p-8">
            <p className="text-fluid-xl mb-8 leading-[1.15] font-medium tracking-[-0.025em]">
              {t.visionText[0]}{" "}
              <span className="serif-em text-primary">{t.visionText[1]}</span>{t.visionText[2]}
            </p>
            <ul className="mt-auto grid grid-cols-3 gap-2 border-t border-(--line) pt-6">
              {t.visionPillars.map((k, i) => ({ k, Icon: VISION_ICONS[i] })).map(({ k, Icon }) => (
                <li key={k} className="flex flex-col gap-3 rounded-2xl border border-(--line) bg-background/40 p-4 sm:flex-row sm:items-center">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15">
                    <Icon className="size-4 text-primary" aria-hidden />
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.12em] uppercase">{k}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

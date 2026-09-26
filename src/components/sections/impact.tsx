import { Reveal } from "@/components/reveal";
import { ImpactStack } from "@/components/impact-stack";
import { OdsWheel } from "@/components/ods-wheel";
import type { Copy, Lang } from "@/lib/i18n";

const T: Copy<{ eyebrow: string; h2: [string, string]; body: string; live: string }> = {
  en: {
    eyebrow: "[06] Real, scalable impact",
    h2: ["Transformation", "with purpose"],
    body: "Every season we work alongside a grower leaves something in their land and their community: a fairer supply chain, a stronger rural economy and farmland that lasts.",
    live: "Mexico needs transformation",
  },
  es: {
    eyebrow: "[06] Impacto real y escalable",
    h2: ["Transformación", "con propósito"],
    body: "Cada ciclo que trabajamos junto a un productor deja algo en su tierra y en su comunidad: una cadena más justa, una economía rural más fuerte y un campo que dura.",
    live: "México necesita transformación",
  },
};


export function Impact({ lang }: { lang: Lang }) {
  const t = T[lang];
  return (
    <section id="impacto">
      <div className="page-col pt-18 sm:pt-24">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-12 lg:items-center lg:gap-10">
          <Reveal className="min-w-0 lg:col-span-5">
            <p className="eyebrow">{t.eyebrow}</p>
            <h2 className="text-fluid-3xl mt-5 leading-[0.9] font-semibold tracking-[-0.05em] lg:text-[clamp(3rem,4.3vw,5.25rem)]">
              {t.h2[0]} <span className="serif-em text-primary">{t.h2[1]}</span>
            </h2>
            <p className="text-fluid-base mt-6 max-w-md text-foreground/75">
              {t.body}
            </p>
            <p className="eyebrow mt-10 flex items-center gap-2 max-lg:hidden">
              <span className="live-dot" /> {t.live}
            </p>
          </Reveal>
          <div className="min-w-0 lg:col-span-7">
            <ImpactStack />
          </div>
        </div>

      </div>
      <OdsWheel />
    </section>
  );
}

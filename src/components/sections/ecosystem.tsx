import { Pipeline } from "@/components/pipeline";
import { LotOdometer } from "@/components/lot-odometer";
import { Reveal } from "@/components/reveal";
import type { Copy, Lang } from "@/lib/i18n";

const T: Copy<{ eyebrow: string; title: [string, string]; body: string }> = {
  en: {
    eyebrow: "[03] Ecosystem",
    title: ["We grow in", "Mexican fields."],
    body: "We work with small and mid-sized farmers to grow high-quality vegetables. Then we take that harvest to market ourselves, through a single operation that never lets go of the product.",
  },
  es: {
    eyebrow: "[03] Ecosistema",
    title: ["Producimos desde el", "campo mexicano."],
    body: "Trabajamos con pequeños y medianos agricultores para producir hortalizas de alta calidad. Después nos encargamos de llevar esa cosecha al mercado, con una sola operación que no suelta el producto en ningún punto.",
  },
};

export function Ecosystem({ lang }: { lang: Lang }) {
  const t = T[lang];
  return (
    <section id="ecosistema" className="relative">
      <div className="relative page-col py-18 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">{t.eyebrow}</p>
            <h2 className="text-fluid-2xl mt-5 leading-[0.98] font-semibold tracking-[-0.04em]">
              {t.title[0]} <span className="serif-em text-primary">{t.title[1]}</span>
            </h2>
            <p className="text-fluid-base mt-6 max-w-md text-foreground/75">
              {t.body}
            </p>
          </Reveal>
          <Reveal className="relative lg:col-span-7" delay={0.1}>
            <LotOdometer />
          </Reveal>
        </div>

        <div className="mt-20">
          <Pipeline />
        </div>
      </div>
    </section>
  );
}

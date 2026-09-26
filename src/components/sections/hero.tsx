import type { CSSProperties } from "react";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import { CosConsole } from "@/components/cos-console";
import type { Copy, Lang } from "@/lib/i18n";

const T: Copy<{
  status: string;
  h1: [string, string, string];
  lede: string;
  talk: string;
  grower: string;
  ticker: string[];
}> = {
  en: {
    status: "System · active",
    h1: ["Redesigning", "the food", "supply chain"],
    lede:
      "An ecosystem that brings production, technology and sales together to transform agribusiness in Latin America. From the furrow to your loading dock.",
    talk: "Let's talk about your supply chain",
    grower: "I'm a grower",
    ticker: [
      "Auditable traceability",
      "Cold chain",
      "FSVP-ready",
      "No middlemen",
      "Vegetables from Puebla",
      "Mexico · U.S. · Canada",
      "One operator, from planting to delivery",
    ],
  },
  es: {
    status: "Sistema · activo",
    h1: ["Rediseñando", "la cadena", "alimentaria"],
    lede:
      "Un ecosistema que integra producción, tecnología y comercialización para transformar la agroindustria en América Latina. Desde el surco hasta tu andén.",
    talk: "Hablemos de tu cadena",
    grower: "Soy productor",
    ticker: [
      "Trazabilidad auditable",
      "Cadena de frío",
      "Listo para FSVP",
      "Sin intermediarios",
      "Hortalizas de Puebla",
      "México · EE.UU. · Canadá",
      "Un solo operador, de la siembra a la entrega",
    ],
  },
};

export function Hero({ lang }: { lang: Lang }) {
  const t = T[lang];
  return (
    <section
      id="top"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden"
    >
      {/* a drone flying low over furrows at first light, seen from above (ChatGPT image);
          one crop per device, and the browser downloads only the one its screen uses */}
      <picture>
        <source media="(min-width: 640px)" srcSet="/images/hero/dron-2560.webp" />
        <img
          src="/images/hero/dron-v.webp"
          alt=""
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="absolute inset-0 -z-20 size-full object-cover object-[78%_50%]"
        />
      </picture>
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(11_18_13/0.55)_0%,rgb(11_18_13/0.35)_35%,rgb(11_18_13/0.92)_78%,#0b120d_100%)]"
      />
      <div
        aria-hidden
        className="grid-bg absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)] opacity-60"
      />

      <div className="flex w-full page-col flex-1 flex-col pt-24 pb-10 sm:pt-28">
        <div
          className="fade-up flex flex-wrap items-center gap-x-6 gap-y-2"
          data-intro-wait style={{ "--d": "100ms" } as CSSProperties}
        >
          <span className="eyebrow flex items-center gap-2 text-foreground">
            <span className="live-dot" /> {t.status}
          </span>
          <span className="eyebrow">LATAM · 19.43°N 99.13°W</span>
        </div>

        <div className="mt-auto grid items-end gap-10 pt-16 lg:grid-cols-[1fr_auto]">
          <div>
            <h1 className="text-fluid-hero leading-[0.88] font-semibold tracking-[-0.055em]">
              <span className="hero-line" data-intro-wait style={{ "--d": "150ms" } as CSSProperties}>
                {t.h1[0]}
              </span>{" "}
              <span className="hero-line" data-intro-wait style={{ "--d": "230ms" } as CSSProperties}>
                {t.h1[1]}
              </span>{" "}
              <span
                className="hero-line serif-em pr-4 text-primary"
                data-intro-wait style={{ "--d": "310ms" } as CSSProperties}
              >
                {t.h1[2]}
              </span>
            </h1>
            <div
              className="fade-up mt-8 flex max-w-3xl flex-col gap-8 xl:flex-row xl:items-end"
              data-intro-wait style={{ "--d": "520ms" } as CSSProperties}
            >
              <p className="text-fluid-base max-w-md text-balance text-foreground/75">
                {t.lede}
              </p>
              <div className="flex shrink-0 flex-wrap gap-3">
                <a
                  href="#contacto"
                  className="press group inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-medium text-primary-foreground hover:bg-[#b3e083]"
                >
                  {t.talk}
                  <ArrowRight
                    className="size-4 transition-transform duration-200 ease-(--ease-out) group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </a>
                <a
                  href="#productores"
                  className="press inline-flex h-12 items-center gap-2 rounded-full border border-foreground/25 px-6 font-medium hover:border-foreground/60"
                >
                  {t.grower}{" "}
                  <ArrowDownRight className="size-4" aria-hidden />
                </a>
              </div>
            </div>
          </div>
          <div
            className="fade-up hidden lg:block"
            data-intro-wait style={{ "--d": "700ms" } as CSSProperties}
          >
            <CosConsole />
          </div>
        </div>
      </div>

      <div className="border-y border-(--line) bg-background/70 backdrop-blur-sm">
        <div className="flex overflow-hidden py-4" aria-hidden>
          <div className="marquee-track flex shrink-0 gap-10 pr-10">
            {[...t.ticker, ...t.ticker].map((t, i) => (
              <span
                key={i}
                className="eyebrow flex shrink-0 items-center gap-10 whitespace-nowrap"
              >
                {t} <span className="text-primary">✳</span>
              </span>
            ))}
          </div>
        </div>
        <p className="sr-only">{t.ticker.join(". ")}</p>
      </div>
    </section>
  );
}

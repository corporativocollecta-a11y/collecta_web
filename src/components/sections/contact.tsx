import { ArrowUpRight, Mail, MapPin, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { EMAIL, WHATSAPP, WHATSAPP_LABEL } from "@/lib/contact";
import { Reveal } from "@/components/reveal";
import type { Copy, Lang } from "@/lib/i18n";

/* Channels: WhatsApp first (the producers' main channel), then email, then where we are.
   The COS platform link was dropped: it's an internal tool, clients don't use it. */
const T: Copy<{
  eyebrow: string;
  h2: string;
  h2Em: string;
  lead: string;
  location: string;
  place: string;
}> = {
  en: {
    eyebrow: "[07] Join the ecosystem",
    h2: "Let's talk about",
    h2Em: "your supply chain",
    lead: "If you want to be part of the Collecta ecosystem, as a buyer, grower or partner, write to us.",
    location: "Location",
    place: "Puebla, Mexico",
  },
  es: {
    eyebrow: "[07] Únete al ecosistema",
    h2: "Hablemos de",
    h2Em: "tu cadena",
    lead: "Si quieres formar parte del ecosistema Collecta, ya sea como cliente, productor o aliado, escríbenos.",
    location: "Ubicación",
    place: "Puebla, México",
  },
};

const channels = (t: (typeof T)[Lang]) => [
  {
    k: "WhatsApp",
    v: WHATSAPP_LABEL,
    href: WHATSAPP,
    external: true,
    Icon: MessageCircle,
  },
  { k: "Email", v: EMAIL, href: `mailto:${EMAIL}`, Icon: Mail },
  { k: t.location, v: t.place, Icon: MapPin },
];

export function Contact({ lang }: { lang: Lang }) {
  const t = T[lang];
  return (
    <section
      id="contacto"
      className="page-col pt-18 pb-16 sm:pt-24 sm:pb-28"
    >
      <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
        <Reveal className="lg:sticky lg:top-24 lg:col-span-5">
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 className="text-fluid-3xl mt-5 leading-[0.9] font-semibold tracking-[-0.05em]">
            {t.h2} <span className="serif-em text-primary">{t.h2Em}</span>
          </h2>
          <p className="text-fluid-base mt-6 max-w-md text-foreground/75">
            {t.lead}
          </p>

          <ul className="mt-10 border-t border-(--line)">
            {channels(t).map(({ k, v, href, external, Icon }) => (
              <li key={k} className="border-b border-(--line)">
                {href ? (
                  <a
                    href={href}
                    {...(external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="group flex min-h-16 items-center gap-4 py-5"
                  >
                    <Icon className="size-5 text-primary" aria-hidden />
                    <span className="flex-1">
                      <span className="eyebrow block">{k}</span>
                      <span className="mt-1 block break-all">{v}</span>
                    </span>
                    <ArrowUpRight
                      className="size-4 text-foreground/40 transition-[transform,color] duration-200 ease-(--ease-out) group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                      aria-hidden
                    />
                  </a>
                ) : (
                  <div className="flex min-h-16 items-center gap-4 py-5">
                    <Icon className="size-5 text-primary" aria-hidden />
                    <span>
                      <span className="eyebrow block">{k}</span>
                      <span className="mt-1 block">{v}</span>
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="lg:col-span-7" delay={0.1}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}

import Image from "next/image";
import { ArrowUp, Mail, MessageCircle } from "lucide-react";
import { EMAIL, WHATSAPP, WHATSAPP_LABEL } from "@/lib/contact";
import { FooterSoil } from "@/components/footer-soil";
import type { Copy, Lang } from "@/lib/i18n";

/* Same columns and labels as the live footer; links point where each topic actually
   lives on this page. "Plataforma" (the internal COS) was dropped: clients don't use it. */
const PRIVACY = "/privacidad";
const TERMS = "/terminos";

type FooterCopy = {
  cols: { t: string; links: [string, string][] }[];
  tagline: string;
  mail: string;
  home: string;
  nav: string;
  place: string;
  top: string;
  madeIn: string;
  madeInAlt: string;
  powered: string;
};

// the legal pages only exist in Spanish, so both languages link to them
const T: Copy<FooterCopy> = {
  en: {
    cols: [
      {
        t: "Ecosystem",
        links: [
          ["Model", "#ecosistema"],
          ["Technology", "#clientes"],
          ["Traceability", "#trazabilidad"],
        ],
      },
      {
        t: "Audiences",
        links: [
          ["Buyers", "#clientes"],
          ["Growers", "#productores"],
          ["Partners", "#contacto"],
        ],
      },
      {
        t: "Company",
        links: [
          ["Impact", "#impacto"],
          ["Contact", "#contacto"],
        ],
      },
      {
        t: "Legal",
        links: [
          ["Privacy notice", PRIVACY],
          ["Terms of use", TERMS],
        ],
      },
    ],
    tagline: "“For all mankind”",
    mail: "Email",
    home: "Collecta, back to home",
    nav: "Footer",
    place: "Puebla, Mexico",
    top: "Back to top",
    madeIn: "Made in Mexico",
    madeInAlt: "Made in Mexico - Mexico's Ministry of Economy",
    powered: "Powered by",
  },
  es: {
    cols: [
      {
        t: "Ecosistema",
        links: [
          ["Modelo", "#ecosistema"],
          ["Tecnología", "#clientes"],
          ["Trazabilidad", "#trazabilidad"],
        ],
      },
      {
        t: "Audiencias",
        links: [
          ["Clientes", "#clientes"],
          ["Productores", "#productores"],
          ["Aliados", "#contacto"],
        ],
      },
      {
        t: "Empresa",
        links: [
          ["Impacto", "#impacto"],
          ["Contacto", "#contacto"],
        ],
      },
      {
        t: "Legal",
        links: [
          ["Aviso de privacidad", PRIVACY],
          ["Términos de uso", TERMS],
        ],
      },
    ],
    tagline: "“Para toda la humanidad”",
    mail: "Correo",
    home: "Collecta, ir al inicio",
    nav: "Pie de página",
    place: "Puebla, México",
    top: "Volver arriba",
    madeIn: "Hecho en México",
    madeInAlt: "Hecho en México - Secretaría de Economía",
    powered: "Impulsado por",
  },
};

const channels = (t: FooterCopy) => [
  {
    label: WHATSAPP_LABEL,
    href: WHATSAPP,
    external: true,
    Icon: MessageCircle,
    name: "WhatsApp",
  },
  { label: EMAIL, href: `mailto:${EMAIL}`, Icon: Mail, name: t.mail },
];

export function Footer({ lang }: { lang: Lang }) {
  const t = T[lang];
  return (
    <footer className="relative isolate overflow-hidden">
      <FooterSoil />
      <div className="page-col pt-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            {/* the colour isotipo on its own, straight on the dark footer (no plate) */}
            <a
              href="#top"
              aria-label={t.home}
              className="press inline-flex"
            >
              <Image
                src="/images/isotipo-color.webp"
                alt=""
                width={566}
                height={342}
                style={{ width: "auto" }}
                className="h-16 w-auto sm:h-[4.5rem]"
              />
            </a>
            <p className="serif-em mt-6 text-3xl text-foreground/80">
              {t.tagline}
            </p>

            <ul className="mt-8 space-y-1">
              {channels(t).map(({ label, href, external, Icon, name }) => (
                <li key={name}>
                  <a
                    href={href}
                    {...(external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    aria-label={`${name}: ${label}`}
                    className="group inline-flex min-h-11 items-center gap-3 text-foreground/80 transition-colors duration-150 hover:text-primary"
                  >
                    <Icon className="size-4 text-primary" aria-hidden />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <nav
            aria-label={t.nav}
            className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8"
          >
            {t.cols.map((c) => (
              <div key={c.t}>
                <h2 className="eyebrow">{c.t}</h2>
                <ul className="mt-4 space-y-1">
                  {c.links.map(([l, h]) => (
                    <li key={l}>
                      <a
                        href={h}
                        className="inline-block py-1.5 text-foreground/75 transition-colors duration-150 hover:text-primary"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-(--line) py-8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <p className="eyebrow">
              © {new Date().getFullYear()} Collecta · {t.place}
            </p>
            <a
              href="#top"
              className="press group inline-flex h-10 items-center gap-2 rounded-full border border-(--line) px-4 text-xs text-foreground/75 transition-[border-color,color] duration-150 hover:border-primary/50 hover:text-foreground"
            >
              <ArrowUp
                className="size-3.5 transition-transform duration-200 ease-(--ease-out) group-hover:-translate-y-0.5"
                aria-hidden
              />
              {t.top}
            </a>
          </div>
          <div className="flex items-center gap-8">
            <a
              href="https://hechoenmexico.economia.gob.mx/"
              aria-label={t.madeIn}
            >
              <Image
                src="/images/hecho-mx-logo.png"
                alt={t.madeInAlt}
                width={72}
                height={72}
                className="size-16 rounded-lg sm:size-[4.5rem]"
              />
            </a>
            <a
              href="https://wortev.com/"
              className="-my-3 flex items-center gap-3 py-3 text-xs text-muted-foreground"
            >
              {t.powered}
              <Image
                src="/images/wortev-logo.svg"
                alt="WORTEV"
                width={90}
                height={20}
                style={{ width: "auto" }}
                className="h-5 w-auto brightness-0 invert opacity-70"
                unoptimized
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

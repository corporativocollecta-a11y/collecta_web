import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { fontVars } from "../fonts";
import { LANGS, isLang, type Copy, type Lang } from "@/lib/i18n";

const META: Copy<{ title: string; description: string; ogTitle: string; ogDescription: string; ogAlt: string; locale: string }> = {
  en: {
    title: "Collecta | B2B agri-food ecosystem — traceability and export",
    description:
      "Collecta grows and sells Mexican vegetables through one integrated operation: planning, field, harvest, packing and delivery, with auditable traceability.",
    ogTitle: "Collecta — Redesigning the food supply chain",
    ogDescription:
      "Mexican vegetables with auditable traceability. One operator from planting to delivery.",
    ogAlt: "A drone flies over furrows of dark soil with seedlings at dawn",
    locale: "en_US",
  },
  es: {
    title: "Collecta | Ecosistema agroindustrial B2B — trazabilidad y exportación",
    description:
      "Collecta produce y comercializa hortalizas mexicanas con operación integrada: planeación, campo, cosecha, empaque y entrega con trazabilidad auditable.",
    ogTitle: "Collecta — Rediseñando la cadena alimentaria",
    ogDescription:
      "Hortalizas mexicanas con trazabilidad auditable. Un solo operador desde la siembra hasta la entrega.",
    ogAlt: "Un dron sobrevuela surcos de tierra oscura con plántulas al amanecer",
    locale: "es_MX",
  },
};

export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const m = META[isLang(lang) ? lang : "en"];
  const url = lang === "es" ? "/es" : "/";
  return {
    metadataBase: new URL("https://collectaproduce.com"),
    title: m.title,
    description: m.description,
    alternates: { canonical: url, languages: { en: "/", es: "/es", "x-default": "/" } },
    openGraph: {
      title: m.ogTitle,
      description: m.ogDescription,
      url,
      siteName: "Collecta",
      locale: m.locale,
      alternateLocale: lang === "es" ? "en_US" : "es_MX",
      type: "website",
      images: [{ url: "/images/og-collecta.jpg", width: 1200, height: 630, alt: m.ogAlt }],
    },
    twitter: { card: "summary_large_image", images: ["/images/og-collecta.jpg"] },
  };
}

export const viewport: Viewport = {
  themeColor: "#0b120d",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const l: Lang = lang;
  return (
    <html
      lang={l}
      suppressHydrationWarning
      className={`${fontVars} antialiased`}
    >
      <head>
        {/* decides the hero intro before first paint: first visit only, never with reduced motion */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var k="collecta-intro";if(!localStorage.getItem(k)&&!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.setAttribute("data-intro","");localStorage.setItem(k,"1");var d=document.documentElement,n=2,go=function(){d.setAttribute("data-intro-ready","")};["/images/isotipo.png","/images/logotipo-word.png"].forEach(function(h){var i=new Image();i.onload=i.onerror=function(){if(--n===0)go()};i.src=h});setTimeout(go,1200)}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-dvh text-foreground">{children}</body>
    </html>
  );
}

import { Nav } from "@/components/nav";
import { Hero } from "@/components/sections/hero";
import { About, Mission } from "@/components/sections/about";
import { Ecosystem } from "@/components/sections/ecosystem";
import { Clients } from "@/components/sections/clients";
import { Producers } from "@/components/sections/producers";
import { Impact } from "@/components/sections/impact";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";
import { TermsNotice } from "@/components/terms-notice";
import { PageMicrobes } from "@/components/page-microbes";
import { HeroIntro } from "@/components/hero-intro";
import { LangProvider } from "@/components/lang-provider";
import { isLang, type Copy } from "@/lib/i18n";
import { notFound } from "next/navigation";

const SKIP: Copy<string> = { en: "Skip to content", es: "Saltar al contenido" };
const ORG_DESC: Copy<string> = {
  en: "Growing and selling Mexican vegetables through one integrated operation with auditable traceability.",
  es: "Producción y comercialización de hortalizas mexicanas con operación integrada y trazabilidad auditable.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Collecta",
  url: "https://collectaproduce.com",
  logo: "https://collectaproduce.com/images/logo.png",
  email: "contacto@collectaproduce.com",
  address: { "@type": "PostalAddress", addressLocality: "Puebla", addressCountry: "MX" },
};

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <LangProvider lang={lang}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        {SKIP[lang]}
      </a>
      <HeroIntro />
      <Nav />
      {/* one wrapper for the page and the footer, so the soil life can rise from the footer into the page */}
      <div className="relative isolate">
        <PageMicrobes />
        {/* overflow-x-clip: art that bleeds past the gutter (the crate's steel table) is cut at the edge instead of
            scrolling sideways; clip, unlike hidden, keeps the sticky panels working */}
        <main id="main" className="overflow-x-clip">
          <Hero lang={lang} />
          <About lang={lang} />
          <Mission lang={lang} />
          <Ecosystem lang={lang} />
          <Clients lang={lang} />
          <Producers lang={lang} />
          <Impact lang={lang} />
          <Contact lang={lang} />
        </main>
        <Footer lang={lang} />
      </div>
      <TermsNotice />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({ ...jsonLd, description: ORG_DESC[lang] }) }}
      />
    </LangProvider>
  );
}

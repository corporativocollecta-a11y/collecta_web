import type { Metadata } from "next";
import { Geo } from "next/font/google";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { TermsAcceptancePopup } from "@/components/TermsAcceptancePopup";
import "./globals.css";

const geo = Geo({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  style: ["normal", "italic"],
});

const SITE_URL = "https://collectaproduce.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Collecta | Ecosistema Agroindustrial B2B — Trazabilidad y Exportación",
    template: "%s | Collecta Produce",
  },
  description:
    "Collecta integra productores mexicanos con clientes corporativos en EE.UU. y Canadá. Trazabilidad blockchain, supervisión técnica semanal y cadena de frío garantizada para hortalizas frescas.",
  keywords: [
    "agtech México",
    "agroindustria B2B",
    "trazabilidad agrícola",
    "exportación hortalizas",
    "productores mexicanos",
    "agricultura de precisión",
    "Collecta Produce",
    "cadena de frío",
    "supply chain agrícola",
    "Puebla agricultura",
  ],
  authors: [{ name: "Collecta Produce LLC", url: SITE_URL }],
  creator: "Collecta Produce LLC",
  publisher: "Collecta Produce LLC",
  applicationName: "Collecta",
  category: "agriculture",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    alternateLocale: ["en_US"],
    url: SITE_URL,
    siteName: "Collecta",
    title: "Collecta | Ecosistema Agroindustrial B2B — Trazabilidad y Exportación",
    description:
      "Conectamos productores mexicanos con clientes corporativos en EE.UU. y Canadá. Trazabilidad blockchain, supervisión técnica semanal y cadena de frío garantizada.",
    images: [
      {
        url: "/hero/tech-plants.jpeg",
        width: 1200,
        height: 630,
        alt: "Collecta — Tecnología de precisión aplicada a cultivos de hortalizas frescas en México",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Collecta | Ecosistema Agroindustrial B2B",
    description:
      "Trazabilidad blockchain, supervisión semanal y exportación garantizada de hortalizas mexicanas a EE.UU. y Canadá.",
    images: ["/hero/tech-plants.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/assets/logo-icon.png",
    apple: "/assets/logo-icon.png",
  },
  // verification: { google: 'TODO: pegar token de Google Search Console aquí' },
};

/**
 * Structured data (JSON-LD) for Organization.
 * Helps Google render rich results and link the brand to a knowledge panel.
 */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Collecta Produce LLC",
  legalName: "Collecta Produce LLC",
  alternateName: "Collecta",
  url: SITE_URL,
  logo: `${SITE_URL}/assets/logo.png`,
  description:
    "Ecosistema agroindustrial B2B que conecta productores mexicanos con clientes corporativos en EE.UU. y Canadá mediante trazabilidad blockchain y supervisión técnica.",
  foundingDate: "2020",
  taxID: "30-1388667",
  address: {
    "@type": "PostalAddress",
    streetAddress: "1110 Brickell Ave, Suite 200",
    addressLocality: "Miami",
    addressRegion: "FL",
    postalCode: "33131",
    addressCountry: "US",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "contacto@collectaproduce.com",
      availableLanguage: ["Spanish", "English"],
      areaServed: ["MX", "US", "CA"],
    },
    {
      "@type": "ContactPoint",
      contactType: "legal",
      email: "legal@collectaproduce.com",
      availableLanguage: ["Spanish", "English"],
    },
  ],
  subOrganization: {
    "@type": "Organization",
    name: "Distribuidor Interactivo Tameme S.A.P.I. de C.V.",
    taxID: "DIT200601QZ7",
    address: {
      "@type": "PostalAddress",
      addressCountry: "MX",
    },
  },
  areaServed: [
    { "@type": "Country", name: "Mexico" },
    { "@type": "Country", name: "United States" },
    { "@type": "Country", name: "Canada" },
  ],
  knowsAbout: [
    "Agroindustria",
    "Trazabilidad agrícola",
    "Agricultura de precisión",
    "Exportación de hortalizas",
    "Cadena de frío",
    "Supply chain agrícola",
  ],
  sameAs: [
    // TODO: agregar perfiles oficiales cuando se confirmen URLs
    // "https://www.linkedin.com/company/collecta-produce",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geo.variable} h-full antialiased scroll-smooth`}
    >
      <body
        className="min-h-full flex flex-col font-sans text-primary"
        style={{ backgroundColor: '#0f1612' }}
      >
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <LocaleProvider>{children}</LocaleProvider>
        <TermsAcceptancePopup />
      </body>
    </html>
  );
}

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

export const metadata: Metadata = {
  title: "Collecta | Transformando la Agroindustria",
  description: "Ecosistema integrado de producción agroalimentaria. Trazabilidad, tecnología y comercialización para productores y clientes corporativos.",
  keywords: ["agtech", "agricultura", "trazabilidad", "innovación", "México"],
  openGraph: {
    title: "Collecta | Transformando la Agroindustria",
    description: "Ecosistema integrado de producción agroalimentaria con tecnología de precisión",
    type: "website",
  },
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
        <LocaleProvider>{children}</LocaleProvider>
        <TermsAcceptancePopup />
      </body>
    </html>
  );
}

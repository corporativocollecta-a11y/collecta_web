import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
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
      className={`${geist.variable} h-full antialiased scroll-smooth`}
    >
      <body
        className="min-h-full flex flex-col font-sans text-primary"
        style={{ backgroundColor: '#0f1612' }}
      >
        {children}
      </body>
    </html>
  );
}

import type { Viewport } from "next";
import "../globals.css";
import { fontVars } from "../fonts";

/* Root layout for the legal pages (/privacidad, /terminos). They exist only in Spanish,
   exactly as on the previous site, so they sit outside the [lang] routes. */

export const viewport: Viewport = { themeColor: "#0b120d" };

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fontVars} antialiased`}>
      <body className="min-h-dvh text-foreground">{children}</body>
    </html>
  );
}

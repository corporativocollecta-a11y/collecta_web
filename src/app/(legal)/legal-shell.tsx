import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

/* Shared frame for the legal pages: the brand bar, a readable column, and the text
   itself (copied verbatim from the previous site). */
export function LegalShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b border-(--line)">
        <div className="page-col flex h-16 items-center justify-between gap-6">
          <Link href="/es" className="press flex items-center" aria-label="Collecta, inicio">
            <Image
              src="/images/logo.png"
              alt="Collecta"
              width={140}
              height={33}
              loading="eager"
              style={{ width: "auto" }}
              className="h-7 w-auto brightness-0 invert"
            />
          </Link>
          <Link
            href="/es"
            className="press inline-flex min-h-11 items-center gap-2 text-sm text-foreground/75 hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden /> Volver al inicio
          </Link>
        </div>
      </header>
      <main className="page-col py-16 sm:py-24">
        <article className="legal mx-auto max-w-3xl">{children}</article>
      </main>
    </>
  );
}

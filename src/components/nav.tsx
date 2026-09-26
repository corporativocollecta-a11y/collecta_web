"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useLang } from "@/components/lang-provider";
import { HOME, type Copy, type Lang } from "@/lib/i18n";

const LINKS: Copy<{ href: string; label: string }[]> = {
  en: [
    { href: "#ecosistema", label: "Ecosystem" },
    { href: "#clientes", label: "Buyers" },
    { href: "#productores", label: "Growers" },
    { href: "#impacto", label: "Impact" },
    { href: "#contacto", label: "Contact" },
  ],
  es: [
    { href: "#ecosistema", label: "Ecosistema" },
    { href: "#clientes", label: "Clientes" },
    { href: "#productores", label: "Productores" },
    { href: "#impacto", label: "Impacto" },
    { href: "#contacto", label: "Contacto" },
  ],
};

const T: Copy<{ nav: string; home: string; platform: string; open: string; menu: string; switchTo: string }> = {
  en: { nav: "Main", home: "Collecta, home", platform: "COS Platform", open: "Open menu", menu: "Menu", switchTo: "Language" },
  es: { nav: "Principal", home: "Collecta, inicio", platform: "Plataforma COS", open: "Abrir menú", menu: "Menú", switchTo: "Idioma" },
};

const PLATFORM = "https://app.collectaproduce.com/";

/* EN / ES switch: two plain links, the current language marked */
function LangSwitch({ lang, className }: { lang: Lang; className?: string }) {
  const t = T[lang];
  return (
    <div role="group" aria-label={t.switchTo} className={cn("eyebrow flex items-center rounded-full border border-(--line) p-1", className)}>
      {(["en", "es"] as const).map((l) => (
        <a
          key={l}
          href={HOME[l]}
          hrefLang={l}
          lang={l}
          aria-current={l === lang ? "true" : undefined}
          aria-label={l === "en" ? "English" : "Español"}
          className={cn(
            "press grid h-8 min-w-9 place-items-center rounded-full px-2 transition-colors duration-150 ease-(--ease-out)",
            l === lang ? "bg-foreground/10 text-foreground" : "text-foreground/55 hover:text-foreground",
          )}
        >
          {l.toUpperCase()}
        </a>
      ))}
    </div>
  );
}

export function Nav() {
  const lang = useLang();
  const t = T[lang];
  const links = LINKS[lang];
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300 ease-(--ease-out)",
        scrolled
          ? "border-b border-(--line) bg-background/75 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav
        aria-label={t.nav}
        className="flex h-16 page-col items-center justify-between gap-6"
      >
        <a href="#top" className="press flex items-center" aria-label={t.home}>
          <Image
            src="/images/logo.png"
            alt="Collecta"
            width={140}
            height={33}
            priority
            style={{ width: "auto" }}
            className="h-7 w-auto brightness-0 invert"
          />
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="press rounded-full px-4 py-2 text-sm text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <LangSwitch lang={lang} />
          <a
            href={PLATFORM}
            className="press inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-[#b3e083]"
          >
            {t.platform} <ArrowUpRight className="size-4" aria-hidden />
          </a>
        </div>

        <Sheet>
          <SheetTrigger
            className="press grid size-11 place-items-center rounded-full border border-(--line) lg:hidden"
            aria-label={t.open}
          >
            <Menu className="size-5" aria-hidden />
          </SheetTrigger>
          <SheetContent side="right" className="w-full border-(--line) bg-background p-6 sm:max-w-sm">
            <SheetTitle className="eyebrow mt-2">{t.menu}</SheetTitle>
            <ul className="mt-8 flex flex-col">
              {links.map((l, i) => (
                <li key={l.href} className="border-b border-(--line)">
                  <SheetClose asChild>
                    <a href={l.href} className="flex items-baseline justify-between py-4 text-3xl font-medium tracking-tight">
                      {l.label}
                      <span className="eyebrow">0{i + 1}</span>
                    </a>
                  </SheetClose>
                </li>
              ))}
            </ul>
            <LangSwitch lang={lang} className="mt-8 self-start" />
            <a
              href={PLATFORM}
              className="press mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-medium text-primary-foreground"
            >
              {t.platform} <ArrowUpRight className="size-4" aria-hidden />
            </a>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}

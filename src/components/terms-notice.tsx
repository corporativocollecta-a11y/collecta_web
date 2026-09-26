"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLang } from "@/components/lang-provider";
import type { Copy } from "@/lib/i18n";

/* The live site's terms window, same words and same rule: the button stays off until the
   box is ticked. It floats in a corner instead of covering the page, and once accepted it
   doesn't come back on this browser. */

const KEY = "collecta-terminos";
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// the terms page itself only exists in Spanish, so both languages link to it
const T: Copy<{
  region: string;
  lead: string;
  pre: string;
  link: string;
  post: string;
  accept: string;
}> = {
  en: {
    region: "Terms and conditions",
    lead: "You must accept our terms and conditions to continue.",
    pre: "I accept Collecta's",
    link: "terms and conditions",
    post: "",
    accept: "Accept",
  },
  es: {
    region: "Términos y condiciones",
    lead: "Debes aceptar nuestros términos y condiciones para continuar.",
    pre: "Acepto los",
    link: "términos y condiciones",
    post: "de Collecta",
    accept: "Aceptar",
  },
};

export function TermsNotice() {
  const t = T[useLang()];
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const reduce = useReducedMotion() ?? false;
  const id = useId();

  useEffect(() => {
    // wait a beat so the hero lands first; storage can throw in private windows
    const t = setTimeout(() => {
      let accepted = false;
      try {
        accepted = localStorage.getItem(KEY) === "1";
      } catch {}
      if (!accepted) setOpen(true);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-terms
          role="region"
          aria-label={t.region}
          initial={{
            opacity: 0,
            transform: reduce ? "translateY(0px)" : "translateY(16px)",
          }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          exit={{
            opacity: 0,
            transform: reduce ? "translateY(0px)" : "translateY(8px)",
            transition: { duration: 0.18, ease: EASE_OUT },
          }}
          transition={{ duration: 0.26, ease: EASE_OUT }}
          className="fixed inset-x-4 bottom-4 z-40 rounded-2xl border border-(--line) bg-card p-5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.8)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[22rem] sm:p-6"
        >
          <p className="text-sm text-foreground/85">
            {t.lead}
          </p>
          <label
            htmlFor={id}
            className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-foreground/85"
          >
            <input
              id={id}
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary"
            />
            <span>
              {t.pre}{" "}
              <a
                href="/terminos"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                {t.link}
              </a>
              {t.post && ` ${t.post}`}
            </span>
          </label>
          <button
            type="button"
            disabled={!checked}
            onClick={accept}
            className="press mt-5 h-11 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:bg-foreground/10 disabled:text-foreground/40"
          >
            {t.accept}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

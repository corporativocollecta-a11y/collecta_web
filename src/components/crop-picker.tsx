"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/components/lang-provider";
import type { Copy } from "@/lib/i18n";

/* Pick one or more crops as chips; "Otro" opens a free-text field. The value leaves as the
   same plain text the live form sent ("Brócoli, Coliflor, …"), so the API doesn't change.
   The first five are the live site's own crop list; ejote, zanahoria and jitomate are the
   other crops the page shows. */

export const CROPS = [
  "Brócoli",
  "Coliflor",
  "Lechuga",
  "Col",
  "Ejote",
  "Zanahoria",
  "Jitomate",
];
/* Display names only: the picked values (and so cropText) stay Spanish for the API */
const CROP_LABEL: Copy<Record<string, string>> = {
  en: {
    Brócoli: "Broccoli",
    Coliflor: "Cauliflower",
    Lechuga: "Lettuce",
    Col: "Cabbage",
    Ejote: "Green beans",
    Zanahoria: "Carrot",
    Jitomate: "Tomato",
  },
  es: Object.fromEntries(CROPS.map((c) => [c, c])),
};
const T: Copy<{ other: string; otherLabel: string; otherPh: string }> = {
  en: {
    other: "Other",
    otherLabel: "Other crops",
    otherPh: "Type other crops, separated by commas",
  },
  es: {
    other: "Otro",
    otherLabel: "Otros cultivos",
    otherPh: "Escribe otros cultivos, separados por coma",
  },
};
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export type CropValue = { picked: string[]; other: boolean; otherText: string };
export const CROP0: CropValue = { picked: [], other: false, otherText: "" };
export const cropText = (v: CropValue) =>
  [
    ...v.picked,
    ...(v.other && v.otherText.trim() ? [v.otherText.trim()] : []),
  ].join(", ");

export function CropPicker({
  id,
  label,
  hint,
  error,
  value,
  onChange,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  value: CropValue;
  onChange: (v: CropValue) => void;
  className?: string;
}) {
  const lang = useLang();
  const t = T[lang];
  const reduce = useReducedMotion() ?? false;
  const toggle = (c: string) =>
    onChange({
      ...value,
      picked: value.picked.includes(c)
        ? value.picked.filter((x) => x !== c)
        : [...value.picked, c],
    });

  const chip = (on: boolean) =>
    cn(
      "press inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-[background-color,border-color,color] duration-150 ease-(--ease-out)",
      on
        ? "border-primary bg-primary text-primary-foreground"
        : error
          ? "border-signal text-foreground/80"
          : "border-(--line) text-foreground/80 hover:border-foreground/30 hover:text-foreground",
    );

  return (
    <fieldset
      className={className}
      aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
    >
      <legend className="block text-sm text-foreground/80">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {CROPS.map((c, k) => {
          const on = value.picked.includes(c);
          return (
            <button
              key={c}
              id={k === 0 ? id : undefined}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(c)}
              className={chip(on)}
            >
              {on && <Check className="size-3.5" aria-hidden />}
              {CROP_LABEL[lang][c] ?? c}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={value.other}
          aria-controls={`${id}-otro`}
          onClick={() => onChange({ ...value, other: !value.other })}
          className={chip(value.other)}
        >
          {value.other ? (
            <Check className="size-3.5" aria-hidden />
          ) : (
            <Plus className="size-3.5" aria-hidden />
          )}
          {t.other}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {value.other && (
          <motion.div
            key="otro"
            initial={{
              opacity: 0,
              transform: reduce ? "none" : "translateY(-4px)",
            }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
          >
            <label htmlFor={`${id}-otro`} className="sr-only">
              {t.otherLabel}
            </label>
            <input
              id={`${id}-otro`}
              value={value.otherText}
              onChange={(e) =>
                onChange({ ...value, otherText: e.target.value })
              }
              placeholder={t.otherPh}
              className="mt-3 h-12 w-full rounded-xl border border-(--line) bg-foreground/[0.03] px-4 text-base text-foreground outline-none placeholder:text-foreground/35 focus:border-primary focus:bg-foreground/[0.06]"
            />
          </motion.div>
        )}
      </AnimatePresence>
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-xs text-signal" role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </fieldset>
  );
}

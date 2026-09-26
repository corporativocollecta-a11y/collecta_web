/* Two languages: English is the default and lives at "/", Spanish at "/es".
   Components keep their own copy as { en, es } objects next to the markup, so a text
   and its translation are always edited together. */

export const LANGS = ["en", "es"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "en";

export const isLang = (s: string): s is Lang =>
  (LANGS as readonly string[]).includes(s);

/** the home URL of each language */
export const HOME: Record<Lang, string> = { en: "/", es: "/es" };

/** copy object with one entry per language */
export type Copy<T> = Record<Lang, T>;

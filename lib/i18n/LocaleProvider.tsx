'use client';

/**
 * Client-side i18n provider for the Collecta web.
 *
 * Stores the active locale in a cookie + localStorage so the choice survives
 * navigation and refresh. Exposes a `useT(key)` hook for components to look
 * up translated strings, and a `useLocale()` hook for the language toggle.
 *
 * Initial locale resolution order on first paint:
 *   1. `collecta_locale` cookie / localStorage  (user chose previously)
 *   2. `navigator.language` if it starts with "en"
 *   3. DEFAULT_LOCALE (es)
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_LOCALE,
  messages,
  type Locale,
} from './messages';

const LOCALE_STORAGE_KEY = 'collecta_locale';
const LOCALE_COOKIE_NAME = 'collecta_locale';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  toggle: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): Locale | null {
  if (typeof document === 'undefined') return null;
  // Prefer cookie (works for SSR-set values too)
  const cookieMatch = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE_NAME}=([^;]+)`)
  );
  const raw = cookieMatch?.[1] ?? localStorage.getItem(LOCALE_STORAGE_KEY);
  if (raw === 'es' || raw === 'en') return raw;
  return null;
}

function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
  const lang = (navigator.language || 'es').toLowerCase();
  return lang.startsWith('en') ? 'en' : DEFAULT_LOCALE;
}

function persistLocale(next: Locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
  } catch {
    /* localStorage may be blocked — cookie is the fallback */
  }
  document.cookie = `${LOCALE_COOKIE_NAME}=${next}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`
  );
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Start with the default to avoid SSR/CSR mismatch; reconcile in useEffect.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = readStoredLocale();
    const initial = stored ?? detectBrowserLocale();
    if (initial !== locale) setLocaleState(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next;
    }
  }, []);

  const toggle = useCallback(() => {
    setLocale(locale === 'es' ? 'en' : 'es');
  }, [locale, setLocale]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = messages[locale];
      const raw = dict[key] ?? messages[DEFAULT_LOCALE][key] ?? key;
      return interpolate(raw, vars);
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, toggle, t }),
    [locale, setLocale, toggle, t]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider');
  return ctx;
}

export function useT() {
  return useLocale().t;
}

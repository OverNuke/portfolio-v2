import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DICTIONARIES, type Dictionary, type DictionaryKey, type Locale } from "./dictionary";

interface I18nContextValue {
  locale: Locale;
  t: (key: DictionaryKey) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

// Hand-rolled typed context, zero new runtime deps (D's i18n posture). Full
// site EN/ES per obs #385; each section extends DICTIONARIES as it lands.
export function I18nProvider({ children, defaultLocale = "en" }: { children: ReactNode; defaultLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const dict: Dictionary = DICTIONARIES[locale];
  const t = (key: DictionaryKey) => dict[key] ?? DICTIONARIES.en[key] ?? key;

  return <I18nContext.Provider value={{ locale, t, setLocale }}>{children}</I18nContext.Provider>;
}

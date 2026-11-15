"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { localeTags, type Locale } from "./config";
import type { Dictionary } from "./dictionaries/zh";

interface I18nValue {
  locale: Locale;
  /** BCP 47 tag for Intl formatters. */
  tag: string;
  dict: Dictionary;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ locale, tag: localeTags[locale], dict }),
    [locale, dict],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}

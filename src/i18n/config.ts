export const locales = ["zh", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** BCP 47 tags used for <html lang> and Intl formatting. */
export const localeTags: Record<Locale, string> = {
  zh: "zh-CN",
  en: "en-US",
};

export const localeLabels: Record<Locale, string> = {
  zh: "中文",
  en: "EN",
};

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/** Picks a supported locale from an Accept-Language header. */
export function pickLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  const preferred = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0].trim().toLowerCase());
  for (const tag of preferred) {
    const base = tag.split("-")[0];
    if (hasLocale(base)) return base;
  }
  return defaultLocale;
}

/** Replaces `{name}` placeholders in a dictionary string. */
export function fmt(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

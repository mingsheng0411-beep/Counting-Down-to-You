import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/zh";

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  zh: () => import("./dictionaries/zh").then((m) => m.zh),
  en: () => import("./dictionaries/en").then((m) => m.en),
};

export const getDictionary = (locale: Locale): Promise<Dictionary> =>
  loaders[locale]();

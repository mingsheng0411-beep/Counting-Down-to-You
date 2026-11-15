import type { Metadata } from "next";
import { notFound } from "next/navigation";

import "@fontsource-variable/inter";
import "../globals.css";

import { hasLocale, localeTags, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { I18nProvider } from "@/i18n/i18n-provider";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { title: dict.meta.title, description: dict.meta.description };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <html lang={localeTags[lang]} className="h-full antialiased">
      <body className="min-h-full">
        <div className="sky" aria-hidden />
        <I18nProvider locale={lang} dict={dict}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}

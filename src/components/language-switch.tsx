"use client";

import Link from "next/link";

import { localeLabels, locales } from "@/i18n/config";
import { useI18n } from "@/i18n/i18n-provider";
import { cx } from "@/lib/cx";

/** `path` is the current route without its locale prefix, e.g. "/space". */
export function LanguageSwitch({ path = "" }: { path?: string }) {
  const { locale } = useI18n();
  return (
    <div className="flex items-center rounded-full bg-ink/5 p-0.5 text-xs">
      {locales.map((option) => (
        <Link
          key={option}
          href={`/${option}${path}`}
          aria-current={option === locale ? "true" : undefined}
          className={cx(
            "rounded-full px-3 py-1.5 transition",
            option === locale
              ? "bg-white font-bold text-ink shadow-[0_1px_3px_rgb(20_70_150/0.18)]"
              : "font-medium text-faint hover:text-ink",
          )}
        >
          {localeLabels[option]}
        </Link>
      ))}
    </div>
  );
}

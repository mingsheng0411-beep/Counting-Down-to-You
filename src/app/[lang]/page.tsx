import Link from "next/link";
import { notFound } from "next/navigation";

import { Brand } from "@/components/brand";
import { LanguageSwitch } from "@/components/language-switch";
import { buttonClass } from "@/components/ui/button";
import { HeroStage } from "@/features/landing/hero-stage";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

const featureIcons = {
  countdown: <path d="M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />,
  distance: (
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z" />
  ),
  memories: (
    <path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5zM4 15l4.5-4.5 4 4L15 12l5 5M15.5 9h.01" />
  ),
  plan: <path d="M3 11.5 20.5 4l-6 17-3.5-7.5zM11 13.5 20.5 4" />,
} as const;

export default async function LandingPage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.landing;
  const spaceHref = `/${lang}/space`;

  const features = (["countdown", "distance", "memories", "plan"] as const).map(
    (key) => ({ key, ...t.features[key], soon: key === "plan" }),
  );

  return (
    <>
      <header className="fixed inset-x-0 top-3 z-30 mx-auto max-w-[112rem] px-3 sm:px-6">
        <div className="glass flex items-center justify-between gap-3 rounded-full py-2 pr-2 pl-4">
          <Brand href={`/${lang}`} name={dict.brand} compact />
          <div className="flex items-center gap-2">
            <LanguageSwitch />
            <Link href={spaceHref} className={buttonClass("primary", "sm") + " shrink-0 whitespace-nowrap"}>
              {t.open}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <HeroStage>
          <div className="glass rounded-[2rem] p-6 sm:p-8">
            <p className="text-sm font-semibold text-mute sm:text-base">
              {t.eyebrow}
            </p>
            <h1 className="mt-2 text-[clamp(2.4rem,6.4vw,5rem)] leading-[1.04] font-bold tracking-[-0.045em]">
              {t.title}
            </h1>
            <p className="mt-4 max-w-xl leading-relaxed font-medium text-mute sm:text-lg">
              {t.sub}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link
                href={spaceHref}
                className={buttonClass("primary", "md") + " px-7 py-3 text-base"}
              >
                {t.cta}
              </Link>
              <p className="text-xs font-medium text-faint">{t.note}</p>
            </div>
          </div>
        </HeroStage>

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <h2 className="text-4xl font-bold tracking-[-0.03em] sm:text-6xl">
            {t.featuresTitle}
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <li key={feature.key} className="glass rounded-[1.75rem] p-6">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-full bg-sea/70 text-ink">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      {featureIcons[feature.key]}
                    </svg>
                  </span>
                  {feature.soon && (
                    <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-semibold text-mute">
                      {t.soon}
                    </span>
                  )}
                </div>
                <h3 className="mt-5 text-xl font-bold tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed font-medium text-mute">
                  {feature.body}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="px-5 py-10 text-center text-xs font-medium text-faint">
        {t.footer}
      </footer>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";

import { getPlaceInfoProvider } from "@/data";
import type { PlaceInfo } from "@/data/place-info";
import { distanceKm } from "@/domain/geo";
import { formatUtcOffset, tzOffsetMinutes } from "@/domain/time";
import { localize, type City } from "@/domain/types";
import { useSpace } from "@/features/space/space-context";
import { useCityWeather } from "@/features/weather/use-space-weather";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/i18n-provider";
import { useNow } from "@/lib/use-now";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-faint">{label}</p>
      <p className="truncate text-base font-bold tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}

/**
 * A side sheet about one place: where it is, what time and weather it has,
 * how far it is from each partner, and a short introduction.
 */
export function PlacePanel({
  city,
  onClose,
}: {
  city: City;
  onClose: () => void;
}) {
  const { space } = useSpace();
  const { dict, locale, tag } = useI18n();
  const now = useNow();
  const weather = useCityWeather(city, true);
  const t = dict.places;

  // undefined: still loading; null: nothing found.
  const [loaded, setLoaded] = useState<{
    key: string;
    info: PlaceInfo | null;
  } | null>(null);
  const key = `${city.id}:${locale}`;

  useEffect(() => {
    let cancelled = false;
    getPlaceInfoProvider()
      .getInfo(city, locale)
      .then((info) => {
        if (!cancelled) setLoaded({ key, info });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key, info: null });
      });
    return () => {
      cancelled = true;
    };
  }, [city, locale, key]);

  const info = loaded?.key === key ? loaded.info : undefined;
  const name = localize(city.name, locale);
  const otherName = locale === "en" ? city.name.zh : city.name.en;
  const country = new Intl.DisplayNames([tag], { type: "region" }).of(
    city.country,
  );
  const number = (value: number) =>
    value.toLocaleString(tag, { maximumFractionDigits: 0 });

  const time =
    now === null
      ? "––:––"
      : new Intl.DateTimeFormat(tag, {
          timeZone: city.timeZone,
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).format(now);
  const offset =
    now === null ? "" : formatUtcOffset(tzOffsetMinutes(city.timeZone, now));

  const weatherLabels = {
    "clear-day": dict.weather.clear,
    "clear-night": dict.weather.clear,
    cloudy: dict.weather.cloudy,
    rain: dict.weather.rain,
    snow: dict.weather.snow,
  };

  return (
    <aside
      aria-label={name}
      className="glass-thick pointer-events-auto absolute top-[4.75rem] bottom-3 left-3 z-20 flex w-[min(23rem,calc(100%-1.5rem))] flex-col overflow-hidden rounded-[2rem] sm:left-6"
    >
      <div className="flex justify-end px-4 pt-4">
        <button
          type="button"
          onClick={onClose}
          aria-label={dict.common.close}
          className="grid size-9 place-items-center rounded-full bg-ink/5 text-mute transition hover:bg-ink/10 hover:text-ink"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="overflow-y-auto px-6 pb-6">
        <h2 className="text-center text-4xl font-bold tracking-[-0.03em]">
          {name}
        </h2>
        <p className="mt-1 text-center text-sm font-medium text-mute">
          {[otherName !== name ? otherName : null, city.region, country]
            .filter(Boolean)
            .join(" · ")}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 rounded-3xl bg-sea/50 p-4">
          <Fact label={t.localTime} value={`${time}  ${offset}`} />
          <Fact
            label={t.weather}
            value={
              weather
                ? `${weatherLabels[weather.kind]} ${Math.round(weather.temperatureC)}°`
                : "—"
            }
          />
          {(["a", "b"] as const).map((slot) => (
            <Fact
              key={slot}
              label={fmt(t.distanceFrom, { name: space.partners[slot].name })}
              value={`${number(distanceKm(city, space.partners[slot].city))} ${dict.distance.km}`}
            />
          ))}
          {city.population ? (
            <Fact label={t.population} value={number(city.population)} />
          ) : null}
          {typeof city.elevation === "number" ? (
            <Fact label={t.elevation} value={`${number(city.elevation)} m`} />
          ) : null}
        </div>

        <h3 className="mt-7 text-xl font-bold tracking-tight">{t.about}</h3>
        {info === undefined && (
          <p className="mt-2 animate-pulse font-medium text-faint">
            {t.loadingInfo}
          </p>
        )}
        {info === null && (
          <p className="mt-2 font-medium text-mute">{t.noInfo}</p>
        )}
        {info && (
          <>
            {info.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- remote encyclopedia thumbnail
              <img
                src={info.imageUrl}
                alt={name}
                className="mt-3 aspect-[16/10] w-full rounded-2xl object-cover"
              />
            )}
            <p className="mt-3 leading-relaxed whitespace-pre-line text-ink/85">
              {info.text}
            </p>
            {info.sourceUrl && (
              <p className="mt-2 text-xs font-medium text-faint">
                {t.moreOn}{" "}
                <a
                  href={info.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-ink underline decoration-sea decoration-2 underline-offset-2"
                >
                  {t.wikipedia}
                </a>
              </p>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

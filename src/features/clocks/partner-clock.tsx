"use client";

import { isDaylight } from "@/domain/geo";
import { formatUtcOffset, tzOffsetMinutes } from "@/domain/time";
import { localize, type PartnerSlot } from "@/domain/types";
import type { Weather, WeatherKind } from "@/domain/weather";
import { MoodChip } from "@/features/mood/mood-chip";
import { useSpace } from "@/features/space/space-context";
import type { Dictionary } from "@/i18n/dictionaries/zh";
import { useI18n } from "@/i18n/i18n-provider";
import { useNow } from "@/lib/use-now";

const weatherLabel = (kind: WeatherKind, t: Dictionary["weather"]) =>
  ({
    "clear-day": t.clear,
    "clear-night": t.clear,
    cloudy: t.cloudy,
    rain: t.rain,
    snow: t.snow,
  })[kind];

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3 7 7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
    </svg>
  );
}

/** One partner's city, local time, daylight and weather. */
export function PartnerClock({
  slot,
  weather,
}: {
  slot: PartnerSlot;
  weather: Weather | null;
}) {
  const { space } = useSpace();
  const { dict, locale, tag } = useI18n();
  const now = useNow();
  const partner = space.partners[slot];
  const { city } = partner;

  const country = new Intl.DisplayNames([tag], { type: "region" }).of(
    city.country,
  );
  const time =
    now === null
      ? "––:––"
      : new Intl.DateTimeFormat(tag, {
          timeZone: city.timeZone,
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).format(now);
  const date =
    now === null
      ? " "
      : new Intl.DateTimeFormat(tag, {
          timeZone: city.timeZone,
          weekday: "short",
          month: "short",
          day: "numeric",
        }).format(now);
  const daylight = now === null ? null : isDaylight(city, now);
  const offset =
    now === null ? "" : formatUtcOffset(tzOffsetMinutes(city.timeZone, now));

  return (
    <div className="glass flex items-end justify-between gap-4 rounded-[1.75rem] px-5 py-4 sm:px-6 sm:py-5">
      <div className="min-w-0">
        <p className="text-base font-bold">{partner.name}</p>
        <p className="truncate text-sm font-medium text-mute">
          {localize(city.name, locale)}
          {country && <span className="text-faint"> · {country}</span>}
        </p>
        <p className="mt-2 text-5xl leading-none font-bold tracking-[-0.04em] tabular-nums">
          {time}
        </p>
        <p className="mt-2 text-xs font-medium text-mute sm:text-sm">
          {date}
          {offset && <span className="ml-2 text-faint">{offset}</span>}
        </p>
        <div className="mt-2.5">
          <MoodChip slot={slot} />
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5 text-xs font-bold">
        {weather && (
          <p className="rounded-full bg-sea/70 px-3 py-1.5 tabular-nums">
            {weatherLabel(weather.kind, dict.weather)}{" "}
            {Math.round(weather.temperatureC)}°
          </p>
        )}
        {daylight !== null && (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-sea/70 px-3 py-1.5">
            {daylight ? <SunIcon /> : <MoonIcon />}
            {daylight ? dict.clocks.day : dict.clocks.night}
          </p>
        )}
      </div>
    </div>
  );
}

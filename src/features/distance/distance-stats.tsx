"use client";

import { distanceKm, flightHours } from "@/domain/geo";
import { tzOffsetMinutes } from "@/domain/time";
import { useSpace } from "@/features/space/space-context";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/i18n-provider";
import { useNow } from "@/lib/use-now";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-3xl px-5 py-4">
      <p className="text-xs font-semibold text-faint">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

/** The time difference and roughly how long the flight is. */
export function DistanceStats() {
  const { space } = useSpace();
  const { dict, tag } = useI18n();
  const now = useNow();
  const t = dict.distance;
  const { a, b } = space.partners;

  const km = distanceKm(a.city, b.city);
  const sameCity = km < 1;
  const number = (value: number, digits = 0) =>
    value.toLocaleString(tag, { maximumFractionDigits: digits });

  let timeDiff = " ";
  if (now !== null) {
    const diff =
      tzOffsetMinutes(b.city.timeZone, now) -
      tzOffsetMinutes(a.city.timeZone, now);
    if (diff === 0) timeDiff = t.sameTime;
    else {
      const [ahead, behind] = diff > 0 ? [b, a] : [a, b];
      timeDiff = fmt(t.ahead, {
        a: behind.name,
        b: ahead.name,
        h: number(Math.abs(diff) / 60, 2),
      });
    }
  }

  return (
    <div className="mx-auto grid max-w-2xl grid-cols-2 gap-4">
      <Stat label={t.timeDiff} value={timeDiff} />
      {!sameCity && (
        <>
          <Stat
            label={t.flight}
            value={fmt(t.flightValue, { h: number(flightHours(km), 1) })}
          />
        </>
      )}
    </div>
  );
}

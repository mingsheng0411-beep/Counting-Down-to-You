"use client";

import { useEffect, useState } from "react";

import { getWeatherProvider } from "@/data";
import { isDaylight } from "@/domain/geo";
import type { City, PartnerSlot } from "@/domain/types";
import type { Weather } from "@/domain/weather";
import { useSpace } from "@/features/space/space-context";
import { useNow } from "@/lib/use-now";

const REFRESH_MS = 15 * 60_000;

/**
 * The sample pair always shows one clear and one rainy place, so both
 * drawings can be seen without waiting for the real sky to cooperate.
 */
export const demoWeather: Record<PartnerSlot, Weather> = {
  a: { kind: "clear-day", temperatureC: 18 },
  b: { kind: "rain", temperatureC: 12 },
};
const demoCityIds: Record<PartnerSlot, string> = { a: "maryland", b: "wuhan" };

/** Live weather for one place, or null while unknown or disabled. */
export function useCityWeather(city: City, enabled: boolean): Weather | null {
  const [result, setResult] = useState<{ cityId: string; weather: Weather } | null>(
    null,
  );
  const { id, lat, lng } = city;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = () =>
      getWeatherProvider()
        .getCurrent({ lat, lng })
        .then((weather) => {
          if (!cancelled) setResult({ cityId: id, weather });
        })
        .catch(() => {
          // No weather is fine: the map simply shows nothing above the city.
        });
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [enabled, id, lat, lng]);

  return enabled && result?.cityId === id ? result.weather : null;
}

/** Current weather where each partner is, or null while unknown. */
export function useSpaceWeather(): Record<PartnerSlot, Weather | null> {
  const { space, isDemo } = useSpace();
  const now = useNow();
  const cityA = space.partners.a.city;
  const cityB = space.partners.b.city;

  // The sample weather belongs to the sample cities; any other place is live.
  const sampleA = isDemo && cityA.id === demoCityIds.a;
  const sampleB = isDemo && cityB.id === demoCityIds.b;
  const liveA = useCityWeather(cityA, !sampleA);
  const liveB = useCityWeather(cityB, !sampleB);

  // A clear sample sky shows the moon rather than the sun after dark.
  const sample = (slot: PartnerSlot, city: City): Weather => {
    const weather = demoWeather[slot];
    const dark = now !== null && !isDaylight(city, now);
    return weather.kind === "clear-day" && dark
      ? { ...weather, kind: "clear-night" }
      : weather;
  };

  return {
    a: sampleA ? sample("a", cityA) : liveA,
    b: sampleB ? sample("b", cityB) : liveB,
  };
}

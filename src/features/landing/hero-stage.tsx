"use client";

import type { ReactNode } from "react";

import { getCity } from "@/domain/cities";
import { localize } from "@/domain/types";
import { MapStage } from "@/features/distance/map-stage";
import { demoWeather } from "@/features/weather/use-space-weather";
import { useI18n } from "@/i18n/i18n-provider";

const from = getCity("maryland");
const to = getCity("wuhan");

/**
 * The landing page's first screen: the same full-viewport map as the sample
 * space, with the headline card (passed as children) floating at the bottom.
 */
export function HeroStage({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  return (
    <MapStage
      a={{
        lat: from.lat,
        lng: from.lng,
        label: localize(from.name, locale),
        weather: demoWeather.a.kind,
        photoUrl: "/demo/sea-sunset.svg",
      }}
      b={{
        lat: to.lat,
        lng: to.lng,
        label: localize(to.name, locale),
        weather: demoWeather.b.kind,
        photoUrl: "/demo/city-night.svg",
      }}
      top={<div className="h-[4.75rem]" />}
      bottom={
        <div className="mx-auto max-w-[112rem] px-3 pb-4 sm:px-6 sm:pb-6">
          <div className="pointer-events-auto max-w-2xl">{children}</div>
        </div>
      }
    />
  );
}

"use client";

import { useMemo, useState, type ReactNode } from "react";

import { getCity } from "@/domain/cities";
import { featuredCityIds } from "@/domain/place-notes";
import { distanceKm } from "@/domain/geo";
import { localize, type City, type PartnerSlot } from "@/domain/types";
import { PartnerClock } from "@/features/clocks/partner-clock";
import { CountdownCard } from "@/features/countdown/countdown-card";
import { MapStage } from "@/features/distance/map-stage";
import { PlaceInput } from "@/features/places/place-input";
import { usePhotoUrl } from "@/features/memories/use-photo-url";
import { PlacePanel } from "@/features/places/place-panel";
import { useSpaceWeather } from "@/features/weather/use-space-weather";
import { useI18n } from "@/i18n/i18n-provider";
import { useNow } from "@/lib/use-now";

import { useSpace } from "./space-context";

/** Shortest signed difference between two longitudes, in degrees. */
const lngDelta = (from: number, to: number) =>
  ((((to - from) % 360) + 540) % 360) - 180;

function PlaceField({ slot }: { slot: PartnerSlot }) {
  const { space, updatePartner } = useSpace();
  const { dict } = useI18n();
  const partner = space.partners[slot];
  return (
    <label className="glass relative flex min-w-0 items-center gap-2 rounded-full py-1.5 pr-1.5 pl-3.5 focus-within:z-20">
      <span className="max-w-20 shrink-0 truncate text-xs font-bold text-faint">
        {partner.name}
      </span>
      <PlaceInput
        value={partner.city}
        onChange={(city) => void updatePartner(slot, { city })}
        label={`${partner.name} · ${dict.places.label}`}
        className="min-w-0 flex-1"
        inputClassName="w-full rounded-full bg-white/60 px-3 py-1.5 text-sm font-bold text-ink transition placeholder:font-medium placeholder:text-faint focus:bg-white focus:outline-none md:w-44"
      />
    </label>
  );
}

/**
 * The first screen of a space: the map fills the viewport, with the place
 * inputs and distance at the top left, the countdown at the top right and
 * both clocks along the bottom.
 */
export function SpaceStage({
  onEdit,
  notice,
}: {
  onEdit: () => void;
  /** Optional banner, e.g. the sample-space hint. */
  notice?: ReactNode;
}) {
  const { space, memories } = useSpace();
  const { dict, locale, tag } = useI18n();
  const now = useNow();

  // Photos from the couple's memories take turns floating beside each
  // place: newest first, split between the two sides, changing every 8s.
  const pictures = useMemo(
    () =>
      memories
        .filter((memory) => memory.photo)
        .sort((x, y) => y.date.localeCompare(x.date)),
    [memories],
  );
  const turn = now === null ? 0 : Math.floor(now / 8000);
  const pick = (offset: 0 | 1) => {
    const mine = pictures.filter((_, index) => index % 2 === offset);
    const pool = mine.length > 0 ? mine : pictures;
    return pool.length > 0 ? pool[turn % pool.length].photo : null;
  };
  const photoUrls = {
    a: usePhotoUrl(pick(0)),
    b: usePhotoUrl(pick(1)),
  };
  const weather = useSpaceWeather();
  const { a, b } = space.partners;
  const [opened, setOpened] = useState<City | null>(null);

  const featured = useMemo(
    () =>
      featuredCityIds.map((id) => {
        const city = getCity(id);
        return {
          id,
          lat: city.lat,
          lng: city.lng,
          label: localize(city.name, locale),
        };
      }),
    [locale],
  );

  const localTime = (city: City) =>
    now === null
      ? undefined
      : new Intl.DateTimeFormat(tag, {
          timeZone: city.timeZone,
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).format(now);

  const point = (slot: PartnerSlot) => {
    const { city, mood } = space.partners[slot];
    const name = localize(city.name, locale);
    return {
      lat: city.lat,
      lng: city.lng,
      label: mood?.emoji ? `${mood.emoji} ${name}` : name,
      detail: localTime(city),
      weather: weather[slot]?.kind ?? null,
      photoUrl: photoUrls[slot],
    };
  };

  // The distance is written on the map itself, under the route.
  const km = distanceKm(a.city, b.city);
  const routeLabel =
    km < 1
      ? null
      : `${Math.round(km).toLocaleString(tag)} ${dict.distance.km}`;

  // Clocks sit on the same side as their place on the map: west on the left.
  const westFirst: PartnerSlot[] =
    lngDelta(a.city.lng, b.city.lng) >= 0 ? ["a", "b"] : ["b", "a"];

  return (
    <>
      <MapStage
        a={point("a")}
        b={point("b")}
        routeLabel={routeLabel}
        places={featured}
        onSelectPoint={(index) => setOpened(index === 0 ? a.city : b.city)}
        onSelectPlace={(id) => setOpened(getCity(id))}
        top={
          <div className="mx-auto flex max-w-[112rem] flex-col gap-2.5 px-3 pt-[4.75rem] pb-3 sm:px-6 md:flex-row md:items-start md:justify-between md:gap-6">
            <div className="pointer-events-auto order-2 flex min-w-0 flex-col items-start gap-2.5 md:order-1">
              <div className="grid w-full grid-cols-2 gap-2 md:w-auto">
                <PlaceField slot="a" />
                <PlaceField slot="b" />
              </div>
              {notice && <div className="hidden md:block">{notice}</div>}
            </div>
            <div className="pointer-events-auto order-1 md:order-2">
              <CountdownCard onEdit={onEdit} />
            </div>
          </div>
        }
        bottom={
          <div className="mx-auto hidden max-w-[112rem] items-end justify-between gap-4 px-6 pb-6 md:flex">
            {westFirst.map((slot) => (
              <div key={slot} className="pointer-events-auto w-[min(23rem,44%)]">
                <PartnerClock slot={slot} weather={weather[slot]} />
              </div>
            ))}
          </div>
        }
      >
        {opened && (
          <PlacePanel
            key={opened.id}
            city={opened}
            onClose={() => setOpened(null)}
          />
        )}
      </MapStage>

      {/* On phones the clocks and banner follow the map instead of covering it. */}
      <div className="mt-4 grid gap-4 px-3 md:hidden">
        {notice}
        <PartnerClock slot="a" weather={weather.a} />
        <PartnerClock slot="b" weather={weather.b} />
      </div>
    </>
  );
}

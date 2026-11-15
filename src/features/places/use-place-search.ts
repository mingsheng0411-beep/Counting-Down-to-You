"use client";

import { useEffect, useMemo, useState } from "react";

import { getPlaceSearch } from "@/data";
import { searchCities } from "@/domain/cities";
import type { City } from "@/domain/types";

const DEBOUNCE_MS = 280;

const near = (x: City, y: City) =>
  Math.abs(x.lat - y.lat) < 0.3 && Math.abs(x.lng - y.lng) < 0.3;

/**
 * Suggestions for a typed place. Built-in cities answer instantly; the lookup
 * service fills in everything else a moment later.
 */
export function usePlaceSearch(query: string, locale: string): City[] {
  const trimmed = query.trim();
  const [remote, setRemote] = useState<{ query: string; places: City[] }>({
    query: "",
    places: [],
  });

  useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      getPlaceSearch()
        .search(trimmed, locale, controller.signal)
        .then((places) => setRemote({ query: trimmed, places }))
        .catch(() => {
          // Offline or blocked: the built-in cities still work.
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, locale]);

  return useMemo(() => {
    if (!trimmed) return [];
    const local = searchCities(trimmed).slice(0, 5);
    const found = remote.query === trimmed ? remote.places : [];
    const extra = found.filter((place) => !local.some((city) => near(city, place)));
    return [...local, ...extra].slice(0, 8);
  }, [trimmed, remote]);
}

import { distanceKm } from "@/domain/geo";
import { placeNotes } from "@/domain/place-notes";
import { localize, type City } from "@/domain/types";

import type { PlaceInfo, PlaceInfoProvider } from "../place-info";

interface Summary {
  type?: string;
  extract?: string;
  thumbnail?: { source?: string };
  content_urls?: { desktop?: { page?: string } };
  coordinates?: { lat: number; lon: number };
}

/** How far the article's own coordinates may be from the place we asked about. */
const SAME_PLACE_KM = 400;

async function fetchSummary(
  language: string,
  title: string,
  city: City,
): Promise<PlaceInfo | null> {
  const response = await fetch(
    `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    // Ask Chinese Wikipedia for simplified characters.
    { headers: language === "zh" ? { "Accept-Language": "zh-cn" } : undefined },
  );
  if (!response.ok) return null;
  const summary = (await response.json()) as Summary;
  if (summary.type === "disambiguation" || !summary.extract) return null;

  // A same-named article about somewhere else is worse than nothing.
  if (
    summary.coordinates &&
    distanceKm(city, {
      lat: summary.coordinates.lat,
      lng: summary.coordinates.lon,
    }) > SAME_PLACE_KM
  ) {
    return null;
  }
  return {
    text: summary.extract,
    imageUrl: summary.thumbnail?.source,
    sourceUrl: summary.content_urls?.desktop?.page,
    source: "wikipedia",
  };
}

/**
 * Introductions from Wikipedia's summary service, in the reader's language
 * when there is an article and in English otherwise. When Wikipedia cannot
 * be reached at all, falls back to the short notes written for this project.
 * Only the place's name is sent.
 */
export class WikipediaPlaceInfo implements PlaceInfoProvider {
  async getInfo(city: City, locale: string): Promise<PlaceInfo | null> {
    const attempts: Array<[language: string, title: string]> = [
      [locale, localize(city.name, locale)],
    ];
    if (locale !== "en") attempts.push(["en", city.name.en]);

    for (const [language, title] of attempts) {
      try {
        const info = await fetchSummary(language, title, city);
        if (info) return info;
      } catch {
        // Blocked or offline: fall through to the next source.
      }
    }

    const note = placeNotes[city.id];
    return note ? { text: localize(note, locale), source: "built-in" } : null;
  }
}

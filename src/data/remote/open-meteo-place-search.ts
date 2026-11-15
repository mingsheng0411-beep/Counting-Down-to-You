import type { City } from "@/domain/types";

import type { PlaceSearch } from "../place-search";

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country_code?: string;
  timezone?: string;
  admin1?: string;
  population?: number;
  elevation?: number;
}

/**
 * Place lookup from Open-Meteo's geocoding service: free, no account or key,
 * and every result carries its time zone. Only the typed text is sent.
 */
export class OpenMeteoPlaceSearch implements PlaceSearch {
  async search(
    query: string,
    locale: string,
    signal?: AbortSignal,
  ): Promise<City[]> {
    const url =
      "https://geocoding-api.open-meteo.com/v1/search" +
      `?name=${encodeURIComponent(query)}&count=8&format=json` +
      `&language=${encodeURIComponent(locale)}`;
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Place search failed: ${response.status}`);

    const { results = [] } = (await response.json()) as {
      results?: GeocodingResult[];
    };
    return results
      .filter((place) => place.timezone && place.country_code)
      .map((place) => ({
        id: `geo:${place.id}`,
        name: { en: place.name, [locale]: place.name },
        region: place.admin1 && place.admin1 !== place.name ? place.admin1 : undefined,
        country: place.country_code as string,
        lat: place.latitude,
        lng: place.longitude,
        timeZone: place.timezone as string,
        population: place.population,
        elevation: place.elevation,
      }));
  }
}

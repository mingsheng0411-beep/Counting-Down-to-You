import { IndexedDbSpaceRepository } from "./local/indexeddb-space-repository";
import type { PlaceInfoProvider } from "./place-info";
import type { PlaceSearch } from "./place-search";
import { OpenMeteoPlaceSearch } from "./remote/open-meteo-place-search";
import { OpenMeteoWeatherProvider } from "./remote/open-meteo-weather-provider";
import { WikipediaPlaceInfo } from "./remote/wikipedia-place-info";
import type { SpaceRepository } from "./space-repository";
import type { WeatherProvider } from "./weather-provider";

export type { PlaceSearch } from "./place-search";
export type { SpaceRepository } from "./space-repository";
export type { WeatherProvider } from "./weather-provider";

let repository: SpaceRepository | null = null;
let weatherProvider: WeatherProvider | null = null;
let placeSearch: PlaceSearch | null = null;
let placeInfo: PlaceInfoProvider | null = null;

/**
 * The single place that decides where data is stored. Swapping the browser
 * store for a cloud backend in V1 happens here and nowhere else.
 */
export function getSpaceRepository(): SpaceRepository {
  repository ??= new IndexedDbSpaceRepository();
  return repository;
}

/** The single place that decides which weather service is used. */
export function getWeatherProvider(): WeatherProvider {
  weatherProvider ??= new OpenMeteoWeatherProvider();
  return weatherProvider;
}

/** The single place that decides which place lookup service is used. */
export function getPlaceSearch(): PlaceSearch {
  placeSearch ??= new OpenMeteoPlaceSearch();
  return placeSearch;
}

/** The single place that decides where place introductions come from. */
export function getPlaceInfoProvider(): PlaceInfoProvider {
  placeInfo ??= new WikipediaPlaceInfo();
  return placeInfo;
}

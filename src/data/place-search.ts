import type { City } from "@/domain/types";

/** Turns what someone typed into places with coordinates and a time zone. */
export interface PlaceSearch {
  /** `locale` is the language place names should come back in. */
  search(query: string, locale: string, signal?: AbortSignal): Promise<City[]>;
}

import type { City } from "@/domain/types";

export interface PlaceInfo {
  /** One or two paragraphs of plain text. */
  text: string;
  imageUrl?: string;
  /** Where to read more, when the text came from an encyclopedia. */
  sourceUrl?: string;
  source: "wikipedia" | "built-in";
}

/** Where a place's introduction comes from. */
export interface PlaceInfoProvider {
  /** Resolves to null when nothing is known about the place. */
  getInfo(city: City, locale: string): Promise<PlaceInfo | null>;
}

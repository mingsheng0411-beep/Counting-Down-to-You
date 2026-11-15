/**
 * Core data model. Plain serialisable objects only: no React, no browser APIs.
 * The same shapes are meant to map onto database tables in V1.
 */

/** Text with an English fallback and optional translations keyed by locale. */
export type LocalizedText = { en: string } & Partial<Record<string, string>>;

export interface City {
  id: string;
  name: LocalizedText;
  /** State or province, when the lookup service knows it. */
  region?: string;
  /** ISO 3166-1 alpha-2 country or region code. */
  country: string;
  lat: number;
  lng: number;
  /** IANA time zone, e.g. "Asia/Shanghai". */
  timeZone: string;
  population?: number;
  /** Metres above sea level. */
  elevation?: number;
}

export type PartnerSlot = "a" | "b";

/** How someone is feeling: one emoji and, optionally, a few words. */
export interface Mood {
  emoji: string;
  text: string;
}

export interface Partner {
  name: string;
  city: City;
  mood?: Mood | null;
}

/**
 * The flight one of them is taking to the other. Dates and times are the
 * local ones printed on the ticket, kept exactly as entered.
 */
export interface Flight {
  number: string;
  from: string;
  to: string;
  /** YYYY-MM-DD */
  departDate: string;
  /** HH:MM, or empty when unknown. */
  departTime: string;
  arriveDate: string;
  arriveTime: string;
}

export interface NextMeeting {
  /** The instant of the meeting as an ISO 8601 UTC string. */
  at: string;
  placeName: string;
}

/** Something the two of them plan to do together. */
export interface Plan {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

/** A couple's shared private space. Everything else hangs off a space. */
export interface Space {
  id: string;
  partners: Record<PartnerSlot, Partner>;
  /** Calendar date, YYYY-MM-DD. */
  togetherSince: string | null;
  nextMeeting: NextMeeting | null;
  flight?: Flight | null;
  plans?: Plan[];
  createdAt: string;
  updatedAt: string;
}

export type MemoryPhoto =
  /** A photo held by the repository (IndexedDB now, cloud storage later). */
  | { kind: "stored"; id: string }
  /** A photo served from a plain URL, used by the demo space. */
  | { kind: "url"; url: string };

export interface Memory {
  id: string;
  spaceId: string;
  /** Calendar date, YYYY-MM-DD. */
  date: string;
  title: string;
  note: string;
  placeName: string;
  photo: MemoryPhoto | null;
  createdAt: string;
}

export type SpaceDraft = Pick<
  Space,
  "partners" | "togetherSince" | "nextMeeting" | "flight" | "plans"
>;

export type MemoryDraft = Pick<
  Memory,
  "date" | "title" | "note" | "placeName"
>;

export function localize(text: LocalizedText, locale: string): string {
  return text[locale] ?? text.en;
}

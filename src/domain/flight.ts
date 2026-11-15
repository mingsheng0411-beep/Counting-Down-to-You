import type { Flight } from "./types";

const pad = (value: number | string) => String(value).padStart(2, "0");

/**
 * Best-effort reading of pasted itinerary text (a booking confirmation, a
 * chat message, an airline email). Finds what it can and leaves the rest
 * out; the form lets the person fix or fill in anything it missed.
 */
export function parseFlightText(
  text: string,
  defaultYear: number,
): Partial<Flight> {
  const found: Partial<Flight> = {};
  const upper = text.toUpperCase();

  // Flight number: two-character airline code, then 1 to 4 digits (MU587, CA 981, 3U8633).
  const number = upper.match(/\b([A-Z]{2}|[A-Z]\d|\d[A-Z])\s?(\d{1,4})\b/);
  if (number) found.number = `${number[1]}${number[2]}`;

  // Airports: the first two standalone three-letter codes (PVG, IAD).
  const codes = (upper.match(/\b[A-Z]{3}\b/g) ?? []).filter(
    (code) => !found.number?.startsWith(code),
  );
  if (codes.length >= 2) {
    [found.from, found.to] = codes;
  } else {
    // Otherwise a "Shanghai → Washington" style route.
    const route = text.match(
      /([\p{L}][\p{L} .'’]{1,24}?)\s*(?:→|->|➜|—|–|至|飞往|到)\s*([\p{L}][\p{L} .'’]{1,24})/u,
    );
    if (route) {
      found.from = route[1].trim();
      found.to = route[2].trim();
    }
  }

  // Dates: full dates first, then month/day with the year assumed.
  const dates: string[] = [];
  for (const match of text.matchAll(/(\d{4})\s*[-/.年]\s*(\d{1,2})\s*[-/.月]\s*(\d{1,2})/g)) {
    dates.push(`${match[1]}-${pad(match[2])}-${pad(match[3])}`);
  }
  if (dates.length === 0) {
    for (const match of text.matchAll(/(\d{1,2})\s*月\s*(\d{1,2})\s*日?/g)) {
      dates.push(`${defaultYear}-${pad(match[1])}-${pad(match[2])}`);
    }
  }
  if (dates[0]) {
    found.departDate = dates[0];
    found.arriveDate = dates[1] ?? dates[0];
  }

  // Times: the first two clock times are taken as departure and arrival.
  const times = [...text.matchAll(/(?<!\d)([01]?\d|2[0-3])\s*[:：]\s*([0-5]\d)(?!\d)/g)].map(
    (match) => `${pad(match[1])}:${match[2]}`,
  );
  if (times[0]) found.departTime = times[0];
  if (times[1]) found.arriveTime = times[1];

  return found;
}

export const isValidTime = (value: string) =>
  value === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

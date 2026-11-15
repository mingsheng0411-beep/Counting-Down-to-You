export interface Coords {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371.0088;
const RAD = Math.PI / 180;
const MARATHON_KM = 42.195;
const LIGHT_KM_PER_MS = 299.792458;

/** Great-circle distance between two points (haversine). */
export function distanceKm(a: Coords, b: Coords): number {
  const dLat = (b.lat - a.lat) * RAD;
  const dLng = (b.lng - a.lng) * RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export const kmToMiles = (km: number): number => km * 0.621371;

/** Rough direct-flight time: cruise at 850 km/h plus take-off and landing. */
export function flightHours(km: number): number {
  return Math.round((km / 850 + 0.6) * 2) / 2;
}

export const marathons = (km: number): number => km / MARATHON_KM;

export const lightMilliseconds = (km: number): number => km / LIGHT_KM_PER_MS;

/**
 * The point on Earth where the sun is directly overhead at the given instant.
 * Low-precision solar position, accurate to well under a degree.
 */
export function subsolarPoint(epochMs: number): Coords {
  const d = epochMs / 86_400_000 - 10_957.5; // days since J2000.0
  const g = (357.529 + 0.98560028 * d) * RAD;
  const q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  const e = (23.439 - 0.00000036 * d) * RAD;
  const rightAscension = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / RAD;
  const declination = Math.asin(Math.sin(e) * Math.sin(L)) / RAD;
  const gmstDeg = (((18.697374558 + 24.06570982441908 * d) % 24) + 24) % 24 * 15;
  const lng = ((((rightAscension - gmstDeg) % 360) + 540) % 360) - 180;
  return { lat: declination, lng };
}

/** Whether the sun is above the horizon at a place (with refraction). */
export function isDaylight(place: Coords, epochMs: number): boolean {
  const sun = subsolarPoint(epochMs);
  const cosAngle =
    Math.sin(place.lat * RAD) * Math.sin(sun.lat * RAD) +
    Math.cos(place.lat * RAD) *
      Math.cos(sun.lat * RAD) *
      Math.cos((place.lng - sun.lng) * RAD);
  return cosAngle > -0.0145;
}

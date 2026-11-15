/** The handful of conditions the map knows how to draw. */
export type WeatherKind =
  | "clear-day"
  | "clear-night"
  | "cloudy"
  | "rain"
  | "snow";

export interface Weather {
  kind: WeatherKind;
  temperatureC: number;
}

/**
 * Maps a WMO weather interpretation code (the standard most weather services
 * report) onto one of our kinds.
 */
export function weatherKindFromWmo(code: number, isDay: boolean): WeatherKind {
  if (code <= 1) return isDay ? "clear-day" : "clear-night";
  if (code <= 48) return "cloudy"; // partly cloudy, overcast, fog
  if (code <= 67) return "rain"; // drizzle, rain, freezing rain
  if (code <= 77) return "snow";
  if (code <= 82) return "rain"; // showers
  if (code <= 86) return "snow"; // snow showers
  return "rain"; // thunderstorms
}

import type { Coords } from "@/domain/geo";
import type { Weather } from "@/domain/weather";

/** Where current weather comes from. Swap the implementation in `data/index.ts`. */
export interface WeatherProvider {
  getCurrent(place: Coords): Promise<Weather>;
}

import type { Coords } from "@/domain/geo";
import { weatherKindFromWmo, type Weather } from "@/domain/weather";

import type { WeatherProvider } from "../weather-provider";

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    is_day?: number;
  };
}

/**
 * Current weather from Open-Meteo: free, no account or key. Only a city's
 * coordinates are sent, rounded to two decimals.
 */
export class OpenMeteoWeatherProvider implements WeatherProvider {
  async getCurrent(place: Coords): Promise<Weather> {
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${place.lat.toFixed(2)}&longitude=${place.lng.toFixed(2)}` +
      "&current=temperature_2m,weather_code,is_day";
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);

    const { current } = (await response.json()) as OpenMeteoResponse;
    if (
      typeof current?.temperature_2m !== "number" ||
      typeof current.weather_code !== "number"
    ) {
      throw new Error("Weather response is missing current conditions");
    }
    return {
      kind: weatherKindFromWmo(current.weather_code, current.is_day !== 0),
      temperatureC: current.temperature_2m,
    };
  }
}

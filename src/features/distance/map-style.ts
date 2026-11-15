import type { StyleSpecification } from "maplibre-gl";

const SEA = "#c8ddfc";
const LAND = "#ffffff";

export const SATELLITE_LAYER = "satellite";
/** Colour shown past the poles, where neither map has anything to draw. */
export const SEA_PLAIN = SEA;
export const SEA_SATELLITE = "#0a1f44";

/**
 * Daytime map: the project's own pale-blue-and-white look on top of
 * OpenFreeMap's vector tiles (OpenStreetMap data). Detailed coastlines,
 * rivers and, when zoomed in, main roads; very few place names.
 */
export function dayStyle(locale: string): StyleSpecification {
  const name = ["coalesce", ["get", `name:${locale}`], ["get", "name"]];
  return {
    version: 8,
    projection: { type: "globe" },
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: {
      map: { type: "vector", url: "https://tiles.openfreemap.org/planet" },
      // NASA's Blue Marble: the Earth by day, as seen from orbit.
      satellite: {
        type: "raster",
        tiles: [
          "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/2004-08-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg",
        ],
        tileSize: 256,
        maxzoom: 8,
      },
    },
    layers: [
      { id: "land", type: "background", paint: { "background-color": LAND } },
      {
        id: "residential",
        type: "fill",
        source: "map",
        "source-layer": "landuse",
        minzoom: 8,
        filter: ["==", ["get", "class"], "residential"],
        paint: { "fill-color": "#f3f6fb" },
      },
      {
        id: "green",
        type: "fill",
        source: "map",
        "source-layer": "park",
        minzoom: 7,
        paint: { "fill-color": "#eef6f0" },
      },
      {
        id: "water",
        type: "fill",
        source: "map",
        "source-layer": "water",
        paint: { "fill-color": SEA },
      },
      {
        id: "rivers",
        type: "line",
        source: "map",
        "source-layer": "waterway",
        minzoom: 6,
        paint: {
          "line-color": SEA,
          "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.6, 12, 2.4],
        },
      },
      {
        id: "roads",
        type: "line",
        source: "map",
        "source-layer": "transportation",
        minzoom: 7,
        filter: [
          "in",
          ["get", "class"],
          ["literal", ["motorway", "trunk", "primary", "secondary"]],
        ],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#dfe5ee",
          "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.5, 13, 3],
        },
      },
      {
        // Shown only with the day and night view on, so the sunlit side is
        // a photograph like the night side. It fades out when zoomed in,
        // where the drawn map has more detail than the imagery.
        id: SATELLITE_LAYER,
        type: "raster",
        source: "satellite",
        layout: { visibility: "none" },
        paint: {
          "raster-fade-duration": 0,
          // Lifted a little so the sunlit side reads clearly as day.
          "raster-brightness-min": 0.14,
          "raster-saturation": -0.05,
          "raster-opacity": ["interpolate", ["linear"], ["zoom"], 7.5, 1, 9.5, 0],
        },
      },
      {
        id: "state-borders",
        type: "line",
        source: "map",
        "source-layer": "boundary",
        minzoom: 4,
        filter: [
          "all",
          ["==", ["get", "admin_level"], 4],
          ["!=", ["get", "maritime"], 1],
        ],
        paint: {
          "line-color": "#dfe4ec",
          "line-width": 0.7,
          "line-dasharray": [3, 2],
        },
      },
      {
        id: "country-borders",
        type: "line",
        source: "map",
        "source-layer": "boundary",
        filter: [
          "all",
          ["<=", ["get", "admin_level"], 2],
          ["!=", ["get", "maritime"], 1],
        ],
        paint: {
          "line-color": "#c9d0dc",
          "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.5, 8, 1.4],
        },
      },
      {
        id: "cities",
        type: "symbol",
        source: "map",
        "source-layer": "place",
        minzoom: 5,
        filter: [
          "all",
          ["==", ["get", "class"], "city"],
          ["<=", ["coalesce", ["get", "rank"], 99], 6],
        ],
        layout: {
          "text-field": name as never,
          "text-font": ["Noto Sans Regular"],
          "text-size": 11.5,
          "text-padding": 14,
        },
        paint: {
          "text-color": "#8b93a1",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.4,
        },
      },
      {
        id: "towns",
        type: "symbol",
        source: "map",
        "source-layer": "place",
        minzoom: 9,
        filter: ["==", ["get", "class"], "town"],
        layout: {
          "text-field": name as never,
          "text-font": ["Noto Sans Regular"],
          "text-size": 10.5,
          "text-padding": 18,
        },
        paint: {
          "text-color": "#9aa1ad",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.2,
        },
      },
    ],
  };
}

/**
 * Night map: NASA's Black Marble composite of the Earth at night, so the
 * dark side shows real city lights.
 */
export const nightStyle: StyleSpecification = {
  version: 8,
  projection: { type: "globe" },
  sources: {
    night: {
      type: "raster",
      tiles: [
        "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png",
      ],
      tileSize: 256,
      maxzoom: 8,
    },
  },
  layers: [
    { id: "space", type: "background", paint: { "background-color": "#1a2550" } },
    {
      id: "night",
      type: "raster",
      source: "night",
      paint: {
        "raster-fade-duration": 0,
        // Lift the blacks to deep navy so the night is dark, not a void.
        "raster-brightness-min": 0.22,
        "raster-brightness-max": 1,
        "raster-contrast": 0.2,
        "raster-saturation": 0.35,
      },
    },
  ],
};

export const mapCredits = "© OpenStreetMap · OpenFreeMap · NASA Black Marble";

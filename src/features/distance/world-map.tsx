"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import type { Map as MapEngine } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

import { subsolarPoint } from "@/domain/geo";
import type { WeatherKind } from "@/domain/weather";
import { drawWeather } from "@/features/weather/draw-weather";
import { useI18n } from "@/i18n/i18n-provider";
import { cx } from "@/lib/cx";

import {
  dayStyle,
  mapCredits,
  nightStyle,
  SATELLITE_LAYER,
  SEA_PLAIN,
  SEA_SATELLITE,
} from "./map-style";

export interface MapPoint {
  lat: number;
  lng: number;
  /** Shown in the pill above the marker. */
  label: string;
  /** Optional secondary text in the pill, e.g. the local time. */
  detail?: string;
  /** Drawn as a small line-art glyph above the pill. */
  weather?: WeatherKind | null;
  /** A photo that floats beside the place. */
  photoUrl?: string | null;
}

/** A place of interest shown as a small dot that can be opened. */
export interface MapPlace {
  id: string;
  lat: number;
  lng: number;
  label: string;
}

type XY = [number, number];

const TAU = Math.PI * 2;
const RAD = Math.PI / 180;
const INK = "#0a0b0f";
const ROUTE_STEPS = 96;

// Intro timeline, in milliseconds.
const FLATTEN_AT = 1500;
const INTRO_ROUTE_AT = 3300;
const NIGHT_AT = 2600;
/** After a place changes: how long the map glides, then the route starts. */
const GLIDE_MS = 1600;
const GLIDE_ROUTE_AT = 1250;
const ROUTE_MS = 2100;
const LOOP_MS = 9000;

/** How long each look stays up before the map switches to the other. */
const LOOK_MS = 60_000;
/** In the satellite look the camera visits each place at this zoom. */
const VISIT_ZOOM = 6.6;

/** The day/night mask is computed small and stretched, which also softens it. */
const MASK_WIDTH = 200;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const phase = (time: number, start: number, duration: number) =>
  clamp((time - start) / duration, 0, 1);
const easeInOut = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
const easeOutBack = (x: number) =>
  1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2;
/** Shortest signed difference between two longitudes, in degrees. */
const lngDelta = (from: number, to: number) =>
  ((((to - from) % 360) + 540) % 360) - 180;
const mercatorY = (lat: number) =>
  Math.log(Math.tan(Math.PI / 4 + (clamp(lat, -85, 85) * RAD) / 2));

/**
 * The big map, built on a real map engine so it stays sharp at any zoom.
 *
 * Two maps are stacked: a pale daytime map underneath and NASA's night-time
 * Earth on top. The night map is masked to the half of the world that is
 * dark right now, so day and night slide across it as the hours pass. A
 * canvas above both draws the route, the plane, the markers and the weather.
 */
export function WorldMap({
  a,
  b,
  className,
  insetTop = 0,
  insetBottom = 0,
  places,
  onSelectPoint,
  onSelectPlace,
  speed = 1,
  director,
  onIntro,
  routeLabel,
}: {
  a: MapPoint;
  b: MapPoint;
  className?: string;
  /** Pixels at the top and bottom kept clear of markers, for overlaid cards. */
  insetTop?: number;
  insetBottom?: number;
  /** Extra places drawn as small dots. */
  places?: MapPlace[];
  /** Called with 0 or 1 when one of the two main pills is pressed. */
  onSelectPoint?: (index: 0 | 1) => void;
  onSelectPlace?: (id: string) => void;
  /** Plays every animation this many times faster (for the demo reel). */
  speed?: number;
  /**
   * Takes over the look and the camera, and hides the controls: which look
   * to show, and which place (if any) to fly in to. Used by the demo reel.
   */
  director?: { daylight: boolean; focus: 0 | 1 | null };
  /** Called at the moment the opening animation begins. */
  onIntro?: () => void;
  /** Text written under the middle of the route, e.g. the distance. */
  routeLabel?: string | null;
}) {
  const { dict, locale } = useI18n();
  const wrapRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLDivElement>(null);
  const nightRef = useRef<HTMLDivElement>(null);
  const nightMapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelARef = useRef<HTMLButtonElement>(null);
  const labelBRef = useRef<HTMLButtonElement>(null);
  const placeElsRef = useRef(new Map<string, HTMLButtonElement>());
  const duskRef = useRef<HTMLDivElement>(null);
  const photoARef = useRef<HTMLDivElement>(null);
  const photoBRef = useRef<HTMLDivElement>(null);
  // Two looks take turns: the plain drawn map (which every visit opens
  // with) and the satellite view with day and night. The button switches
  // by hand; otherwise they swap on a timer.
  const [autoDaylight, setDaylight] = useState(false);
  const directed = director !== undefined;
  const daylight = director ? director.daylight : autoDaylight;
  const focus = director ? director.focus : null;

  const [engines, setEngines] = useState<{
    day: MapEngine;
    night: MapEngine;
  } | null>(null);
  const [run, setRun] = useState(0);

  // Values the frame loop reads without restarting anything.
  const insetsRef = useRef({ top: insetTop, bottom: insetBottom });
  const weatherRef = useRef<Array<WeatherKind | null | undefined>>([]);
  const placesRef = useRef<MapPlace[]>([]);
  const routeLabelRef = useRef<string | null>(null);
  const sceneRef = useRef({
    A: [a.lng, a.lat] as XY,
    B: [b.lng, b.lat] as XY,
    /** performance.now() at which the route starts drawing; Infinity = hidden. */
    routeAt: Infinity,
    /** False while the globe intro is playing: nothing is drawn on top. */
    flat: false,
    routeMs: ROUTE_MS / speed,
    loopMs: LOOP_MS / speed,
  });
  const fitRef = useRef<((duration: number) => void) | null>(null);
  const framedRef = useRef(false);
  const lastRunRef = useRef(run);
  const visitedRef = useRef(false);
  const onIntroRef = useRef(onIntro);
  useEffect(() => {
    onIntroRef.current = onIntro;
  }, [onIntro]);
  const seaRef = useRef(SEA_PLAIN);

  const { lat: aLat, lng: aLng, weather: aWeather } = a;
  const { lat: bLat, lng: bLng, weather: bWeather } = b;

  // --- Create the two maps once, and run the overlay loop -------------------
  useEffect(() => {
    const wrap = wrapRef.current;
    const dayEl = dayRef.current;
    const nightEl = nightRef.current;
    const nightMapEl = nightMapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !dayEl || !nightEl || !nightMapEl || !canvas || !ctx) return;

    let disposed = false;
    let dispose = () => {};

    void import("maplibre-gl").then(
      ({ Map: MapEngineClass, LngLat: LngLatClass, setWorkerUrl }) => {
      if (disposed) return;
      // Copied into public/ by scripts/copy-map-worker.mjs.
      setWorkerUrl("/vendor/maplibre-gl-worker.mjs");

      const shared = {
        center: [0, 20] as XY,
        zoom: 1.2,
        attributionControl: false as const,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        maxZoom: 13,
        // By default the engine will not show past the poles, which on a
        // tall phone screen stops two far-apart places fitting below the
        // cards. Allow it, within reason.
        transformConstrain: (center: { lng: number; lat: number }, zoom: number) => ({
          center: new LngLatClass(center.lng, clamp(center.lat, -80, 80)),
          zoom,
        }),
      };
      const day = new MapEngineClass({
        ...shared,
        container: dayEl,
        style: dayStyle(locale),
      });
      day.touchZoomRotate.disableRotation();
      day.keyboard.disableRotation();
      const night = new MapEngineClass({
        ...shared,
        container: nightMapEl,
        style: nightStyle,
        interactive: false,
      });

      // --- Size ---------------------------------------------------------------
      let width = 0;
      let height = 0;
      let dpr = 1;
      const mask = document.createElement("canvas");
      const maskCtx = mask.getContext("2d");
      let maskDirty = true;

      const resize = () => {
        width = wrap.clientWidth;
        height = wrap.clientHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(width * dpr));
        canvas.height = Math.max(1, Math.round(height * dpr));
        mask.width = MASK_WIDTH;
        mask.height = Math.max(
          1,
          Math.round((MASK_WIDTH * height) / Math.max(1, width)),
        );
        // Never zoom out past one whole world across the screen.
        day.setMinZoom(clamp(Math.log2(Math.max(width, 320) / 512), 0, 3));
        day.resize();
        night.resize();
        maskDirty = true;
      };

      // --- Night follows the day map -----------------------------------------
      const follow = () => {
        night.jumpTo({ center: day.getCenter(), zoom: day.getZoom() });
        maskDirty = true;
      };
      day.on("move", follow);

      /**
       * Paints which part of the view is in night into a small canvas and
       * uses it as the night map's mask. Twilight is a soft band, not a line.
       */
      const updateMask = () => {
        if (!maskCtx || width === 0) return;
        const w = mask.width;
        const h = mask.height;
        const northWest = day.unproject([0, 0]);
        const southEast = day.unproject([width, height]);
        const yTop = mercatorY(northWest.lat);
        const yBottom = mercatorY(southEast.lat);
        const sun = subsolarPoint(Date.now());
        const sinSun = Math.sin(sun.lat * RAD);
        const cosSun = Math.cos(sun.lat * RAD);

        const image = maskCtx.createImageData(w, h);
        const glow = maskCtx.createImageData(w, h);
        const columns = new Float64Array(w);
        for (let x = 0; x < w; x += 1) {
          const lng =
            northWest.lng + ((southEast.lng - northWest.lng) * (x + 0.5)) / w;
          columns[x] = Math.cos((lng - sun.lng) * RAD);
        }
        for (let y = 0; y < h; y += 1) {
          const my = yTop + ((yBottom - yTop) * (y + 0.5)) / h;
          const lat = 2 * Math.atan(Math.exp(my)) - Math.PI / 2;
          const sinLat = Math.sin(lat) * sinSun;
          const cosLat = Math.cos(lat) * cosSun;
          for (let x = 0; x < w; x += 1) {
            // Cosine of the angle to the sun: positive by day, negative by night.
            const light = sinLat + cosLat * columns[x];
            const t = clamp((0.05 - light) / 0.19, 0, 1);
            // Night never goes fully opaque: a little of the day map shows
            // through, which keeps coastlines readable in the dark.
            const at = (y * w + x) * 4;
            image.data[at + 3] = Math.round(t * t * (3 - 2 * t) * 222);
            // A warm band right along the line where the sun is setting or
            // rising, strongest just on the sunlit side of it.
            const edge = (light - 0.045) / 0.085;
            glow.data[at] = 255;
            glow.data[at + 1] = 150;
            glow.data[at + 2] = 84;
            glow.data[at + 3] = Math.round(Math.exp(-edge * edge) * 78);
          }
        }
        maskCtx.putImageData(image, 0, 0);
        const url = `url(${mask.toDataURL()})`;
        nightEl.style.maskImage = url;
        nightEl.style.webkitMaskImage = url;
        if (duskRef.current) {
          maskCtx.putImageData(glow, 0, 0);
          duskRef.current.style.backgroundImage = `url(${mask.toDataURL()})`;
        }
      };

      // --- Projection helpers --------------------------------------------------
      const project = (point: XY): XY => {
        // Use the copy of the world nearest the centre of the view.
        const center = day.getCenter().lng;
        const at = day.project([center + lngDelta(center, point[0]), point[1]]);
        return [at.x, at.y];
      };

      /**
       * The route is a clean circular arc between the two markers on screen,
       * bowing upwards. Returns a function from 0..1 to a point.
       */
      const routeCurve = (from: XY, to: XY): ((t: number) => XY) | null => {
        const dx = to[0] - from[0];
        const dy = to[1] - from[1];
        const chord = Math.hypot(dx, dy);
        if (chord < 1) return null;
        let nx = -dy / chord;
        let ny = dx / chord;
        if (ny > 0) {
          nx = -nx;
          ny = -ny;
        }
        const midX = (from[0] + to[0]) / 2;
        const midY = (from[1] + to[1]) / 2;
        const room = midY - insetsRef.current.top - 28;
        const rise = clamp(Math.min(chord * 0.26, room), 10, chord / 2);
        const radius = (chord * chord) / (8 * rise) + rise / 2;
        const cx = midX - nx * (radius - rise);
        const cy = midY - ny * (radius - rise);
        const start = Math.atan2(from[1] - cy, from[0] - cx);
        const end = Math.atan2(to[1] - cy, to[0] - cx);
        const sweep = ((((end - start) % TAU) + TAU + Math.PI) % TAU) - Math.PI;
        return (t) => [
          cx + radius * Math.cos(start + sweep * t),
          cy + radius * Math.sin(start + sweep * t),
        ];
      };

      // --- Drawing -------------------------------------------------------------
      const drawRoute = (curve: (t: number) => XY, progress: number) => {
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i <= ROUTE_STEPS; i += 1) {
          const [x, y] = curve((progress * i) / ROUTE_STEPS);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        // A white halo first, so the line reads over the dark side too.
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 5;
        ctx.shadowColor = "rgba(20,40,90,0.3)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;
        ctx.stroke();
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.restore();
      };

      const drawPlane = (
        curve: (t: number) => XY,
        at: number,
        direction: 1 | -1,
        alpha: number,
      ) => {
        if (alpha <= 0) return;
        const here = curve(at);
        const ahead = curve(clamp(at + 0.012 * direction, 0, 1));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(here[0], here[1]);
        ctx.rotate(Math.atan2(ahead[1] - here[1], ahead[0] - here[0]));
        ctx.beginPath();
        ctx.moveTo(11, 0);
        ctx.lineTo(-8, -7);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-8, 7);
        ctx.closePath();
        ctx.shadowColor = "rgba(20,40,90,0.35)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "round";
        ctx.strokeStyle = INK;
        ctx.stroke();
        ctx.restore();
      };

      const drawMarker = (at: XY, appear: number, pulse: number) => {
        const [x, y] = at;
        ctx.save();
        ctx.globalAlpha = Math.min(1, appear) * (1 - pulse) * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, 8 + pulse * 18, 0, TAU);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.shadowColor = "rgba(20,40,90,0.35)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 3;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, 8 * appear, 0, TAU);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(x, y, 4.2 * appear, 0, TAU);
        ctx.fill();
      };

      /** Positions a pill and returns the y of the free space above the stack. */
      const placeLabel = (
        el: HTMLElement | null,
        at: XY | null,
        appear: number,
        below: boolean,
      ): number | null => {
        if (!el) return at ? at[1] - 16 : null;
        if (!at || appear <= 0) {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
          return null;
        }
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        const x = clamp(at[0] - w / 2, 8, Math.max(8, width - w - 8));
        const above = at[1] - h - 16;
        const goesBelow = below || above < insetsRef.current.top - 24;
        el.style.opacity = String(Math.min(1, appear));
        el.style.pointerEvents = "auto";
        el.style.transform = `translate(${x}px, ${goesBelow ? at[1] + 16 : above}px)`;
        return goesBelow ? at[1] - 14 : above;
      };

      const hideOverlay = () => {
        const hidden = [
          labelARef.current,
          labelBRef.current,
          photoARef.current,
          photoBRef.current,
          ...placeElsRef.current.values(),
        ];
        for (const el of hidden) {
          if (!el) continue;
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
        }
      };

      // --- Frame loop ------------------------------------------------------------
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      let frameId = 0;
      let visible = true;
      let maskAt = 0;

      const frame = (now: number) => {
        frameId = 0;
        if (!visible) return;
        frameId = requestAnimationFrame(frame);
        if (width === 0) return;

        const scene = sceneRef.current;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        if (!scene.flat) {
          hideOverlay();
          return;
        }

        if (maskDirty || now - maskAt > 60_000) {
          updateMask();
          maskDirty = false;
          maskAt = now;
        }

        const { A, B } = scene;
        const samePlace =
          Math.abs(A[1] - B[1]) < 1e-6 && Math.abs(lngDelta(A[0], B[0])) < 1e-6;
        const time = reduceMotion ? Infinity : now - scene.routeAt;
        const ROUTE = scene.routeMs;
        const progress = samePlace ? 0 : easeInOut(phase(time, 0, ROUTE));
        const pa = project(A);
        const pb = project(B);

        const curve = progress > 0 ? routeCurve(pa, pb) : null;
        if (curve) {
          drawRoute(curve, progress);
          if (progress < 1) {
            drawPlane(curve, progress, 1, Math.min(1, progress / 0.05));
          } else if (Number.isFinite(time)) {
            const loop = ((time - ROUTE - 700) / scene.loopMs) % 2;
            if (loop > 0) {
              const forward = loop < 1;
              const at = forward ? easeInOut(loop) : 1 - easeInOut(loop - 1);
              drawPlane(
                curve,
                at,
                forward ? 1 : -1,
                Math.min(1, at / 0.06, (1 - at) / 0.06),
              );
            }
          }
        }

        // The distance, written just under the top of the arc once the
        // route is complete and wide enough to hold it.
        const label = routeLabelRef.current;
        if (curve && label && Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) > 220) {
          const shown = phase(time, ROUTE, 500);
          if (shown > 0) {
            const [mx, my] = curve(0.5);
            ctx.save();
            ctx.globalAlpha = shown;
            ctx.font =
              '700 17px "Inter Variable", "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.lineJoin = "round";
            ctx.strokeStyle = "rgba(255,255,255,0.92)";
            ctx.lineWidth = 5;
            ctx.strokeText(label, mx, my + 14 + (1 - shown) * 8);
            ctx.fillStyle = INK;
            ctx.fillText(label, mx, my + 14 + (1 - shown) * 8);
            ctx.restore();
          }
        }

        const appearA = easeOutBack(phase(time, -350, 550));
        const appearB = samePlace
          ? 0
          : easeOutBack(phase(time, ROUTE - 200, 550));
        const pulse = Number.isFinite(time) ? (now / 2200) % 1 : 0.35;
        const showA = appearA > 0 ? pa : null;
        const showB = appearB > 0 ? pb : null;
        if (showA) drawMarker(showA, appearA, pulse);
        if (showB) drawMarker(showB, appearB, (pulse + 0.5) % 1);

        // If the two pills would collide, drop the lower marker's pill below it.
        const elA = labelARef.current;
        const elB = labelBRef.current;
        const collide =
          !!showA &&
          !!showB &&
          !!elA &&
          !!elB &&
          Math.abs(pa[0] - pb[0]) < (elA.offsetWidth + elB.offsetWidth) / 2 + 10 &&
          Math.abs(pa[1] - pb[1]) < 70;
        const topA = placeLabel(elA, showA, appearA, collide && pa[1] > pb[1]);
        const topB = placeLabel(elB, showB, appearB, collide && pb[1] >= pa[1]);

        // Weather sits just above each place's pill.
        const [weatherA, weatherB] = weatherRef.current;
        const motion = Number.isFinite(time) ? now : 0;
        if (showA && topA !== null && weatherA) {
          drawWeather(ctx, weatherA, pa[0], topA - 22, motion, Math.min(1, appearA));
        }
        if (showB && topB !== null && weatherB) {
          drawWeather(ctx, weatherB, pb[0], topB - 22, motion, Math.min(1, appearB));
        }

        // A photo floats just below each place, leaning outwards, clear of
        // the route above and the controls at the edge.
        const placePhoto = (
          el: HTMLDivElement | null,
          at: XY | null,
          other: XY,
          appear: number,
        ) => {
          if (!el) return;
          if (!at || appear <= 0) {
            el.style.opacity = "0";
            return;
          }
          const outward = at[0] <= other[0] ? -1 : 1;
          const x = at[0] - 32 + outward * 16;
          const y = at[1] + 22;
          el.style.opacity = String(Math.min(1, appear));
          el.style.transform = `translate(${clamp(x, 6, width - 70)}px, ${y}px)`;
        };
        placePhoto(photoARef.current, showA, pb, appearA);
        placePhoto(photoBRef.current, showB, pa, appearB);

        // Places of interest: small dots, only where nothing else is in the way.
        const placeAlpha = clamp(appearA, 0, 1);
        const { top: clearTop, bottom: clearBottom } = insetsRef.current;
        const stacks: Array<[XY, number]> = [];
        if (showA) stacks.push([pa, topA ?? pa[1] - 50]);
        if (showB) stacks.push([pb, topB ?? pb[1] - 50]);
        const routeSamples = curve
          ? Array.from({ length: 33 }, (_, i) => curve((progress * i) / 32))
          : [];
        const crowded = (at: XY) =>
          stacks.some(
            ([main, stackTop]) =>
              Math.abs(at[0] - main[0]) < 84 &&
              at[1] > stackTop - 52 &&
              at[1] < main[1] + 34,
          ) ||
          routeSamples.some(
            (point) => Math.hypot(point[0] - at[0], point[1] - at[1]) < 20,
          );
        for (const place of placesRef.current) {
          const el = placeElsRef.current.get(place.id);
          if (!el) continue;
          const at = project([place.lng, place.lat]);
          const shown =
            placeAlpha > 0 &&
            at[0] > 14 &&
            at[0] < width - 14 &&
            at[1] > clearTop + 10 &&
            at[1] < height - clearBottom - 10 &&
            !crowded(at);
          el.style.opacity = shown ? String(placeAlpha) : "0";
          el.style.pointerEvents = shown ? "auto" : "none";
          if (shown) el.style.transform = `translate(${at[0]}px, ${at[1]}px)`;
        }
      };

      // --- Framing -------------------------------------------------------------
      /** Moves the view so both places sit inside the area no card covers. */
      fitRef.current = (duration) => {
        const { A, B } = sceneRef.current;
        const { top, bottom } = insetsRef.current;
        const side = width < 640 ? 44 : clamp(width * 0.085, 110, 170);
        // Leave room above the markers for the pill, the weather and the arc.
        let padTop = top + 110;
        // ...and below them for the floating photo.
        let padBottom = bottom + 104;
        const spare = height - padTop - padBottom;
        if (spare < 120) {
          const cut = (120 - spare) / 2;
          padTop -= cut;
          padBottom -= cut;
        }
        const boxWidth = Math.max(80, width - side * 2);
        const boxHeight = Math.max(80, height - padTop - padBottom);

        // Worked out directly from the flat map's geometry rather than asked
        // of the engine, whose answer is off while the globe is still
        // unfolding. "World" is the width in pixels of the whole map.
        const spanLng = Math.max(0.5, Math.abs(lngDelta(A[0], B[0])));
        const yA = mercatorY(A[1]);
        const yB = mercatorY(B[1]);
        const spanY = Math.max(0.01, Math.abs(yA - yB));
        const world = clamp(
          Math.min((boxWidth * 360) / spanLng, (boxHeight * TAU) / spanY),
          512 * 2 ** day.getMinZoom(),
          512 * 2 ** 7.5,
        );

        // Put the middle of the two places at the middle of the clear box.
        const boxMiddle = padTop + boxHeight / 2;
        const centerY = (yA + yB) / 2 + ((boxMiddle - height / 2) * TAU) / world;
        const centerLat = (2 * Math.atan(Math.exp(centerY)) - Math.PI / 2) / RAD;
        day.easeTo({
          center: [A[0] + lngDelta(A[0], B[0]) / 2, clamp(centerLat, -80, 80)],
          zoom: Math.log2(world / 512),
          duration: reduceMotion ? 0 : duration,
        });
      };
      // The wheel zooms the map, except when that would trap the page: once
      // fully zoomed out, or once the page has scrolled, it scrolls instead.
      const onWheel = (event: WheelEvent) => {
        const atLimit =
          event.deltaY > 0 && day.getZoom() <= day.getMinZoom() + 0.02;
        if (window.scrollY > 4 || atLimit) event.stopPropagation();
      };
      wrap.addEventListener("wheel", onWheel, { capture: true });

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(wrap);
      const visibilityObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !frameId) frameId = requestAnimationFrame(frame);
      });
      visibilityObserver.observe(wrap);
      resize();

      dispose = () => {
        cancelAnimationFrame(frameId);
        resizeObserver.disconnect();
        visibilityObserver.disconnect();
        wrap.removeEventListener("wheel", onWheel, { capture: true });
        fitRef.current = null;
        day.remove();
        night.remove();
      };

      // Hand the engines to React once the style is in, so framing can begin.
      const announce = () => {
        if (!disposed) setEngines({ day, night });
      };
      if (day.isStyleLoaded()) announce();
      else void day.once("load", announce);
      },
    );

    return () => {
      disposed = true;
      dispose();
      framedRef.current = false;
      setEngines(null);
    };
  }, [locale]);

  // --- Frame the two places: globe intro the first time, a glide afterwards --
  useEffect(() => {
    const nightEl = nightRef.current;
    const dayEl = dayRef.current;
    if (!engines || !nightEl || !dayEl) return;
    // Past the poles the flat map has nothing to draw; sea colour fills in.
    // The globe, though, floats on the page, so it gets no backdrop.
    const { day, night } = engines;

    const scene = sceneRef.current;
    scene.A = [aLng, aLat];
    scene.B = [bLng, bLat];
    const replay = lastRunRef.current !== run;
    lastRunRef.current = run;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const now = performance.now();

    if (framedRef.current && !replay) {
      // A place changed: glide to the new framing and redraw the route.
      scene.routeAt = now + GLIDE_ROUTE_AT / speed;
      fitRef.current?.(GLIDE_MS / speed);
      return;
    }

    framedRef.current = true;
    if (reduceMotion) {
      day.setProjection({ type: "mercator" });
      night.setProjection({ type: "mercator" });
      scene.flat = true;
      scene.routeAt = now;
      dayEl.style.background = seaRef.current;
      nightEl.style.opacity = "1";
      fitRef.current?.(0);
      return;
    }

    onIntroRef.current?.();
    // Open as a globe turned towards the two places...
    scene.flat = false;
    scene.routeAt = Infinity;
    nightEl.style.opacity = "0";
    dayEl.style.background = "";
    day.setProjection({ type: "globe" });
    night.setProjection({ type: "globe" });
    const centerLng = aLng + lngDelta(aLng, bLng) / 2;
    const centerLat = clamp((aLat + bLat) / 2, -50, 50);
    day.jumpTo({ center: [centerLng - 70, centerLat], zoom: 1.5 });
    day.easeTo({ center: [centerLng, centerLat], duration: FLATTEN_AT / speed });

    // ...then unfold it into the flat map and frame both places.
    const timers = [
      setTimeout(() => {
        day.setProjection({ type: "mercator" });
        night.setProjection({ type: "mercator" });
        scene.flat = true;
        dayEl.style.background = seaRef.current;
        scene.routeAt = now + INTRO_ROUTE_AT / speed;
        fitRef.current?.((INTRO_ROUTE_AT - FLATTEN_AT - 200) / speed);
      }, FLATTEN_AT / speed),
      setTimeout(() => {
        nightEl.style.opacity = "1";
      }, NIGHT_AT / speed),
    ];
    return () => timers.forEach(clearTimeout);
  }, [engines, aLat, aLng, bLat, bLng, run, speed]);

  // Day and night view on: the sunlit side becomes a satellite photograph
  // too, so both halves of the world look like the same planet.
  useEffect(() => {
    if (!engines) return;
    const { day } = engines;
    day.setLayoutProperty(
      SATELLITE_LAYER,
      "visibility",
      daylight ? "visible" : "none",
    );
    for (const layer of ["country-borders", "state-borders"]) {
      day.setPaintProperty(
        layer,
        "line-color",
        daylight
          ? "rgba(255,255,255,0.4)"
          : layer === "country-borders"
            ? "#c9d0dc"
            : "#dfe4ec",
      );
    }
    seaRef.current = daylight ? SEA_SATELLITE : SEA_PLAIN;
    if (sceneRef.current.flat && dayRef.current) {
      dayRef.current.style.background = seaRef.current;
    }
  }, [engines, daylight]);

  // Swap looks on a timer. Pressing the button restarts the count.
  useEffect(() => {
    if (!engines || directed) return;
    const timer = setTimeout(() => setDaylight((on) => !on), LOOK_MS);
    return () => clearTimeout(timer);
  }, [engines, daylight, directed]);

  // Under a director the camera goes exactly where it is told.
  useEffect(() => {
    if (!engines || !directed || !sceneRef.current.flat) return;
    if (focus === null) {
      if (visitedRef.current) fitRef.current?.(1500 / speed);
      visitedRef.current = false;
      return;
    }
    visitedRef.current = true;
    const scene = sceneRef.current;
    const { top, bottom } = insetsRef.current;
    engines.day.flyTo({
      center: focus === 0 ? scene.A : scene.B,
      zoom: VISIT_ZOOM,
      offset: [0, (top - bottom) / 2 + 30],
      duration: 2600 / speed,
      essential: true,
    });
  }, [engines, directed, focus, speed]);

  // In the satellite look, fly in to each of the two places in turn so the
  // detail and the city lights can be seen without zooming by hand; going
  // back to the plain map returns to the view of both.
  useEffect(() => {
    if (!engines || directed || !sceneRef.current.flat) return;
    const { day } = engines;
    if (!daylight) {
      if (visitedRef.current) fitRef.current?.(2600);
      visitedRef.current = false;
      return;
    }
    visitedRef.current = true;
    const visit = (index: 0 | 1) => () => {
      const scene = sceneRef.current;
      const { top, bottom } = insetsRef.current;
      day.flyTo({
        center: index === 0 ? scene.A : scene.B,
        zoom: VISIT_ZOOM,
        // Centre the place in the area the cards leave free.
        offset: [0, (top - bottom) / 2 + 30],
        duration: 7000,
        essential: true,
      });
    };
    const timers = [
      setTimeout(visit(0), 2200),
      setTimeout(visit(1), LOOK_MS / 2 + 1000),
    ];
    // Anyone who takes hold of the map keeps control of it.
    const cancel = () => timers.forEach(clearTimeout);
    day.on("dragstart", cancel);
    day.on("wheel", cancel);
    return () => {
      cancel();
      day.off("dragstart", cancel);
      day.off("wheel", cancel);
    };
  }, [engines, daylight, directed]);

  // Cards changed size: re-frame so nothing ends up underneath them.
  useEffect(() => {
    insetsRef.current = { top: insetTop, bottom: insetBottom };
    // Not while the camera is away visiting a place.
    if (sceneRef.current.flat && !visitedRef.current) fitRef.current?.(400);
  }, [insetTop, insetBottom]);

  useEffect(() => {
    weatherRef.current = [aWeather, bWeather];
  }, [aWeather, bWeather]);

  useEffect(() => {
    placesRef.current = places ?? [];
  }, [places]);

  useEffect(() => {
    routeLabelRef.current = routeLabel ?? null;
  }, [routeLabel]);

  return (
    <div ref={wrapRef} className={cx("overflow-hidden", className)}>
      {/* The engine restyles its container, so each map gets an inner box. */}
      <div className="absolute inset-0">
        <div ref={dayRef} className="size-full" />
      </div>
      <div
        className={cx(
          "pointer-events-none absolute inset-0 transition-opacity duration-700",
          !daylight && "opacity-0",
        )}
      >
        <div
          ref={nightRef}
          className="absolute inset-0 opacity-0 transition-opacity duration-[1400ms] [mask-size:100%_100%]"
        >
          <div ref={nightMapRef} className="size-full bg-[#1a2550]" />
        </div>
        {/* The warm light of sunrise and sunset along the day-night line. */}
        <div
          ref={duskRef}
          className="absolute inset-0 mix-blend-soft-light [background-size:100%_100%]"
        />
      </div>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full"
      />

      {(places ?? []).map((place) => (
        <button
          key={place.id}
          type="button"
          ref={(el) => {
            if (el) placeElsRef.current.set(place.id, el);
            else placeElsRef.current.delete(place.id);
          }}
          onClick={() => onSelectPlace?.(place.id)}
          className="group absolute top-0 left-0 -mt-3 -ml-3 flex items-center gap-1 rounded-full p-1.5 opacity-0 will-change-transform"
        >
          <span className="size-3 rounded-full border-2 border-ink/70 bg-white shadow-[0_1px_4px_rgb(20_40_90/0.3)] transition group-hover:scale-125 group-hover:border-ink" />
          <span className="rounded-full px-1 text-[11px] font-bold whitespace-nowrap text-ink/70 [text-shadow:0_0_4px_#fff,0_0_4px_#fff] transition group-hover:text-ink">
            {place.label}
          </span>
        </button>
      ))}
      {[a, b].map((point, index) => (
        <div
          key={`photo-${index}`}
          ref={index === 0 ? photoARef : photoBRef}
          className="pointer-events-none absolute top-0 left-0 opacity-0 will-change-transform"
        >
          {point.photoUrl && (
            <div
              className={cx(
                "photo-drift size-16 overflow-hidden rounded-2xl border-[3px] border-white bg-white shadow-[0_10px_24px_-8px_rgb(10_20_50/0.55)]",
                index === 0 ? "-rotate-6" : "rotate-6",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- blob and demo URLs */}
              <img
                key={point.photoUrl}
                src={point.photoUrl}
                alt=""
                className="photo-fade size-full object-cover"
              />
            </div>
          )}
        </div>
      ))}
      {[a, b].map((point, index) => (
        <button
          key={index}
          type="button"
          ref={index === 0 ? labelARef : labelBRef}
          onClick={() => onSelectPoint?.(index as 0 | 1)}
          className="glass absolute top-0 left-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap opacity-0 transition-[filter] will-change-transform hover:brightness-105"
        >
          <span className="size-2 rounded-full bg-ink" />
          {point.label}
          {point.detail && (
            <span className="font-semibold text-mute tabular-nums">
              {point.detail}
            </span>
          )}
        </button>
      ))}

      <div className={cx(directed && "hidden")}>
      <button
        type="button"
        onClick={() => setDaylight(!daylight)}
        aria-pressed={daylight}
        aria-label={dict.distance.dayNight}
        title={dict.distance.dayNight}
        style={{ bottom: insetBottom + 156 }}
        className={cx(
          "absolute right-4 grid size-10 place-items-center rounded-full transition active:scale-95 sm:right-6",
          daylight
            ? "bg-ink text-white shadow-[0_8px_20px_-8px_rgb(10_20_50/0.7)]"
            : "glass text-mute hover:text-ink",
        )}
      >
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 3.5a8.5 8.5 0 0 0 0 17z" fill="currentColor" />
        </svg>
      </button>
      <div
        style={{ bottom: insetBottom + 66 }}
        className="glass absolute right-4 flex flex-col overflow-hidden rounded-full text-mute sm:right-6"
      >
        {(
          [
            ["in", dict.distance.zoomIn, "M12 5v14M5 12h14"],
            ["out", dict.distance.zoomOut, "M5 12h14"],
          ] as const
        ).map(([direction, label, icon]) => (
          <button
            key={direction}
            type="button"
            onClick={() =>
              direction === "in"
                ? engines?.day.zoomIn()
                : engines?.day.zoomOut()
            }
            aria-label={label}
            title={label}
            className="grid size-10 place-items-center transition hover:text-ink active:scale-90"
          >
            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d={icon} />
            </svg>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRun((current) => current + 1)}
        aria-label={dict.distance.replay}
        title={dict.distance.replay}
        style={{ bottom: insetBottom + 16 }}
        className="glass absolute right-4 grid size-10 place-items-center rounded-full text-mute transition hover:text-ink active:scale-95 sm:right-6"
      >
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 12a8 8 0 1 0 2.6-5.9" />
          <path d="M4 4v4.5h4.5" />
        </svg>
      </button>
      </div>

      <p
        style={{ bottom: insetBottom + 6 }}
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[10px] font-medium whitespace-nowrap text-ink/45 [text-shadow:0_0_3px_#fff]"
      >
        {mapCredits}
      </p>
    </div>
  );
}

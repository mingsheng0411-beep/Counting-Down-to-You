"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { PaperPlane } from "@/components/brand";
import { getCity } from "@/domain/cities";
import { distanceKm } from "@/domain/geo";
import { localize, type City } from "@/domain/types";
import { WorldMap } from "@/features/distance/world-map";
import { useI18n } from "@/i18n/i18n-provider";
import { cx } from "@/lib/cx";

/** Total length of the reel, in seconds. */
export const REEL_SECONDS = 23;

const text = {
  zh: {
    title: "多远都要在一起",
    until: "距离下次见面还有",
    day: "天",
    apart: "相隔",
    km: "公里",
    lines: {
      route: "思念如马，自别离，未停蹄",
      weather: "喜欢你之后，手机多了一个城市的天气",
      mood: "忙的时候也会想你，闲下来却只想你",
      move: "不在你左右，却被你左右",
      night: "幸好思念无声，否则震耳欲聋",
      day: "入了心的人，见不见面都在思念",
      memoriesA: "终有一天，我们不再互道晚安",
      memoriesB: "而是在彼此身边",
    },
    moodA: "想你，没睡",
    moodB: "我想，你没睡",
    flight: "12月28日 起飞",
    brand: "在见面之前",
    wish: "祝大家早日都能相见",
    rain: "雨",
    clear: "晴",
  },
  en: {
    title: "However far, together",
    until: "Until we meet again",
    day: "d",
    apart: "Apart",
    km: "km",
    lines: {
      route: "Missing you has not stopped running since we parted",
      weather: "Since you, my phone keeps one more city's weather",
      mood: "Busy, I think of you. Idle, of you alone.",
      move: "Not beside you, yet moved by you",
      night: "Luckily longing is silent, or it would be deafening",
      day: "Once someone is in your heart, you miss them either way",
      memoriesA: "One day we won't say good night across the miles",
      memoriesB: "We'll be side by side",
    },
    moodA: "Awake, missing you",
    moodB: "Bet you're awake too",
    flight: "Departs Dec 28",
    brand: "Counting Down to You",
    wish: "May you all meet again soon",
    rain: "Rain",
    clear: "Clear",
  },
};

/**
 * Who is where at each moment: A sets out from cities across China, B is
 * somewhere abroad. The map re-frames itself on every change.
 */
const pairs: Array<[from: number, a: string, b: string]> = [
  [0, "wuhan", "newyork"],
  // Routes over open sea read best: an all-land view is nearly blank.
  [8.5, "shanghai", "losangeles"],
  [9.4, "guangzhou", "sydney"],
  [10.2, "wuhan", "newyork"],
];

const pad = (value: number) => String(value).padStart(2, "0");
const between = (t: number, from: number, to: number) => t >= from && t < to;

function Caption({ light, children }: { light: boolean; children: ReactNode }) {
  return (
    <p
      className={cx(
        "reel-rise absolute inset-x-0 bottom-[31%] text-center text-[3.5vw] leading-tight font-bold tracking-[-0.03em]",
        // Crisp letters with no halo: dark on the pale map, white on imagery.
        light
          ? "text-white [text-shadow:0_0.15vw_0.9vw_rgb(0_0_0/0.55)]"
          : "text-ink",
      )}
    >
      {children}
    </p>
  );
}

/**
 * A 23-second self-playing tour of the product, made to be screen-recorded.
 * Everything is driven by one clock that starts when the map's opening
 * animation does. `slow` plays the whole thing that many times slower, so a
 * recording can grab more frames and be sped back up.
 */
export function DemoReel({ slow = 1 }: { slow?: number }) {
  const { locale, tag } = useI18n();
  const t = locale === "zh" ? text.zh : text.en;
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [time, setTime] = useState(0);
  const [wallClock, setWallClock] = useState<number | null>(null);

  useEffect(() => {
    if (startedAt === null) return;
    let frame = 0;
    const tick = () => {
      // Twentieth-of-a-second steps keep React quiet; CSS does the motion.
      const elapsed = (performance.now() - startedAt) / 1000 / slow;
      setTime(Math.floor(elapsed * 20) / 20);
      // Slow CSS animations down to match, as each one starts.
      if (slow !== 1) {
        for (const animation of document.getAnimations()) {
          if (animation.playbackRate !== 1 / slow) animation.playbackRate = 1 / slow;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [startedAt, slow]);

  const begin = () => {
    const now = performance.now();
    setStartedAt(now);
    setWallClock(Date.now());
    // Lets a recording script know exactly when the reel began.
    (window as unknown as { __reelStartedAt?: number }).__reelStartedAt = now;
  };

  const pair = [...pairs].reverse().find(([from]) => time >= from) ?? pairs[0];
  const cityA = getCity(pair[1]);
  const cityB = getCity(pair[2]);
  const satellite = between(time, 10.9, 16.3);
  const focus = between(time, 11.5, 13.9) ? 0 : between(time, 13.9, 16.3) ? 1 : null;
  const cards = between(time, 2.5, 19.8);
  const clocks = between(time, 5.0, 19.8);

  const km = distanceKm(cityA, cityB);
  const counted = Math.round(
    km * Math.min(1, Math.max(0, (time - 2.5) / 1.1)) ** 0.6,
  );
  // A countdown that visibly runs: four ticks a second.
  const left = 42 * 86_400 + 36_199 - Math.floor(time * 4);
  const clock = `${pad(Math.floor((left % 86_400) / 3600))}:${pad(Math.floor((left % 3600) / 60))}:${pad(left % 60)}`;
  const number = (value: number) => value.toLocaleString(tag);
  const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });
  const localTime = (city: City) =>
    wallClock === null
      ? "––:––"
      : new Intl.DateTimeFormat(tag, {
          timeZone: city.timeZone,
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).format(wallClock);

  return (
    <div className="fixed inset-0 overflow-hidden bg-mist">
      <WorldMap
        className="absolute inset-0"
        speed={2 / slow}
        director={{ daylight: satellite, focus }}
        onIntro={begin}
        insetTop={150}
        insetBottom={clocks ? 200 : 120}
        a={{
          lat: cityA.lat,
          lng: cityA.lng,
          label: `${time >= 6.8 ? "🥰 " : ""}${localize(cityA.name, locale)}`,
          weather: time >= 5.2 ? "rain" : null,
          photoUrl: between(time, 16.6, 19.8) ? "/demo/city-night.svg" : null,
        }}
        b={{
          lat: cityB.lat,
          lng: cityB.lng,
          label: `${time >= 6.8 ? "😴 " : ""}${localize(cityB.name, locale)}`,
          weather: time >= 5.2 ? "clear-day" : null,
          photoUrl: between(time, 16.6, 19.8) ? "/demo/sea-sunset.svg" : null,
        }}
      />

      {/* Opening title: one clean line */}
      {between(time, 0.15, 2.5) && (
        <div
          className={cx(
            "absolute inset-0 grid place-items-center",
            time >= 2.15 && "reel-out",
          )}
        >
          <p className="reel-slam text-[10vw] leading-none font-bold tracking-[-0.04em] whitespace-nowrap text-ink">
            {t.title}
          </p>
        </div>
      )}

      {/* Distance, top left */}
      {cards && (
        <div className="reel-rise glass absolute top-[4%] left-[2.5%] rounded-[2vw] px-[1.6vw] py-[1.1vw]">
          <p className="text-[1vw] font-semibold text-faint">{t.apart}</p>
          <p className="text-[3.4vw] leading-none font-bold tracking-[-0.04em] tabular-nums">
            {number(counted)}
            <span className="ml-[0.4vw] text-[1.2vw] font-semibold text-faint">
              {t.km}
            </span>
          </p>
          <div className="mt-[0.8vw] flex gap-[0.6vw] text-[1vw] font-bold">
            <span
              key={cityA.id}
              className="reel-pop rounded-full bg-white/80 px-[0.9vw] py-[0.35vw]"
            >
              A · {localize(cityA.name, locale)}
            </span>
            <span
              key={cityB.id}
              className="reel-pop rounded-full bg-sea px-[0.9vw] py-[0.35vw]"
            >
              B · {localize(cityB.name, locale)}
            </span>
          </div>
        </div>
      )}

      {/* Countdown, top right */}
      {cards && (
        <div
          className="reel-slam glass absolute top-[4%] right-[2.5%] rounded-[2vw] px-[1.8vw] py-[1.2vw]"
          style={delay(80)}
        >
          <p className="text-[1.1vw] font-bold">
            A <span className="text-faint">&amp;</span> B
            <span className="ml-[0.7vw] font-semibold text-faint">{t.until}</span>
          </p>
          <p className="mt-[0.3vw] text-[5.4vw] leading-none font-bold tracking-[-0.045em] tabular-nums">
            42
            <span className="mr-[0.25em] ml-[0.06em] text-[0.42em] tracking-normal text-faint">
              {t.day}
            </span>
            {clock}
          </p>
          {time >= 7.5 && (
            <p className="reel-pop mt-[0.7vw] inline-flex items-center gap-[0.5vw] rounded-full bg-sea px-[1vw] py-[0.4vw] text-[1vw] font-bold">
              ✈ MU587 · PVG → JFK · {t.flight}
            </p>
          )}
        </div>
      )}

      {/* Captions */}
      {between(time, 2.9, 5.0) && <Caption light={false} key="route">{t.lines.route}</Caption>}
      {between(time, 5.0, 6.7) && <Caption light={false} key="weather">{t.lines.weather}</Caption>}
      {between(time, 6.7, 8.5) && <Caption light={false} key="mood">{t.lines.mood}</Caption>}
      {between(time, 8.5, 10.9) && <Caption light={false} key="move">{t.lines.move}</Caption>}
      {between(time, 11.4, 13.9) && <Caption light key="night">{t.lines.night}</Caption>}
      {between(time, 13.9, 16.3) && <Caption light key="day">{t.lines.day}</Caption>}
      {between(time, 16.6, 18.2) && <Caption light={false} key="m1">{t.lines.memoriesA}</Caption>}
      {between(time, 18.2, 19.8) && <Caption light={false} key="m2">{t.lines.memoriesB}</Caption>}

      {/* Clocks with weather and moods, bottom corners */}
      {clocks &&
        (
          [
            ["A", cityA, "left-[2.5%]", t.rain, "12°", "🥰", t.moodA, 0],
            ["B", cityB, "right-[2.5%]", t.clear, "18°", "😴", t.moodB, 90],
          ] as const
        ).map(([who, city, side, sky, degrees, emoji, mood, wait]) => (
          <div
            key={who}
            className={cx(
              "reel-rise glass absolute bottom-[4%] flex w-[25vw] items-end justify-between rounded-[2vw] px-[1.6vw] py-[1.2vw]",
              side,
            )}
            style={delay(wait)}
          >
            <div>
              <p className="text-[1.3vw] font-bold">{who}</p>
              <p className="text-[1vw] font-medium text-mute">
                {localize(city.name, locale)}
              </p>
              <p className="mt-[0.4vw] text-[4vw] leading-none font-bold tracking-[-0.04em] tabular-nums">
                {localTime(city)}
              </p>
              {time >= 6.8 && (
                <p className="reel-pop mt-[0.7vw] inline-flex items-center gap-[0.4vw] rounded-full bg-sea px-[0.9vw] py-[0.35vw] text-[1vw] font-bold">
                  {emoji} {mood}
                </p>
              )}
            </div>
            <p
              className="reel-pop rounded-full bg-sea px-[1vw] py-[0.45vw] text-[1.05vw] font-bold"
              style={delay(300)}
            >
              {sky} {degrees}
            </p>
          </div>
        ))}

      {/* A fan of memories */}
      {between(time, 16.9, 19.9) && (
        <div className="absolute inset-x-0 top-[17%] grid place-items-center">
          <div className="relative h-[19vw] w-[25vw]">
            {["arrivals", "city-night", "sea-sunset", "snow-weekend"].map(
              (name, index) =>
                time >= 16.9 + index * 0.26 ? (
                  <div
                    key={name}
                    className="reel-slam absolute inset-0 overflow-hidden rounded-[1.6vw] border-[0.5vw] border-white bg-white shadow-[0_2vw_5vw_-1.5vw_rgb(10_20_50/0.6)]"
                    style={{ rotate: `${(index - 1.5) * 7}deg` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- bundled sample art */}
                    <img
                      src={`/demo/${name}.svg`}
                      alt=""
                      className="size-full object-cover"
                    />
                  </div>
                ) : null,
            )}
          </div>
        </div>
      )}

      {/* End card */}
      {time >= 19.8 && (
        <div className="reel-wipe absolute inset-0 grid place-items-center bg-white">
          <div className="flex flex-col items-center">
            {/* The plane flies in from the lower left and lands as the mark. */}
            <div className="reel-fly w-[9vw]">
              <PaperPlane className="w-full" />
            </div>
            <p
              className="reel-slam mt-[1.2vw] text-[6.4vw] leading-none font-bold tracking-[-0.045em]"
              style={delay(450)}
            >
              {t.brand}
            </p>
            <p
              className="reel-slam mt-[2.6vw] rounded-full bg-sea px-[2.6vw] py-[0.9vw] text-[3vw] font-bold tracking-[-0.02em]"
              style={delay(1100)}
            >
              {t.wish}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

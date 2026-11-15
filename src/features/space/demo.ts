import { getCity } from "@/domain/cities";
import { toDateInputValue } from "@/domain/time";
import type { Memory, Space } from "@/domain/types";
import type { Dictionary } from "@/i18n/dictionaries/zh";

const DAY_MS = 86_400_000;
const DEMO_SPACE_ID = "demo";

/** Days before today for each sample memory, oldest first. */
const memoryOffsets = [612, 430, 205, 48];
const memoryPhotos = [
  "/demo/arrivals.svg",
  "/demo/city-night.svg",
  "/demo/sea-sunset.svg",
  "/demo/snow-weekend.svg",
];

/**
 * The sample space shown before a couple sets up their own. Dates are
 * relative to "now" so the countdown always has something to count.
 */
export function createDemoSpace(
  nowMs: number,
  text: Dictionary["demo"],
): { space: Space; memories: Memory[] } {
  const iso = new Date(nowMs).toISOString();
  const midnightUtc = Math.floor(nowMs / DAY_MS) * DAY_MS;
  const daysAgo = (days: number) =>
    toDateInputValue(new Date(nowMs - days * DAY_MS));

  const space: Space = {
    id: DEMO_SPACE_ID,
    partners: {
      a: {
        name: text.aName,
        city: getCity("maryland"),
        mood: { emoji: "🥰", text: text.aMood },
      },
      b: {
        name: text.bName,
        city: getCity("wuhan"),
        mood: { emoji: "😴", text: text.bMood },
      },
    },
    togetherSince: daysAgo(memoryOffsets[0]),
    nextMeeting: {
      at: new Date(midnightUtc + 37 * DAY_MS + 9.5 * 3_600_000).toISOString(),
      placeName: text.meetingPlace,
    },
    flight: null,
    plans: text.plans.map((title, index) => ({
      id: `demo-plan-${index}`,
      title,
      done: index === 0,
      createdAt: iso,
    })),
    createdAt: iso,
    updatedAt: iso,
  };

  const memories: Memory[] = text.memories.map((memory, index) => ({
    id: `demo-${index}`,
    spaceId: DEMO_SPACE_ID,
    date: daysAgo(memoryOffsets[index] ?? 0),
    title: memory.title,
    note: memory.note,
    placeName: memory.place,
    photo: memoryPhotos[index] ? { kind: "url", url: memoryPhotos[index] } : null,
    createdAt: iso,
  }));

  return { space, memories };
}

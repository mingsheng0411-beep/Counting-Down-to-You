const DAY_MS = 86_400_000;

export interface CountdownParts {
  /** Milliseconds until the target; negative once it has passed. */
  remainingMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function countdownParts(targetMs: number, nowMs: number): CountdownParts {
  const remainingMs = targetMs - nowMs;
  const total = Math.max(0, Math.floor(remainingMs / 1000));
  return {
    remainingMs,
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/** Parses YYYY-MM-DD as midnight in the viewer's time zone. */
export function parseLocalDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Whole calendar days from a YYYY-MM-DD date until now (0 on the day itself). */
export function daysSince(date: string, nowMs: number): number {
  const start = parseLocalDate(date);
  const now = new Date(nowMs);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today.getTime() - start.getTime()) / DAY_MS);
}

const offsetFormatters = new Map<string, Intl.DateTimeFormat>();

/** Minutes a time zone is ahead of UTC at the given instant. */
export function tzOffsetMinutes(timeZone: string, epochMs: number): number {
  let formatter = offsetFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    offsetFormatters.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(new Date(epochMs));
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return Math.round((asUtc - Math.floor(epochMs / 1000) * 1000) / 60_000);
}

/** "UTC+8", "UTC-5", "UTC+5:30". */
export function formatUtcOffset(minutes: number): string {
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Value for <input type="date"> in the viewer's time zone. */
export function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Value for <input type="datetime-local"> in the viewer's time zone. */
export function toDateTimeInputValue(date: Date): string {
  return `${toDateInputValue(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

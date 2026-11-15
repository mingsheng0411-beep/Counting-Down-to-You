"use client";

import { Button } from "@/components/ui/button";
import { countdownParts, daysSince } from "@/domain/time";
import { FlightLine } from "@/features/flight/flight-line";
import { useSpace } from "@/features/space/space-context";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/i18n-provider";
import { useNow } from "@/lib/use-now";

const DAY_MS = 86_400_000;
const pad = (value: number) => String(value).padStart(2, "0");

const bigNumber =
  "font-bold leading-none tracking-[-0.045em] tabular-nums text-ink " +
  "text-[clamp(2.2rem,5.2vw,4.5rem)]";

/** The countdown to the next meeting, as a glass card for the map's corner. */
export function CountdownCard({ onEdit }: { onEdit: () => void }) {
  const { space } = useSpace();
  const { dict, tag } = useI18n();
  const now = useNow();
  const t = dict.countdown;
  const { a, b } = space.partners;

  const meeting = space.nextMeeting;
  const targetMs = meeting ? new Date(meeting.at).getTime() : null;
  const parts =
    targetMs !== null && now !== null ? countdownParts(targetMs, now) : null;
  const passed = parts !== null && parts.remainingMs <= 0;
  const isToday = passed && parts.remainingMs > -DAY_MS;
  const counting = meeting && !passed;

  const togetherDays =
    space.togetherSince && now !== null
      ? daysSince(space.togetherSince, now) + 1
      : null;

  return (
    <div className="glass rounded-[1.75rem] px-5 py-4 sm:px-6 sm:py-5">
      <p className="text-sm font-bold sm:text-base">
        {a.name}
        <span className="mx-1.5 text-faint">&amp;</span>
        {b.name}
        {counting && (
          <span className="ml-2.5 font-semibold text-faint">{t.eyebrow}</span>
        )}
      </p>

      {!meeting && (
        <div className="mt-2 flex flex-col items-start gap-3">
          <p className="text-2xl font-bold tracking-tight">{t.emptyTitle}</p>
          <Button size="sm" onClick={onEdit}>
            {t.emptyCta}
          </Button>
        </div>
      )}

      {meeting && passed && (
        <div className="mt-2 flex flex-col items-start gap-3">
          <p className={bigNumber}>{isToday ? t.todayTitle : t.pastTitle}</p>
          {isToday ? (
            <p className="font-semibold text-mute">{t.todaySub}</p>
          ) : (
            <Button size="sm" onClick={onEdit}>
              {t.pastCta}
            </Button>
          )}
        </div>
      )}

      {counting && (
        <p className={`mt-1.5 ${bigNumber}`} role="timer" aria-live="off">
          {parts ? parts.days.toLocaleString(tag) : "––"}
          <span className="mr-[0.25em] ml-[0.06em] text-[0.42em] tracking-normal text-faint">
            {t.daysUnit}
          </span>
          {parts
            ? `${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`
            : "––:––:––"}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs font-semibold sm:text-sm">
        {togetherDays !== null && togetherDays > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sea/70 px-2.5 py-1">
            <svg viewBox="0 0 24 24" className="size-[1.05em]" fill="currentColor" aria-hidden>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {fmt(t.together, { n: togetherDays.toLocaleString(tag) })}
          </span>
        )}
        {counting && targetMs !== null && (
          <span className="font-medium text-mute">
            {new Intl.DateTimeFormat(tag, {
              dateStyle: "medium",
            }).format(targetMs)}
            {meeting.placeName &&
              ` · ${fmt(t.inPlace, { place: meeting.placeName })}`}
          </span>
        )}
      </div>

      <FlightLine />
    </div>
  );
}

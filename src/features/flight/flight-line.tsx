"use client";

import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import { parseLocalDate } from "@/domain/time";
import { useSpace } from "@/features/space/space-context";
import { useI18n } from "@/i18n/i18n-provider";

import { FlightForm } from "./flight-form";

function PlaneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 11.5 20.5 4l-6 17-3.5-7.5zM11 13.5 20.500 4" />
    </svg>
  );
}

/**
 * The flight, as one line in the countdown card. Shows the saved flight, or a
 * button to import one. Either opens the flight form.
 */
export function FlightLine() {
  const { space } = useSpace();
  const { dict, tag } = useI18n();
  const [open, setOpen] = useState(false);
  const t = dict.flight;
  const flight = space.flight ?? null;

  const day = (date: string) =>
    new Intl.DateTimeFormat(tag, { month: "short", day: "numeric" }).format(
      parseLocalDate(date),
    );

  return (
    <>
      {flight ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 flex w-full flex-wrap items-center gap-x-2.5 gap-y-1 rounded-2xl bg-sea/60 px-3.5 py-2.5 text-left text-xs font-semibold transition hover:brightness-[1.03] sm:text-sm"
        >
          <PlaneIcon />
          <span className="font-bold">{flight.number}</span>
          {(flight.from || flight.to) && (
            <span>
              {flight.from} → {flight.to}
            </span>
          )}
          <span className="font-medium text-mute tabular-nums">
            {day(flight.departDate)}
            {flight.departTime && ` ${flight.departTime} ${t.depart}`}
            {flight.arriveTime &&
              ` · ${
                flight.arriveDate !== flight.departDate
                  ? `${day(flight.arriveDate)} `
                  : ""
              }${flight.arriveTime} ${t.arrive}`}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-dashed border-ink/20 px-3 py-1.5 text-xs font-bold text-mute transition hover:border-ink/40 hover:text-ink"
        >
          <PlaneIcon />
          {t.add}
        </button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t.title}>
        <FlightForm onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

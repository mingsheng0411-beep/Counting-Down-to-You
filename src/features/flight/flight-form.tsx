"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { DateSelect } from "@/components/ui/date-select";
import { Field, inputClass } from "@/components/ui/field";
import { isValidTime, parseFlightText } from "@/domain/flight";
import { parseLocalDate } from "@/domain/time";
import type { Flight } from "@/domain/types";
import { useSpace } from "@/features/space/space-context";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/i18n-provider";

const groupLabel = "mb-1.5 block text-xs font-semibold text-mute";

const empty: Flight = {
  number: "",
  from: "",
  to: "",
  departDate: "",
  departTime: "",
  arriveDate: "",
  arriveTime: "",
};

/**
 * Adds or edits the flight. Details can be pasted as free text and read
 * automatically, then corrected by hand. Mount it fresh each time it opens.
 */
export function FlightForm({ onDone }: { onDone: () => void }) {
  const { space, updateSpace } = useSpace();
  const { dict } = useI18n();
  const t = dict.flight;
  const existing = space.flight ?? null;

  const [flight, setFlight] = useState<Flight>(existing ?? empty);
  const [pasted, setPasted] = useState("");
  const [recognized, setRecognized] = useState<number | null>(null);
  // Bumped after reading pasted text so the date menus pick up the new dates.
  const [dateKey, setDateKey] = useState(0);
  const [thisYear] = useState(() => new Date().getFullYear());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"save" | "time" | null>(null);

  const set = (patch: Partial<Flight>) =>
    setFlight((current) => ({ ...current, ...patch }));

  const recognize = () => {
    const found = parseFlightText(pasted, thisYear);
    set(found);
    setRecognized(Object.keys(found).length);
    setDateKey((key) => key + 1);
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onDone();
    } catch {
      setError("save");
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!isValidTime(flight.departTime) || !isValidTime(flight.arriveTime)) {
      setError("time");
      return;
    }
    const saved: Flight = {
      ...flight,
      number: flight.number.trim().toUpperCase(),
      from: flight.from.trim(),
      to: flight.to.trim(),
      arriveDate: flight.arriveDate || flight.departDate,
    };
    void run(() =>
      updateSpace({
        flight: saved,
        // The day they land is the day they meet.
        nextMeeting: {
          at: parseLocalDate(saved.arriveDate).toISOString(),
          placeName: saved.to || space.nextMeeting?.placeName || "",
        },
      }),
    );
  };

  const text = (key: "number" | "from" | "to", required = false) => (
    <Field label={t[key]}>
      <input
        required={required}
        maxLength={40}
        value={flight[key]}
        onChange={(event) => set({ [key]: event.target.value })}
        className={inputClass}
      />
    </Field>
  );

  const time = (key: "departTime" | "arriveTime") => (
    <Field label={t[key]}>
      <input
        inputMode="numeric"
        maxLength={5}
        value={flight[key]}
        onChange={(event) =>
          set({ [key]: event.target.value.replace("：", ":").trim() })
        }
        placeholder={t.timePlaceholder}
        className={inputClass}
      />
    </Field>
  );

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <span className={groupLabel}>{t.pasteLabel}</span>
        <textarea
          rows={3}
          value={pasted}
          onChange={(event) => setPasted(event.target.value)}
          placeholder={t.pastePlaceholder}
          className={inputClass}
        />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={recognize} disabled={!pasted.trim()}>
            {t.recognize}
          </Button>
          {recognized !== null && (
            <p className="text-xs font-medium text-mute">
              {recognized > 0
                ? fmt(t.recognized, { n: recognized })
                : t.notRecognized}
            </p>
          )}
        </div>
      </div>

      <hr className="border-line" />

      {text("number", true)}
      <div className="grid gap-4 sm:grid-cols-2">
        {text("from")}
        {text("to")}
      </div>

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <span className={groupLabel}>{t.departDate}</span>
          <DateSelect
            key={`depart-${dateKey}`}
            required
            label={t.departDate}
            value={flight.departDate}
            onChange={(departDate) => set({ departDate })}
            fromYear={thisYear}
            toYear={thisYear + 2}
          />
        </div>
        {time("departTime")}
      </div>
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <span className={groupLabel}>{t.arriveDate}</span>
          <DateSelect
            key={`arrive-${dateKey}`}
            label={t.arriveDate}
            value={flight.arriveDate}
            onChange={(arriveDate) => set({ arriveDate })}
            fromYear={thisYear}
            toYear={thisYear + 2}
          />
        </div>
        {time("arriveTime")}
      </div>

      <p className="text-xs text-faint">{t.hint}</p>

      {error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {error === "time" ? t.timeInvalid : dict.common.saveFailed}
        </p>
      )}

      <div className="mt-1 flex items-center justify-between gap-3">
        {existing ? (
          <Button
            variant="danger"
            size="sm"
            disabled={busy}
            onClick={() => void run(() => updateSpace({ flight: null }))}
          >
            {t.remove}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onDone} disabled={busy}>
            {dict.common.cancel}
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? dict.common.saving : dict.common.save}
          </Button>
        </div>
      </div>
    </form>
  );
}

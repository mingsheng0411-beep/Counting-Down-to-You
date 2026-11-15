"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { DateSelect } from "@/components/ui/date-select";
import { Field, inputClass } from "@/components/ui/field";
import { parseLocalDate, toDateInputValue } from "@/domain/time";
import type { City } from "@/domain/types";
import { PlaceInput } from "@/features/places/place-input";
import { useSpace } from "@/features/space/space-context";
import { useI18n } from "@/i18n/i18n-provider";

const groupLabel = "mb-1.5 block text-xs font-semibold text-mute";

function PartnerFields({
  heading,
  name,
  onName,
  namePlaceholder,
  city,
  onCity,
}: {
  heading: string;
  name: string;
  onName: (value: string) => void;
  namePlaceholder: string;
  city: City;
  onCity: (city: City) => void;
}) {
  const { dict } = useI18n();
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-lg font-bold">{heading}</legend>
      <Field label={dict.settings.name}>
        <input
          required
          maxLength={30}
          value={name}
          onChange={(event) => onName(event.target.value)}
          placeholder={namePlaceholder}
          className={inputClass}
        />
      </Field>
      <div>
        <span className="mb-1.5 block text-xs font-semibold text-mute">
          {dict.settings.city}
        </span>
        <PlaceInput
          value={city}
          onChange={onCity}
          label={dict.settings.city}
          inputClassName={inputClass}
        />
      </div>
    </fieldset>
  );
}

/** Edits the space itself. Mount it fresh each time the dialog opens. */
export function SettingsForm({ onDone }: { onDone: () => void }) {
  const { space, isDemo, saveSpace, resetSpace } = useSpace();
  const { dict } = useI18n();
  const t = dict.settings;

  // Starting from the sample space keeps the cities but not the sample names or dates.
  const [aName, setAName] = useState(isDemo ? "" : space.partners.a.name);
  const [bName, setBName] = useState(isDemo ? "" : space.partners.b.name);
  const [aCity, setACity] = useState(space.partners.a.city);
  const [bCity, setBCity] = useState(space.partners.b.city);
  const [since, setSince] = useState(isDemo ? "" : (space.togetherSince ?? ""));
  // The meeting is a day, not a time: it is stored as that day's midnight.
  const [meetOn, setMeetOn] = useState(() =>
    !isDemo && space.nextMeeting
      ? toDateInputValue(new Date(space.nextMeeting.at))
      : "",
  );
  const [meetPlace, setMeetPlace] = useState(
    isDemo ? "" : (space.nextMeeting?.placeName ?? ""),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [thisYear] = useState(() => new Date().getFullYear());

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(false);
    try {
      await action();
      onDone();
    } catch {
      setError(true);
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    // A real space keeps each person's mood; the sample's moods are dropped.
    const keep = isDemo
      ? { a: {}, b: {} }
      : { a: space.partners.a, b: space.partners.b };
    run(() =>
      saveSpace({
        partners: {
          a: { ...keep.a, name: aName.trim(), city: aCity },
          b: { ...keep.b, name: bName.trim(), city: bCity },
        },
        togetherSince: since || null,
        flight: isDemo ? null : (space.flight ?? null),
        plans: isDemo ? [] : (space.plans ?? []),
        nextMeeting: meetOn
          ? {
              at: parseLocalDate(meetOn).toISOString(),
              placeName: meetPlace.trim(),
            }
          : null,
      }),
    );
  };

  const reset = () => {
    if (window.confirm(t.resetConfirm)) run(resetSpace);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-7">
      <div className="grid gap-7 sm:grid-cols-2 sm:gap-5">
        <PartnerFields
          heading={t.you}
          name={aName}
          onName={setAName}
          namePlaceholder={t.namePlaceholderA}
          city={aCity}
          onCity={setACity}
        />
        <PartnerFields
          heading={t.partner}
          name={bName}
          onName={setBName}
          namePlaceholder={t.namePlaceholderB}
          city={bCity}
          onCity={setBCity}
        />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-lg font-bold">{t.dates}</legend>
        <div>
          <span className={groupLabel}>{t.since}</span>
          <DateSelect
            label={t.since}
            value={since}
            onChange={setSince}
            fromYear={thisYear - 60}
            toYear={thisYear}
          />
        </div>
        <div>
          <span className={groupLabel}>{t.nextMeeting}</span>
          <DateSelect
            label={t.nextMeeting}
            value={meetOn}
            onChange={setMeetOn}
            fromYear={thisYear}
            toYear={thisYear + 5}
          />
        </div>
        <div>
          <Field label={t.meetingPlace}>
            <input
              maxLength={60}
              value={meetPlace}
              onChange={(event) => setMeetPlace(event.target.value)}
              placeholder={t.meetingPlacePlaceholder}
              className={inputClass}
            />
          </Field>
        </div>
      </fieldset>

      <p className="text-xs text-faint">{t.privacy}</p>

      {error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {dict.common.saveFailed}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        {isDemo ? (
          <span />
        ) : (
          <Button variant="danger" size="sm" onClick={reset} disabled={busy}>
            {t.reset}
          </Button>
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

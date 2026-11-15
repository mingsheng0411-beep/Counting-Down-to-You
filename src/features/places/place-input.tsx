"use client";

import { useMemo, useRef, useState } from "react";

import { localize, type City } from "@/domain/types";
import { useI18n } from "@/i18n/i18n-provider";
import { cx } from "@/lib/cx";

import { usePlaceSearch } from "./use-place-search";

/**
 * A text box for a place. Type a city or region, pick a suggestion, and the
 * chosen place comes back with its coordinates and time zone.
 */
export function PlaceInput({
  value,
  onChange,
  label,
  className,
  inputClassName,
}: {
  value: City;
  onChange: (city: City) => void;
  /** Accessible name, e.g. "Your location". */
  label: string;
  className?: string;
  inputClassName?: string;
}) {
  const { dict, locale, tag } = useI18n();
  // null while not editing: the box then shows the chosen place.
  const [text, setText] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const regionNames = useMemo(
    () => new Intl.DisplayNames([tag], { type: "region" }),
    [tag],
  );
  const results = usePlaceSearch(text ?? "", locale);
  const editing = text !== null;

  const describe = (city: City) =>
    [city.region, regionNames.of(city.country)].filter(Boolean).join(" · ");

  const choose = (city: City) => {
    onChange(city);
    setText(null);
    inputRef.current?.blur();
  };

  return (
    <div className={cx("relative", className)}>
      <input
        ref={inputRef}
        aria-label={label}
        autoComplete="off"
        spellCheck={false}
        value={text ?? localize(value.name, locale)}
        placeholder={dict.places.placeholder}
        onFocus={(event) => {
          setText(event.target.value);
          event.target.select();
        }}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => setText(null)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (results[0]) choose(results[0]);
          } else if (event.key === "Escape" && editing) {
            event.stopPropagation();
            inputRef.current?.blur();
          }
        }}
        className={inputClassName}
      />

      {editing && text.trim() !== "" && (
        <ul className="glass-thick absolute top-full right-0 left-0 z-40 mt-2 max-h-64 min-w-56 overflow-y-auto rounded-2xl p-1.5">
          {results.map((city) => (
            <li key={city.id}>
              <button
                type="button"
                // Keep focus in the box so the click lands before blur closes the list.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(city)}
                className="flex w-full items-baseline justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition hover:bg-sea/50"
              >
                {localize(city.name, locale)}
                <span className="truncate text-xs font-medium text-faint">
                  {describe(city)}
                </span>
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-3 py-2.5 text-sm font-medium text-mute">
              {dict.places.searching}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

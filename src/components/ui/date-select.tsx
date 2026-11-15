"use client";

import { useState } from "react";

import { useI18n } from "@/i18n/i18n-provider";
import { cx } from "@/lib/cx";

import { inputClass } from "./field";

const pad = (value: number) => String(value).padStart(2, "0");
const daysInMonth = (year: number, month: number) =>
  new Date(year, month, 0).getDate();

/**
 * A date picked from three plain number menus: year, month, day.
 * `value` is "YYYY-MM-DD", or "" while the date is incomplete.
 */
export function DateSelect({
  value,
  onChange,
  fromYear,
  toYear,
  required = false,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Inclusive range of years offered, listed from `toYear` down. */
  fromYear: number;
  toYear: number;
  required?: boolean;
  /** Accessible name for the group. */
  label: string;
}) {
  const { dict } = useI18n();
  const [parts, setParts] = useState(() => {
    const [y, m, d] = value ? value.split("-").map(Number) : [0, 0, 0];
    return { y, m, d };
  });

  const update = (next: { y: number; m: number; d: number }) => {
    // Keep the day valid when the month or year changes (e.g. 31 → 30).
    if (next.y && next.m && next.d) {
      next.d = Math.min(next.d, daysInMonth(next.y, next.m));
    }
    setParts(next);
    onChange(
      next.y && next.m && next.d
        ? `${next.y}-${pad(next.m)}-${pad(next.d)}`
        : "",
    );
  };

  const years = Array.from(
    { length: toYear - fromYear + 1 },
    (_, index) => toYear - index,
  );
  const dayCount = parts.y && parts.m ? daysInMonth(parts.y, parts.m) : 31;
  const selectClass = cx(inputClass, "appearance-auto px-2.5 tabular-nums");

  const menu = (
    key: "y" | "m" | "d",
    placeholder: string,
    options: number[],
  ) => (
    <select
      aria-label={`${label} · ${placeholder}`}
      required={required}
      value={parts[key] || ""}
      onChange={(event) =>
        update({ ...parts, [key]: Number(event.target.value) })
      }
      className={selectClass}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );

  return (
    <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-2">
      {menu("y", dict.common.year, years)}
      {menu(
        "m",
        dict.common.month,
        Array.from({ length: 12 }, (_, index) => index + 1),
      )}
      {menu(
        "d",
        dict.common.day,
        Array.from({ length: dayCount }, (_, index) => index + 1),
      )}
    </div>
  );
}

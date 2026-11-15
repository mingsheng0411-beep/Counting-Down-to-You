import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-2xl border border-line bg-white/70 px-3.5 py-2.5 text-sm text-ink " +
  "shadow-[inset_0_1px_2px_rgb(60_100_170/0.08)] placeholder:text-faint transition " +
  "focus:border-sea focus:bg-white focus:outline-none focus:ring-4 focus:ring-sea/60";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-3 text-xs font-semibold text-mute">
        {label}
        {hint && <span className="font-normal text-faint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

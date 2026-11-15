import type { ButtonHTMLAttributes } from "react";

import { cx } from "@/lib/cx";

type Variant = "primary" | "ghost" | "danger";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.97] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-sea text-ink " +
    "shadow-[inset_0_1px_0_rgb(255_255_255/0.8),0_10px_22px_-12px_rgb(60_100_170/0.7)] hover:brightness-[1.03]",
  ghost: "glass text-ink hover:brightness-105",
  danger: "border border-red-200 bg-red-50/80 text-red-600 hover:bg-red-100",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  sm: "px-3.5 py-1.5 text-xs",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md") {
  return cx(base, variants[variant], sizes[size]);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      type={type}
      className={cx(buttonClass(variant, size), className)}
      {...props}
    />
  );
}

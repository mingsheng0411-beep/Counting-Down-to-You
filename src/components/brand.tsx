import Link from "next/link";

/** The mark: a paper plane, on its way from one of them to the other. */
export function PaperPlane({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M2.5 11.2 21 3.5l-6.2 17.5-3.7-7.6z"
        fill="#c8ddfc"
        stroke="#0a0b0f"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M11.1 13.4 21 3.5"
        fill="none"
        stroke="#0a0b0f"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Brand({
  href,
  name,
  compact = false,
}: {
  href: string;
  name: string;
  /** Show only the mark on narrow screens, when the bar is crowded. */
  compact?: boolean;
}) {
  return (
    <Link href={href} aria-label={name} className="flex shrink-0 items-center gap-2">
      <PaperPlane className="size-7" />
      <span
        className={
          "text-base font-bold tracking-tight whitespace-nowrap" +
          (compact ? " max-sm:hidden" : "")
        }
      >
        {name}
      </span>
    </Link>
  );
}

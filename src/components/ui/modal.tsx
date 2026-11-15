"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { useI18n } from "@/i18n/i18n-provider";

/** A centred dialog built on the native <dialog>, so focus and Esc just work. */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { dict } = useI18n();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="glass-thick m-auto max-h-[calc(100dvh-2rem)] w-[min(34rem,calc(100vw-2rem))] overflow-y-auto rounded-[2rem] p-0 text-ink"
    >
      {open && (
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={dict.common.close}
              className="grid size-9 place-items-center rounded-full bg-ink/5 text-mute transition hover:bg-ink/10 hover:text-ink"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

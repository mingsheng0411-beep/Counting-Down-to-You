"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { parseLocalDate } from "@/domain/time";
import type { Memory } from "@/domain/types";
import { useSpace } from "@/features/space/space-context";
import { useI18n } from "@/i18n/i18n-provider";
import { cx } from "@/lib/cx";

import { MemoryForm } from "./memory-form";
import { usePhotoUrl } from "./use-photo-url";

function MemoryCard({
  memory,
  onEdit,
}: {
  memory: Memory;
  onEdit?: () => void;
}) {
  const { dict, tag } = useI18n();
  const photoUrl = usePhotoUrl(memory.photo);
  const date = new Intl.DateTimeFormat(tag, { dateStyle: "long" }).format(
    parseLocalDate(memory.date),
  );

  return (
    <article className="glass overflow-hidden rounded-[1.75rem] p-2">
      {memory.photo && (
        <div className="aspect-[4/3] w-full overflow-hidden rounded-[1.35rem] bg-white/50">
          {photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- blob and demo URLs
            <img
              src={photoUrl}
              alt={memory.title}
              loading="lazy"
              className="size-full object-cover"
            />
          )}
        </div>
      )}
      <div className="px-4 pt-4 pb-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-bold text-ink">
            {date}
            {memory.placeName && (
              <span className="font-semibold text-faint">
                {" "}
                · {memory.placeName}
              </span>
            )}
          </p>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="-mt-1 -mr-1 rounded-full px-2.5 py-1 text-xs font-semibold text-faint transition hover:bg-ink/5 hover:text-ink"
            >
              {dict.common.edit}
            </button>
          )}
        </div>
        <h3 className="mt-1.5 text-2xl font-bold tracking-tight">
          {memory.title}
        </h3>
        {memory.note && (
          <p className="mt-1.5 leading-relaxed whitespace-pre-line text-mute">
            {memory.note}
          </p>
        )}
      </div>
    </article>
  );
}

export function MemoriesSection({ onSetup }: { onSetup: () => void }) {
  const { memories, isDemo } = useSpace();
  const { dict } = useI18n();
  const t = dict.memories;
  // null: closed; "new": creating; a Memory: editing it.
  const [editing, setEditing] = useState<Memory | "new" | null>(null);

  const sorted = useMemo(
    () =>
      [...memories].sort(
        (x, y) =>
          y.date.localeCompare(x.date) || y.createdAt.localeCompare(x.createdAt),
      ),
    [memories],
  );

  // The sample space is read-only: adding a memory starts setup instead.
  const add = () => (isDemo ? onSetup() : setEditing("new"));

  return (
    <section className="mx-auto max-w-5xl px-5 pt-20 pb-16 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-4xl font-bold tracking-[-0.03em] sm:text-6xl">
          {t.title}
        </h2>
        <Button onClick={add}>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t.add}
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="glass mt-10 rounded-[1.75rem] px-6 py-14 text-center">
          <p className="text-2xl font-bold tracking-tight">{t.emptyTitle}</p>
          <p className="mt-2 text-mute">{t.emptySub}</p>
        </div>
      ) : (
        <ol className="relative mt-12">
          <div
            aria-hidden
            className="absolute top-2 bottom-2 left-3 w-0.5 rounded-full bg-sea md:left-1/2 md:-translate-x-1/2"
          />
          {sorted.map((memory, index) => (
            <li
              key={memory.id}
              className="relative mb-10 pl-10 last:mb-0 md:grid md:grid-cols-2 md:gap-x-16 md:pl-0"
            >
              <span
                aria-hidden
                className="absolute top-7 left-3 size-3.5 -translate-x-1/2 rounded-full border-[3px] border-white bg-ink shadow-[0_0_0_4px_rgb(200_221_252/0.9),0_2px_6px_rgb(60_100_170/0.35)] md:left-1/2"
              />
              <div className={cx(index % 2 === 1 && "md:col-start-2")}>
                <MemoryCard
                  memory={memory}
                  onEdit={isDemo ? undefined : () => setEditing(memory)}
                />
              </div>
            </li>
          ))}
        </ol>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? t.newTitle : t.editTitle}
      >
        <MemoryForm
          memory={editing === "new" ? null : editing}
          onDone={() => setEditing(null)}
        />
      </Modal>
    </section>
  );
}

"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { Mood, PartnerSlot } from "@/domain/types";
import { useSpace } from "@/features/space/space-context";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/i18n-provider";
import { cx } from "@/lib/cx";

const EMOJI = [
  "🥰", "😊", "😌", "🥳", "😴", "🤒",
  "🥺", "😢", "😤", "😵‍💫", "🤗", "💪",
];

function MoodForm({
  slot,
  onDone,
}: {
  slot: PartnerSlot;
  onDone: () => void;
}) {
  const { space, updatePartner } = useSpace();
  const { dict } = useI18n();
  const current = space.partners[slot].mood;
  const [emoji, setEmoji] = useState(current?.emoji ?? EMOJI[0]);
  const [text, setText] = useState(current?.text ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const save = async (mood: Mood | null) => {
    setBusy(true);
    setError(false);
    try {
      await updatePartner(slot, { mood });
      onDone();
    } catch {
      setError(true);
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void save({ emoji, text: text.trim() });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="grid grid-cols-6 gap-2">
        {EMOJI.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === emoji}
            onClick={() => setEmoji(option)}
            className={cx(
              "grid aspect-square place-items-center rounded-2xl text-2xl transition",
              option === emoji
                ? "bg-sea shadow-[inset_0_1px_0_rgb(255_255_255/0.8)]"
                : "bg-ink/5 hover:bg-sea/50",
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <Field label={dict.mood.textLabel}>
        <input
          maxLength={24}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={dict.mood.textPlaceholder}
          className={inputClass}
        />
      </Field>

      {error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {dict.common.saveFailed}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        {current ? (
          <Button
            variant="danger"
            size="sm"
            disabled={busy}
            onClick={() => void save(null)}
          >
            {dict.mood.clear}
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

/** Shows a partner's mood; tap it to set or change the mood. */
export function MoodChip({ slot }: { slot: PartnerSlot }) {
  const { space } = useSpace();
  const { dict } = useI18n();
  const [open, setOpen] = useState(false);
  const partner = space.partners[slot];
  const mood = partner.mood;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cx(
          "inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition hover:brightness-[1.03]",
          mood ? "bg-sea/70" : "border border-dashed border-ink/20 text-mute",
        )}
      >
        {mood ? (
          <>
            <span className="text-sm leading-none">{mood.emoji}</span>
            {mood.text && <span className="truncate">{mood.text}</span>}
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            {dict.mood.add}
          </>
        )}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={fmt(dict.mood.title, { name: partner.name })}
      >
        <MoodForm slot={slot} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

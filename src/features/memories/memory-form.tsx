"use client";

import { useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { DateSelect } from "@/components/ui/date-select";
import { Field, inputClass } from "@/components/ui/field";
import { toDateInputValue } from "@/domain/time";
import type { Memory } from "@/domain/types";
import { useSpace } from "@/features/space/space-context";
import { useI18n } from "@/i18n/i18n-provider";

import { preparePhoto } from "./prepare-photo";
import { usePhotoUrl } from "./use-photo-url";

/** Create or edit a memory. Mount it fresh each time the dialog opens. */
export function MemoryForm({
  memory,
  onDone,
}: {
  memory: Memory | null;
  onDone: () => void;
}) {
  const { addMemory, updateMemory, deleteMemory } = useSpace();
  const { dict } = useI18n();
  const t = dict.memories;

  const [date, setDate] = useState(
    () => memory?.date ?? toDateInputValue(new Date()),
  );
  const [title, setTitle] = useState(memory?.title ?? "");
  const [note, setNote] = useState(memory?.note ?? "");
  const [placeName, setPlaceName] = useState(memory?.placeName ?? "");
  // undefined: keep the current photo; null: remove it; File: replace it.
  const [photoFile, setPhotoFile] = useState<File | null | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thisYear] = useState(() => new Date().getFullYear());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const existingUrl = usePhotoUrl(memory?.photo ?? null);
  const shownUrl =
    photoFile === undefined ? existingUrl : photoFile ? previewUrl : null;

  const choosePhoto = (file: File | undefined) => {
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPhotoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPhotoFile(null);
    if (fileInput.current) fileInput.current.value = "";
  };

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
    const draft = {
      date,
      title: title.trim(),
      note: note.trim(),
      placeName: placeName.trim(),
    };
    run(async () => {
      const photo = photoFile ? await preparePhoto(photoFile) : photoFile;
      if (memory) await updateMemory(memory.id, draft, photo);
      else await addMemory(draft, photo ?? null);
    });
  };

  const remove = () => {
    if (!memory || !window.confirm(t.deleteConfirm)) return;
    run(() => deleteMemory(memory.id));
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <span className="mb-1.5 block text-xs font-semibold text-mute">
          {t.photo}
        </span>
        {shownUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview
          <img
            src={shownUrl}
            alt=""
            className="mb-3 aspect-[4/3] w-full rounded-2xl object-cover"
          />
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInput.current?.click()}
          >
            {shownUrl ? t.changePhoto : t.choosePhoto}
          </Button>
          {shownUrl && (
            <Button variant="ghost" size="sm" onClick={removePhoto}>
              {t.removePhoto}
            </Button>
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => choosePhoto(event.target.files?.[0])}
        />
      </div>

      <Field label={t.titleLabel}>
        <input
          required
          maxLength={80}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t.titlePlaceholder}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4">
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-mute">
            {t.date}
          </span>
          <DateSelect
            required
            label={t.date}
            value={date}
            onChange={setDate}
            fromYear={thisYear - 60}
            toYear={thisYear}
          />
        </div>
        <Field label={t.place}>
          <input
            maxLength={60}
            value={placeName}
            onChange={(event) => setPlaceName(event.target.value)}
            placeholder={t.placePlaceholder}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label={t.note}>
        <textarea
          rows={3}
          maxLength={500}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={inputClass}
        />
      </Field>

      {error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {dict.common.saveFailed}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between gap-3">
        {memory ? (
          <Button variant="danger" size="sm" onClick={remove} disabled={busy}>
            {dict.common.delete}
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

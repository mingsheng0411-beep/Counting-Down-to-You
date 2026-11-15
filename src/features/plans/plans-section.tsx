"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import type { Plan } from "@/domain/types";
import { useSpace } from "@/features/space/space-context";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/i18n-provider";
import { cx } from "@/lib/cx";

/**
 * Things the two of them want to do together: add one, tick it off when it
 * is done, remove it if plans change.
 */
export function PlansSection() {
  const { space, updateSpace } = useSpace();
  const { dict } = useI18n();
  const t = dict.plans;
  const plans = space.plans ?? [];
  const [text, setText] = useState("");
  const [failed, setFailed] = useState(false);

  const save = async (next: Plan[]) => {
    setFailed(false);
    try {
      await updateSpace({ plans: next });
    } catch {
      setFailed(true);
    }
  };

  const add = (event: FormEvent) => {
    event.preventDefault();
    const title = text.trim();
    if (!title) return;
    setText("");
    void save([
      ...plans,
      {
        id: crypto.randomUUID(),
        title,
        done: false,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const toggle = (id: string) =>
    void save(
      plans.map((plan) => (plan.id === id ? { ...plan, done: !plan.done } : plan)),
    );

  const remove = (id: string) =>
    void save(plans.filter((plan) => plan.id !== id));

  const doneCount = plans.filter((plan) => plan.done).length;

  return (
    <section className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-4xl font-bold tracking-[-0.03em] sm:text-6xl">
          {t.title}
        </h2>
        {plans.length > 0 && (
          <p className="rounded-full bg-sea/70 px-3.5 py-1.5 text-sm font-bold tabular-nums">
            {fmt(t.done, { done: doneCount, total: plans.length })}
          </p>
        )}
      </div>

      <div className="glass mt-10 rounded-[1.75rem] p-3 sm:p-4">
        <form onSubmit={add} className="flex gap-2">
          <input
            aria-label={t.inputLabel}
            maxLength={80}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t.placeholder}
            className={inputClass}
          />
          <Button type="submit" disabled={!text.trim()} className="shrink-0">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t.add}
          </Button>
        </form>

        {failed && (
          <p role="alert" className="px-2 pt-3 text-sm font-medium text-red-600">
            {dict.common.saveFailed}
          </p>
        )}

        {plans.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-2xl font-bold tracking-tight text-faint">
              {t.empty}
            </p>
            <p className="mt-2 text-mute">{t.emptySub}</p>
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-1">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className="group flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-white/60 sm:px-3"
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={plan.done}
                  aria-label={plan.title}
                  onClick={() => toggle(plan.id)}
                  className={cx(
                    "grid size-7 shrink-0 place-items-center rounded-full border-2 transition",
                    plan.done
                      ? "border-ink bg-ink text-white"
                      : "border-ink/25 bg-white/70 text-transparent hover:border-ink/60",
                  )}
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </button>
                <span
                  className={cx(
                    "min-w-0 flex-1 text-lg font-semibold break-words",
                    plan.done && "text-faint line-through decoration-2",
                  )}
                >
                  {plan.title}
                </span>
                <button
                  type="button"
                  onClick={() => remove(plan.id)}
                  aria-label={t.remove}
                  title={t.remove}
                  className="grid size-8 shrink-0 place-items-center rounded-full text-faint opacity-0 transition group-hover:opacity-100 hover:bg-ink/5 hover:text-ink focus-visible:opacity-100 max-sm:opacity-100"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

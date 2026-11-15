"use client";

import { useSyncExternalStore } from "react";

/**
 * One shared clock for the whole page, so every countdown and clock ticks on
 * the same second. Returns null on the server and during hydration.
 */
const listeners = new Set<() => void>();
let currentSecond = 0;
let timer: ReturnType<typeof setInterval> | null = null;

function tick() {
  const second = Math.floor(Date.now() / 1000);
  if (second === currentSecond) return;
  currentSecond = second;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  timer ??= setInterval(tick, 200);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot() {
  if (!currentSecond) currentSecond = Math.floor(Date.now() / 1000);
  return currentSecond * 1000;
}

const getServerSnapshot = () => null;

/** Current time in epoch milliseconds, updated once a second. */
export function useNow(): number | null {
  return useSyncExternalStore<number | null>(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
}

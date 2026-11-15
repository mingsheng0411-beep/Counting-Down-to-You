"use client";

import { useEffect, useState } from "react";

import { getSpaceRepository } from "@/data";
import type { MemoryPhoto } from "@/domain/types";

/** Resolves a photo reference to something an <img> can show. */
export function usePhotoUrl(photo: MemoryPhoto | null): string | null {
  const storedId = photo?.kind === "stored" ? photo.id : null;
  const [resolved, setResolved] = useState<{
    id: string;
    url: string | null;
  } | null>(null);

  useEffect(() => {
    if (!storedId) return;
    let cancelled = false;
    getSpaceRepository()
      .resolvePhotoUrl({ kind: "stored", id: storedId })
      .then((url) => {
        if (!cancelled) setResolved({ id: storedId, url });
      })
      .catch(() => {
        if (!cancelled) setResolved({ id: storedId, url: null });
      });
    return () => {
      cancelled = true;
    };
  }, [storedId]);

  if (photo?.kind === "url") return photo.url;
  return storedId && resolved?.id === storedId ? resolved.url : null;
}

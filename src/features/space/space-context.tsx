"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getSpaceRepository } from "@/data";
import type {
  Memory,
  MemoryDraft,
  Partner,
  PartnerSlot,
  Space,
  SpaceDraft,
} from "@/domain/types";
import { useI18n } from "@/i18n/i18n-provider";

import { createDemoSpace } from "./demo";

interface Loaded {
  space: Space;
  memories: Memory[];
  /** True while showing the sample space; nothing has been saved yet. */
  isDemo: boolean;
}

interface SpaceValue extends Loaded {
  saveSpace(draft: SpaceDraft): Promise<void>;
  /**
   * Changes part of the space, keeping the rest. In the sample space this is
   * a preview only and is not saved.
   */
  updateSpace(patch: Partial<SpaceDraft>): Promise<void>;
  /** Changes one partner's place, mood or name. */
  updatePartner(slot: PartnerSlot, patch: Partial<Partner>): Promise<void>;
  resetSpace(): Promise<void>;
  addMemory(draft: MemoryDraft, photo: Blob | null): Promise<void>;
  updateMemory(
    id: string,
    draft: MemoryDraft,
    photo?: Blob | null,
  ): Promise<void>;
  deleteMemory(id: string): Promise<void>;
}

const SpaceContext = createContext<SpaceValue | null>(null);

/**
 * Loads the current space and exposes it with its mutations. Components read
 * and change data only through this context, never the repository directly.
 */
export function SpaceProvider({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const { dict } = useI18n();
  const demoText = dict.demo;
  const [data, setData] = useState<Loaded | null>(null);

  useEffect(() => {
    let cancelled = false;
    const showDemo = () =>
      setData({ ...createDemoSpace(Date.now(), demoText), isDemo: true });

    (async () => {
      const repository = getSpaceRepository();
      const space = await repository.getSpace();
      if (cancelled) return;
      if (!space) return showDemo();
      const memories = await repository.listMemories();
      if (!cancelled) setData({ space, memories, isDemo: false });
    })().catch(() => {
      // Storage can be unavailable (private windows); still show the page.
      if (!cancelled) showDemo();
    });

    return () => {
      cancelled = true;
    };
  }, [demoText]);

  const saveSpace = useCallback(async (draft: SpaceDraft) => {
    const space = await getSpaceRepository().saveSpace(draft);
    setData((prev) => ({
      space,
      memories: prev && !prev.isDemo ? prev.memories : [],
      isDemo: false,
    }));
  }, []);

  const updateSpace = useCallback(
    async (patch: Partial<SpaceDraft>) => {
      if (!data) return;
      const { space } = data;
      const draft: SpaceDraft = {
        partners: space.partners,
        togetherSince: space.togetherSince,
        nextMeeting: space.nextMeeting,
        flight: space.flight ?? null,
        plans: space.plans ?? [],
        ...patch,
      };
      if (data.isDemo) {
        setData({ ...data, space: { ...space, ...draft } });
        return;
      }
      const saved = await getSpaceRepository().saveSpace(draft);
      setData((prev) => prev && { ...prev, space: saved });
    },
    [data],
  );

  const updatePartner = useCallback(
    async (slot: PartnerSlot, patch: Partial<Partner>) => {
      if (!data) return;
      const { partners } = data.space;
      await updateSpace({
        partners: { ...partners, [slot]: { ...partners[slot], ...patch } },
      });
    },
    [data, updateSpace],
  );
  const resetSpace = useCallback(async () => {
    await getSpaceRepository().deleteSpace();
    setData({ ...createDemoSpace(Date.now(), demoText), isDemo: true });
  }, [demoText]);

  const addMemory = useCallback(
    async (draft: MemoryDraft, photo: Blob | null) => {
      const memory = await getSpaceRepository().addMemory(draft, photo);
      setData((prev) =>
        prev ? { ...prev, memories: [...prev.memories, memory] } : prev,
      );
    },
    [],
  );

  const updateMemory = useCallback(
    async (id: string, draft: MemoryDraft, photo?: Blob | null) => {
      const updated = await getSpaceRepository().updateMemory(id, draft, photo);
      setData((prev) =>
        prev
          ? {
              ...prev,
              memories: prev.memories.map((memory) =>
                memory.id === id ? updated : memory,
              ),
            }
          : prev,
      );
    },
    [],
  );

  const deleteMemory = useCallback(async (id: string) => {
    await getSpaceRepository().deleteMemory(id);
    setData((prev) =>
      prev
        ? {
            ...prev,
            memories: prev.memories.filter((memory) => memory.id !== id),
          }
        : prev,
    );
  }, []);

  const value = useMemo(
    () =>
      data && {
        ...data,
        saveSpace,
        updateSpace,
        updatePartner,
        resetSpace,
        addMemory,
        updateMemory,
        deleteMemory,
      },
    [
      data,
      saveSpace,
      updateSpace,
      updatePartner,
      resetSpace,
      addMemory,
      updateMemory,
      deleteMemory,
    ],
  );

  if (!value) return fallback;
  return <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>;
}

export function useSpace(): SpaceValue {
  const value = useContext(SpaceContext);
  if (!value) throw new Error("useSpace must be used inside <SpaceProvider>");
  return value;
}

import { createStore, del, get, set, type UseStore } from "idb-keyval";

import type {
  Memory,
  MemoryDraft,
  MemoryPhoto,
  Space,
  SpaceDraft,
} from "@/domain/types";

import type { SpaceRepository } from "../space-repository";

const SPACE_KEY = "space";
const MEMORIES_KEY = "memories";
const photoKey = (id: string) => `photo:${id}`;

/** Keeps one couple's space in this browser's IndexedDB. */
export class IndexedDbSpaceRepository implements SpaceRepository {
  private storeRef: UseStore | null = null;
  private readonly photoUrls = new Map<string, string>();

  private get store(): UseStore {
    this.storeRef ??= createStore("faraway-together", "space");
    return this.storeRef;
  }

  async getSpace(): Promise<Space | null> {
    return (await get<Space>(SPACE_KEY, this.store)) ?? null;
  }

  async saveSpace(draft: SpaceDraft): Promise<Space> {
    const existing = await this.getSpace();
    const now = new Date().toISOString();
    const space: Space = {
      id: existing?.id ?? crypto.randomUUID(),
      createdAt: existing?.createdAt ?? now,
      ...draft,
      updatedAt: now,
    };
    await set(SPACE_KEY, space, this.store);
    return space;
  }

  async deleteSpace(): Promise<void> {
    const memories = await this.listMemories();
    await Promise.all(memories.map((memory) => this.removePhoto(memory.photo)));
    await del(MEMORIES_KEY, this.store);
    await del(SPACE_KEY, this.store);
  }

  async listMemories(): Promise<Memory[]> {
    return (await get<Memory[]>(MEMORIES_KEY, this.store)) ?? [];
  }

  async addMemory(draft: MemoryDraft, photo: Blob | null): Promise<Memory> {
    const space = await this.getSpace();
    if (!space) throw new Error("Create the space before adding memories");
    const memory: Memory = {
      id: crypto.randomUUID(),
      spaceId: space.id,
      ...draft,
      photo: photo ? await this.storePhoto(photo) : null,
      createdAt: new Date().toISOString(),
    };
    await set(MEMORIES_KEY, [...(await this.listMemories()), memory], this.store);
    return memory;
  }

  async updateMemory(
    id: string,
    draft: MemoryDraft,
    photo?: Blob | null,
  ): Promise<Memory> {
    const memories = await this.listMemories();
    const current = memories.find((memory) => memory.id === id);
    if (!current) throw new Error(`Memory not found: ${id}`);

    let nextPhoto = current.photo;
    if (photo !== undefined) {
      await this.removePhoto(current.photo);
      nextPhoto = photo ? await this.storePhoto(photo) : null;
    }
    const updated: Memory = { ...current, ...draft, photo: nextPhoto };
    await set(
      MEMORIES_KEY,
      memories.map((memory) => (memory.id === id ? updated : memory)),
      this.store,
    );
    return updated;
  }

  async deleteMemory(id: string): Promise<void> {
    const memories = await this.listMemories();
    const target = memories.find((memory) => memory.id === id);
    if (!target) return;
    await this.removePhoto(target.photo);
    await set(
      MEMORIES_KEY,
      memories.filter((memory) => memory.id !== id),
      this.store,
    );
  }

  async resolvePhotoUrl(photo: MemoryPhoto): Promise<string | null> {
    if (photo.kind === "url") return photo.url;
    const cached = this.photoUrls.get(photo.id);
    if (cached) return cached;
    const blob = await get<Blob>(photoKey(photo.id), this.store);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    this.photoUrls.set(photo.id, url);
    return url;
  }

  private async storePhoto(blob: Blob): Promise<MemoryPhoto> {
    const id = crypto.randomUUID();
    await set(photoKey(id), blob, this.store);
    return { kind: "stored", id };
  }

  private async removePhoto(photo: MemoryPhoto | null): Promise<void> {
    if (photo?.kind !== "stored") return;
    await del(photoKey(photo.id), this.store);
    const url = this.photoUrls.get(photo.id);
    if (url) {
      URL.revokeObjectURL(url);
      this.photoUrls.delete(photo.id);
    }
  }
}

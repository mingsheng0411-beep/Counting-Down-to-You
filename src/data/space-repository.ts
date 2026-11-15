import type {
  Memory,
  MemoryDraft,
  MemoryPhoto,
  Space,
  SpaceDraft,
} from "@/domain/types";

/**
 * The only door between the UI and wherever a couple's data lives.
 *
 * V0 implements it on top of the browser's IndexedDB. V1 adds an
 * implementation backed by the cloud database and file storage; nothing in
 * `features/` should need to change when that happens.
 *
 * Every method is scoped to "the current space": locally there is only one,
 * and in V1 it is the space the signed-in user belongs to.
 */
export interface SpaceRepository {
  getSpace(): Promise<Space | null>;
  /** Creates the space on first save, updates it afterwards. */
  saveSpace(draft: SpaceDraft): Promise<Space>;
  /** Deletes the space with all of its memories and photos. */
  deleteSpace(): Promise<void>;

  listMemories(): Promise<Memory[]>;
  addMemory(draft: MemoryDraft, photo: Blob | null): Promise<Memory>;
  /**
   * `photo`: a Blob replaces the photo, `null` removes it, `undefined` keeps
   * whatever is there.
   */
  updateMemory(
    id: string,
    draft: MemoryDraft,
    photo?: Blob | null,
  ): Promise<Memory>;
  deleteMemory(id: string): Promise<void>;

  /** Turns a photo reference into a URL an <img> can display. */
  resolvePhotoUrl(photo: MemoryPhoto): Promise<string | null>;
}

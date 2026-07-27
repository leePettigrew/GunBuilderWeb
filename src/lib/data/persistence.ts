/**
 * Persistence seam — UI never touches localStorage directly. Swap the adapter
 * to change where data lives (browser storage, memory for SSR/tests, a future
 * sync backend).
 */

const KEY_PREFIX = "ashen-armoury:v1:";

export interface PersistenceAdapter {
  load<T>(key: string): T | null;
  save(key: string, value: unknown): void;
  remove(key: string): void;
}

export class LocalStoragePersistence implements PersistenceAdapter {
  load<T>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(KEY_PREFIX + key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      // Corrupt JSON or blocked storage reads as "nothing saved".
      return null;
    }
  }

  save(key: string, value: unknown): void {
    try {
      window.localStorage.setItem(KEY_PREFIX + key, JSON.stringify(value));
    } catch {
      // Quota exceeded / privacy mode: fail soft — the in-memory React state
      // stays authoritative for this session.
    }
  }

  remove(key: string): void {
    try {
      window.localStorage.removeItem(KEY_PREFIX + key);
    } catch {
      // Fail soft, same as save.
    }
  }
}

/** In-memory adapter for SSR passes and tests. */
export class MemoryPersistence implements PersistenceAdapter {
  private store = new Map<string, string>();

  load<T>(key: string): T | null {
    const raw = this.store.get(key);
    if (raw === undefined) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  save(key: string, value: unknown): void {
    try {
      this.store.set(key, JSON.stringify(value));
    } catch {
      // Unserializable value: fail soft.
    }
  }

  remove(key: string): void {
    this.store.delete(key);
  }
}

export function createBrowserPersistence(): PersistenceAdapter {
  try {
    // Touching window.localStorage can itself throw in locked-down browsers.
    if (typeof window !== "undefined" && window.localStorage) {
      return new LocalStoragePersistence();
    }
  } catch {
    // Fall through to memory.
  }
  return new MemoryPersistence();
}

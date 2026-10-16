import type { Entry } from "../lib/types";

export interface EntryStore {
  getAll(): Promise<Entry[]>;
  upsert(entry: Entry): Promise<void>;
  remove(id: string): Promise<void>;
  replaceAll(entries: Entry[]): Promise<void>;
  getLastExportedAt(): Promise<string | null>;
  setLastExportedAt(iso: string): Promise<void>;
  /** Deletes everything Tastelog stored: entries, last-exported time, and any unreadable-data backups. */
  clearAll(): Promise<void>;
}

/** The only thing the store needs from a storage engine (AsyncStorage fits this). */
export type KeyValueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
};

const KEY_PREFIX = "tastelog:"; // every key we write starts with this
const DATA_KEY = "tastelog:data";
const LAST_EXPORT_KEY = "tastelog:lastExportedAt";
const STORAGE_VERSION = 1;

export function createEntryStore(kv: KeyValueStorage): EntryStore {
  // Every operation runs one at a time, so two quick saves can never
  // read the same old data and overwrite each other.
  let queue: Promise<unknown> = Promise.resolve();
  const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
    const run = queue.then(task);
    queue = run.catch(() => undefined);
    return run;
  };

  const read = async (): Promise<Entry[]> => {
    const raw = await kv.getItem(DATA_KEY);
    if (raw === null) return [];
    try {
      const data = JSON.parse(raw);
      if (data && data.version === STORAGE_VERSION && Array.isArray(data.entries)) {
        return data.entries as Entry[];
      }
    } catch {
      // fall through: treated as unreadable
    }
    // Unreadable data: keep the raw text under another key instead of overwriting it.
    await kv.setItem(`${DATA_KEY}:corrupt:${Date.now()}`, raw);
    await kv.removeItem(DATA_KEY);
    return [];
  };

  const write = (entries: Entry[]) => kv.setItem(DATA_KEY, JSON.stringify({ version: STORAGE_VERSION, entries }));

  return {
    getAll: () => enqueue(read),
    upsert: (entry) =>
      enqueue(async () => {
        const all = await read();
        const i = all.findIndex((e) => e.id === entry.id);
        if (i === -1) all.push(entry);
        else all[i] = entry;
        await write(all);
      }),
    remove: (id) =>
      enqueue(async () => {
        const all = await read();
        await write(all.filter((e) => e.id !== id));
      }),
    replaceAll: (entries) => enqueue(() => write(entries)),
    getLastExportedAt: () => enqueue(() => kv.getItem(LAST_EXPORT_KEY)),
    setLastExportedAt: (iso) => enqueue(() => kv.setItem(LAST_EXPORT_KEY, iso)),
    clearAll: () =>
      enqueue(async () => {
        const keys = await kv.getAllKeys();
        for (const key of keys) {
          if (key.startsWith(KEY_PREFIX)) await kv.removeItem(key);
        }
      }),
  };
}

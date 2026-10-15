import type { Entry } from "../../lib/types";
import { createEntryStore, type KeyValueStorage } from "../entryStore";

const memory = (initial: Record<string, string> = {}) => {
  const data = new Map(Object.entries(initial));
  const kv: KeyValueStorage = {
    // small random delays make unsafe read-modify-write code fail
    getItem: async (k) => {
      await new Promise((r) => setTimeout(r, Math.random() * 3));
      return data.get(k) ?? null;
    },
    setItem: async (k, v) => {
      await new Promise((r) => setTimeout(r, Math.random() * 3));
      data.set(k, v);
    },
    removeItem: async (k) => void data.delete(k),
  };
  return { kv, data };
};

const entry = (id: string, rating = 5): Entry => ({
  id,
  foodName: "Ramen",
  rating,
  mood: "happy",
  date: "2026-10-14",
  tags: [],
  createdAt: "2026-10-14T03:00:00.000Z",
});

describe("createEntryStore", () => {
  it("starts empty", async () => {
    expect(await createEntryStore(memory().kv).getAll()).toEqual([]);
  });

  it("inserts, updates by id, and removes", async () => {
    const store = createEntryStore(memory().kv);
    await store.upsert(entry("a", 5));
    await store.upsert(entry("b", 6));
    await store.upsert(entry("a", 9)); // update, not a new row
    expect((await store.getAll()).map((e) => [e.id, e.rating])).toEqual([
      ["a", 9],
      ["b", 6],
    ]);
    await store.remove("a");
    expect((await store.getAll()).map((e) => e.id)).toEqual(["b"]);
  });

  it("replaceAll replaces everything", async () => {
    const store = createEntryStore(memory().kv);
    await store.upsert(entry("a"));
    await store.replaceAll([entry("x"), entry("y")]);
    expect((await store.getAll()).map((e) => e.id)).toEqual(["x", "y"]);
  });

  it("does not lose entries when many saves happen at once", async () => {
    const store = createEntryStore(memory().kv);
    await Promise.all(Array.from({ length: 25 }, (_, i) => store.upsert(entry(`e${i}`))));
    expect((await store.getAll()).length).toBe(25);
  });

  it("persists across store instances (like an app restart)", async () => {
    const { kv } = memory();
    await createEntryStore(kv).upsert(entry("a"));
    expect((await createEntryStore(kv).getAll()).map((e) => e.id)).toEqual(["a"]);
  });

  it("stores and returns the last exported time", async () => {
    const store = createEntryStore(memory().kv);
    expect(await store.getLastExportedAt()).toBeNull();
    await store.setLastExportedAt("2026-10-14T03:00:00.000Z");
    expect(await store.getLastExportedAt()).toBe("2026-10-14T03:00:00.000Z");
  });

  it("keeps unreadable data under another key instead of overwriting it", async () => {
    const { kv, data } = memory({ "tastelog:data": "{not json" });
    const store = createEntryStore(kv);
    expect(await store.getAll()).toEqual([]);
    const backups = [...data.entries()].filter(([k]) => k.startsWith("tastelog:data:corrupt:"));
    expect(backups.length).toBe(1);
    expect(backups[0][1]).toBe("{not json");
    await store.upsert(entry("a"));
    expect((await store.getAll()).length).toBe(1);
  });
});

import type { Entry } from "./types";

let counter = 0;

/** Each call makes an entry created one second after the previous one. */
export function makeEntry(overrides: Partial<Entry> = {}): Entry {
  counter += 1;
  return {
    id: `id${counter}`,
    foodName: "Ramen",
    rating: 5,
    mood: "happy",
    date: "2026-10-14",
    tags: [],
    createdAt: new Date(Date.UTC(2026, 9, 14, 3, 0, counter)).toISOString(),
    ...overrides,
  };
}

export const ids = (entries: Entry[]) => entries.map((e) => e.id);

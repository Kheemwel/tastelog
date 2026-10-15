import { matchKey } from "./keys";
import type { Entry } from "./types";

export type NameKind = "food" | "place" | "tag";
export type NameInfo = { key: string; name: string; count: number };

/** Values of one kind in an entry: food has one, place has zero or one, tags have many. */
export function valuesOf(entry: Entry, kind: NameKind): string[] {
  if (kind === "food") return [entry.foodName];
  if (kind === "place") return entry.place ? [entry.place] : [];
  return entry.tags;
}

/**
 * Distinct names of one kind, grouped by match key. The spelling shown is the one
 * from the most recently created entry. Sorted by count (most used first), then name.
 */
export function deriveNames(entries: Entry[], kind: NameKind): NameInfo[] {
  const groups = new Map<string, { name: string; count: number; latest: number }>();
  for (const entry of entries) {
    const created = Date.parse(entry.createdAt);
    for (const value of valuesOf(entry, kind)) {
      const key = matchKey(value);
      if (key === "") continue;
      const group = groups.get(key);
      if (!group) {
        groups.set(key, { name: value, count: 1, latest: created });
      } else {
        group.count += 1;
        if (created > group.latest) {
          group.name = value;
          group.latest = created;
        }
      }
    }
  }
  return [...groups.entries()].map(([key, g]) => ({ key, name: g.name, count: g.count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Autocomplete: names starting with the typed text first, then names containing it. */
export function suggest(entries: Entry[], kind: NameKind, typed: string, limit = 8): NameInfo[] {
  const all = deriveNames(entries, kind);
  const query = matchKey(typed);
  if (query === "") return all.slice(0, limit);
  const starts = all.filter((n) => n.key.startsWith(query));
  const contains = all.filter((n) => !n.key.startsWith(query) && n.key.includes(query));
  return [...starts, ...contains].slice(0, limit);
}

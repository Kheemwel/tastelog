import { matchKey } from "./keys";
import { MOODS, type MoodKey } from "./moods";
import { deriveNames } from "./names";
import type { Entry } from "./types";

export const NO_PLACE_LABEL = "(no place)";

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

// Chart 1: average rating per month. Months with no entries are left out (not drawn as 0).
export type MonthPoint = { month: string; average: number; count: number };

export function averageRatingByMonth(entries: Entry[]): MonthPoint[] {
  const groups = new Map<string, { sum: number; count: number }>();
  for (const e of entries) {
    const month = e.date.slice(0, 7);
    const g = groups.get(month) ?? { sum: 0, count: 0 };
    g.sum += e.rating;
    g.count += 1;
    groups.set(month, g);
  }
  return [...groups.entries()].sort(([a], [b]) => cmp(a, b)).map(([month, g]) => ({ month, average: g.sum / g.count, count: g.count }));
}

// Chart 2: mood counts, biggest first (ties follow the mood list order). Unused moods are left out.
export type MoodCount = { key: MoodKey; emoji: string; label: string; count: number };

export function moodDistribution(entries: Entry[]): MoodCount[] {
  const counts = new Map<MoodKey, number>();
  for (const e of entries) counts.set(e.mood, (counts.get(e.mood) ?? 0) + 1);
  const order = new Map<MoodKey, number>(MOODS.map((m, i) => [m.key, i] as [MoodKey, number]));
  return MOODS.filter((m) => counts.has(m.key))
    .map((m) => ({ key: m.key, emoji: m.emoji, label: m.label, count: counts.get(m.key) as number }))
    .sort((a, b) => b.count - a.count || (order.get(a.key) as number) - (order.get(b.key) as number));
}

// Chart 3: most-eaten foods.
export function topFoods(entries: Entry[], limit = 10) {
  return deriveNames(entries, "food").slice(0, limit);
}

// Charts 4 and 5 share this shape.
export type AverageItem = { key: string; name: string; average: number; count: number };

function groupAverages(entries: Entry[], pick: (e: Entry) => string | undefined): AverageItem[] {
  const groups = new Map<string, { name: string; latest: number; sum: number; count: number }>();
  for (const e of entries) {
    const value = pick(e);
    if (value === undefined) continue;
    const key = matchKey(value);
    if (key === "") continue;
    const created = Date.parse(e.createdAt);
    const g = groups.get(key);
    if (!g) {
      groups.set(key, { name: value, latest: created, sum: e.rating, count: 1 });
    } else {
      g.sum += e.rating;
      g.count += 1;
      if (created > g.latest) {
        g.name = value;
        g.latest = created;
      }
    }
  }
  return [...groups.entries()]
    .map(([key, g]) => ({ key, name: g.name, average: g.sum / g.count, count: g.count }))
    .sort((a, b) => b.average - a.average || b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Chart 4: average rating per place or per food. Only items with at least `minEntries`
 * entries count. If none qualify yet, everything is shown and `fallback` is true.
 * Entries without a place are ignored in place mode.
 */
export function averageRatingBy(entries: Entry[], by: "place" | "food", minEntries = 2, limit = 10): { items: AverageItem[]; fallback: boolean } {
  const items = groupAverages(entries, by === "food" ? (e) => e.foodName : (e) => e.place);
  const qualified = items.filter((i) => i.count >= minEntries);
  const fallback = qualified.length === 0;
  return { items: (fallback ? items : qualified).slice(0, limit), fallback };
}

/** Chart 5: one food, average rating at each place. Entries without a place become "(no place)". */
export function foodAcrossPlaces(entries: Entry[], food: string): AverageItem[] {
  const foodKey = matchKey(food);
  return groupAverages(
    entries.filter((e) => matchKey(e.foodName) === foodKey),
    (e) => e.place ?? NO_PLACE_LABEL,
  );
}

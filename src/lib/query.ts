import { matchKey } from "./keys";
import type { MoodKey } from "./moods";
import type { Entry } from "./types";

export type Filters = {
  food?: string;
  place?: string;
  tag?: string;
  moods?: MoodKey[]; // any of these
  ratingMin?: number; // inclusive
  ratingMax?: number; // inclusive
  dateFrom?: string; // "YYYY-MM-DD", inclusive
  dateTo?: string; // "YYYY-MM-DD", inclusive
};

export const NO_FILTERS: Filters = {};

const isSet = (text: string | undefined) => text !== undefined && matchKey(text) !== "";

/** Rating range counts as one filter, date range as one. */
export function countActiveFilters(f: Filters): number {
  let n = 0;
  if (isSet(f.food)) n++;
  if (isSet(f.place)) n++;
  if (isSet(f.tag)) n++;
  if (f.moods && f.moods.length > 0) n++;
  if (f.ratingMin !== undefined || f.ratingMax !== undefined) n++;
  if (f.dateFrom || f.dateTo) n++;
  return n;
}

/** Every word must appear somewhere in the food, comment, place, or tags. */
export function searchEntries(entries: Entry[], query: string): Entry[] {
  const words = matchKey(query).split(" ").filter(Boolean);
  if (words.length === 0) return entries;
  return entries.filter((e) => {
    const haystack = matchKey([e.foodName, e.comment ?? "", e.place ?? "", ...e.tags].join(" "));
    return words.every((w) => haystack.includes(w));
  });
}

/** All active filters must match (AND). */
export function applyFilters(entries: Entry[], f: Filters): Entry[] {
  const food = f.food ? matchKey(f.food) : "";
  const place = f.place ? matchKey(f.place) : "";
  const tag = f.tag ? matchKey(f.tag) : "";
  return entries.filter((e) => {
    if (food && matchKey(e.foodName) !== food) return false;
    if (place && matchKey(e.place ?? "") !== place) return false;
    if (tag && !e.tags.some((t) => matchKey(t) === tag)) return false;
    if (f.moods && f.moods.length > 0 && !f.moods.includes(e.mood)) return false;
    if (f.ratingMin !== undefined && e.rating < f.ratingMin) return false;
    if (f.ratingMax !== undefined && e.rating > f.ratingMax) return false;
    if (f.dateFrom && e.date < f.dateFrom) return false;
    if (f.dateTo && e.date > f.dateTo) return false;
    return true;
  });
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Newest date first; within a day, most recently created first. */
export function sortNewestFirst(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => cmp(b.date, a.date) || Date.parse(b.createdAt) - Date.parse(a.createdAt) || cmp(a.id, b.id));
}

/** What the Journal list shows: search, then filters, then sorted. */
export function queryEntries(entries: Entry[], search: string, filters: Filters): Entry[] {
  return sortNewestFirst(applyFilters(searchEntries(entries, search), filters));
}

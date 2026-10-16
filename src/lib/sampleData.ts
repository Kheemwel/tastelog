import { toLocalDateString } from "./keys";
import { MOODS } from "./moods";
import type { Entry } from "./types";

/** Every generated entry carries this tag, so the sample data can be found and removed. */
export const SAMPLE_TAG = "sample-data";

const FOODS = [
  "Ramen",
  "ramen",
  "Adobo",
  "Sinigang",
  "Pizza",
  "Burger",
  "Fried Chicken",
  "Sushi",
  "Pad Thai",
  "Pho",
  "Tacos",
  "Pancit",
  "Lechon Kawali",
  "Caesar Salad",
  "Pasta Carbonara",
  "Halo-Halo",
  "Ice Cream",
  "Milk Tea",
  "Fried Rice",
  "Beef Steak",
  "Dumplings",
  "Curry",
  "Kare-Kare",
  "Shawarma",
  "Bibimbap",
  "Lasagna",
  "Tonkatsu",
  "Chicken Wings",
  "Samgyupsal",
  "Siomai",
];
const PLACES = [
  "Mcdo",
  "mcdo",
  "Jollibee",
  "Home",
  "Ichiran",
  "Mang Inasal",
  "Local Carinderia",
  "Mall Food Court",
  "Office Canteen",
  "Night Market",
  "Seaside Cafe",
  "Grandma's House",
  "Korean Corner",
  "Pizza Place",
  "Ramen House",
  "Street Stall",
];
const TAGS = ["street food", "homemade", "spicy", "cheap", "comfort food", "dessert", "late night", "healthy"];
const COMMENTS = [
  "",
  "",
  "",
  "Would order again",
  "Too salty",
  "Great broth",
  "Portion was small",
  "Perfect on a rainy day",
  "Not as good as last time",
  "Served cold",
];

// Small seeded random generator (mulberry32): the same seed always gives the same data.
function seededRandom(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Makes `count` valid entries spread over the last two years, ending today. */
export function generateSampleEntries(count: number, now: Date, makeId: () => string, seed = 1): Entry[] {
  const random = seededRandom(seed);
  const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)];

  const entries: Entry[] = [];
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(random() * 730);
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, 12, 0, i % 60);

    const tags: string[] = [];
    const tagCount = Math.floor(random() * 3); // 0 to 2 real tags
    while (tags.length < tagCount) {
      const tag = pick(TAGS);
      if (!tags.includes(tag)) tags.push(tag);
    }
    tags.push(SAMPLE_TAG);

    const entry: Entry = {
      id: makeId(),
      foodName: pick(FOODS),
      rating: Math.round((random() + random()) * 5), // 0 to 10, most often near the middle
      mood: pick(MOODS).key,
      date: toLocalDateString(day),
      tags,
      createdAt: day.toISOString(),
    };
    if (random() < 0.8) entry.place = pick(PLACES);
    const comment = pick(COMMENTS);
    if (comment !== "") entry.comment = comment;
    entries.push(entry);
  }
  return entries;
}

export const isSampleEntry = (entry: Entry): boolean => entry.tags.includes(SAMPLE_TAG);

export function removeSampleEntries(entries: Entry[]): Entry[] {
  return entries.filter((e) => !isSampleEntry(e));
}

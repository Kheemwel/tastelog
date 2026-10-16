import { toLocalDateString } from "../keys";
import { generateSampleEntries, isSampleEntry, removeSampleEntries } from "../sampleData";
import type { Entry } from "../types";
import { validateEntry } from "../validation";

const now = new Date(2026, 9, 14, 12);
const counterIds = () => {
  let n = 0;
  return () => `s${++n}`;
};

describe("generateSampleEntries", () => {
  it("makes the requested number of entries that are already clean and valid", () => {
    const entries = generateSampleEntries(500, now, counterIds());
    expect(entries).toHaveLength(500);
    for (const entry of entries) {
      const result = validateEntry(entry);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.entry).toEqual(entry); // validation would not change anything
    }
  });

  it("gives every entry a unique id and the sample tag", () => {
    const entries = generateSampleEntries(300, now, counterIds());
    expect(new Set(entries.map((e) => e.id)).size).toBe(300);
    expect(entries.every(isSampleEntry)).toBe(true);
  });

  it("gives the same data for the same seed and different data for another", () => {
    const a = generateSampleEntries(50, now, counterIds(), 7);
    const b = generateSampleEntries(50, now, counterIds(), 7);
    const c = generateSampleEntries(50, now, counterIds(), 8);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("spreads dates over about two years and never into the future", () => {
    const entries = generateSampleEntries(2000, now, counterIds());
    const today = toLocalDateString(now);
    const dates = entries.map((e) => e.date).sort();
    expect(dates[dates.length - 1] <= today).toBe(true);
    expect(dates[0] >= "2024-10-01").toBe(true);
    expect(dates[0] < "2025-01-01").toBe(true); // reaches well back
  });

  it("includes entries without a place or comment, and uses the full rating range", () => {
    const entries = generateSampleEntries(1000, now, counterIds());
    expect(entries.some((e) => e.place === undefined)).toBe(true);
    expect(entries.some((e) => e.comment === undefined)).toBe(true);
    const ratings = new Set(entries.map((e) => e.rating));
    expect(Math.min(...ratings)).toBeLessThanOrEqual(1);
    expect(Math.max(...ratings)).toBeGreaterThanOrEqual(9);
  });
});

describe("removeSampleEntries", () => {
  it("removes only entries carrying the sample tag", () => {
    const real: Entry = {
      id: "real1",
      foodName: "Adobo",
      rating: 8,
      mood: "happy",
      date: "2026-10-01",
      tags: ["homemade"],
      createdAt: "2026-10-01T04:00:00.000Z",
    };
    const mixed = [real, ...generateSampleEntries(20, now, counterIds())];
    expect(removeSampleEntries(mixed)).toEqual([real]);
  });
});

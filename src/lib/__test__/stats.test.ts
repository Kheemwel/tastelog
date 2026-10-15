import { averageRatingBy, averageRatingByMonth, foodAcrossPlaces, moodDistribution, topFoods } from "../stats";
import { makeEntry } from "../testHelpers";

describe("averageRatingByMonth", () => {
  it("averages per month, sorted, and skips months with no entries", () => {
    const entries = [
      makeEntry({ date: "2026-08-03", rating: 6 }),
      makeEntry({ date: "2026-10-01", rating: 8 }),
      makeEntry({ date: "2026-10-20", rating: 9 }),
      makeEntry({ date: "2026-08-30", rating: 8 }),
    ];
    expect(averageRatingByMonth(entries)).toEqual([
      { month: "2026-08", average: 7, count: 2 },
      { month: "2026-10", average: 8.5, count: 2 },
    ]);
  });

  it("returns an empty list with no entries", () => {
    expect(averageRatingByMonth([])).toEqual([]);
  });
});

describe("moodDistribution", () => {
  it("sorts by count, breaks ties by mood list order, and omits unused moods", () => {
    const entries = [
      makeEntry({ mood: "sad" }),
      makeEntry({ mood: "happy" }),
      makeEntry({ mood: "sluggish" }),
      makeEntry({ mood: "happy" }),
      makeEntry({ mood: "neutral" }),
    ];
    const result = moodDistribution(entries);
    expect(result.map((m) => [m.key, m.count])).toEqual([
      ["happy", 2],
      ["neutral", 1],
      ["sluggish", 1],
      ["sad", 1],
    ]);
    expect(result[0].emoji).toBe("😄");
  });
});

describe("topFoods", () => {
  it("counts foods ignoring case and respects the limit", () => {
    const entries = [
      makeEntry({ foodName: "Ramen" }),
      makeEntry({ foodName: "ramen" }),
      makeEntry({ foodName: "RAMEN" }),
      makeEntry({ foodName: "Adobo" }),
      makeEntry({ foodName: "adobo" }),
      makeEntry({ foodName: "Pizza" }),
    ];
    expect(topFoods(entries, 2).map((f) => [f.key, f.count])).toEqual([
      ["ramen", 3],
      ["adobo", 2],
    ]);
  });
});

describe("averageRatingBy", () => {
  it("averages per place, needs 2+ entries, and ignores entries without a place", () => {
    const entries = [
      makeEntry({ place: "Ichiran", rating: 10 }),
      makeEntry({ place: "ICHIRAN", rating: 8 }),
      makeEntry({ place: "Mcdo", rating: 10 }),
      makeEntry({ place: "Home", rating: 6 }),
      makeEntry({ place: "home", rating: 5 }),
      makeEntry({ rating: 10 }),
    ];
    const r = averageRatingBy(entries, "place");
    expect(r.fallback).toBe(false);
    expect(r.items.map((i) => [i.key, i.average, i.count])).toEqual([
      ["ichiran", 9, 2],
      ["home", 5.5, 2],
    ]);
  });

  it("shows everything, marked as fallback, when nothing has 2 entries yet", () => {
    const entries = [makeEntry({ place: "A", rating: 4 }), makeEntry({ place: "B", rating: 9 })];
    const r = averageRatingBy(entries, "place");
    expect(r.fallback).toBe(true);
    expect(r.items.map((i) => i.key)).toEqual(["b", "a"]);
  });

  it("works per food and respects the limit", () => {
    const entries = [makeEntry({ foodName: "Ramen", rating: 9 }), makeEntry({ foodName: "ramen", rating: 7 }), makeEntry({ foodName: "Adobo", rating: 10 })];
    const r = averageRatingBy(entries, "food");
    expect(r.items.map((i) => [i.key, i.average, i.count])).toEqual([["ramen", 8, 2]]);
    expect(averageRatingBy(entries, "food", 1, 1).items).toHaveLength(1);
  });
});

describe("foodAcrossPlaces", () => {
  it("averages one food per place, grouping no-place entries, sorted by rating", () => {
    const entries = [
      makeEntry({ foodName: "Ramen", place: "Ichiran", rating: 10 }),
      makeEntry({ foodName: "ramen", place: "ichiran", rating: 8 }),
      makeEntry({ foodName: "Ramen", place: "Mcdo", rating: 4 }),
      makeEntry({ foodName: "Ramen", rating: 6 }),
      makeEntry({ foodName: "Adobo", place: "Home", rating: 10 }),
    ];
    expect(foodAcrossPlaces(entries, "RAMEN").map((i) => [i.key, i.average, i.count])).toEqual([
      ["ichiran", 9, 2],
      ["(no place)", 6, 1],
      ["mcdo", 4, 1],
    ]);
  });

  it("returns an empty list for a food with no entries", () => {
    expect(foodAcrossPlaces([makeEntry()], "pizza")).toEqual([]);
  });
});

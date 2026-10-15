import { applyFilters, countActiveFilters, queryEntries, searchEntries } from "../query";
import { ids, makeEntry } from "../testHelpers";

const a = makeEntry({
  foodName: "Ramen",
  place: "Ichiran",
  comment: "rich broth",
  tags: ["noodles"],
  rating: 9,
  mood: "happy",
  date: "2026-10-10",
});
const b = makeEntry({
  foodName: "Adobo",
  place: "Home",
  comment: "like mom's",
  tags: ["homemade"],
  rating: 7,
  mood: "comforted",
  date: "2026-10-12",
});
const c = makeEntry({
  foodName: "ramen",
  place: "Mcdo",
  tags: [],
  rating: 3,
  mood: "disappointed",
  date: "2026-10-12",
});
const all = [a, b, c];

describe("searchEntries", () => {
  it("ignores case and searches food, comment, place, and tags", () => {
    expect(ids(searchEntries(all, "RAMEN"))).toEqual([a.id, c.id]);
    expect(ids(searchEntries(all, "broth"))).toEqual([a.id]);
    expect(ids(searchEntries(all, "mom"))).toEqual([b.id]);
    expect(ids(searchEntries(all, "homemade"))).toEqual([b.id]);
  });

  it("requires every word to match, possibly in different fields", () => {
    expect(ids(searchEntries(all, "ichiran noodles"))).toEqual([a.id]);
    expect(ids(searchEntries(all, "ramen home"))).toEqual([]);
  });

  it("returns everything for blank text", () => {
    expect(ids(searchEntries(all, "   "))).toEqual(ids(all));
  });
});

describe("applyFilters", () => {
  it("filters by food, place, and tag ignoring case", () => {
    expect(ids(applyFilters(all, { food: "RAMEN" }))).toEqual([a.id, c.id]);
    expect(ids(applyFilters(all, { place: "mcdo" }))).toEqual([c.id]);
    expect(ids(applyFilters(all, { tag: "Homemade" }))).toEqual([b.id]);
  });

  it("filters by any of several moods", () => {
    expect(ids(applyFilters(all, { moods: ["happy", "comforted"] }))).toEqual([a.id, b.id]);
    expect(ids(applyFilters(all, { moods: [] }))).toEqual(ids(all));
  });

  it("filters by an inclusive rating range", () => {
    expect(ids(applyFilters(all, { ratingMin: 7, ratingMax: 9 }))).toEqual([a.id, b.id]);
    expect(ids(applyFilters(all, { ratingMin: 8 }))).toEqual([a.id]);
    expect(ids(applyFilters(all, { ratingMax: 3 }))).toEqual([c.id]);
  });

  it("filters by an inclusive date range", () => {
    expect(ids(applyFilters(all, { dateFrom: "2026-10-12" }))).toEqual([b.id, c.id]);
    expect(ids(applyFilters(all, { dateTo: "2026-10-10" }))).toEqual([a.id]);
    expect(ids(applyFilters(all, { dateFrom: "2026-10-11", dateTo: "2026-10-12" }))).toEqual([b.id, c.id]);
  });

  it("combines filters with AND", () => {
    expect(ids(applyFilters(all, { food: "ramen", ratingMin: 5 }))).toEqual([a.id]);
  });
});

describe("countActiveFilters", () => {
  it("counts each kind once and ignores empty ones", () => {
    expect(countActiveFilters({})).toBe(0);
    expect(countActiveFilters({ food: "  " })).toBe(0);
    expect(countActiveFilters({ food: "x", ratingMin: 1, ratingMax: 5, dateFrom: "2026-01-01", moods: [] })).toBe(3);
  });
});

describe("queryEntries", () => {
  it("sorts newest date first, then newest created first within a day", () => {
    expect(ids(queryEntries(all, "", {}))).toEqual([c.id, b.id, a.id]);
  });

  it("does not modify the original list", () => {
    queryEntries(all, "", {});
    expect(ids(all)).toEqual([a.id, b.id, c.id]);
  });

  it("applies search and filters together", () => {
    expect(ids(queryEntries(all, "ramen", { ratingMin: 5 }))).toEqual([a.id]);
  });
});

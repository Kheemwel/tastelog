import { validateEntry } from "../validation";

const valid = {
  id: "a1",
  foodName: "Ramen",
  rating: 8,
  mood: "happy",
  date: "2026-10-14",
  createdAt: "2026-10-14T03:00:00.000Z",
};

const fieldsWithErrors = (raw: unknown) => {
  const r = validateEntry(raw);
  return r.ok ? [] : r.errors.map((e) => e.field);
};

describe("validateEntry", () => {
  it("accepts a minimal entry and fills defaults", () => {
    const r = validateEntry({ ...valid, mood: undefined });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.entry.mood).toBe("unsure");
      expect(r.entry.tags).toEqual([]);
      expect("place" in r.entry).toBe(false);
      expect("comment" in r.entry).toBe(false);
    }
  });

  it("trims text, drops blank optional fields, and de-duplicates tags by match key", () => {
    const r = validateEntry({
      ...valid,
      foodName: "  Ramen ",
      place: "   ",
      comment: " rich broth ",
      tags: ["Street Food", "street  food", " ", "homemade"],
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.entry.foodName).toBe("Ramen");
      expect(r.entry.place).toBeUndefined();
      expect(r.entry.comment).toBe("rich broth");
      expect(r.entry.tags).toEqual(["Street Food", "homemade"]);
    }
  });

  it("requires a food name", () => {
    expect(fieldsWithErrors({ ...valid, foodName: "   " })).toEqual(["foodName"]);
    expect(fieldsWithErrors({ ...valid, foodName: undefined })).toEqual(["foodName"]);
  });

  it("requires a whole-number rating from 0 to 10", () => {
    expect(validateEntry({ ...valid, rating: 0 }).ok).toBe(true);
    expect(validateEntry({ ...valid, rating: 10 }).ok).toBe(true);
    for (const rating of [null, undefined, -1, 11, 7.5, "5", NaN]) {
      expect(fieldsWithErrors({ ...valid, rating })).toEqual(["rating"]);
    }
  });

  it("rejects an unknown mood but accepts every known one", () => {
    expect(fieldsWithErrors({ ...valid, mood: "grumpy" })).toEqual(["mood"]);
    expect(validateEntry({ ...valid, mood: "upset_stomach" }).ok).toBe(true);
  });

  it("rejects impossible dates and bad timestamps", () => {
    expect(fieldsWithErrors({ ...valid, date: "2026-02-30" })).toEqual(["date"]);
    expect(fieldsWithErrors({ ...valid, createdAt: "yesterday" })).toEqual(["createdAt"]);
  });

  it("rejects wrong types for optional fields", () => {
    expect(fieldsWithErrors({ ...valid, tags: "a,b" })).toEqual(["tags"]);
    expect(fieldsWithErrors({ ...valid, tags: ["ok", 5] })).toEqual(["tags[1]"]);
    expect(fieldsWithErrors({ ...valid, place: 12 })).toEqual(["place"]);
  });

  it("reports every problem, and rejects non-objects", () => {
    expect(fieldsWithErrors({ id: "", foodName: "", rating: null }).length).toBeGreaterThan(3);
    expect(validateEntry(null).ok).toBe(false);
    expect(validateEntry([]).ok).toBe(false);
  });
});

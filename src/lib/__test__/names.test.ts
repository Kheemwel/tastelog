import { deriveNames, suggest } from "../names";
import { makeEntry } from "../testHelpers";

describe("deriveNames", () => {
  it("groups foods ignoring case and uses the newest spelling", () => {
    const entries = [makeEntry({ foodName: "Ramen" }), makeEntry({ foodName: "ramen" }), makeEntry({ foodName: "Adobo" }), makeEntry({ foodName: "RAMEN" })];
    expect(deriveNames(entries, "food")).toEqual([
      { key: "ramen", name: "RAMEN", count: 3 },
      { key: "adobo", name: "Adobo", count: 1 },
    ]);
  });

  it("skips entries without a place", () => {
    const entries = [makeEntry({ place: "Ichiran" }), makeEntry({ place: "ICHIRAN" }), makeEntry({}), makeEntry({ place: "Mcdo" })];
    expect(deriveNames(entries, "place")).toEqual([
      { key: "ichiran", name: "ICHIRAN", count: 2 },
      { key: "mcdo", name: "Mcdo", count: 1 },
    ]);
  });

  it("counts each tag once per entry", () => {
    const entries = [makeEntry({ tags: ["noodles", "Street Food"] }), makeEntry({ tags: ["street food"] })];
    expect(deriveNames(entries, "tag")).toEqual([
      { key: "street food", name: "street food", count: 2 },
      { key: "noodles", name: "noodles", count: 1 },
    ]);
  });
});

describe("suggest", () => {
  const entries = [
    makeEntry({ foodName: "Ramen" }),
    makeEntry({ foodName: "Ramen" }),
    makeEntry({ foodName: "Rice bowl" }),
    makeEntry({ foodName: "Fried rice" }),
    makeEntry({ foodName: "Adobo" }),
  ];

  it("lists names starting with the text before names containing it", () => {
    expect(suggest(entries, "food", "ri").map((n) => n.name)).toEqual(["Rice bowl", "Fried rice"]);
  });

  it("ignores case and spacing in what was typed", () => {
    expect(suggest(entries, "food", "  RAM ").map((n) => n.name)).toEqual(["Ramen"]);
  });

  it("returns the most used names when nothing is typed, and respects the limit", () => {
    expect(suggest(entries, "food", "", 2).map((n) => n.name)).toEqual(["Ramen", "Adobo"]);
  });

  it("returns nothing when nothing matches", () => {
    expect(suggest(entries, "food", "pizza")).toEqual([]);
  });
});

import { buildExportFile, exportFileName, mergeEntries, parseImport, serializeExport } from "../importExport";
import { Entry } from "../types";

const entry = (id: string, overrides: Partial<Entry> = {}): Entry => ({
  id,
  foodName: "Ramen",
  rating: 8,
  mood: "happy",
  date: "2026-10-14",
  tags: [],
  createdAt: "2026-10-14T03:00:00.000Z",
  ...overrides,
});

const fileWith = (entries: unknown[], extra: object = {}) => JSON.stringify({ app: "tastelog", version: 1, exportedAt: "x", entries, ...extra });

describe("export then import", () => {
  it("round-trips entries unchanged", () => {
    const entries = [entry("a", { place: "Ichiran", comment: "great", tags: ["noodles"] }), entry("b")];
    const text = serializeExport(buildExportFile(entries, new Date(2026, 9, 14)));
    const parsed = parseImport(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.file.entries).toEqual(entries);
  });

  it("names files by local date", () => {
    expect(exportFileName(new Date(2026, 9, 14, 0, 30))).toBe("tastelog-2026-10-14.json");
  });
});

describe("parseImport rejects bad files without partial results", () => {
  const error = (text: string) => {
    const r = parseImport(text);
    return r.ok ? null : r.error;
  };

  it("not JSON", () => expect(error("hello")).toMatch(/not valid JSON/));
  it("wrong shape", () => {
    expect(error("[]")).toMatch(/not a Tastelog/);
    expect(error('{"app":"other"}')).toMatch(/not a Tastelog/);
  });
  it("missing, newer, or unknown version", () => {
    expect(error('{"app":"tastelog"}')).toMatch(/no version/);
    expect(error(fileWith([], { version: 2 }))).toMatch(/newer version/);
    expect(error(fileWith([], { version: 0 }))).toMatch(/Unsupported/);
  });
  it("missing entries list", () => {
    expect(error('{"app":"tastelog","version":1}')).toMatch(/no entries/);
  });
  it("one invalid entry rejects the whole file and names it", () => {
    const bad = { ...entry("b"), rating: 11 };
    expect(error(fileWith([entry("a"), bad]))).toMatch(/Entry 2: Rating/);
  });
  it("duplicate ids inside the file", () => {
    expect(error(fileWith([entry("a"), entry("a")]))).toMatch(/Entry 2: duplicate id/);
  });
  it("accepts a file that starts with a BOM", () => {
    expect(parseImport("\uFEFF" + fileWith([entry("a")])).ok).toBe(true);
  });
  it("accepts an empty entries list", () => {
    expect(parseImport(fileWith([])).ok).toBe(true);
  });
});

describe("mergeEntries", () => {
  it("adds new ids and skips existing ones", () => {
    const current = [entry("a"), entry("b")];
    const result = mergeEntries(current, [entry("b"), entry("c")]);
    expect(result.entries.map((e) => e.id)).toEqual(["a", "b", "c"]);
    expect(result.added).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it("importing the same backup twice changes nothing the second time", () => {
    const backup = [entry("a"), entry("b")];
    const once = mergeEntries([], backup);
    const twice = mergeEntries(once.entries, backup);
    expect(twice.entries).toEqual(once.entries);
    expect(twice.added).toBe(0);
    expect(twice.skipped).toBe(2);
  });

  it("keeps the local copy when ids clash", () => {
    const result = mergeEntries([entry("a", { rating: 3 })], [entry("a", { rating: 9 })]);
    expect(result.entries[0].rating).toBe(3);
  });
});

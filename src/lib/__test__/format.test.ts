import { formatAverage, formatMonth, pluralEntries } from "../format";

describe("formatMonth", () => {
  it("shortens a year-month", () => {
    expect(formatMonth("2026-10")).toBe("Oct 26");
    expect(formatMonth("2027-01")).toBe("Jan 27");
  });
});

describe("formatAverage", () => {
  it("always shows one decimal", () => {
    expect(formatAverage(9)).toBe("9.0");
    expect(formatAverage(8.5)).toBe("8.5");
  });
});

describe("pluralEntries", () => {
  it("handles one and many", () => {
    expect(pluralEntries(0)).toBe("0 entries");
    expect(pluralEntries(1)).toBe("1 entry");
    expect(pluralEntries(12)).toBe("12 entries");
  });
});

import { isValidDateString, matchKey, toLocalDateString } from "../keys";

describe("matchKey", () => {
  it("ignores case, outer spaces, and repeated spaces", () => {
    expect(matchKey("Mcdo")).toBe("mcdo");
    expect(matchKey("  MCDO ")).toBe("mcdo");
    expect(matchKey("Street   Food")).toBe("street food");
  });

  it("does not merge different words", () => {
    expect(matchKey("Mcdo")).not.toBe(matchKey("McDonald's"));
  });

  it("returns an empty string for blank text", () => {
    expect(matchKey("   ")).toBe("");
  });
});

describe("toLocalDateString", () => {
  it("uses local year, month and day (run with TZ=Asia/Manila to see why)", () => {
    // 00:30 local time. In UTC+8 the UTC date is the day before,
    // so toISOString().slice(0, 10) would give the wrong day here.
    expect(toLocalDateString(new Date(2026, 9, 14, 0, 30))).toBe("2026-10-14");
    expect(toLocalDateString(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});

describe("isValidDateString", () => {
  it("accepts real dates", () => {
    expect(isValidDateString("2026-10-14")).toBe(true);
    expect(isValidDateString("2028-02-29")).toBe(true);
  });

  it("rejects impossible or badly formatted dates", () => {
    expect(isValidDateString("2026-02-29")).toBe(false);
    expect(isValidDateString("2026-13-01")).toBe(false);
    expect(isValidDateString("2026-1-1")).toBe(false);
    expect(isValidDateString("2026-10-14T10:00:00Z")).toBe(false);
    expect(isValidDateString("")).toBe(false);
  });
});

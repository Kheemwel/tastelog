/**
 * Hidden key used to compare food, place, and tag text:
 * trim, collapse repeated whitespace, lowercase.
 * "Mcdo", "mcdo " and "MCDO" all give "mcdo". It is never shown to the user.
 */
export function matchKey(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Local "YYYY-MM-DD". Do NOT use toISOString().slice(0, 10) for this: it returns
 * the UTC date, which is "yesterday" for part of the day in zones like UTC+8.
 */
export function toLocalDateString(date: Date): string {
  const y = String(date.getFullYear()).padStart(4, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isValidDateString(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const check = new Date(Date.UTC(y, m - 1, d));
  return check.getUTCFullYear() === y && check.getUTCMonth() === m - 1 && check.getUTCDate() === d;
}

import { isValidDateString, matchKey } from "./keys";
import { DEFAULT_MOOD, isMoodKey } from "./moods";
import { RATING_MAX, RATING_MIN, type Entry } from "./types";

export type FieldError = { field: string; message: string };
export type ValidationResult = { ok: true; entry: Entry } | { ok: false; errors: FieldError[] };

// Optional text: missing/blank becomes undefined, anything that is not text is an error.
function cleanText(value: unknown, field: string, errors: FieldError[]): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    errors.push({ field, message: `${field} must be text.` });
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * Checks raw data (a form submission or an imported entry) and returns a clean Entry.
 * Trims text, drops blank optional fields, removes duplicate tags (by match key),
 * defaults a missing mood to "unsure". The form must supply id and createdAt itself.
 */
export function validateEntry(raw: unknown): ValidationResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: [{ field: "entry", message: "Entry must be an object." }] };
  }
  const r = raw as Record<string, unknown>;
  const errors: FieldError[] = [];

  const id = typeof r.id === "string" ? r.id.trim() : "";
  if (id === "") errors.push({ field: "id", message: "id is required." });

  const foodName = cleanText(r.foodName, "foodName", errors);
  if (foodName === undefined && !errors.some((e) => e.field === "foodName")) {
    errors.push({ field: "foodName", message: "Food name is required." });
  }

  const rating = r.rating;
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < RATING_MIN || rating > RATING_MAX) {
    errors.push({
      field: "rating",
      message: `Rating must be a whole number from ${RATING_MIN} to ${RATING_MAX}.`,
    });
  }

  let mood = DEFAULT_MOOD;
  if (r.mood !== undefined && r.mood !== null) {
    if (isMoodKey(r.mood)) mood = r.mood;
    else errors.push({ field: "mood", message: "Unknown mood." });
  }

  const comment = cleanText(r.comment, "comment", errors);
  const place = cleanText(r.place, "place", errors);

  if (typeof r.date !== "string" || !isValidDateString(r.date)) {
    errors.push({ field: "date", message: "Date must be a real date like 2026-10-14." });
  }

  if (typeof r.createdAt !== "string" || Number.isNaN(Date.parse(r.createdAt))) {
    errors.push({ field: "createdAt", message: "createdAt must be a timestamp." });
  }

  const tags: string[] = [];
  if (r.tags !== undefined && r.tags !== null) {
    if (!Array.isArray(r.tags)) {
      errors.push({ field: "tags", message: "Tags must be a list." });
    } else {
      const seen = new Set<string>();
      r.tags.forEach((tag: unknown, i: number) => {
        if (typeof tag !== "string") {
          errors.push({ field: `tags[${i}]`, message: "Each tag must be text." });
          return;
        }
        const trimmed = tag.trim();
        const key = matchKey(trimmed);
        if (key === "" || seen.has(key)) return;
        seen.add(key);
        tags.push(trimmed);
      });
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  const entry: Entry = {
    id,
    foodName: foodName as string,
    rating: rating as number,
    mood,
    date: r.date as string,
    tags,
    createdAt: r.createdAt as string,
  };
  if (comment !== undefined) entry.comment = comment;
  if (place !== undefined) entry.place = place;
  return { ok: true, entry };
}

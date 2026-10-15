import type { MoodKey } from "./moods";

export const RATING_MIN = 0;
export const RATING_MAX = 10;

export type Entry = {
  id: string; // UUID, unique
  foodName: string; // trimmed, never empty
  rating: number; // whole number, RATING_MIN..RATING_MAX
  mood: MoodKey;
  comment?: string; // omitted when empty
  place?: string; // omitted when empty
  date: string; // local "YYYY-MM-DD"
  tags: string[]; // trimmed, no duplicates (by match key), may be empty
  createdAt: string; // ISO timestamp (UTC), only used to order entries within a day
};

// The mood list is final. Keys are stored in entries and export files,
// so never rename or remove one once real data exists.
export const MOODS = [
  { key: "happy", emoji: "😄", label: "Happy" },
  { key: "energized", emoji: "⚡", label: "Energized" },
  { key: "comforted", emoji: "😌", label: "Comforted" },
  { key: "neutral", emoji: "😐", label: "Neutral" },
  { key: "sluggish", emoji: "😴", label: "Sluggish" },
  { key: "stressed", emoji: "😣", label: "Stressed" },
  { key: "sad", emoji: "😢", label: "Sad" },
  { key: "disappointed", emoji: "😞", label: "Disappointed" },
  { key: "disgusted", emoji: "🤮", label: "Disgusted" },
  { key: "upset_stomach", emoji: "🤢", label: "Upset stomach" },
  { key: "unsure", emoji: "🤔", label: "Unsure" },
] as const;

export type Mood = (typeof MOODS)[number];
export type MoodKey = Mood["key"];

export const DEFAULT_MOOD: MoodKey = "unsure";

const BY_KEY = Object.fromEntries(MOODS.map((m) => [m.key, m])) as Record<MoodKey, Mood>;

export function isMoodKey(value: unknown): value is MoodKey {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(BY_KEY, value);
}

export function getMood(key: MoodKey): Mood {
  return BY_KEY[key];
}

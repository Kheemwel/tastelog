import { matchKey } from "./keys";
import type { NameKind } from "./names";
import type { Entry } from "./types";

export type RenameResult = { ok: true; entries: Entry[]; changed: number } | { ok: false; error: string };

// Renames matching tags and drops any duplicate the rename creates inside one entry.
function renameTags(tags: string[], fromKey: string, newName: string): string[] {
  const newKey = matchKey(newName);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const tag of tags) {
    const key = matchKey(tag);
    const isTarget = key === fromKey;
    const outKey = isTarget ? newKey : key;
    if (seen.has(outKey)) continue;
    seen.add(outKey);
    out.push(isTarget ? newName : tag);
  }
  return out;
}

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((value, i) => value === b[i]);

/**
 * Renames every entry whose food/place/tag matches `from` (ignoring case and spacing).
 * If `to` matches another existing name, the two become one, which is how typos get merged.
 * Returns new entries; the input is not modified. Save with store.replaceAll(result.entries).
 */
export function renameValue(entries: Entry[], kind: NameKind, from: string, to: string): RenameResult {
  const newName = to.trim();
  const fromKey = matchKey(from);
  if (fromKey === "") return { ok: false, error: "Pick the name to rename." };
  if (newName === "") return { ok: false, error: "The new name cannot be empty." };

  let changed = 0;
  const result = entries.map((entry) => {
    let updated = entry;
    if (kind === "food") {
      if (matchKey(entry.foodName) === fromKey && entry.foodName !== newName) {
        updated = { ...entry, foodName: newName };
      }
    } else if (kind === "place") {
      if (entry.place !== undefined && matchKey(entry.place) === fromKey && entry.place !== newName) {
        updated = { ...entry, place: newName };
      }
    } else if (entry.tags.some((t) => matchKey(t) === fromKey)) {
      const tags = renameTags(entry.tags, fromKey, newName);
      if (!sameList(tags, entry.tags)) updated = { ...entry, tags };
    }
    if (updated !== entry) changed++;
    return updated;
  });
  return { ok: true, entries: result, changed };
}

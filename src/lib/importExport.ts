import { toLocalDateString } from "./keys";
import type { Entry } from "./types";
import { validateEntry } from "./validation";

export const EXPORT_APP = "tastelog";
export const EXPORT_VERSION = 1;

export type ExportFile = {
  app: typeof EXPORT_APP;
  version: number;
  exportedAt: string;
  entries: Entry[];
};

export function buildExportFile(entries: Entry[], now: Date): ExportFile {
  return { app: EXPORT_APP, version: EXPORT_VERSION, exportedAt: now.toISOString(), entries };
}

export function serializeExport(file: ExportFile): string {
  return JSON.stringify(file, null, 2);
}

/** e.g. tastelog-2026-10-14.json (uses the local date) */
export function exportFileName(now: Date): string {
  return `tastelog-${toLocalDateString(now)}.json`;
}

export type ParseResult = { ok: true; file: ExportFile } | { ok: false; error: string };

/**
 * Validate first, write second: this either returns a fully clean file or a
 * single error message. The caller must not touch stored data unless ok is true.
 */
export function parseImport(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text.replace(/^\uFEFF/, "")); // some editors add a BOM
  } catch {
    return { ok: false, error: "This file is not valid JSON." };
  }

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: false, error: "This is not a Tastelog export file." };
  }
  const obj = data as Record<string, unknown>;

  if (obj.app !== EXPORT_APP) {
    return { ok: false, error: "This is not a Tastelog export file." };
  }
  if (typeof obj.version !== "number") {
    return { ok: false, error: "The file has no version number." };
  }
  if (obj.version > EXPORT_VERSION) {
    return { ok: false, error: "This file was made by a newer version of Tastelog." };
  }
  if (obj.version !== EXPORT_VERSION) {
    return { ok: false, error: `Unsupported file version: ${obj.version}.` };
  }
  if (!Array.isArray(obj.entries)) {
    return { ok: false, error: "The file has no entries list." };
  }

  const entries: Entry[] = [];
  const seenIds = new Set<string>();
  for (let i = 0; i < obj.entries.length; i++) {
    const result = validateEntry(obj.entries[i]);
    if (!result.ok) {
      const first = result.errors[0];
      return { ok: false, error: `Entry ${i + 1}: ${first.message}` };
    }
    if (seenIds.has(result.entry.id)) {
      return { ok: false, error: `Entry ${i + 1}: duplicate id.` };
    }
    seenIds.add(result.entry.id);
    entries.push(result.entry);
  }

  const exportedAt = typeof obj.exportedAt === "string" ? obj.exportedAt : "";
  return { ok: true, file: { app: EXPORT_APP, version: EXPORT_VERSION, exportedAt, entries } };
}

/** Merge = add incoming entries whose id is not already present; skip the rest. */
export function mergeEntries(current: Entry[], incoming: Entry[]): { entries: Entry[]; added: number; skipped: number } {
  const have = new Set(current.map((e) => e.id));
  const fresh = incoming.filter((e) => !have.has(e.id));
  return {
    entries: [...current, ...fresh],
    added: fresh.length,
    skipped: incoming.length - fresh.length,
  };
}

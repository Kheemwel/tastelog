import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Entry } from "../lib/types";
import { entryStore } from "../storage";

type EntriesContextValue = {
  entries: Entry[];
  loading: boolean;
  error: string | null;
  saveEntry: (entry: Entry) => Promise<void>; // add or update (by id)
  deleteEntry: (id: string) => Promise<void>;
  replaceAll: (entries: Entry[]) => Promise<void>; // for import and rename
};

const EntriesContext = createContext<EntriesContextValue | null>(null);

export function EntriesProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    entryStore.getAll().then(
      (all) => {
        if (cancelled) return;
        setEntries(all);
        setLoading(false);
      },
      () => {
        if (cancelled) return;
        setError("Could not read your saved entries.");
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // The store is written first; the screen list only changes after the save succeeded.
  const saveEntry = async (entry: Entry) => {
    await entryStore.upsert(entry);
    setEntries((prev) => (prev.some((e) => e.id === entry.id) ? prev.map((e) => (e.id === entry.id ? entry : e)) : [...prev, entry]));
  };

  const deleteEntry = async (id: string) => {
    await entryStore.remove(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const replaceAll = async (next: Entry[]) => {
    await entryStore.replaceAll(next);
    setEntries(next);
  };

  return <EntriesContext.Provider value={{ entries, loading, error, saveEntry, deleteEntry, replaceAll }}>{children}</EntriesContext.Provider>;
}

export function useEntries(): EntriesContextValue {
  const value = useContext(EntriesContext);
  if (!value) throw new Error("useEntries must be used inside <EntriesProvider>.");
  return value;
}

import { createContext, useContext, useState, type ReactNode } from "react";
import { NO_FILTERS, type Filters } from "../lib/query";

type FiltersContextValue = {
  filters: Filters;
  setFilters: (filters: Filters) => void;
};

const FiltersContext = createContext<FiltersContextValue | null>(null);

// Holds the active filters so the Journal and the Filters screen share them.
export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  return <FiltersContext.Provider value={{ filters, setFilters }}>{children}</FiltersContext.Provider>;
}

export function useFilters(): FiltersContextValue {
  const value = useContext(FiltersContext);
  if (!value) throw new Error("useFilters must be used inside <FiltersProvider>.");
  return value;
}

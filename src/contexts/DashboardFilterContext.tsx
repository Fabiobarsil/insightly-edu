import React, { createContext, useContext, useState, useCallback } from "react";

interface FilterState {
  anoLetivo: string;
  serie: string;
  turma: string;
}

interface DashboardFilterContextType {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  isLoading: boolean;
}

const DashboardFilterContext = createContext<DashboardFilterContextType | null>(null);

export const useDashboardFilter = () => {
  const ctx = useContext(DashboardFilterContext);
  if (!ctx) throw new Error("useDashboardFilter must be used within DashboardFilterProvider");
  return ctx;
};

export const DashboardFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, _setFilters] = useState<FilterState>({
    anoLetivo: "2024",
    serie: "all",
    turma: "all",
  });
  const [isLoading, setIsLoading] = useState(false);

  const setFilters = useCallback((newFilters: FilterState) => {
    setIsLoading(true);
    _setFilters(newFilters);
    setTimeout(() => setIsLoading(false), 800);
  }, []);

  return (
    <DashboardFilterContext.Provider value={{ filters, setFilters, isLoading }}>
      {children}
    </DashboardFilterContext.Provider>
  );
};

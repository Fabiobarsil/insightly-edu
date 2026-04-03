import { useDashboardFilter } from "@/contexts/DashboardFilterContext";

const FilterBar = () => {
  const { filters, setFilters } = useDashboardFilter();

  const update = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-xs font-bold text-muted uppercase tracking-wider">Filtros:</span>
      <select
        value={filters.anoLetivo}
        onChange={(e) => update("anoLetivo", e.target.value)}
        className="text-sm font-semibold bg-card border border-border/60 rounded-[12px] px-3 py-2 text-primary focus:outline-none focus:border-secondary transition-colors cursor-pointer"
      >
        <option value="2024">2024</option>
        <option value="2023">2023</option>
        <option value="2022">2022</option>
      </select>
      <select
        value={filters.serie}
        onChange={(e) => update("serie", e.target.value)}
        className="text-sm font-semibold bg-card border border-border/60 rounded-[12px] px-3 py-2 text-primary focus:outline-none focus:border-secondary transition-colors cursor-pointer"
      >
        <option value="all">Todas as Séries</option>
        <option value="1">1º Ano</option>
        <option value="2">2º Ano</option>
        <option value="3">3º Ano</option>
        <option value="4">4º Ano</option>
        <option value="5">5º Ano</option>
        <option value="6">6º Ano</option>
      </select>
      <select
        value={filters.turma}
        onChange={(e) => update("turma", e.target.value)}
        className="text-sm font-semibold bg-card border border-border/60 rounded-[12px] px-3 py-2 text-primary focus:outline-none focus:border-secondary transition-colors cursor-pointer"
      >
        <option value="all">Todas as Turmas</option>
        <option value="A">Turma A</option>
        <option value="B">Turma B</option>
        <option value="C">Turma C</option>
        <option value="D">Turma D</option>
      </select>
    </div>
  );
};

export default FilterBar;

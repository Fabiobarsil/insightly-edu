const kpis = [
  {
    label: "Alunos Ativos",
    value: "1.248",
    trend: "+12",
    trendLabel: "este mês",
    icon: "ri-group-line",
    trendUp: true,
    accent: "bg-secondary/10 text-secondary",
  },
  {
    label: "Frequência Média",
    value: "94,2%",
    trend: "+1,3%",
    trendLabel: "vs. mês anterior",
    icon: "ri-calendar-check-line",
    trendUp: true,
    accent: "bg-blue-50 text-blue-600",
  },
  {
    label: "Alunos em Risco",
    value: "23",
    trend: "-5",
    trendLabel: "vs. semana anterior",
    icon: "ri-alert-line",
    trendUp: false,
    accent: "bg-amber-50 text-amber-600",
  },
  {
    label: "Documentos Pendentes",
    value: "47",
    trend: "+8",
    trendLabel: "novos hoje",
    icon: "ri-file-warning-line",
    trendUp: false,
    accent: "bg-red-50 text-red-500",
  },
];

const KpiCards = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
    {kpis.map((kpi) => (
      <div key={kpi.label} className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-lg ${kpi.accent}`}>
            <i className={kpi.icon} />
          </div>
          <span className={`text-xs font-semibold flex items-center gap-1 ${kpi.trendUp ? "text-secondary" : "text-destructive"}`}>
            <i className={kpi.trendUp ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} />
            {kpi.trend}
          </span>
        </div>
        <p className="text-2xl font-bold text-primary">{kpi.value}</p>
        <p className="text-xs text-muted mt-1">{kpi.label}</p>
        <p className="text-[11px] text-muted/60 mt-0.5">{kpi.trendLabel}</p>
      </div>
    ))}
  </div>
);

export default KpiCards;

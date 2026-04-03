const alerts = [
  {
    icon: "ri-error-warning-line",
    iconClass: "bg-red-50 text-red-500",
    title: "Frequência Crítica",
    desc: "8 alunos com frequência abaixo de 75% esta semana.",
    severity: "Crítico",
    severityClass: "bg-red-50 text-red-600",
    trend: "+3 vs. semana anterior",
    trendUp: true,
    trendClass: "text-destructive",
  },
  {
    icon: "ri-file-damage-line",
    iconClass: "bg-amber-50 text-amber-600",
    title: "Documentos Pendentes",
    desc: "47 documentos aguardando envio ou aprovação.",
    severity: "Atenção",
    severityClass: "bg-amber-50 text-amber-700",
    trend: "+8 novos hoje",
    trendUp: true,
    trendClass: "text-amber-600",
  },
  {
    icon: "ri-line-chart-line",
    iconClass: "bg-blue-50 text-blue-600",
    title: "Desempenho em Queda",
    desc: "3 turmas com queda na média das últimas avaliações.",
    severity: "Monitorar",
    severityClass: "bg-blue-50 text-blue-700",
    trend: "-2 vs. mês anterior",
    trendUp: false,
    trendClass: "text-secondary",
  },
];

const Alerts = () => (
  <div className="flex flex-col gap-4">
    <h3 className="text-base font-bold text-primary">Alertas</h3>
    {alerts.map((alert, i) => (
      <div key={i} className="bg-card border border-border/60 rounded-xl p-5 certus-shadow transition-all duration-200 hover:shadow-md hover:border-border">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-lg shrink-0 ${alert.iconClass}`}>
            <i className={alert.icon} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-primary">{alert.title}</p>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${alert.severityClass}`}>
                {alert.severity}
              </span>
            </div>
            <p className="text-xs text-muted mb-1.5">{alert.desc}</p>
            <span className={`text-[11px] font-semibold flex items-center gap-1 ${alert.trendClass}`}>
              <i className={alert.trendUp ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} />
              {alert.trend}
            </span>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default Alerts;

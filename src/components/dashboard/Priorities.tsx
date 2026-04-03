import { toast } from "sonner";

const priorities = [
  {
    icon: "ri-user-unfollow-line",
    iconClass: "bg-red-50 text-red-500",
    name: "Lucas Mendes — 3ºB",
    desc: "Frequência abaixo de 70% nos últimos 15 dias",
    status: "Crítico",
    statusClass: "bg-red-50 text-red-600",
    urgency: "border-l-red-500",
  },
  {
    icon: "ri-file-warning-line",
    iconClass: "bg-amber-50 text-amber-600",
    name: "Maria Clara — 2ºA",
    desc: "Faltam 3 documentos obrigatórios",
    status: "Pendente",
    statusClass: "bg-amber-50 text-amber-700",
    urgency: "border-l-amber-500",
  },
  {
    icon: "ri-bar-chart-box-line",
    iconClass: "bg-blue-50 text-blue-600",
    name: "Turma 5ºC",
    desc: "Média geral abaixo de 5.0 em Matemática",
    status: "Atenção",
    statusClass: "bg-amber-50 text-amber-700",
    urgency: "border-l-amber-400",
  },
  {
    icon: "ri-edit-line",
    iconClass: "bg-purple-50 text-purple-600",
    name: "João Pedro — 1ºD",
    desc: "Cadastro incompleto — falta responsável",
    status: "Incompleto",
    statusClass: "bg-muted/20 text-muted",
    urgency: "border-l-border",
  },
];

const Priorities = () => (
  <div className="bg-card border border-border/60 rounded-xl p-6 certus-shadow">
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-base font-bold text-primary">Prioridades de Hoje</h3>
      <span className="text-xs font-semibold text-muted bg-accent px-2.5 py-1 rounded-full">
        {priorities.length} itens
      </span>
    </div>
    <div className="flex flex-col gap-3">
      {priorities.map((item, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 p-3 rounded-[12px] border border-border/40 border-l-[3px] ${item.urgency} hover:border-secondary/30 transition-all duration-200 hover:shadow-sm group`}
        >
          <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-base shrink-0 ${item.iconClass}`}>
            <i className={item.icon} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary truncate">{item.name}</p>
            <p className="text-xs text-muted truncate">{item.desc}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${item.statusClass}`}>
              {item.status}
            </span>
            <div className="hidden group-hover:flex items-center gap-1.5 animate-in fade-in-0 duration-200">
              <button
                onClick={() => toast.info(`Visualizando: ${item.name}`)}
                className="text-[11px] font-bold px-2 py-1 rounded-lg border border-border text-primary hover:bg-accent transition-colors"
              >
                Ver
              </button>
              <button
                onClick={() => toast.success(`Resolvendo: ${item.name}`)}
                className="text-[11px] font-bold px-2 py-1 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
              >
                Resolver
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="flex gap-3 mt-5">
      <button
        onClick={() => toast.info("Ver todas as prioridades")}
        className="flex-1 py-2.5 rounded-[12px] border border-border text-sm font-bold text-primary hover:bg-accent transition-colors active:scale-[0.98]"
      >
        Ver tudo
      </button>
      <button
        onClick={() => toast.success("Resolvendo prioridades...")}
        className="flex-1 py-2.5 rounded-[12px] bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/90 transition-colors active:scale-[0.98]"
      >
        Resolver agora
      </button>
    </div>
  </div>
);

export default Priorities;

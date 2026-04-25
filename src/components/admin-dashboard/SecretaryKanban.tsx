import { Clock, PlayCircle, CheckCircle2 } from "lucide-react";

const COLUMNS = [
  {
    id: "pendentes",
    title: "Pendentes",
    icon: Clock,
    accent: "border-t-amber-500",
    iconClass: "bg-amber-500/10 text-amber-600",
  },
  {
    id: "em_andamento",
    title: "Em andamento",
    icon: PlayCircle,
    accent: "border-t-primary",
    iconClass: "bg-primary/10 text-primary",
  },
  {
    id: "concluidos",
    title: "Concluídos",
    icon: CheckCircle2,
    accent: "border-t-secondary",
    iconClass: "bg-secondary/15 text-secondary",
  },
] as const;

/**
 * Kanban operacional da Secretaria.
 * Estrutura visual pronta para receber dados da view `secretaria_demands`.
 * Sem dados mockados — colunas exibem estado vazio até integração.
 */
const SecretaryKanban = () => {
  return (
    <section className="bg-card border border-border/60 rounded-xl p-5 shadow-sm">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Fila operacional</h3>
          <p className="text-xs text-muted-foreground">
            Demandas da secretaria organizadas por status
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const Icon = col.icon;
          return (
            <div
              key={col.id}
              className={`bg-muted/30 border border-border/50 border-t-4 ${col.accent} rounded-lg flex flex-col min-h-[320px]`}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-md flex items-center justify-center ${col.iconClass}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <h4 className="text-sm font-semibold text-foreground">{col.title}</h4>
                </div>
                <span className="text-xs font-medium text-muted-foreground tabular-nums">0</span>
              </div>

              <div className="flex-1 flex flex-col gap-2 p-3">
                {/* Cards reais virão da view `secretaria_demands` */}
                <div className="flex-1 flex items-center justify-center text-center px-2 py-8">
                  <p className="text-xs text-muted-foreground/70">
                    Nenhuma demanda nesta coluna
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default SecretaryKanban;

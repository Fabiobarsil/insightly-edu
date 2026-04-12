import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CheckCircle2, X } from "lucide-react";

interface PriorityItem {
  id: string;
  icon: string;
  iconClass: string;
  name: string;
  desc: string;
  status: "critico" | "pendente" | "atencao";
  resolved: boolean;
}

const BADGE: Record<string, string> = {
  critico: "bg-destructive/15 text-destructive",
  pendente: "bg-warning/15 text-warning-foreground",
  atencao: "bg-primary/10 text-primary",
};

const BADGE_LABEL: Record<string, string> = {
  critico: "Crítico",
  pendente: "Pendente",
  atencao: "Atenção",
};

const URGENCY: Record<string, string> = {
  critico: "border-l-destructive",
  pendente: "border-l-warning",
  atencao: "border-l-primary",
};

const initialPriorities: PriorityItem[] = [
  { id: "1", icon: "ri-user-unfollow-line", iconClass: "bg-destructive/10 text-destructive", name: "Lucas Ferreira — 4ºC", desc: "Frequência crítica: 68% — abaixo do mínimo", status: "critico", resolved: false },
  { id: "2", icon: "ri-file-warning-line", iconClass: "bg-warning/10 text-warning-foreground", name: "3 documentos pendentes", desc: "RG, Comprovante de residência e Histórico escolar", status: "pendente", resolved: false },
  { id: "3", icon: "ri-bar-chart-box-line", iconClass: "bg-primary/10 text-primary", name: "Turma 3ºA — Média 5.9", desc: "Desempenho abaixo da meta em Matemática", status: "atencao", resolved: false },
  { id: "4", icon: "ri-user-unfollow-line", iconClass: "bg-destructive/10 text-destructive", name: "Mariana Oliveira — 2ºB", desc: "Frequência crítica: 72% — risco de reprovação", status: "critico", resolved: false },
  { id: "5", icon: "ri-file-warning-line", iconClass: "bg-warning/10 text-warning-foreground", name: "Cadastro incompleto", desc: "Gabriel Almeida — falta CPF e responsável", status: "pendente", resolved: false },
];

const OperationalPriorities = () => {
  const [priorities, setPriorities] = useState(initialPriorities);

  const handleResolve = (id: string) => {
    setPriorities((prev) => prev.map((p) => p.id === id ? { ...p, resolved: true } : p));
    toast.success("Prioridade marcada como resolvida");
  };

  const handleRemove = (id: string) => {
    setPriorities((prev) => prev.filter((p) => p.id !== id));
    toast("Item removido da lista");
  };

  const activePriorities = priorities.filter((p) => !p.resolved);

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">Prioridades de Hoje</h3>
        <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          {activePriorities.length} itens
        </span>
      </div>

      <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto max-h-[360px] pr-1">
        {activePriorities.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">Nenhuma prioridade pendente ✓</p>
        )}
        {activePriorities.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border border-border/40 border-l-[3px] hover:border-border transition-all duration-200 hover:shadow-sm group",
              URGENCY[item.status]
            )}
          >
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0", item.iconClass)}>
              <i className={item.icon} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap", BADGE[item.status])}>
                {BADGE_LABEL[item.status]}
              </span>
              <div className="hidden group-hover:flex items-center gap-1 animate-in fade-in-0 duration-200">
                <button
                  onClick={() => handleResolve(item.id)}
                  className="p-1 rounded-lg hover:bg-secondary/10 text-secondary transition-colors"
                  title="Resolver"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="p-1 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                  title="Remover"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-4 pt-3 border-t border-border/30">
        <button
          onClick={() => toast.info("Ver todas as prioridades")}
          className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-accent transition-colors active:scale-[0.98]"
        >
          Ver tudo
        </button>
        <button
          onClick={() => {
            setPriorities((prev) => prev.map((p) => ({ ...p, resolved: true })));
            toast.success("Todas as prioridades resolvidas!");
          }}
          className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors active:scale-[0.98]"
        >
          Resolver tudo
        </button>
      </div>
    </div>
  );
};

export default OperationalPriorities;

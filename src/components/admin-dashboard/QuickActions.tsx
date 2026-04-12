import { UserPlus, CalendarCheck, PenLine, FileText, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const actions = [
  { icon: UserPlus, label: "Adicionar Aluno" },
  { icon: CalendarCheck, label: "Registrar Frequência" },
  { icon: PenLine, label: "Lançar Notas" },
  { icon: FileText, label: "Solicitar Documentos" },
  { icon: BarChart3, label: "Gerar Relatório" },
];

const QuickActions = () => (
  <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-sm">
    <h3 className="text-sm font-bold text-foreground mb-4">Ações Rápidas</h3>
    <div className="flex flex-wrap gap-3">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={() => toast.info(`Ação: ${a.label}`)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 active:scale-[0.97] hover:shadow-sm"
        >
          <a.icon className="h-4 w-4" />
          {a.label}
        </button>
      ))}
    </div>
  </div>
);

export default QuickActions;

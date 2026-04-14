import { ClipboardList, FileText, FilePlus2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickActionsProps {
  onNewRequest?: () => void;
}

const QuickActions = ({ onNewRequest }: QuickActionsProps) => {
  const navigate = useNavigate();

  const actions = [
    { icon: FilePlus2, label: "Nova Solicitação", to: null, onClick: onNewRequest },
    { icon: ClipboardList, label: "Nova Matrícula", to: "/admin/alunos/novo" },
    { icon: FileText, label: "Novo Documento", to: "/admin/documentos" },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-sm">
      <h3 className="text-sm font-bold text-foreground mb-4">Ações Rápidas</h3>
      <div className="flex flex-wrap gap-3">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => a.onClick ? a.onClick() : a.to ? navigate(a.to) : null}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 active:scale-[0.97] hover:shadow-sm"
          >
            <a.icon className="h-4 w-4" />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;

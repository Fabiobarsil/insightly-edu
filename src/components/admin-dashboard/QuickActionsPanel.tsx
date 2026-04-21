import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilePlus2, UserPlus, Users, FileText, BarChart3 } from "lucide-react";
import StudentSearchModal from "./StudentSearchModal";

interface QuickActionsPanelProps {
  onNewRequest?: () => void;
}

const QuickActionsPanel = ({ onNewRequest }: QuickActionsPanelProps) => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  const actions = [
    {
      icon: FilePlus2,
      label: "Nova Solicitação",
      desc: "Criar demanda na fila",
      color: "bg-primary text-primary-foreground hover:bg-primary/90",
      onClick: () => onNewRequest?.(),
      primary: true,
    },
    {
      icon: UserPlus,
      label: "Nova Matrícula",
      desc: "Cadastrar novo aluno",
      color: "bg-card border border-border hover:bg-accent text-foreground",
      onClick: () => navigate("/admin/alunos/novo"),
    },
    {
      icon: Users,
      label: "Gerenciar Alunos",
      desc: "Buscar e editar fichas",
      color: "bg-card border border-border hover:bg-accent text-foreground",
      onClick: () => setSearchOpen(true),
    },
    {
      icon: FileText,
      label: "Novo Documento",
      desc: "Emitir ou solicitar",
      color: "bg-card border border-border hover:bg-accent text-foreground",
      onClick: () => navigate("/admin/documentos"),
    },
  ];

  return (
    <>
      <aside>
        <div className="bg-gradient-to-br from-primary/5 via-card to-card border border-primary/20 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">⚡ Ações Rápidas</h3>
          </div>

          <div className="flex flex-col gap-2.5">
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-all duration-200 active:scale-[0.98] ${a.color} ${a.primary ? "shadow-sm" : ""}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.primary ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"}`}>
                  <a.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-tight">{a.label}</p>
                  <p className={`text-[11px] mt-0.5 leading-tight ${a.primary ? "opacity-80" : "text-muted-foreground"}`}>
                    {a.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border/40">
            <button
              onClick={() => navigate("/admin/indicadores")}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Ver indicadores e gráficos
            </button>
          </div>
        </div>
      </aside>

      <StudentSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};

export default QuickActionsPanel;

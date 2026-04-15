import { useNavigate } from "react-router-dom";
import { FileText, Compass, Users, FolderOpen } from "lucide-react";

const cards = [
  {
    icon: FileText,
    title: "Secretaria",
    desc: "Gestão administrativa e matrículas",
    iconColor: "text-primary bg-primary/10",
    action: null,
  },
  {
    icon: Compass,
    title: "Coordenação Pedagógica",
    desc: "Desempenho, alertas e intervenções",
    iconColor: "text-violet-600 bg-violet-500/10",
    action: "/admin/coordenacao",
  },
  {
    icon: Users,
    title: "Professores",
    desc: "Lançamentos rápidos e acompanhamento",
    iconColor: "text-emerald-600 bg-emerald-500/10",
    action: "/admin/professores",
  },
  {
    icon: FolderOpen,
    title: "Documentos",
    desc: "Arquivos e registros escolares",
    iconColor: "text-amber-600 bg-amber-500/10",
    action: "/admin/documentos",
  },
];

const QuickAccessCards = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-[900px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map((card) => (
        <button
          key={card.title}
          onClick={() => card.action && navigate(card.action)}
          className={`group flex items-center gap-3 p-4 rounded-xl bg-card border border-border/40 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] ${!card.action ? "ring-1 ring-primary/20" : ""}`}
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${card.iconColor}`}>
            <card.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-foreground leading-tight truncate">{card.title}</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5 leading-tight truncate">{card.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default QuickAccessCards;

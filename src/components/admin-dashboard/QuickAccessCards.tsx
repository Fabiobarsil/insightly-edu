import { useNavigate } from "react-router-dom";
import { FileText, Compass, Users, FolderOpen } from "lucide-react";

const cards = [
  {
    icon: FileText,
    title: "Secretaria",
    desc: "Gestão administrativa e matrículas",
    color: "from-primary/10 to-primary/5 border-primary/20",
    iconColor: "text-primary bg-primary/15",
    action: null,
  },
  {
    icon: Compass,
    title: "Coordenação Pedagógica",
    desc: "Desempenho, alertas e intervenções",
    color: "from-violet-500/10 to-violet-500/5 border-violet-500/20",
    iconColor: "text-violet-600 bg-violet-500/15",
    action: "/admin/coordenacao",
  },
  {
    icon: Users,
    title: "Professores",
    desc: "Lançamentos rápidos e acompanhamento",
    color: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    iconColor: "text-emerald-600 bg-emerald-500/15",
    action: "/admin/professores",
  },
  {
    icon: FolderOpen,
    title: "Documentos",
    desc: "Arquivos e registros escolares",
    color: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
    iconColor: "text-amber-600 bg-amber-500/15",
    action: "/admin/documentos",
  },
];

const QuickAccessCards = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cards.map((card) => (
        <button
          key={card.title}
          onClick={() => card.action && navigate(card.action)}
          className={`group relative flex items-center gap-4 p-5 rounded-2xl border bg-gradient-to-br ${card.color} text-left transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] ${!card.action ? "ring-2 ring-primary/30" : ""}`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.iconColor}`}>
            <card.icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">{card.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default QuickAccessCards;

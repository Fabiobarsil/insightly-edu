import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Compass, Users, FolderOpen, ClipboardList, FilePlus2, Plus, UserSearch } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import StudentSearchModal from "./StudentSearchModal";

interface QuickAccessCardsProps {
  onNewRequest?: () => void;
}

const navCards = [
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

const QuickAccessCards = ({ onNewRequest }: QuickAccessCardsProps) => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const drawerActions = [
    { icon: FilePlus2, label: "Nova Solicitação", onClick: () => { setDrawerOpen(false); onNewRequest?.(); } },
    { icon: ClipboardList, label: "Nova Matrícula", onClick: () => { setDrawerOpen(false); navigate("/admin/alunos/novo"); } },
    { icon: UserSearch, label: "Alunos", onClick: () => { setDrawerOpen(false); setSearchOpen(true); } },
    { icon: FileText, label: "Novo Documento", onClick: () => { setDrawerOpen(false); navigate("/admin/documentos"); } },
  ];

  return (
    <>
      <div className="w-full max-w-[900px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Secretaria Hub Card */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="group flex items-center gap-3 p-4 rounded-xl bg-card border border-border/40 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] ring-1 ring-primary/20"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-primary bg-primary/10 relative">
            <FileText className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Plus className="h-2.5 w-2.5" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-foreground leading-tight truncate">Secretaria Digital</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5 leading-tight truncate">Matrículas, solicitações e documentos</p>
          </div>
        </button>

        {/* Navigation Cards */}
        {navCards.map((card) => (
          <button
            key={card.title}
            onClick={() => navigate(card.action)}
            className="group flex items-center gap-3 p-4 rounded-xl bg-card border border-border/40 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
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

      {/* Secretaria Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-[320px] p-5">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-base font-bold text-foreground">Secretaria Digital</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2.5">
            {drawerActions.map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-[10px] bg-accent/50 border border-border/30 text-left text-sm font-medium text-foreground transition-all duration-200 hover:bg-accent active:scale-[0.98]"
              >
                <a.icon className="h-4 w-4 text-muted-foreground" />
                {a.label}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <StudentSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};

export default QuickAccessCards;

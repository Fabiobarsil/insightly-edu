import { useState } from "react";
import { ClipboardList, FileText, FilePlus2, X, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface QuickActionsProps {
  onNewRequest?: () => void;
}

const QuickActions = ({ onNewRequest }: QuickActionsProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const actions = [
    { icon: FilePlus2, label: "Nova Solicitação", to: null, onClick: onNewRequest },
    { icon: ClipboardList, label: "Nova Matrícula", to: "/admin/alunos/novo" },
    { icon: FileText, label: "Novo Documento", to: "/admin/documentos" },
  ];

  const handleAction = (action: typeof actions[0]) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.to) {
      navigate(action.to);
    }
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-semibold border-border/60 hover:border-primary/40 hover:text-primary transition-all"
        >
          <Zap className="h-3.5 w-3.5" />
          Ações
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px] p-5">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-base font-bold text-foreground">Ações Rápidas</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-2.5">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => handleAction(a)}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-[10px] bg-accent/50 border border-border/30 text-left text-sm font-medium text-foreground transition-all duration-200 hover:bg-accent active:scale-[0.98]"
            >
              <a.icon className="h-4 w-4 text-muted-foreground" />
              {a.label}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default QuickActions;

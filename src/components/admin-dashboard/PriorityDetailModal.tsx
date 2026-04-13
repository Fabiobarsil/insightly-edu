import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Mail, MessageCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface PriorityItem {
  id: string;
  icon: string;
  iconClass: string;
  name: string;
  desc: string;
  status: "critico" | "pendente" | "atencao";
  students?: { id: string; name: string; issue: string }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PriorityItem | null;
  onResolve: (id: string) => void;
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

const PriorityDetailModal = ({ open, onOpenChange, item, onResolve }: Props) => {
  const navigate = useNavigate();

  if (!item) return null;

  const students = item.students ?? [
    { id: "mock-1", name: item.name.split("—")[0]?.trim() || item.name, issue: item.desc },
  ];

  const handleWhatsApp = (studentName: string) => {
    const msg = encodeURIComponent(`Olá, gostaríamos de informar sobre uma pendência escolar de ${studentName}.`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const handleEmail = (studentName: string) => {
    const subject = encodeURIComponent(`Pendência escolar — ${studentName}`);
    window.open(`mailto:?subject=${subject}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <i className={cn(item.icon, "text-lg", item.iconClass.split(" ").find(c => c.startsWith("text-")))} />
            {item.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", BADGE[item.status])}>
            {BADGE_LABEL[item.status]}
          </span>
          <span className="text-sm text-muted-foreground">{item.desc}</span>
        </div>

        <div className="flex flex-col gap-3">
          {students.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => { onOpenChange(false); navigate(`/admin/alunos/${s.id}`); }}
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left"
                >
                  {s.name}
                </button>
                <p className="text-xs text-muted-foreground">{s.issue}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  onClick={() => handleEmail(s.name)}
                  className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                  title="Enviar Email"
                >
                  <Mail className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleWhatsApp(s.name)}
                  className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-600 transition-colors"
                  title="Enviar WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-4 pt-3 border-t border-border/30">
          <button
            onClick={() => { onResolve(item.id); onOpenChange(false); toast.success("Prioridade resolvida"); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            Resolver
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-accent transition-colors"
          >
            Fechar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PriorityDetailModal;

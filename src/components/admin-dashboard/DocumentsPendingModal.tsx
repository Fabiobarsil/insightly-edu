import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Mail, MessageCircle, Eye, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface PendingDoc {
  studentId: string;
  studentName: string;
  document: string;
  status: "pendente" | "atrasado";
  dueDate: string;
}

const MOCK_DOCS: PendingDoc[] = [
  { studentId: "mock-1", studentName: "Ana Clara Silva", document: "RG (cópia)", status: "atrasado", dueDate: "2026-04-01" },
  { studentId: "mock-2", studentName: "Pedro Henrique", document: "Comprovante de residência", status: "pendente", dueDate: "2026-04-20" },
  { studentId: "mock-3", studentName: "Julia Santos", document: "Histórico escolar", status: "atrasado", dueDate: "2026-03-15" },
  { studentId: "mock-4", studentName: "Gabriel Almeida", document: "Certidão de nascimento", status: "pendente", dueDate: "2026-04-25" },
  { studentId: "mock-5", studentName: "Mariana Oliveira", document: "Comprovante de vacinação", status: "pendente", dueDate: "2026-04-30" },
  { studentId: "mock-6", studentName: "Lucas Ferreira", document: "Declaração de transferência", status: "atrasado", dueDate: "2026-03-28" },
  { studentId: "mock-7", studentName: "Beatriz Costa", document: "Foto 3x4", status: "pendente", dueDate: "2026-04-22" },
  { studentId: "mock-8", studentName: "Rafael Souza", document: "RG do responsável", status: "atrasado", dueDate: "2026-04-05" },
];

const STATUS_BADGE: Record<string, { class: string; label: string; icon: typeof Clock }> = {
  pendente: { class: "bg-warning/15 text-warning-foreground", label: "Pendente", icon: Clock },
  atrasado: { class: "bg-destructive/15 text-destructive", label: "Atrasado", icon: AlertTriangle },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DocumentsPendingModal = ({ open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const [docs, setDocs] = useState(MOCK_DOCS);
  const [notifyOpen, setNotifyOpen] = useState<string | null>(null);

  const handleWhatsApp = (name: string) => {
    const msg = encodeURIComponent(
      `Olá, identificamos pendência de documentos do aluno ${name}. Por favor, verificar.`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
    toast.success("WhatsApp aberto");
  };

  const handleEmail = (name: string) => {
    const subject = encodeURIComponent(`Pendência documental — ${name}`);
    const body = encodeURIComponent(
      `Olá, identificamos pendência de documentos do aluno ${name}. Por favor, verificar.`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    toast.success("Email aberto");
  };

  const atrasados = docs.filter((d) => d.status === "atrasado").length;
  const pendentes = docs.filter((d) => d.status === "pendente").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📂 Documentos Pendentes
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-3 mb-4">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-destructive/15 text-destructive">
            {atrasados} atrasado{atrasados !== 1 ? "s" : ""}
          </span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-warning/15 text-warning-foreground">
            {pendentes} pendente{pendentes !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex flex-col gap-2.5 overflow-y-auto flex-1 pr-1">
          {docs.map((doc) => {
            const badge = STATUS_BADGE[doc.status];
            const BadgeIcon = badge.icon;
            return (
              <div
                key={`${doc.studentId}-${doc.document}`}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{doc.studentName}</p>
                  <p className="text-xs text-muted-foreground">{doc.document}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1", badge.class)}>
                      <BadgeIcon className="h-3 w-3" />
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Prazo: {new Date(doc.dueDate).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => { onOpenChange(false); navigate(`/admin/alunos/${doc.studentId}`); }}
                    className="p-2 rounded-lg hover:bg-accent text-foreground transition-colors"
                    title="Ver aluno"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setNotifyOpen(notifyOpen === doc.studentId ? null : doc.studentId)}
                    className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                    title="Notificar"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                  {notifyOpen === doc.studentId && (
                    <div className="flex items-center gap-1 animate-in fade-in-0 duration-200">
                      <button
                        onClick={() => handleEmail(doc.studentName)}
                        className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        title="Email"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleWhatsApp(doc.studentName)}
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentsPendingModal;

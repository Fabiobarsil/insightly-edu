import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, FileX, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import DocumentsPendingModal from "./DocumentsPendingModal";

const SmartAlerts = () => {
  const navigate = useNavigate();
  const [docsModalOpen, setDocsModalOpen] = useState(false);

  const alerts = [
    {
      icon: AlertTriangle,
      label: "12 alunos com frequência abaixo de 75%",
      color: "text-destructive",
      bg: "bg-destructive/10",
      badge: "bg-destructive/15 text-destructive",
      count: 12,
      onClick: () => navigate("/admin/frequencia"),
    },
    {
      icon: FileX,
      label: "8 documentos pendentes de envio",
      color: "text-warning-foreground",
      bg: "bg-warning/10",
      badge: "bg-warning/15 text-warning-foreground",
      count: 8,
      onClick: () => setDocsModalOpen(true),
    },
    {
      icon: TrendingDown,
      label: "5 turmas com média abaixo de 6.0",
      color: "text-primary",
      bg: "bg-primary/8",
      badge: "bg-primary/10 text-primary",
      count: 5,
      onClick: () => navigate("/admin/turmas"),
    },
  ];

  return (
    <>
      <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-sm h-full">
        <h3 className="text-sm font-bold text-foreground mb-4">Alertas</h3>
        <div className="flex flex-col gap-3">
          {alerts.map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/50 text-left w-full"
            >
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", a.bg)}>
                <a.icon className={cn("h-4 w-4", a.color)} />
              </div>
              <span className="flex-1 text-sm text-foreground font-medium">{a.label}</span>
              <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", a.badge)}>
                {a.count}
              </span>
            </button>
          ))}
        </div>
      </div>
      <DocumentsPendingModal open={docsModalOpen} onOpenChange={setDocsModalOpen} />
    </>
  );
};

export default SmartAlerts;

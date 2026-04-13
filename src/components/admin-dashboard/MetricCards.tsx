import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, BarChart3, Clock, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import DocumentsPendingModal from "./DocumentsPendingModal";

export interface DashboardMetrics {
  activeStudents: number;
  avgFrequency: number;
  pendingStudents: number;
  pendingDocuments: number;
}

const MetricCards = ({ metrics }: { metrics: DashboardMetrics }) => {
  const navigate = useNavigate();
  const [docsModalOpen, setDocsModalOpen] = useState(false);

  const cards = [
    {
      label: "Alunos Ativos",
      value: metrics.activeStudents,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/8",
      trend: "+3",
      trendUp: true,
      onClick: () => navigate("/admin/alunos"),
    },
    {
      label: "Frequência Média",
      value: `${metrics.avgFrequency}%`,
      icon: BarChart3,
      color: "text-secondary",
      bg: "bg-secondary/10",
      trend: "-2%",
      trendUp: false,
      onClick: () => navigate("/admin/frequencia"),
    },
    {
      label: "Alunos Pendentes",
      value: metrics.pendingStudents,
      icon: Clock,
      color: "text-warning-foreground",
      bg: "bg-warning/15",
      trend: "+5",
      trendUp: false,
      onClick: () => navigate("/admin/alunos?status=incompleto"),
    },
    {
      label: "Documentos Pendentes",
      value: metrics.pendingDocuments,
      icon: FileText,
      color: "text-destructive",
      bg: "bg-destructive/10",
      trend: "-2",
      trendUp: true,
      onClick: () => setDocsModalOpen(true),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={c.onClick}
            className="group relative bg-card rounded-2xl border border-border/50 p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 text-left cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", c.bg)}>
                <c.icon className={cn("h-4 w-4", c.color)} />
              </div>
              <div className={cn(
                "flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full",
                c.trendUp ? "bg-secondary/10 text-secondary" : "bg-destructive/10 text-destructive"
              )}>
                {c.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {c.trend}
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {c.value}
            </p>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              {c.label}
            </p>
          </button>
        ))}
      </div>
      <DocumentsPendingModal open={docsModalOpen} onOpenChange={setDocsModalOpen} />
    </>
  );
};

export default MetricCards;

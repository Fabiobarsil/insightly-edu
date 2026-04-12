import { Users, CheckCircle2, XCircle, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardMetrics {
  total: number;
  approved: number;
  failed: number;
  pending: number;
}

const MetricCards = ({ metrics }: { metrics: DashboardMetrics }) => {
  const rate = metrics.total > 0
    ? ((metrics.approved / metrics.total) * 100).toFixed(1)
    : "0.0";

  const cards = [
    {
      label: "Total de Alunos",
      value: metrics.total,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/8",
    },
    {
      label: "Aprovados",
      value: metrics.approved,
      icon: CheckCircle2,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      label: "Reprovados",
      value: metrics.failed,
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Pendentes",
      value: metrics.pending,
      icon: Clock,
      color: "text-warning-foreground",
      bg: "bg-warning/15",
    },
    {
      label: "Taxa de Aprovação",
      value: `${rate}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="group relative bg-card rounded-2xl border border-border/50 p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        >
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl mb-3", c.bg)}>
            <c.icon className={cn("h-4.5 w-4.5", c.color)} />
          </div>
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {c.value}
          </p>
          <p className="text-xs font-medium text-muted-foreground mt-1">
            {c.label}
          </p>
        </div>
      ))}
    </div>
  );
};

export default MetricCards;

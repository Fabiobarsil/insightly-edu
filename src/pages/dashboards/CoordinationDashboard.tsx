import RoleLayout from "@/components/layout/RoleLayout";
import { AlertTriangle, TrendingDown, ShieldAlert, ClipboardList } from "lucide-react";

const widgets = [
  { icon: AlertTriangle, label: "Alunos em Risco", value: "14", color: "text-destructive", bg: "bg-destructive/10" },
  { icon: TrendingDown, label: "Queda de Desempenho", value: "7", color: "text-warning-foreground", bg: "bg-warning/10" },
  { icon: ShieldAlert, label: "Alertas Automáticos", value: "5", color: "text-primary", bg: "bg-primary/10" },
  { icon: ClipboardList, label: "Intervenções Abertas", value: "3", color: "text-secondary", bg: "bg-secondary/10" },
];

const CoordinationDashboard = () => (
  <RoleLayout title="Coordenação Pedagógica">
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Coordenação Pedagógica</h2>
        <p className="text-sm text-muted-foreground mt-1">Desempenho, alertas e intervenções pedagógicas</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {widgets.map((w) => (
          <div key={w.label} className="bg-card border border-border/50 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className={`w-11 h-11 rounded-xl ${w.bg} flex items-center justify-center`}>
              <w.icon className={`h-5 w-5 ${w.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{w.value}</p>
              <p className="text-xs text-muted-foreground">{w.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-6">
        <p className="text-sm text-muted-foreground">Painel estratégico da coordenação será expandido em breve.</p>
      </div>
    </div>
  </RoleLayout>
);

export default CoordinationDashboard;

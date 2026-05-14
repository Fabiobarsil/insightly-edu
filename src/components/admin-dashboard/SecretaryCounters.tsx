import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { Users, FileWarning, ListTodo, AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSecretariaKanban } from "@/hooks/useSecretariaKanban";

export type CounterFilter = "all" | "students" | "documents" | "queue" | "alerts";

interface Props {
  active: CounterFilter;
  onChange: (f: CounterFilter) => void;
}

/**
 * Cards de KPIs derivados da MESMA fonte do Kanban (secretaria_requests).
 * "Alunos Ativos" continua vindo direto da tabela students.
 * Atualiza em tempo real conforme cards do Kanban mudam de status.
 */
const SecretaryCounters = ({ active, onChange }: Props) => {
  const { schoolId } = useSchoolId();
  const { requests } = useSecretariaKanban();

  const { data: studentsCount = 0 } = useQuery({
    queryKey: ["secretary-counters-students", schoolId],
    queryFn: async () => {
      if (!schoolId) return 0;
      const { count } = await supabase
        .from("students")
        .select("id", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("status", "ativo");
      return count ?? 0;
    },
    enabled: !!schoolId,
  });

  const filaOperacional = requests.filter(
    (r) => r.status === "aberto" || r.status === "em_andamento"
  ).length;
  const documentosPendentes = requests.filter(
    (r) => (r.type ?? "").toLowerCase().includes("document") && r.status !== "concluido"
  ).length;
  const alertasCriticos = requests.filter(
    (r) => r.priority === "alta" && r.status !== "concluido"
  ).length;
  const concluidas = requests.filter((r) => r.status === "concluido").length;
  const totalReqs = filaOperacional + concluidas;
  const completionPct = totalReqs > 0 ? Math.round((concluidas / totalReqs) * 100) : 100;

  const data = {
    students: studentsCount,
    documents: documentosPendentes,
    requests: filaOperacional,
    alerts: alertasCriticos,
    completionPct,
  };

  type Card = {
    key: CounterFilter;
    value: number;
    label: string;
    sub: string;
    icon: any;
    iconWrap: string;
  };

  const cards: Card[] = [
    {
      key: "students",
      value: data.students,
      label: "Alunos Ativos",
      sub: "Total matriculados",
      icon: Users,
      iconWrap: "bg-blue-50 text-blue-600",
    },
    {
      key: "documents",
      value: data.documents,
      label: "Documentos Pendentes",
      sub: "Aguardando assinatura",
      icon: FileWarning,
      iconWrap: "bg-amber-50 text-amber-600",
    },
    {
      key: "queue",
      value: data.requests,
      label: "Fila Operacional",
      sub: "Demandas na fila",
      icon: ListTodo,
      iconWrap: "bg-violet-50 text-violet-600",
    },
    {
      key: "alerts",
      value: data.alerts,
      label: "Alertas Críticos",
      sub: "Requer atenção imediata",
      icon: AlertOctagon,
      iconWrap: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        const isActive = active === c.key;
        return (
          <button
            type="button"
            key={c.key}
            onClick={() => onChange(isActive ? "all" : c.key)}
            className={cn(
              "group text-left rounded-xl border border-border bg-card px-5 py-4 transition-all",
              "hover:border-border/80 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.06)]",
              "focus:outline-none focus:ring-2 focus:ring-ring/40",
              isActive && "ring-2 ring-ring/40 border-ring/40"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
                {c.value}
              </p>
              <span
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  c.iconWrap
                )}
              >
                <Icon className="w-4 h-4" />
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground mt-3">{c.label}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{c.sub}</p>
          </button>
        );
      })}
    </div>
  );
};

export default SecretaryCounters;

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
    (r) => (r.priority === "alta" || r.priority === "urgente") && r.status !== "concluido"
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
    icon: any;
    tone: {
      bg: string;
      border: string;
      value: string;
      iconWrap: string;
      ring: string;
      progressGood: string;
      progressBad: string;
    };
    progress: number;
    progressGood: boolean;
  };

  const cards: Card[] = [
    {
      key: "students",
      value: data.students,
      label: "Alunos Ativos",
      icon: Users,
      tone: {
        bg: "bg-blue-500/10 dark:bg-blue-500/15",
        border: "border-l-blue-600",
        value: "text-blue-700 dark:text-blue-300",
        iconWrap: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
        ring: "ring-blue-500/50",
        progressGood: "bg-blue-600",
        progressBad: "bg-rose-600",
      },
      progress: 100,
      progressGood: true,
    },
    {
      key: "documents",
      value: data.documents,
      label: "Documentos Pendentes",
      icon: FileWarning,
      tone: {
        bg: "bg-amber-500/10 dark:bg-amber-500/15",
        border: "border-l-amber-600",
        value: "text-amber-700 dark:text-amber-300",
        iconWrap: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
        ring: "ring-amber-500/50",
        progressGood: "bg-emerald-500",
        progressBad: "bg-amber-500",
      },
      progress: Math.max(0, 100 - Math.min(100, data.documents * 10)),
      progressGood: data.documents <= 5,
    },
    {
      key: "queue",
      value: data.requests,
      label: "Fila Operacional",
      icon: ListTodo,
      tone: {
        bg: "bg-violet-500/10 dark:bg-violet-500/15",
        border: "border-l-violet-600",
        value: "text-violet-700 dark:text-violet-300",
        iconWrap: "bg-violet-500/20 text-violet-700 dark:text-violet-300",
        ring: "ring-violet-500/50",
        progressGood: "bg-emerald-500",
        progressBad: "bg-violet-500",
      },
      progress: data.completionPct,
      progressGood: data.completionPct >= 70,
    },
    {
      key: "alerts",
      value: data.alerts,
      label: "Alertas Críticos",
      icon: AlertOctagon,
      tone: {
        bg: "bg-rose-500/10 dark:bg-rose-500/15",
        border: "border-l-rose-600",
        value: "text-rose-700 dark:text-rose-300",
        iconWrap: "bg-rose-500/20 text-rose-700 dark:text-rose-300",
        ring: "ring-rose-500/50",
        progressGood: "bg-emerald-500",
        progressBad: "bg-rose-600",
      },
      progress: Math.min(100, data.alerts * 25),
      progressGood: data.alerts === 0,
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
              "group relative text-left rounded-xl border border-border/60 border-l-4 shadow-sm overflow-hidden transition-all",
              "hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2",
              c.tone.bg,
              c.tone.border,
              c.tone.ring,
              isActive && "ring-2 -translate-y-0.5 shadow-md"
            )}
          >
            <div className="flex items-start justify-between px-5 pt-4 pb-3">
              <div className="min-w-0">
                <p className={cn("text-3xl font-bold tracking-tight tabular-nums", c.tone.value)}>
                  {c.value}
                </p>
                <p className="text-xs font-medium text-muted-foreground mt-1">{c.label}</p>
              </div>
              <span
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  c.tone.iconWrap
                )}
              >
                <Icon className="w-4 h-4" />
              </span>
            </div>
            <div className="h-2 w-full bg-foreground/10">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  c.progressGood ? c.tone.progressGood : c.tone.progressBad
                )}
                style={{ width: `${c.progress}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SecretaryCounters;

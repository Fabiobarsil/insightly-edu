import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";

/**
 * Contadores compactos da Secretaria Digital.
 * Estilo mockup: 4 cards centralizados com número grande + rótulo.
 * Sem gráficos, sem tendências — apenas execução.
 */
const SecretaryCounters = () => {
  const { schoolId } = useSchoolId();

  const { data } = useQuery({
    queryKey: ["secretary-counters", schoolId],
    queryFn: async () => {
      if (!schoolId) return null;

      const [studentsRes, docsRes, requestsRes, alertsRes] = await Promise.all([
        supabase
          .from("students")
          .select("id", { count: "exact", head: true })
          .eq("school_id", schoolId)
          .eq("status", "ativo"),
        supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("school_id", schoolId)
          .eq("status", "pendente"),
        supabase
          .from("secretary_requests")
          .select("id", { count: "exact", head: true })
          .eq("school_id", schoolId)
          .neq("status", "concluido"),
        supabase
          .from("secretary_requests")
          .select("id", { count: "exact", head: true })
          .eq("school_id", schoolId)
          .eq("priority", "urgente")
          .neq("status", "concluido"),
      ]);

      return {
        students: studentsRes.count ?? 0,
        documents: docsRes.count ?? 0,
        requests: requestsRes.count ?? 0,
        alerts: alertsRes.count ?? 0,
      };
    },
    enabled: !!schoolId,
  });

  const cards = [
    { value: data?.students ?? 0, label: "Alunos Ativos", accent: "text-foreground" },
    { value: data?.documents ?? 0, label: "Documentos Pendentes", accent: "text-amber-600" },
    { value: data?.requests ?? 0, label: "Solicitações", accent: "text-primary" },
    { value: data?.alerts ?? 0, label: "Alertas Críticos", accent: "text-destructive" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-card border border-border/60 rounded-xl px-5 py-4 text-center shadow-sm"
        >
          <p className={`text-3xl font-bold tracking-tight ${c.accent} tabular-nums`}>
            {c.value}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
};

export default SecretaryCounters;

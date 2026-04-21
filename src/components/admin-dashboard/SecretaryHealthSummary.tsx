import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { CheckCircle2, AlertTriangle } from "lucide-react";

/**
 * Resumo compacto da "Saúde da Secretaria".
 * Apresenta apenas um status de uma linha:
 * - "Secretaria em dia" (verde) quando não há pendências críticas
 * - "Atenção em pendências" (âmbar) caso contrário
 */
const SecretaryHealthSummary = () => {
  const { schoolId } = useSchoolId();

  const { data } = useQuery({
    queryKey: ["secretary-health-summary", schoolId],
    queryFn: async () => {
      if (!schoolId) return { pending: 0 };
      const today = new Date().toISOString().slice(0, 10);

      const [overdueDocs, urgentReqs] = await Promise.all([
        supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("school_id", schoolId)
          .eq("status", "pendente")
          .lt("due_date", today),
        supabase
          .from("secretary_requests")
          .select("id", { count: "exact", head: true })
          .eq("school_id", schoolId)
          .in("priority", ["urgente", "alta"])
          .neq("status", "concluido"),
      ]);

      return { pending: (overdueDocs.count ?? 0) + (urgentReqs.count ?? 0) };
    },
    enabled: !!schoolId,
  });

  const pending = data?.pending ?? 0;
  const ok = pending === 0;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
        ok
          ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
          : "bg-amber-500/5 border-amber-500/30 text-amber-700 dark:text-amber-400"
      }`}
    >
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <AlertTriangle className="h-4 w-4 shrink-0" />
      )}
      <span className="font-semibold">
        {ok ? "Secretaria em dia" : "Atenção em pendências"}
      </span>
      {!ok && (
        <span className="text-muted-foreground ml-auto">
          {pending} item(ns) crítico(s)
        </span>
      )}
    </div>
  );
};

export default SecretaryHealthSummary;

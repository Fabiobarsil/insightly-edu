import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { Flame } from "lucide-react";
import { format } from "date-fns";

const PRIORITY_BADGE: Record<string, string> = {
  urgente: "bg-destructive/15 text-destructive",
  alta: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
};

/**
 * Lista compacta de demandas urgentes/alta prioridade ainda não concluídas.
 * Sem gráficos — apenas execução.
 */
const UrgentDemands = () => {
  const { schoolId } = useSchoolId();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["urgent-demands", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("secretary_requests")
        .select("id, student_name, request_type, priority, status, deadline, created_at")
        .eq("school_id", schoolId)
        .in("priority", ["urgente", "alta"])
        .neq("status", "concluido")
        .order("priority", { ascending: true })
        .order("deadline", { ascending: true, nullsFirst: false })
        .limit(8);
      return data || [];
    },
    enabled: !!schoolId,
  });

  return (
    <section className="bg-card border border-border/60 rounded-xl p-5 shadow-sm">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-md bg-destructive/10 text-destructive flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-bold text-foreground">Demandas urgentes</h3>
            <p className="text-xs text-muted-foreground">
              Itens de alta prioridade aguardando ação
            </p>
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {items.length}
        </span>
      </header>

      {isLoading ? (
        <p className="text-xs text-muted-foreground py-6 text-center">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          Nenhuma demanda urgente no momento.
        </p>
      ) : (
        <ul className="divide-y divide-border/40">
          {items.map((item: any) => (
            <li key={item.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.student_name || item.request_type}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.request_type}
                  {item.deadline && ` · Prazo ${format(new Date(item.deadline), "dd/MM/yyyy")}`}
                </p>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                  PRIORITY_BADGE[item.priority] || "bg-muted text-muted-foreground"
                }`}
              >
                {item.priority === "urgente" ? "Urgente" : "Alta"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default UrgentDemands;

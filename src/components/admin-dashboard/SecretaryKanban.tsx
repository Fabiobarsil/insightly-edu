import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { Clock, PlayCircle, CheckCircle2, ArrowRight, Check } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CounterFilter } from "./SecretaryCounters";

type Demand = {
  id: string;
  student_name: string | null;
  request_type: string;
  priority: string;
  status: string;
  deadline: string | null;
};

const COLUMNS = [
  {
    id: "pendente",
    title: "A Fazer",
    icon: Clock,
    accent: "border-t-amber-500",
    iconClass: "bg-amber-500/10 text-amber-600",
    next: "em_andamento" as const,
  },
  {
    id: "em_andamento",
    title: "Em Andamento",
    icon: PlayCircle,
    accent: "border-t-primary",
    iconClass: "bg-primary/10 text-primary",
    next: "concluido" as const,
  },
  {
    id: "concluido",
    title: "Concluído",
    icon: CheckCircle2,
    accent: "border-t-emerald-500",
    iconClass: "bg-emerald-500/10 text-emerald-600",
    next: null,
  },
] as const;

const PRIORITY_BORDER: Record<string, string> = {
  urgente: "border-l-destructive",
  alta: "border-l-orange-500",
  media: "border-l-amber-500",
  baixa: "border-l-emerald-500",
};

const PRIORITY_LABEL: Record<string, string> = {
  urgente: "Urgente",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

interface Props {
  filter?: CounterFilter;
}

const SecretaryKanban = ({ filter = "all" }: Props) => {
  const { schoolId } = useSchoolId();
  const queryClient = useQueryClient();

  const { data: demands = [] } = useQuery({
    queryKey: ["secretary-kanban", schoolId],
    queryFn: async (): Promise<Demand[]> => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("secretary_requests")
        .select("id, student_name, request_type, priority, status, deadline")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })
        .limit(60);
      return (data || []) as Demand[];
    },
    enabled: !!schoolId,
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("secretary_requests")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["secretary-kanban"] });
      queryClient.invalidateQueries({ queryKey: ["secretary-counters"] });
      queryClient.invalidateQueries({ queryKey: ["secretary-alerts-bar"] });
      toast.success(
        vars.status === "concluido" ? "Demanda concluída" : "Demanda atualizada"
      );
    },
    onError: () => toast.error("Não foi possível atualizar a demanda"),
  });

  const filtered = useMemo(() => {
    switch (filter) {
      case "alerts":
        return demands.filter((d) => d.priority === "urgente" && d.status !== "concluido");
      case "queue":
        return demands.filter((d) => d.status !== "concluido");
      case "documents":
        return demands.filter((d) =>
          /document|histor|certif|declar/i.test(d.request_type)
        );
      case "students":
      case "all":
      default:
        return demands;
    }
  }, [demands, filter]);

  const grouped: Record<string, Demand[]> = {
    pendente: [],
    em_andamento: [],
    concluido: [],
  };
  filtered.forEach((d) => {
    if (grouped[d.status]) grouped[d.status].push(d);
  });

  const filterLabel: Record<CounterFilter, string> = {
    all: "Todas as demandas",
    students: "Filtro: Alunos",
    documents: "Filtro: Documentos",
    queue: "Filtro: Fila ativa",
    alerts: "Filtro: Críticos",
  };

  return (
    <section className="bg-card border border-border/60 rounded-xl p-5 shadow-sm">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Fila operacional</h3>
          <p className="text-xs text-muted-foreground">{filterLabel[filter]}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const Icon = col.icon;
          const items = grouped[col.id] || [];
          return (
            <div
              key={col.id}
              className={`bg-muted/30 border border-border/50 border-t-4 ${col.accent} rounded-lg flex flex-col min-h-[320px]`}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-md flex items-center justify-center ${col.iconClass}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <h4 className="text-sm font-semibold text-foreground">{col.title}</h4>
                </div>
                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                  {items.length}
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-2 p-3">
                {items.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-center px-2 py-8">
                    <p className="text-xs text-muted-foreground/70">
                      Nenhuma demanda nesta coluna
                    </p>
                  </div>
                ) : (
                  items.map((item) => (
                    <article
                      key={item.id}
                      className={cn(
                        "group/card relative bg-card border border-border/50 border-l-4 rounded-md px-3 py-2.5 shadow-sm hover:shadow-md transition-all cursor-pointer",
                        PRIORITY_BORDER[item.priority] || "border-l-muted"
                      )}
                    >
                      <p className="text-sm font-medium text-foreground truncate pr-12">
                        {item.request_type}
                        {item.student_name ? ` — ${item.student_name}` : ""}
                      </p>
                      <div className="flex items-center justify-between mt-1.5 gap-2">
                        <span className="text-[11px] text-muted-foreground truncate">
                          {item.deadline
                            ? `Prazo ${format(new Date(item.deadline), "dd/MM/yyyy")}`
                            : "Sem prazo"}
                        </span>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                          {PRIORITY_LABEL[item.priority] || item.priority}
                        </span>
                      </div>

                      {/* Hover actions */}
                      {col.next && (
                        <div className="absolute top-1.5 right-1.5 hidden group-hover/card:flex items-center gap-1 animate-in fade-in-0 duration-150">
                          <button
                            type="button"
                            title={col.next === "concluido" ? "Concluir" : "Avançar"}
                            onClick={(e) => {
                              e.stopPropagation();
                              moveMutation.mutate({ id: item.id, status: col.next! });
                            }}
                            className={cn(
                              "h-6 w-6 rounded-md flex items-center justify-center text-white transition-colors",
                              col.next === "concluido"
                                ? "bg-emerald-500 hover:bg-emerald-600"
                                : "bg-primary hover:bg-primary/90"
                            )}
                          >
                            {col.next === "concluido" ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default SecretaryKanban;

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, Building2, GraduationCap, Timer, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSecretariaKanban, type KanbanRequest } from "@/hooks/useSecretariaKanban";

type Origin = "Diretoria" | "Coordenação" | "Prazos" | "Secretaria";

interface AlertRow {
  id: string;
  resourceId: string;
  origin: Origin;
  description: string;
  referenceDate: string;
  priority: string;
}

const ORIGIN_STYLES: Record<Origin, { badge: string; icon: any }> = {
  Diretoria: { badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300", icon: Building2 },
  Coordenação: { badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400", icon: GraduationCap },
  Prazos: { badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300", icon: Clock },
  Secretaria: { badge: "bg-orange-500/15 text-orange-700 dark:text-orange-300", icon: AlertTriangle },
};

const PRIORITY_WEIGHT: Record<string, number> = { urgente: 4, alta: 3, media: 2, baixa: 1 };

const inferOrigin = (r: KanbanRequest): Origin => {
  const t = (r.type ?? "").toLowerCase();
  if (t.includes("diret")) return "Diretoria";
  if (t.includes("coorden")) return "Coordenação";
  return "Secretaria";
};

const SecretaryAlertsBar = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { requests } = useSecretariaKanban();
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());

  // Prioridades reais derivadas do Kanban (mesma fonte: secretaria_requests)
  const prioridades = useMemo<AlertRow[]>(() => {
    return [...requests]
      .filter((r) => r.status !== "concluido")
      .sort((a, b) => (PRIORITY_WEIGHT[b.priority] ?? 0) - (PRIORITY_WEIGHT[a.priority] ?? 0))
      .map((r) => ({
        id: `req-${r.id}`,
        resourceId: r.id,
        origin: inferOrigin(r),
        description: `${r.title}${r.student_name ? ` — ${r.student_name}` : ""}`,
        referenceDate: r.created_at,
        priority: r.priority,
      }));
  }, [requests]);

  const startMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("secretaria_requests")
        .update({ status: "em_andamento" })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretaria-kanban"] });
      queryClient.invalidateQueries({ queryKey: ["secretary-counters"] });
      toast.success("Demanda movida para 'Em andamento'");
    },
    onError: () => toast.error("Não foi possível iniciar o atendimento"),
  });

  const handleStart = (alert: AlertRow) => {
    setActiveIds((prev) => new Set(prev).add(alert.id));
    startMutation.mutate(alert.resourceId, {
      onSettled: () => {
        setTimeout(() => {
          setActiveIds((prev) => {
            const n = new Set(prev);
            n.delete(alert.id);
            return n;
          });
        }, 800);
      },
    });
  };

  const total = prioridades.length;
  const visible = prioridades.slice(0, 3);

  return (
    <section className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
      <header className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          Prioridades do Dia
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">
            ({total})
          </span>
        </h3>
        {total > 3 && (
          <span className="text-[11px] font-medium text-muted-foreground">
            +{total - 3} ocultos
          </span>
        )}
      </header>

      {total === 0 ? (
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground">
            ✓ Nenhum alerta crítico no momento.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {visible.map((a) => {
            const cfg = ORIGIN_STYLES[a.origin];
            const Icon = cfg.icon;
            const time = formatDistanceToNow(new Date(a.referenceDate), {
              addSuffix: true,
              locale: ptBR,
            });
            const isActive = activeIds.has(a.id);
            const critical = isCritical(a);
            return (
              <li
                key={a.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 transition-colors border-l-4",
                  critical
                    ? "bg-rose-500/5 border-l-rose-600 hover:bg-rose-500/10"
                    : "border-l-transparent hover:bg-accent/30"
                )}
              >
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 ${cfg.badge}`}
                >
                  <Icon className="h-3 w-3" />
                  {a.origin}
                </span>
                <p className="text-xs font-medium text-foreground flex-1 min-w-0 truncate">
                  {a.description}
                </p>
                <span
                  className={cn(
                    "text-[11px] whitespace-nowrap shrink-0",
                    a.isOverdue
                      ? "font-bold text-rose-600 dark:text-rose-400"
                      : critical
                      ? "font-bold text-rose-600 dark:text-rose-400"
                      : "font-semibold text-muted-foreground"
                  )}
                >
                  {a.isOverdue ? "Atrasado" : time}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStart(a)}
                  disabled={isActive}
                  className={cn(
                    "h-7 px-2.5 text-xs gap-1.5 transition-all border",
                    isActive
                      ? "bg-emerald-500 hover:bg-emerald-500 text-white border-emerald-600"
                      : critical
                      ? "border-rose-500/60 text-rose-700 hover:bg-rose-500 hover:text-white dark:text-rose-300"
                      : "border-border hover:bg-accent"
                  )}
                >
                  {isActive ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Em andamento
                    </>
                  ) : (
                    <>
                      <Timer className={cn("h-3.5 w-3.5", isActive && "animate-spin")} />
                      Iniciar Atendimento
                    </>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default SecretaryAlertsBar;

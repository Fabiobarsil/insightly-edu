import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, Building2, GraduationCap, Timer, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Origin = "Diretoria" | "Coordenação" | "Prazos" | "Secretaria";

interface AlertRow {
  id: string;
  /** id do recurso original (request ou document) sem prefixo */
  resourceId: string;
  /** "request" => move para em_andamento; "doc" => navega */
  kind: "request" | "doc";
  origin: Origin;
  description: string;
  referenceDate: string;
  isOverdue?: boolean;
}

const ORIGIN_STYLES: Record<Origin, { badge: string; icon: any }> = {
  Diretoria: { badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300", icon: Building2 },
  Coordenação: { badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400", icon: GraduationCap },
  Prazos: { badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300", icon: Clock },
  Secretaria: { badge: "bg-orange-500/15 text-orange-700 dark:text-orange-300", icon: AlertTriangle },
};

const isCritical = (a: { origin: Origin; isOverdue?: boolean }) =>
  a.origin === "Diretoria" || a.origin === "Prazos" || a.isOverdue;

const SecretaryAlertsBar = () => {
  const { schoolId } = useSchoolId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());

  const { data: alerts = [] } = useQuery<AlertRow[]>({
    queryKey: ["secretary-alerts-bar", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const list: AlertRow[] = [];
      const today = new Date().toISOString().slice(0, 10);

      const { data: overdueDocs } = await supabase
        .from("documents")
        .select("id, name, due_date, created_at")
        .eq("school_id", schoolId)
        .eq("status", "pendente")
        .lt("due_date", today)
        .order("due_date", { ascending: true });

      (overdueDocs ?? []).forEach((d) => {
        list.push({
          id: `doc-${d.id}`,
          resourceId: d.id,
          kind: "doc",
          origin: "Prazos",
          description: `Documento vencido: ${d.name ?? "sem nome"}`,
          referenceDate: d.due_date ?? d.created_at ?? new Date().toISOString(),
          isOverdue: true,
        });
      });

      const { data: stalledReqs } = await supabase
        .from("secretary_requests")
        .select("id, student_name, request_type, priority, origin, status, created_at, deadline")
        .eq("school_id", schoolId)
        .in("priority", ["urgente", "alta"])
        .neq("status", "concluido")
        .order("created_at", { ascending: true });

      (stalledReqs ?? []).forEach((r) => {
        const origin: Origin =
          r.origin === "diretoria"
            ? "Diretoria"
            : r.origin === "coordenacao"
            ? "Coordenação"
            : "Secretaria";
        const ref = r.deadline ?? r.created_at ?? new Date().toISOString();
        const overdue = r.deadline ? isBefore(new Date(r.deadline), new Date()) : false;
        list.push({
          id: `req-${r.id}`,
          resourceId: r.id,
          kind: "request",
          origin,
          description: `${r.request_type}${r.student_name ? ` — ${r.student_name}` : ""}`,
          referenceDate: ref,
          isOverdue: overdue,
        });
      });

      return list;
    },
    enabled: !!schoolId,
  });

  const startMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("secretary_requests")
        .update({ status: "em_andamento", updated_at: new Date().toISOString() })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secretary-kanban"] });
      queryClient.invalidateQueries({ queryKey: ["secretary-counters"] });
      queryClient.invalidateQueries({ queryKey: ["secretary-alerts-bar"] });
      toast.success("Demanda movida para 'Em andamento'");
    },
    onError: () => toast.error("Não foi possível iniciar o atendimento"),
  });

  const handleStart = (alert: AlertRow) => {
    if (alert.kind === "doc") {
      navigate("/admin/documentos");
      return;
    }
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

  const total = alerts.length;
  const visible = alerts.slice(0, 3);

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

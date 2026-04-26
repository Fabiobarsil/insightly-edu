import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { updateRequestStatus } from "@/lib/secretariaActions";

import { AlertTriangle, Clock, Building2, GraduationCap, Timer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSecretariaKanban, type KanbanRequest } from "@/hooks/useSecretariaKanban";
import AttendanceModal from "@/components/secretaria/AttendanceModal";

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
  
  
  const queryClient = useQueryClient();
  const { requests } = useSecretariaKanban();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<KanbanRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
      const current = requests.find((r) => r.id === requestId);
      if (!current) throw new Error("Demanda não encontrada");
      await updateRequestStatus(
        {
          id: current.id,
          school_id: current.school_id,
          student_id: current.student_id,
          status: current.status,
        },
        "em_andamento"
      );
      return requestId;
    },
    onSuccess: (requestId) => {
      queryClient.invalidateQueries({ queryKey: ["secretaria-kanban"] });
      queryClient.invalidateQueries({ queryKey: ["secretary-counters"] });
      const fresh = requests.find((r) => r.id === requestId) ?? null;
      if (fresh) {
        setSelectedRequest({ ...fresh, status: "em_andamento" });
        setModalOpen(true);
      }
    },
    onError: (err) => {
      console.error("[SecretaryAlertsBar] iniciar atendimento falhou:", err);
      toast.error("Não foi possível iniciar o atendimento");
    },
    onSettled: () => setActiveId(null),
  });

  const handleStart = (alert: AlertRow) => {
    setActiveId(alert.id);
    startMutation.mutate(alert.resourceId);
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
            const isActive = activeId === a.id;
            const critical = a.priority === "alta" || a.priority === "urgente";
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
                    critical
                      ? "font-bold text-rose-600 dark:text-rose-400"
                      : "font-semibold text-muted-foreground"
                  )}
                >
                  {time}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStart(a)}
                  disabled={isActive}
                  className={cn(
                    "h-7 px-2.5 text-xs gap-1.5 transition-all border",
                    critical
                      ? "border-rose-500/60 text-rose-700 hover:bg-rose-500 hover:text-white dark:text-rose-300"
                      : "border-border hover:bg-accent"
                  )}
                >
                  {isActive ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    <>
                      <Timer className="h-3.5 w-3.5" />
                      Iniciar Atendimento
                    </>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <AttendanceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        request={selectedRequest}
      />
    </section>
  );
};

export default SecretaryAlertsBar;

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, Building2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

type Origin = "Diretoria" | "Coordenação" | "Prazos" | "Secretaria";

interface AlertRow {
  id: string;
  origin: Origin;
  description: string;
  referenceDate: string; // ISO
  isOverdue?: boolean;
  onResolve: () => void;
}

const ORIGIN_STYLES: Record<Origin, { badge: string; icon: any }> = {
  Diretoria: { badge: "bg-primary/10 text-primary", icon: Building2 },
  Coordenação: { badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400", icon: GraduationCap },
  Prazos: { badge: "bg-destructive/15 text-destructive", icon: Clock },
  Secretaria: { badge: "bg-muted text-foreground", icon: AlertTriangle },
};

/**
 * Barra horizontal de Alertas Críticos da Secretaria.
 * Mostra no máximo 3 linhas finas; total exibido no título.
 */
const SecretaryAlertsBar = () => {
  const { schoolId } = useSchoolId();
  const navigate = useNavigate();

  const { data: alerts = [] } = useQuery<AlertRow[]>({
    queryKey: ["secretary-alerts-bar", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const list: AlertRow[] = [];
      const today = new Date().toISOString().slice(0, 10);

      // 1. Documentos vencidos (Prazos)
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
          origin: "Prazos",
          description: `Documento vencido: ${d.name ?? "sem nome"}`,
          referenceDate: d.due_date ?? d.created_at ?? new Date().toISOString(),
          isOverdue: true,
          onResolve: () => navigate("/admin/documentos"),
        });
      });

      // 2. Solicitações urgentes/altas paradas (Coordenação/Diretoria conforme origem)
      const { data: stalledReqs } = await supabase
        .from("secretary_requests")
        .select("id, student_name, request_type, priority, origin, created_at, deadline")
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
          origin,
          description: `${r.request_type}${r.student_name ? ` — ${r.student_name}` : ""}`,
          referenceDate: ref,
          isOverdue: overdue,
          onResolve: () =>
            document
              .getElementById("kanban-section")
              ?.scrollIntoView({ behavior: "smooth" }),
        });
      });

      return list;
    },
    enabled: !!schoolId,
  });

  const total = alerts.length;
  const visible = alerts.slice(0, 3);

  return (
    <section className="bg-card border border-border/60 rounded-xl overflow-hidden">
      <header className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Alertas
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
            return (
              <li
                key={a.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/30 transition-colors"
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
                  className={`text-[11px] font-semibold whitespace-nowrap shrink-0 ${
                    a.isOverdue ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {a.isOverdue ? "Atrasado" : time}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={a.onResolve}
                >
                  Resolver
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

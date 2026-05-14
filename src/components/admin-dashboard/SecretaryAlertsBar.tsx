import { useMemo, useState } from "react";
import { AlertTriangle, Clock, Building2, GraduationCap, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useSecretariaKanban, type KanbanRequest } from "@/hooks/useSecretariaKanban";
import AttendanceModal from "@/components/secretaria/AttendanceModal";
import { formatDocType } from "./SecretaryKanban";

type Origin = "Diretoria" | "Coordenação" | "Prazos" | "Secretaria";

const ORIGIN_STYLES: Record<Origin, { badge: string; icon: any }> = {
  Diretoria: { badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300", icon: Building2 },
  Coordenação: { badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400", icon: GraduationCap },
  Prazos: { badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300", icon: Clock },
  Secretaria: { badge: "bg-orange-500/15 text-orange-700 dark:text-orange-300", icon: AlertTriangle },
};

const inferOrigin = (r: KanbanRequest): Origin => {
  const t = (r.type ?? "").toLowerCase();
  if (t.includes("diret")) return "Diretoria";
  if (t.includes("coorden")) return "Coordenação";
  return "Secretaria";
};

/**
 * Prioridades do Dia
 * - Mostra apenas demandas críticas/urgentes vindas da MESMA fonte da Fila
 *   Operacional (`secretaria_requests` via `useSecretariaKanban`).
 * - Não duplica lógica nem fluxo: clique abre o modal "Atender Solicitação".
 */
const SecretaryAlertsBar = () => {
  const { requests } = useSecretariaKanban();
  const [selected, setSelected] = useState<KanbanRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const prioridades = useMemo(() => {
    return requests.filter(
      (r) => r.priority === "alta" && r.request_status !== "concluido"
    );
  }, [requests]);

  const total = prioridades.length;
  const visible = prioridades.slice(0, 4);

  const open = (r: KanbanRequest) => {
    setSelected(r);
    setModalOpen(true);
  };

  return (
    <section className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
      <header className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Prioridades do Dia
              <span className="ml-2 text-xs font-semibold text-muted-foreground tabular-nums">
                ({total})
              </span>
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Clique para iniciar o atendimento desta demanda
            </p>
          </div>
        </div>
        {total > visible.length && (
          <span className="text-[11px] font-medium text-muted-foreground">
            +{total - visible.length} ocultos
          </span>
        )}
      </header>

      {total === 0 ? (
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground">
            ✓ Nenhuma demanda crítica no momento.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {visible.map((a) => {
            const origin = inferOrigin(a);
            const cfg = ORIGIN_STYLES[origin];
            const Icon = cfg.icon;
            const time = formatDistanceToNow(new Date(a.created_at), {
              addSuffix: true,
              locale: ptBR,
            });
            const description = a.document_type
              ? `Documento pendente — ${formatDocType(a.document_type)}`
              : a.title;
            return (
              <li
                key={a.id}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors border-l-4 bg-rose-500/5 border-l-rose-600 hover:bg-rose-500/10"
              >
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0",
                    cfg.badge
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {origin}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {description}
                  </p>
                  {a.student_name && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {a.student_name}
                      {a.student_class ? ` • ${a.student_grade ?? ""} ${a.student_class}` : ""}
                    </p>
                  )}
                </div>
                <span className="text-[11px] whitespace-nowrap shrink-0 font-bold text-rose-600 dark:text-rose-400">
                  {time}
                </span>
                <Button
                  size="sm"
                  onClick={() => open(a)}
                  className="h-7 px-3 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  Atender agora
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <AttendanceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        request={selected}
      />
    </section>
  );
};

export default SecretaryAlertsBar;

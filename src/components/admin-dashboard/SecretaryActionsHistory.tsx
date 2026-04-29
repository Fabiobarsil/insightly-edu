import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolContext } from "@/hooks/useSchoolContext";
import { formatDistanceToNow, format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  History,
  PlayCircle,
  CheckCircle2,
  RotateCcw,
  RefreshCw,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ActionRow {
  id: string;
  action_type: string;
  from_status: string | null;
  to_status: string | null;
  notes: string | null;
  created_at: string;
  request_id: string | null;
  student_id: string | null;
  request_title: string | null;
  student_name: string | null;
}

const ACTION_META: Record<
  string,
  { label: string; Icon: any; badge: string }
> = {
  iniciou: {
    label: "Iniciou atendimento",
    Icon: PlayCircle,
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  concluiu: {
    label: "Concluiu",
    Icon: CheckCircle2,
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  retornou: {
    label: "Devolveu para fila",
    Icon: RotateCcw,
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  reabriu: {
    label: "Reabriu",
    Icon: RefreshCw,
    badge: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  },
  alterou: {
    label: "Alterou status",
    Icon: ArrowRight,
    badge: "bg-muted text-muted-foreground",
  },
};

const fetchActions = async (
  schoolId: string,
  opts: { limit?: number; sinceMonthStart?: boolean }
): Promise<ActionRow[]> => {
  let query = supabase
    .from("secretaria_actions")
    .select(
      "id, action_type, from_status, to_status, notes, created_at, request_id, student_id"
    )
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  if (opts.sinceMonthStart) {
    query = query.gte("created_at", startOfMonth(new Date()).toISOString());
  }
  if (opts.limit) {
    query = query.limit(opts.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data || []) as any[];

  // Hidrata títulos e nomes (evita dependência de FK declarada)
  const requestIds = Array.from(
    new Set(rows.map((r) => r.request_id).filter(Boolean))
  ) as string[];
  const studentIds = Array.from(
    new Set(rows.map((r) => r.student_id).filter(Boolean))
  ) as string[];

  const [requestsRes, studentsRes] = await Promise.all([
    requestIds.length
      ? supabase
          .from("secretaria_requests")
          .select("id, title")
          .in("id", requestIds)
      : Promise.resolve({ data: [] as any[] }),
    studentIds.length
      ? supabase.from("students").select("id, full_name").in("id", studentIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const reqMap: Record<string, string> = {};
  (requestsRes.data || []).forEach((r: any) => (reqMap[r.id] = r.title));
  const stuMap: Record<string, string> = {};
  (studentsRes.data || []).forEach((s: any) => (stuMap[s.id] = s.full_name));

  return rows.map((r) => ({
    id: r.id,
    action_type: r.action_type,
    from_status: r.from_status,
    to_status: r.to_status,
    notes: r.notes ?? null,
    created_at: r.created_at,
    request_id: r.request_id,
    student_id: r.student_id,
    request_title: r.request_id ? reqMap[r.request_id] ?? null : null,
    student_name: r.student_id ? stuMap[r.student_id] ?? null : null,
  }));
};

const ActionItem = ({ row }: { row: ActionRow }) => {
  const meta = ACTION_META[row.action_type] ?? ACTION_META.alterou;
  const Icon = meta.Icon;
  const time = formatDistanceToNow(new Date(row.created_at), {
    addSuffix: true,
    locale: ptBR,
  });
  const subject =
    row.request_title ??
    (row.student_name ? `Demanda de ${row.student_name}` : "Demanda");

  return (
    <li className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/30 transition-colors">
      <span
        className={cn(
          "h-8 w-8 rounded-full inline-flex items-center justify-center shrink-0",
          meta.badge
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">
          <span className="font-bold">{meta.label}</span>
          <span className="text-muted-foreground font-normal"> — {subject}</span>
        </p>
        {row.notes && (
          <p className="text-[11px] text-muted-foreground italic truncate mt-0.5">
            "{row.notes}"
          </p>
        )}
        {row.student_name && row.request_title && !row.notes && (
          <p className="text-[11px] text-muted-foreground truncate">
            {row.student_name}
          </p>
        )}
      </div>
      <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap shrink-0">
        {time}
      </span>
    </li>
  );
};

const SecretaryActionsHistory = () => {
  const { schoolId } = useSchoolContext();
  const [open, setOpen] = useState(false);

  const { data: latest = [], isLoading } = useQuery({
    queryKey: ["secretary-actions-history", schoolId, "latest"],
    enabled: !!schoolId,
    queryFn: () => fetchActions(schoolId!, { limit: 5 }),
  });

  const { data: monthly = [], isLoading: monthlyLoading } = useQuery({
    queryKey: ["secretary-actions-history", schoolId, "month"],
    enabled: !!schoolId && open,
    queryFn: () => fetchActions(schoolId!, { sinceMonthStart: true }),
  });

  const monthLabel = useMemo(
    () => format(new Date(), "MMMM 'de' yyyy", { locale: ptBR }),
    []
  );

  return (
    <section className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
      <header className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          Histórico de Ações
          <span className="text-xs font-semibold text-muted-foreground">
            (últimas 5)
          </span>
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
          className="h-7 px-2.5 text-xs gap-1.5"
        >
          Ver histórico do mês
        </Button>
      </header>

      {isLoading ? (
        <div className="px-4 py-6 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : latest.length === 0 ? (
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Nenhuma ação registrada ainda.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {latest.map((r) => (
            <ActionItem key={r.id} row={r} />
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Histórico de ações — <span className="capitalize">{monthLabel}</span>
            </DialogTitle>
            <DialogDescription>
              Todas as movimentações registradas pela Secretaria neste mês.
            </DialogDescription>
          </DialogHeader>

          {monthlyLoading ? (
            <div className="py-10 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : monthly.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhuma ação registrada neste mês.
            </p>
          ) : (
            <ScrollArea className="max-h-[60vh] -mx-6">
              <ul className="divide-y divide-border/40">
                {monthly.map((r) => (
                  <ActionItem key={r.id} row={r} />
                ))}
              </ul>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default SecretaryActionsHistory;

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const PRIORITY_MAP: Record<string, { label: string; class: string }> = {
  baixa: { label: "Baixa", class: "bg-muted text-muted-foreground" },
  media: { label: "Média", class: "bg-primary/10 text-primary" },
  alta: { label: "Alta", class: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  urgente: { label: "Urgente", class: "bg-destructive/10 text-destructive" },
};

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  aberto: { label: "Aberto", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  "em andamento": { label: "Em andamento", class: "bg-primary/10 text-primary" },
  aguardando: { label: "Aguardando", class: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  concluido: { label: "Concluído", class: "bg-secondary/15 text-secondary" },
};

const PRIORITY_ORDER = ["urgente", "alta", "media", "baixa"];
const NEXT_STATUS: Record<string, string> = {
  aberto: "em andamento",
  "em andamento": "aguardando",
  aguardando: "concluido",
};

const RequestsList = () => {
  const { schoolId } = useSchoolId();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["secretary-requests", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("secretary_requests" as any)
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!schoolId,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const { error } = await supabase
        .from("secretary_requests" as any)
        .update({ status: newStatus, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["secretary-requests"] }),
  });

  const sorted = [...requests].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
  );

  if (isLoading) {
    return <div className="bg-card border border-border/60 rounded-xl p-6 animate-pulse h-40" />;
  }

  if (sorted.length === 0) {
    return (
      <div className="bg-card border border-border/60 rounded-xl p-8 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma solicitação registrada.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border/40">
        <h3 className="text-sm font-bold text-foreground">📋 Demandas da Secretaria</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Aluno</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Tipo</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Prioridade</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Prazo</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Status</th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r: any) => {
              const pri = PRIORITY_MAP[r.priority] || PRIORITY_MAP.media;
              const st = STATUS_MAP[r.status] || STATUS_MAP.aberto;
              const next = NEXT_STATUS[r.status];
              return (
                <tr key={r.id} className="border-b border-border/20 hover:bg-accent/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{r.student_name || "—"}</td>
                  <td className="px-4 py-3 text-foreground">
                    {r.request_type}
                    {r.is_recurring && <span className="ml-1 text-xs text-orange-500">🔁</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className={pri.class}>{pri.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.deadline ? format(new Date(r.deadline), "dd/MM/yyyy") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className={st.class}>{st.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {next ? (
                      <button
                        onClick={() => updateStatus.mutate({ id: r.id, newStatus: next })}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        → {STATUS_MAP[next]?.label}
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">✓</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequestsList;

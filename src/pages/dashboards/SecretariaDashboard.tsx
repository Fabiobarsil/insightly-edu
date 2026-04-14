import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import RoleLayout from "@/components/layout/RoleLayout";
import RequestFormModal from "@/components/secretaria/RequestFormModal";
import PriorityModal from "@/components/secretaria/PriorityModal";
import { Plus, AlertTriangle, FileText, Users, CheckCircle2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

const PRIORITY_ORDER = ["urgente", "alta", "media", "baixa"];
const PRIORITY_MAP: Record<string, { label: string; class: string }> = {
  baixa: { label: "Baixa", class: "bg-muted text-muted-foreground" },
  media: { label: "Média", class: "bg-primary/10 text-primary" },
  alta: { label: "Alta", class: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  urgente: { label: "Urgente", class: "bg-destructive/10 text-destructive" },
};
const STATUS_MAP: Record<string, { label: string; class: string }> = {
  aberto: { label: "Aberto", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  "em andamento": { label: "Em andamento", class: "bg-primary/10 text-primary" },
  concluido: { label: "Concluído", class: "bg-secondary/15 text-secondary" },
};
const NEXT_STATUS: Record<string, string> = {
  aberto: "em andamento",
  "em andamento": "concluido",
};

const SecretariaDashboard = () => {
  const { schoolId } = useSchoolId();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [classifyId, setClassifyId] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["secretary-requests", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("secretary_requests")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!schoolId,
  });

  // Real-time: auto-refresh when secretary_requests change
  useEffect(() => {
    if (!schoolId) return;
    const channel = supabase
      .channel("secretary-requests-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "secretary_requests", filter: `school_id=eq.${schoolId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["secretary-requests", schoolId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [schoolId, queryClient]);

  const activeRequests = requests.filter((r) => r.status !== "concluido");
  const sorted = [...activeRequests].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
  );

  const urgentCount = activeRequests.filter((r) => r.priority === "urgente").length;
  const coordCount = activeRequests.filter((r) => r.origin === "coordenacao").length;
  const totalPending = activeRequests.length;

  // Classify priority after creation
  const classifyMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: string }) => {
      const { error } = await supabase
        .from("secretary_requests")
        .update({ priority, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação classificada e adicionada à fila!");
      queryClient.invalidateQueries({ queryKey: ["secretary-requests"] });
      setClassifyId(null);
    },
  });

  // Advance status
  const advanceStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const { error } = await supabase
        .from("secretary_requests")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      const msg = vars.newStatus === "concluido" ? "Solicitação concluída!" : "Status atualizado!";
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ["secretary-requests"] });
    },
  });

  const metrics = [
    { label: "Pendentes", value: totalPending, icon: FileText, accent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    { label: "Urgentes", value: urgentCount, icon: AlertTriangle, accent: urgentCount > 0 ? "bg-destructive/10 text-destructive" : "bg-muted/50 text-muted-foreground" },
  ];

  return (
    <RoleLayout title="Secretaria">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Secretaria Digital</h2>
            <p className="text-sm text-muted-foreground">Fila de trabalho unificada — solicitações, prioridades e execução</p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Solicitação
          </Button>
        </div>

        {/* Metrics + Alert */}
        <div className="flex flex-wrap items-center gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="bg-card border border-border/60 rounded-xl p-4 flex items-center gap-3 min-w-[160px]">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${m.accent}`}>
                <m.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-lg font-bold text-foreground">{m.value}</p>
              </div>
            </div>
          ))}
          {urgentCount > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <span className="font-semibold text-foreground">{urgentCount} urgente(s) na fila</span>
            </div>
          )}
        </div>

        {/* Work Queue — Prioridades de Hoje */}
        <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border/40">
            <h3 className="text-sm font-bold text-foreground">🎯 Prioridades de Hoje — Fila de Trabalho</h3>
          </div>

          {isLoading ? (
            <div className="p-6 animate-pulse h-32" />
          ) : sorted.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente. 🎉</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Aluno</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Origem</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Prioridade</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Prazo</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r) => {
                    const pri = PRIORITY_MAP[r.priority] || PRIORITY_MAP.media;
                    const st = STATUS_MAP[r.status] || STATUS_MAP.aberto;
                    const next = NEXT_STATUS[r.status];
                    return (
                      <tr key={r.id} className="border-b border-border/20 hover:bg-accent/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{r.student_name || "—"}</td>
                        <td className="px-4 py-3 text-foreground">{r.request_type}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={r.origin === "coordenacao" ? "bg-primary/10 text-primary border-primary/20 text-[10px]" : "text-[10px]"}>
                            {r.origin === "coordenacao" ? "Coordenação" : "Secretaria"}
                          </Badge>
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
                              onClick={() => advanceStatus.mutate({ id: r.id, newStatus: next })}
                              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                            >
                              {next === "concluido" ? (
                                <><CheckCircle2 className="h-3.5 w-3.5" /> Resolver</>
                              ) : (
                                <>→ {STATUS_MAP[next]?.label}</>
                              )}
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
          )}
        </div>

        {/* Modals */}
        <RequestFormModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onCreated={(id) => setClassifyId(id)}
        />
        <PriorityModal
          open={!!classifyId}
          onConfirm={(priority) => classifyId && classifyMutation.mutate({ id: classifyId, priority })}
          onCancel={() => setClassifyId(null)}
        />
      </div>
    </RoleLayout>
  );
};

export default SecretariaDashboard;

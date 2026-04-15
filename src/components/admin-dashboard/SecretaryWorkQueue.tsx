import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useDashboard } from "@/hooks/useDashboard";
import { Plus, AlertTriangle, CheckCircle2, Bell, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import { format } from "date-fns";
import RequestFormModal from "@/components/secretaria/RequestFormModal";
import PriorityModal from "@/components/secretaria/PriorityModal";
import AttendRequestModal from "@/components/admin-dashboard/AttendRequestModal";

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
  em_andamento: { label: "Em andamento", class: "bg-primary/10 text-primary" },
  concluido: { label: "Concluído", class: "bg-secondary/15 text-secondary" },
  resolvido: { label: "Resolvido", class: "bg-secondary/15 text-secondary" },
};
const NEXT_STATUS: Record<string, string> = {
  aberto: "em andamento",
  "em andamento": "concluido",
};

const SEVERITY_MAP: Record<string, { label: string; class: string }> = {
  baixa: { label: "Baixa", class: "bg-muted text-muted-foreground" },
  media: { label: "Média", class: "bg-primary/10 text-primary" },
  alta: { label: "Alta", class: "bg-destructive/10 text-destructive" },
};

type CardFilterType = "pendentes" | "resolvidos" | "urgentes" | "coordenacao" | null;
type ListModalType = "pendentes" | "resolvidos" | "atrasados" | null;

interface SecretaryWorkQueueProps {
  onNewRequest?: () => void;
  externalModalOpen?: boolean;
  onExternalModalChange?: (open: boolean) => void;
}

const SecretaryWorkQueue = ({ onNewRequest, externalModalOpen, onExternalModalChange }: SecretaryWorkQueueProps) => {
  const { schoolId } = useSchoolId();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [classifyId, setClassifyId] = useState<string | null>(null);
  const [listModal, setListModal] = useState<ListModalType>(null);
  const [cardFilter, setCardFilter] = useState<CardFilterType>(null);
  const [attendRequest, setAttendRequest] = useState<any | null>(null);

  // Debug: log school_id
  console.log("school_id:", schoolId);

  // ── Cards: valores calculados direto de secretary_requests ──
  const { data: cardCounts } = useQuery({
    queryKey: ["dashboard-cards", schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from("secretary_requests")
        .select("status, priority, origin")
        .eq("school_id", schoolId!);
      const rows = data ?? [];
      return {
        pendentes: rows.filter(r => r.status !== "concluido").length,
        resolvidos: rows.filter(r => r.status === "concluido").length,
        urgentes: rows.filter(r => r.priority === "urgente" && r.status !== "concluido").length,
        da_coordenacao: rows.filter(r => r.origin === "coordenacao" && r.status !== "concluido").length,
      };
    },
    enabled: !!schoolId,
  });
  const totalPending = cardCounts?.pendentes ?? 0;
  const totalResolved = cardCounts?.resolvidos ?? 0;
  const urgentCount = cardCounts?.urgentes ?? 0;
  const coordCount = cardCounts?.da_coordenacao ?? 0;

  // ── Secretary work queue (secretary_requests) — kept intact ──
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

  useEffect(() => {
    if (!schoolId) return;
    const channel = supabase
      .channel("secretary-requests-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "secretary_requests", filter: `school_id=eq.${schoolId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["secretary-requests", schoolId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [schoolId, queryClient]);

  const activeRequests = requests.filter((r) => r.status !== "concluido");
  const resolvedRequests = requests.filter((r) => r.status === "concluido");
  const today = new Date().toISOString().split("T")[0];
  const overdueRequests = activeRequests.filter((r) => r.deadline && r.deadline < today);
  const sorted = [...activeRequests].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
  );

  const totalOverdue = overdueRequests.length;
  const secPending = activeRequests.length;
  const secResolved = resolvedRequests.length;

  const healthData = useMemo(
    () =>
      [
        { name: "Pendentes", value: secPending - totalOverdue, color: "#EAB308" },
        { name: "Resolvidos", value: secResolved, color: "#22C55E" },
        { name: "Atrasados", value: totalOverdue, color: "#EF4444" },
      ].filter((d) => d.value > 0),
    [secPending, secResolved, totalOverdue],
  );

  const healthTotal = secPending + secResolved;

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

  // ── Dashboard metric cards (values from view, click filters pedagogical_interventions) ──
  const metrics = [
    {
      label: "Pendentes",
      value: totalPending,
      icon: Clock,
      accent:
        totalPending > 0
          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
          : "bg-muted/50 text-muted-foreground",
      onClick: () => setCardFilter("pendentes"),
    },
    {
      label: "Resolvidos",
      value: totalResolved,
      icon: CheckCircle2,
      accent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      onClick: () => setCardFilter("resolvidos"),
    },
    {
      label: "Urgentes",
      value: urgentCount,
      icon: AlertTriangle,
      accent: urgentCount > 0 ? "bg-destructive/10 text-destructive" : "bg-muted/50 text-muted-foreground",
      onClick: () => setCardFilter("urgentes"),
    },
    {
      label: "Da Coordenação",
      value: coordCount,
      icon: Bell,
      accent:
        coordCount > 0
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          : "bg-muted/50 text-muted-foreground",
      onClick: () => setCardFilter("coordenacao"),
    },
  ];

  // ── Secretary list modal (for Saúde da Secretaria clicks) ──
  const secModalList =
    listModal === "pendentes" ? activeRequests : listModal === "atrasados" ? overdueRequests : resolvedRequests;
  const secModalTitle =
    listModal === "pendentes"
      ? "Solicitações Pendentes"
      : listModal === "atrasados"
        ? "Solicitações Atrasadas"
        : "Solicitações Resolvidas";

  const cardFilterTitle: Record<string, string> = {
    pendentes: "Intervenções Pendentes",
    resolvidos: "Intervenções Resolvidas",
    urgentes: "Intervenções Urgentes",
    coordenacao: "Intervenções da Coordenação",
  };

  const isRequestModalOpen = externalModalOpen !== undefined ? externalModalOpen : modalOpen;
  const setRequestModalOpen = onExternalModalChange || setModalOpen;

  return (
    <>
      {/* Coordenação alert banner */}
      {coordCount > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 rounded-xl px-4 py-3 animate-in fade-in-0 slide-in-from-top-2 duration-300">
          <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {coordCount} intervenção(ões) da Coordenação Pedagógica
            </p>
          </div>
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] shrink-0"
          >
            Nova
          </Badge>
        </div>
      )}

      {/* Dynamic Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <button
            key={m.label}
            onClick={m.onClick}
            className="bg-card border border-border/60 rounded-xl p-4 flex items-center gap-3 text-left transition-all hover:shadow-sm hover:-translate-y-0.5 cursor-pointer"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${m.accent}`}>
              <m.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-lg font-bold text-foreground">{m.value}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Urgent alert */}
      {urgentCount > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <span className="font-semibold text-foreground">{urgentCount} urgente(s) na fila</span>
        </div>
      )}

      {/* Work Queue */}
      <div id="priorities-section" className="bg-card border border-border/60 rounded-xl overflow-hidden">
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
                    <tr
                      key={r.id}
                      className="border-b border-border/20 hover:bg-accent/40 transition-colors cursor-pointer"
                      onClick={() => setAttendRequest(r)}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{r.student_name || "—"}</td>
                      <td className="px-4 py-3 text-foreground">{r.request_type}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            r.origin === "coordenacao"
                              ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 text-[10px]"
                              : "text-[10px]"
                          }
                        >
                          {r.origin === "coordenacao" ? "Coordenação" : "Secretaria"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={pri.class}>
                          {pri.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.deadline ? format(new Date(r.deadline), "dd/MM/yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={st.class}>
                          {st.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                          Atender
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Saúde da Secretaria */}
      <div className="bg-card border border-border/60 rounded-xl p-6">
        <h3 className="text-sm font-bold text-foreground mb-5">📊 Saúde da Secretaria</h3>
        {healthTotal === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma solicitação registrada.</p>
        ) : (
          <div className="flex items-center gap-8">
            <div className="w-[120px] h-[120px] shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    style={{ cursor: "pointer" }}
                    onClick={(_, index) => {
                      const segment = healthData[index]?.name;
                      if (segment === "Pendentes") setListModal("pendentes");
                      else if (segment === "Resolvidos") setListModal("resolvidos");
                      else if (segment === "Atrasados") setListModal("atrasados");
                    }}
                  >
                    {healthData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value}`, name]}
                    contentStyle={{
                      borderRadius: "8px",
                      fontSize: "12px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground pointer-events-none">
                {healthTotal}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 flex-1">
              {[
                {
                  label: "Pendentes",
                  value: secPending - totalOverdue,
                  color: "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10",
                  textColor: "text-yellow-600 dark:text-yellow-400",
                  desc: "Aguardando ação",
                  modal: "pendentes" as ListModalType,
                },
                {
                  label: "Resolvidos",
                  value: secResolved,
                  color: "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10",
                  textColor: "text-emerald-600 dark:text-emerald-400",
                  desc: "Concluídos com sucesso",
                  modal: "resolvidos" as ListModalType,
                },
                {
                  label: "Atrasados",
                  value: totalOverdue,
                  color: "border-red-400 bg-red-50 dark:bg-red-900/10",
                  textColor: "text-red-600 dark:text-red-400",
                  desc: "Prazo vencido",
                  modal: "atrasados" as ListModalType,
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => setListModal(item.modal)}
                  className={`border-l-[3px] ${item.color} rounded-lg p-4 text-left transition-all hover:shadow-sm hover:-translate-y-0.5`}
                >
                  <p className={`text-2xl font-bold ${item.textColor}`}>{item.value}</p>
                  <p className="text-xs font-semibold text-foreground mt-1">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card filter modal (secretary_requests filtered) */}
      <Dialog open={!!cardFilter} onOpenChange={(open) => !open && setCardFilter(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{cardFilter ? cardFilterTitle[cardFilter] : ""}</DialogTitle>
          </DialogHeader>
          {(() => {
            const filtered = cardFilter === "pendentes" ? activeRequests
              : cardFilter === "resolvidos" ? resolvedRequests
              : cardFilter === "urgentes" ? activeRequests.filter(r => r.priority === "urgente")
              : cardFilter === "coordenacao" ? activeRequests.filter(r => r.origin === "coordenacao")
              : [];
            return filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma solicitação encontrada.</p>
            ) : (
              <div className="space-y-3 mt-2">
                {filtered.map((r: any) => {
                  const pri = PRIORITY_MAP[r.priority] || PRIORITY_MAP.media;
                  const st = STATUS_MAP[r.status] || STATUS_MAP.aberto;
                  return (
                    <div key={r.id} className="border border-border/60 rounded-lg p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{r.student_name || r.request_type}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary" className={pri.class + " text-[10px]"}>{pri.label}</Badge>
                          <Badge variant="secondary" className={st.class + " text-[10px]"}>{st.label}</Badge>
                          {r.origin === "coordenacao" && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 text-[10px]">
                              Coordenação
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(r.created_at), "dd/MM/yyyy")}
                          </span>
                        </div>
                        {r.description && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">💡 {r.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Secretary list modal (Saúde da Secretaria) */}
      <Dialog open={!!listModal} onOpenChange={(open) => !open && setListModal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{secModalTitle}</DialogTitle>
          </DialogHeader>
          {secModalList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma solicitação encontrada.</p>
          ) : (
            <div className="space-y-3 mt-2">
              {secModalList.map((r) => {
                const pri = PRIORITY_MAP[r.priority] || PRIORITY_MAP.media;
                const st = STATUS_MAP[r.status] || STATUS_MAP.aberto;
                const next = NEXT_STATUS[r.status];
                return (
                  <div key={r.id} className="border border-border/60 rounded-lg p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {r.student_name || "—"} — {r.request_type}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary" className={pri.class + " text-[10px]"}>
                          {pri.label}
                        </Badge>
                        <Badge variant="secondary" className={st.class + " text-[10px]"}>
                          {st.label}
                        </Badge>
                        {r.origin === "coordenacao" && (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 text-[10px]"
                          >
                            Coordenação
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(r.created_at), "dd/MM/yyyy")}
                        </span>
                      </div>
                    </div>
                    {next && (listModal === "pendentes" || listModal === "atrasados") && (
                      <button
                        onClick={() => advanceStatus.mutate({ id: r.id, newStatus: next })}
                        className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                      >
                        {next === "concluido" ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Resolver
                          </>
                        ) : (
                          <>→ {STATUS_MAP[next]?.label}</>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <RequestFormModal
        open={isRequestModalOpen}
        onOpenChange={setRequestModalOpen}
        onCreated={(id) => setClassifyId(id)}
      />
      <PriorityModal
        open={!!classifyId}
        onConfirm={(priority) => classifyId && classifyMutation.mutate({ id: classifyId, priority })}
        onCancel={() => setClassifyId(null)}
      />
      <AttendRequestModal
        open={!!attendRequest}
        onOpenChange={(open) => !open && setAttendRequest(null)}
        request={attendRequest}
      />
    </>
  );
};

export default SecretaryWorkQueue;

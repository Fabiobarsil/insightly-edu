import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import RoleLayout from "@/components/layout/RoleLayout";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import {
  AlertTriangle, TrendingDown, ShieldAlert, ClipboardList,
  User, ChevronRight, CheckCircle2, Clock, XCircle,
  BarChart3, Eye, FilePlus2, Bell
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import RequestFormModal from "@/components/secretaria/RequestFormModal";
import PriorityModal from "@/components/secretaria/PriorityModal";
import { toast } from "sonner";

/* ── mock interventions (no table yet) ── */
const mockInterventions = [
  { id: "1", student: "Ana Clara Silva", reason: "Queda contínua em Matemática", status: "aberto", date: "2026-04-10" },
  { id: "2", student: "João Pedro Souza", reason: "Faltas acima de 30%", status: "aberto", date: "2026-04-08" },
  { id: "3", student: "Maria Eduarda Lima", reason: "Indisciplina recorrente", status: "resolvido", date: "2026-03-25" },
];

/* ── mock performance trend ── */
const mockTrend = [
  { month: "Jan", media: 7.2 },
  { month: "Fev", media: 6.9 },
  { month: "Mar", media: 6.5 },
  { month: "Abr", media: 6.1 },
];

const CoordinationDashboard = () => {
  const navigate = useNavigate();
  const { schoolId } = useSchoolId();
  const queryClient = useQueryClient();
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  const [interventionsModalOpen, setInterventionsModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [classifyId, setClassifyId] = useState<string | null>(null);

  /* ── fetch resolved requests from coordination ── */
  const { data: resolvedRequests = [] } = useQuery({
    queryKey: ["coord-resolved-requests", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("secretary_requests")
        .select("*")
        .eq("school_id", schoolId)
        .eq("origin", "coordenacao")
        .eq("status", "concluido")
        .eq("resolved_notified", false)
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  /* ── fetch open coordination requests ── */
  const { data: openCoordRequests = [] } = useQuery({
    queryKey: ["coord-open-requests", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("secretary_requests")
        .select("*")
        .eq("school_id", schoolId)
        .eq("origin", "coordenacao")
        .neq("status", "concluido")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  const classifyMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: string }) => {
      const { error } = await supabase
        .from("secretary_requests")
        .update({ priority, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação enviada para a secretaria!");
      queryClient.invalidateQueries({ queryKey: ["coord-open-requests"] });
      queryClient.invalidateQueries({ queryKey: ["secretary-requests"] });
      setClassifyId(null);
    },
  });

  const dismissResolved = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("secretary_requests")
        .update({ resolved_notified: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coord-resolved-requests"] });
    },
  });

  /* ── fetch students ── */
  const { data: students = [] } = useQuery({
    queryKey: ["coord-students", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("students")
        .select("id, full_name, photo_url, status, class_id")
        .eq("school_id", schoolId)
        .eq("status", "ativo");
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  /* ── fetch attendance ── */
  const { data: attendance = [] } = useQuery({
    queryKey: ["coord-attendance", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("attendance")
        .select("student_id, status")
        .eq("school_id", schoolId);
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  /* ── fetch grades ── */
  const { data: grades = [] } = useQuery({
    queryKey: ["coord-grades", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("grades")
        .select("student_id, grade_value")
        .eq("school_id", schoolId);
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  /* ── computed risk data ── */
  const riskStudents = useMemo(() => {
    return students.map((s) => {
      const sAttendance = attendance.filter((a) => a.student_id === s.id);
      const totalAtt = sAttendance.length;
      const present = sAttendance.filter((a) => a.status === "presente").length;
      const freqPercent = totalAtt > 0 ? (present / totalAtt) * 100 : 100;

      const sGrades = grades.filter((g) => g.student_id === s.id && g.grade_value != null);
      const avg = sGrades.length > 0
        ? sGrades.reduce((sum, g) => sum + Number(g.grade_value), 0) / sGrades.length
        : null;

      const lowFreq = freqPercent < 75;
      const lowGrade = avg !== null && avg < 6;
      const atRisk = lowFreq || lowGrade;

      return { ...s, freqPercent, avg, lowFreq, lowGrade, atRisk };
    });
  }, [students, attendance, grades]);

  const atRiskList = riskStudents.filter((s) => s.atRisk);
  const lowGradeList = riskStudents.filter((s) => s.lowGrade);
  const lowFreqList = riskStudents.filter((s) => s.lowFreq);
  const alertsList = [...lowGradeList.map(s => ({ ...s, alertType: "nota" as const })), ...lowFreqList.map(s => ({ ...s, alertType: "frequencia" as const }))];
  const openInterventions = mockInterventions.filter((i) => i.status === "aberto");

  const widgets = [
    {
      icon: AlertTriangle,
      label: "Alunos em Risco",
      value: String(atRiskList.length),
      color: "text-destructive",
      bg: "bg-destructive/10",
      onClick: () => setRiskModalOpen(true),
    },
    {
      icon: TrendingDown,
      label: "Queda de Desempenho",
      value: String(lowGradeList.length),
      color: "text-warning-foreground",
      bg: "bg-warning/10",
      onClick: () => {},
    },
    {
      icon: ShieldAlert,
      label: "Alertas Automáticos",
      value: String(alertsList.length),
      color: "text-primary",
      bg: "bg-primary/10",
      onClick: () => setAlertsModalOpen(true),
    },
    {
      icon: ClipboardList,
      label: "Intervenções Abertas",
      value: String(openInterventions.length),
      color: "text-secondary",
      bg: "bg-secondary/10",
      onClick: () => setInterventionsModalOpen(true),
    },
  ];

  return (
    <RoleLayout title="Coordenação Pedagógica">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Coordenação Pedagógica</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Acompanhamento estratégico do desempenho escolar
            </p>
          </div>
          <Button onClick={() => setRequestModalOpen(true)} className="gap-2">
            <FilePlus2 className="h-4 w-4" />
            Nova Solicitação
          </Button>
        </div>

        {/* Resolved requests alerts */}
        {resolvedRequests.length > 0 && (
          <div className="flex flex-col gap-2">
            {resolvedRequests.map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 bg-secondary/10 border border-secondary/20 rounded-xl px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-secondary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Solicitação Resolvida</p>
                  <p className="text-xs text-muted-foreground">
                    {r.request_type} — {r.student_name || "Sem aluno"} foi concluída pela secretaria.
                  </p>
                </div>
                <button
                  onClick={() => dismissResolved.mutate(r.id)}
                  className="text-xs font-semibold text-secondary hover:underline shrink-0"
                >
                  Dispensar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Open coordination requests */}
        {openCoordRequests.length > 0 && (
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Minhas Solicitações à Secretaria ({openCoordRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {openCoordRequests.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3">
                    <Clock className="h-4 w-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.student_name || "Sem aluno"}</p>
                      <p className="text-[10px] text-muted-foreground">{r.request_type}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {r.status === "aberto" ? "Aberto" : "Em andamento"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {widgets.map((w) => (
            <button
              key={w.label}
              onClick={w.onClick}
              className="bg-card border border-border/50 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer text-left w-full"
            >
              <div className={`w-11 h-11 rounded-xl ${w.bg} flex items-center justify-center`}>
                <w.icon className={`h-5 w-5 ${w.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{w.value}</p>
                <p className="text-xs text-muted-foreground">{w.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Main panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk students panel */}
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Alunos em Risco
              </CardTitle>
            </CardHeader>
            <CardContent>
              {atRiskList.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum aluno em risco identificado.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {atRiskList.slice(0, 5).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => navigate(`/admin/alunos/${s.id}`)}
                      className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors text-left w-full"
                    >
                      <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{s.full_name}</p>
                        <div className="flex gap-2 mt-0.5">
                          {s.lowFreq && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-semibold">
                              Freq: {s.freqPercent.toFixed(0)}%
                            </span>
                          )}
                          {s.lowGrade && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning-foreground font-semibold">
                              Média: {s.avg?.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                  {atRiskList.length > 5 && (
                    <button
                      onClick={() => setRiskModalOpen(true)}
                      className="text-xs text-primary font-semibold mt-1 hover:underline text-left"
                    >
                      Ver todos ({atRiskList.length})
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance trend chart */}
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-warning-foreground" />
                Evolução de Desempenho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={mockTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="media"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "hsl(var(--destructive))" }}
                    name="Média Geral"
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-2">
                Tendência de queda na média geral dos últimos 4 meses (dados ilustrativos)
              </p>
            </CardContent>
          </Card>

          {/* Alerts panel */}
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Alertas Automáticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alertsList.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum alerta no momento.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {alertsList.slice(0, 5).map((a, i) => (
                    <button
                      key={`${a.id}-${a.alertType}-${i}`}
                      onClick={() => navigate(`/admin/alunos/${a.id}`)}
                      className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors text-left w-full"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${a.alertType === "nota" ? "bg-warning/10" : "bg-destructive/10"}`}>
                        {a.alertType === "nota" ? (
                          <TrendingDown className="h-4 w-4 text-warning-foreground" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{a.full_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {a.alertType === "nota"
                            ? `Média abaixo de 6 (${a.avg?.toFixed(1)})`
                            : `Frequência abaixo de 75% (${a.freqPercent.toFixed(0)}%)`}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                  {alertsList.length > 5 && (
                    <button
                      onClick={() => setAlertsModalOpen(true)}
                      className="text-xs text-primary font-semibold mt-1 hover:underline text-left"
                    >
                      Ver todos ({alertsList.length})
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interventions panel */}
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-secondary" />
                Intervenções Pedagógicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {mockInterventions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setInterventionsModalOpen(true)}
                    className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors text-left w-full"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.status === "aberto" ? "bg-warning/10" : "bg-secondary/10"}`}>
                      {item.status === "aberto" ? (
                        <Clock className="h-4 w-4 text-warning-foreground" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-secondary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.student}</p>
                      <p className="text-[10px] text-muted-foreground">{item.reason}</p>
                    </div>
                    <Badge variant={item.status === "aberto" ? "destructive" : "secondary"} className="text-[10px]">
                      {item.status === "aberto" ? "Aberto" : "Resolvido"}
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Risk students modal ── */}
      <Dialog open={riskModalOpen} onOpenChange={setRiskModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Alunos em Risco ({atRiskList.length})
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="flex flex-col gap-2 pr-2">
              {atRiskList.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setRiskModalOpen(false); navigate(`/admin/alunos/${s.id}`); }}
                  className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors text-left w-full"
                >
                  <User className="h-4 w-4 text-destructive" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.full_name}</p>
                    <div className="flex gap-2 mt-0.5">
                      {s.lowFreq && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-semibold">Freq: {s.freqPercent.toFixed(0)}%</span>}
                      {s.lowGrade && <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning-foreground font-semibold">Média: {s.avg?.toFixed(1)}</span>}
                    </div>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ── Alerts modal ── */}
      <Dialog open={alertsModalOpen} onOpenChange={setAlertsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Alertas Automáticos ({alertsList.length})
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="flex flex-col gap-2 pr-2">
              {alertsList.map((a, i) => (
                <button
                  key={`${a.id}-${a.alertType}-${i}`}
                  onClick={() => { setAlertsModalOpen(false); navigate(`/admin/alunos/${a.id}`); }}
                  className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors text-left w-full"
                >
                  {a.alertType === "nota" ? (
                    <TrendingDown className="h-4 w-4 text-warning-foreground" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {a.alertType === "nota" ? `Média: ${a.avg?.toFixed(1)}` : `Frequência: ${a.freqPercent.toFixed(0)}%`}
                    </p>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ── Interventions modal ── */}
      <Dialog open={interventionsModalOpen} onOpenChange={setInterventionsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-secondary" />
              Intervenções Pedagógicas
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="flex flex-col gap-2 pr-2">
              {mockInterventions.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3"
                >
                  {item.status === "aberto" ? (
                    <Clock className="h-4 w-4 text-warning-foreground" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-secondary" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.student}</p>
                    <p className="text-[10px] text-muted-foreground">{item.reason}</p>
                    <p className="text-[10px] text-muted-foreground">{item.date}</p>
                  </div>
                  <Badge variant={item.status === "aberto" ? "destructive" : "secondary"} className="text-[10px]">
                    {item.status === "aberto" ? "Aberto" : "Resolvido"}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </RoleLayout>
  );
};

export default CoordinationDashboard;

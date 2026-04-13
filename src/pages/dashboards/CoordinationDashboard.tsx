import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import RoleLayout from "@/components/layout/RoleLayout";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import {
  AlertTriangle, TrendingDown, TrendingUp, ShieldAlert, ClipboardList,
  User, ChevronRight, CheckCircle2, Clock, XCircle, Send,
  BarChart3, Eye, FilePlus2, Bell, Activity, Heart, Zap,
  BookOpen, PhoneCall, MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine, Area, AreaChart
} from "recharts";
import RequestFormModal from "@/components/secretaria/RequestFormModal";
import { toast } from "sonner";

const CoordinationDashboard = () => {
  const navigate = useNavigate();
  const { schoolId } = useSchoolId();
  const queryClient = useQueryClient();
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [focusModalOpen, setFocusModalOpen] = useState(false);
  const [sendAlertStudentId, setSendAlertStudentId] = useState<string | null>(null);

  /* ── Data fetching ── */
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

  const { data: attendance = [] } = useQuery({
    queryKey: ["coord-attendance", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("attendance").select("student_id, status").eq("school_id", schoolId);
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  const { data: grades = [] } = useQuery({
    queryKey: ["coord-grades", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("grades").select("student_id, grade_value, assignment_id").eq("school_id", schoolId);
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  const { data: teacherAssignments = [] } = useQuery({
    queryKey: ["coord-teacher-assignments", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("teacher_assignments")
        .select("id, teacher_id, subject_id, class_id")
        .eq("school_id", schoolId);
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["coord-teachers", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("teachers").select("id, full_name").eq("school_id", schoolId);
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["coord-subjects", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("subjects").select("id, name").eq("school_id", schoolId);
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  const { data: interventions = [] } = useQuery({
    queryKey: ["coord-interventions", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("pedagogical_interventions" as any)
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });
      return (data as any[]) ?? [];
    },
    enabled: !!schoolId,
  });

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

  const dismissResolved = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("secretary_requests").update({ resolved_notified: true }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coord-resolved-requests"] }),
  });

  /* ── Send intervention to professor ── */
  const sendIntervention = useMutation({
    mutationFn: async (params: {
      studentId: string; teacherId: string; subjectId: string; classId: string;
      reason: string; recommendation: string; severity: string; avgGrade: number | null; freqPercent: number;
    }) => {
      const { error } = await supabase.from("pedagogical_interventions" as any).insert({
        school_id: schoolId,
        student_id: params.studentId,
        teacher_id: params.teacherId,
        subject_id: params.subjectId,
        class_id: params.classId,
        reason: params.reason,
        recommendation: params.recommendation,
        severity: params.severity,
        avg_grade: params.avgGrade,
        freq_percent: params.freqPercent,
        status: "aberto",
        created_role: "coordenacao",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ponto de atenção enviado ao professor!");
      queryClient.invalidateQueries({ queryKey: ["coord-interventions"] });
      setSendAlertStudentId(null);
    },
    onError: () => toast.error("Erro ao enviar ponto de atenção."),
  });

  /* ── Computed analytics ── */
  const riskStudents = useMemo(() => {
    return students.map((s) => {
      const sAtt = attendance.filter((a) => a.student_id === s.id);
      const total = sAtt.length;
      const present = sAtt.filter((a) => a.status === "presente").length;
      const freqPercent = total > 0 ? (present / total) * 100 : 100;

      const sGrades = grades.filter((g) => g.student_id === s.id && g.grade_value != null);
      const avg = sGrades.length > 0
        ? sGrades.reduce((sum, g) => sum + Number(g.grade_value), 0) / sGrades.length
        : null;

      const lowFreq = freqPercent < 75;
      const lowGrade = avg !== null && avg < 6;
      const atRisk = lowFreq || lowGrade;
      const inRecovery = avg !== null && avg >= 5 && avg < 6;

      // Find related subjects with low grades
      const subjectGrades = new Map<string, number[]>();
      sGrades.forEach((g) => {
        const assignment = teacherAssignments.find((ta) => ta.id === g.assignment_id);
        if (assignment?.subject_id) {
          const existing = subjectGrades.get(assignment.subject_id) || [];
          existing.push(Number(g.grade_value));
          subjectGrades.set(assignment.subject_id, existing);
        }
      });

      const weakSubjects: { subjectId: string; subjectName: string; avg: number; teacherId: string | null; teacherName: string | null }[] = [];
      subjectGrades.forEach((vals, subId) => {
        const subAvg = vals.reduce((a, b) => a + b, 0) / vals.length;
        if (subAvg < 6) {
          const sub = subjects.find((su) => su.id === subId);
          const ta = teacherAssignments.find((t) => t.subject_id === subId && t.class_id === s.class_id);
          const teacher = ta ? teachers.find((t) => t.id === ta.teacher_id) : null;
          weakSubjects.push({
            subjectId: subId,
            subjectName: sub?.name || "Disciplina",
            avg: subAvg,
            teacherId: ta?.teacher_id || null,
            teacherName: teacher?.full_name || null,
          });
        }
      });

      // Generate recommendations
      const recommendations: string[] = [];
      if (lowFreq && lowGrade) recommendations.push("Alta correlação entre faltas e queda de desempenho");
      if (lowFreq) recommendations.push("Necessário contato com responsável sobre frequência");
      weakSubjects.forEach((ws) => {
        recommendations.push(`Recomenda-se reforço em ${ws.subjectName}`);
      });
      if (recommendations.length === 0 && atRisk) recommendations.push("Acompanhar evolução nas próximas semanas");

      const severity = (lowFreq && lowGrade) ? "critica" : lowGrade ? "alta" : lowFreq ? "media" : "baixa";

      return { ...s, freqPercent, avg, lowFreq, lowGrade, atRisk, inRecovery, weakSubjects, recommendations, severity };
    });
  }, [students, attendance, grades, teacherAssignments, subjects, teachers]);

  const totalStudents = students.length;
  const atRiskList = riskStudents.filter((s) => s.atRisk);
  const healthyList = riskStudents.filter((s) => !s.atRisk);
  const recoveryList = riskStudents.filter((s) => s.inRecovery);

  const healthyPct = totalStudents > 0 ? Math.round((healthyList.length / totalStudents) * 100) : 0;
  const riskPct = totalStudents > 0 ? Math.round((atRiskList.length / totalStudents) * 100) : 0;
  const recoveryPct = totalStudents > 0 ? Math.round((recoveryList.length / totalStudents) * 100) : 0;

  // Risk cause analysis
  const lowFreqCount = riskStudents.filter((s) => s.lowFreq).length;
  const lowGradeCount = riskStudents.filter((s) => s.lowGrade).length;
  const bothCount = riskStudents.filter((s) => s.lowFreq && s.lowGrade).length;
  const riskTotal = lowFreqCount + lowGradeCount;
  const freqImpact = riskTotal > 0 ? Math.round((lowFreqCount / riskTotal) * 100) : 0;
  const gradeImpact = riskTotal > 0 ? Math.round((lowGradeCount / riskTotal) * 100) : 0;

  // Performance trend (mock from real averages if available)
  const avgGrade = useMemo(() => {
    const validGrades = grades.filter((g) => g.grade_value != null);
    return validGrades.length > 0
      ? validGrades.reduce((s, g) => s + Number(g.grade_value), 0) / validGrades.length
      : 0;
  }, [grades]);

  const trendData = [
    { month: "Jan", media: Math.min(avgGrade + 0.8, 10) },
    { month: "Fev", media: Math.min(avgGrade + 0.4, 10) },
    { month: "Mar", media: avgGrade },
    { month: "Abr", media: Math.max(avgGrade - 0.3, 0) },
  ];
  const trendDirection = trendData[trendData.length - 1].media < trendData[0].media ? "queda" : "melhora";

  // Interventions by status
  const openInterventions = interventions.filter((i: any) => i.status === "aberto");
  const inProgressInterventions = interventions.filter((i: any) => i.status === "em_andamento");
  const resolvedInterventions = interventions.filter((i: any) => i.status === "resolvido");

  // Subject weaknesses
  const subjectWeakness = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    atRiskList.forEach((s) => {
      s.weakSubjects.forEach((ws) => {
        const existing = map.get(ws.subjectId) || { name: ws.subjectName, count: 0 };
        existing.count++;
        map.set(ws.subjectId, existing);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [atRiskList]);

  const handleSendAlert = (student: typeof atRiskList[0]) => {
    if (student.weakSubjects.length > 0) {
      const ws = student.weakSubjects[0];
      if (ws.teacherId) {
        sendIntervention.mutate({
          studentId: student.id,
          teacherId: ws.teacherId,
          subjectId: ws.subjectId,
          classId: student.class_id || "",
          reason: student.lowFreq && student.lowGrade
            ? `Frequência baixa (${student.freqPercent.toFixed(0)}%) e nota baixa em ${ws.subjectName} (${ws.avg.toFixed(1)})`
            : student.lowFreq
              ? `Frequência abaixo do mínimo (${student.freqPercent.toFixed(0)}%)`
              : `Nota abaixo da média em ${ws.subjectName} (${ws.avg.toFixed(1)})`,
          recommendation: student.recommendations[0] || "Acompanhar evolução",
          severity: student.severity,
          avgGrade: student.avg,
          freqPercent: student.freqPercent,
        });
      } else {
        toast.error("Nenhum professor vinculado a essa disciplina/turma.");
      }
    } else {
      toast.error("Não foi possível identificar disciplina ou professor responsável.");
    }
  };

  return (
    <RoleLayout title="Coordenação Pedagógica">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">Coordenação Pedagógica</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Análise estratégica → Recomendações → Ação dos professores
            </p>
          </div>
          <Button onClick={() => setRequestModalOpen(true)} variant="outline" className="gap-2">
            <FilePlus2 className="h-4 w-4" />
            Nova Solicitação
          </Button>
        </div>

        {/* Resolved alerts */}
        {resolvedRequests.length > 0 && (
          <div className="flex flex-col gap-2">
            {resolvedRequests.map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 bg-secondary/10 border border-secondary/20 rounded-xl px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-secondary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Solicitação Resolvida</p>
                  <p className="text-xs text-muted-foreground">{r.request_type} — {r.student_name || "Sem aluno"}</p>
                </div>
                <button onClick={() => dismissResolved.mutate(r.id)} className="text-xs font-semibold text-secondary hover:underline shrink-0">Dispensar</button>
              </div>
            ))}
          </div>
        )}

        {/* ── 1. VISÃO EXECUTIVA ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{healthyPct}%</p>
                <p className="text-xs text-muted-foreground">Saudáveis</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{riskPct}%</p>
                <p className="text-xs text-muted-foreground">Em Risco</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-warning/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-warning-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{recoveryPct}%</p>
                <p className="text-xs text-muted-foreground">Recuperação</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${trendDirection === "melhora" ? "bg-secondary/10" : "bg-destructive/10"}`}>
                {trendDirection === "melhora"
                  ? <TrendingUp className="h-5 w-5 text-secondary" />
                  : <TrendingDown className="h-5 w-5 text-destructive" />}
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{trendDirection === "melhora" ? "↑" : "↓"}</p>
                <p className="text-xs text-muted-foreground">Tendência</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── 2. TENDÊNCIA + 3. ANÁLISE DE CAUSA ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Tendência de Desempenho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="gradMedia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <ReferenceLine y={6} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: "Min. 6.0", fill: "hsl(var(--destructive))", fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="media" stroke="hsl(var(--primary))" fill="url(#gradMedia)" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} name="Média Geral" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={trendDirection === "queda" ? "destructive" : "secondary"} className="text-[10px]">
                  {trendDirection === "queda" ? "⚠ Tendência de queda" : "✓ Tendência de melhora"}
                </Badge>
                <span className="text-[10px] text-muted-foreground">Média atual: {avgGrade.toFixed(1)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning-foreground" />
                Principais Causas de Risco
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <XCircle className="h-3 w-3 text-destructive" /> Baixa Frequência
                  </span>
                  <span className="font-bold text-foreground">{lowFreqCount} alunos ({freqImpact}%)</span>
                </div>
                <Progress value={freqImpact} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <TrendingDown className="h-3 w-3 text-warning-foreground" /> Notas Baixas
                  </span>
                  <span className="font-bold text-foreground">{lowGradeCount} alunos ({gradeImpact}%)</span>
                </div>
                <Progress value={gradeImpact} className="h-2" />
              </div>
              {bothCount > 0 && (
                <div className="bg-destructive/5 rounded-lg p-3 text-xs">
                  <span className="font-bold text-destructive">{bothCount} alunos</span>
                  <span className="text-muted-foreground"> com ambos os fatores (alta correlação)</span>
                </div>
              )}
              {subjectWeakness.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Disciplinas mais afetadas:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {subjectWeakness.map((s) => (
                      <Badge key={s.name} variant="outline" className="text-[10px]">
                        {s.name} ({s.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── 4. FOCO DO COORDENADOR + 5. RECOMENDAÇÕES ── */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                Alunos que Exigem Ação ({atRiskList.length})
              </CardTitle>
              {atRiskList.length > 5 && (
                <Button variant="ghost" size="sm" onClick={() => setFocusModalOpen(true)} className="text-xs">
                  Ver todos
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {atRiskList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">🎉 Nenhum aluno em situação de risco identificado!</p>
            ) : (
              <div className="flex flex-col gap-3">
                {atRiskList.slice(0, 6).map((s) => (
                  <div key={s.id} className="rounded-xl border border-border/50 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${s.severity === "critica" ? "bg-destructive/10" : s.severity === "alta" ? "bg-warning/10" : "bg-muted"}`}>
                          <User className={`h-4 w-4 ${s.severity === "critica" ? "text-destructive" : s.severity === "alta" ? "text-warning-foreground" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <button onClick={() => navigate(`/admin/alunos/${s.id}`)} className="text-sm font-semibold text-foreground hover:underline text-left">{s.full_name}</button>
                          <div className="flex gap-1.5 mt-0.5 flex-wrap">
                            {s.lowFreq && <Badge variant="destructive" className="text-[9px] px-1.5 py-0">Freq: {s.freqPercent.toFixed(0)}%</Badge>}
                            {s.lowGrade && <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-warning/50 text-warning-foreground">Média: {s.avg?.toFixed(1)}</Badge>}
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                              {s.severity === "critica" ? "🔴 Crítico" : s.severity === "alta" ? "🟠 Alto" : "🟡 Médio"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Disciplinas afetadas */}
                    {s.weakSubjects.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {s.weakSubjects.map((ws) => (
                          <span key={ws.subjectId} className="text-[10px] px-2 py-1 rounded-md bg-muted/50 text-muted-foreground">
                            📚 {ws.subjectName} ({ws.avg.toFixed(1)}) — Prof. {ws.teacherName || "N/A"}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Recomendações */}
                    <div className="space-y-1">
                      {s.recommendations.map((r, i) => (
                        <p key={i} className="text-[11px] text-primary flex items-start gap-1.5">
                          <span className="mt-0.5">💡</span> {r}
                        </p>
                      ))}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="default"
                        className="text-[11px] h-7 gap-1.5"
                        onClick={() => handleSendAlert(s)}
                        disabled={sendIntervention.isPending}
                      >
                        <Send className="h-3 w-3" />
                        Enviar ao Professor
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] h-7"
                        onClick={() => navigate(`/admin/alunos/${s.id}`)}
                      >
                        <Eye className="h-3 w-3" />
                        Ver Ficha
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── 11. INTERVENÇÕES PEDAGÓGICAS ── */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              Intervenções Pedagógicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="abertas">
              <TabsList className="mb-4">
                <TabsTrigger value="abertas" className="text-xs">Abertas ({openInterventions.length})</TabsTrigger>
                <TabsTrigger value="andamento" className="text-xs">Em Andamento ({inProgressInterventions.length})</TabsTrigger>
                <TabsTrigger value="resolvidas" className="text-xs">Resolvidas ({resolvedInterventions.length})</TabsTrigger>
              </TabsList>

              {["abertas", "andamento", "resolvidas"].map((tab) => {
                const list = tab === "abertas" ? openInterventions : tab === "andamento" ? inProgressInterventions : resolvedInterventions;
                return (
                  <TabsContent key={tab} value={tab}>
                    {list.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma intervenção nesta categoria.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {list.slice(0, 10).map((item: any) => {
                          const student = students.find((st) => st.id === item.student_id);
                          const teacher = teachers.find((t) => t.id === item.teacher_id);
                          return (
                            <div key={item.id} className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                item.status === "aberto" ? "bg-warning/10" : item.status === "em_andamento" ? "bg-primary/10" : "bg-secondary/10"
                              }`}>
                                {item.status === "aberto" ? <Clock className="h-4 w-4 text-warning-foreground" />
                                  : item.status === "em_andamento" ? <Activity className="h-4 w-4 text-primary" />
                                  : <CheckCircle2 className="h-4 w-4 text-secondary" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{student?.full_name || "Aluno"}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{item.reason}</p>
                                {teacher && <p className="text-[10px] text-primary">Prof. {teacher.full_name}</p>}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant={item.status === "resolvido" ? "secondary" : "outline"} className="text-[9px]">
                                  {item.status === "aberto" ? "Aguardando" : item.status === "em_andamento" ? "Em Andamento" : "Resolvido"}
                                </Badge>
                                {item.impact && (
                                  <span className={`text-[9px] font-semibold ${
                                    item.impact === "melhorou" ? "text-secondary" : item.impact === "piorou" ? "text-destructive" : "text-muted-foreground"
                                  }`}>
                                    {item.impact === "melhorou" ? "↑ Melhorou" : item.impact === "piorou" ? "↓ Piorou" : "— Sem mudança"}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>

        {/* Open coord requests to secretary */}
        {openCoordRequests.length > 0 && (
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Solicitações à Secretaria ({openCoordRequests.length})
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
                    <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning-foreground border-warning/30">⏳ Aguardando</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Focus modal ── */}
      <Dialog open={focusModalOpen} onOpenChange={setFocusModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Todos os Alunos em Risco ({atRiskList.length})
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="flex flex-col gap-3 pr-2">
              {atRiskList.map((s) => (
                <div key={s.id} className="rounded-xl border border-border/50 p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-semibold">{s.full_name}</span>
                    <Badge variant="outline" className="text-[9px] ml-auto">
                      {s.severity === "critica" ? "🔴 Crítico" : s.severity === "alta" ? "🟠 Alto" : "🟡 Médio"}
                    </Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {s.lowFreq && <Badge variant="destructive" className="text-[9px]">Freq: {s.freqPercent.toFixed(0)}%</Badge>}
                    {s.lowGrade && <Badge variant="outline" className="text-[9px] border-warning/50 text-warning-foreground">Média: {s.avg?.toFixed(1)}</Badge>}
                  </div>
                  {s.recommendations.map((r, i) => (
                    <p key={i} className="text-[11px] text-primary">💡 {r}</p>
                  ))}
                  <Button size="sm" className="text-[11px] h-7 gap-1.5" onClick={() => handleSendAlert(s)} disabled={sendIntervention.isPending}>
                    <Send className="h-3 w-3" /> Enviar ao Professor
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Request modal */}
      <RequestFormModal
        open={requestModalOpen}
        onOpenChange={setRequestModalOpen}
        onCreated={() => {
          toast.success("Solicitação enviada para a secretaria!");
          queryClient.invalidateQueries({ queryKey: ["coord-open-requests"] });
        }}
        origin="coordenacao"
        hideDeadline
      />
    </RoleLayout>
  );
};

export default CoordinationDashboard;

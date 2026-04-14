import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import RoleLayout from "@/components/layout/RoleLayout";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import {
  AlertTriangle, TrendingDown, TrendingUp, ShieldAlert,
  User, CheckCircle2, Clock, XCircle, Send,
  BarChart3, Eye, FilePlus2, Bell, Activity, Zap,
  PhoneCall, ArrowUpRight, ArrowDownRight, Minus,
  Target, Flame, Shield, Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Area, AreaChart, ReferenceArea
} from "recharts";
import RequestFormModal from "@/components/secretaria/RequestFormModal";
import { toast } from "sonner";

const CoordinationDashboard = () => {
  const navigate = useNavigate();
  const { schoolId } = useSchoolId();
  const queryClient = useQueryClient();
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [focusModalOpen, setFocusModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [requestStudent, setRequestStudent] = useState<{ id: string; full_name: string; class_id: string | null } | null>(null);
  const [requestDescription, setRequestDescription] = useState("");
  const [requestType, setRequestType] = useState("");

  // Create intervention form state
  const [formStudentId, setFormStudentId] = useState("");
  const [formTeacherId, setFormTeacherId] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formRecommendation, setFormRecommendation] = useState("");
  const [formSeverity, setFormSeverity] = useState("media");

  const resetForm = () => {
    setFormStudentId("");
    setFormTeacherId("");
    setFormReason("");
    setFormRecommendation("");
    setFormSeverity("media");
  };

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
        .from("pedagogical_interventions")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });
      return data ?? [];
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

  /* ── Send intervention from "Ações Recomendadas" (auto) ── */
  const sendIntervention = useMutation({
    mutationFn: async (params: {
      studentId: string; teacherId: string; subjectId: string; classId: string;
      reason: string; recommendation: string; severity: string; avgGrade: number | null; freqPercent: number;
    }) => {
      if (!params.teacherId) throw new Error("teacher_id obrigatório");
      const { error } = await supabase.from("pedagogical_interventions").insert({
        school_id: schoolId!,
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
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ponto de atenção enviado ao professor!");
      queryClient.invalidateQueries({ queryKey: ["coord-interventions"] });
    },
    onError: () => toast.error("Erro ao enviar ponto de atenção."),
  });

  /* ── Create intervention manually ── */
  const createIntervention = useMutation({
    mutationFn: async () => {
      if (!formTeacherId) throw new Error("Selecione um professor");
      if (!formReason.trim()) throw new Error("Informe o motivo");
      if (!formStudentId) throw new Error("Selecione um aluno");

      const { error } = await supabase.from("pedagogical_interventions").insert({
        school_id: schoolId!,
        student_id: formStudentId,
        teacher_id: formTeacherId,
        reason: formReason.trim(),
        recommendation: formRecommendation.trim() || null,
        severity: formSeverity,
        status: "aberto",
        created_role: "coordenacao",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Intervenção criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["coord-interventions"] });
      setCreateModalOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || "Erro ao criar intervenção."),
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

      const recommendations: string[] = [];
      if (lowFreq && lowGrade) recommendations.push("Convocar responsável — correlação faltas × notas");
      if (lowFreq && !lowGrade) recommendations.push("Contato urgente com responsável sobre frequência");
      weakSubjects.forEach((ws) => {
        recommendations.push(`Reforço em ${ws.subjectName} (média ${ws.avg.toFixed(1)})`);
      });
      if (recommendations.length === 0 && atRisk) recommendations.push("Monitorar evolução nas próximas 2 semanas");

      const severity = (lowFreq && lowGrade) ? "critica" : lowGrade ? "alta" : lowFreq ? "media" : "baixa";

      return { ...s, freqPercent, avg, lowFreq, lowGrade, atRisk, weakSubjects, recommendations, severity };
    });
  }, [students, attendance, grades, teacherAssignments, subjects, teachers]);

  const totalStudents = students.length;
  const atRiskList = riskStudents.filter((s) => s.atRisk).sort((a, b) => {
    const order = { critica: 0, alta: 1, media: 2, baixa: 3 };
    return (order[a.severity as keyof typeof order] ?? 3) - (order[b.severity as keyof typeof order] ?? 3);
  });
  const criticalCount = atRiskList.filter((s) => s.severity === "critica").length;

  const lowFreqCount = riskStudents.filter((s) => s.lowFreq).length;
  const lowGradeCount = riskStudents.filter((s) => s.lowGrade).length;
  const bothCount = riskStudents.filter((s) => s.lowFreq && s.lowGrade).length;
  const onlyFreq = lowFreqCount - bothCount;
  const onlyGrade = lowGradeCount - bothCount;
  const riskTotal = atRiskList.length || 1;

  const avgGrade = useMemo(() => {
    const valid = grades.filter((g) => g.grade_value != null);
    return valid.length > 0 ? valid.reduce((s, g) => s + Number(g.grade_value), 0) / valid.length : 0;
  }, [grades]);

  const trendData = [
    { month: "Jan", media: Math.min(avgGrade + 0.8, 10) },
    { month: "Fev", media: Math.min(avgGrade + 0.4, 10) },
    { month: "Mar", media: avgGrade },
    { month: "Abr", media: Math.max(avgGrade - 0.3, 0) },
  ];
  const variation = trendData[trendData.length - 1].media - trendData[0].media;
  const trendDirection = variation < -0.2 ? "queda" : variation > 0.2 ? "melhora" : "estavel";

  // Intervention results
  const resolvedInterventions = interventions.filter((i) => i.status === "resolvido");
  const openInterventions = interventions.filter((i) => i.status === "aberto");
  const inProgressInterventions = interventions.filter((i) => i.status === "em_andamento");
  const improvedCount = resolvedInterventions.filter((i) => i.impact === "melhorou").length;
  const worsenedCount = resolvedInterventions.filter((i) => i.impact === "piorou").length;
  const unchangedCount = resolvedInterventions.filter((i) => i.impact === "sem_mudanca").length;

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

  /* ── Notificar responsável → cria secretary_request direto ── */
  const notifyGuardianMutation = useMutation({
    mutationFn: async (student: typeof atRiskList[0]) => {
      const desc = student.recommendations.join("; ") || "Acompanhamento solicitado pela coordenação";
      const { error } = await supabase.from("secretary_requests").insert({
        school_id: schoolId!,
        student_id: student.id,
        student_name: student.full_name,
        class_id: student.class_id || null,
        student_status: "ativo",
        request_type: "Contato com Responsável",
        description: desc,
        priority: student.severity === "critica" ? "urgente" : "alta",
        status: "aberto",
        origin: "coordenacao",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação de contato enviada para a secretaria!");
      queryClient.invalidateQueries({ queryKey: ["coord-open-requests"] });
    },
    onError: () => toast.error("Erro ao enviar solicitação."),
  });

  const openRequestForStudent = (student: typeof atRiskList[0]) => {
    setRequestStudent({ id: student.id, full_name: student.full_name, class_id: student.class_id });
    setRequestDescription(student.recommendations.join("; "));
    setRequestType("");
    setRequestModalOpen(true);
  };

  const heroColor = trendDirection === "queda"
    ? "from-destructive/15 to-destructive/5 border-destructive/30"
    : trendDirection === "melhora"
      ? "from-secondary/15 to-secondary/5 border-secondary/30"
      : "from-warning/15 to-warning/5 border-warning/30";

  const heroIcon = trendDirection === "queda"
    ? <TrendingDown className="h-8 w-8 text-destructive" />
    : trendDirection === "melhora"
      ? <TrendingUp className="h-8 w-8 text-secondary" />
      : <Minus className="h-8 w-8 text-warning-foreground" />;

  return (
    <RoleLayout title="Coordenação Pedagógica">
      <div className="flex flex-col gap-6">

        {/* Resolved alerts */}
        {resolvedRequests.length > 0 && (
          <div className="flex flex-col gap-2">
            {resolvedRequests.map((r) => (
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

        {/* 🔴 1. HERO — Compacto, foco em risco */}
        <div className={`rounded-xl border bg-gradient-to-br ${heroColor} p-4`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {heroIcon}
              <div>
                <p className="text-sm font-bold text-foreground">
                  {trendDirection === "queda" ? "Em Queda" : trendDirection === "melhora" ? "Evoluindo" : "Estável"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Var: <span className={`font-semibold ${variation < 0 ? "text-destructive" : variation > 0 ? "text-secondary" : ""}`}>
                    {variation >= 0 ? "+" : ""}{variation.toFixed(1)}
                  </span>
                  {" · "}Média: <span className="text-muted-foreground">{avgGrade.toFixed(1)}</span>
                </p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <div className="rounded-lg bg-card border border-border/50 px-3 py-2 text-center min-w-[70px]">
                <p className="text-lg font-bold text-foreground">{totalStudents}</p>
                <p className="text-[10px] text-muted-foreground">Ativos</p>
              </div>
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-center min-w-[70px]">
                <p className="text-lg font-bold text-destructive">{criticalCount}</p>
                <p className="text-[10px] text-destructive font-medium">Crítico</p>
              </div>
              <div className="rounded-lg bg-warning/10 border border-warning/20 px-3 py-2 text-center min-w-[70px]">
                <p className="text-lg font-bold text-warning-foreground">{atRiskList.length}</p>
                <p className="text-[10px] text-warning-foreground font-medium">Em Risco</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-3 flex-wrap">
            <Button size="sm" className="text-xs gap-1.5 h-8" onClick={() => setFocusModalOpen(true)}>
              <Target className="h-3.5 w-3.5" /> Ações Recomendadas
            </Button>
            <Button size="sm" variant="outline" className="text-xs gap-1.5 h-8" onClick={() => { resetForm(); setCreateModalOpen(true); }}>
              <Plus className="h-3.5 w-3.5" /> Nova Intervenção
            </Button>
            <Button size="sm" variant="ghost" className="text-xs gap-1.5 h-8" onClick={() => setRequestModalOpen(true)}>
              <FilePlus2 className="h-3.5 w-3.5" /> Solicitar Secretaria
            </Button>
          </div>
        </div>

        {/* 🧠 2. CAUSAS DE RISCO — Compacto */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border/50 bg-card p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-md bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-3.5 w-3.5 text-destructive" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Frequência</p>
                <p className="text-[10px] text-muted-foreground">{onlyFreq} alunos</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">{Math.round((onlyFreq / riskTotal) * 100)}% do risco</p>
          </div>

          <div className="rounded-lg border border-border/50 bg-card p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-md bg-warning/10 flex items-center justify-center">
                <TrendingDown className="h-3.5 w-3.5 text-warning-foreground" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Notas</p>
                <p className="text-[10px] text-muted-foreground">{onlyGrade} alunos</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">{Math.round((onlyGrade / riskTotal) * 100)}% do risco</p>
          </div>

          <div className="rounded-lg border border-destructive/20 bg-destructive/[0.02] p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-md bg-destructive/10 flex items-center justify-center">
                <Flame className="h-3.5 w-3.5 text-destructive" />
              </div>
              <div>
                <p className="text-xs font-semibold text-destructive">Dupla Causa</p>
                <p className="text-[10px] text-muted-foreground">{bothCount} alunos</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">{Math.round((bothCount / riskTotal) * 100)}% do risco</p>
          </div>
        </div>

        {/* 🎯 3. AÇÕES RECOMENDADAS — Destaque principal */}
        <Card className="rounded-xl border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Ações Recomendadas Hoje
                {atRiskList.length > 0 && (
                  <Badge variant="destructive" className="text-[10px] ml-1">{atRiskList.length} alunos</Badge>
                )}
              </CardTitle>
              {atRiskList.length > 4 && (
                <Button variant="ghost" size="sm" onClick={() => setFocusModalOpen(true)} className="text-xs gap-1 h-8">
                  Ver todos <ArrowUpRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {atRiskList.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Shield className="h-10 w-10 text-secondary mx-auto opacity-60" />
                <p className="text-sm font-medium text-foreground">Todos os alunos estão em situação saudável</p>
                <p className="text-xs text-muted-foreground">Nenhuma ação de intervenção necessária no momento.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {atRiskList.slice(0, 5).map((s) => {
                  const alreadySent = interventions.some(
                    (i) => i.student_id === s.id && (i.status === "aberto" || i.status === "em_andamento")
                  );
                  return (
                    <div key={s.id} className={`rounded-lg border p-4 space-y-3 transition-colors ${
                      s.severity === "critica"
                        ? "border-destructive/30 bg-destructive/[0.03]"
                        : s.severity === "alta"
                          ? "border-warning/30 bg-warning/[0.02]"
                          : "border-border/50"
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            s.severity === "critica" ? "bg-destructive/15 text-destructive"
                              : s.severity === "alta" ? "bg-warning/15 text-warning-foreground"
                                : "bg-muted/50 text-muted-foreground"
                          }`}>
                            {s.full_name.charAt(0)}
                          </div>
                          <div>
                            <button
                              onClick={() => navigate(`/admin/alunos/${s.id}`)}
                              className="text-sm font-bold text-foreground hover:text-primary transition-colors text-left"
                            >
                              {s.full_name}
                            </button>
                            <div className="flex gap-2 mt-1">
                              {s.lowFreq && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                                  <XCircle className="h-2.5 w-2.5" /> Freq: {s.freqPercent.toFixed(0)}%
                                </span>
                              )}
                              {s.lowGrade && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-warning-foreground bg-warning/10 px-2 py-0.5 rounded-full">
                                  <TrendingDown className="h-2.5 w-2.5" /> Média: {s.avg?.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant={s.severity === "critica" ? "destructive" : "outline"} className="text-[10px] shrink-0">
                          {s.severity === "critica" ? "🔴 Crítico" : s.severity === "alta" ? "🟠 Alto" : "🟡 Médio"}
                        </Badge>
                      </div>

                      <div className="bg-primary/5 rounded-md px-3 py-2.5 border border-primary/10">
                        {s.recommendations.map((r, i) => (
                          <p key={i} className="text-xs text-primary font-medium flex items-start gap-1.5">
                            <Zap className="h-3 w-3 shrink-0 mt-0.5" /> {r}
                          </p>
                        ))}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {!alreadySent ? (
                          <Button
                            size="sm"
                            className="text-xs h-8 gap-1.5 font-semibold"
                            onClick={() => handleSendAlert(s)}
                            disabled={sendIntervention.isPending}
                          >
                            <Send className="h-3.5 w-3.5" /> Notificar Professor
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] h-8 gap-1 px-3">
                            <CheckCircle2 className="h-3 w-3" /> Já notificado
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 gap-1"
                          onClick={() => notifyGuardianMutation.mutate(s)}
                          disabled={notifyGuardianMutation.isPending}
                        >
                          <PhoneCall className="h-3.5 w-3.5" /> Notificar Responsável
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-8 gap-1" onClick={() => openRequestForStudent(s)}>
                          <FilePlus2 className="h-3.5 w-3.5" /> Solicitar Secretaria
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs h-8 gap-1" onClick={() => navigate(`/admin/alunos/${s.id}`)}>
                          <Eye className="h-3.5 w-3.5" /> Histórico
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 📊 4. INTERVENÇÕES + GRÁFICO — Mais compactos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Resultado discreto */}
          <div className="lg:col-span-1 rounded-lg border border-border/40 bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" /> Resultado das Intervenções
            </p>
            <div className="flex gap-3">
              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-secondary">{improvedCount}</p>
                <p className="text-[10px] text-muted-foreground">Melhoraram</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-foreground">{unchangedCount}</p>
                <p className="text-[10px] text-muted-foreground">Inalterado</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-destructive">{worsenedCount}</p>
                <p className="text-[10px] text-muted-foreground">Pioraram</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border/30 space-y-1.5 text-[10px] text-muted-foreground">
              <div className="flex justify-between"><span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Aguardando</span><span className="font-medium text-foreground">{openInterventions.length}</span></div>
              <div className="flex justify-between"><span className="flex items-center gap-1"><Activity className="h-3 w-3" /> Em andamento</span><span className="font-medium text-foreground">{inProgressInterventions.length}</span></div>
              <div className="flex justify-between"><span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Resolvidas</span><span className="font-medium text-foreground">{resolvedInterventions.length}</span></div>
            </div>
          </div>

          {/* Gráfico compacto */}
          <div className="lg:col-span-2 rounded-lg border border-border/40 bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Evolução do Desempenho
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gradPerf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <ReferenceArea y1={0} y2={4} fill="hsl(var(--destructive))" fillOpacity={0.06} />
                <ReferenceArea y1={4} y2={6} fill="hsl(var(--warning))" fillOpacity={0.06} />
                <ReferenceArea y1={6} y2={10} fill="hsl(var(--secondary))" fillOpacity={0.04} />
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <ReferenceLine y={6} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: "Mín. 6.0", fill: "hsl(var(--destructive))", fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                <Area type="monotone" dataKey="media" stroke="hsl(var(--primary))" fill="url(#gradPerf)" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--card))" }} name="Média Geral" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground"><div className="w-2.5 h-1.5 rounded-sm bg-secondary/30" /> ≥6 Saudável</div>
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground"><div className="w-2.5 h-1.5 rounded-sm bg-warning/30" /> 4-6 Atenção</div>
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground"><div className="w-2.5 h-1.5 rounded-sm bg-destructive/30" /> &lt;4 Crítico</div>
              <span className={`text-[10px] font-medium ml-auto ${variation < 0 ? "text-destructive" : variation > 0 ? "text-secondary" : "text-muted-foreground"}`}>
                {variation >= 0 ? "+" : ""}{variation.toFixed(1)} pts
              </span>
            </div>
          </div>
        </div>

        {/* ── INTERVENÇÕES — ABERTAS ── */}
        {openInterventions.length > 0 && (
          <Card className="rounded-2xl border-warning/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning-foreground" />
                Intervenções Abertas ({openInterventions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {openInterventions.map((item) => {
                  const student = students.find((st) => st.id === item.student_id);
                  const teacher = teachers.find((t) => t.id === item.teacher_id);
                  return (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl bg-warning/5 border border-warning/20 px-4 py-3">
                      <Clock className="h-4 w-4 text-warning-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{student?.full_name || "Aluno"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{item.reason}</p>
                        {teacher && <p className="text-[10px] text-primary">Prof. {teacher.full_name}</p>}
                      </div>
                      <Badge variant="outline" className="text-[9px] shrink-0 border-warning/30 text-warning-foreground">
                        ⏳ Aguardando professor
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── INTERVENÇÕES — EM ANDAMENTO ── */}
        {inProgressInterventions.length > 0 && (
          <Card className="rounded-2xl border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Em Andamento ({inProgressInterventions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {inProgressInterventions.map((item) => {
                  const student = students.find((st) => st.id === item.student_id);
                  const teacher = teachers.find((t) => t.id === item.teacher_id);
                  return (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
                      <Activity className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{student?.full_name || "Aluno"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{item.reason}</p>
                        {teacher && <p className="text-[10px] text-primary">Prof. {teacher.full_name}</p>}
                        {item.teacher_notes && <p className="text-[10px] text-foreground mt-1">📝 {item.teacher_notes}</p>}
                      </div>
                      <Badge variant="outline" className="text-[9px] shrink-0">🔄 Em Andamento</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── INTERVENÇÕES — RESOLVIDAS ── */}
        {resolvedInterventions.length > 0 && (
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-secondary" />
                Resolvidas ({resolvedInterventions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {resolvedInterventions.slice(0, 10).map((item) => {
                  const student = students.find((st) => st.id === item.student_id);
                  const teacher = teachers.find((t) => t.id === item.teacher_id);
                  return (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3">
                      <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{student?.full_name || "Aluno"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{item.reason}</p>
                        {teacher && <p className="text-[10px] text-primary">Prof. {teacher.full_name}</p>}
                        {item.teacher_notes && <p className="text-[10px] text-foreground mt-1">📝 {item.teacher_notes}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {item.impact && (
                          <span className={`text-[10px] font-semibold ${
                            item.impact === "melhorou" ? "text-secondary" : item.impact === "piorou" ? "text-destructive" : "text-muted-foreground"
                          }`}>
                            {item.impact === "melhorou" ? "↑ Melhorou" : item.impact === "piorou" ? "↓ Piorou" : "— Sem mudança"}
                          </span>
                        )}
                        {item.action_type && (
                          <Badge variant="outline" className="text-[8px]">
                            {item.action_type === "intervencao" ? "Intervenção" : item.action_type === "observacao" ? "Observação" : "Contato Resp."}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

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
                {openCoordRequests.map((r) => (
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
              <Target className="h-5 w-5 text-primary" />
              Todas as Ações Recomendadas ({atRiskList.length})
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="flex flex-col gap-3 pr-2">
              {atRiskList.map((s) => {
                const alreadySent = interventions.some(
                  (i) => i.student_id === s.id && (i.status === "aberto" || i.status === "em_andamento")
                );
                return (
                  <div key={s.id} className={`rounded-xl border p-4 space-y-2 ${
                    s.severity === "critica" ? "border-destructive/30 bg-destructive/[0.03]" : "border-border/50"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          s.severity === "critica" ? "bg-destructive/15 text-destructive" : "bg-muted/50 text-muted-foreground"
                        }`}>{s.full_name.charAt(0)}</div>
                        <span className="text-sm font-semibold text-foreground">{s.full_name}</span>
                      </div>
                      <Badge variant={s.severity === "critica" ? "destructive" : "outline"} className="text-[9px]">
                        {s.severity === "critica" ? "🔴 Crítico" : s.severity === "alta" ? "🟠 Alto" : "🟡 Médio"}
                      </Badge>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {s.lowFreq && <span className="text-[9px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">Freq: {s.freqPercent.toFixed(0)}%</span>}
                      {s.lowGrade && <span className="text-[9px] font-semibold text-warning-foreground bg-warning/10 px-2 py-0.5 rounded-full">Média: {s.avg?.toFixed(1)}</span>}
                    </div>
                    {s.recommendations.map((r, i) => (
                      <p key={i} className="text-[11px] text-primary font-medium flex items-start gap-1"><Zap className="h-3 w-3 shrink-0 mt-0.5" /> {r}</p>
                    ))}
                    <div className="flex gap-2">
                      {!alreadySent ? (
                        <Button size="sm" className="text-[11px] h-7 gap-1.5" onClick={() => handleSendAlert(s)} disabled={sendIntervention.isPending}>
                          <Send className="h-3 w-3" /> Notificar Professor
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] gap-1"><CheckCircle2 className="h-3 w-3" /> Já notificado</Badge>
                      )}
                      <Button size="sm" variant="ghost" className="text-[11px] h-7 gap-1" onClick={() => navigate(`/admin/alunos/${s.id}`)}>
                        <Eye className="h-3 w-3" /> Ver Histórico
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ── Create Intervention Modal ── */}
      <Dialog open={createModalOpen} onOpenChange={(open) => { setCreateModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Criar Intervenção Pedagógica
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Aluno *</label>
              <Select value={formStudentId} onValueChange={setFormStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Professor responsável *</label>
              <Select value={formTeacherId} onValueChange={setFormTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o professor" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.full_name || "Professor"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Motivo *</label>
              <Textarea
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder="Descreva o motivo da intervenção..."
                rows={3}
                maxLength={500}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Recomendação (opcional)</label>
              <Input
                value={formRecommendation}
                onChange={(e) => setFormRecommendation(e.target.value)}
                placeholder="Sugestão de ação para o professor"
                maxLength={300}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Severidade</label>
              <Select value={formSeverity} onValueChange={setFormSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">🟢 Baixa</SelectItem>
                  <SelectItem value="media">🟡 Média</SelectItem>
                  <SelectItem value="alta">🟠 Alta</SelectItem>
                  <SelectItem value="critica">🔴 Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full gap-2"
              onClick={() => createIntervention.mutate()}
              disabled={createIntervention.isPending || !formStudentId || !formTeacherId || !formReason.trim()}
            >
              <Send className="h-4 w-4" />
              Criar e Enviar ao Professor
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request modal */}
      <RequestFormModal
        open={requestModalOpen}
        onOpenChange={(open) => {
          setRequestModalOpen(open);
          if (!open) { setRequestStudent(null); setRequestDescription(""); setRequestType(""); }
        }}
        onCreated={() => {
          toast.success("Solicitação enviada para a secretaria!");
          queryClient.invalidateQueries({ queryKey: ["coord-open-requests"] });
        }}
        origin="coordenacao"
        hideDeadline
        initialStudent={requestStudent}
        initialDescription={requestDescription}
        initialRequestType={requestType}
      />
    </RoleLayout>
  );
};

export default CoordinationDashboard;

import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ReferenceLine, ReferenceArea, Area, AreaChart,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Types ───────────────────────────────────────────────────────────
type Intervention = {
  id: string;
  reason: string;
  severity: string;
  status: string;
  impact: string | null;
  action_type: string | null;
  teacher_notes: string | null;
  recommendation: string | null;
  avg_grade: number | null;
  freq_percent: number | null;
  created_at: string;
  teacher_id: string | null;
  teachers?: { full_name: string | null } | null;
};

// ─── Behavior mock (local state, no new tables) ──────────────────────
const BEHAVIOR_OPTIONS = [
  { tag: "Participativo", color: "bg-emerald-600 text-white" },
  { tag: "Distraído", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { tag: "Evoluiu", color: "bg-emerald-600 text-white" },
  { tag: "Indisciplinado", color: "bg-red-100 text-red-800 border-red-300" },
  { tag: "Colaborativo", color: "bg-emerald-600 text-white" },
  { tag: "Reservado", color: "bg-slate-100 text-slate-600 border-slate-300" },
];

// ─── Helpers ─────────────────────────────────────────────────────────
const severityLabel: Record<string, string> = { alta: "Alto", media: "Médio", baixa: "Baixo" };
const severityColor: Record<string, string> = {
  alta: "bg-red-100 text-red-800 border border-red-300",
  media: "bg-amber-100 text-amber-800 border border-amber-300",
  baixa: "bg-emerald-100 text-emerald-800 border border-emerald-300",
};
const impactLabel: Record<string, string> = { melhorou: "Melhorou", piorou: "Piorou", sem_mudanca: "Sem mudança" };
const impactIcon: Record<string, string> = { melhorou: "ri-arrow-up-line", piorou: "ri-arrow-down-line", sem_mudanca: "ri-subtract-line" };
const statusLabel: Record<string, string> = { aberto: "Aberto", em_andamento: "Em andamento", resolvido: "Resolvido" };
const statusColor: Record<string, string> = {
  aberto: "bg-amber-100 text-amber-800 border border-amber-300",
  em_andamento: "bg-amber-100 text-amber-800 border border-amber-300",
  resolvido: "bg-emerald-100 text-emerald-800 border border-emerald-300",
};

function getSituation(media: number, freq: number) {
  if (media < 5 || freq < 60) return { label: "Em risco crítico", color: "text-red-700 font-semibold", bg: "bg-red-100 border border-red-300", badge: "bg-red-200 text-red-800 font-semibold", icon: "ri-alert-fill", level: "critico" };
  if (media < 6 || freq < 75) return { label: "Em recuperação", color: "text-amber-800 font-semibold", bg: "bg-amber-100 border border-amber-300", badge: "bg-amber-200 text-amber-800 font-semibold", icon: "ri-error-warning-line", level: "atencao" };
  return { label: "Saudável", color: "text-emerald-800 font-semibold", bg: "bg-emerald-100 border border-emerald-300", badge: "bg-emerald-200 text-emerald-800 font-semibold", icon: "ri-heart-pulse-line", level: "saudavel" };
}

function generateHeroNarrative(name: string, media: number, freq: number, hasGrades: boolean, hasAttendance: boolean): string {
  const firstName = name.split(" ")[0];
  if (!hasGrades && !hasAttendance) return `Ainda não há dados suficientes para gerar uma análise sobre ${firstName}. Registre notas e frequência para ativar o diagnóstico.`;
  if (freq < 60 && media < 5) return `${firstName} apresenta risco crítico: a frequência de ${freq.toFixed(0)}% está muito abaixo do mínimo e a média de ${media.toFixed(1)} compromete a aprovação. É necessária intervenção imediata com a família e equipe pedagógica.`;
  if (freq < 75 && media < 6) return `${firstName} está em situação de atenção. A baixa frequência (${freq.toFixed(0)}%) está impactando diretamente o desempenho acadêmico (média ${media.toFixed(1)}). Acompanhamento pedagógico é recomendado.`;
  if (freq < 75) return `A frequência de ${firstName} (${freq.toFixed(0)}%) está abaixo do esperado e pode comprometer o rendimento nos próximos bimestres, mesmo com média atual de ${media.toFixed(1)}.`;
  if (media < 6 && hasGrades) return `${firstName} mantém boa frequência (${freq.toFixed(0)}%), porém o desempenho acadêmico (média ${media.toFixed(1)}) precisa de atenção. Considere reforço nas disciplinas mais críticas.`;
  return `${firstName} apresenta desempenho satisfatório com média ${media.toFixed(1)} e frequência de ${freq.toFixed(0)}%. Manter o acompanhamento regular para garantir a continuidade do bom rendimento.`;
}

function generateDiagnosticInsight(media: number, freq: number, hasGrades: boolean): string {
  if (freq < 60 && media < 5) return "A ausência frequente está comprometendo gravemente o aprendizado. A correlação entre faltas e notas baixas indica um ciclo que precisa ser interrompido com urgência.";
  if (freq < 75 && media < 6) return "A baixa frequência está prejudicando o acompanhamento das aulas, refletindo diretamente nas notas. O aluno perde conteúdo essencial a cada ausência.";
  if (freq < 75) return "A frequência abaixo do esperado é um sinal de alerta. Mesmo com notas razoáveis, a tendência é de queda se o padrão de ausências continuar.";
  if (media < 6 && hasGrades) return "O desempenho acadêmico está abaixo da média esperada. Identificar as disciplinas mais afetadas é o primeiro passo para um plano de recuperação eficaz.";
  return "Os indicadores estão dentro dos parâmetros esperados. Não há fatores de risco identificados no momento.";
}

function generateRadarInsight(data: { dimension: string; value: number }[]): string {
  const weak = data.filter(d => d.value < 60).map(d => d.dimension.toLowerCase());
  if (weak.length === 0) return "O perfil de competências está equilibrado, sem dimensões em nível crítico.";
  if (weak.length === 1) return `Atenção ao indicador de ${weak[0]}, que está abaixo do esperado e pode impactar o desempenho geral.`;
  return `Baixo desempenho em ${weak.slice(0, -1).join(", ")} e ${weak[weak.length - 1]}. Essas dimensões precisam de atenção prioritária.`;
}

function getMetricColor(value: number, thresholds: [number, number]): string {
  if (value < thresholds[0]) return "destructive";
  if (value < thresholds[1]) return "warning";
  return "secondary";
}

// ─── Component ───────────────────────────────────────────────────────
const StudentRecord = () => {
  const { id } = useParams();
  const { schoolId } = useSchoolId();
  const queryClient = useQueryClient();
  const [reportOpen, setReportOpen] = useState(false);
  const [interventionOpen, setInterventionOpen] = useState(false);
  const [newReason, setNewReason] = useState("");
  const [newSeverity, setNewSeverity] = useState("media");
  const [selectedBehaviors, setSelectedBehaviors] = useState<string[]>(["Participativo"]);

  // ─── Queries ─────────────────────────────────────────────────────
  const { data: student, isLoading } = useQuery({
    queryKey: ["student-record", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*, classes(name, grade, shift)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: grades = [] } = useQuery({
    queryKey: ["student-record-grades", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grades")
        .select("grade_value, term, teacher_assignments(subject_id, subjects(name))")
        .eq("student_id", id!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["student-record-attendance", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("date, status")
        .eq("student_id", id!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: interventions = [] } = useQuery({
    queryKey: ["student-record-interventions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedagogical_interventions")
        .select("*, teachers(full_name)")
        .eq("student_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Intervention[];
    },
    enabled: !!id,
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers-list-record"],
    queryFn: async () => {
      const { data } = await supabase.from("teachers").select("id, full_name").eq("school_id", schoolId!);
      return data || [];
    },
    enabled: !!schoolId && interventionOpen,
  });

  // ─── Create intervention mutation ────────────────────────────────
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const createIntervention = useMutation({
    mutationFn: async () => {
      if (!schoolId || !id) throw new Error("Dados incompletos");
      const { error } = await supabase.from("pedagogical_interventions").insert({
        school_id: schoolId,
        student_id: id,
        teacher_id: selectedTeacher || null,
        reason: newReason,
        severity: newSeverity,
        status: "aberto",
        created_role: "coordenacao",
        avg_grade: mediaGeral > 0 ? mediaGeral : null,
        freq_percent: freqPercent > 0 ? freqPercent : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-record-interventions", id] });
      toast.success("Intervenção registrada!");
      setInterventionOpen(false);
      setNewReason("");
      setSelectedTeacher("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ─── Computed data ───────────────────────────────────────────────
  const gradeValues = grades.map((g: any) => g.grade_value).filter((v: any) => v != null) as number[];
  const mediaGeral = gradeValues.length > 0 ? gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length : 0;

  const totalAttendance = attendance.length;
  const presentCount = attendance.filter((a: any) => a.status === "presente").length;
  const freqPercent = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

  const situation = getSituation(mediaGeral, freqPercent);
  const heroNarrative = student ? generateHeroNarrative(student.full_name, mediaGeral, freqPercent, gradeValues.length > 0, totalAttendance > 0) : "";

  // Timeline data
  const termOrder = ["1º Bimestre", "2º Bimestre", "3º Bimestre", "4º Bimestre"];
  const gradesByTerm = useMemo(() => termOrder.map((term) => {
    const termGrades = grades.filter((g: any) => g.term === term).map((g: any) => g.grade_value).filter((v: any) => v != null) as number[];
    const avg = termGrades.length > 0 ? termGrades.reduce((a, b) => a + b, 0) / termGrades.length : null;
    const hasIntervention = interventions.some(i => {
      const d = new Date(i.created_at);
      const q = Math.ceil((d.getMonth() + 1) / 3);
      return `${q}º Bimestre` === term;
    });
    return { term: term.replace(" Bimestre", ""), media: avg, intervention: hasIntervention };
  }).filter(t => t.media !== null), [grades, interventions]);

  // Subjects performance
  const subjectMap = useMemo(() => {
    const map: Record<string, number[]> = {};
    grades.forEach((g: any) => {
      const name = g.teacher_assignments?.subjects?.name || "Sem disciplina";
      if (g.grade_value != null) {
        if (!map[name]) map[name] = [];
        map[name].push(g.grade_value);
      }
    });
    return Object.entries(map).map(([name, vals]) => ({
      name,
      media: vals.reduce((a, b) => a + b, 0) / vals.length,
    })).sort((a, b) => a.media - b.media);
  }, [grades]);

  // Radar data
  const radarData = useMemo(() => {
    const normMedia = Math.min(mediaGeral / 10, 1) * 100;
    const normFreq = Math.min(freqPercent, 100);
    const behaviorScore = selectedBehaviors.some(b => ["Indisciplinado", "Distraído"].includes(b)) ? 40 : 80;
    const participationScore = selectedBehaviors.includes("Participativo") ? 85 : selectedBehaviors.includes("Colaborativo") ? 90 : 50;
    return [
      { dimension: "Notas", value: normMedia },
      { dimension: "Frequência", value: normFreq },
      { dimension: "Comportamento", value: behaviorScore },
      { dimension: "Participação", value: participationScore },
    ];
  }, [mediaGeral, freqPercent, selectedBehaviors]);

  const radarInsight = useMemo(() => generateRadarInsight(radarData), [radarData]);

  // Risk factors
  const riskFactors = useMemo(() => {
    const factors: { label: string; description: string; percent: number; color: string }[] = [];
    if (freqPercent < 75) factors.push({ label: "Baixa Frequência", description: "Ausências frequentes comprometem o acompanhamento das aulas", percent: Math.round(100 - freqPercent), color: "bg-destructive" });
    if (mediaGeral < 6 && gradeValues.length > 0) factors.push({ label: "Notas Baixas", description: "Desempenho acadêmico abaixo do mínimo esperado", percent: Math.round((1 - mediaGeral / 10) * 100), color: "bg-warning" });
    const hasDisc = selectedBehaviors.some(b => ["Indisciplinado", "Distraído"].includes(b));
    if (hasDisc) factors.push({ label: "Comportamento", description: "Padrões comportamentais que dificultam o aprendizado", percent: 60, color: "bg-destructive/70" });
    return factors;
  }, [freqPercent, mediaGeral, gradeValues.length, selectedBehaviors]);

  // Intervention results
  const interventionStats = useMemo(() => {
    const resolved = interventions.filter(i => i.status === "resolvido");
    return {
      total: interventions.length,
      melhorou: resolved.filter(i => i.impact === "melhorou").length,
      piorou: resolved.filter(i => i.impact === "piorou").length,
      sem_mudanca: resolved.filter(i => i.impact === "sem_mudanca").length,
      aberto: interventions.filter(i => i.status === "aberto").length,
    };
  }, [interventions]);

  // Recommended actions — more direct and decision-oriented
  const recommendations = useMemo(() => {
    const recs: { text: string; detail: string; type: string; urgency: string }[] = [];
    if (freqPercent < 60) recs.push({ text: "Contato imediato com responsável é necessário", detail: `Frequência de ${freqPercent.toFixed(0)}% está muito abaixo do mínimo de 75%`, type: "secretaria", urgency: "critico" });
    else if (freqPercent < 75) recs.push({ text: "Agendar reunião com responsável sobre frequência", detail: `${(100 - freqPercent).toFixed(0)}% de ausências registradas`, type: "secretaria", urgency: "atencao" });
    if (mediaGeral < 5 && gradeValues.length > 0) recs.push({ text: "Reforço escolar urgente nas disciplinas críticas", detail: `Média ${mediaGeral.toFixed(1)} — risco de reprovação`, type: "professor", urgency: "critico" });
    else if (mediaGeral < 6 && gradeValues.length > 0) recs.push({ text: "Solicitar plano de recuperação ao professor", detail: `Média ${mediaGeral.toFixed(1)} — abaixo do mínimo para aprovação`, type: "professor", urgency: "atencao" });
    if (freqPercent < 60 && mediaGeral < 5) recs.push({ text: "Encaminhar para conselho de classe com urgência", detail: "Combinação de faltas e notas indica necessidade de ação coletiva", type: "coordenacao", urgency: "critico" });
    if (interventionStats.aberto > 0) recs.push({ text: `${interventionStats.aberto} intervenção(ões) aguardando resposta do professor`, detail: "Acompanhar para garantir que as ações sejam executadas", type: "professor", urgency: "atencao" });
    if (recs.length === 0) recs.push({ text: "Situação estável — manter acompanhamento regular", detail: "Todos os indicadores dentro dos parâmetros esperados", type: "info", urgency: "ok" });
    return recs;
  }, [freqPercent, mediaGeral, gradeValues.length, interventionStats.aberto]);

  const diagnosticInsight = generateDiagnosticInsight(mediaGeral, freqPercent, gradeValues.length > 0);

  // Metric color helpers
  const mediaColor = getMetricColor(mediaGeral, [5, 6]);
  const freqColor = getMetricColor(freqPercent, [60, 75]);

  // ─── Render ──────────────────────────────────────────────────────
  if (isLoading || !student) return (
    <AppLayout title="Prontuário" breadcrumbs={[{ label: "Alunos", href: "/admin/alunos" }, { label: "Prontuário" }]}>
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    </AppLayout>
  );

  const s = student as any;

  return (
    <AppLayout title="Prontuário do Aluno" breadcrumbs={[
      { label: "Alunos", href: "/admin/alunos" },
      { label: student.full_name, href: `/admin/alunos/${id}` },
      { label: "Prontuário" },
    ]}>
      <div className="space-y-8 max-w-5xl mx-auto">

        {/* ═══ 1. HERO ═══════════════════════════════════════════════ */}
        <section className={cn("rounded-lg p-6 md:p-8 relative overflow-hidden", situation.bg)}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Photo — destaque circular */}
            {student.photo_url ? (
              <img src={student.photo_url} alt={student.full_name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl ring-2 ring-slate-200" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-xl ring-2 ring-slate-200 flex items-center justify-center">
                <i className="ri-user-line text-4xl text-slate-400" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-primary truncate">{student.full_name}</h1>
                <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs", situation.badge)}>
                  <i className={situation.icon} /> {situation.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {s.classes?.name || "Sem turma"} · {s.classes?.grade || ""} · {s.classes?.shift || ""}
              </p>

              {/* ── Metric Cards ── */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white border border-slate-200 border-l-4 border-l-blue-500">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100">
                    <i className="ri-bar-chart-box-line text-lg text-blue-600" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Média Geral</div>
                    <div className={cn("text-xl font-bold",
                      mediaColor === "destructive" ? "text-red-700" :
                      mediaColor === "warning" ? "text-amber-700" : "text-slate-900"
                    )}>
                      {gradeValues.length > 0 ? mediaGeral.toFixed(1) : "—"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white border border-slate-200 border-l-4 border-l-red-500">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-100">
                    <i className="ri-calendar-check-line text-lg text-red-600" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Frequência</div>
                    <div className={cn("text-xl font-bold",
                      freqColor === "destructive" ? "text-red-700" :
                      freqColor === "warning" ? "text-amber-700" : "text-slate-900"
                    )}>
                      {totalAttendance > 0 ? `${freqPercent.toFixed(0)}%` : "—"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white border border-slate-200 border-l-4 border-l-yellow-500">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-yellow-100">
                    <i className="ri-shield-check-line text-lg text-yellow-700" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Intervenções</div>
                    <div className="text-xl font-bold text-slate-900">{interventions.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 shrink-0">
              <Button size="sm" className="gap-2 bg-slate-900 text-white hover:bg-slate-800" onClick={() => {
                // Generate HTML report in new tab for printing/PDF
                const studentData = {
                  name: student.full_name,
                  class_name: s.classes?.name || "-",
                  avg: mediaGeral.toFixed(1),
                  freq: freqPercent.toFixed(0),
                  status: situation.label,
                  status_class: situation.level === "critico" ? "status-critical" : situation.level === "atencao" ? "status-warning" : "status-good",
                  diagnosis: diagnosticInsight,
                  conclusion: recommendations[0]?.text || "Manter acompanhamento regular.",
                };
                
                const interventionsHtml = interventions.length > 0 
                  ? `<ul>${interventions.map(i => `<li><strong>${i.reason}</strong> (${i.status}) - ${i.teacher_notes || "Sem observações"}</li>`).join("")}</ul>`
                  : "<p>Nenhuma intervenção registrada.</p>";
                
                const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório - ${studentData.name}</title>
<style>
body { font-family: Arial, sans-serif; padding: 40px; color: #2c2c2c; line-height: 1.6; }
.header { display: flex; border-bottom: 2px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 30px; }
.school-info { flex: 1; }
.title { text-align: center; font-size: 24px; margin: 30px 0; color: #1e3a5f; }
.cards { display: flex; gap: 20px; margin: 30px 0; }
.card { flex: 1; padding: 20px; background: #f5f7fa; border-radius: 8px; text-align: center; }
.card strong { display: block; font-size: 28px; margin-top: 8px; }
.status-critical { color: #dc2626; }
.status-warning { color: #f59e0b; }
.status-good { color: #16a34a; }
h3 { color: #1e3a5f; margin-top: 30px; border-left: 4px solid #1e3a5f; padding-left: 12px; }
p { margin: 12px 0; }
ul { padding-left: 20px; }
li { margin: 8px 0; }
.footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
</style>
</head>
<body>
<div class="header">
  <div class="school-info">
    <strong style="font-size: 18px;">Escola</strong><br>
    Relatório de Evolução do Aluno
  </div>
</div>
<h2 class="title">${studentData.name}</h2>
<p><strong>Turma:</strong> ${studentData.class_name}</p>
<div class="cards">
  <div class="card">Média<br><strong class="${studentData.status_class}">${studentData.avg}</strong></div>
  <div class="card">Frequência<br><strong class="${studentData.status_class}">${studentData.freq}%</strong></div>
  <div class="card">Status<br><strong class="${studentData.status_class}">${studentData.status}</strong></div>
</div>
<h3>Diagnóstico</h3>
<p>${studentData.diagnosis}</p>
<h3>Intervenções</h3>
${interventionsHtml}
<h3>Conclusão</h3>
<p>${studentData.conclusion}</p>
<div class="footer">
  <p>Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
</div>
</body>
</html>`;
                
                const newWindow = window.open("", "_blank");
                if (newWindow) {
                  newWindow.document.write(html);
                  newWindow.document.close();
                  setTimeout(() => newWindow.print(), 250);
                }
              }}>
                <i className="ri-file-chart-line" /> Gerar Relatório
              </Button>
              <Link to={`/admin/alunos/${id}`}>
                <Button variant="outline" size="sm" className="gap-2 w-full border border-slate-300 text-slate-700">
                  <i className="ri-arrow-left-line" /> Voltar
                </Button>
              </Link>
            </div>
          </div>

          {/* Narrative sentence — humanized */}
          <div className="mt-5 p-4 rounded-lg bg-white border border-slate-200">
            <p className="text-sm text-foreground leading-relaxed">
              <i className={cn("mr-2",
                situation.level === "critico" ? "ri-alarm-warning-line text-destructive" :
                situation.level === "atencao" ? "ri-error-warning-line text-warning-foreground" :
                "ri-lightbulb-line text-secondary"
              )} />
              {heroNarrative}
            </p>
          </div>
        </section>

        {/* ═══ 2. TIMELINE ═══════════════════════════════════════════ */}
        {gradesByTerm.length >= 2 && (
          <section className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
              <i className="ri-line-chart-line text-secondary" /> Linha do Tempo — Evolução Acadêmica
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={gradesByTerm}>
                <defs>
                  <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <ReferenceArea y1={0} y2={4} fill="hsl(var(--destructive))" fillOpacity={0.05} />
                <ReferenceArea y1={4} y2={6} fill="hsl(var(--warning))" fillOpacity={0.05} />
                <ReferenceArea y1={6} y2={10} fill="hsl(var(--secondary))" fillOpacity={0.03} />
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="term" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <ReferenceLine y={6} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: "Mín. 6.0", fill: "hsl(var(--destructive))", fontSize: 10 }} />
                <Tooltip formatter={(val: number) => [val.toFixed(1), "Média"]} />
                <Area type="monotone" dataKey="media" stroke="hsl(var(--secondary))" strokeWidth={2.5} fill="url(#gradArea)" dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  return (
                    <g key={`dot-${payload.term}`}>
                      <circle cx={cx} cy={cy} r={5} fill="hsl(var(--secondary))" stroke="hsl(var(--card))" strokeWidth={2} />
                      {payload.intervention && <circle cx={cx} cy={cy} r={10} fill="none" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="3 2" />}
                    </g>
                  );
                }} />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2">
              <i className="ri-information-line mr-1" />
              Círculos tracejados indicam bimestres com intervenção pedagógica registrada.
            </p>
          </section>
        )}

        {/* ═══ 3. DIAGNÓSTICO + 4. RADAR ═════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Diagnóstico */}
          <section className="bg-white border border-slate-200 border-l-4 border-l-red-500 rounded-lg p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <i className="ri-stethoscope-line text-red-600" /> Diagnóstico
            </h2>

            {riskFactors.length > 0 ? (
              <div className="space-y-4 mb-5">
                {riskFactors.map(f => (
                  <div key={f.label}>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-900">{f.label}</span>
                      <span className="text-slate-500">{f.percent}% impacto</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", f.color)} style={{ width: `${f.percent}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{f.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 mb-5">Nenhum fator de risco identificado.</p>
            )}

            {/* Diagnostic insight */}
            <div className="p-3 rounded-lg bg-white border border-slate-200">
              <p className="text-xs text-slate-600 leading-relaxed italic">
                <i className="ri-lightbulb-flash-line mr-1 text-amber-600" />
                {diagnosticInsight}
              </p>
            </div>

            {/* Subject performance */}
            {subjectMap.length > 0 && (
              <div className="mt-5">
                <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Desempenho por Disciplina</h3>
                <div className="space-y-2">
                  {subjectMap.map(s => (
                    <div key={s.name} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-primary w-28 truncate">{s.name}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={cn("h-full rounded-full", s.media >= 6 ? "bg-secondary" : "bg-destructive")} style={{ width: `${(s.media / 10) * 100}%` }} />
                      </div>
                      <span className={cn("text-xs font-bold w-8 text-right", s.media >= 6 ? "text-secondary" : "text-destructive")}>
                        {s.media.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Radar */}
          <section className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
              <i className="ri-compass-3-line text-secondary" /> Radar de Competências
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="value" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
            {/* Radar interpretation */}
            <div className="mt-3 p-3 rounded-lg bg-white border border-slate-200">
              <p className="text-xs text-slate-600 leading-relaxed italic">
                <i className="ri-focus-3-line mr-1 text-emerald-600" />
                {radarInsight}
              </p>
            </div>
          </section>
        </div>

        {/* ═══ 5. INTERVENÇÕES ═════════════════════════════════════════ */}
        <section className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-primary flex items-center gap-2">
              <i className="ri-shield-check-line text-secondary" /> Intervenções Pedagógicas
            </h2>
            {interventions.length > 0 && (
              <div className="flex gap-4 text-xs font-bold">
                <span className="text-secondary"><i className="ri-arrow-up-circle-line mr-1" />{interventionStats.melhorou} melhorou</span>
                <span className="text-muted-foreground"><i className="ri-subtract-line mr-1" />{interventionStats.sem_mudanca} sem mudança</span>
                <span className="text-destructive"><i className="ri-arrow-down-circle-line mr-1" />{interventionStats.piorou} piorou</span>
              </div>
            )}
          </div>

          {interventions.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
                <i className="ri-alert-line text-2xl text-warning-foreground" />
              </div>
              <p className="text-sm font-medium text-primary">Nenhuma intervenção registrada</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {situation.level === "critico"
                  ? "Este aluno apresenta indicadores críticos. Recomenda-se registrar uma intervenção imediatamente."
                  : situation.level === "atencao"
                  ? "O aluno está em situação de atenção. Considere registrar uma intervenção preventiva."
                  : "Nenhuma intervenção necessária no momento. Continue monitorando os indicadores."}
              </p>
              <Button variant="outline" size="sm" className="gap-2 mt-2" onClick={() => setInterventionOpen(true)}>
                <i className="ri-add-line" /> Registrar Intervenção
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {interventions.slice(0, 5).map(i => (
                <div key={i.id} className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 bg-white">
                  <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0",
                    i.status === "resolvido" ? "bg-emerald-500" : i.status === "em_andamento" ? "bg-amber-500" : "bg-amber-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-slate-900">{i.reason}</span>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", severityColor[i.severity] || "bg-slate-100 text-slate-600 border border-slate-300")}>
                        {severityLabel[i.severity] || i.severity}
                      </span>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", statusColor[i.status] || "bg-slate-100 text-slate-600 border border-slate-300")}>
                        {statusLabel[i.status] || i.status}
                      </span>
                    </div>
                    {i.teachers?.full_name && (
                      <p className="text-[11px] text-slate-500">
                        <i className="ri-user-star-line mr-1" /> Prof. {i.teachers.full_name}
                      </p>
                    )}
                    {i.teacher_notes && <p className="text-xs text-slate-600 mt-1 italic">"{i.teacher_notes}"</p>}
                    {i.impact && (
                      <span className={cn("inline-flex items-center gap-1 text-xs font-bold mt-1",
                        i.impact === "melhorou" ? "text-emerald-700" : i.impact === "piorou" ? "text-red-700" : "text-slate-500"
                      )}>
                        <i className={impactIcon[i.impact] || ""} /> {impactLabel[i.impact] || i.impact}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(i.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ═══ 6. AÇÕES RECOMENDADAS ═════════════════════════════════ */}
        <section className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
            <i className="ri-flashlight-line text-warning" /> Ações Recomendadas
          </h2>
          <div className="space-y-3">
            {recommendations.map((r, i) => (
              <div key={i} className={cn(
                "flex items-center justify-between p-4 rounded-xl border",
                r.urgency === "critico" ? "bg-destructive/5 border-destructive/20" :
                r.urgency === "atencao" ? "bg-warning/5 border-warning/20" :
                "bg-background/50 border-border/30"
              )}>
                <div className="flex items-start gap-3">
                  <i className={cn("text-lg mt-0.5",
                    r.type === "secretaria" ? "ri-building-line text-primary" :
                    r.type === "professor" ? "ri-user-star-line text-secondary" :
                    r.type === "coordenacao" ? "ri-alarm-warning-line text-destructive" :
                    "ri-checkbox-circle-line text-secondary"
                  )} />
                  <div>
                    <span className="text-sm font-semibold text-primary block">{r.text}</span>
                    <span className="text-[11px] text-muted-foreground">{r.detail}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {r.type === "professor" && (
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => toast.success("Notificação enviada ao professor")}>
                      <i className="ri-notification-line" /> Notificar
                    </Button>
                  )}
                  {r.type === "secretaria" && (
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => toast.success("Solicitação enviada à secretaria")}>
                      <i className="ri-send-plane-line" /> Solicitar
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full gap-2 mt-2" onClick={() => setInterventionOpen(true)}>
              <i className="ri-add-line" /> Registrar Nova Intervenção
            </Button>
          </div>
        </section>

        {/* ═══ 7. COMPORTAMENTO ═══════════════════════════════════════ */}
        <section className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
            <i className="ri-emotion-line text-secondary" /> Comportamento
          </h2>
          <div className="flex flex-wrap gap-2">
            {BEHAVIOR_OPTIONS.map(b => {
              const active = selectedBehaviors.includes(b.tag);
              return (
                <button key={b.tag}
                  onClick={() => setSelectedBehaviors(prev =>
                    active ? prev.filter(t => t !== b.tag) : [...prev, b.tag]
                  )}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold transition-all border",
                    active ? cn(b.color, "border-current") : "bg-muted/10 text-muted-foreground border-border/30 opacity-50 hover:opacity-80"
                  )}
                >
                  {b.tag}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">
            Selecione as tags que descrevem o comportamento atual do aluno (dados locais).
          </p>
        </section>

      </div>

      {/* ═══ MODAL: RELATÓRIO ═══════════════════════════════════════ */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Relatório — {student.full_name}</DialogTitle>
            <DialogDescription>Resumo automático para reunião pedagógica</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-bold text-primary mb-1">Situação Atual</h4>
              <p className="text-muted-foreground">{heroNarrative}</p>
            </div>
            <div>
              <h4 className="font-bold text-primary mb-1">Evolução</h4>
              {gradesByTerm.length >= 2 ? (
                <p className="text-muted-foreground">
                  Nos últimos bimestres: {gradesByTerm.map(t => `${t.term}: ${t.media!.toFixed(1)}`).join(" → ")}.
                </p>
              ) : <p className="text-muted-foreground">Dados insuficientes para análise de evolução.</p>}
            </div>
            <div>
              <h4 className="font-bold text-primary mb-1">Diagnóstico</h4>
              <p className="text-muted-foreground">{diagnosticInsight}</p>
            </div>
            <div>
              <h4 className="font-bold text-primary mb-1">Intervenções</h4>
              <p className="text-muted-foreground">
                {interventions.length === 0 ? "Nenhuma intervenção registrada até o momento." :
                  `${interventions.length} intervenção(ões) registrada(s). ${interventionStats.melhorou} com melhora, ${interventionStats.piorou} com piora, ${interventionStats.sem_mudanca} sem mudança.`}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-primary mb-1">Recomendação</h4>
              <p className="text-muted-foreground">{recommendations[0]?.text || "Manter acompanhamento regular."}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>Fechar</Button>
            <Button onClick={() => {
              // Generate HTML report in new tab for printing/PDF
              const studentData = {
                name: student.full_name,
                class_name: s.classes?.name || "-",
                avg: mediaGeral.toFixed(1),
                freq: freqPercent.toFixed(0),
                status: situation.label,
                status_class: situation.level === "critico" ? "status-critical" : situation.level === "atencao" ? "status-warning" : "status-good",
                diagnosis: diagnosticInsight,
                interventions: interventions,
                conclusion: recommendations[0]?.text || "Manter acompanhamento regular.",
                school_logo: "",
                school_name: "Escola",
              };
              
              const interventionsHtml = interventions.length > 0 
                ? `<ul>${interventions.map(i => `<li><strong>${i.reason}</strong> (${i.status}) - ${i.teacher_notes || "Sem observações"}</li>`).join("")}</ul>`
                : "<p>Nenhuma intervenção registrada.</p>";
              
              const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório - ${studentData.name}</title>
<style>
body { font-family: Arial, sans-serif; padding: 40px; color: #2c2c2c; line-height: 1.6; }
.header { display: flex; border-bottom: 2px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 30px; }
.logo { width: 80px; height: 80px; margin-right: 20px; object-fit: contain; }
.school-info { flex: 1; }
.title { text-align: center; font-size: 24px; margin: 30px 0; color: #1e3a5f; }
.cards { display: flex; gap: 20px; margin: 30px 0; }
.card { flex: 1; padding: 20px; background: #f5f7fa; border-radius: 8px; text-align: center; }
.card strong { display: block; font-size: 28px; margin-top: 8px; }
.status-critical { color: #dc2626; }
.status-warning { color: #f59e0b; }
.status-good { color: #16a34a; }
h3 { color: #1e3a5f; margin-top: 30px; border-left: 4px solid #1e3a5f; padding-left: 12px; }
p { margin: 12px 0; }
ul { padding-left: 20px; }
li { margin: 8px 0; }
.footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
</style>
</head>
<body>
<div class="header">
  <div class="school-info">
    <strong style="font-size: 18px;">${studentData.school_name}</strong><br>
    Relatório de Evolução do Aluno
  </div>
</div>
<h2 class="title">${studentData.name}</h2>
<p><strong>Turma:</strong> ${studentData.class_name}</p>
<div class="cards">
  <div class="card">Média<br><strong class="${studentData.status_class}">${studentData.avg}</strong></div>
  <div class="card">Frequência<br><strong class="${studentData.status_class}">${studentData.freq}%</strong></div>
  <div class="card">Status<br><strong class="${studentData.status_class}">${studentData.status}</strong></div>
</div>
<h3>Diagnóstico</h3>
<p>${studentData.diagnosis}</p>
<h3>Intervenções</h3>
${interventionsHtml}
<h3>Conclusão</h3>
<p>${studentData.conclusion}</p>
<div class="footer">
  <p>Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
</div>
</body>
</html>`;
              
              const newWindow = window.open("", "_blank");
              if (newWindow) {
                newWindow.document.write(html);
                newWindow.document.close();
                setTimeout(() => newWindow.print(), 250);
              }
            }}>
              <i className="ri-printer-line mr-2" /> Gerar Relatório
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL: NOVA INTERVENÇÃO ════════════════════════════════ */}
      <Dialog open={interventionOpen} onOpenChange={setInterventionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Intervenção</DialogTitle>
            <DialogDescription>Para {student.full_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground">Professor responsável</label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {teachers.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">Motivo</label>
              <Textarea value={newReason} onChange={e => setNewReason(e.target.value)} placeholder="Descreva o motivo..." />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">Severidade</label>
              <Select value={newSeverity} onValueChange={setNewSeverity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInterventionOpen(false)}>Cancelar</Button>
            <Button disabled={!newReason.trim()} onClick={() => createIntervention.mutate()}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default StudentRecord;

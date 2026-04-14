import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ReferenceLine, ReferenceArea, Area, AreaChart,
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
  { tag: "Participativo", color: "bg-secondary/15 text-secondary" },
  { tag: "Distraído", color: "bg-warning/15 text-warning-foreground" },
  { tag: "Evoluiu", color: "bg-secondary/15 text-secondary" },
  { tag: "Indisciplinado", color: "bg-destructive/15 text-destructive" },
  { tag: "Colaborativo", color: "bg-secondary/15 text-secondary" },
  { tag: "Reservado", color: "bg-muted/20 text-muted-foreground" },
];

// ─── Helpers ─────────────────────────────────────────────────────────
const severityLabel: Record<string, string> = { alta: "Alto", media: "Médio", baixa: "Baixo" };
const severityColor: Record<string, string> = {
  alta: "bg-destructive/15 text-destructive",
  media: "bg-warning/15 text-warning-foreground",
  baixa: "bg-secondary/15 text-secondary",
};
const impactLabel: Record<string, string> = { melhorou: "Melhorou", piorou: "Piorou", sem_mudanca: "Sem mudança" };
const impactIcon: Record<string, string> = { melhorou: "ri-arrow-up-line", piorou: "ri-arrow-down-line", sem_mudanca: "ri-subtract-line" };
const statusLabel: Record<string, string> = { aberto: "Aberto", em_andamento: "Em andamento", resolvido: "Resolvido" };

function getSituation(media: number, freq: number) {
  if (media < 5 || freq < 60) return { label: "Em risco crítico", color: "text-destructive", bg: "bg-destructive/10", icon: "ri-alert-fill" };
  if (media < 6 || freq < 75) return { label: "Em recuperação", color: "text-warning-foreground", bg: "bg-warning/10", icon: "ri-error-warning-line" };
  return { label: "Saudável", color: "text-secondary", bg: "bg-secondary/10", icon: "ri-heart-pulse-line" };
}

function generateInsight(media: number, freq: number): string {
  if (freq < 60 && media < 5) return "A frequência muito baixa combinada com notas críticas indica necessidade de intervenção urgente com a família.";
  if (freq < 75 && media < 6) return "A baixa frequência está impactando diretamente o desempenho acadêmico. Recomenda-se acompanhamento pedagógico.";
  if (freq < 75) return "A frequência abaixo do esperado pode comprometer o rendimento nos próximos bimestres.";
  if (media < 6) return "O desempenho acadêmico está abaixo da média. Considere reforço nas disciplinas mais críticas.";
  return "O aluno apresenta desempenho satisfatório. Manter acompanhamento regular.";
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
  const insight = generateInsight(mediaGeral, freqPercent);

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
    // Mock behavior and participation since no table exists
    const behaviorScore = selectedBehaviors.some(b => ["Indisciplinado", "Distraído"].includes(b)) ? 40 : 80;
    const participationScore = selectedBehaviors.includes("Participativo") ? 85 : selectedBehaviors.includes("Colaborativo") ? 90 : 50;
    return [
      { dimension: "Notas", value: normMedia },
      { dimension: "Frequência", value: normFreq },
      { dimension: "Comportamento", value: behaviorScore },
      { dimension: "Participação", value: participationScore },
    ];
  }, [mediaGeral, freqPercent, selectedBehaviors]);

  // Risk factors
  const riskFactors = useMemo(() => {
    const factors: { label: string; percent: number; color: string }[] = [];
    if (freqPercent < 75) factors.push({ label: "Baixa Frequência", percent: Math.round(100 - freqPercent), color: "bg-destructive" });
    if (mediaGeral < 6 && gradeValues.length > 0) factors.push({ label: "Notas Baixas", percent: Math.round((1 - mediaGeral / 10) * 100), color: "bg-warning" });
    const hasDisc = selectedBehaviors.some(b => ["Indisciplinado", "Distraído"].includes(b));
    if (hasDisc) factors.push({ label: "Comportamento", percent: 60, color: "bg-destructive/70" });
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

  // Recommended actions
  const recommendations = useMemo(() => {
    const recs: { text: string; type: string }[] = [];
    if (freqPercent < 75) recs.push({ text: "Convocar responsável para discutir frequência", type: "secretaria" });
    if (mediaGeral < 6 && gradeValues.length > 0) recs.push({ text: "Solicitar reforço nas disciplinas críticas", type: "professor" });
    if (freqPercent < 60 && mediaGeral < 5) recs.push({ text: "Encaminhar para conselho de classe urgente", type: "coordenacao" });
    if (interventionStats.aberto > 0) recs.push({ text: `${interventionStats.aberto} intervenção(ões) aguardando ação do professor`, type: "professor" });
    if (recs.length === 0) recs.push({ text: "Manter acompanhamento regular — situação estável", type: "info" });
    return recs;
  }, [freqPercent, mediaGeral, gradeValues.length, interventionStats.aberto]);

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
        <section className={cn("rounded-2xl border p-6 md:p-8 relative overflow-hidden", situation.bg, "border-border/40")}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Photo */}
            {student.photo_url ? (
              <img src={student.photo_url} alt={student.full_name}
                className="w-20 h-20 rounded-full object-cover border-4 border-card shadow-lg" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-card/80 border-4 border-card shadow-lg flex items-center justify-center">
                <i className="ri-user-line text-3xl text-muted-foreground" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-primary truncate">{student.full_name}</h1>
                <span className={cn("inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold", situation.bg, situation.color)}>
                  <i className={situation.icon} /> {situation.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {s.classes?.name || "Sem turma"} · {s.classes?.grade || ""} · {s.classes?.shift || ""}
              </p>

              <div className="flex flex-wrap gap-6">
                <div>
                  <div className="text-xs font-bold text-muted-foreground">Média Geral</div>
                  <div className={cn("text-2xl font-bold", mediaGeral >= 6 ? "text-secondary" : "text-destructive")}>
                    {gradeValues.length > 0 ? mediaGeral.toFixed(1) : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-muted-foreground">Frequência</div>
                  <div className={cn("text-2xl font-bold", freqPercent >= 75 ? "text-secondary" : "text-destructive")}>
                    {totalAttendance > 0 ? `${freqPercent.toFixed(0)}%` : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-muted-foreground">Intervenções</div>
                  <div className="text-2xl font-bold text-primary">{interventions.length}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 shrink-0">
              <Button size="sm" onClick={() => setReportOpen(true)} className="gap-2">
                <i className="ri-file-chart-line" /> Gerar Relatório
              </Button>
              <Link to={`/admin/alunos/${id}`}>
                <Button variant="outline" size="sm" className="gap-2 w-full">
                  <i className="ri-arrow-left-line" /> Voltar
                </Button>
              </Link>
            </div>
          </div>

          {/* Narrative sentence */}
          <div className="mt-4 p-3 rounded-xl bg-card/60 border border-border/30">
            <p className="text-sm text-muted-foreground italic leading-relaxed">
              <i className="ri-lightbulb-line mr-1 text-warning" />
              {insight}
            </p>
          </div>
        </section>

        {/* ═══ 2. TIMELINE ═══════════════════════════════════════════ */}
        {gradesByTerm.length >= 2 && (
          <section className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
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
          <section className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
            <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
              <i className="ri-stethoscope-line text-destructive" /> Diagnóstico
            </h2>

            {riskFactors.length > 0 ? (
              <div className="space-y-3 mb-5">
                {riskFactors.map(f => (
                  <div key={f.label}>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-primary">{f.label}</span>
                      <span className="text-muted-foreground">{f.percent}% impacto</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/20 overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", f.color)} style={{ width: `${f.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-5">Nenhum fator de risco identificado.</p>
            )}

            {/* Subject performance */}
            {subjectMap.length > 0 && (
              <>
                <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Desempenho por Disciplina</h3>
                <div className="space-y-2">
                  {subjectMap.map(s => (
                    <div key={s.name} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-primary w-28 truncate">{s.name}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted/20 overflow-hidden">
                        <div className={cn("h-full rounded-full", s.media >= 6 ? "bg-secondary" : "bg-destructive")} style={{ width: `${(s.media / 10) * 100}%` }} />
                      </div>
                      <span className={cn("text-xs font-bold w-8 text-right", s.media >= 6 ? "text-secondary" : "text-destructive")}>
                        {s.media.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Radar */}
          <section className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
            <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
              <i className="ri-compass-3-line text-secondary" /> Radar de Competências
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="value" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </section>
        </div>

        {/* ═══ 5. INTERVENÇÕES ═════════════════════════════════════════ */}
        <section className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-primary flex items-center gap-2">
              <i className="ri-shield-check-line text-secondary" /> Intervenções Pedagógicas
            </h2>
            <div className="flex gap-4 text-xs font-bold">
              <span className="text-secondary"><i className="ri-arrow-up-circle-line mr-1" />{interventionStats.melhorou} melhorou</span>
              <span className="text-muted-foreground"><i className="ri-subtract-line mr-1" />{interventionStats.sem_mudanca} sem mudança</span>
              <span className="text-destructive"><i className="ri-arrow-down-circle-line mr-1" />{interventionStats.piorou} piorou</span>
            </div>
          </div>

          {interventions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma intervenção registrada.</p>
          ) : (
            <div className="space-y-3">
              {interventions.slice(0, 5).map(i => (
                <div key={i.id} className="flex items-start gap-4 p-4 rounded-xl border border-border/30 bg-background/50">
                  <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0",
                    i.status === "resolvido" ? "bg-secondary" : i.status === "em_andamento" ? "bg-warning" : "bg-destructive"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-primary">{i.reason}</span>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", severityColor[i.severity] || "bg-muted/20 text-muted-foreground")}>
                        {severityLabel[i.severity] || i.severity}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted/15 text-muted-foreground">
                        {statusLabel[i.status] || i.status}
                      </span>
                    </div>
                    {i.teacher_notes && <p className="text-xs text-muted-foreground mt-1">"{i.teacher_notes}"</p>}
                    {i.impact && (
                      <span className={cn("inline-flex items-center gap-1 text-xs font-bold mt-1",
                        i.impact === "melhorou" ? "text-secondary" : i.impact === "piorou" ? "text-destructive" : "text-muted-foreground"
                      )}>
                        <i className={impactIcon[i.impact] || ""} /> {impactLabel[i.impact] || i.impact}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(i.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ═══ 6. AÇÕES RECOMENDADAS ═════════════════════════════════ */}
        <section className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
          <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
            <i className="ri-flashlight-line text-warning" /> Ações Recomendadas
          </h2>
          <div className="space-y-3">
            {recommendations.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/30 bg-background/50">
                <div className="flex items-center gap-3">
                  <i className={cn("text-lg",
                    r.type === "secretaria" ? "ri-building-line text-primary" :
                    r.type === "professor" ? "ri-user-star-line text-secondary" :
                    r.type === "coordenacao" ? "ri-alarm-warning-line text-destructive" :
                    "ri-checkbox-circle-line text-secondary"
                  )} />
                  <span className="text-sm text-primary">{r.text}</span>
                </div>
                <div className="flex gap-2">
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
        <section className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
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
              <p className="text-muted-foreground">
                {student.full_name} está classificado como <strong className={situation.color}>{situation.label}</strong>.
                {gradeValues.length > 0 && ` Média geral: ${mediaGeral.toFixed(1)}.`}
                {totalAttendance > 0 && ` Frequência: ${freqPercent.toFixed(0)}%.`}
              </p>
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
              <h4 className="font-bold text-primary mb-1">Intervenções</h4>
              <p className="text-muted-foreground">
                {interventions.length === 0 ? "Nenhuma intervenção registrada." :
                  `${interventions.length} intervenção(ões). ${interventionStats.melhorou} com melhora, ${interventionStats.piorou} com piora, ${interventionStats.sem_mudanca} sem mudança.`}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-primary mb-1">Recomendação</h4>
              <p className="text-muted-foreground">{insight}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>Fechar</Button>
            <Button onClick={() => { window.print(); toast.success("Preparando impressão..."); }}>
              <i className="ri-printer-line mr-2" /> Imprimir
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

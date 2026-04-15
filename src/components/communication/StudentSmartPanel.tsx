import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, TrendingDown, UserCheck, Activity, BookOpen, Clock, Lightbulb, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Student {
  id: string;
  full_name: string;
  status: string | null;
  class_id: string | null;
}

interface Props {
  student: Student | null;
  schoolId: string | null;
  onSuggest: (msg: string) => void;
}

const StudentSmartPanel = ({ student, schoolId, onSuggest }: Props) => {
  // Attendance stats
  const { data: attendance } = useQuery({
    queryKey: ["comm-attendance", student?.id, schoolId],
    queryFn: async () => {
      if (!student?.id || !schoolId) return null;
      const { data } = await supabase
        .from("attendance")
        .select("status")
        .eq("student_id", student.id)
        .eq("school_id", schoolId);
      if (!data || data.length === 0) return null;
      const total = data.length;
      const present = data.filter((a) => a.status === "presente").length;
      return { total, present, percent: Math.round((present / total) * 100) };
    },
    enabled: !!student?.id && !!schoolId,
  });

  // Grades average
  const { data: gradesAvg } = useQuery({
    queryKey: ["comm-grades", student?.id, schoolId],
    queryFn: async () => {
      if (!student?.id || !schoolId) return null;
      const { data } = await supabase
        .from("grades")
        .select("grade_value")
        .eq("student_id", student.id)
        .eq("school_id", schoolId);
      if (!data || data.length === 0) return null;
      const vals = data.filter((g) => g.grade_value != null).map((g) => Number(g.grade_value));
      if (vals.length === 0) return null;
      return { avg: Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)), count: vals.length };
    },
    enabled: !!student?.id && !!schoolId,
  });

  // Open interventions
  const { data: interventions = [] } = useQuery({
    queryKey: ["comm-interventions", student?.id, schoolId],
    queryFn: async () => {
      if (!student?.id || !schoolId) return [];
      const { data } = await supabase
        .from("pedagogical_interventions")
        .select("id, reason, severity, status")
        .eq("student_id", student.id)
        .eq("school_id", schoolId)
        .eq("status", "aberto");
      return data ?? [];
    },
    enabled: !!student?.id && !!schoolId,
  });

  const lowFreq = attendance && attendance.percent < 75;
  const lowGrade = gradesAvg && gradesAvg.avg < 6;

  const getStatusBadge = () => {
    if (lowFreq && lowGrade) return { label: "Crítico", color: "bg-destructive/15 text-destructive border-destructive/30" };
    if (lowFreq || lowGrade || interventions.length > 0) return { label: "Atenção", color: "bg-amber-500/15 text-amber-700 border-amber-500/30" };
    return { label: "Regular", color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" };
  };

  const suggestions = [
    {
      label: "Baixa frequência",
      icon: Clock,
      show: !!lowFreq,
      text: `Prezado(a) responsável, informamos que o(a) aluno(a) ${student?.full_name ?? "[NOME]"} apresenta frequência de ${attendance?.percent ?? 0}%, abaixo do mínimo exigido de 75%. Solicitamos atenção para regularizar a situação.`,
    },
    {
      label: "Baixo desempenho",
      icon: TrendingDown,
      show: !!lowGrade,
      text: `Prezado(a) responsável, informamos que o(a) aluno(a) ${student?.full_name ?? "[NOME]"} apresenta média de ${gradesAvg?.avg ?? 0}, abaixo da média mínima. Recomendamos acompanhamento pedagógico.`,
    },
    {
      label: "Convocação de responsável",
      icon: UserCheck,
      show: true,
      text: `Prezado(a) responsável, solicitamos seu comparecimento à escola para tratar de assuntos referentes ao(à) aluno(a) ${student?.full_name ?? "[NOME]"}. Favor agendar na secretaria.`,
    },
  ];

  if (!student) {
    return (
      <Card className="rounded-2xl border-border/50 h-full">
        <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[400px] text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">Painel Inteligente</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Selecione um aluno para ver informações contextuais</p>
        </CardContent>
      </Card>
    );
  }

  const status = getStatusBadge();

  return (
    <div className="flex flex-col gap-4">
      {/* Student header */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Painel do Aluno</h3>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${status.color}`}>
              {status.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Frequency */}
            <div className="rounded-xl bg-muted/30 p-3 border border-border/30">
              <div className="flex items-center gap-1.5 mb-1">
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Frequência</span>
              </div>
              <p className={`text-xl font-bold ${lowFreq ? "text-destructive" : "text-foreground"}`}>
                {attendance ? `${attendance.percent}%` : "—"}
              </p>
              {attendance && (
                <p className="text-[10px] text-muted-foreground">{attendance.present}/{attendance.total} presenças</p>
              )}
            </div>

            {/* Grades */}
            <div className="rounded-xl bg-muted/30 p-3 border border-border/30">
              <div className="flex items-center gap-1.5 mb-1">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Média</span>
              </div>
              <p className={`text-xl font-bold ${lowGrade ? "text-destructive" : "text-foreground"}`}>
                {gradesAvg ? gradesAvg.avg : "—"}
              </p>
              {gradesAvg && (
                <p className="text-[10px] text-muted-foreground">{gradesAvg.count} avaliações</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {(lowFreq || lowGrade || interventions.length > 0) && (
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-5 space-y-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Alertas
            </h3>
            {lowFreq && (
              <div className="flex items-start gap-2 rounded-xl bg-destructive/5 border border-destructive/20 px-3 py-2">
                <Clock className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                <p className="text-xs text-destructive">Frequência abaixo de 75% ({attendance?.percent}%)</p>
              </div>
            )}
            {lowGrade && (
              <div className="flex items-start gap-2 rounded-xl bg-amber-500/5 border border-amber-500/20 px-3 py-2">
                <TrendingDown className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">Média abaixo de 6,0 ({gradesAvg?.avg})</p>
              </div>
            )}
            {interventions.length > 0 && (
              <div className="flex items-start gap-2 rounded-xl bg-amber-500/5 border border-amber-500/20 px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">{interventions.length} intervenção(ões) pedagógica(s) aberta(s)</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-5 space-y-2">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            Sugestões de Mensagem
          </h3>
          <div className="flex flex-col gap-2">
            {suggestions.filter((s) => s.show).map((s) => (
              <button
                key={s.label}
                onClick={() => onSuggest(s.text)}
                className="flex items-center gap-2.5 rounded-xl bg-primary/5 border border-primary/20 px-3 py-2.5 hover:bg-primary/10 transition-colors text-left w-full"
              >
                <s.icon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-semibold text-foreground">{s.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentSmartPanel;

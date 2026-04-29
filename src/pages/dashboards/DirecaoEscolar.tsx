import { useMemo, useState } from "react";
import RelatorioTurmaModal from "@/components/direcao/RelatorioTurmaModal";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  Users,
  GraduationCap,
  TrendingDown,
  Activity,
  ArrowRight,
  FileText,
  ClipboardList,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { differenceInDays, format } from "date-fns";
import RoleLayout from "@/components/layout/RoleLayout";
import { toast } from "sonner";

const STATUS_LABEL: Record<string, { label: string; class: string }> = {
  aberto: { label: "Pendente", class: "bg-blue-100 text-blue-700" },
  pendente: { label: "Pendente", class: "bg-blue-100 text-blue-700" },
  em_andamento: { label: "Em andamento", class: "bg-amber-100 text-amber-700" },
  "em andamento": { label: "Em andamento", class: "bg-amber-100 text-amber-700" },
  concluido: { label: "Concluído", class: "bg-emerald-100 text-emerald-700" },
  resolvido: { label: "Concluído", class: "bg-emerald-100 text-emerald-700" },
};

const PRIORITY_LABEL: Record<string, { label: string; class: string }> = {
  urgente: { label: "Urgente", class: "bg-destructive/15 text-destructive" },
  alta: { label: "Alta", class: "bg-orange-500/15 text-orange-700" },
  media: { label: "Média", class: "bg-blue-500/15 text-blue-700" },
  baixa: { label: "Baixa", class: "bg-muted text-muted-foreground" },
};

const isDone = (s: string) => s === "concluido" || s === "resolvido";

export default function DirecaoEscolar() {
  const navigate = useNavigate();
  const { schoolId, loading: loadingSchool } = useSchoolId();
  const [openRelTurma, setOpenRelTurma] = useState(false);

  // ---------- DEMANDAS DA SECRETARIA (mantido p/ Lista de Ação) ----------
  const { data: requests = [], isLoading: loadingReq } = useQuery({
    queryKey: ["direcao-secretary-requests", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secretary_requests")
        .select("*")
        .eq("school_id", schoolId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // ---------- ALUNOS ----------
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["direcao-students", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, full_name, status, class_id")
        .eq("school_id", schoolId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ---------- TURMAS ----------
  const { data: classes = [] } = useQuery({
    queryKey: ["direcao-classes", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, grade, shift")
        .eq("school_id", schoolId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ---------- NOTAS ----------
  const { data: grades = [] } = useQuery({
    queryKey: ["direcao-grades", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grades")
        .select("grade_value, student_id, school_id")
        .eq("school_id", schoolId!)
        .limit(5000);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ---------- FREQUÊNCIA ----------
  const { data: attendance = [] } = useQuery({
    queryKey: ["direcao-attendance", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("status, student_id, date")
        .eq("school_id", schoolId!)
        .limit(5000);
      if (error) throw error;
      return data ?? [];
    },
  });

  // ============= MÉTRICAS =============
  const totalAlunos = students.length;

  const mediaGeral = useMemo(() => {
    if (!grades.length) return 0;
    const valid = grades.filter((g: any) => g.grade_value != null);
    if (!valid.length) return 0;
    return valid.reduce((s: number, g: any) => s + Number(g.grade_value), 0) / valid.length;
  }, [grades]);

  // média por aluno → para risco
  const studentAvg = useMemo(() => {
    const map = new Map<string, { sum: number; n: number }>();
    grades.forEach((g: any) => {
      if (!g.student_id || g.grade_value == null) return;
      const cur = map.get(g.student_id) ?? { sum: 0, n: 0 };
      cur.sum += Number(g.grade_value);
      cur.n += 1;
      map.set(g.student_id, cur);
    });
    return new Map(Array.from(map, ([k, v]) => [k, v.n ? v.sum / v.n : 0]));
  }, [grades]);

  // frequência por aluno
  const studentFreq = useMemo(() => {
    const map = new Map<string, { p: number; t: number }>();
    attendance.forEach((a: any) => {
      if (!a.student_id) return;
      const cur = map.get(a.student_id) ?? { p: 0, t: 0 };
      cur.t += 1;
      if (a.status === "presente") cur.p += 1;
      map.set(a.student_id, cur);
    });
    return new Map(
      Array.from(map, ([k, v]) => [k, v.t ? (v.p / v.t) * 100 : 100])
    );
  }, [attendance]);

  const frequenciaMedia = useMemo(() => {
    if (!attendance.length) return 0;
    const presentes = attendance.filter((a: any) => a.status === "presente").length;
    return (presentes / attendance.length) * 100;
  }, [attendance]);

  const alunosRisco = useMemo(() => {
    return students.filter((s: any) => {
      const avg = studentAvg.get(s.id) ?? 10;
      const freq = studentFreq.get(s.id) ?? 100;
      return avg < 6 || freq < 75;
    });
  }, [students, studentAvg, studentFreq]);

  const pctRisco = totalAlunos ? (alunosRisco.length / totalAlunos) * 100 : 0;

  // ============= BLOCO 2 - SAÚDE PEDAGÓGICA =============
  // Ranking de turmas (média + freq)
  const rankingTurmas = useMemo(() => {
    return classes
      .map((c: any) => {
        const alunosTurma = students.filter((s: any) => s.class_id === c.id);
        const ids = alunosTurma.map((s: any) => s.id);
        const notas = ids
          .map((id) => studentAvg.get(id))
          .filter((v): v is number => typeof v === "number" && v > 0);
        const freqs = ids
          .map((id) => studentFreq.get(id))
          .filter((v): v is number => typeof v === "number");
        const media = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
        const freq = freqs.length ? freqs.reduce((a, b) => a + b, 0) / freqs.length : 0;
        return {
          id: c.id,
          name: c.name,
          alunos: alunosTurma.length,
          media,
          freq,
        };
      })
      .filter((t) => t.alunos > 0)
      .sort((a, b) => b.media - a.media);
  }, [classes, students, studentAvg, studentFreq]);

  const turmasCriticas = rankingTurmas.filter((t) => t.media < 6 || t.freq < 75);

  // Evolução (mock baseado em média atual — sem histórico real)
  const evolucao = useMemo(() => {
    const base = mediaGeral || 7;
    return [
      { mes: "Jan", media: +(base - 0.8).toFixed(1) },
      { mes: "Fev", media: +(base - 0.5).toFixed(1) },
      { mes: "Mar", media: +(base - 0.3).toFixed(1) },
      { mes: "Abr", media: +(base - 0.1).toFixed(1) },
      { mes: "Mai", media: +base.toFixed(1) },
    ];
  }, [mediaGeral]);

  // ============= BLOCO 3 - ALERTAS INTELIGENTES =============
  const alertas = useMemo(() => {
    const list: Array<{ icon: string; text: string; onClick?: () => void; severity: "warn" | "danger" }> = [];

    const baixaFreq = students.filter((s: any) => (studentFreq.get(s.id) ?? 100) < 75);
    if (baixaFreq.length) {
      list.push({
        icon: "⚠️",
        severity: "warn",
        text: `${baixaFreq.length} ${baixaFreq.length === 1 ? "aluno" : "alunos"} com frequência abaixo de 75%`,
        onClick: () => navigate("/admin/alunos?filtro=frequencia"),
      });
    }

    rankingTurmas
      .filter((t) => t.media > 0 && t.media < 6)
      .forEach((t) =>
        list.push({
          icon: "🚨",
          severity: "danger",
          text: `Turma ${t.name} com média ${t.media.toFixed(1)}`,
          onClick: () => navigate(`/admin/turmas`),
        })
      );

    const baixoDesempenho = students.filter(
      (s: any) => (studentAvg.get(s.id) ?? 10) > 0 && (studentAvg.get(s.id) ?? 10) < 6
    );
    if (baixoDesempenho.length) {
      list.push({
        icon: "⚠️",
        severity: "warn",
        text: `${baixoDesempenho.length} ${baixoDesempenho.length === 1 ? "aluno" : "alunos"} com desempenho abaixo da média`,
        onClick: () => navigate("/admin/alunos?filtro=notas"),
      });
    }

    return list;
  }, [students, studentAvg, studentFreq, rankingTurmas, navigate]);

  // ============= BLOCO 4 - AÇÕES RECOMENDADAS =============
  const acoes = useMemo(() => {
    const list: Array<{ text: string; onClick: () => void }> = [];
    if (turmasCriticas.length) {
      list.push({
        text: `Intervir na turma ${turmasCriticas[0].name} (média ${turmasCriticas[0].media.toFixed(1)})`,
        onClick: () => navigate(`/admin/turmas`),
      });
    }
    if (mediaGeral > 0 && mediaGeral < 7) {
      list.push({
        text: "Revisar desempenho geral das disciplinas",
        onClick: () => navigate("/admin/notas"),
      });
    }
    if (pctRisco > 15) {
      list.push({
        text: "Agendar reunião com responsáveis dos alunos em risco",
        onClick: () => navigate("/admin/comunicacao"),
      });
    }
    if (frequenciaMedia > 0 && frequenciaMedia < 85) {
      list.push({
        text: "Plano de ação para melhorar a frequência escolar",
        onClick: () => navigate("/admin/frequencia"),
      });
    }
    if (!list.length) {
      list.push({
        text: "Manter acompanhamento contínuo dos indicadores pedagógicos",
        onClick: () => navigate("/admin/indicadores"),
      });
    }
    return list;
  }, [turmasCriticas, mediaGeral, pctRisco, frequenciaMedia, navigate]);

  // ============= LISTA DE AÇÃO (DEMANDAS) =============
  const atrasadas = useMemo(
    () =>
      requests.filter(
        (r: any) => !isDone(r.status) && differenceInDays(new Date(), new Date(r.created_at)) > 3
      ),
    [requests]
  );

  const lista = useMemo(
    () =>
      requests
        .filter((r: any) => !isDone(r.status))
        .sort(
          (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        .slice(0, 10),
    [requests]
  );

  const loading =
    loadingSchool || loadingReq || loadingStudents;

  return (
    <RoleLayout title="Direção Escolar">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <header>
          <p className="text-sm text-muted-foreground">
            Painel executivo de gestão escolar — indicadores, alertas e decisões.
          </p>
        </header>

        {/* ============ BLOCO 1 — VISÃO EXECUTIVA ============ */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Alunos
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? "—" : totalAlunos}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Média Geral da Escola
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? "—" : mediaGeral.toFixed(1)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                % Alunos em Risco
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? "—" : `${pctRisco.toFixed(0)}%`}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {alunosRisco.length} {alunosRisco.length === 1 ? "aluno" : "alunos"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Frequência Média
              </CardTitle>
              <Activity className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? "—" : `${frequenciaMedia.toFixed(0)}%`}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ============ BLOCO 2 — SAÚDE PEDAGÓGICA ============ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolução da Escola</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={evolucao}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                      fontSize: 13,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="media"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ranking de Turmas</CardTitle>
            </CardHeader>
            <CardContent>
              {rankingTurmas.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Sem turmas com dados suficientes.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {rankingTurmas.slice(0, 6).map((t, i) => {
                    const critica = t.media < 6 || t.freq < 75;
                    return (
                      <li
                        key={t.id}
                        className="py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-bold text-muted-foreground w-5">
                            {i + 1}º
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {t.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t.alunos} {t.alunos === 1 ? "aluno" : "alunos"} · Freq {t.freq.toFixed(0)}%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="secondary"
                            className={
                              critica
                                ? "bg-destructive/15 text-destructive"
                                : t.media >= 7
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }
                          >
                            {t.media.toFixed(1)}
                          </Badge>
                          {critica && (
                            <Badge variant="secondary" className="bg-destructive/15 text-destructive">
                              Crítica
                            </Badge>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ============ BLOCO 3 — ALERTAS INTELIGENTES ============ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Alertas Inteligentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Nenhum alerta no momento. 🎉
              </p>
            ) : (
              <ul className="space-y-2">
                {alertas.map((a, i) => (
                  <li key={i}>
                    <button
                      onClick={a.onClick}
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-accent ${
                        a.severity === "danger"
                          ? "border-destructive/30 bg-destructive/5"
                          : "border-amber-500/30 bg-amber-500/5"
                      }`}
                    >
                      <span className="text-lg">{a.icon}</span>
                      <span className="text-sm font-medium text-foreground flex-1">
                        {a.text}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ============ BLOCO 4 — AÇÕES RECOMENDADAS ============ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ações Recomendadas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {acoes.map((a, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <span className="text-sm text-foreground">{a.text}</span>
                  <Button size="sm" variant="default" onClick={a.onClick} className="gap-1">
                    Executar <ArrowRight className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* ============ BLOCO 5 — RELATÓRIOS ============ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Relatórios
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              variant="default"
              onClick={() => {
                toast.info("Gerando relatório geral...");
                navigate("/admin/indicadores");
              }}
            >
              Gerar Relatório Geral
            </Button>
            <Button variant="outline" onClick={() => setOpenRelTurma(true)}>
              Relatório por Turma
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                toast.info("Selecione o aluno");
                navigate("/admin/alunos");
              }}
            >
              Relatório por Aluno
            </Button>
          </CardContent>
        </Card>

        {/* ============ DEMANDAS DA SECRETARIA (mantido) ============ */}
        {atrasadas.length > 0 && (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              ⚠️ {atrasadas.length} {atrasadas.length === 1 ? "demanda" : "demandas"} com mais de 3 dias em aberto
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Demandas da Secretaria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingReq ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Carregando demandas...</p>
            ) : lista.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Nenhuma demanda pendente no momento.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {lista.map((r: any) => {
                  const days = differenceInDays(new Date(), new Date(r.created_at));
                  const st = STATUS_LABEL[r.status] || STATUS_LABEL.pendente;
                  const pr = PRIORITY_LABEL[r.priority] || PRIORITY_LABEL.media;
                  const overdue = !isDone(r.status) && days > 3;
                  return (
                    <li key={r.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {r.student_name || "Aluno não identificado"}
                          </p>
                          <Badge variant="secondary" className={pr.class}>
                            {pr.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {r.request_type}
                          {r.description ? ` · ${r.description}` : ""}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Criada em {format(new Date(r.created_at), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant="secondary" className={st.class}>
                          {st.label}
                        </Badge>
                        <span
                          className={`text-xs ${
                            overdue ? "text-destructive font-semibold" : "text-muted-foreground"
                          }`}
                        >
                          {days === 0 ? "hoje" : `${days} ${days === 1 ? "dia" : "dias"}`}
                        </span>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => navigate(`/secretaria/atendimento/${r.id}`)}
                          className="gap-1"
                        >
                          Atender <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      <RelatorioTurmaModal
        open={openRelTurma}
        onOpenChange={setOpenRelTurma}
        schoolId={schoolId}
      />
    </RoleLayout>
  );
}

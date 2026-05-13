import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import RoleLayout from "@/components/layout/RoleLayout";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  MessageSquare,
  PhoneCall,
  Activity,
  User,
  Send,
  Megaphone,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import TeacherDiaryModal from "@/components/professor/TeacherDiaryModal";

const ProfessorDashboard = () => {
  const { schoolId } = useSchoolId();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [actionModal, setActionModal] = useState<{ intervention: any; type: string } | null>(null);
  const [resolveModal, setResolveModal] = useState<any | null>(null);
  const [diaryAssignment, setDiaryAssignment] = useState<any | null>(null);
  const [notes, setNotes] = useState("");
  const [resolveNotes, setResolveNotes] = useState("");
  const [resolveImpact, setResolveImpact] = useState("");
  const { data: avisos = [] } = useQuery({
    queryKey: ["professor-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_announcements")
        .select("*")
        .eq("school_id", "d877c9e1-5c64-401d-ac6d-ff6ed1a87a71")
        .in("audience", ["todos", "professor"])
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      console.log("DATA ANNOUNCEMENTS:", data);

      return data ?? [];
    },
  });
  console.log("AVISOS:", avisos);
  /* ── Find teacher record for current user ── */
  const { data: currentTeacher } = useQuery({
    queryKey: ["professor-teacher", schoolId, session?.user?.id],
    queryFn: async () => {
      if (!schoolId || !session?.user?.id) return null;
      const { data } = await supabase
        .from("teachers")
        .select("id, full_name")
        .eq("school_id", schoolId)
        .eq("profile_id", session.user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!schoolId && !!session?.user?.id,
  });

  /* ── Fetch interventions — only where teacher_id is set (never null) ── */
  const { data: interventions = [] } = useQuery({
    queryKey: ["professor-interventions", schoolId, currentTeacher?.id],
    queryFn: async () => {
      if (!schoolId || !currentTeacher?.id) return [];
      const { data } = await supabase
        .from("pedagogical_interventions")
        .select("*")
        .eq("school_id", schoolId)
        .eq("teacher_id", currentTeacher.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!schoolId && !!currentTeacher?.id,
  });

  /* ── Fetch related data ── */
  const { data: students = [] } = useQuery({
    queryKey: ["professor-students", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("students").select("id, full_name").eq("school_id", schoolId);
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["professor-subjects", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("subjects").select("id, name").eq("school_id", schoolId);
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  const { data: assignments = [], error } = useQuery({
    queryKey: ["professor-assignments", schoolId, currentTeacher?.id],

    queryFn: async () => {
      console.log("SCHOOL_ID:", schoolId);
      console.log("CURRENT_TEACHER:", currentTeacher);

      if (!schoolId || !currentTeacher?.id) {
        console.log("QUERY BLOQUEADA");
        return [];
      }

      const response = await supabase
        .from("teacher_assignments")
        .select("*")
        .eq("school_id", schoolId)
        .eq("teacher_id", currentTeacher.id);

      console.log("SUPABASE RESPONSE:", response);

      if (response.error) {
        console.error("SUPABASE ERROR:", response.error);
        return [];
      }

      return response.data ?? [];
    },

    enabled: !!schoolId && !!currentTeacher?.id,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["professor-classes", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("classes").select("id, name").eq("school_id", schoolId);
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  /* ── Mutations ── */
  const updateIntervention = useMutation({
    mutationFn: async ({
      id,
      status,
      action_type,
      teacher_notes,
    }: {
      id: string;
      status: string;
      action_type?: string;
      teacher_notes?: string;
    }) => {
      const { error } = await supabase
        .from("pedagogical_interventions")
        .update({
          status,
          ...(action_type ? { action_type } : {}),
          ...(teacher_notes ? { teacher_notes } : {}),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ação registrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["professor-interventions"] });
      setActionModal(null);
      setNotes("");
    },
    onError: () => toast.error("Erro ao registrar ação."),
  });

  const resolveIntervention = useMutation({
    mutationFn: async ({ id, impact, teacher_notes }: { id: string; impact: string; teacher_notes: string }) => {
      if (!teacher_notes.trim()) throw new Error("Informe suas observações antes de concluir.");
      if (!impact) throw new Error("Selecione o impacto.");
      const { error } = await supabase
        .from("pedagogical_interventions")
        .update({
          status: "resolvido",
          impact,
          teacher_notes,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Intervenção marcada como resolvida!");
      queryClient.invalidateQueries({ queryKey: ["professor-interventions"] });
      setResolveModal(null);
      setResolveNotes("");
      setResolveImpact("");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao resolver."),
  });

  const openAlerts = interventions.filter((i: any) => i.status === "aberto");
  const inProgress = interventions.filter((i: any) => i.status === "em_andamento");
  const resolved = interventions.filter((i: any) => i.status === "resolvido");

  const handleAction = (type: string) => {
    if (!actionModal) return;
    updateIntervention.mutate({
      id: actionModal.intervention.id,
      status: "em_andamento",
      action_type: type,
      teacher_notes: notes || undefined,
    });
  };

  return (
    <RoleLayout title="Professor">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Painel do Professor</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {currentTeacher ? `Olá, ${currentTeacher.full_name}` : "Gerencie suas turmas e ações pedagógicas"}
          </p>
        </div>

        {/* Quadro de Avisos */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
              <Megaphone className="h-4 w-4" />
              Quadro de Avisos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border/60">
              {avisos.map((a: any) => (
                <li key={a.id} className="py-3 flex items-start gap-3">
                  <span className="text-xs font-semibold text-secondary min-w-[44px] pt-0.5">
                    {new Date(a.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{a.title}</p>

                      <Badge variant="outline" className="text-[9px] border-primary/40 text-primary">
                        {a.audience === "todos" ? "Escola" : "Professores"}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">{a.content}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{assignments.length}</p>
                <p className="text-xs text-muted-foreground">Meus Vínculos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{openAlerts.length}</p>
                <p className="text-xs text-muted-foreground">Pontos de Atenção</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-warning-foreground" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{inProgress.length}</p>
                <p className="text-xs text-muted-foreground">Em Andamento</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{resolved.length}</p>
                <p className="text-xs text-muted-foreground">Resolvidas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── PONTOS DE ATENÇÃO (status = aberto) ── */}
        {openAlerts.length > 0 && (
          <Card className="rounded-2xl border-destructive/30 border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Pontos de Atenção da Coordenação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {openAlerts.map((item: any) => {
                  const student = students.find((st) => st.id === item.student_id);
                  const subject = subjects.find((su) => su.id === item.subject_id);
                  return (
                    <div key={item.id} className="rounded-xl border border-border/50 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center ${
                              item.severity === "critica"
                                ? "bg-destructive/10"
                                : item.severity === "alta"
                                  ? "bg-warning/10"
                                  : "bg-muted"
                            }`}
                          >
                            <User
                              className={`h-4 w-4 ${
                                item.severity === "critica"
                                  ? "text-destructive"
                                  : item.severity === "alta"
                                    ? "text-warning-foreground"
                                    : "text-muted-foreground"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{student?.full_name || "Aluno"}</p>
                            {subject && <p className="text-[11px] text-muted-foreground">{subject.name}</p>}
                          </div>
                        </div>
                        <Badge variant={item.severity === "critica" ? "destructive" : "outline"} className="text-[9px]">
                          {item.severity === "critica"
                            ? "🔴 Crítico"
                            : item.severity === "alta"
                              ? "🟠 Alto"
                              : "🟡 Médio"}
                        </Badge>
                      </div>

                      <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                        <p className="text-xs text-foreground font-medium">{item.reason}</p>
                        {item.recommendation && <p className="text-[11px] text-primary">💡 {item.recommendation}</p>}
                        <div className="flex gap-3 mt-1">
                          {item.avg_grade != null && (
                            <span className="text-[10px] text-muted-foreground">
                              Média: {Number(item.avg_grade).toFixed(1)}
                            </span>
                          )}
                          {item.freq_percent != null && (
                            <span className="text-[10px] text-muted-foreground">
                              Freq: {Number(item.freq_percent).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          className="text-[11px] h-7 gap-1.5"
                          onClick={() => {
                            setActionModal({ intervention: item, type: "intervencao" });
                            setNotes("");
                          }}
                        >
                          <CheckCircle2 className="h-3 w-3" /> Registrar Ação
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[11px] h-7 gap-1.5"
                          onClick={() => {
                            setActionModal({ intervention: item, type: "observacao" });
                            setNotes("");
                          }}
                        >
                          <MessageSquare className="h-3 w-3" /> Observação
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[11px] h-7 gap-1.5"
                          onClick={() => {
                            setActionModal({ intervention: item, type: "contato_responsavel" });
                            setNotes("");
                          }}
                        >
                          <PhoneCall className="h-3 w-3" /> Contato Responsável
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── EM ANDAMENTO ── */}
        {inProgress.length > 0 && (
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-warning-foreground" />
                Intervenções em Andamento ({inProgress.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {inProgress.map((item: any) => {
                  const student = students.find((st) => st.id === item.student_id);
                  return (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3">
                      <Clock className="h-4 w-4 text-warning-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{student?.full_name || "Aluno"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{item.reason}</p>
                        {item.action_type && (
                          <Badge variant="outline" className="text-[9px] mt-0.5">
                            {item.action_type === "intervencao"
                              ? "Intervenção"
                              : item.action_type === "observacao"
                                ? "Observação"
                                : "Contato Resp."}
                          </Badge>
                        )}
                        {item.teacher_notes && (
                          <p className="text-[10px] text-foreground mt-1">📝 {item.teacher_notes}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="text-[10px] h-7 gap-1 shrink-0"
                        onClick={() => {
                          setResolveModal(item);
                          setResolveNotes(item.teacher_notes || "");
                          setResolveImpact("");
                        }}
                      >
                        <CheckCircle2 className="h-3 w-3" /> Concluir
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── RESOLVIDAS ── */}
        {resolved.length > 0 && (
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-secondary" />
                Resolvidas ({resolved.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {resolved.slice(0, 5).map((item: any) => {
                  const student = students.find((st) => st.id === item.student_id);
                  return (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3">
                      <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{student?.full_name || "Aluno"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{item.reason}</p>
                        {item.teacher_notes && (
                          <p className="text-[10px] text-foreground mt-1">📝 {item.teacher_notes}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {item.impact && (
                          <span
                            className={`text-[10px] font-semibold ${
                              item.impact === "melhorou"
                                ? "text-secondary"
                                : item.impact === "piorou"
                                  ? "text-destructive"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {item.impact === "melhorou"
                              ? "↑ Melhorou"
                              : item.impact === "piorou"
                                ? "↓ Piorou"
                                : "— Sem mudança"}
                          </span>
                        )}
                        {item.action_type && (
                          <Badge variant="outline" className="text-[8px]">
                            {item.action_type === "intervencao"
                              ? "Intervenção"
                              : item.action_type === "observacao"
                                ? "Observação"
                                : "Contato Resp."}
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

        {/* ── Vínculos ── */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Meus Vínculos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum vínculo encontrado.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {assignments.map((a) => {
                  const cls = classes.find((c) => c.id === a.class_id);
                  const sub = subjects.find((s) => s.id === a.subject_id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setDiaryAssignment({ ...a, className: cls?.name, subjectName: sub?.name })}
                      className="rounded-xl bg-muted/30 hover:bg-muted/60 border border-transparent hover:border-primary/40 p-4 flex items-center gap-3 text-left transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{cls?.name || "Turma"}</p>
                        <p className="text-[10px] text-muted-foreground">{sub?.name || "Disciplina"}</p>
                      </div>
                      <span className="text-[10px] font-bold text-primary">Abrir diário →</span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Action Modal (aberto → em_andamento) ── */}
      <Dialog
        open={!!actionModal}
        onOpenChange={() => {
          setActionModal(null);
          setNotes("");
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {actionModal?.type === "intervencao"
                ? "Registrar Intervenção"
                : actionModal?.type === "observacao"
                  ? "Registrar Observação"
                  : "Solicitar Contato com Responsável"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {actionModal && (
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs font-medium text-foreground">
                  {students.find((s) => s.id === actionModal.intervention.student_id)?.full_name || "Aluno"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">{actionModal.intervention.reason}</p>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Observações (opcional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Descreva a ação realizada ou observação..."
                className="text-sm"
                rows={3}
                maxLength={500}
              />
            </div>
            <Button
              className="w-full gap-2"
              onClick={() => handleAction(actionModal?.type || "intervencao")}
              disabled={updateIntervention.isPending}
            >
              <Send className="h-4 w-4" />
              Confirmar e Registrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Resolve Modal (em_andamento → resolvido) ── */}
      <Dialog
        open={!!resolveModal}
        onOpenChange={() => {
          setResolveModal(null);
          setResolveNotes("");
          setResolveImpact("");
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-secondary" />
              Concluir Intervenção
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {resolveModal && (
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs font-medium text-foreground">
                  {students.find((s) => s.id === resolveModal.student_id)?.full_name || "Aluno"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">{resolveModal.reason}</p>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Suas observações finais *</label>
              <Textarea
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="Descreva o que foi feito e o resultado observado..."
                className="text-sm"
                rows={3}
                maxLength={500}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Impacto observado *</label>
              <Select value={resolveImpact} onValueChange={setResolveImpact}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o impacto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="melhorou">↑ Melhorou</SelectItem>
                  <SelectItem value="sem_mudanca">— Sem mudança</SelectItem>
                  <SelectItem value="piorou">↓ Piorou</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full gap-2"
              onClick={() => {
                if (!resolveModal) return;
                resolveIntervention.mutate({
                  id: resolveModal.id,
                  impact: resolveImpact,
                  teacher_notes: resolveNotes,
                });
              }}
              disabled={resolveIntervention.isPending || !resolveNotes.trim() || !resolveImpact}
            >
              <CheckCircle2 className="h-4 w-4" />
              Concluir Intervenção
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <TeacherDiaryModal
        open={!!diaryAssignment}
        onOpenChange={(v) => !v && setDiaryAssignment(null)}
        assignment={diaryAssignment}
      />
    </RoleLayout>
  );
};

export default ProfessorDashboard;

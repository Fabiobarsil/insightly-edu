import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import RoleLayout from "@/components/layout/RoleLayout";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertTriangle, BookOpen, BarChart3, CheckCircle2,
  Clock, MessageSquare, PhoneCall, Activity, User, Send
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const ProfessorDashboard = () => {
  const { schoolId } = useSchoolId();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [actionModal, setActionModal] = useState<{ intervention: any; type: string } | null>(null);
  const [notes, setNotes] = useState("");

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

  /* ── Fetch interventions for this teacher ── */
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

  const { data: assignments = [] } = useQuery({
    queryKey: ["professor-assignments", schoolId, currentTeacher?.id],
    queryFn: async () => {
      if (!schoolId || !currentTeacher?.id) return [];
      const { data } = await supabase
        .from("teacher_assignments")
        .select("id, class_id, subject_id")
        .eq("school_id", schoolId)
        .eq("teacher_id", currentTeacher.id);
      return data ?? [];
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
    mutationFn: async ({ id, status, action_type, teacher_notes }: { id: string; status: string; action_type?: string; teacher_notes?: string }) => {
      const { error } = await supabase.from("pedagogical_interventions").update({
        status,
        ...(action_type ? { action_type } : {}),
        ...(teacher_notes ? { teacher_notes } : {}),
      }).eq("id", id);
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

  const handleResolve = (id: string, impact: string) => {
    supabase.from("pedagogical_interventions").update({ status: "resolvido", impact }).eq("id", id).then(({ error }) => {
      if (error) {
        toast.error("Erro ao resolver.");
      } else {
        toast.success("Intervenção marcada como resolvida!");
        queryClient.invalidateQueries({ queryKey: ["professor-interventions"] });
      }
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

        {/* ── PONTOS DE ATENÇÃO ── */}
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
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                            item.severity === "critica" ? "bg-destructive/10" : item.severity === "alta" ? "bg-warning/10" : "bg-muted"
                          }`}>
                            <User className={`h-4 w-4 ${
                              item.severity === "critica" ? "text-destructive" : item.severity === "alta" ? "text-warning-foreground" : "text-muted-foreground"
                            }`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{student?.full_name || "Aluno"}</p>
                            <p className="text-[11px] text-muted-foreground">{subject?.name || "Disciplina"}</p>
                          </div>
                        </div>
                        <Badge variant={item.severity === "critica" ? "destructive" : "outline"} className="text-[9px]">
                          {item.severity === "critica" ? "🔴 Crítico" : item.severity === "alta" ? "🟠 Alto" : "🟡 Médio"}
                        </Badge>
                      </div>

                      <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                        <p className="text-xs text-foreground font-medium">{item.reason}</p>
                        {item.recommendation && (
                          <p className="text-[11px] text-primary">💡 {item.recommendation}</p>
                        )}
                        <div className="flex gap-3 mt-1">
                          {item.avg_grade != null && (
                            <span className="text-[10px] text-muted-foreground">Média: {Number(item.avg_grade).toFixed(1)}</span>
                          )}
                          {item.freq_percent != null && (
                            <span className="text-[10px] text-muted-foreground">Freq: {Number(item.freq_percent).toFixed(0)}%</span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" className="text-[11px] h-7 gap-1.5" onClick={() => { setActionModal({ intervention: item, type: "intervencao" }); setNotes(""); }}>
                          <CheckCircle2 className="h-3 w-3" /> Marcar Intervenção
                        </Button>
                        <Button size="sm" variant="outline" className="text-[11px] h-7 gap-1.5" onClick={() => { setActionModal({ intervention: item, type: "observacao" }); setNotes(""); }}>
                          <MessageSquare className="h-3 w-3" /> Registrar Observação
                        </Button>
                        <Button size="sm" variant="outline" className="text-[11px] h-7 gap-1.5" onClick={() => { setActionModal({ intervention: item, type: "contato_responsavel" }); setNotes(""); }}>
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
                      <Clock className="h-4 w-4 text-warning-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{student?.full_name || "Aluno"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{item.reason}</p>
                        {item.action_type && (
                          <Badge variant="outline" className="text-[9px] mt-0.5">
                            {item.action_type === "intervencao" ? "Intervenção" : item.action_type === "observacao" ? "Observação" : "Contato Resp."}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => handleResolve(item.id, "melhorou")}>
                          ↑ Melhorou
                        </Button>
                        <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => handleResolve(item.id, "sem_mudanca")}>
                          — Igual
                        </Button>
                        <Button size="sm" variant="outline" className="text-[10px] h-6 px-2 text-destructive" onClick={() => handleResolve(item.id, "piorou")}>
                          ↓ Piorou
                        </Button>
                      </div>
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
                      <CheckCircle2 className="h-4 w-4 text-secondary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{student?.full_name || "Aluno"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{item.reason}</p>
                      </div>
                      {item.impact && (
                        <span className={`text-[10px] font-semibold ${
                          item.impact === "melhorou" ? "text-secondary" : item.impact === "piorou" ? "text-destructive" : "text-muted-foreground"
                        }`}>
                          {item.impact === "melhorou" ? "↑ Melhorou" : item.impact === "piorou" ? "↓ Piorou" : "— Sem mudança"}
                        </span>
                      )}
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
                    <div key={a.id} className="rounded-xl bg-muted/30 p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{cls?.name || "Turma"}</p>
                        <p className="text-[10px] text-muted-foreground">{sub?.name || "Disciplina"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Action Modal ── */}
      <Dialog open={!!actionModal} onOpenChange={() => { setActionModal(null); setNotes(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {actionModal?.type === "intervencao" ? "Registrar Intervenção"
                : actionModal?.type === "observacao" ? "Registrar Observação"
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
    </RoleLayout>
  );
};

export default ProfessorDashboard;

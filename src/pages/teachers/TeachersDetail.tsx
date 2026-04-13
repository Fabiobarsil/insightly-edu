import { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import StatusBadge from "@/components/shared/StatusBadge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { User, BookOpen, GraduationCap, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

const BEHAVIOR_TAGS = [
  { label: "Participativo", color: "bg-secondary/15 text-secondary border-secondary/30" },
  { label: "Distraído", color: "bg-warning/15 text-warning-foreground border-warning/30" },
  { label: "Evoluiu", color: "bg-primary/10 text-primary border-primary/30" },
  { label: "Indisciplinado", color: "bg-destructive/15 text-destructive border-destructive/30" },
];

const TeachersDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Local state for modal
  const [attendanceMap, setAttendanceMap] = useState<Record<string, "presente" | "falta">>({});
  const [gradesMap, setGradesMap] = useState<Record<string, string>>({});
  const [behaviorMap, setBehaviorMap] = useState<Record<string, string[]>>({});

  const { data: teacher, isLoading } = useQuery({
    queryKey: ["teacher", id],
    queryFn: async () => {
      const { data } = await supabase.from("teachers").select("*").eq("id", id!).maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["teacher-assignments-detail", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("teacher_assignments")
        .select("id, class_id, subject_id, classes:class_id (name, grade, shift), subjects:subject_id (name)")
        .eq("teacher_id", id!);
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["assignment-students", selectedAssignment?.class_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("students")
        .select("id, full_name, photo_url, status")
        .eq("class_id", selectedAssignment.class_id)
        .eq("status", "ativo")
        .order("full_name");
      return data ?? [];
    },
    enabled: !!selectedAssignment?.class_id,
  });

  // Save attendance
  const attendanceMutation = useMutation({
    mutationFn: async ({ studentId, status }: { studentId: string; status: string }) => {
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("attendance")
        .select("id")
        .eq("student_id", studentId)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        await supabase.from("attendance").update({ status }).eq("id", existing.id);
      } else {
        const { data: student } = await supabase.from("students").select("school_id").eq("id", studentId).maybeSingle();
        await supabase.from("attendance").insert({
          student_id: studentId,
          date: today,
          status,
          school_id: student?.school_id,
        });
      }
    },
    onError: () => toast.error("Erro ao salvar presença"),
  });

  // Save grade
  const gradeMutation = useMutation({
    mutationFn: async ({ studentId, value }: { studentId: string; value: number }) => {
      if (!selectedAssignment) return;
      const { data: existing } = await supabase
        .from("grades")
        .select("id")
        .eq("student_id", studentId)
        .eq("assignment_id", selectedAssignment.id)
        .maybeSingle();

      if (existing) {
        await supabase.from("grades").update({ grade_value: value }).eq("id", existing.id);
      } else {
        const { data: student } = await supabase.from("students").select("school_id").eq("id", studentId).maybeSingle();
        await supabase.from("grades").insert({
          student_id: studentId,
          assignment_id: selectedAssignment.id,
          grade_value: value,
          school_id: student?.school_id,
        });
      }
    },
    onSuccess: () => toast.success("Nota salva"),
    onError: () => toast.error("Erro ao salvar nota"),
  });

  const handleOpenAssignment = (assignment: any) => {
    setSelectedAssignment(assignment);
    setAttendanceMap({});
    setGradesMap({});
    setBehaviorMap({});
    setModalOpen(true);
  };

  const handleAttendance = useCallback((studentId: string, status: "presente" | "falta") => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
    attendanceMutation.mutate({ studentId, status });
  }, [attendanceMutation]);

  const handleGradeBlur = useCallback((studentId: string) => {
    const val = parseFloat(gradesMap[studentId]);
    if (!isNaN(val) && val >= 0 && val <= 10) {
      gradeMutation.mutate({ studentId, value: val });
    }
  }, [gradesMap, gradeMutation]);

  const toggleBehavior = useCallback((studentId: string, tag: string) => {
    setBehaviorMap((prev) => {
      const current = prev[studentId] ?? [];
      const updated = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
      return { ...prev, [studentId]: updated };
    });
    toast.success(`Comportamento atualizado`);
  }, []);

  const t = teacher as any;

  if (isLoading) {
    return (
      <AppLayout title="Professor" breadcrumbs={[{ label: "Professores", href: "/admin/professores" }, { label: "..." }]}>
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      </AppLayout>
    );
  }

  if (!t) {
    return (
      <AppLayout title="Professor" breadcrumbs={[{ label: "Professores", href: "/admin/professores" }, { label: "Não encontrado" }]}>
        <div className="text-center py-12 text-muted-foreground">Professor não encontrado.</div>
      </AppLayout>
    );
  }

  const uniqueSubjects = [...new Set(assignments.map((a: any) => a.subjects?.name).filter(Boolean))];
  const uniqueClasses = [...new Set(assignments.map((a: any) => a.classes?.name).filter(Boolean))];
  const uniqueShifts = [...new Set(assignments.map((a: any) => a.classes?.shift).filter(Boolean))];

  const selectedClass = selectedAssignment?.classes as any;
  const selectedSubject = selectedAssignment?.subjects as any;

  return (
    <AppLayout
      title={t.full_name || "Professor"}
      breadcrumbs={[{ label: "Professores", href: "/admin/professores" }, { label: t.full_name || "Detalhe" }]}
    >
      {/* Header */}
      <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground">{t.full_name || "—"}</h1>
              <StatusBadge status={t.status === "active" ? "active" : "inactive"} label={t.status === "active" ? "Ativo" : "Inativo"} />
            </div>
            <p className="text-sm text-muted-foreground">{t.email || "Sem e-mail"}</p>
          </div>
          <Link
            to={`/admin/professores/${id}/editar`}
            className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-accent transition-colors"
          >
            Editar
          </Link>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            {uniqueSubjects.length > 0 ? uniqueSubjects.join(", ") : "Sem disciplinas"}
          </div>
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" />
            {uniqueClasses.length > 0 ? uniqueClasses.join(", ") : "Sem turmas"}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {uniqueShifts.length > 0 ? uniqueShifts.join(", ") : "—"}
          </div>
        </div>
      </div>

      {/* Assignment cards */}
      <h3 className="text-sm font-bold text-foreground mb-3">Selecione turma e disciplina para lançar</h3>
      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Nenhum vínculo cadastrado.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((a: any) => {
            const cls = a.classes;
            const subj = a.subjects;
            return (
              <button
                key={a.id}
                onClick={() => handleOpenAssignment(a)}
                className="group flex items-center justify-between p-5 rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">{cls?.name || "Turma"}{cls?.grade ? ` — ${cls.grade}` : ""}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{subj?.name || "Disciplina"}</p>
                  {cls?.shift && <p className="text-[11px] text-muted-foreground mt-1">{cls.shift}</p>}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedClass?.name || "Turma"} — {selectedSubject?.name || "Disciplina"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="presenca" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="presenca">Presença</TabsTrigger>
              <TabsTrigger value="notas">Notas</TabsTrigger>
              <TabsTrigger value="comportamento">Comportamento</TabsTrigger>
            </TabsList>

            {studentsLoading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Carregando alunos...</div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Nenhum aluno nesta turma.</div>
            ) : (
              <>
                {/* Presença */}
                <TabsContent value="presenca" className="flex-1 overflow-y-auto pr-1">
                  <div className="flex flex-col gap-2">
                    {students.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
                        <p className="text-sm font-medium text-foreground truncate">{s.full_name}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleAttendance(s.id, "presente")}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                              attendanceMap[s.id] === "presente"
                                ? "bg-secondary text-secondary-foreground"
                                : "border border-border text-muted-foreground hover:bg-secondary/10"
                            )}
                          >
                            ✔ Presente
                          </button>
                          <button
                            onClick={() => handleAttendance(s.id, "falta")}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                              attendanceMap[s.id] === "falta"
                                ? "bg-destructive text-destructive-foreground"
                                : "border border-border text-muted-foreground hover:bg-destructive/10"
                            )}
                          >
                            ✕ Falta
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Notas */}
                <TabsContent value="notas" className="flex-1 overflow-y-auto pr-1">
                  <div className="flex flex-col gap-2">
                    {students.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
                        <p className="text-sm font-medium text-foreground truncate flex-1">{s.full_name}</p>
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          step={0.1}
                          placeholder="0-10"
                          value={gradesMap[s.id] ?? ""}
                          onChange={(e) => setGradesMap((prev) => ({ ...prev, [s.id]: e.target.value }))}
                          onBlur={() => handleGradeBlur(s.id)}
                          className="w-20 text-center text-sm h-9"
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Comportamento */}
                <TabsContent value="comportamento" className="flex-1 overflow-y-auto pr-1">
                  <div className="flex flex-col gap-3">
                    {students.map((s: any) => (
                      <div key={s.id} className="p-3 rounded-xl bg-muted/30 border border-border/40">
                        <p className="text-sm font-medium text-foreground mb-2">{s.full_name}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {BEHAVIOR_TAGS.map((tag) => (
                            <button
                              key={tag.label}
                              onClick={() => toggleBehavior(s.id, tag.label)}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all",
                                (behaviorMap[s.id] ?? []).includes(tag.label)
                                  ? tag.color
                                  : "border-border/50 text-muted-foreground hover:border-border"
                              )}
                            >
                              {tag.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default TeachersDetail;

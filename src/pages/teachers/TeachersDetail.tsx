import { useState, useCallback, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import StatusBadge from "@/components/shared/StatusBadge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { User, BookOpen, GraduationCap, Clock, Check, X, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BEHAVIOR_TAGS = [
  { label: "Participativo", color: "bg-secondary/15 text-secondary border-secondary/30" },
  { label: "Distraído", color: "bg-warning/15 text-warning-foreground border-warning/30" },
  { label: "Evoluiu", color: "bg-primary/10 text-primary border-primary/30" },
  { label: "Indisciplinado", color: "bg-destructive/15 text-destructive border-destructive/30" },
];

const PERIODS = [
  { value: "1bim", label: "1º Bimestre" },
  { value: "2bim", label: "2º Bimestre" },
  { value: "3bim", label: "3º Bimestre" },
  { value: "4bim", label: "4º Bimestre" },
];

const EVAL_TYPES = [
  { value: "prova", label: "Prova" },
  { value: "trabalho", label: "Trabalho" },
  { value: "atividade", label: "Atividade" },
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

const SaveIndicator = ({ status }: { status: SaveStatus }) => {
  if (status === "idle") return null;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md transition-all",
      status === "saving" && "text-muted-foreground bg-muted/50",
      status === "saved" && "text-secondary bg-secondary/10",
      status === "error" && "text-destructive bg-destructive/10",
    )}>
      {status === "saving" && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
      {status === "saved" && <Check className="h-2.5 w-2.5" />}
      {status === "error" && <X className="h-2.5 w-2.5" />}
      {status === "saving" ? "Salvando" : status === "saved" ? "Salvo" : "Erro"}
    </span>
  );
};

const TeachersDetail = () => {
  const { id } = useParams<{ id: string }>();

  // Filter state
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [period, setPeriod] = useState("1bim");
  const [evalType, setEvalType] = useState("prova");
  const [evalName, setEvalName] = useState("Prova 1");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  // Data maps
  const [attendanceMap, setAttendanceMap] = useState<Record<string, "presente" | "falta">>({});
  const [gradesMap, setGradesMap] = useState<Record<string, string>>({});
  const [behaviorMap, setBehaviorMap] = useState<Record<string, string[]>>({});

  // Save status per student per field
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});
  const statusTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const setSaveFor = useCallback((key: string, status: SaveStatus) => {
    setSaveStatus(prev => ({ ...prev, [key]: status }));
    if (status === "saved") {
      if (statusTimers.current[key]) clearTimeout(statusTimers.current[key]);
      statusTimers.current[key] = setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [key]: "idle" }));
      }, 2000);
    }
  }, []);

  // Queries
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

  // Derive unique classes and subjects for filters
  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    assignments.forEach((a: any) => {
      if (a.class_id && a.classes?.name) map.set(a.class_id, a.classes.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [assignments]);

  const subjectOptions = useMemo(() => {
    const map = new Map<string, string>();
    assignments.forEach((a: any) => {
      if (selectedClassId && a.class_id !== selectedClassId) return;
      if (a.subject_id && a.subjects?.name) map.set(a.subject_id, a.subjects.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [assignments, selectedClassId]);

  // Find matching assignment
  const matchedAssignment = useMemo(() => {
    return assignments.find((a: any) => a.class_id === selectedClassId && a.subject_id === selectedSubjectId);
  }, [assignments, selectedClassId, selectedSubjectId]);

  // Students
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["assignment-students", selectedClassId],
    queryFn: async () => {
      const { data } = await supabase
        .from("students")
        .select("id, full_name, photo_url, status")
        .eq("class_id", selectedClassId)
        .eq("status", "ativo")
        .order("full_name");
      return data ?? [];
    },
    enabled: !!selectedClassId && modalOpen,
  });

  // Load existing attendance for today
  const today = new Date().toISOString().split("T")[0];
  useQuery({
    queryKey: ["existing-attendance", selectedClassId, today],
    queryFn: async () => {
      const studentIds = students.map(s => s.id);
      if (studentIds.length === 0) return [];
      const { data } = await supabase
        .from("attendance")
        .select("student_id, status")
        .in("student_id", studentIds)
        .eq("date", today);
      const map: Record<string, "presente" | "falta"> = {};
      (data || []).forEach((a: any) => { if (a.status) map[a.student_id] = a.status; });
      setAttendanceMap(prev => ({ ...map, ...prev }));
      return data;
    },
    enabled: students.length > 0 && modalOpen,
  });

  // Load existing grades
  useQuery({
    queryKey: ["existing-grades", matchedAssignment?.id, period],
    queryFn: async () => {
      if (!matchedAssignment) return [];
      const { data } = await supabase
        .from("grades")
        .select("student_id, grade_value")
        .eq("assignment_id", (matchedAssignment as any).id)
        .eq("term", period);
      const map: Record<string, string> = {};
      (data || []).forEach((g: any) => { map[g.student_id] = String(g.grade_value ?? ""); });
      setGradesMap(prev => ({ ...map, ...prev }));
      return data;
    },
    enabled: !!matchedAssignment && modalOpen,
  });

  // Mutations
  const attendanceMutation = useMutation({
    mutationFn: async ({ studentId, status }: { studentId: string; status: string }) => {
      setSaveFor(`att-${studentId}`, "saving");
      const { data: existing } = await supabase
        .from("attendance").select("id").eq("student_id", studentId).eq("date", today).maybeSingle();
      if (existing) {
        await supabase.from("attendance").update({ status }).eq("id", existing.id);
      } else {
        const { data: student } = await supabase.from("students").select("school_id").eq("id", studentId).maybeSingle();
        await supabase.from("attendance").insert({ student_id: studentId, date: today, status, school_id: student?.school_id });
      }
    },
    onSuccess: (_, { studentId }) => setSaveFor(`att-${studentId}`, "saved"),
    onError: (_, { studentId }) => setSaveFor(`att-${studentId}`, "error"),
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ studentId, value }: { studentId: string; value: number }) => {
      if (!matchedAssignment) return;
      setSaveFor(`grade-${studentId}`, "saving");
      const assignmentId = (matchedAssignment as any).id;
      const { data: existing } = await supabase
        .from("grades").select("id").eq("student_id", studentId).eq("assignment_id", assignmentId).eq("term", period).maybeSingle();
      if (existing) {
        await supabase.from("grades").update({ grade_value: value }).eq("id", existing.id);
      } else {
        const { data: student } = await supabase.from("students").select("school_id").eq("id", studentId).maybeSingle();
        const { data: enrollment } = await supabase
          .from("student_enrollments")
          .select("id")
          .eq("student_id", studentId)
          .eq("status", "ativo")
          .maybeSingle();
        if (!enrollment?.id) throw new Error("Aluno sem matrícula ativa");
        await supabase.from("grades").insert({
          enrollment_id: enrollment.id,
          student_id: studentId,
          assignment_id: assignmentId,
          grade_value: value,
          term: period,
          school_id: student?.school_id,
        });
      }
    },
    onSuccess: (_, { studentId }) => setSaveFor(`grade-${studentId}`, "saved"),
    onError: (_, { studentId }) => setSaveFor(`grade-${studentId}`, "error"),
  });

  // Handlers
  const handleAttendance = useCallback((studentId: string, status: "presente" | "falta") => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
    attendanceMutation.mutate({ studentId, status });
  }, [attendanceMutation]);

  const handleGradeChange = useCallback((studentId: string, value: string) => {
    setGradesMap(prev => ({ ...prev, [studentId]: value }));
  }, []);

  const handleGradeBlur = useCallback((studentId: string) => {
    const val = parseFloat(gradesMap[studentId]);
    if (!isNaN(val) && val >= 0 && val <= 10) {
      gradeMutation.mutate({ studentId, value: val });
    }
  }, [gradesMap, gradeMutation]);

  const handleGradeKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, studentId: string, index: number) => {
    if (e.key === "Enter" || e.key === "Tab") {
      handleGradeBlur(studentId);
    }
  }, [handleGradeBlur]);

  const toggleBehavior = useCallback((studentId: string, tag: string) => {
    setBehaviorMap(prev => {
      const current = prev[studentId] ?? [];
      const updated = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
      return { ...prev, [studentId]: updated };
    });
    setSaveFor(`beh-${studentId}`, "saved");
  }, [setSaveFor]);

  const openModal = useCallback(() => {
    if (!selectedClassId || !selectedSubjectId) {
      toast.error("Selecione turma e disciplina");
      return;
    }
    if (!matchedAssignment) {
      toast.error("Nenhum vínculo encontrado para esta combinação");
      return;
    }
    setAttendanceMap({});
    setGradesMap({});
    setBehaviorMap({});
    setSaveStatus({});
    setModalOpen(true);
  }, [selectedClassId, selectedSubjectId, matchedAssignment]);

  // Progress
  const filledCount = useMemo(() => {
    return students.filter(s => attendanceMap[s.id] && gradesMap[s.id]).length;
  }, [students, attendanceMap, gradesMap]);

  const hasIncomplete = useMemo(() => {
    return students.some(s => !attendanceMap[s.id] || !gradesMap[s.id]);
  }, [students, attendanceMap, gradesMap]);

  const handleCloseAttempt = useCallback((open: boolean) => {
    if (!open && hasIncomplete && students.length > 0) {
      setConfirmClose(true);
      return;
    }
    setModalOpen(open);
  }, [hasIncomplete, students.length]);

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

  const selectedClassName = classOptions.find(c => c.id === selectedClassId)?.name ?? "";
  const selectedSubjectName = subjectOptions.find(s => s.id === selectedSubjectId)?.name ?? "";

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
          <div className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />{uniqueSubjects.length > 0 ? uniqueSubjects.join(", ") : "Sem disciplinas"}</div>
          <div className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" />{uniqueClasses.length > 0 ? uniqueClasses.join(", ") : "Sem turmas"}</div>
          <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{uniqueShifts.length > 0 ? uniqueShifts.join(", ") : "—"}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-sm mb-6">
        <h3 className="text-sm font-bold text-foreground mb-3">Lançamento rápido</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select value={selectedClassId} onValueChange={(v) => { setSelectedClassId(v); setSelectedSubjectId(""); }}>
            <SelectTrigger><SelectValue placeholder="Turma" /></SelectTrigger>
            <SelectContent>
              {classOptions.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
            <SelectTrigger><SelectValue placeholder="Disciplina" /></SelectTrigger>
            <SelectContent>
              {subjectOptions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIODS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <button
            onClick={openModal}
            disabled={!selectedClassId || !selectedSubjectId}
            className="px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Abrir Lançamento
          </button>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={handleCloseAttempt}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
          {/* Modal Header */}
          <div className="px-6 pt-6 pb-4 border-b border-border/40">
            <DialogHeader>
              <DialogTitle className="text-lg">{selectedClassName} — {selectedSubjectName}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-3 mt-1">
                <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                  {PERIODS.find(p => p.value === period)?.label}
                </span>
              </DialogDescription>
            </DialogHeader>

            {/* Eval config */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <Select value={evalType} onValueChange={setEvalType}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVAL_TYPES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                value={evalName}
                onChange={e => setEvalName(e.target.value)}
                placeholder="Nome da avaliação"
                className="h-8 text-xs w-44"
              />
            </div>

            {/* Progress */}
            {students.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all duration-300"
                    style={{ width: `${(filledCount / students.length) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
                  {filledCount} de {students.length} preenchidos
                </span>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {studentsLoading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Carregando alunos...</div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Nenhum aluno ativo nesta turma.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-xs font-bold text-muted-foreground uppercase">
                    <th className="text-left py-2 px-2">Aluno</th>
                    <th className="text-center py-2 px-2 w-44">Presença</th>
                    <th className="text-center py-2 px-2 w-24">Nota</th>
                    <th className="text-center py-2 px-2 w-64">Comportamento</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s: any, idx) => (
                    <tr key={s.id} className="border-b border-border/20 last:border-0 hover:bg-accent/20 transition-colors">
                      {/* Name */}
                      <td className="py-2.5 px-2">
                        <p className="font-medium text-foreground text-sm truncate max-w-[200px]">{s.full_name}</p>
                      </td>

                      {/* Attendance */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleAttendance(s.id, "presente")}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all",
                              attendanceMap[s.id] === "presente"
                                ? "bg-secondary text-secondary-foreground shadow-sm"
                                : "border border-border/60 text-muted-foreground hover:bg-secondary/10"
                            )}
                          >
                            ✔
                          </button>
                          <button
                            onClick={() => handleAttendance(s.id, "falta")}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all",
                              attendanceMap[s.id] === "falta"
                                ? "bg-destructive text-destructive-foreground shadow-sm"
                                : "border border-border/60 text-muted-foreground hover:bg-destructive/10"
                            )}
                          >
                            ✕
                          </button>
                          <SaveIndicator status={saveStatus[`att-${s.id}`] ?? "idle"} />
                        </div>
                      </td>

                      {/* Grade */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="inline-flex items-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            placeholder="—"
                            value={gradesMap[s.id] ?? ""}
                            onChange={e => handleGradeChange(s.id, e.target.value)}
                            onBlur={() => handleGradeBlur(s.id)}
                            onKeyDown={e => handleGradeKeyDown(e, s.id, idx)}
                            className={cn(
                              "w-16 text-center text-sm h-8",
                              gradesMap[s.id] && parseFloat(gradesMap[s.id]) < 7 ? "text-destructive font-bold" : ""
                            )}
                          />
                          <SaveIndicator status={saveStatus[`grade-${s.id}`] ?? "idle"} />
                        </div>
                      </td>

                      {/* Behavior */}
                      <td className="py-2.5 px-2">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {BEHAVIOR_TAGS.map(tag => (
                            <button
                              key={tag.label}
                              onClick={() => toggleBehavior(s.id, tag.label)}
                              className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all",
                                (behaviorMap[s.id] ?? []).includes(tag.label)
                                  ? tag.color
                                  : "border-border/40 text-muted-foreground/60 hover:border-border"
                              )}
                            >
                              {tag.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm close dialog */}
      <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Lançamento incompleto
            </DialogTitle>
            <DialogDescription>
              Ainda existem alunos sem nota ou presença registrada. Deseja fechar mesmo assim?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setConfirmClose(false)}
              className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition-colors"
            >
              Continuar lançando
            </button>
            <button
              onClick={() => { setConfirmClose(false); setModalOpen(false); }}
              className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 transition-colors"
            >
              Fechar mesmo assim
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default TeachersDetail;

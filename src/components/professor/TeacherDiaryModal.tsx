import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BookOpen, ClipboardCheck, MessageSquare, Save } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  assignment: {
    id: string;
    class_id: string;
    subject_id: string;
    school_id: string;
    className?: string;
    subjectName?: string;
  } | null;
}

const terms = [
  { value: "1bim", label: "1º Bim" },
  { value: "2bim", label: "2º Bim" },
  { value: "3bim", label: "3º Bim" },
  { value: "4bim", label: "4º Bim" },
];

const TeacherDiaryModal = ({ open, onOpenChange, assignment }: Props) => {
  const qc = useQueryClient();
  const { session } = useAuth();
  const [term, setTerm] = useState("1bim");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [observations, setObservations] = useState<Record<string, string>>({});

  const enabled = !!assignment && open;

  const { data: students = [] } = useQuery({
    queryKey: ["diary-students", assignment?.class_id],
    queryFn: async () => {
      if (!assignment?.class_id) return [];
      const { data } = await supabase
        .from("students")
        .select("id, full_name")
        .eq("class_id", assignment.class_id)
        .eq("status", "ativo")
        .order("full_name");
      return data ?? [];
    },
    enabled,
  });

  const { data: existingGrades = [] } = useQuery({
    queryKey: ["diary-grades", assignment?.id, term],
    queryFn: async () => {
      if (!assignment?.id) return [];
      const { data } = await supabase
        .from("grades")
        .select("student_id, grade_value")
        .eq("assignment_id", assignment.id)
        .eq("term", term);
      return data ?? [];
    },
    enabled,
  });

  const { data: existingAttendance = [] } = useQuery({
    queryKey: ["diary-attendance", assignment?.class_id, date],
    queryFn: async () => {
      if (!assignment?.school_id) return [];
      const ids = students.map((s: any) => s.id);
      if (ids.length === 0) return [];
      const { data } = await supabase
        .from("attendance")
        .select("student_id, status")
        .eq("school_id", assignment.school_id)
        .eq("date", date)
        .in("student_id", ids);
      return data ?? [];
    },
    enabled: enabled && students.length > 0,
  });

  useEffect(() => {
    const map: Record<string, string> = {};
    existingGrades.forEach((g: any) => { map[g.student_id] = String(g.grade_value ?? ""); });
    setGrades(map);
  }, [existingGrades]);

  useEffect(() => {
    const map: Record<string, boolean> = {};
    students.forEach((s: any) => { map[s.id] = true; });
    existingAttendance.forEach((a: any) => { map[a.student_id] = a.status === "presente"; });
    setAttendance(map);
  }, [existingAttendance, students]);

  /* ── Save grades ── */
  const saveGrades = useMutation({
    mutationFn: async () => {
      if (!assignment) throw new Error("Sem vínculo");
      const entries = Object.entries(grades).filter(([, v]) => v !== "");
      if (entries.length === 0) throw new Error("Preencha pelo menos uma nota");
      const studentIds = entries.map(([sid]) => sid);
      const { data: enrollments } = await supabase
        .from("student_enrollments")
        .select("id, student_id")
        .in("student_id", studentIds)
        .eq("status", "ativo");
      const map = new Map((enrollments ?? []).map((e: any) => [e.student_id, e.id]));
      await supabase.from("grades").delete().eq("assignment_id", assignment.id).eq("term", term).in("student_id", studentIds);
      const rows = entries
        .map(([sid, v]) => {
          const eid = map.get(sid);
          if (!eid) return null;
          return {
            enrollment_id: eid,
            student_id: sid,
            assignment_id: assignment.id,
            grade_value: parseFloat(v),
            term,
            school_id: assignment.school_id,
          };
        })
        .filter(Boolean) as any[];
      if (rows.length === 0) throw new Error("Alunos sem matrícula ativa");
      const { error } = await supabase.from("grades").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notas salvas!");
      qc.invalidateQueries({ queryKey: ["diary-grades"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  /* ── Save attendance ── */
  const saveAttendance = useMutation({
    mutationFn: async () => {
      if (!assignment) throw new Error("Sem vínculo");
      const ids = students.map((s: any) => s.id);
      if (ids.length === 0) throw new Error("Sem alunos");
      await supabase.from("attendance").delete().eq("school_id", assignment.school_id).eq("date", date).in("student_id", ids);
      const rows = ids.map((sid: string) => ({
        school_id: assignment.school_id,
        student_id: sid,
        date,
        status: attendance[sid] ? "presente" : "falta",
      }));
      const { error } = await supabase.from("attendance").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Frequência registrada!");
      qc.invalidateQueries({ queryKey: ["diary-attendance"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  /* ── Save observations ── */
  const saveObservations = useMutation({
    mutationFn: async () => {
      if (!assignment) throw new Error("Sem vínculo");
      const entries = Object.entries(observations).filter(([, v]) => v.trim() !== "");
      if (entries.length === 0) throw new Error("Escreva ao menos uma observação");
      const rows = entries.map(([sid, content]) => ({
        student_id: sid,
        school_id: assignment.school_id,
        content: `[${assignment.subjectName ?? "Diário"}] ${content}`,
      }));
      const { error } = await supabase.from("student_reports").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Observações registradas!");
      setObservations({});
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!assignment) return null;

  const presentCount = Object.values(attendance).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-primary" />
            Diário — {assignment.className} · {assignment.subjectName}
          </DialogTitle>
        </DialogHeader>

        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhum aluno ativo nesta turma.</p>
        ) : (
          <Tabs defaultValue="notas" className="w-full">
            <TabsList className="grid grid-cols-3 w-full h-auto p-1.5 gap-1 bg-muted/60 rounded-xl border border-border/60">
              <TabsTrigger
                value="notas"
                className="flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-semibold text-muted-foreground rounded-lg transition-all duration-200 hover:text-foreground hover:bg-background/60 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border data-[state=active]:[&>svg]:text-primary"
              >
                <BookOpen className="h-[18px] w-[18px]" strokeWidth={2.25} />
                Notas
              </TabsTrigger>
              <TabsTrigger
                value="faltas"
                className="flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-semibold text-muted-foreground rounded-lg transition-all duration-200 hover:text-foreground hover:bg-background/60 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border data-[state=active]:[&>svg]:text-primary"
              >
                <ClipboardCheck className="h-[18px] w-[18px]" strokeWidth={2.25} />
                Faltas
              </TabsTrigger>
              <TabsTrigger
                value="obs"
                className="flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-semibold text-muted-foreground rounded-lg transition-all duration-200 hover:text-foreground hover:bg-background/60 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border data-[state=active]:[&>svg]:text-primary"
              >
                <MessageSquare className="h-[18px] w-[18px]" strokeWidth={2.25} />
                <span className="hidden sm:inline">Observações</span>
                <span className="sm:hidden">Obs.</span>
              </TabsTrigger>
            </TabsList>

            {/* NOTAS */}
            <TabsContent value="notas" className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Bimestre:</span>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {terms.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="border border-border/60 rounded-xl divide-y divide-border/40">
                {students.map((s: any) => {
                  const v = grades[s.id] ?? "";
                  return (
                    <div key={s.id} className="flex items-center justify-between px-4 py-2">
                      <span className="text-sm">{s.full_name}</span>
                      <input
                        type="number" min={0} max={10} step={0.1}
                        value={v}
                        onChange={(e) => setGrades((p) => ({ ...p, [s.id]: e.target.value }))}
                        placeholder="—"
                        className={cn(
                          "w-20 text-center border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-primary",
                          v && parseFloat(v) < 6 && "text-destructive font-bold"
                        )}
                      />
                    </div>
                  );
                })}
              </div>
              <Button className="w-full gap-2" onClick={() => saveGrades.mutate()} disabled={saveGrades.isPending}>
                <Save className="h-4 w-4" /> Salvar Notas
              </Button>
            </TabsContent>

            {/* FALTAS */}
            <TabsContent value="faltas" className="space-y-3">
              <div className="flex items-center justify-between">
                <input
                  type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="text-sm border border-border rounded-md px-3 py-1.5 focus:outline-none focus:border-primary"
                />
                <span className="text-xs text-muted-foreground">
                  <span className="font-bold text-primary">{presentCount}</span>/{students.length} presentes
                </span>
              </div>
              <div className="border border-border/60 rounded-xl divide-y divide-border/40">
                {students.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm">{s.full_name}</span>
                    <button
                      onClick={() => setAttendance((p) => ({ ...p, [s.id]: !p[s.id] }))}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold transition-colors",
                        attendance[s.id] ? "bg-secondary/15 text-secondary" : "bg-destructive/15 text-destructive"
                      )}
                    >
                      {attendance[s.id] ? "Presente" : "Falta"}
                    </button>
                  </div>
                ))}
              </div>
              <Button className="w-full gap-2" onClick={() => saveAttendance.mutate()} disabled={saveAttendance.isPending}>
                <Save className="h-4 w-4" /> Salvar Frequência
              </Button>
            </TabsContent>

            {/* OBSERVAÇÕES */}
            <TabsContent value="obs" className="space-y-3">
              <p className="text-xs text-muted-foreground">Registre observações pedagógicas que ficarão no prontuário do aluno.</p>
              <div className="space-y-3">
                {students.map((s: any) => (
                  <div key={s.id} className="border border-border/60 rounded-xl p-3 space-y-2">
                    <p className="text-sm font-semibold">{s.full_name}</p>
                    <Textarea
                      rows={2} maxLength={500}
                      value={observations[s.id] ?? ""}
                      onChange={(e) => setObservations((p) => ({ ...p, [s.id]: e.target.value }))}
                      placeholder="Observação sobre comportamento, desempenho, participação..."
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
              <Button className="w-full gap-2" onClick={() => saveObservations.mutate()} disabled={saveObservations.isPending}>
                <Save className="h-4 w-4" /> Salvar Observações
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TeacherDiaryModal;

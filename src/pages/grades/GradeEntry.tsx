import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const bimestres = [
  { value: "1bim", label: "1º Bimestre" },
  { value: "2bim", label: "2º Bimestre" },
  { value: "3bim", label: "3º Bimestre" },
  { value: "4bim", label: "4º Bimestre" },
];

const GradeEntry = () => {
  const { schoolId } = useSchoolId();
  const queryClient = useQueryClient();
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [term, setTerm] = useState("1bim");
  const [gradeValues, setGradeValues] = useState<Record<string, string>>({});

  const { data: classes = [] } = useQuery({
    queryKey: ["classes", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("classes").select("id, name").eq("school_id", schoolId).order("name");
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("subjects").select("id, name").eq("school_id", schoolId).order("name");
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: assignment } = useQuery({
    queryKey: ["assignment", classId, subjectId, schoolId],
    queryFn: async () => {
      if (!classId || !subjectId || !schoolId) return null;
      const { data } = await supabase
        .from("teacher_assignments")
        .select("id")
        .eq("class_id", classId)
        .eq("subject_id", subjectId)
        .eq("school_id", schoolId)
        .maybeSingle();
      return data;
    },
    enabled: !!classId && !!subjectId && !!schoolId,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["class-students", classId],
    queryFn: async () => {
      if (!classId) return [];
      const { data } = await supabase.from("students").select("id, full_name").eq("class_id", classId).eq("status", "ativo").order("full_name");
      return data || [];
    },
    enabled: !!classId,
  });

  const { data: existingGrades = [] } = useQuery({
    queryKey: ["grades", assignment?.id, term],
    queryFn: async () => {
      if (!assignment?.id) return [];
      const { data } = await supabase.from("grades").select("student_id, grade_value").eq("assignment_id", assignment.id).eq("term", term);
      const map: Record<string, string> = {};
      (data || []).forEach((g: any) => { map[g.student_id] = String(g.grade_value ?? ""); });
      setGradeValues(map);
      return data || [];
    },
    enabled: !!assignment?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!assignment?.id || !schoolId) throw new Error("Selecione turma e disciplina com vínculo ativo");
      const entries = Object.entries(gradeValues).filter(([, v]) => v !== "");
      if (entries.length === 0) throw new Error("Nenhuma nota preenchida");

      if (existingGrades.length > 0) {
        await supabase.from("grades").delete().eq("assignment_id", assignment.id).eq("term", term);
      }

      const rows = entries.map(([studentId, val]) => ({
        student_id: studentId,
        assignment_id: assignment.id,
        grade_value: parseFloat(val),
        term,
        school_id: schoolId,
      }));
      const { error } = await supabase.from("grades").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      toast.success("Notas salvas!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const ready = classId && subjectId && students.length > 0;

  return (
    <AppLayout title="Lançar Notas" breadcrumbs={[{ label: "Notas" }, { label: "Lançar" }]}>
      <PageHeader title="Lançamento de Notas" description="Selecione turma e disciplina para lançar notas" />

      <div className="flex items-center gap-3 flex-wrap mb-6">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">Filtros:</span>
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="text-sm font-semibold bg-card border border-border/60 rounded-[12px] px-3 py-2 text-primary focus:outline-none focus:border-secondary transition-colors cursor-pointer">
          <option value="">Turma...</option>
          {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="text-sm font-semibold bg-card border border-border/60 rounded-[12px] px-3 py-2 text-primary focus:outline-none focus:border-secondary transition-colors cursor-pointer">
          <option value="">Disciplina...</option>
          {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={term} onChange={(e) => setTerm(e.target.value)} className="text-sm font-semibold bg-card border border-border/60 rounded-[12px] px-3 py-2 text-primary focus:outline-none focus:border-secondary transition-colors">
          {bimestres.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
      </div>

      {!ready ? (
        <div className="text-center py-12 text-muted">
          {!classId ? "Selecione uma turma." : !subjectId ? "Selecione uma disciplina." : "Nenhum aluno ativo nesta turma."}
        </div>
      ) : !assignment ? (
        <div className="text-center py-12 text-muted">Nenhum vínculo (teacher_assignment) encontrado para esta turma e disciplina.</div>
      ) : (
        <>
          <div className="bg-card border border-border/60 rounded-xl certus-shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">Aluno</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-muted uppercase">Nota</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s: any) => {
                  const val = gradeValues[s.id] ?? "";
                  return (
                    <tr key={s.id} className="border-b border-border/20 last:border-0 hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-primary">{s.full_name}</td>
                      <td className="px-4 py-2 text-center">
                        <input
                          value={val}
                          onChange={(e) => setGradeValues((prev) => ({ ...prev, [s.id]: e.target.value }))}
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          className={cn("w-20 text-center border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-secondary", val && parseFloat(val) < 7 ? "text-destructive font-bold" : "")}
                          placeholder="—"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={() => saveMutation.mutate()} className="px-5 py-2.5 rounded-[14px] bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/90 transition-colors">
              <i className="ri-check-line mr-1" /> Salvar Notas
            </button>
          </div>
        </>
      )}
    </AppLayout>
  );
};

export default GradeEntry;

import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";

const columns = [
  { key: "student_name", label: "Aluno" },
  { key: "subject_name", label: "Disciplina" },
  { key: "class_name", label: "Turma" },
  { key: "term", label: "Bimestre" },
  { key: "grade_value", label: "Nota" },
];

const GradeHistory = () => {
  const { schoolId } = useSchoolId();

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ["grades-history", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from("grades")
        .select("grade_value, term, students(full_name), teacher_assignments(classes(name), subjects(name))")
        .eq("school_id", schoolId)
        .order("term")
        .limit(200);
      if (error) throw error;
      return (data || []).map((g: any) => ({
        student_name: g.students?.full_name || "—",
        subject_name: g.teacher_assignments?.subjects?.name || "—",
        class_name: g.teacher_assignments?.classes?.name || "—",
        term: g.term || "—",
        grade_value: g.grade_value ?? "—",
      }));
    },
    enabled: !!schoolId,
  });

  return (
    <AppLayout title="Histórico de Notas" breadcrumbs={[{ label: "Notas" }, { label: "Histórico" }]}>
      <PageHeader title="Histórico de Notas" description="Consulte notas lançadas" />
      {isLoading ? (
        <div className="text-center py-12 text-muted">Carregando...</div>
      ) : grades.length === 0 ? (
        <div className="text-center py-12 text-muted">Nenhuma nota registrada ainda.</div>
      ) : (
        <DataTable columns={columns} data={grades} searchPlaceholder="Buscar..." />
      )}
    </AppLayout>
  );
};

export default GradeHistory;

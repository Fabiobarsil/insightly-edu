import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import { supabase } from "@/lib/supabase";

const columns = [
  { key: "name", label: "Turma" },
  { key: "grade", label: "Série" },
  { key: "shift", label: "Turno" },
  { key: "academic_year", label: "Ano Letivo" },
];

const ClassesList = () => {
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, grade, shift, academic_year")
        .order("name");
      if (error) throw error;
      return (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        grade: c.grade || "—",
        shift: c.shift || "—",
        academic_year: c.academic_year || "—",
      }));
    },
  });

  return (
    <AppLayout title="Turmas" breadcrumbs={[{ label: "Turmas" }]}>
      <PageHeader title="Turmas" description="Gerencie as turmas e atribuições" action={{ label: "Nova Turma", icon: "ri-add-line", to: "/turmas/novo" }} />
      {isLoading ? (
        <div className="text-center py-12 text-muted">Carregando turmas...</div>
      ) : classes.length === 0 ? (
        <div className="text-center py-12 text-muted">Nenhuma turma cadastrada ainda.</div>
      ) : (
        <DataTable columns={columns} data={classes} searchPlaceholder="Buscar turma..." actions={(row) => [
          { label: "Editar", icon: "ri-pencil-line", to: `/turmas/${row.id}/editar` },
        ]} />
      )}
    </AppLayout>
  );
};

export default ClassesList;

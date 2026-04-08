import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const columns = [
  { key: "full_name", label: "Nome" },
  { key: "email", label: "E-mail" },
  { key: "status", label: "Status", render: (v: string) => <StatusBadge status={v === "active" ? "active" : "inactive"} label={v === "active" ? "Ativo" : "Inativo"} /> },
];

const TeachersList = () => {
  const queryClient = useQueryClient();

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("id, full_name, email, status")
        .order("full_name");
      if (error) throw error;
      return (data || []).map((t: any) => ({
        id: t.id,
        full_name: t.full_name || "—",
        email: t.email || "—",
        status: t.status || "active",
      }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete assignments first
      await supabase.from("teacher_assignments").delete().eq("teacher_id", id);
      const { error } = await supabase.from("teachers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Professor excluído com sucesso!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao excluir professor"),
  });

  return (
    <AppLayout title="Professores" breadcrumbs={[{ label: "Professores" }]}>
      <PageHeader title="Professores" description="Gerencie o corpo docente" action={{ label: "Novo Professor", icon: "ri-add-line", to: "/professores/novo" }} />
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando professores...</div>
      ) : teachers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhum professor cadastrado ainda.</div>
      ) : (
        <DataTable columns={columns} data={teachers} searchPlaceholder="Buscar professor..." actions={(row) => [
          { label: "Ver", icon: "ri-eye-line", to: `/professores/${row.id}` },
          { label: "Editar", icon: "ri-pencil-line", to: `/professores/${row.id}/editar` },
          { label: "Excluir", icon: "ri-delete-bin-line", onClick: () => {
            if (confirm("Tem certeza que deseja excluir este professor e todos os seus vínculos?")) {
              deleteMutation.mutate(row.id);
            }
          }},
        ]} />
      )}
    </AppLayout>
  );
};

export default TeachersList;

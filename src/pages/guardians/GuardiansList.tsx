import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { toast } from "sonner";

const columns = [
  { key: "full_name", label: "Nome" },
  { key: "phone", label: "Telefone" },
  { key: "email", label: "E-mail" },
];

const GuardiansList = () => {
  const { schoolId, isLoading: loadingSchool } = useSchoolId();
  const queryClient = useQueryClient();

  const { data: guardians = [], isLoading } = useQuery({
    queryKey: ["guardians", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from("guardians")
        .select("id, full_name, phone, email")
        .eq("school_id", schoolId)
        .order("full_name");
      if (error) throw error;
      return (data || []).map((g: any) => ({
        id: g.id,
        full_name: g.full_name || "—",
        phone: g.phone || "—",
        email: g.email || "—",
      }));
    },
    enabled: !!schoolId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("student_guardians").delete().eq("guardian_id", id);
      const { error } = await supabase.from("guardians").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guardians", schoolId] });
      toast.success("Responsável excluído!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao excluir"),
  });

  const loading = loadingSchool || isLoading;

  return (
    <AppLayout title="Responsáveis" breadcrumbs={[{ label: "Responsáveis" }]}>
      <PageHeader title="Responsáveis" description="Gerencie os responsáveis dos alunos" action={{ label: "Novo Responsável", icon: "ri-add-line", to: "/admin/responsaveis/novo" }} />
      {loading ? (
        <div className="text-center py-12 text-muted">Carregando...</div>
      ) : !schoolId ? (
        <div className="text-center py-12 text-muted">Nenhuma escola vinculada.</div>
      ) : guardians.length === 0 ? (
        <div className="text-center py-12 text-muted">Nenhum responsável cadastrado.</div>
      ) : (
        <DataTable columns={columns} data={guardians} searchPlaceholder="Buscar responsável..." actions={(row) => [
          { label: "Ver", icon: "ri-eye-line", to: `/admin/responsaveis/${row.id}` },
          { label: "Editar", icon: "ri-pencil-line", to: `/admin/responsaveis/${row.id}/editar` },
          { label: "Excluir", icon: "ri-delete-bin-line", onClick: () => { if (confirm("Excluir este responsável?")) deleteMutation.mutate(row.id); } },
        ]} />
      )}
    </AppLayout>
  );
};

export default GuardiansList;

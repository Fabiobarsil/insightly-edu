import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import { supabase } from "@/lib/supabase";

const columns = [
  { key: "full_name", label: "Nome" },
  { key: "relationship", label: "Parentesco" },
  { key: "phone", label: "Telefone" },
  { key: "email", label: "E-mail" },
];

const GuardiansList = () => {
  const { data: guardians = [], isLoading } = useQuery({
    queryKey: ["guardians"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guardians")
        .select("id, full_name, relationship, phone, email")
        .order("full_name");
      if (error) throw error;
      return (data || []).map((g: any) => ({
        id: g.id,
        full_name: g.full_name,
        relationship: g.relationship || "—",
        phone: g.phone || "—",
        email: g.email || "—",
      }));
    },
  });

  return (
    <AppLayout title="Responsáveis" breadcrumbs={[{ label: "Responsáveis" }]}>
      <PageHeader title="Responsáveis" description="Gerencie os responsáveis dos alunos" action={{ label: "Novo Responsável", icon: "ri-add-line", to: "/responsaveis/novo" }} />
      {isLoading ? (
        <div className="text-center py-12 text-muted">Carregando responsáveis...</div>
      ) : guardians.length === 0 ? (
        <div className="text-center py-12 text-muted">Nenhum responsável cadastrado ainda.</div>
      ) : (
        <DataTable columns={columns} data={guardians} searchPlaceholder="Buscar responsável..." actions={(row) => [
          { label: "Ver", icon: "ri-eye-line", to: `/responsaveis/${row.id}` },
          { label: "Editar", icon: "ri-pencil-line", to: `/responsaveis/${row.id}/editar` },
        ]} />
      )}
    </AppLayout>
  );
};

export default GuardiansList;

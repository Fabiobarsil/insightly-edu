import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { supabase } from "@/lib/supabase";

const columns = [
  { key: "full_name", label: "Nome" },
  { key: "email", label: "E-mail" },
  { key: "phone", label: "Telefone" },
  { key: "status", label: "Status", render: (v: string) => <StatusBadge status={v === "active" ? "active" : "inactive"} label={v === "active" ? "Ativo" : "Inativo"} /> },
];

const TeachersList = () => {
  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("id, full_name, email, phone, status")
        .order("full_name");
      if (error) throw error;
      return (data || []).map((t: any) => ({
        id: t.id,
        full_name: t.full_name,
        email: t.email || "—",
        phone: t.phone || "—",
        status: t.status || "active",
      }));
    },
  });

  return (
    <AppLayout title="Professores" breadcrumbs={[{ label: "Professores" }]}>
      <PageHeader title="Professores" description="Gerencie o corpo docente" action={{ label: "Novo Professor", icon: "ri-add-line", to: "/professores/novo" }} />
      {isLoading ? (
        <div className="text-center py-12 text-muted">Carregando professores...</div>
      ) : teachers.length === 0 ? (
        <div className="text-center py-12 text-muted">Nenhum professor cadastrado ainda.</div>
      ) : (
        <DataTable columns={columns} data={teachers} searchPlaceholder="Buscar professor..." actions={(row) => [
          { label: "Ver", icon: "ri-eye-line", to: `/professores/${row.id}` },
          { label: "Editar", icon: "ri-pencil-line", to: `/professores/${row.id}/editar` },
        ]} />
      )}
    </AppLayout>
  );
};

export default TeachersList;

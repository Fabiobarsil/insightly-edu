import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";

const statusMap: Record<string, { status: string; label: string }> = {
  ativo: { status: "active", label: "Ativo" },
  incompleto: { status: "warning", label: "Incompleto" },
  irregular: { status: "warning", label: "Irregular" },
  transferido: { status: "inactive", label: "Transferido" },
  inativo: { status: "inactive", label: "Inativo" },
};

const columns = [
  {
    key: "full_name", label: "Nome",
    render: (_val: string, row: any) => (
      <div className="flex items-center gap-3">
        {row.photo_url ? (
          <img src={row.photo_url} alt={row.full_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <i className="ri-user-line text-muted-foreground" />
          </div>
        )}
        <span className="font-medium">{row.full_name}</span>
      </div>
    ),
  },
  { key: "class_name", label: "Turma" },
  { key: "birth_date", label: "Nascimento" },
  {
    key: "status", label: "Status",
    render: (val: string) => {
      const mapped = statusMap[val] || statusMap.ativo;
      return <StatusBadge {...mapped} />;
    },
  },
];

const StudentsList = () => {
  const { schoolId, isLoading: loadingSchool } = useSchoolId();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from("students")
        .select("id, full_name, status, birth_date, photo_url, class_id, classes(name)")
        .eq("school_id", schoolId)
        .order("full_name");
      if (error) throw error;
      return (data || []).map((s: any) => ({
        id: s.id,
        full_name: s.full_name,
        photo_url: s.photo_url,
        class_name: s.classes?.name || "—",
        birth_date: s.birth_date || "—",
        status: s.status || "ativo",
      }));
    },
    enabled: !!schoolId,
  });

  const total = students.length;
  const ativos = students.filter((s: any) => s.status === "ativo").length;
  const loading = loadingSchool || isLoading;

  return (
    <AppLayout title="Alunos" breadcrumbs={[{ label: "Alunos" }]}>
      <PageHeader
        title="Alunos"
        description="Consulta dos alunos matriculados. Novas matrículas, renovações e desativações são realizadas pela Secretaria."
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { icon: "ri-group-line", label: "Total de Alunos", value: String(total), color: "text-primary" },
          { icon: "ri-check-double-line", label: "Ativos", value: String(ativos), color: "text-secondary" },
          { icon: "ri-user-unfollow-line", label: "Inativos", value: String(total - ativos), color: "text-destructive" },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border/60 rounded-xl p-4 certus-shadow flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <i className={`${s.icon} text-lg ${s.color}`} />
            </div>
            <div>
              <div className="text-lg font-bold text-primary">{s.value}</div>
              <div className="text-xs text-muted">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
      {loading ? (
        <div className="text-center py-12 text-muted">Carregando alunos...</div>
      ) : !schoolId ? (
        <div className="text-center py-12 text-muted">Nenhuma escola vinculada ao usuário.</div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-muted">Nenhum aluno cadastrado ainda.</div>
      ) : (
        <DataTable
          columns={columns}
          data={students}
          searchPlaceholder="Buscar aluno..."
          actions={(row) => [
            { label: "Ver", icon: "ri-eye-line", to: `/admin/alunos/${row.id}` },
            { label: "Editar", icon: "ri-pencil-line", to: `/admin/alunos/${row.id}/editar` },
          ]}
        />
      )}
    </AppLayout>
  );
};

export default StudentsList;

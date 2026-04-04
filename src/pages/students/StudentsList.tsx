import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { supabase } from "@/lib/supabase";

const statusMap: Record<string, { status: string; label: string }> = {
  active: { status: "active", label: "Ativo" },
  warning: { status: "warning", label: "Atenção" },
  critical: { status: "critical", label: "Em Risco" },
  inactive: { status: "inactive", label: "Inativo" },
};

const columns = [
  { key: "enrollment_code", label: "Matrícula" },
  { key: "full_name", label: "Nome" },
  { key: "class_name", label: "Turma" },
  { key: "turn", label: "Turno" },
  {
    key: "status", label: "Status",
    render: (val: string) => <StatusBadge {...(statusMap[val] || statusMap.active)} />,
  },
];

const StudentsList = () => {
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, enrollment_code, full_name, status, turn, class_id, classes(name)")
        .order("full_name");
      if (error) throw error;
      return (data || []).map((s: any) => ({
        id: s.id,
        enrollment_code: s.enrollment_code || "—",
        full_name: s.full_name,
        class_name: s.classes?.name || "—",
        turn: s.turn || "—",
        status: s.status || "active",
      }));
    },
  });

  const total = students.length;
  const atRisk = students.filter((s: any) => s.status === "critical").length;

  return (
    <AppLayout title="Alunos" breadcrumbs={[{ label: "Alunos" }]}>
      <PageHeader title="Alunos" description="Gerencie os alunos matriculados" action={{ label: "Novo Aluno", icon: "ri-add-line", to: "/alunos/novo" }} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { icon: "ri-group-line", label: "Total de Alunos", value: String(total), color: "text-primary" },
          { icon: "ri-alert-line", label: "Em Risco", value: String(atRisk), color: "text-destructive" },
          { icon: "ri-check-double-line", label: "Turno Mais Comum", value: "—", color: "text-secondary" },
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
      {isLoading ? (
        <div className="text-center py-12 text-muted">Carregando alunos...</div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-muted">Nenhum aluno cadastrado ainda.</div>
      ) : (
        <DataTable
          columns={columns}
          data={students}
          searchPlaceholder="Buscar aluno..."
          actions={(row) => [
            { label: "Ver", icon: "ri-eye-line", to: `/alunos/${row.id}` },
            { label: "Editar", icon: "ri-pencil-line", to: `/alunos/${row.id}/editar` },
          ]}
        />
      )}
    </AppLayout>
  );
};

export default StudentsList;

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";

const students = [
  { id: "1", nome: "Ana Clara Silva", turma: "5º A", status: "active", matricula: "2024001", frequencia: "96%" },
  { id: "2", nome: "Pedro Henrique Costa", turma: "3º B", status: "warning", matricula: "2024002", frequencia: "72%" },
  { id: "3", nome: "Maria Fernanda Souza", turma: "4º A", status: "active", matricula: "2024003", frequencia: "91%" },
  { id: "4", nome: "Lucas Gabriel Lima", turma: "5º B", status: "critical", matricula: "2024004", frequencia: "58%" },
  { id: "5", nome: "Isabela Martins", turma: "2º A", status: "active", matricula: "2024005", frequencia: "94%" },
  { id: "6", nome: "João Victor Santos", turma: "6º A", status: "warning", matricula: "2024006", frequencia: "78%" },
  { id: "7", nome: "Sofia Oliveira", turma: "1º B", status: "active", matricula: "2024007", frequencia: "97%" },
  { id: "8", nome: "Gabriel Rodrigues", turma: "3º A", status: "active", matricula: "2024008", frequencia: "89%" },
];

const statusMap: Record<string, { status: string; label: string }> = {
  active: { status: "active", label: "Ativo" },
  warning: { status: "warning", label: "Atenção" },
  critical: { status: "critical", label: "Em Risco" },
};

const columns = [
  { key: "matricula", label: "Matrícula" },
  { key: "nome", label: "Nome" },
  { key: "turma", label: "Turma" },
  { key: "frequencia", label: "Frequência" },
  {
    key: "status", label: "Status",
    render: (val: string) => <StatusBadge {...(statusMap[val] || statusMap.active)} />,
  },
];

const StudentsList = () => (
  <AppLayout title="Alunos" breadcrumbs={[{ label: "Alunos" }]}>
    <PageHeader title="Alunos" description="Gerencie os alunos matriculados" action={{ label: "Novo Aluno", icon: "ri-add-line", to: "/alunos/novo" }} />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {[
        { icon: "ri-group-line", label: "Total de Alunos", value: "847", color: "text-primary" },
        { icon: "ri-alert-line", label: "Em Risco", value: "23", color: "text-destructive" },
        { icon: "ri-check-double-line", label: "Frequência Média", value: "87%", color: "text-secondary" },
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
    <DataTable
      columns={columns}
      data={students}
      searchPlaceholder="Buscar aluno..."
      actions={(row) => [
        { label: "Ver", icon: "ri-eye-line", to: `/alunos/${row.id}` },
        { label: "Editar", icon: "ri-pencil-line", to: `/alunos/${row.id}/editar` },
      ]}
    />
  </AppLayout>
);

export default StudentsList;

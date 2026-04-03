import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";

const data = [
  { aluno: "Ana Clara Silva", turma: "5º A", frequencia: "96%", faltas: "6", status: "active" },
  { aluno: "Pedro H. Costa", turma: "3º B", frequencia: "72%", faltas: "42", status: "critical" },
  { aluno: "Maria F. Souza", turma: "4º A", frequencia: "91%", faltas: "13", status: "active" },
  { aluno: "Lucas G. Lima", turma: "5º B", frequencia: "58%", faltas: "63", status: "critical" },
  { aluno: "Isabela Martins", turma: "2º A", frequencia: "94%", faltas: "9", status: "active" },
  { aluno: "João V. Santos", turma: "6º A", frequencia: "78%", faltas: "33", status: "warning" },
];

const columns = [
  { key: "aluno", label: "Aluno" },
  { key: "turma", label: "Turma" },
  { key: "frequencia", label: "Frequência" },
  { key: "faltas", label: "Faltas" },
  { key: "status", label: "Situação", render: (v: string) => <StatusBadge status={v} label={v === "active" ? "Regular" : v === "warning" ? "Atenção" : "Crítico"} /> },
];

const AttendanceView = () => (
  <AppLayout title="Consultar Frequência" breadcrumbs={[{ label: "Frequência", href: "/frequencia" }, { label: "Consultar" }]}>
    <PageHeader title="Consulta de Frequência" description="Visualize a frequência por aluno" />
    <DataTable columns={columns} data={data} searchPlaceholder="Buscar aluno..." />
  </AppLayout>
);

export default AttendanceView;

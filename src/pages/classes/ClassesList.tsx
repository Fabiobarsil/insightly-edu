import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";

const classes = [
  { id: "1", nome: "5º Ano A", professor: "Profa. Maria Oliveira", alunos: "32", turno: "Matutino", status: "active" },
  { id: "2", nome: "5º Ano B", professor: "Prof. João Santos", alunos: "28", turno: "Matutino", status: "active" },
  { id: "3", nome: "3º Ano A", professor: "Prof. João Santos", alunos: "30", turno: "Vespertino", status: "active" },
  { id: "4", nome: "6º Ano A", professor: "Profa. Ana Lima", alunos: "34", turno: "Matutino", status: "warning" },
  { id: "5", nome: "1º Ano B", professor: "Profa. Julia Ferreira", alunos: "25", turno: "Vespertino", status: "active" },
];

const columns = [
  { key: "nome", label: "Turma" },
  { key: "professor", label: "Professor(a)" },
  { key: "alunos", label: "Alunos" },
  { key: "turno", label: "Turno" },
  { key: "status", label: "Status", render: (v: string) => <StatusBadge status={v} label={v === "active" ? "Ativa" : "Atenção"} /> },
];

const ClassesList = () => (
  <AppLayout title="Turmas" breadcrumbs={[{ label: "Turmas" }]}>
    <PageHeader title="Turmas" description="Gerencie as turmas e atribuições" action={{ label: "Nova Turma", icon: "ri-add-line", to: "/turmas/novo" }} />
    <DataTable columns={columns} data={classes} searchPlaceholder="Buscar turma..." actions={(row) => [
      { label: "Editar", icon: "ri-pencil-line", to: `/turmas/${row.id}/editar` },
    ]} />
  </AppLayout>
);

export default ClassesList;

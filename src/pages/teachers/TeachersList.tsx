import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";

const teachers = [
  { id: "1", nome: "Profa. Maria Oliveira", disciplinas: "Português, Redação", turmas: "5ºA, 5ºB, 6ºA", status: "active" },
  { id: "2", nome: "Prof. João Santos", disciplinas: "Matemática", turmas: "3ºA, 3ºB, 4ºA", status: "active" },
  { id: "3", nome: "Profa. Ana Lima", disciplinas: "Ciências", turmas: "5ºA, 6ºA", status: "active" },
  { id: "4", nome: "Prof. Carlos Mendes", disciplinas: "História, Geografia", turmas: "4ºA, 4ºB", status: "inactive" },
  { id: "5", nome: "Profa. Julia Ferreira", disciplinas: "Ed. Física", turmas: "1ºA-6ºA", status: "active" },
];

const columns = [
  { key: "nome", label: "Nome" },
  { key: "disciplinas", label: "Disciplinas" },
  { key: "turmas", label: "Turmas" },
  { key: "status", label: "Status", render: (v: string) => <StatusBadge status={v} label={v === "active" ? "Ativo" : "Inativo"} /> },
];

const TeachersList = () => (
  <AppLayout title="Professores" breadcrumbs={[{ label: "Professores" }]}>
    <PageHeader title="Professores" description="Gerencie o corpo docente" action={{ label: "Novo Professor", icon: "ri-add-line", to: "/professores/novo" }} />
    <DataTable columns={columns} data={teachers} searchPlaceholder="Buscar professor..." actions={(row) => [
      { label: "Ver", icon: "ri-eye-line", to: `/professores/${row.id}` },
      { label: "Editar", icon: "ri-pencil-line", to: `/professores/${row.id}/editar` },
    ]} />
  </AppLayout>
);

export default TeachersList;

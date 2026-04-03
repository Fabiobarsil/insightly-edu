import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";

const guardians = [
  { id: "1", nome: "Carlos Silva", alunos: "Ana Clara Silva", tel: "(11) 98765-4321", email: "carlos@email.com", parentesco: "Pai" },
  { id: "2", nome: "Maria Silva", alunos: "Ana Clara Silva", tel: "(11) 91234-5678", email: "maria@email.com", parentesco: "Mãe" },
  { id: "3", nome: "José Costa", alunos: "Pedro H. Costa", tel: "(11) 92345-6789", email: "jose@email.com", parentesco: "Pai" },
  { id: "4", nome: "Fernanda Souza", alunos: "Maria F. Souza", tel: "(11) 93456-7890", email: "fernanda@email.com", parentesco: "Mãe" },
  { id: "5", nome: "Roberto Lima", alunos: "Lucas G. Lima", tel: "(11) 94567-8901", email: "roberto@email.com", parentesco: "Pai" },
];

const columns = [
  { key: "nome", label: "Nome" },
  { key: "parentesco", label: "Parentesco" },
  { key: "alunos", label: "Aluno(s)" },
  { key: "tel", label: "Telefone" },
  { key: "email", label: "E-mail" },
];

const GuardiansList = () => (
  <AppLayout title="Responsáveis" breadcrumbs={[{ label: "Responsáveis" }]}>
    <PageHeader title="Responsáveis" description="Gerencie os responsáveis dos alunos" action={{ label: "Novo Responsável", icon: "ri-add-line", to: "/responsaveis/novo" }} />
    <DataTable columns={columns} data={guardians} searchPlaceholder="Buscar responsável..." actions={(row) => [
      { label: "Ver", icon: "ri-eye-line", to: `/responsaveis/${row.id}` },
      { label: "Editar", icon: "ri-pencil-line", to: `/responsaveis/${row.id}/editar` },
    ]} />
  </AppLayout>
);

export default GuardiansList;

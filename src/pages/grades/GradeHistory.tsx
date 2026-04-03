import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";

const history = [
  { turma: "5º Ano A", disciplina: "Português", bimestre: "1º Bimestre", data: "15/03/2024", professor: "Profa. Maria" },
  { turma: "5º Ano A", disciplina: "Matemática", bimestre: "1º Bimestre", data: "14/03/2024", professor: "Prof. João" },
  { turma: "3º Ano A", disciplina: "Ciências", bimestre: "1º Bimestre", data: "13/03/2024", professor: "Profa. Ana" },
  { turma: "5º Ano B", disciplina: "Português", bimestre: "1º Bimestre", data: "12/03/2024", professor: "Profa. Maria" },
  { turma: "6º Ano A", disciplina: "História", bimestre: "1º Bimestre", data: "11/03/2024", professor: "Prof. Carlos" },
];

const columns = [
  { key: "turma", label: "Turma" },
  { key: "disciplina", label: "Disciplina" },
  { key: "bimestre", label: "Bimestre" },
  { key: "data", label: "Data do Lançamento" },
  { key: "professor", label: "Professor" },
];

const GradeHistory = () => (
  <AppLayout title="Histórico de Notas" breadcrumbs={[{ label: "Notas", href: "/notas" }, { label: "Histórico" }]}>
    <PageHeader title="Histórico de Notas" description="Consulte lançamentos anteriores" />
    <DataTable columns={columns} data={history} searchPlaceholder="Buscar..." />
  </AppLayout>
);

export default GradeHistory;

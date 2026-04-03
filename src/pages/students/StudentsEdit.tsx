import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormCard from "@/components/shared/FormCard";
import FormField from "@/components/shared/FormField";

const StudentsEdit = () => (
  <AppLayout title="Editar Aluno" breadcrumbs={[{ label: "Alunos", href: "/alunos" }, { label: "Editar Aluno" }]}>
    <PageHeader title="Editar Aluno" description="Atualize os dados do aluno" />
    <div className="space-y-6">
      <FormCard title="Dados Pessoais" cancelTo="/alunos">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nome" value="Ana Clara" />
          <FormField label="Sobrenome" value="Silva" />
          <FormField label="Data de Nascimento" type="date" value="2014-03-15" />
          <FormField label="CPF" value="123.456.789-00" />
          <FormField label="RG" value="12.345.678-9" />
          <FormField label="Gênero" options={[
            { value: "M", label: "Masculino" },
            { value: "F", label: "Feminino" },
            { value: "O", label: "Outro" },
          ]} />
        </div>
      </FormCard>
      <FormCard title="Dados Escolares" cancelTo="/alunos">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Matrícula" value="2024001" />
          <FormField label="Turma" options={[
            { value: "5A", label: "5º Ano A" },
            { value: "5B", label: "5º Ano B" },
          ]} />
          <FormField label="Turno" options={[
            { value: "M", label: "Matutino" },
            { value: "V", label: "Vespertino" },
          ]} />
          <FormField label="Status" options={[
            { value: "active", label: "Ativo" },
            { value: "inactive", label: "Inativo" },
            { value: "transferred", label: "Transferido" },
          ]} />
        </div>
      </FormCard>
    </div>
  </AppLayout>
);

export default StudentsEdit;

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormCard from "@/components/shared/FormCard";
import FormField from "@/components/shared/FormField";

const StudentsCreate = () => (
  <AppLayout title="Novo Aluno" breadcrumbs={[{ label: "Alunos", href: "/alunos" }, { label: "Novo Aluno" }]}>
    <PageHeader title="Cadastrar Aluno" description="Preencha os dados do novo aluno" />
    <div className="space-y-6">
      <FormCard title="Dados Pessoais" cancelTo="/alunos">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nome" placeholder="Nome do aluno" />
          <FormField label="Sobrenome" placeholder="Sobrenome" />
          <FormField label="Data de Nascimento" type="date" />
          <FormField label="CPF" placeholder="000.000.000-00" />
          <FormField label="RG" placeholder="00.000.000-0" />
          <FormField label="Gênero" options={[
            { value: "M", label: "Masculino" },
            { value: "F", label: "Feminino" },
            { value: "O", label: "Outro" },
          ]} />
        </div>
      </FormCard>
      <FormCard title="Dados Escolares" cancelTo="/alunos">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Matrícula" placeholder="2024001" />
          <FormField label="Turma" options={[
            { value: "1A", label: "1º Ano A" },
            { value: "2A", label: "2º Ano A" },
            { value: "3A", label: "3º Ano A" },
            { value: "5A", label: "5º Ano A" },
          ]} />
          <FormField label="Turno" options={[
            { value: "M", label: "Matutino" },
            { value: "V", label: "Vespertino" },
            { value: "I", label: "Integral" },
          ]} />
          <FormField label="Data de Matrícula" type="date" />
        </div>
      </FormCard>
      <FormCard title="Endereço" cancelTo="/alunos">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="CEP" placeholder="00000-000" />
          <FormField label="Rua" placeholder="Rua Example" />
          <FormField label="Número" placeholder="123" />
          <FormField label="Bairro" placeholder="Centro" />
          <FormField label="Cidade" placeholder="São Paulo" />
          <FormField label="Estado" options={[
            { value: "SP", label: "São Paulo" },
            { value: "RJ", label: "Rio de Janeiro" },
            { value: "MG", label: "Minas Gerais" },
          ]} />
        </div>
      </FormCard>
    </div>
  </AppLayout>
);

export default StudentsCreate;

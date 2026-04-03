import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormCard from "@/components/shared/FormCard";
import FormField from "@/components/shared/FormField";

const GuardiansCreate = () => (
  <AppLayout title="Novo Responsável" breadcrumbs={[{ label: "Responsáveis", href: "/responsaveis" }, { label: "Novo" }]}>
    <PageHeader title="Cadastrar Responsável" description="Preencha os dados do responsável" />
    <FormCard title="Dados do Responsável" cancelTo="/responsaveis">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Nome Completo" placeholder="Nome do responsável" />
        <FormField label="CPF" placeholder="000.000.000-00" />
        <FormField label="Telefone" placeholder="(00) 00000-0000" />
        <FormField label="E-mail" type="email" placeholder="email@example.com" />
        <FormField label="Parentesco" options={[
          { value: "pai", label: "Pai" },
          { value: "mae", label: "Mãe" },
          { value: "avo", label: "Avô/Avó" },
          { value: "outro", label: "Outro" },
        ]} />
        <FormField label="Aluno Vinculado" options={[
          { value: "1", label: "Ana Clara Silva" },
          { value: "2", label: "Pedro Henrique Costa" },
          { value: "3", label: "Maria Fernanda Souza" },
        ]} />
      </div>
    </FormCard>
  </AppLayout>
);

export default GuardiansCreate;

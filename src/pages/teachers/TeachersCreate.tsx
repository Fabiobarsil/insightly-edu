import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormCard from "@/components/shared/FormCard";
import FormField from "@/components/shared/FormField";

const TeachersCreate = () => (
  <AppLayout title="Novo Professor" breadcrumbs={[{ label: "Professores", href: "/professores" }, { label: "Novo" }]}>
    <PageHeader title="Cadastrar Professor" description="Preencha os dados do professor" />
    <div className="space-y-6">
      <FormCard title="Dados Pessoais" cancelTo="/professores">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nome Completo" placeholder="Nome do professor" />
          <FormField label="CPF" placeholder="000.000.000-00" />
          <FormField label="Data de Nascimento" type="date" />
          <FormField label="Telefone" placeholder="(00) 00000-0000" />
          <FormField label="E-mail" type="email" placeholder="email@escola.edu.br" />
          <FormField label="Formação" placeholder="Licenciatura em..." />
        </div>
      </FormCard>
      <FormCard title="Dados Profissionais" cancelTo="/professores">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Disciplinas" placeholder="Português, Redação" />
          <FormField label="Turno" options={[
            { value: "M", label: "Matutino" },
            { value: "V", label: "Vespertino" },
            { value: "I", label: "Integral" },
          ]} />
          <FormField label="Data de Admissão" type="date" />
          <FormField label="Registro Profissional" placeholder="MEC..." />
        </div>
      </FormCard>
    </div>
  </AppLayout>
);

export default TeachersCreate;

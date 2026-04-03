import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormCard from "@/components/shared/FormCard";
import FormField from "@/components/shared/FormField";

const ClassesCreate = () => (
  <AppLayout title="Nova Turma" breadcrumbs={[{ label: "Turmas", href: "/turmas" }, { label: "Nova" }]}>
    <PageHeader title="Criar Turma" description="Configure a nova turma" />
    <FormCard title="Dados da Turma" cancelTo="/turmas">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Nome da Turma" placeholder="5º Ano A" />
        <FormField label="Série" options={[
          { value: "1", label: "1º Ano" }, { value: "2", label: "2º Ano" }, { value: "3", label: "3º Ano" },
          { value: "4", label: "4º Ano" }, { value: "5", label: "5º Ano" }, { value: "6", label: "6º Ano" },
        ]} />
        <FormField label="Turno" options={[
          { value: "M", label: "Matutino" }, { value: "V", label: "Vespertino" }, { value: "I", label: "Integral" },
        ]} />
        <FormField label="Professor Responsável" options={[
          { value: "1", label: "Profa. Maria Oliveira" }, { value: "2", label: "Prof. João Santos" },
        ]} />
        <FormField label="Sala" placeholder="Sala 12" />
        <FormField label="Capacidade Máxima" type="number" placeholder="35" />
      </div>
    </FormCard>
  </AppLayout>
);

export default ClassesCreate;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormCard from "@/components/shared/FormCard";
import FormField from "@/components/shared/FormField";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const GuardiansCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    full_name: "",
    cpf: "",
    phone: "",
    email: "",
    relationship: "",
    financial_responsible: false,
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("guardians").insert({
        full_name: form.full_name,
        phone: form.phone || null,
        email: form.email || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guardians"] });
      toast.success("Responsável cadastrado com sucesso!");
      navigate("/responsaveis");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao cadastrar responsável"),
  });

  return (
    <AppLayout title="Novo Responsável" breadcrumbs={[{ label: "Responsáveis", href: "/responsaveis" }, { label: "Novo" }]}>
      <PageHeader title="Cadastrar Responsável" description="Preencha os dados do responsável" />
      <FormCard title="Dados do Responsável" cancelTo="/responsaveis" onSubmit={() => mutation.mutate()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nome Completo" placeholder="Nome do responsável" value={form.full_name} onChange={set("full_name")} />
          <FormField label="CPF" placeholder="000.000.000-00" value={form.cpf} onChange={set("cpf")} />
          <FormField label="Telefone" placeholder="(00) 00000-0000" value={form.phone} onChange={set("phone")} />
          <FormField label="E-mail" type="email" placeholder="email@example.com" value={form.email} onChange={set("email")} />
          <FormField label="Parentesco" options={[
            { value: "Pai", label: "Pai" },
            { value: "Mãe", label: "Mãe" },
            { value: "Avô/Avó", label: "Avô/Avó" },
            { value: "Outro", label: "Outro" },
          ]} value={form.relationship} onChange={set("relationship")} />
        </div>
      </FormCard>
    </AppLayout>
  );
};

export default GuardiansCreate;

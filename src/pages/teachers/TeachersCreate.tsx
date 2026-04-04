import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormCard from "@/components/shared/FormCard";
import FormField from "@/components/shared/FormField";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const TeachersCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    status: "active",
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("teachers").insert({
        full_name: form.full_name,
        email: form.email || null,
        phone: form.phone || null,
        status: form.status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Professor cadastrado com sucesso!");
      navigate("/professores");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao cadastrar professor"),
  });

  return (
    <AppLayout title="Novo Professor" breadcrumbs={[{ label: "Professores", href: "/professores" }, { label: "Novo" }]}>
      <PageHeader title="Cadastrar Professor" description="Preencha os dados do professor" />
      <FormCard title="Dados do Professor" cancelTo="/professores" onSubmit={() => mutation.mutate()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nome Completo" placeholder="Nome do professor" value={form.full_name} onChange={set("full_name")} />
          <FormField label="E-mail" type="email" placeholder="email@escola.edu.br" value={form.email} onChange={set("email")} />
          <FormField label="Telefone" placeholder="(00) 00000-0000" value={form.phone} onChange={set("phone")} />
          <FormField label="Status" options={[
            { value: "active", label: "Ativo" },
            { value: "inactive", label: "Inativo" },
          ]} value={form.status} onChange={set("status")} />
        </div>
      </FormCard>
    </AppLayout>
  );
};

export default TeachersCreate;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormCard from "@/components/shared/FormCard";
import FormField from "@/components/shared/FormField";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { toast } from "sonner";

const GuardiansCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { schoolId } = useSchoolId();
  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: async () => {
      if (!schoolId) throw new Error("Nenhuma escola vinculada");
      if (!form.full_name.trim()) throw new Error("Nome é obrigatório");
      const { error } = await supabase.from("guardians").insert({
        full_name: form.full_name.trim(),
        phone: form.phone || null,
        email: form.email || null,
        school_id: schoolId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guardians", schoolId] });
      toast.success("Responsável cadastrado!");
      navigate("/admin/responsaveis");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao cadastrar"),
  });

  return (
    <AppLayout title="Novo Responsável" breadcrumbs={[{ label: "Responsáveis", href: "/admin/responsaveis" }, { label: "Novo" }]}>
      <PageHeader title="Cadastrar Responsável" description="Preencha os dados do responsável" />
      <FormCard title="Dados do Responsável" cancelTo="/admin/responsaveis" onSubmit={() => mutation.mutate()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nome Completo" placeholder="Nome do responsável" mask="name" value={form.full_name} onChange={set("full_name")} />
          <FormField label="Telefone" placeholder="(00) 00000-0000" mask="phone" value={form.phone} onChange={set("phone")} />
          <FormField label="E-mail" type="email" placeholder="email@exemplo.com" mask="email" value={form.email} onChange={set("email")} />
        </div>
      </FormCard>
    </AppLayout>
  );
};

export default GuardiansCreate;

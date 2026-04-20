import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormCard from "@/components/shared/FormCard";
import FormField from "@/components/shared/FormField";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { toast } from "sonner";

const GuardiansEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { schoolId } = useSchoolId();
  const [form, setForm] = useState<any>(null);

  const { isLoading } = useQuery({
    queryKey: ["guardian", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("guardians").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      if (data) setForm(data);
      return data;
    },
    enabled: !!id,
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev: any) => ({ ...prev, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.full_name?.trim()) throw new Error("Nome é obrigatório");
      const { error } = await supabase.from("guardians").update({
        full_name: form.full_name.trim(),
        phone: form.phone || null,
        email: form.email || null,
      }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guardians", schoolId] });
      toast.success("Responsável atualizado!");
      navigate("/admin/responsaveis");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar"),
  });

  if (isLoading || !form) return (
    <AppLayout title="Editar Responsável" breadcrumbs={[{ label: "Responsáveis", href: "/admin/responsaveis" }, { label: "Editar" }]}>
      <div className="text-center py-12 text-muted">Carregando...</div>
    </AppLayout>
  );

  return (
    <AppLayout title="Editar Responsável" breadcrumbs={[{ label: "Responsáveis", href: "/admin/responsaveis" }, { label: "Editar" }]}>
      <PageHeader title="Editar Responsável" description="Atualize os dados do responsável" />
      <FormCard title="Dados do Responsável" cancelTo="/admin/responsaveis" onSubmit={() => mutation.mutate()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nome Completo" mask="name" value={form.full_name || ""} onChange={set("full_name")} />
          <FormField label="Telefone" mask="phone" value={form.phone || ""} onChange={set("phone")} />
          <FormField label="E-mail" type="email" mask="email" value={form.email || ""} onChange={set("email")} />
        </div>
      </FormCard>
    </AppLayout>
  );
};

export default GuardiansEdit;

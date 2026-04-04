import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormCard from "@/components/shared/FormCard";
import FormField from "@/components/shared/FormField";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const StudentsEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<any>(null);

  const { isLoading } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (data) setForm(data);
      return data;
    },
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("id, name").order("name");
      return data || [];
    },
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev: any) => ({ ...prev, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("students").update({
        full_name: form.full_name,
        birth_date: form.birth_date || null,
        cpf: form.cpf || null,
        enrollment_code: form.enrollment_code || null,
        class_id: form.class_id || null,
        turn: form.turn || null,
        status: form.status,
        notes: form.notes || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Aluno atualizado com sucesso!");
      navigate("/alunos");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar aluno"),
  });

  if (isLoading || !form) return (
    <AppLayout title="Editar Aluno" breadcrumbs={[{ label: "Alunos", href: "/alunos" }, { label: "Editar" }]}>
      <div className="text-center py-12 text-muted">Carregando...</div>
    </AppLayout>
  );

  return (
    <AppLayout title="Editar Aluno" breadcrumbs={[{ label: "Alunos", href: "/alunos" }, { label: "Editar Aluno" }]}>
      <PageHeader title="Editar Aluno" description="Atualize os dados do aluno" />
      <div className="space-y-6">
        <FormCard title="Dados Pessoais" cancelTo="/alunos" onSubmit={() => mutation.mutate()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nome Completo" value={form.full_name || ""} onChange={set("full_name")} />
            <FormField label="Data de Nascimento" type="date" value={form.birth_date || ""} onChange={set("birth_date")} />
            <FormField label="CPF" value={form.cpf || ""} onChange={set("cpf")} />
          </div>
        </FormCard>
        <FormCard title="Dados Escolares" cancelTo="/alunos" onSubmit={() => mutation.mutate()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Matrícula" value={form.enrollment_code || ""} onChange={set("enrollment_code")} />
            <FormField label="Turma" options={classes.map((c: any) => ({ value: c.id, label: c.name }))} value={form.class_id || ""} onChange={set("class_id")} />
            <FormField label="Turno" options={[
              { value: "Matutino", label: "Matutino" },
              { value: "Vespertino", label: "Vespertino" },
              { value: "Integral", label: "Integral" },
            ]} value={form.turn || ""} onChange={set("turn")} />
            <FormField label="Status" options={[
              { value: "active", label: "Ativo" },
              { value: "inactive", label: "Inativo" },
              { value: "transferred", label: "Transferido" },
            ]} value={form.status || "active"} onChange={set("status")} />
          </div>
        </FormCard>
      </div>
    </AppLayout>
  );
};

export default StudentsEdit;

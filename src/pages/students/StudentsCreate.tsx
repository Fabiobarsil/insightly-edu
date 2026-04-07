import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormCard from "@/components/shared/FormCard";
import FormField from "@/components/shared/FormField";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { toast } from "sonner";

const StudentsCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { schoolId } = useSchoolId();
  const [form, setForm] = useState({
    full_name: "",
    birth_date: "",
    class_id: "",
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("classes").select("id, name").eq("school_id", schoolId).order("name");
      return data || [];
    },
    enabled: !!schoolId,
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: async () => {
      if (!schoolId) throw new Error("Nenhuma escola vinculada");
      if (!form.full_name.trim()) throw new Error("Nome é obrigatório");
      const { error } = await supabase.from("students").insert({
        full_name: form.full_name.trim(),
        birth_date: form.birth_date || null,
        class_id: form.class_id || null,
        school_id: schoolId,
        status: "ativo" as const,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", schoolId] });
      toast.success("Aluno cadastrado com sucesso!");
      navigate("/admin/alunos");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao cadastrar aluno"),
  });

  return (
    <AppLayout title="Novo Aluno" breadcrumbs={[{ label: "Alunos", href: "/admin/alunos" }, { label: "Novo Aluno" }]}>
      <PageHeader title="Cadastrar Aluno" description="Preencha os dados do novo aluno" />
      <div className="space-y-6">
        <FormCard title="Dados Pessoais" cancelTo="/admin/alunos" onSubmit={() => mutation.mutate()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nome Completo" placeholder="Nome do aluno" value={form.full_name} onChange={set("full_name")} />
            <FormField label="Data de Nascimento" type="date" value={form.birth_date} onChange={set("birth_date")} />
            <FormField label="Turma" options={classes.map((c: any) => ({ value: c.id, label: c.name }))} value={form.class_id} onChange={set("class_id")} />
          </div>
        </FormCard>
      </div>
    </AppLayout>
  );
};

export default StudentsCreate;

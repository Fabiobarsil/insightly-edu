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
  const [form, setForm] = useState({ full_name: "", birth_date: "", class_id: "", guardian_id: "" });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("classes").select("id, name").eq("school_id", schoolId).order("name");
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: guardians = [] } = useQuery({
    queryKey: ["guardians", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("guardians").select("id, full_name").eq("school_id", schoolId).order("full_name");
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
      const { data: student, error } = await supabase.from("students").insert({
        full_name: form.full_name.trim(),
        birth_date: form.birth_date || null,
        class_id: form.class_id || null,
        school_id: schoolId,
        status: "ativo" as const,
      }).select("id").single();
      if (error) throw error;
      if (form.guardian_id && student) {
        await supabase.from("student_guardians").insert({
          student_id: student.id,
          guardian_id: form.guardian_id,
          school_id: schoolId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", schoolId] });
      toast.success("Aluno cadastrado!");
      navigate("/admin/alunos");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao cadastrar"),
  });

  return (
    <AppLayout title="Novo Aluno" breadcrumbs={[{ label: "Alunos", href: "/admin/alunos" }, { label: "Novo Aluno" }]}>
      <PageHeader title="Cadastrar Aluno" description="Preencha os dados do novo aluno" />
      <FormCard title="Dados do Aluno" cancelTo="/admin/alunos" onSubmit={() => mutation.mutate()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nome Completo" placeholder="Nome do aluno" value={form.full_name} onChange={set("full_name")} />
          <FormField label="Data de Nascimento" type="date" value={form.birth_date} onChange={set("birth_date")} />
          <FormField label="Turma" options={classes.map((c: any) => ({ value: c.id, label: c.name }))} value={form.class_id} onChange={set("class_id")} />
          <FormField label="Responsável" options={guardians.map((g: any) => ({ value: g.id, label: g.full_name }))} value={form.guardian_id} onChange={set("guardian_id")} />
        </div>
      </FormCard>
    </AppLayout>
  );
};

export default StudentsCreate;

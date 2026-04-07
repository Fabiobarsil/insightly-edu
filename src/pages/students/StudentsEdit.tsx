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

const StudentsEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { schoolId } = useSchoolId();
  const [form, setForm] = useState<any>(null);

  const { isLoading } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      if (data) setForm(data);
      return data;
    },
    enabled: !!id,
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
    setForm((prev: any) => ({ ...prev, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("students").update({
        full_name: form.full_name,
        birth_date: form.birth_date || null,
        class_id: form.class_id || null,
        status: form.status,
      }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", schoolId] });
      toast.success("Aluno atualizado com sucesso!");
      navigate("/admin/alunos");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar aluno"),
  });

  if (isLoading || !form) return (
    <AppLayout title="Editar Aluno" breadcrumbs={[{ label: "Alunos", href: "/admin/alunos" }, { label: "Editar" }]}>
      <div className="text-center py-12 text-muted">Carregando...</div>
    </AppLayout>
  );

  return (
    <AppLayout title="Editar Aluno" breadcrumbs={[{ label: "Alunos", href: "/admin/alunos" }, { label: "Editar Aluno" }]}>
      <PageHeader title="Editar Aluno" description="Atualize os dados do aluno" />
      <div className="space-y-6">
        <FormCard title="Dados do Aluno" cancelTo="/admin/alunos" onSubmit={() => mutation.mutate()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nome Completo" value={form.full_name || ""} onChange={set("full_name")} />
            <FormField label="Data de Nascimento" type="date" value={form.birth_date || ""} onChange={set("birth_date")} />
            <FormField label="Turma" options={classes.map((c: any) => ({ value: c.id, label: c.name }))} value={form.class_id || ""} onChange={set("class_id")} />
            <FormField label="Status" options={[
              { value: "ativo", label: "Ativo" },
              { value: "inativo", label: "Inativo" },
              { value: "transferido", label: "Transferido" },
              { value: "incompleto", label: "Incompleto" },
              { value: "irregular", label: "Irregular" },
            ]} value={form.status || "ativo"} onChange={set("status")} />
          </div>
        </FormCard>
      </div>
    </AppLayout>
  );
};

export default StudentsEdit;

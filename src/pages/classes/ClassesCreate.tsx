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

const ClassesCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { schoolId } = useSchoolId();
  const [form, setForm] = useState({
    name: "",
    grade: "",
    shift: "",
    academic_year: new Date().getFullYear(),
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: async () => {
      if (!schoolId) throw new Error("Escola não encontrada");
      const { error } = await supabase.from("classes").insert({
        name: form.name,
        grade: form.grade || null,
        shift: form.shift || null,
        academic_year: Number(form.academic_year) || null,
        school_id: schoolId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Turma criada com sucesso!");
      navigate("/admin/turmas");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao criar turma"),
  });

  return (
    <AppLayout title="Nova Turma" breadcrumbs={[{ label: "Turmas", href: "/admin/turmas" }, { label: "Nova" }]}>
      <PageHeader title="Criar Turma" description="Configure a nova turma" />
      <FormCard title="Dados da Turma" cancelTo="/admin/turmas" onSubmit={() => mutation.mutate()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nome da Turma" placeholder="5º Ano A" value={form.name} onChange={set("name")} />
          <FormField label="Série" options={[
            { value: "1º Ano", label: "1º Ano" }, { value: "2º Ano", label: "2º Ano" }, { value: "3º Ano", label: "3º Ano" },
            { value: "4º Ano", label: "4º Ano" }, { value: "5º Ano", label: "5º Ano" }, { value: "6º Ano", label: "6º Ano" },
          ]} value={form.grade} onChange={set("grade")} />
          <FormField label="Turno" options={[
            { value: "Matutino", label: "Matutino" }, { value: "Vespertino", label: "Vespertino" }, { value: "Integral", label: "Integral" },
          ]} value={form.shift} onChange={set("shift")} />
          <FormField label="Ano Letivo" type="number" placeholder="2024" value={String(form.academic_year)} onChange={set("academic_year")} />
        </div>
      </FormCard>
    </AppLayout>
  );
};

export default ClassesCreate;

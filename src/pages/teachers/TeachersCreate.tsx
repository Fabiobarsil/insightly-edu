import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormCard from "@/components/shared/FormCard";
import FormField from "@/components/shared/FormField";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSchoolId } from "@/hooks/useSchoolId";

interface Assignment {
  id: string;
  class_id: string;
  subject_id: string;
}

let tempId = 0;
const newId = () => `temp-${++tempId}`;

const TeachersCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { schoolId } = useSchoolId();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    status: "active",
  });
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const { data: classes = [] } = useQuery({
    queryKey: ["classes-for-teacher", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("classes").select("id, name, grade, shift").eq("school_id", schoolId);
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects-for-teacher", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("subjects").select("id, name").eq("school_id", schoolId);
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  const addAssignment = () =>
    setAssignments((prev) => [...prev, { id: newId(), class_id: "", subject_id: "" }]);

  const updateAssignment = (id: string, field: "class_id" | "subject_id", value: string) =>
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));

  const removeAssignment = (id: string) =>
    setAssignments((prev) => prev.filter((a) => a.id !== id));

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.full_name.trim()) throw new Error("Nome é obrigatório");
      if (!schoolId) throw new Error("Escola não encontrada");

      const { data: teacher, error: teacherError } = await supabase
        .from("teachers")
        .insert({
          school_id: schoolId,
          full_name: form.full_name,
          email: form.email || null,
          status: form.status,
        })
        .select()
        .maybeSingle();

      if (teacherError) {
        console.error("Teacher insert error:", teacherError);
        throw teacherError;
      }
      if (!teacher) throw new Error("Erro ao criar professor");

      const validAssignments = assignments.filter((a) => a.class_id && a.subject_id);
      if (validAssignments.length > 0) {
        const rows = validAssignments.map((a) => ({
          teacher_id: teacher.id,
          class_id: a.class_id,
          subject_id: a.subject_id,
          school_id: schoolId,
        }));
        const { error } = await supabase.from("teacher_assignments").insert(rows);
        if (error) {
          console.error("Assignment insert error:", error);
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Professor cadastrado com sucesso!");
      navigate("/admin/professores");
    },
    onError: (err: any) => {
      console.error("Mutation error:", err);
      toast.error(err.message || "Erro ao cadastrar professor");
    },
  });

  return (
    <AppLayout
      title="Novo Professor"
      breadcrumbs={[{ label: "Professores", href: "/admin/professores" }, { label: "Novo" }]}
    >
      <PageHeader title="Cadastrar Professor" description="Preencha os dados e adicione vínculos com turmas e disciplinas" />

      <div className="space-y-6">
        <FormCard title="Dados do Professor" cancelTo="/admin/professores" onSubmit={() => mutation.mutate()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nome Completo" placeholder="Nome do professor" value={form.full_name} onChange={set("full_name")} />
            <FormField label="E-mail" type="email" placeholder="email@escola.edu.br" value={form.email} onChange={set("email")} />
            <FormField
              label="Status"
              options={[
                { value: "active", label: "Ativo" },
                { value: "inactive", label: "Inativo" },
              ]}
              value={form.status}
              onChange={set("status")}
            />
          </div>

          {/* Vínculos */}
          <div className="mt-8 pt-6 border-t border-border/40">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-primary">Vínculos (Turma × Disciplina)</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cada vínculo representa uma disciplina que o professor leciona em uma turma específica.
                </p>
              </div>
              <button
                type="button"
                onClick={addAssignment}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
              >
                <i className="ri-add-line" /> Adicionar
              </button>
            </div>

            {assignments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border/60 rounded-xl">
                Nenhum vínculo adicionado. Clique em "Adicionar" para vincular turmas e disciplinas.
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((a, idx) => (
                  <div key={a.id} className="flex items-start gap-3 p-4 border border-border/40 rounded-xl bg-accent/20">
                    <span className="text-xs font-bold text-muted-foreground mt-2.5 min-w-[20px]">{idx + 1}.</span>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField
                        label="Turma"
                        options={classes.map((c) => ({
                          value: c.id,
                          label: `${c.name}${c.grade ? ` - ${c.grade}` : ""}${c.shift ? ` (${c.shift})` : ""}`,
                        }))}
                        value={a.class_id}
                        onChange={(e) => updateAssignment(a.id, "class_id", e.target.value)}
                      />
                      <FormField
                        label="Disciplina"
                        options={subjects.map((s) => ({
                          value: s.id,
                          label: s.name || "Sem nome",
                        }))}
                        value={a.subject_id}
                        onChange={(e) => updateAssignment(a.id, "subject_id", e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAssignment(a.id)}
                      className="mt-6 p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                      title="Remover vínculo"
                    >
                      <i className="ri-delete-bin-line" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FormCard>
      </div>
    </AppLayout>
  );
};

export default TeachersCreate;

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormCard from "@/components/shared/FormCard";
import FormField from "@/components/shared/FormField";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Assignment {
  id: string;
  class_id: string;
  subject_id: string;
  isNew?: boolean;
}

let tempId = 0;
const newTempId = () => `temp-${++tempId}`;

const TeachersEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ full_name: "", email: "", status: "active" });
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const { data: schoolId } = useQuery({
    queryKey: ["current-school-id-teacher"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: membership } = await supabase
        .from("school_memberships").select("school_id")
        .eq("user_id", user.id).eq("status", "ativo").maybeSingle();
      return membership?.school_id ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Load teacher
  const { data: teacher } = useQuery({
    queryKey: ["teacher", id],
    queryFn: async () => {
      const { data } = await supabase.from("teachers").select("*").eq("id", id!).maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  // Load existing assignments
  const { data: existingAssignments = [] } = useQuery({
    queryKey: ["teacher-assignments", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("teacher_assignments")
        .select("id, class_id, subject_id")
        .eq("teacher_id", id!);
      return data ?? [];
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (teacher) {
      setForm({
        full_name: (teacher as any).full_name || "",
        email: (teacher as any).email || "",
        status: (teacher as any).status || "active",
      });
    }
  }, [teacher]);

  useEffect(() => {
    if (existingAssignments.length > 0) {
      setAssignments(existingAssignments.map((a) => ({
        id: a.id,
        class_id: a.class_id || "",
        subject_id: a.subject_id || "",
      })));
    }
  }, [existingAssignments]);

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
    setAssignments((prev) => [...prev, { id: newTempId(), class_id: "", subject_id: "", isNew: true }]);

  const updateAssignment = (assignId: string, field: "class_id" | "subject_id", value: string) =>
    setAssignments((prev) => prev.map((a) => (a.id === assignId ? { ...a, [field]: value } : a)));

  const removeAssignment = (assignId: string) => {
    const item = assignments.find((a) => a.id === assignId);
    if (item && !item.isNew) {
      setRemovedIds((prev) => [...prev, assignId]);
    }
    setAssignments((prev) => prev.filter((a) => a.id !== assignId));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.full_name.trim()) throw new Error("Nome é obrigatório");
      if (!id) throw new Error("ID inválido");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: membership } = await supabase
        .from("school_memberships").select("school_id")
        .eq("user_id", user.id).eq("status", "ativo").maybeSingle();

      if (!membership?.school_id) throw new Error("Escola não encontrada");

      // Update teacher
      const { error: updateErr } = await supabase
        .from("teachers")
        .update({
          full_name: form.full_name,
          email: form.email || null,
          status: form.status,
        } as any)
        .eq("id", id);

      if (updateErr) throw updateErr;

      // Delete removed assignments
      if (removedIds.length > 0) {
        const { error } = await supabase
          .from("teacher_assignments")
          .delete()
          .in("id", removedIds);
        if (error) throw error;
      }

      // Insert new assignments
      const newOnes = assignments.filter((a) => a.isNew && a.class_id && a.subject_id);
      if (newOnes.length > 0) {
        const rows = newOnes.map((a) => ({
          teacher_id: id,
          class_id: a.class_id,
          subject_id: a.subject_id,
          school_id: membership.school_id,
        }));
        const { error } = await supabase.from("teacher_assignments").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["teacher", id] });
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments", id] });
      toast.success("Professor atualizado com sucesso!");
      navigate("/admin/professores");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar professor"),
  });

  return (
    <AppLayout
      title="Editar Professor"
      breadcrumbs={[{ label: "Professores", href: "/admin/professores" }, { label: "Editar" }]}
    >
      <PageHeader title="Editar Professor" description="Atualize os dados e vínculos do professor" />

      <div className="space-y-6">
        <FormCard title="Dados do Professor" cancelTo="/admin/professores" submitLabel="Atualizar" onSubmit={() => mutation.mutate()}>
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

          <div className="mt-8 pt-6 border-t border-border/40">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-primary">Vínculos (Turma × Disciplina)</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cada vínculo representa uma disciplina em uma turma específica.
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
                Nenhum vínculo. Clique em "Adicionar" para vincular turmas e disciplinas.
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

export default TeachersEdit;

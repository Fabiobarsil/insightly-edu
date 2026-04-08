import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormCard from "@/components/shared/FormCard";
import FormField from "@/components/shared/FormField";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const TeachersCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    status: "active",
  });
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const { data: schoolId } = useQuery({
    queryKey: ["current-school-id-teacher"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: membership } = await supabase
        .from("school_memberships")
        .select("school_id")
        .eq("user_id", user.id)
        .eq("status", "ativo")
        .maybeSingle();
      return membership?.school_id ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes-for-teacher", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("classes")
        .select("id, name, grade, shift")
        .eq("school_id", schoolId);
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects-for-teacher", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("subjects")
        .select("id, name")
        .eq("school_id", schoolId);
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  const toggleClass = (id: string) =>
    setSelectedClasses((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

  const toggleSubject = (id: string) =>
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.full_name.trim()) throw new Error("Nome é obrigatório");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: membership } = await supabase
        .from("school_memberships")
        .select("school_id")
        .eq("user_id", user.id)
        .eq("status", "ativo")
        .maybeSingle();

      if (!membership?.school_id) throw new Error("Escola não encontrada");

      const { data: teacher, error: teacherError } = await supabase
        .from("teachers")
        .insert({
          school_id: membership.school_id,
          full_name: form.full_name,
          email: form.email || null,
          status: form.status,
        } as any)
        .select()
        .maybeSingle();

      if (teacherError) throw teacherError;
      if (!teacher) throw new Error("Erro ao criar professor");

      if (selectedClasses.length > 0 && selectedSubjects.length > 0) {
        const assignments = selectedClasses.flatMap((classId) =>
          selectedSubjects.map((subjectId) => ({
            teacher_id: teacher.id,
            class_id: classId,
            subject_id: subjectId,
            school_id: membership.school_id,
          }))
        );

        const { error: assignError } = await supabase
          .from("teacher_assignments")
          .insert(assignments);

        if (assignError) throw assignError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Professor cadastrado com sucesso!");
      navigate("/admin/professores");
    },
    onError: (err: any) =>
      toast.error(err.message || "Erro ao cadastrar professor"),
  });

  return (
    <AppLayout
      title="Novo Professor"
      breadcrumbs={[
        { label: "Professores", href: "/admin/professores" },
        { label: "Novo" },
      ]}
    >
      <PageHeader
        title="Cadastrar Professor"
        description="Preencha os dados e selecione turmas e disciplinas"
      />

      <div className="space-y-6">
        <FormCard title="Dados do Professor" cancelTo="/admin/professores" onSubmit={() => mutation.mutate()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nome Completo" placeholder="Nome do professor" value={form.full_name} onChange={set("full_name")} />
            <FormField label="E-mail" type="email" placeholder="email@escola.edu.br" value={form.email} onChange={set("email")} />
            <FormField label="Status" options={[
              { value: "active", label: "Ativo" },
              { value: "inactive", label: "Inativo" },
            ]} value={form.status} onChange={set("status")} />
          </div>

          {/* Turmas */}
          <div className="mt-6">
            <h4 className="text-sm font-bold text-muted-foreground mb-3">Turmas</h4>
            {classes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma turma cadastrada.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {classes.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedClasses.includes(c.id)}
                      onCheckedChange={() => toggleClass(c.id)}
                    />
                    <div className="text-sm">
                      <span className="font-medium">{c.name}</span>
                      {(c.grade || c.shift) && (
                        <span className="text-muted-foreground ml-1">
                          — {[c.grade, c.shift].filter(Boolean).join(" / ")}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Disciplinas */}
          <div className="mt-6">
            <h4 className="text-sm font-bold text-muted-foreground mb-3">Disciplinas</h4>
            {subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma disciplina cadastrada.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {subjects.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedSubjects.includes(s.id)}
                      onCheckedChange={() => toggleSubject(s.id)}
                    />
                    <span className="text-sm font-medium">{s.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            {selectedClasses.length} turma(s) e {selectedSubjects.length} disciplina(s) selecionada(s).
          </p>
        </FormCard>
      </div>
    </AppLayout>
  );
};

export default TeachersCreate;

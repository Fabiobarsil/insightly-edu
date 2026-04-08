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
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Fetch school_id
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

  // Fetch classes filtered by school_id
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

  // Fetch subjects filtered by school_id
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
        .insert({ school_id: membership.school_id })
        .select()
        .maybeSingle();

      if (teacherError) throw teacherError;
      if (!teacher) throw new Error("Erro ao criar professor");

      // Create assignments for each class × subject combination
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
        description="Selecione turmas e disciplinas para vincular ao professor"
      />

      <div className="space-y-6">
        {/* Vínculos - Turmas */}
        <div className="bg-card border border-border/60 rounded-xl certus-shadow p-6">
          <h3 className="text-lg font-bold text-primary mb-4">Turmas</h3>
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

        {/* Vínculos - Disciplinas */}
        <div className="bg-card border border-border/60 rounded-xl certus-shadow p-6">
          <h3 className="text-lg font-bold text-primary mb-4">Disciplinas</h3>
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

        {/* Botões */}
        <FormCard
          title="Confirmar Cadastro"
          cancelTo="/admin/professores"
          onSubmit={() => mutation.mutate()}
        >
          <p className="text-sm text-muted-foreground">
            {selectedClasses.length} turma(s) e {selectedSubjects.length} disciplina(s) selecionada(s).
          </p>
        </FormCard>
      </div>
    </AppLayout>
  );
};

export default TeachersCreate;

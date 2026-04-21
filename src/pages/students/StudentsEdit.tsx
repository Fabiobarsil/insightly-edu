import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormField from "@/components/shared/FormField";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";

/**
 * StudentsEdit
 * ------------------------------------------------------------------
 * Tela de edição alinhada à arquitetura baseada em `student_enrollments`.
 *
 * - Fonte principal da query: `student_enrollments` (com join em
 *   `students` e `classes`), buscando pelo `id` da matrícula.
 * - O update é separado em duas operações:
 *     1) `students`            -> dados do aluno (form.id)
 *     2) `student_enrollments` -> turma e ano letivo (form.enrollment_id)
 * - Não há `class_id` nem `academic_year` sendo gravados na tabela
 *   `students` por este componente.
 */
const StudentsEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { schoolId } = useSchoolId();

  const [form, setForm] = useState<any>({
    id: "",
    enrollment_id: "",
    full_name: "",
    birth_date: "",
    cpf: "",
    rg: "",
    email: "",
    phone: "",
    blood_type: "",
    status: "ativo",
    notes: "",
    class_id: "",
    academic_year: "",
    photo_url: null as string | null,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Lista de turmas para o select
  const { data: classes = [] } = useQuery({
    queryKey: ["classes", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from("classes")
        .select("id, name")
        .eq("school_id", schoolId)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId,
  });

  // Query principal: busca pela MATRÍCULA (student_enrollments)
  const { isLoading } = useQuery({
    queryKey: ["student-enrollment", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_enrollments")
        .select(
          `
          *,
          students (*),
          classes (id, name)
        `,
        )
        .eq("id", id!)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setForm({
          ...data.students,
          class_id: data.class_id,
          academic_year: data.academic_year,
          enrollment_id: data.id,
        });

        if (data.students?.photo_url) {
          setPhotoPreview(data.students.photo_url);
        }
      }

      return data;
    },
    enabled: !!id,
  });

  const set =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev: any) => ({ ...prev, [key]: e.target.value }));

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.id) throw new Error("Aluno não carregado");
      if (!form.enrollment_id) throw new Error("Matrícula não carregada");
      if (!form.full_name?.trim()) throw new Error("Nome do aluno é obrigatório");

      // Upload de foto (opcional)
      let photoUrl: string | null = form.photo_url ?? null;
      if (photoFile && schoolId) {
        const filePath = `${schoolId}/photos/${Date.now()}_${photoFile.name}`;
        const { error: upErr } = await supabase.storage
          .from("student-assets")
          .upload(filePath, photoFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage
          .from("student-assets")
          .getPublicUrl(filePath);
        photoUrl = urlData.publicUrl;
      }

      // 1) Atualizar ALUNO (sem class_id / academic_year)
      const { error: studentErr } = await supabase
        .from("students")
        .update({
          full_name: form.full_name?.trim(),
          birth_date: form.birth_date || null,
          cpf: form.cpf || null,
          rg: form.rg || null,
          email: form.email || null,
          phone: form.phone || null,
          blood_type: form.blood_type || null,
          status: form.status || "ativo",
          notes: form.notes || null,
          photo_url: photoUrl,
        })
        .eq("id", form.id);
      if (studentErr) throw studentErr;

      // 2) Atualizar MATRÍCULA (turma + ano letivo)
      const { error: enrollmentErr } = await supabase
        .from("student_enrollments")
        .update({
          class_id: form.class_id,
          academic_year: form.academic_year ? parseInt(form.academic_year) : null,
        })
        .eq("id", form.enrollment_id);
      if (enrollmentErr) throw enrollmentErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student-enrollment"] });
      toast.success("Matrícula atualizada!");
      navigate(`/admin/alunos/${form.id}`);
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao salvar"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const breadcrumbs = [
    { label: "Secretaria", href: "/admin/dashboard" },
    { label: "Alunos", href: "/admin/alunos" },
    { label: "Editar Matrícula" },
  ];

  return (
    <AppLayout title="Editar Matrícula" breadcrumbs={breadcrumbs}>
      <PageHeader
        title="Editar Matrícula"
        description="Atualize os dados do aluno e da matrícula vigente"
      />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando matrícula...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card border border-border/60 rounded-xl certus-shadow p-6">
            <h3 className="text-lg font-bold text-primary mb-6">Dados do Aluno</h3>

            <div className="mb-4">
              <label className="block text-xs font-bold text-muted-foreground mb-2">
                Foto do Aluno
              </label>
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-secondary/30"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                    <i className="ri-camera-line text-xl text-muted-foreground" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] border border-border text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
                >
                  <i className="ri-upload-2-line" /> {photoPreview ? "Trocar foto" : "Selecionar foto"}
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Nome Completo" value={form.full_name} onChange={set("full_name")} />
              <FormField label="Data de Nascimento" type="date" value={form.birth_date || ""} onChange={set("birth_date")} />
              <FormField label="CPF" value={form.cpf || ""} onChange={set("cpf")} />
              <FormField label="RG" value={form.rg || ""} onChange={set("rg")} />
              <FormField label="E-mail" value={form.email || ""} onChange={set("email")} />
              <FormField label="Telefone" value={form.phone || ""} onChange={set("phone")} />
              <FormField
                label="Tipo Sanguíneo"
                options={[
                  { value: "A+", label: "A+" }, { value: "A-", label: "A-" },
                  { value: "B+", label: "B+" }, { value: "B-", label: "B-" },
                  { value: "AB+", label: "AB+" }, { value: "AB-", label: "AB-" },
                  { value: "O+", label: "O+" }, { value: "O-", label: "O-" },
                ]}
                value={form.blood_type || ""}
                onChange={set("blood_type")}
              />
              <FormField
                label="Status"
                options={[
                  { value: "ativo", label: "Ativo" },
                  { value: "inativo", label: "Inativo" },
                ]}
                value={form.status || "ativo"}
                onChange={set("status")}
              />
              <div className="md:col-span-2">
                <FormField label="Observações" textarea value={form.notes || ""} onChange={set("notes")} />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-xl certus-shadow p-6">
            <h3 className="text-lg font-bold text-primary mb-6">Dados da Matrícula</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Turma"
                options={(classes as any[]).map((c) => ({ value: c.id, label: c.name }))}
                value={form.class_id || ""}
                onChange={set("class_id")}
              />
              <FormField
                label="Ano Letivo"
                value={form.academic_year ? String(form.academic_year) : ""}
                onChange={set("academic_year")}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-5 py-2.5 rounded-[14px] font-bold text-sm hover:bg-secondary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <i className={mutation.isPending ? "ri-loader-4-line animate-spin" : "ri-check-line"} />
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </button>
            <Link
              to={`/admin/alunos/${form.id || ""}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[14px] font-bold text-sm border border-border hover:bg-accent transition-colors text-muted-foreground"
            >
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </AppLayout>
  );
};

export default StudentsEdit;

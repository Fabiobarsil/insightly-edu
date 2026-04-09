import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormCard from "@/components/shared/FormCard";
import FormField from "@/components/shared/FormField";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { toast } from "sonner";

const docChecklist = [
  { key: "certidao_nascimento", label: "Certidão de Nascimento", obrigatorio: true },
  { key: "comprovante_residencia", label: "Comprovante de Residência", obrigatorio: true },
  { key: "carteira_vacinacao", label: "Carteira de Vacinação", obrigatorio: true },
  { key: "foto_3x4", label: "Foto 3x4", obrigatorio: false },
  { key: "historico_escolar", label: "Histórico Escolar Anterior", obrigatorio: true },
  { key: "laudo_medico", label: "Laudo Médico (PcD)", obrigatorio: false },
];

const StudentsCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { schoolId } = useSchoolId();
  const [form, setForm] = useState({
    full_name: "", birth_date: "", class_id: "", guardian_id: "",
    cpf: "", rg: "", email: "", academic_year: "",
  });
  const [docs, setDocs] = useState<Record<string, boolean>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  const toggleDoc = (key: string) => setDocs((prev) => ({ ...prev, [key]: !prev[key] }));

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!schoolId) throw new Error("Nenhuma escola vinculada");
      if (!form.full_name.trim()) throw new Error("Nome é obrigatório");

      let photo_url: string | null = null;
      if (photoFile) {
        const filePath = `${schoolId}/photos/${Date.now()}_${photoFile.name}`;
        const { error: upErr } = await supabase.storage.from("student-assets").upload(filePath, photoFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("student-assets").getPublicUrl(filePath);
        photo_url = urlData.publicUrl;
      }

      const { data: student, error } = await supabase.from("students").insert({
        full_name: form.full_name.trim(),
        birth_date: form.birth_date || null,
        class_id: form.class_id || null,
        school_id: schoolId,
        status: "ativo" as const,
        photo_url,
        cpf: form.cpf || null,
        rg: form.rg || null,
        email: form.email || null,
        academic_year: form.academic_year ? parseInt(form.academic_year) : null,
      } as any).select("id").single();
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

  const missingRequired = docChecklist.filter((d) => d.obrigatorio && !docs[d.key]);

  return (
    <AppLayout title="Novo Aluno" breadcrumbs={[{ label: "Alunos", href: "/admin/alunos" }, { label: "Novo Aluno" }]}>
      <PageHeader title="Cadastrar Aluno" description="Preencha os dados do novo aluno" />
      <FormCard title="Dados do Aluno" cancelTo="/admin/alunos" onSubmit={() => mutation.mutate()}>
        {/* Foto do Aluno */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-muted-foreground mb-2">Foto do Aluno</label>
          <div className="flex items-center gap-4">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-secondary/30" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                <i className="ri-camera-line text-xl text-muted-foreground" />
              </div>
            )}
            <button type="button" onClick={() => photoInputRef.current?.click()} className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] border border-border text-sm font-medium text-muted-foreground hover:bg-accent transition-colors">
              <i className="ri-upload-2-line" /> {photoPreview ? "Trocar foto" : "Selecionar foto"}
            </button>
            <input ref={photoInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoSelect} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nome Completo" placeholder="Nome do aluno" value={form.full_name} onChange={set("full_name")} />
          <FormField label="Data de Nascimento" type="date" value={form.birth_date} onChange={set("birth_date")} />
          <FormField label="CPF" placeholder="000.000.000-00" value={form.cpf} onChange={set("cpf")} />
          <FormField label="RG" placeholder="Número do RG" value={form.rg} onChange={set("rg")} />
          <FormField label="E-mail" placeholder="email@exemplo.com" value={form.email} onChange={set("email")} />
          <FormField label="Ano Letivo" placeholder="2026" value={form.academic_year} onChange={set("academic_year")} />
          <FormField label="Turma" options={classes.map((c: any) => ({ value: c.id, label: c.name }))} value={form.class_id} onChange={set("class_id")} />
          <FormField label="Responsável" options={guardians.map((g: any) => ({ value: g.id, label: g.full_name }))} value={form.guardian_id} onChange={set("guardian_id")} />
        </div>
      </FormCard>

      {/* Checklist de documentos */}
      <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow mt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-primary">Documentos de Matrícula</h4>
          {missingRequired.length > 0 && (
            <span className="text-xs font-bold text-destructive">
              {missingRequired.length} obrigatório(s) pendente(s)
            </span>
          )}
        </div>
        <div className="space-y-2">
          {docChecklist.map((d) => (
            <label key={d.key} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/30 transition-colors cursor-pointer">
              <input type="checkbox" checked={!!docs[d.key]} onChange={() => toggleDoc(d.key)} className="w-4 h-4 rounded border-border text-secondary focus:ring-secondary" />
              <span className="text-sm text-primary font-medium flex-1">{d.label}</span>
              {d.obrigatorio ? (
                <span className="text-[10px] font-bold text-warning-foreground bg-warning/15 px-2 py-0.5 rounded-full">Obrigatório</span>
              ) : (
                <span className="text-[10px] font-bold text-muted-foreground bg-accent px-2 py-0.5 rounded-full">Opcional</span>
              )}
            </label>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default StudentsCreate;

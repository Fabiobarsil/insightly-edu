import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormCard from "@/components/shared/FormCard";
import FormField from "@/components/shared/FormField";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { toast } from "sonner";
import { fetchAddressByCEP } from "@/utils/cep";

const StudentsEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { schoolId } = useSchoolId();
  const [form, setForm] = useState<any>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { isLoading } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setForm(data);
        if (data.photo_url) setPhotoPreview(data.photo_url);
      }
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

  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setForm((prev: any) => ({ ...prev, zip_code: value }));
    const clean = value.replace(/\D/g, "");
    if (clean.length === 8) {
      const data = await fetchAddressByCEP(clean);
      if (!data) return;
      setForm((prev: any) => ({
        ...prev,
        address: prev.address || data.address,
        district: prev.district || data.district,
        city: prev.city || data.city,
        state: prev.state || data.state,
      }));
    }
  };

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
      let photo_url = form.photo_url;
      if (photoFile && schoolId) {
        const filePath = `${schoolId}/photos/${Date.now()}_${photoFile.name}`;
        const { error: upErr } = await supabase.storage.from("student-assets").upload(filePath, photoFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("student-assets").getPublicUrl(filePath);
        photo_url = urlData.publicUrl;
      }
      const { error } = await supabase.from("students").update({
        full_name: form.full_name,
        birth_date: form.birth_date || null,
        class_id: form.class_id || null,
        status: form.status,
        photo_url,
        cpf: form.cpf || null,
        rg: form.rg || null,
        email: form.email || null,
        academic_year: form.academic_year ? parseInt(form.academic_year) : null,
        phone: form.phone || null,
        blood_type: form.blood_type || null,
        address: form.address || null,
        number: form.number || null,
        district: form.district || null,
        city: form.city || null,
        state: form.state || null,
        zip_code: form.zip_code || null,
        enrollment_number: form.enrollment_number || null,
        notes: form.notes || null,
      } as any).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["student", id] });
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
          {/* Foto */}
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
            <FormField label="Nome Completo" value={form.full_name || ""} onChange={set("full_name")} />
            <FormField label="Data de Nascimento" type="date" value={form.birth_date || ""} onChange={set("birth_date")} />
            <FormField label="CPF" placeholder="000.000.000-00" value={form.cpf || ""} onChange={set("cpf")} />
            <FormField label="RG" placeholder="Número do RG" value={form.rg || ""} onChange={set("rg")} />
            <FormField label="E-mail" placeholder="email@exemplo.com" value={form.email || ""} onChange={set("email")} />
            <FormField label="Telefone" placeholder="(00) 00000-0000" value={form.phone || ""} onChange={set("phone")} />
            <FormField label="Tipo Sanguíneo" options={[
              { value: "A+", label: "A+" }, { value: "A-", label: "A-" },
              { value: "B+", label: "B+" }, { value: "B-", label: "B-" },
              { value: "AB+", label: "AB+" }, { value: "AB-", label: "AB-" },
              { value: "O+", label: "O+" }, { value: "O-", label: "O-" },
            ]} value={form.blood_type || ""} onChange={set("blood_type")} />
            <FormField label="Matrícula" placeholder="Nº de matrícula" value={form.enrollment_number || ""} onChange={set("enrollment_number")} />
            <FormField label="Ano Letivo" placeholder="2026" value={form.academic_year ? String(form.academic_year) : ""} onChange={set("academic_year")} />
            <FormField label="Turma" options={classes.map((c: any) => ({ value: c.id, label: c.name }))} value={form.class_id || ""} onChange={set("class_id")} />
            <FormField label="Status" options={[
              { value: "ativo", label: "Ativo" },
              { value: "inativo", label: "Inativo" },
              { value: "transferido", label: "Transferido" },
              { value: "incompleto", label: "Incompleto" },
              { value: "irregular", label: "Irregular" },
            ]} value={form.status || "ativo"} onChange={set("status")} />
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-bold text-primary mb-3">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="CEP" placeholder="00000-000" value={form.zip_code || ""} onChange={handleZipChange} />
              <FormField label="Rua" placeholder="Nome da rua" value={form.address || ""} onChange={set("address")} />
              <FormField label="Número" placeholder="Nº" value={form.number || ""} onChange={set("number")} />
              <FormField label="Bairro" placeholder="Bairro" value={form.district || ""} onChange={set("district")} />
              <FormField label="Cidade" placeholder="Cidade" value={form.city || ""} onChange={set("city")} />
              <FormField label="Estado" placeholder="UF" value={form.state || ""} onChange={set("state")} />
            </div>
          </div>

          <div className="mt-6">
            <FormField label="Observações" textarea placeholder="Notas adicionais sobre o aluno" value={form.notes || ""} onChange={set("notes")} />
          </div>
        </FormCard>
      </div>
    </AppLayout>
  );
};

export default StudentsEdit;

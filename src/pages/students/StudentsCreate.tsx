import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormField from "@/components/shared/FormField";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { toast } from "sonner";
import GuardianFormModal from "@/components/guardians/GuardianFormModal";
import { fetchAddressByCEP } from "@/utils/cep";
import { applyMask } from "@/utils/formatters";

const maritalOptions = [
  { value: "solteiro", label: "Solteiro(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "divorciado", label: "Divorciado(a)" },
  { value: "viuvo", label: "Viúvo(a)" },
  { value: "uniao_estavel", label: "União Estável" },
];

const docChecklist = [
  { key: "certidao_nascimento", label: "Certidão de Nascimento", obrigatorio: true },
  { key: "comprovante_residencia", label: "Comprovante de Residência", obrigatorio: true },
  { key: "carteira_vacinacao", label: "Carteira de Vacinação", obrigatorio: true },
  { key: "foto_3x4", label: "Foto 3x4", obrigatorio: false },
  { key: "historico_escolar", label: "Histórico Escolar Anterior", obrigatorio: true },
  { key: "laudo_medico", label: "Laudo Médico (PcD)", obrigatorio: false },
];

const emptyParent = () => ({
  id: null as string | null,
  full_name: "", cpf: "", phone: "", email: "",
  marital_status: "",
  same_address: true,
  is_financial: false, is_pedagogical: false,
});

const StudentsCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { schoolId } = useSchoolId();
  const { id: studentIdParam } = useParams<{ id?: string }>();
  const isEdit = !!studentIdParam;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "", birth_date: "", class_id: "", guardian_id: "",
    cpf: "", rg: "", email: "", academic_year: "", modality: "",
    enrollment_type: "", blood_type: "", status: "ativo", notes: "",
    zip_code: "", address: "", number: "", complement: "", district: "", city: "", state: "",
  });
  const [father, setFather] = useState<any>({ ...emptyParent(), is_financial: true, is_pedagogical: true });
  const [mother, setMother] = useState<any>(emptyParent());
  const [docs, setDocs] = useState<Record<string, boolean>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [guardianModalOpen, setGuardianModalOpen] = useState(false);

  const { data: school } = useQuery({
    queryKey: ["school-modalities", schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data } = await supabase
        .from("schools")
        .select("offers_ensino_fundamental, offers_ensino_medio, offers_eja, offers_curso_tecnico")
        .eq("id", schoolId)
        .maybeSingle();
      return data;
    },
    enabled: !!schoolId,
  });

  const modalityOptions = [
    { value: "ensino_fundamental", label: "Ensino Fundamental", enabled: (school as any)?.offers_ensino_fundamental ?? false },
    { value: "ensino_medio", label: "Ensino Médio", enabled: (school as any)?.offers_ensino_medio ?? true },
    { value: "eja", label: "Educação de Jovens e Adultos (EJA)", enabled: (school as any)?.offers_eja ?? false },
    { value: "curso_tecnico", label: "Curso Técnico", enabled: (school as any)?.offers_curso_tecnico ?? false },
  ].filter((m) => m.enabled);

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

  // Pré-carrega aluno + responsáveis quando em modo edição
  const { data: studentData } = useQuery({
    queryKey: ["student-edit", studentIdParam],
    queryFn: async () => {
      if (!studentIdParam) return null;
      const { data: student, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentIdParam)
        .maybeSingle();
      if (error) throw error;

      const { data: links } = await supabase
        .from("student_guardians")
        .select("guardian_id, guardians:guardian_id(*)")
        .eq("student_id", studentIdParam);

      const { data: enrollment } = await supabase
        .from("student_enrollments")
        .select("notes, academic_year, class_id, status")
        .eq("student_id", studentIdParam)
        .eq("status", "ativo")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return { student, links: links || [], enrollment };
    },
    enabled: isEdit && !!studentIdParam,
  });

  useEffect(() => {
    if (!studentData?.student) return;
    const s = studentData.student as any;
    setForm({
      full_name: s.full_name || "",
      birth_date: s.birth_date || "",
      class_id: s.class_id || "",
      guardian_id: "",
      cpf: s.cpf || "",
      rg: s.rg || "",
      email: s.email || "",
      academic_year: s.academic_year ? String(s.academic_year) : "",
      modality: s.modality || "",
      enrollment_type: (studentData.enrollment as any)?.notes || "matricula",
      blood_type: s.blood_type || "",
      status: s.status || "ativo",
      notes: s.notes || "",
      zip_code: s.zip_code || "",
      address: s.address || "",
      number: s.number || "",
      complement: s.complement || "",
      district: s.district || "",
      city: s.city || "",
      state: s.state || "",
    });
    if (s.photo_url) {
      setExistingPhotoUrl(s.photo_url);
      setPhotoPreview(s.photo_url);
    }

    const linkedGuardians = (studentData.links || [])
      .map((l: any) => l.guardians)
      .filter(Boolean);

    const pai = linkedGuardians.find((g: any) => g.relationship_type === "pai");
    const mae = linkedGuardians.find((g: any) => g.relationship_type === "mae");
    const outro = linkedGuardians.find((g: any) => g.relationship_type !== "pai" && g.relationship_type !== "mae");

    const sameAddr = (g: any) =>
      !!g.zipcode && !!s.zip_code && (g.zipcode || "").replace(/\D/g, "") === (s.zip_code || "").replace(/\D/g, "");

    if (pai) {
      setFather({
        id: pai.id,
        full_name: pai.full_name || "",
        cpf: pai.cpf || "",
        phone: pai.phone || "",
        email: pai.email || "",
        marital_status: pai.marital_status || "",
        same_address: sameAddr(pai),
        is_financial: !!pai.is_financial,
        is_pedagogical: !!pai.is_pedagogical,
      });
    }
    if (mae) {
      setMother({
        id: mae.id,
        full_name: mae.full_name || "",
        cpf: mae.cpf || "",
        phone: mae.phone || "",
        email: mae.email || "",
        marital_status: mae.marital_status || "",
        same_address: sameAddr(mae),
        is_financial: !!mae.is_financial,
        is_pedagogical: !!mae.is_pedagogical,
      });
    }
    if (outro) setForm((prev) => ({ ...prev, guardian_id: outro.id }));
  }, [studentData]);

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

  const upsertGuardian = async (parent: any, relationship: "pai" | "mae"): Promise<string | null> => {
    if (!parent.full_name.trim()) return null;
    const addressFromStudent = parent.same_address ? {
      zipcode: form.zip_code || null,
      address: form.address || null,
      number: form.number || null,
      complement: form.complement || null,
      district: form.district || null,
      city: form.city || null,
      state: form.state || null,
    } : {};
    const payload: any = {
      school_id: schoolId,
      full_name: parent.full_name.trim(),
      cpf: parent.cpf || null,
      phone: parent.phone || null,
      email: parent.email || null,
      marital_status: parent.marital_status || null,
      relationship_type: relationship,
      is_financial: parent.is_financial,
      is_pedagogical: parent.is_pedagogical,
      is_primary: parent.is_financial || parent.is_pedagogical,
      ...addressFromStudent,
    };
    if (parent.id) {
      const { error } = await supabase.from("guardians").update(payload).eq("id", parent.id);
      if (error) throw error;
      return parent.id;
    }
    if (parent.cpf) {
      const { data: existing } = await supabase
        .from("guardians")
        .select("id")
        .eq("school_id", schoolId)
        .eq("cpf", parent.cpf)
        .maybeSingle();
      if (existing?.id) {
        await supabase.from("guardians").update(payload).eq("id", existing.id);
        return existing.id;
      }
    }
    const { data: created, error } = await supabase.from("guardians").insert(payload).select("id").single();
    if (error) throw error;
    return created.id;
  };

  const handleStudentZipChange = async (val: string) => {
    const masked = applyMask("cep", val);
    setForm((p) => ({ ...p, zip_code: masked }));
    const clean = masked.replace(/\D/g, "");
    if (clean.length === 8) {
      const data = await fetchAddressByCEP(clean);
      if (!data) return;
      setForm((p) => ({
        ...p,
        address: p.address || data.address,
        district: p.district || data.district,
        city: p.city || data.city,
        state: p.state || data.state,
      }));
    }
  };

  // Guardian autorizado (modal de edição/criação rápida quando "mesmo endereço" desmarcado)
  const [editGuardianRel, setEditGuardianRel] = useState<"pai" | "mae" | null>(null);

  const openParentDetails = async (rel: "pai" | "mae") => {
    const parent = rel === "pai" ? father : mother;
    // Garante que o guardian existe antes de abrir o modal de edição completa
    if (!parent.id) {
      try {
        const newId = await upsertGuardian(parent, rel);
        if (newId) {
          if (rel === "pai") setFather((p: any) => ({ ...p, id: newId }));
          else setMother((p: any) => ({ ...p, id: newId }));
          setEditGuardianRel(rel);
        } else {
          toast.error("Preencha pelo menos o nome antes de abrir os detalhes");
        }
      } catch (e: any) {
        toast.error(e.message || "Erro ao preparar responsável");
      }
      return;
    }
    setEditGuardianRel(rel);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      console.log(isEdit ? "Atualizando matrícula..." : "Criando matrícula...");
      if (!schoolId) throw new Error("Nenhuma escola vinculada");
      if (!form.full_name.trim()) throw new Error("Nome do aluno é obrigatório");
      if (!form.enrollment_type) throw new Error("Selecione o tipo de vínculo");
      if (!form.class_id) throw new Error("Selecione a turma");
      if (!father.full_name.trim() && !mother.full_name.trim()) {
        throw new Error("Informe ao menos um responsável (pai ou mãe)");
      }
      if (!father.is_financial && !mother.is_financial) {
        throw new Error("Marque o responsável financeiro (pai ou mãe)");
      }
      if (!father.is_pedagogical && !mother.is_pedagogical) {
        throw new Error("Marque o responsável pedagógico (pai ou mãe)");
      }

      let photo_url: string | null = existingPhotoUrl;
      if (photoFile) {
        const filePath = `${schoolId}/photos/${Date.now()}_${photoFile.name}`;
        const { error: upErr } = await supabase.storage.from("student-assets").upload(filePath, photoFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("student-assets").getPublicUrl(filePath);
        photo_url = urlData.publicUrl;
      }

      const academicYear = form.academic_year ? parseInt(form.academic_year) : new Date().getFullYear();

      const studentPayload = {
        full_name: form.full_name.trim(),
        birth_date: form.birth_date || null,
        class_id: form.class_id || null,
        school_id: schoolId,
        status: (form.status as any) || "ativo",
        photo_url,
        cpf: form.cpf || null,
        rg: form.rg || null,
        email: form.email || null,
        academic_year: academicYear,
        modality: form.modality || null,
        blood_type: form.blood_type || null,
        notes: form.notes || null,
      };

      let studentId: string;

      if (isEdit && studentIdParam) {
        const { error } = await supabase
          .from("students")
          .update(studentPayload as any)
          .eq("id", studentIdParam);
        if (error) throw error;
        studentId = studentIdParam;
      } else {
        const { data: student, error } = await supabase
          .from("students")
          .insert(studentPayload as any)
          .select("id")
          .single();
        if (error) throw error;
        studentId = student.id;
      }

      // Matrícula: só cria se não houver ativa naquele ano
      const { data: existingActive, error: checkErr } = await supabase
        .from("student_enrollments")
        .select("id, class_id")
        .eq("student_id", studentId)
        .eq("academic_year", academicYear)
        .eq("status", "ativo")
        .maybeSingle();
      if (checkErr) throw checkErr;

      if (existingActive) {
        if (isEdit) {
          // Atualiza turma/notes na matrícula ativa existente
          await supabase
            .from("student_enrollments")
            .update({ class_id: form.class_id, notes: form.enrollment_type })
            .eq("id", existingActive.id);
        } else {
          throw new Error("Aluno já possui matrícula ativa neste ano");
        }
      } else {
        const enrollmentPayload = {
          student_id: studentId,
          school_id: schoolId,
          class_id: form.class_id,
          academic_year: academicYear,
          status: "ativo" as const,
          start_date: new Date().toISOString().split("T")[0],
          notes: form.enrollment_type,
        };
        const { error: enrollErr } = await supabase
          .from("student_enrollments")
          .insert(enrollmentPayload as any);
        if (enrollErr) throw enrollErr;
      }

      // Responsáveis: cria/atualiza pai e mãe
      const guardianIdsToLink: string[] = [];
      const fatherId = await upsertGuardian(father, "pai");
      if (fatherId) guardianIdsToLink.push(fatherId);
      const motherId = await upsertGuardian(mother, "mae");
      if (motherId) guardianIdsToLink.push(motherId);
      if (form.guardian_id) guardianIdsToLink.push(form.guardian_id);

      if (guardianIdsToLink.length === 0) {
        throw new Error("Aluno deve ter ao menos um responsável vinculado");
      }

      // Em modo edição, remove vínculos antigos antes de re-vincular
      if (isEdit) {
        await supabase.from("student_guardians").delete().eq("student_id", studentId);
      }

      const links = guardianIdsToLink.map((gid) => ({
        student_id: studentId,
        guardian_id: gid,
        school_id: schoolId,
      }));
      const { error: linkErr } = await supabase.from("student_guardians").insert(links);
      if (linkErr) throw linkErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["student-edit", studentIdParam] });
      toast.success(isEdit ? "Matrícula atualizada!" : "Aluno matriculado!");
      navigate(isEdit ? `/admin/alunos/${studentIdParam}` : "/admin/alunos");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao salvar"),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await mutation.mutateAsync();
    } finally {
      setLoading(false);
    }
  };

  const missingRequired = docChecklist.filter((d) => d.obrigatorio && !docs[d.key]);

  const pageTitle = isEdit ? "Editar Matrícula" : "Cadastrar Aluno";
  const pageDesc = isEdit ? "Atualize os dados do aluno e da matrícula" : "Preencha os dados do novo aluno";
  const breadcrumbs = isEdit
    ? [{ label: "Secretaria", href: "/admin/dashboard" }, { label: "Alunos", href: "/admin/alunos" }, { label: "Editar Matrícula" }]
    : [{ label: "Alunos", href: "/admin/alunos" }, { label: "Novo Aluno" }];
  const cancelHref = isEdit ? `/admin/alunos/${studentIdParam}` : "/admin/alunos";

  return (
    <AppLayout title={pageTitle} breadcrumbs={breadcrumbs}>
      <PageHeader title={pageTitle} description={pageDesc} />
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do Aluno */}
        <div className="bg-card border border-border/60 rounded-xl certus-shadow p-6">
          <h3 className="text-lg font-bold text-primary mb-6">Dados do Aluno</h3>

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
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                Tipo de vínculo <span className="text-destructive">*</span>
              </label>
              <select
                value={form.enrollment_type}
                onChange={set("enrollment_type")}
                required
                className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors"
              >
                <option value="">Selecionar...</option>
                <option value="matricula">Matrícula</option>
                <option value="renovacao">Renovação</option>
                <option value="transferencia">Transferência</option>
              </select>
            </div>
            <FormField label="Nome Completo" placeholder="Nome do aluno" mask="name" value={form.full_name} onChange={set("full_name")} />
            <FormField label="Data de Nascimento" type="date" value={form.birth_date} onChange={set("birth_date")} />
            <FormField label="CPF" placeholder="000.000.000-00" mask="cpf" value={form.cpf} onChange={set("cpf")} />
            <FormField label="RG" placeholder="Número do RG" mask="rg" value={form.rg} onChange={set("rg")} />
            <FormField label="Tipo Sanguíneo" options={[
              { value: "A+", label: "A+" }, { value: "A-", label: "A-" },
              { value: "B+", label: "B+" }, { value: "B-", label: "B-" },
              { value: "AB+", label: "AB+" }, { value: "AB-", label: "AB-" },
              { value: "O+", label: "O+" }, { value: "O-", label: "O-" },
            ]} value={form.blood_type} onChange={set("blood_type")} />
            <FormField label="E-mail" placeholder="email@exemplo.com" mask="email" value={form.email} onChange={set("email")} />
            <FormField label="Ano Letivo" placeholder="2026" value={form.academic_year} onChange={set("academic_year")} />
            <FormField label="Turma" options={classes.map((c: any) => ({ value: c.id, label: c.name }))} value={form.class_id} onChange={set("class_id")} />
            {modalityOptions.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Modalidade</label>
                <select
                  value={form.modality}
                  onChange={set("modality")}
                  className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors"
                >
                  <option value="">Selecionar...</option>
                  {modalityOptions.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            )}
            <FormField
              label="Status do Aluno"
              options={[
                { value: "ativo", label: "Ativo" },
                { value: "inativo", label: "Inativo" },
              ]}
              value={form.status}
              onChange={set("status")}
            />
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                Outro responsável autorizado <span className="font-normal text-muted-foreground/70">(opcional — avô, avó, tio(a), transporte escolar etc.)</span>
              </label>
              <div className="flex items-center gap-2">
                <select value={form.guardian_id} onChange={set("guardian_id")} className="flex-1 border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors">
                  <option value="">Selecionar...</option>
                  {guardians.map((g: any) => <option key={g.id} value={g.id}>{g.full_name}</option>)}
                </select>
                <button type="button" onClick={() => setGuardianModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-2.5 rounded-[12px] bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/90 transition-colors whitespace-nowrap">
                  <i className="ri-add-line" /> Novo
                </button>
              </div>
            </div>
            <div className="md:col-span-2">
              <FormField
                label="Observações"
                placeholder="Informações adicionais sobre o aluno (alergias, necessidades especiais, observações pedagógicas etc.)"
                textarea
                value={form.notes}
                onChange={set("notes")}
              />
            </div>
          </div>
        </div>

        {/* Pai e Mãe — obrigatórios na ficha */}
        <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-primary">Filiação</h4>
            <span className="text-[11px] text-muted-foreground">Marque quem é o responsável financeiro e pedagógico</span>
          </div>

          {[
            { title: "Pai", state: father, setState: setFather, key: "father" },
            { title: "Mãe", state: mother, setState: setMother, key: "mother" },
          ].map(({ title, state, setState, key }) => (
            <div key={key} className="mb-5 last:mb-0">
              <h5 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">{title}</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  label={`Nome do ${title.toLowerCase()} *`}
                  placeholder={`Nome completo do ${title.toLowerCase()}`}
                  mask="name"
                  value={state.full_name}
                  onChange={(e: any) => setState((p: any) => ({ ...p, full_name: e.target.value }))}
                />
                <FormField
                  label="CPF"
                  placeholder="000.000.000-00"
                  mask="cpf"
                  value={state.cpf}
                  onChange={(e: any) => setState((p: any) => ({ ...p, cpf: e.target.value }))}
                />
                <FormField
                  label="Telefone"
                  placeholder="(00) 00000-0000"
                  mask="phone"
                  value={state.phone}
                  onChange={(e: any) => setState((p: any) => ({ ...p, phone: e.target.value }))}
                />
                <FormField
                  label="E-mail"
                  placeholder="email@exemplo.com"
                  mask="email"
                  value={state.email}
                  onChange={(e: any) => setState((p: any) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="flex flex-wrap gap-4 mt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.is_financial}
                    onChange={(e) => setState((p: any) => ({ ...p, is_financial: e.target.checked }))}
                    className="w-4 h-4 rounded border-border text-secondary focus:ring-secondary"
                  />
                  <span className="text-sm text-primary">Responsável financeiro</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.is_pedagogical}
                    onChange={(e) => setState((p: any) => ({ ...p, is_pedagogical: e.target.checked }))}
                    className="w-4 h-4 rounded border-border text-secondary focus:ring-secondary"
                  />
                  <span className="text-sm text-primary">Responsável pedagógico</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Checklist de documentos */}
        <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
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

        {/* Botões finais — único ponto de submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-5 py-2.5 rounded-[14px] font-bold text-sm hover:bg-secondary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <i className={loading ? "ri-loader-4-line animate-spin" : "ri-check-line"} />
            {loading ? "Salvando..." : "Salvar"}
          </button>
          <Link to={cancelHref} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[14px] font-bold text-sm border border-border hover:bg-accent transition-colors text-muted-foreground">
            Cancelar
          </Link>
        </div>
      </form>

      <GuardianFormModal
        open={guardianModalOpen}
        onOpenChange={setGuardianModalOpen}
        schoolId={schoolId}
        onCreated={(guardian) => {
          setForm((prev) => ({ ...prev, guardian_id: guardian.id }));
        }}
      />
    </AppLayout>
  );
};

export default StudentsCreate;

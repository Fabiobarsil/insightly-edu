import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
import { ensurePermission } from "@/lib/permissions";

const maritalOptions = [
  { value: "solteiro", label: "Solteiro(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "divorciado", label: "Divorciado(a)" },
  { value: "viuvo", label: "Viúvo(a)" },
  { value: "uniao_estavel", label: "União Estável" },
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
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("request_id");
  const returnTo = searchParams.get("returnTo");
  const showReturnBanner = isEdit && returnTo === "attendance" && !!requestId;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "", birth_date: "", class_id: "", guardian_id: "",
    cpf: "", rg: "", email: "", academic_year: "", modality: "",
    enrollment_type: "", blood_type: "", status: "ativo", notes: "",
    zip_code: "", address: "", number: "", complement: "", district: "", city: "", state: "",
  });
  const [father, setFather] = useState<any>({ ...emptyParent(), is_financial: true, is_pedagogical: true });
  const [mother, setMother] = useState<any>(emptyParent());
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

  const documentsQueryKey = ["student-documents", studentIdParam, schoolId] as const;
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: documentsQueryKey,
    queryFn: async () => {
      if (!studentIdParam || !schoolId) return [];
      const { data, error } = await supabase
        .from("student_documents")
        .select("*")
        .eq("school_id", schoolId)
        .eq("student_id", studentIdParam)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: isEdit && !!studentIdParam && !!schoolId,
  });

  const toggleDocumentStatus = useMutation({
    mutationFn: async (doc: any) => {
      const nextStatus = doc.status === "aprovado" ? "pendente" : "aprovado";
      const { data, error } = await supabase
        .from("student_documents")
        .update({ status: nextStatus })
        .eq("id", doc.id)
        .eq("student_id", studentIdParam!)
        .eq("school_id", schoolId!)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsQueryKey }),
    onError: (err: any) => toast.error(err?.message || "Erro ao atualizar documento"),
  });

  useEffect(() => {
    if (!isEdit || !studentIdParam || !schoolId) return;

    const queryKey = ["student-documents", studentIdParam, schoolId] as const;

    const channel = supabase
      .channel(`student-documents-${studentIdParam}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "student_documents", filter: `student_id=eq.${studentIdParam}` },
        () => queryClient.invalidateQueries({ queryKey }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isEdit, queryClient, schoolId, studentIdParam]);

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

      // Busca vínculos student_guardians (sem join — FK pode não estar exposta no PostgREST)
      const { data: links } = await supabase
        .from("student_guardians")
        .select("guardian_id, is_primary, is_financial_responsible, is_pedagogical_responsible")
        .eq("student_id", studentIdParam);

      // Busca os responsáveis em uma segunda query usando os IDs
      let guardiansData: any[] = [];
      const guardianIds = (links || []).map((l: any) => l.guardian_id).filter(Boolean);
      if (guardianIds.length > 0) {
        const { data: gs } = await supabase
          .from("guardians")
          .select("*")
          .in("id", guardianIds);
        guardiansData = gs || [];
      }

      // Combina vínculos com dados completos
      const linksWithGuardians = (links || []).map((l: any) => ({
        ...l,
        guardians: guardiansData.find((g) => g.id === l.guardian_id) || null,
      }));

      const { data: enrollment } = await supabase
        .from("student_enrollments")
        .select("notes, academic_year, class_id, status")
        .eq("student_id", studentIdParam)
        .eq("status", "ativo")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return { student, links: linksWithGuardians, enrollment };
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
        zip_code: form.zip_code || null,
        address: form.address || null,
        number: form.number || null,
        complement: form.complement || null,
        district: form.district || null,
        city: form.city || null,
        state: form.state || null,
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
          .select()
          .single();
        if (error) throw error;
        studentId = student.id;
        console.log("Matrícula gerada:", (student as any).enrollment_code);
        if ((student as any).enrollment_code) {
          toast.success(`Matrícula gerada: ${(student as any).enrollment_code}`);
        }
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

      return { studentId };
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["students", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["student-edit", studentIdParam] });
      queryClient.invalidateQueries({ queryKey: ["secretary_requests"] });
      queryClient.invalidateQueries({ queryKey: ["operational-metrics"] });
      toast.success(isEdit ? "Matrícula atualizada!" : "Aluno matriculado!");
      navigate(isEdit ? `/admin/alunos/${studentIdParam}` : "/admin/alunos");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao salvar"),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Valida permissão antes de qualquer chamada ao banco
    const action = isEdit ? "student.update" : "student.create";
    if (!(await ensurePermission(action))) return;

    setLoading(true);
    try {
      await mutation.mutateAsync();
    } finally {
      setLoading(false);
    }
  };

  const pageTitle = isEdit ? "Ficha do Aluno" : "Cadastrar Aluno";
  const pageDesc = isEdit ? "Atualize os dados do aluno e da matrícula" : "Preencha os dados do novo aluno";
  const breadcrumbs = isEdit
    ? [{ label: "Secretaria", href: "/admin/dashboard" }, { label: "Alunos", href: "/admin/alunos" }, { label: "Ficha do Aluno" }]
    : [{ label: "Alunos", href: "/admin/alunos" }, { label: "Novo Aluno" }];
  const cancelHref = isEdit ? `/admin/alunos/${studentIdParam}` : "/admin/alunos";

  return (
    <AppLayout title={pageTitle} breadcrumbs={breadcrumbs}>
      <PageHeader title={pageTitle} description={pageDesc} />
      {showReturnBanner && (
        <div className="mb-4 flex items-center justify-between gap-3 bg-primary/5 border border-primary/30 rounded-xl px-4 py-3">
          <p className="text-sm text-foreground">
            Você abriu esta ficha a partir de um atendimento em andamento.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/admin/dashboard?attend=${requestId}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Atendimento
          </button>
        </div>
      )}
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

        {/* Endereço do Aluno */}
        <div className="bg-card border border-border/60 rounded-xl certus-shadow p-6">
          <h3 className="text-lg font-bold text-primary mb-6">Endereço do Aluno</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">CEP</label>
              <input
                type="text"
                value={form.zip_code}
                onChange={(e) => handleStudentZipChange(e.target.value)}
                placeholder="00000-000"
                inputMode="numeric"
                className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Preenche endereço, bairro, cidade e UF automaticamente</p>
            </div>
            <div className="md:col-span-2">
              <FormField label="Endereço" placeholder="Rua, Avenida..." mask="name" value={form.address} onChange={set("address")} />
            </div>
            <FormField label="Número" placeholder="Nº" value={form.number} onChange={set("number")} />
            <FormField label="Complemento" placeholder="Apto, Bloco..." value={form.complement} onChange={set("complement")} />
            <FormField label="Bairro" placeholder="Bairro" mask="name" value={form.district} onChange={set("district")} />
            <FormField label="Cidade" placeholder="Cidade" mask="name" value={form.city} onChange={set("city")} />
            <FormField label="Estado" placeholder="UF" value={form.state} onChange={set("state")} />
          </div>
        </div>


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
                <FormField
                  label="Estado Civil"
                  options={maritalOptions}
                  value={state.marital_status}
                  onChange={(e: any) => setState((p: any) => ({ ...p, marital_status: e.target.value }))}
                />
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-3">
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
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.same_address}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setState((p: any) => ({ ...p, same_address: checked }));
                      if (!checked) {
                        // Abre modal de cadastro completo do responsável para informar endereço próprio
                        openParentDetails(key === "father" ? "pai" : "mae");
                      }
                    }}
                    className="w-4 h-4 rounded border-border text-secondary focus:ring-secondary"
                  />
                  <span className="text-sm text-primary">Mesmo endereço do aluno</span>
                </label>
                {!state.same_address && (
                  <button
                    type="button"
                    onClick={() => openParentDetails(key === "father" ? "pai" : "mae")}
                    className="text-xs font-bold text-secondary hover:underline inline-flex items-center gap-1"
                  >
                    <i className="ri-edit-line" /> Editar endereço/dados completos
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {isEdit && (
          <div className="bg-card border border-border/60 rounded-xl p-6 certus-shadow">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center shrink-0">
                  <i className="ri-folder-upload-line text-2xl text-secondary" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-primary">Entrega de Documentos</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md">
                    Gerencie o checklist de documentos da matrícula em uma página dedicada,
                    com histórico de atendimentos do aluno.
                  </p>
                  {!documentsLoading && documents.length > 0 && (
                    <div className="mt-3 flex items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-1.5 font-bold text-secondary">
                        <i className="ri-checkbox-circle-line" />
                        {(documents as any[]).filter((d) => d.status === "aprovado").length}/{documents.length} aprovados
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Link
                to={`/admin/alunos/${studentIdParam}/entrega-documentos`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[14px] bg-secondary text-secondary-foreground font-bold text-sm hover:bg-secondary/90 transition-colors shadow-md"
              >
                <i className="ri-folder-open-line" /> Abrir Entrega de Documentos
              </Link>
            </div>
          </div>
        )}

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

      {/* Modal para completar dados do pai/mãe quando endereço é diferente */}
      <GuardianFormModal
        open={!!editGuardianRel}
        onOpenChange={(o) => { if (!o) setEditGuardianRel(null); }}
        schoolId={schoolId}
        guardianId={editGuardianRel === "pai" ? father.id : editGuardianRel === "mae" ? mother.id : null}
      />
    </AppLayout>
  );
};

export default StudentsCreate;

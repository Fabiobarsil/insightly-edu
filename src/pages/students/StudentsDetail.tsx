import { useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import StatusBadge from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import GuardianFormModal from "@/components/guardians/GuardianFormModal";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const tabs = [
  { id: "pessoal", label: "Dados Pessoais", icon: "ri-user-line" },
  { id: "responsaveis", label: "Responsáveis", icon: "ri-parent-line" },
  { id: "notas", label: "Notas", icon: "ri-bar-chart-box-line" },
  { id: "documentos", label: "Documentos", icon: "ri-file-text-line" },
];

const statusMap: Record<string, { status: string; label: string }> = {
  ativo: { status: "active", label: "Ativo" },
  inativo: { status: "inactive", label: "Inativo" },
  transferido: { status: "inactive", label: "Transferido" },
  incompleto: { status: "warning", label: "Incompleto" },
  irregular: { status: "warning", label: "Irregular" },
};

const officialDocs = [
  { id: "matricula", nome: "Declaração de Matrícula", icon: "ri-file-text-line" },
  { id: "historico", nome: "Histórico Escolar", icon: "ri-file-list-3-line" },
  { id: "boletim", nome: "Boletim Escolar", icon: "ri-bar-chart-box-line" },
  { id: "transferencia", nome: "Declaração de Transferência", icon: "ri-swap-line" },
  { id: "frequencia", nome: "Declaração de Frequência", icon: "ri-calendar-check-line" },
];

const declReasons = [
  "Para fins de comprovação de matrícula",
  "Para fins de transferência escolar",
  "Para fins trabalhistas",
  "Para fins judiciais",
  "Para benefício social (Bolsa Família, etc.)",
  "Para plano de saúde",
  "Para transporte escolar",
];

const relationshipTypes = [
  { value: "pai", label: "Pai" },
  { value: "mae", label: "Mãe" },
  { value: "responsavel_legal", label: "Responsável Legal" },
  { value: "outro", label: "Outro" },
];

const genderOptions = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
];

const maritalOptions = [
  { value: "solteiro", label: "Solteiro(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "divorciado", label: "Divorciado(a)" },
  { value: "viuvo", label: "Viúvo(a)" },
  { value: "uniao_estavel", label: "União Estável" },
];

const incomeOptions = [
  { value: "ate_1sm", label: "Até 1 salário mínimo" },
  { value: "1_a_3sm", label: "1 a 3 salários mínimos" },
  { value: "3_a_5sm", label: "3 a 5 salários mínimos" },
  { value: "5_a_10sm", label: "5 a 10 salários mínimos" },
  { value: "acima_10sm", label: "Acima de 10 salários mínimos" },
];

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between py-2.5 border-b border-border/20 last:border-0">
    <span className="text-xs font-bold text-muted-foreground">{label}</span>
    <span className="text-sm text-primary font-medium">{value}</span>
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h5 className="text-xs font-bold text-secondary uppercase tracking-wider mt-5 mb-3 first:mt-0">{children}</h5>
);

const FieldInput = ({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) => (
  <div>
    <label className="block text-xs font-bold text-muted-foreground mb-1">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
  </div>
);

const FieldSelect = ({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) => (
  <div>
    <label className="block text-xs font-bold text-muted-foreground mb-1">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors">
      <option value="">Selecionar...</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const FieldCheck = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded border-border text-secondary focus:ring-secondary" />
    <span className="text-sm text-primary">{label}</span>
  </label>
);

const emptyGuardianForm = {
  full_name: "", cpf: "", rg: "", birth_date: "", gender: "", nationality: "", marital_status: "",
  relationship_type: "", relationship_description: "", is_financial: false, is_pedagogical: false, is_primary: false,
  phone: "", phone_secondary: "", email: "", email_secondary: "", whatsapp_enabled: true,
  zipcode: "", address: "", number: "", complement: "", district: "", city: "", state: "",
  profession: "", company: "", income_range: "", work_phone: "",
  can_pickup: false, can_receive_reports: true, can_authorize_image: false,
  notes: "",
};

const StudentsDetail = () => {
  const { id } = useParams();
  const { schoolId } = useSchoolId();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pessoal");
  const [declReason, setDeclReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [addingGuardian, setAddingGuardian] = useState(false);
  const [gf, setGf] = useState({ ...emptyGuardianForm });
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  const gSet = (key: string) => (val: string) => setGf((p) => ({ ...p, [key]: val }));
  const gCheck = (key: string) => (val: boolean) => setGf((p) => ({ ...p, [key]: val }));

  const { data: student, isLoading } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*, classes(name, grade, shift)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: guardiansList = [] } = useQuery({
    queryKey: ["student-guardians", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_guardians")
        .select("guardian_id, guardians(id, full_name, phone, email, relationship_type, whatsapp_enabled)")
        .eq("student_id", id!);
      if (error) throw error;
      return (data || []).map((sg: any) => sg.guardians).filter(Boolean);
    },
    enabled: !!id,
  });

  const { data: grades = [] } = useQuery({
    queryKey: ["student-grades", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grades")
        .select("grade_value, term, assignment_id, teacher_assignments(subject_id, subjects(name))")
        .eq("student_id", id!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id && activeTab === "notas",
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["student-documents", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("student_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id && activeTab === "documentos",
  });

  const addGuardianMutation = useMutation({
    mutationFn: async () => {
      if (!schoolId) throw new Error("Sem escola vinculada");
      if (!gf.full_name.trim()) throw new Error("Nome é obrigatório");
      const { data: guardian, error: gErr } = await supabase
        .from("guardians")
        .insert({
          full_name: gf.full_name.trim(),
          cpf: gf.cpf || null,
          rg: gf.rg || null,
          birth_date: gf.birth_date || null,
          gender: gf.gender || null,
          nationality: gf.nationality || null,
          marital_status: gf.marital_status || null,
          relationship_type: gf.relationship_type || null,
          relationship_description: gf.relationship_description || null,
          is_financial: gf.is_financial,
          is_pedagogical: gf.is_pedagogical,
          is_primary: gf.is_primary,
          phone: gf.phone || null,
          phone_secondary: gf.phone_secondary || null,
          email: gf.email || null,
          email_secondary: gf.email_secondary || null,
          whatsapp_enabled: gf.whatsapp_enabled,
          zipcode: gf.zipcode || null,
          address: gf.address || null,
          number: gf.number || null,
          complement: gf.complement || null,
          district: gf.district || null,
          city: gf.city || null,
          state: gf.state || null,
          profession: gf.profession || null,
          company: gf.company || null,
          income_range: gf.income_range || null,
          work_phone: gf.work_phone || null,
          can_pickup: gf.can_pickup,
          can_receive_reports: gf.can_receive_reports,
          can_authorize_image: gf.can_authorize_image,
          notes: gf.notes || null,
          school_id: schoolId,
        })
        .select("id")
        .single();
      if (gErr) throw gErr;
      const { error: sgErr } = await supabase
        .from("student_guardians")
        .insert({ student_id: id!, guardian_id: guardian.id, school_id: schoolId });
      if (sgErr) throw sgErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-guardians", id] });
      setGf({ ...emptyGuardianForm });
      setAddingGuardian(false);
      toast.success("Responsável adicionado!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao adicionar responsável"),
  });

  const unlinkGuardianMutation = useMutation({
    mutationFn: async (guardianId: string) => {
      const { error } = await supabase
        .from("student_guardians")
        .delete()
        .eq("student_id", id!)
        .eq("guardian_id", guardianId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-guardians", id] });
      toast.success("Vínculo removido!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao remover vínculo"),
  });

  const uploadDocMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!schoolId) throw new Error("Sem escola vinculada");
      setUploadingDoc(true);
      const filePath = `${schoolId}/${id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("student-assets").upload(filePath, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("student-assets").getPublicUrl(filePath);
      const { error: docErr } = await supabase.from("documents").insert({
        school_id: schoolId,
        student_id: id!,
        name: file.name,
        file_url: urlData.publicUrl,
        status: "recebido",
      });
      if (docErr) throw docErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-documents", id] });
      setUploadingDoc(false);
      toast.success("Documento enviado!");
    },
    onError: (err: any) => {
      setUploadingDoc(false);
      toast.error(err.message || "Erro ao enviar documento");
    },
  });

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadDocMutation.mutate(file);
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const handleGenerate = (docName: string) => {
    toast.success(`${docName} gerado para ${student?.full_name}!`);
  };

  const handleGenerateDecl = () => {
    const reason = declReason === "__custom" ? customReason : declReason;
    if (!reason) { toast.error("Selecione ou digite o motivo da declaração"); return; }
    toast.success(`Declaração gerada: "${reason}"`);
  };

  // Notas analytics
  const gradeValues = grades.map((g: any) => g.grade_value).filter((v: any) => v != null) as number[];
  const mediaGeral = gradeValues.length > 0 ? gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length : 0;

  const termOrder = ["1º Bimestre", "2º Bimestre", "3º Bimestre", "4º Bimestre"];
  const gradesByTerm = termOrder.map((term) => {
    const termGrades = grades.filter((g: any) => g.term === term).map((g: any) => g.grade_value).filter((v: any) => v != null) as number[];
    const avg = termGrades.length > 0 ? termGrades.reduce((a, b) => a + b, 0) / termGrades.length : null;
    return { term: term.replace(" Bimestre", ""), media: avg };
  }).filter((t) => t.media !== null);

  let evolucao = "Sem dados";
  let evolucaoColor = "text-muted-foreground";
  let evolucaoIcon = "ri-subtract-line";
  if (gradesByTerm.length >= 2) {
    const last = gradesByTerm[gradesByTerm.length - 1].media!;
    const prev = gradesByTerm[gradesByTerm.length - 2].media!;
    if (last > prev) { evolucao = "Evoluindo"; evolucaoColor = "text-secondary"; evolucaoIcon = "ri-arrow-up-line"; }
    else if (last < prev) { evolucao = "Atenção"; evolucaoColor = "text-destructive"; evolucaoIcon = "ri-arrow-down-line"; }
    else { evolucao = "Estável"; evolucaoColor = "text-muted-foreground"; evolucaoIcon = "ri-subtract-line"; }
  }

  if (isLoading || !student) return (
    <AppLayout title="Aluno" breadcrumbs={[{ label: "Alunos", href: "/admin/alunos" }, { label: "Detalhes" }]}>
      <div className="text-center py-12 text-muted-foreground">Carregando...</div>
    </AppLayout>
  );

  const mapped = statusMap[student.status || "ativo"] || statusMap.ativo;
  const s = student as any;

  return (
    <AppLayout title={student.full_name} breadcrumbs={[{ label: "Alunos", href: "/admin/alunos" }, { label: student.full_name }]}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 max-[640px]:flex-col max-[640px]:gap-4 max-[640px]:items-start">
        <div className="flex items-center gap-4">
          {student.photo_url ? (
            <img src={student.photo_url} alt={student.full_name} className="w-14 h-14 rounded-full object-cover border-2 border-secondary/30" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center">
              <i className="ri-user-line text-2xl text-secondary" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-primary">{student.full_name}</h1>
            <p className="text-sm text-muted-foreground">{s.classes?.name || "Sem turma"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge {...mapped} />
          <Link to={`/admin/alunos/${id}/editar`} className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] border border-border text-sm font-bold text-muted-foreground hover:bg-accent transition-colors">
            <i className="ri-pencil-line" /> Editar
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-colors border",
            activeTab === tab.id ? "bg-secondary border-secondary text-secondary-foreground" : "bg-card border-border/60 text-muted-foreground hover:bg-accent"
          )}>
            <i className={tab.icon} /> {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: Dados Pessoais */}
      {activeTab === "pessoal" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
            <h4 className="text-sm font-bold text-primary mb-4">Informações Pessoais</h4>
            <InfoRow label="Nome Completo" value={student.full_name} />
            <InfoRow label="Data de Nascimento" value={student.birth_date || "—"} />
            <InfoRow label="CPF" value={s.cpf || "—"} />
            <InfoRow label="RG" value={s.rg || "—"} />
            <InfoRow label="E-mail" value={s.email || "—"} />
            <InfoRow label="Status" value={mapped.label} />
          </div>
          <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
            <h4 className="text-sm font-bold text-primary mb-4">Dados Escolares</h4>
            <InfoRow label="Turma" value={s.classes?.name || "—"} />
            <InfoRow label="Série" value={s.classes?.grade || "—"} />
            <InfoRow label="Turno" value={s.classes?.shift || "—"} />
            <InfoRow label="Ano Letivo" value={s.academic_year ? String(s.academic_year) : "—"} />
          </div>
        </div>
      )}

      {/* TAB: Responsáveis */}
      {activeTab === "responsaveis" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-primary">Responsáveis Vinculados ({guardiansList.length})</h4>
            <button onClick={() => setAddingGuardian(!addingGuardian)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-secondary text-secondary-foreground text-xs font-bold hover:bg-secondary/90 transition-colors">
              <i className={addingGuardian ? "ri-close-line" : "ri-add-line"} /> {addingGuardian ? "Cancelar" : "Adicionar Responsável"}
            </button>
          </div>

          {addingGuardian && (
            <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow space-y-1">
              <SectionTitle>Identificação</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FieldInput label="Nome Completo *" value={gf.full_name} onChange={gSet("full_name")} placeholder="Nome completo" />
                <FieldInput label="CPF" value={gf.cpf} onChange={gSet("cpf")} placeholder="000.000.000-00" />
                <FieldInput label="RG" value={gf.rg} onChange={gSet("rg")} placeholder="Número do RG" />
                <FieldInput label="Data de Nascimento" value={gf.birth_date} onChange={gSet("birth_date")} type="date" />
                <FieldSelect label="Sexo" value={gf.gender} onChange={gSet("gender")} options={genderOptions} />
                <FieldInput label="Nacionalidade" value={gf.nationality} onChange={gSet("nationality")} placeholder="Brasileiro(a)" />
                <FieldSelect label="Estado Civil" value={gf.marital_status} onChange={gSet("marital_status")} options={maritalOptions} />
              </div>

              <SectionTitle>Relação com o Aluno</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FieldSelect label="Tipo de Relação" value={gf.relationship_type} onChange={gSet("relationship_type")} options={relationshipTypes} />
                <FieldInput label="Grau de Parentesco" value={gf.relationship_description} onChange={gSet("relationship_description")} placeholder="Ex: Avó materna" />
              </div>
              <div className="flex flex-wrap gap-4 mt-2">
                <FieldCheck label="Responsável financeiro" checked={gf.is_financial} onChange={gCheck("is_financial")} />
                <FieldCheck label="Responsável pedagógico" checked={gf.is_pedagogical} onChange={gCheck("is_pedagogical")} />
                <FieldCheck label="Responsável principal" checked={gf.is_primary} onChange={gCheck("is_primary")} />
              </div>

              <SectionTitle>Contato</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FieldInput label="Telefone Principal" value={gf.phone} onChange={gSet("phone")} placeholder="(00) 00000-0000" />
                <FieldInput label="Telefone Secundário" value={gf.phone_secondary} onChange={gSet("phone_secondary")} placeholder="(00) 00000-0000" />
                <FieldInput label="E-mail Principal" value={gf.email} onChange={gSet("email")} placeholder="email@exemplo.com" />
                <FieldInput label="E-mail Secundário" value={gf.email_secondary} onChange={gSet("email_secondary")} placeholder="email2@exemplo.com" />
              </div>
              <div className="mt-2">
                <FieldCheck label="WhatsApp habilitado" checked={gf.whatsapp_enabled} onChange={gCheck("whatsapp_enabled")} />
              </div>

              <SectionTitle>Endereço</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FieldInput label="CEP" value={gf.zipcode} onChange={gSet("zipcode")} placeholder="00000-000" />
                <div className="md:col-span-2">
                  <FieldInput label="Endereço" value={gf.address} onChange={gSet("address")} placeholder="Rua, Avenida..." />
                </div>
                <FieldInput label="Número" value={gf.number} onChange={gSet("number")} placeholder="Nº" />
                <FieldInput label="Complemento" value={gf.complement} onChange={gSet("complement")} placeholder="Apto, Bloco..." />
                <FieldInput label="Bairro" value={gf.district} onChange={gSet("district")} placeholder="Bairro" />
                <FieldInput label="Cidade" value={gf.city} onChange={gSet("city")} placeholder="Cidade" />
                <FieldInput label="Estado" value={gf.state} onChange={gSet("state")} placeholder="UF" />
              </div>

              <SectionTitle>Dados Profissionais</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FieldInput label="Profissão" value={gf.profession} onChange={gSet("profession")} placeholder="Profissão" />
                <FieldInput label="Empresa" value={gf.company} onChange={gSet("company")} placeholder="Empresa" />
                <FieldSelect label="Faixa de Renda" value={gf.income_range} onChange={gSet("income_range")} options={incomeOptions} />
                <FieldInput label="Telefone Comercial" value={gf.work_phone} onChange={gSet("work_phone")} placeholder="(00) 0000-0000" />
              </div>

              <SectionTitle>Permissões</SectionTitle>
              <div className="flex flex-wrap gap-4">
                <FieldCheck label="Pode buscar o aluno" checked={gf.can_pickup} onChange={gCheck("can_pickup")} />
                <FieldCheck label="Pode receber relatórios" checked={gf.can_receive_reports} onChange={gCheck("can_receive_reports")} />
                <FieldCheck label="Pode autorizar uso de imagem" checked={gf.can_authorize_image} onChange={gCheck("can_authorize_image")} />
              </div>

              <SectionTitle>Observações</SectionTitle>
              <div>
                <textarea value={gf.notes} onChange={(e) => setGf((p) => ({ ...p, notes: e.target.value }))} placeholder="Observações adicionais..." rows={3}
                  className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors resize-none" />
              </div>

              <div className="pt-3">
                <button onClick={() => addGuardianMutation.mutate()} disabled={addGuardianMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/90 transition-colors disabled:opacity-50">
                  <i className="ri-save-line" /> {addGuardianMutation.isPending ? "Salvando..." : "Salvar Responsável"}
                </button>
              </div>
            </div>
          )}

          {guardiansList.length === 0 && !addingGuardian ? (
            <div className="text-center py-12 text-muted-foreground">Nenhum responsável vinculado.</div>
          ) : guardiansList.map((g: any) => (
            <div key={g.id} className="bg-card border border-border/60 rounded-xl p-5 certus-shadow flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <i className="ri-user-line text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold text-primary">{g.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {g.relationship_type ? relationshipTypes.find(r => r.value === g.relationship_type)?.label || g.relationship_type : "—"}
                    {" · "}{g.phone || "—"} · {g.email || "—"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {g.phone && (
                  <a href={`https://wa.me/${g.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] bg-green-500/10 text-green-600 text-xs font-bold hover:bg-green-500/20 transition-colors">
                    <i className="ri-whatsapp-line" /> WhatsApp
                  </a>
                )}
                <button onClick={() => unlinkGuardianMutation.mutate(g.id)}
                  className="text-xs font-bold text-destructive hover:underline">Desvincular</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: Notas */}
      {activeTab === "notas" && (
        <div className="space-y-6">
          {/* Analytics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border/60 rounded-xl p-4 certus-shadow">
              <div className="text-xs font-bold text-muted-foreground mb-1">Média Geral</div>
              <div className={cn("text-2xl font-bold", mediaGeral >= 7 ? "text-secondary" : mediaGeral > 0 ? "text-destructive" : "text-muted-foreground")}>
                {gradeValues.length > 0 ? mediaGeral.toFixed(1) : "—"}
              </div>
            </div>
            <div className="bg-card border border-border/60 rounded-xl p-4 certus-shadow">
              <div className="text-xs font-bold text-muted-foreground mb-1">Total de Notas</div>
              <div className="text-2xl font-bold text-primary">{gradeValues.length}</div>
            </div>
            <div className="bg-card border border-border/60 rounded-xl p-4 certus-shadow">
              <div className="text-xs font-bold text-muted-foreground mb-1">Evolução</div>
              <div className={cn("text-lg font-bold flex items-center gap-1", evolucaoColor)}>
                <i className={evolucaoIcon} /> {evolucao}
              </div>
            </div>
          </div>

          {/* Chart */}
          {gradesByTerm.length >= 2 && (
            <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
              <h4 className="text-sm font-bold text-primary mb-4">Evolução por Bimestre</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={gradesByTerm}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="term" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip formatter={(val: number) => [val.toFixed(1), "Média"]} />
                  <Line type="monotone" dataKey="media" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ fill: "hsl(var(--secondary))", r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table */}
          <div className="bg-card border border-border/60 rounded-xl certus-shadow overflow-x-auto">
            {grades.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Nenhuma nota registrada.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Disciplina</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Bimestre</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((g: any, i: number) => (
                    <tr key={i} className="border-b border-border/20 last:border-0">
                      <td className="px-4 py-3 font-medium text-primary">{g.teacher_assignments?.subjects?.name || "—"}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{g.term || "—"}</td>
                      <td className={cn("px-4 py-3 text-center font-bold", (g.grade_value ?? 0) < 7 ? "text-destructive" : "text-secondary")}>{g.grade_value ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB: Documentos - MANTIDO COMO ESTÁ */}
      {activeTab === "documentos" && (
        <div className="space-y-6">
          <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-primary">Documentos do Aluno</h4>
              <button onClick={() => docInputRef.current?.click()} disabled={uploadingDoc} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-secondary text-secondary-foreground text-xs font-bold hover:bg-secondary/90 transition-colors disabled:opacity-50">
                <i className={uploadingDoc ? "ri-loader-4-line animate-spin" : "ri-upload-2-line"} /> {uploadingDoc ? "Enviando..." : "Upload Documento"}
              </button>
              <input ref={docInputRef} type="file" className="hidden" onChange={handleDocUpload} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Nenhum documento enviado.</div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-border/40 hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <i className="ri-file-line text-lg text-secondary" />
                      <div>
                        <div className="text-sm font-medium text-primary">{doc.name || "Documento"}</div>
                        <div className="text-xs text-muted-foreground">
                          {doc.created_at ? new Date(doc.created_at).toLocaleDateString("pt-BR") : "—"}
                          {doc.status && <span className="ml-2 px-2 py-0.5 rounded-full bg-accent text-[10px] font-bold">{doc.status}</span>}
                        </div>
                      </div>
                    </div>
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-secondary hover:underline">
                        <i className="ri-download-line mr-1" />Baixar
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gerar documentos oficiais */}
          <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
            <h4 className="text-sm font-bold text-primary mb-4">Gerar Documentos Oficiais</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {officialDocs.map((d) => (
                <button key={d.id} onClick={() => handleGenerate(d.nome)} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/60 hover:border-secondary/40 hover:bg-accent/30 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center group-hover:bg-secondary/15 transition-colors">
                    <i className={`${d.icon} text-lg text-primary group-hover:text-secondary transition-colors`} />
                  </div>
                  <span className="text-xs font-bold text-primary text-center leading-tight">{d.nome}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Declaração com motivo */}
          <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
            <h4 className="text-sm font-bold text-primary mb-4">Gerar Declaração com Motivo</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Motivo da Declaração</label>
                <select value={declReason} onChange={(e) => setDeclReason(e.target.value)} className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors">
                  <option value="">Selecionar motivo...</option>
                  {declReasons.map((r) => (<option key={r} value={r}>{r}</option>))}
                  <option value="__custom">✏️ Outro motivo (digitar)</option>
                </select>
              </div>
              {declReason === "__custom" && (
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">Motivo personalizado</label>
                  <input value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="Digite o motivo..." className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
                </div>
              )}
            </div>
            <button onClick={handleGenerateDecl} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/90 transition-colors">
              <i className="ri-draft-line" /> Gerar Declaração
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default StudentsDetail;

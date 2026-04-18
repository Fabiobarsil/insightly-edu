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

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between py-2.5 border-b border-border/20 last:border-0">
    <span className="text-xs font-bold text-muted-foreground">{label}</span>
    <span className="text-sm text-primary font-medium">{value}</span>
  </div>
);

const StudentsDetail = () => {
  const { id } = useParams();
  const { schoolId } = useSchoolId();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pessoal");
  const [declReason, setDeclReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [guardianModalOpen, setGuardianModalOpen] = useState(false);
  const [editingGuardianId, setEditingGuardianId] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

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
      const { data: sgData, error: sgError } = await supabase
        .from("student_guardians")
        .select("guardian_id")
        .eq("student_id", id!);
      if (sgError) throw sgError;

      const guardianIds = (sgData || []).map((g) => g.guardian_id);
      if (!guardianIds.length) return [];

      const { data: guardiansData, error: gError } = await supabase
        .from("guardians")
        .select("id, full_name, phone, email, relationship_type, whatsapp_enabled")
        .in("id", guardianIds);
      if (gError) throw gError;

      return guardiansData || [];
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

  const { data: historico = [], isLoading: loadingHistorico } = useQuery({
    queryKey: ["student-historico", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_historico_escolar")
        .select("disciplina, term, grade_value")
        .eq("student_id", id!);
      if (error) throw error;

      // Agrupar por disciplina
      const map = new Map<string, { disciplina: string; b1: number | null; b2: number | null; b3: number | null; b4: number | null; notas: number[] }>();
      (data || []).forEach((row: any) => {
        const key = row.disciplina || "—";
        if (!map.has(key)) {
          map.set(key, { disciplina: key, b1: null, b2: null, b3: null, b4: null, notas: [] });
        }
        const entry = map.get(key)!;
        const val = row.grade_value != null ? Number(row.grade_value) : null;
        if (val != null) entry.notas.push(val);
        if (row.term === "1º Bimestre") entry.b1 = val;
        else if (row.term === "2º Bimestre") entry.b2 = val;
        else if (row.term === "3º Bimestre") entry.b3 = val;
        else if (row.term === "4º Bimestre") entry.b4 = val;
      });

      return Array.from(map.values())
        .map((r) => ({
          disciplina: r.disciplina,
          b1: r.b1,
          b2: r.b2,
          b3: r.b3,
          b4: r.b4,
          media_final: r.notas.length > 0 ? r.notas.reduce((a, b) => a + b, 0) / r.notas.length : null,
        }))
        .sort((a, b) => a.disciplina.localeCompare(b.disciplina));
    },
    enabled: !!id && activeTab === "notas",
  });

  const handleGerarHistorico = () => {
    if (!historico.length) {
      toast.error("Sem dados de histórico");
      return;
    }
    const win = window.open("", "_blank");
    if (!win) return;
    const rows = historico
      .map(
        (r: any) => `
        <tr>
          <td>${r.disciplina}</td>
          <td style="text-align:center">${r.b1 != null ? Number(r.b1).toFixed(1) : "—"}</td>
          <td style="text-align:center">${r.b2 != null ? Number(r.b2).toFixed(1) : "—"}</td>
          <td style="text-align:center">${r.b3 != null ? Number(r.b3).toFixed(1) : "—"}</td>
          <td style="text-align:center">${r.b4 != null ? Number(r.b4).toFixed(1) : "—"}</td>
          <td style="text-align:center;font-weight:bold">${r.media_final != null ? Number(r.media_final).toFixed(1) : "—"}</td>
        </tr>`
      )
      .join("");
    win.document.write(`
      <html><head><title>Histórico Escolar - ${student?.full_name || ""}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:32px;color:#111}
        h1{font-size:20px;margin-bottom:4px}
        h2{font-size:14px;color:#666;margin-top:0;font-weight:normal}
        table{width:100%;border-collapse:collapse;margin-top:24px;font-size:13px}
        th,td{border:1px solid #ddd;padding:8px 12px}
        th{background:#f5f5f5;text-align:left}
      </style></head>
      <body>
        <h1>Histórico Escolar</h1>
        <h2>${student?.full_name || ""}</h2>
        <table>
          <thead>
            <tr>
              <th>Disciplina</th><th>1º Bim</th><th>2º Bim</th><th>3º Bim</th><th>4º Bim</th><th>Média</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>
    `);
    win.document.close();
  };

  const { data: documents = [] } = useQuery({
    queryKey: ["student-documents", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("student_id", id!)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("❌ ERRO AO BUSCAR DOCUMENTOS:", error);
        throw error;
      }
      return data || [];
    },
    enabled: !!id && activeTab === "documentos",
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
      console.log("🔥 UPLOAD INICIOU");

      if (!schoolId) throw new Error("Sem escola vinculada");

      setUploadingDoc(true);

      const cleanFileName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove acentos
        .replace(/\s+/g, "_") // espaço vira _
        .replace(/[^a-zA-Z0-9._-]/g, ""); // remove caracteres estranhos
      const filePath = `${schoolId}/${id}/${Date.now()}_${cleanFileName}`;
      console.log("📁 PATH:", filePath);

      const { error: upErr } = await supabase.storage.from("student-assets").upload(filePath, file);

      console.log("📦 PASSOU UPLOAD");

      if (upErr) {
        console.error("❌ ERRO UPLOAD:", upErr);
        throw upErr;
      }

      const { data: urlData } = supabase.storage.from("student-assets").getPublicUrl(filePath);

      console.log("🔗 URL:", urlData?.publicUrl);

      const { error: docErr } = await supabase.from("documents").insert({
        school_id: schoolId,
        student_id: id!,
        name: cleanFileName,
        file_url: urlData.publicUrl,
        file_path: filePath,
        status: "recebido",
      });

      console.log("💾 TENTOU INSERT");

      if (docErr) {
        console.error("❌ ERRO INSERT:", docErr);
        throw docErr;
      }

      console.log("✅ INSERT OK");
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-documents", id] });
      setUploadingDoc(false);
      toast.success("Documento enviado!");
    },

    onError: (err: any) => {
      setUploadingDoc(false);
      console.error("❌ ERRO FINAL:", err);
      toast.error(err.message || "Erro ao enviar documento");
    },
  });

  // 🔐 gerar URL assinada (evita bloqueio do navegador)
  const getSignedUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("student-assets")
      .createSignedUrl(filePath, 60);
    if (error) {
      console.error("Erro ao gerar signed URL:", error);
      return null;
    }
    return data?.signedUrl;
  };

  // 👁 preview do documento
  const handlePreview = async (doc: any) => {
    const url = await getSignedUrl(doc.file_path);
    if (!url) return;
    setPreviewDoc({ ...doc, file_url: url });
  };

  // ⬇ download do documento
  const handleDownload = async (doc: any) => {
    const url = await getSignedUrl(doc.file_path);
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    if (!reason) {
      toast.error("Selecione ou digite o motivo da declaração");
      return;
    }
    toast.success(`Declaração gerada: "${reason}"`);
  };

  // Notas analytics
  const gradeValues = grades.map((g: any) => g.grade_value).filter((v: any) => v != null) as number[];
  const mediaGeral = gradeValues.length > 0 ? gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length : 0;

  const termOrder = ["1º Bimestre", "2º Bimestre", "3º Bimestre", "4º Bimestre"];
  const gradesByTerm = termOrder
    .map((term) => {
      const termGrades = grades
        .filter((g: any) => g.term === term)
        .map((g: any) => g.grade_value)
        .filter((v: any) => v != null) as number[];
      const avg = termGrades.length > 0 ? termGrades.reduce((a, b) => a + b, 0) / termGrades.length : null;
      return { term: term.replace(" Bimestre", ""), media: avg };
    })
    .filter((t) => t.media !== null);

  let evolucao = "Sem dados";
  let evolucaoColor = "text-muted-foreground";
  let evolucaoIcon = "ri-subtract-line";
  if (gradesByTerm.length >= 2) {
    const last = gradesByTerm[gradesByTerm.length - 1].media!;
    const prev = gradesByTerm[gradesByTerm.length - 2].media!;
    if (last > prev) {
      evolucao = "Evoluindo";
      evolucaoColor = "text-secondary";
      evolucaoIcon = "ri-arrow-up-line";
    } else if (last < prev) {
      evolucao = "Atenção";
      evolucaoColor = "text-destructive";
      evolucaoIcon = "ri-arrow-down-line";
    } else {
      evolucao = "Estável";
      evolucaoColor = "text-muted-foreground";
      evolucaoIcon = "ri-subtract-line";
    }
  }

  if (isLoading || !student)
    return (
      <AppLayout title="Aluno" breadcrumbs={[{ label: "Alunos", href: "/admin/alunos" }, { label: "Detalhes" }]}>
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      </AppLayout>
    );

  const mapped = statusMap[student.status || "ativo"] || statusMap.ativo;
  const s = student as any;

  return (
    <AppLayout
      title={student.full_name}
      breadcrumbs={[{ label: "Alunos", href: "/admin/alunos" }, { label: student.full_name }]}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 max-[640px]:flex-col max-[640px]:gap-4 max-[640px]:items-start">
        <div className="flex items-center gap-4">
          {student.photo_url ? (
            <img
              src={student.photo_url}
              alt={student.full_name}
              className="w-14 h-14 rounded-full object-cover border-2 border-secondary/30"
            />
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
          <Link
            to={`/admin/alunos/${id}/prontuario`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/90 transition-colors"
          >
            <i className="ri-file-chart-line" /> Prontuário
          </Link>
          <Link
            to={`/admin/alunos/${id}/editar`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] border border-border text-sm font-bold text-muted-foreground hover:bg-accent transition-colors"
          >
            <i className="ri-pencil-line" /> Editar
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-colors border",
              activeTab === tab.id
                ? "bg-secondary border-secondary text-secondary-foreground"
                : "bg-card border-border/60 text-muted-foreground hover:bg-accent",
            )}
          >
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
            <InfoRow label="Telefone" value={s.phone || "—"} />
            <InfoRow label="Tipo Sanguíneo" value={s.blood_type || "—"} />
            <InfoRow label="Status" value={mapped.label} />
          </div>
          <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
            <h4 className="text-sm font-bold text-primary mb-4">Dados Escolares</h4>
            <InfoRow label="Matrícula" value={s.enrollment_number || "—"} />
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
            <button
              onClick={() => {
                setEditingGuardianId(null);
                setGuardianModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-secondary text-secondary-foreground text-xs font-bold hover:bg-secondary/90 transition-colors"
            >
              <i className="ri-add-line" /> Adicionar Responsável
            </button>
          </div>

          {guardiansList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nenhum responsável vinculado.</div>
          ) : (
            guardiansList.map((g: any) => (
              <div
                key={g.id}
                className="bg-card border border-border/60 rounded-xl p-5 certus-shadow flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <i className="ri-user-line text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-primary">{g.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {g.relationship_type
                        ? relationshipTypes.find((r) => r.value === g.relationship_type)?.label || g.relationship_type
                        : "—"}
                      {" · "}
                      {g.phone || "—"} · {g.email || "—"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {g.phone && (
                    <a
                      href={`https://wa.me/${g.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] bg-secondary/10 text-secondary text-xs font-bold hover:bg-secondary/20 transition-colors"
                    >
                      <i className="ri-whatsapp-line" /> WhatsApp
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setEditingGuardianId(g.id);
                      setGuardianModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] bg-accent text-primary text-xs font-bold hover:bg-accent/80 transition-colors"
                  >
                    <i className="ri-edit-line" /> Editar
                  </button>
                  <button
                    onClick={() => unlinkGuardianMutation.mutate(g.id)}
                    className="text-xs font-bold text-destructive hover:underline"
                  >
                    Desvincular
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: Notas */}
      {activeTab === "notas" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border/60 rounded-xl p-4 certus-shadow">
              <div className="text-xs font-bold text-muted-foreground mb-1">Média Geral</div>
              <div
                className={cn(
                  "text-2xl font-bold",
                  mediaGeral >= 7 ? "text-secondary" : mediaGeral > 0 ? "text-destructive" : "text-muted-foreground",
                )}
              >
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

          {gradesByTerm.length >= 2 && (
            <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
              <h4 className="text-sm font-bold text-primary mb-4">Evolução por Bimestre</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={gradesByTerm}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="term" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip formatter={(val: number) => [val.toFixed(1), "Média"]} />
                  <Line
                    type="monotone"
                    dataKey="media"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--secondary))", r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-card border border-border/60 rounded-xl certus-shadow overflow-x-auto">
            {grades.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Nenhuma nota registrada.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">
                      Disciplina
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase">
                      Bimestre
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((g: any, i: number) => (
                    <tr key={i} className="border-b border-border/20 last:border-0">
                      <td className="px-4 py-3 font-medium text-primary">
                        {g.teacher_assignments?.subjects?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{g.term || "—"}</td>
                      <td
                        className={cn(
                          "px-4 py-3 text-center font-bold",
                          (g.grade_value ?? 0) < 7 ? "text-destructive" : "text-secondary",
                        )}
                      >
                        {g.grade_value ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Histórico Escolar */}
          <div className="bg-card border border-border/60 rounded-xl certus-shadow">
            <div className="flex items-center justify-between p-5 border-b border-border/40">
              <h4 className="text-sm font-bold text-primary">Histórico Escolar</h4>
              <button
                onClick={handleGerarHistorico}
                disabled={!historico.length}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-secondary text-secondary-foreground text-xs font-bold hover:bg-secondary/90 transition-colors disabled:opacity-50"
              >
                <i className="ri-printer-line" /> Gerar Histórico
              </button>
            </div>
            <div className="overflow-x-auto">
              {loadingHistorico ? (
                <div className="p-5 space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-8 bg-muted/50 animate-pulse rounded" />
                  ))}
                </div>
              ) : historico.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Nenhum dado acadêmico disponível
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border/40">
                      <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Disciplina</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase">1º Bim</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase">2º Bim</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase">3º Bim</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase">4º Bim</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Média</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((r: any, i: number) => (
                      <tr key={i} className="border-b border-border/20 last:border-0 hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-primary">{r.disciplina}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{r.b1 != null ? Number(r.b1).toFixed(1) : "—"}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{r.b2 != null ? Number(r.b2).toFixed(1) : "—"}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{r.b3 != null ? Number(r.b3).toFixed(1) : "—"}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{r.b4 != null ? Number(r.b4).toFixed(1) : "—"}</td>
                        <td className={cn(
                          "px-4 py-3 text-center font-bold",
                          r.media_final == null ? "text-muted-foreground" : r.media_final >= 7 ? "text-secondary" : "text-destructive"
                        )}>
                          {r.media_final != null ? Number(r.media_final).toFixed(1) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Documentos */}
      {activeTab === "documentos" && (
        <div className="space-y-6">
          <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-primary">Documentos do Aluno</h4>
              <button
                onClick={() => docInputRef.current?.click()}
                disabled={uploadingDoc}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-secondary text-secondary-foreground text-xs font-bold hover:bg-secondary/90 transition-colors disabled:opacity-50"
              >
                <i className={uploadingDoc ? "ri-loader-4-line animate-spin" : "ri-upload-2-line"} />{" "}
                {uploadingDoc ? "Enviando..." : "Upload Documento"}
              </button>
              <input
                ref={docInputRef}
                type="file"
                className="hidden"
                onChange={handleDocUpload}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Nenhum documento enviado.</div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border border-border/40 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <i className="ri-file-line text-lg text-secondary" />
                      <div>
                        <div className="text-sm font-medium text-primary">{doc.name || "Documento"}</div>
                        <div className="text-xs text-muted-foreground">
                          {doc.created_at ? new Date(doc.created_at).toLocaleDateString("pt-BR") : "—"}
                          {doc.status && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-accent text-[10px] font-bold">
                              {doc.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {doc.file_url && (
                     <div className="flex gap-2">
  <button
    onClick={() => handlePreview(doc)}
    className="text-xs font-bold text-blue-600 hover:underline"
  >
    Ver
  </button>

  <button
    onClick={() => handleDownload(doc)}
    className="text-xs font-bold text-secondary hover:underline"
  >
    <i className="ri-download-line mr-1" />
    Baixar
  </button>
</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
            <h4 className="text-sm font-bold text-primary mb-4">Gerar Documentos Oficiais</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {officialDocs.map((d) => (
                <button
                  key={d.id}
                  onClick={() => handleGenerate(d.nome)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/60 hover:border-secondary/40 hover:bg-accent/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center group-hover:bg-secondary/15 transition-colors">
                    <i className={`${d.icon} text-lg text-primary group-hover:text-secondary transition-colors`} />
                  </div>
                  <span className="text-xs font-bold text-primary text-center leading-tight">{d.nome}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
            <h4 className="text-sm font-bold text-primary mb-4">Gerar Declaração com Motivo</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Motivo da Declaração</label>
                <select
                  value={declReason}
                  onChange={(e) => setDeclReason(e.target.value)}
                  className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors"
                >
                  <option value="">Selecionar motivo...</option>
                  {declReasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                  <option value="__custom">✏️ Outro motivo (digitar)</option>
                </select>
              </div>
              {declReason === "__custom" && (
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">Motivo personalizado</label>
                  <input
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Digite o motivo..."
                    className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors"
                  />
                </div>
              )}
            </div>
            <button
              onClick={handleGenerateDecl}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/90 transition-colors"
            >
              <i className="ri-draft-line" /> Gerar Declaração
            </button>
          </div>
        </div>
      )}

      <GuardianFormModal
        open={guardianModalOpen}
        onOpenChange={(o) => {
          setGuardianModalOpen(o);
          if (!o) setEditingGuardianId(null);
        }}
        schoolId={schoolId}
        studentId={id}
        guardianId={editingGuardianId}
      />
      
   {previewDoc && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-white w-[90vw] h-[85vh] rounded-lg p-4 relative">

      <button
        onClick={() => setPreviewDoc(null)}
        className="absolute top-2 right-2"
      >
        Fechar
      </button>

      {previewDoc.mime_type?.includes("image") ? (
        <img src={previewDoc.file_url} className="max-h-full mx-auto" />
      ) : previewDoc.mime_type === "application/pdf" ? (
        <iframe src={previewDoc.file_url} className="w-full h-full" />
      ) : (
        <p className="text-center mt-10">
          Visualização não disponível
        </p>
      )}

    </div>
  </div>
)}

</AppLayout>
);
};

export default StudentsDetail;

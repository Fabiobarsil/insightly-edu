import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CertificadoModal from "@/components/documents/CertificadoModal";
import DocumentModal from "@/components/documents/DocumentModal";
import { DocumentLayout } from "@/lib/documentLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Eye, FileDown, Pencil } from "lucide-react";
import html2pdf from "html2pdf.js";

type Tab = "oficiais" | "declaracoes" | "documentos";

interface ChecklistItem { nome: string; obrigatorio: boolean }

const defaultChecklist: ChecklistItem[] = [
  { nome: "Certidão de Nascimento", obrigatorio: true },
  { nome: "Comprovante de Residência", obrigatorio: true },
  { nome: "Carteira de Vacinação", obrigatorio: true },
  { nome: "Foto 3x4", obrigatorio: false },
  { nome: "Histórico Escolar Anterior", obrigatorio: true },
  { nome: "Laudo Médico (PcD)", obrigatorio: false },
];

const officialDocs = [
  { id: "matricula", nome: "Declaração de Matrícula", icon: "ri-file-text-line", desc: "Comprova que o aluno está matriculado" },
  { id: "historico", nome: "Histórico Escolar", icon: "ri-file-list-3-line", desc: "Registro completo de notas e frequência" },
  { id: "boletim", nome: "Boletim Escolar", icon: "ri-bar-chart-box-line", desc: "Notas do aluno no período atual" },
  { id: "transferencia", nome: "Declaração de Transferência", icon: "ri-swap-line", desc: "Documento para transferência escolar" },
  { id: "frequencia", nome: "Declaração de Frequência", icon: "ri-calendar-check-line", desc: "Comprova frequência do aluno" },
  { id: "vaga", nome: "Atestado de Vaga", icon: "ri-checkbox-circle-line", desc: "Comprova existência de vaga" },
  { id: "certificado", nome: "Certificado de Conclusão", icon: "ri-award-line", desc: "Certificado oficial de conclusão de curso" },
];

const defaultReasons = [
  "Para fins de comprovação de matrícula",
  "Para fins de transferência escolar",
  "Para fins trabalhistas",
  "Para fins judiciais",
  "Para benefício social (Bolsa Família, etc.)",
  "Para plano de saúde",
  "Para transporte escolar",
  "Para atividades extracurriculares",
];

const DECL_TEMPLATE = `Declaramos, para os devidos fins, que o(a) aluno(a) {{nome}}, encontra-se devidamente matriculado(a) nesta instituição de ensino, no ano letivo de {{ano}}, cursando a turma {{turma}}.\n\nMotivo: {{motivo}}.\n\nA presente declaração é expedida a pedido do interessado para os fins acima citados.`;

const Documents = () => {
  const [tab, setTab] = useState<Tab>("oficiais");
  const { schoolId } = useSchoolId();

  // Checklist editável (persistido por escola em localStorage)
  const checklistKey = schoolId ? `docChecklist:${schoolId}` : "docChecklist:default";
  const [docChecklist, setDocChecklist] = useState<ChecklistItem[]>(defaultChecklist);
  const [newDocName, setNewDocName] = useState("");
  const [newDocRequired, setNewDocRequired] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(checklistKey);
      if (raw) setDocChecklist(JSON.parse(raw));
      else setDocChecklist(defaultChecklist);
    } catch {
      setDocChecklist(defaultChecklist);
    }
  }, [checklistKey]);

  const persistChecklist = (next: ChecklistItem[]) => {
    setDocChecklist(next);
    try { localStorage.setItem(checklistKey, JSON.stringify(next)); } catch {}
  };

  const handleAddChecklistItem = () => {
    const nome = newDocName.trim();
    if (!nome) return;
    if (docChecklist.some((d) => d.nome.toLowerCase() === nome.toLowerCase())) {
      toast.error("Documento já existe no checklist");
      return;
    }
    persistChecklist([...docChecklist, { nome, obrigatorio: newDocRequired }]);
    setNewDocName("");
    setNewDocRequired(true);
    toast.success("Documento adicionado ao checklist!");
  };

  const handleRemoveChecklistItem = (nome: string) => {
    persistChecklist(docChecklist.filter((d) => d.nome !== nome));
    toast.success("Documento removido");
  };

  const handleToggleRequired = (nome: string) => {
    persistChecklist(docChecklist.map((d) => d.nome === nome ? { ...d, obrigatorio: !d.obrigatorio } : d));
  };

  const [certModalOpen, setCertModalOpen] = useState(false);
  const [genericModalOpen, setGenericModalOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState<{ id: string; nome: string } | null>(null);

  // Declarations state
  const [declReason, setDeclReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [declStudent, setDeclStudent] = useState("");
  const [savedReasons, setSavedReasons] = useState<string[]>(defaultReasons);
  const [newReason, setNewReason] = useState("");

  // Preview & edit state
  const [conteudoDeclaracao, setConteudoDeclaracao] = useState("");
  const [showDeclPreview, setShowDeclPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data: students = [] } = useQuery({
    queryKey: ["students-docs", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("students")
        .select("id, full_name, class_id, classes(name)")
        .eq("school_id", schoolId)
        .eq("status", "ativo")
        .order("full_name");
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: school } = useQuery({
    queryKey: ["school-decl", schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data } = await supabase.from("schools").select("*").eq("id", schoolId).single();
      return data;
    },
    enabled: !!schoolId,
  });

  const selectedStudent = useMemo(() => students.find((s: any) => s.id === declStudent) as any, [students, declStudent]);
  const resolvedReason = declReason === "__custom" ? customReason : declReason;

  const handleCardClick = (doc: typeof officialDocs[0]) => {
    if (doc.id === "certificado") {
      setCertModalOpen(true);
    } else {
      setActiveDoc(doc);
      setGenericModalOpen(true);
    }
  };

  const handlePreviewDeclaration = () => {
    if (!declStudent) { toast.error("Selecione um aluno"); return; }
    if (!resolvedReason) { toast.error("Selecione ou digite o motivo da declaração"); return; }

    const nome = selectedStudent?.full_name || "";
    const turma = selectedStudent?.classes?.name || "—";
    const ano = String(new Date().getFullYear());

    const text = DECL_TEMPLATE
      .replace("{{nome}}", nome)
      .replace("{{turma}}", turma)
      .replace("{{ano}}", ano)
      .replace("{{motivo}}", resolvedReason);

    setConteudoDeclaracao(text);
    setShowDeclPreview(true);
    setIsEditing(false);
  };

  const handleGenerateDeclPDF = () => {
    const element = document.getElementById("decl-preview-content");
    if (!element) return;
    html2pdf().from(element).set({
      margin: 0,
      filename: `declaracao-${selectedStudent?.full_name?.replace(/\s+/g, "-").toLowerCase() || "aluno"}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { orientation: "portrait", format: "a4" },
    }).save();
    toast.success("PDF gerado com sucesso!");
  };

  const handleAddReason = () => {
    const trimmed = newReason.trim();
    if (!trimmed) return;
    if (savedReasons.includes(trimmed)) { toast.error("Motivo já existe"); return; }
    setSavedReasons((prev) => [...prev, trimmed]);
    setNewReason("");
    toast.success("Motivo adicionado!");
  };

  const handleRemoveReason = (reason: string) => {
    setSavedReasons((prev) => prev.filter((r) => r !== reason));
    if (declReason === reason) setDeclReason("");
  };

  // Reset preview when student/reason changes
  const handleStudentChange = (v: string) => { setDeclStudent(v); setShowDeclPreview(false); };
  const handleReasonChange = (v: string) => { setDeclReason(v); setShowDeclPreview(false); };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "oficiais", label: "Docs Oficiais", icon: "ri-file-text-line" },
    { id: "declaracoes", label: "Declarações", icon: "ri-draft-line" },
    { id: "documentos", label: "Checklist de Docs", icon: "ri-file-list-3-line" },
  ];

  return (
    <AppLayout title="Documentos" breadcrumbs={[{ label: "Documentos" }]}>
      <PageHeader title="Gestão de Documentos" description="Checklist de matrícula, geração de documentos oficiais e declarações" />

      <div className="flex gap-2 flex-wrap mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-colors border",
              tab === t.id
                ? "bg-secondary border-secondary text-secondary-foreground"
                : "bg-card border-border/60 text-muted hover:bg-accent"
            )}
          >
            <i className={t.icon} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Checklist */}
      {tab === "documentos" && (
        <div className="bg-card border border-border/60 rounded-xl certus-shadow">
          <div className="px-5 py-3 border-b border-border/40">
            <h4 className="text-sm font-bold text-primary">Documentos necessários para matrícula</h4>
          </div>
          {docChecklist.map((d, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-border/20 last:border-0 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-3">
                <i className="ri-file-text-line text-lg text-muted-foreground" />
                <span className="text-sm font-bold text-primary">{d.nome}</span>
              </div>
              <StatusBadge status={d.obrigatorio ? "warning" : "info"} label={d.obrigatorio ? "Obrigatório" : "Opcional"} />
            </div>
          ))}
        </div>
      )}

      {/* Tab: Docs Oficiais */}
      {tab === "oficiais" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {officialDocs.map((d) => (
            <button
              key={d.id}
              onClick={() => handleCardClick(d)}
              className="bg-card border border-border/60 rounded-xl p-5 certus-shadow text-left hover:border-secondary/40 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-3 group-hover:bg-secondary/15 transition-colors">
                <i className={`${d.icon} text-lg text-primary group-hover:text-secondary transition-colors`} />
              </div>
              <div className="text-sm font-bold text-primary">{d.nome}</div>
              <div className="text-xs text-muted-foreground mt-1">{d.desc}</div>
            </button>
          ))}
        </div>
      )}

      {/* Tab: Declarações com preview/edição */}
      {tab === "declaracoes" && (
        <div className="space-y-6">
          <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
            <h4 className="text-sm font-bold text-primary mb-4">Gerar Declaração</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Aluno</label>
                <select
                  value={declStudent}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors"
                >
                  <option value="">Selecionar aluno...</option>
                  {students.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} {s.classes?.name ? `(${s.classes.name})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Motivo da Declaração</label>
                <select
                  value={declReason}
                  onChange={(e) => handleReasonChange(e.target.value)}
                  className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors"
                >
                  <option value="">Selecionar motivo...</option>
                  {savedReasons.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                  <option value="__custom">✏️ Outro motivo (digitar)</option>
                </select>
              </div>
            </div>

            {declReason === "__custom" && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Motivo personalizado</label>
                <input
                  value={customReason}
                  onChange={(e) => { setCustomReason(e.target.value); setShowDeclPreview(false); }}
                  placeholder="Digite o motivo da declaração..."
                  className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePreviewDeclaration} disabled={!declStudent || !resolvedReason}>
                <Eye className="mr-2 h-4 w-4" /> Visualizar
              </Button>
            </div>
          </div>

          {/* Preview & Edit */}
          {showDeclPreview && selectedStudent && (
            <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-primary">Pré-visualização da Declaração</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    {isEditing ? "Voltar ao Preview" : "Editar Texto"}
                  </Button>
                  <Button size="sm" onClick={handleGenerateDeclPDF}>
                    <FileDown className="mr-2 h-4 w-4" /> Gerar PDF
                  </Button>
                </div>
              </div>

              {isEditing ? (
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                    Edite o conteúdo da declaração antes de gerar o PDF
                  </label>
                  <Textarea
                    value={conteudoDeclaracao}
                    onChange={(e) => setConteudoDeclaracao(e.target.value)}
                    rows={8}
                    className="font-serif text-sm leading-relaxed"
                  />
                </div>
              ) : (
                <div className="flex justify-center overflow-auto">
                  <DocumentLayout
                    id="decl-preview-content"
                    type="declaracao"
                    title="Declaração"
                    content={conteudoDeclaracao}
                    student={selectedStudent}
                    school={school}
                    orientation="portrait"
                  />
                </div>
              )}
            </div>
          )}

          {/* Gerenciar motivos */}
          <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
            <h4 className="text-sm font-bold text-primary mb-4">Motivos Cadastrados</h4>
            <div className="flex gap-2 mb-4">
              <input
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Adicionar novo motivo..."
                className="flex-1 border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleAddReason()}
              />
              <button
                onClick={handleAddReason}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/90 transition-colors"
              >
                <i className="ri-add-line" /> Adicionar
              </button>
            </div>
            <div className="space-y-1">
              {savedReasons.map((r) => (
                <div key={r} className="flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-accent/30 transition-colors">
                  <span className="text-sm text-primary">{r}</span>
                  <button
                    onClick={() => handleRemoveReason(r)}
                    className="text-xs text-destructive hover:underline font-bold"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <CertificadoModal open={certModalOpen} onOpenChange={setCertModalOpen} />
      {activeDoc && (
        <DocumentModal
          open={genericModalOpen}
          onOpenChange={(v) => { setGenericModalOpen(v); if (!v) setActiveDoc(null); }}
          title={activeDoc.nome}
          docId={activeDoc.id}
        />
      )}
    </AppLayout>
  );
};

export default Documents;

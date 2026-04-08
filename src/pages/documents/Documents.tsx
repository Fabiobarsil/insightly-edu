import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Tab = "documentos" | "oficiais" | "declaracoes";

const docChecklist = [
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

const Documents = () => {
  const [tab, setTab] = useState<Tab>("documentos");
  const { schoolId } = useSchoolId();

  // For official doc generation
  const [selectedDoc, setSelectedDoc] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  // For declarations
  const [declReason, setDeclReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [declStudent, setDeclStudent] = useState("");
  const [savedReasons, setSavedReasons] = useState<string[]>(defaultReasons);
  const [newReason, setNewReason] = useState("");

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

  const handleGenerateOfficial = () => {
    if (!selectedStudent || !selectedDoc) {
      toast.error("Selecione o aluno e o tipo de documento");
      return;
    }
    const doc = officialDocs.find((d) => d.id === selectedDoc);
    const student = students.find((s: any) => s.id === selectedStudent);
    toast.success(`${doc?.nome} gerado para ${(student as any)?.full_name}!`);
  };

  const handleGenerateDeclaration = () => {
    if (!declStudent) {
      toast.error("Selecione um aluno");
      return;
    }
    const reason = declReason === "__custom" ? customReason : declReason;
    if (!reason) {
      toast.error("Selecione ou digite o motivo da declaração");
      return;
    }
    const student = students.find((s: any) => s.id === declStudent);
    toast.success(`Declaração gerada para ${(student as any)?.full_name}!`);
  };

  const handleAddReason = () => {
    const trimmed = newReason.trim();
    if (!trimmed) return;
    if (savedReasons.includes(trimmed)) {
      toast.error("Motivo já existe");
      return;
    }
    setSavedReasons((prev) => [...prev, trimmed]);
    setNewReason("");
    toast.success("Motivo adicionado!");
  };

  const handleRemoveReason = (reason: string) => {
    setSavedReasons((prev) => prev.filter((r) => r !== reason));
    if (declReason === reason) setDeclReason("");
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "documentos", label: "Checklist de Docs", icon: "ri-file-list-3-line" },
    { id: "oficiais", label: "Docs Oficiais", icon: "ri-file-text-line" },
    { id: "declaracoes", label: "Declarações", icon: "ri-draft-line" },
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

      {/* Tab: Checklist de documentos de matrícula */}
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
              <StatusBadge
                status={d.obrigatorio ? "warning" : "info"}
                label={d.obrigatorio ? "Obrigatório" : "Opcional"}
              />
            </div>
          ))}
        </div>
      )}

      {/* Tab: Documentos oficiais */}
      {tab === "oficiais" && (
        <div className="space-y-6">
          <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
            <h4 className="text-sm font-bold text-primary mb-4">Gerar Documento Oficial</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Aluno</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
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
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Tipo de Documento</label>
                <select
                  value={selectedDoc}
                  onChange={(e) => setSelectedDoc(e.target.value)}
                  className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors"
                >
                  <option value="">Selecionar tipo...</option>
                  {officialDocs.map((d) => (
                    <option key={d.id} value={d.id}>{d.nome}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleGenerateOfficial}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/90 transition-colors"
            >
              <i className="ri-file-download-line" /> Gerar Documento
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {officialDocs.map((d) => (
              <div key={d.id} className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-3">
                  <i className={`${d.icon} text-lg text-primary`} />
                </div>
                <div className="text-sm font-bold text-primary">{d.nome}</div>
                <div className="text-xs text-muted-foreground mt-1">{d.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Declarações com motivos */}
      {tab === "declaracoes" && (
        <div className="space-y-6">
          <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
            <h4 className="text-sm font-bold text-primary mb-4">Gerar Declaração</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Aluno</label>
                <select
                  value={declStudent}
                  onChange={(e) => setDeclStudent(e.target.value)}
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
                  onChange={(e) => setDeclReason(e.target.value)}
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
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Digite o motivo da declaração..."
                  className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors"
                />
              </div>
            )}

            <button
              onClick={handleGenerateDeclaration}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/90 transition-colors"
            >
              <i className="ri-file-download-line" /> Gerar Declaração
            </button>
          </div>

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
    </AppLayout>
  );
};

export default Documents;

import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import StatusBadge from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between py-2.5 border-b border-border/20 last:border-0">
    <span className="text-xs font-bold text-muted-foreground">{label}</span>
    <span className="text-sm text-primary font-medium">{value}</span>
  </div>
);

const StudentsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pessoal");
  const [declReason, setDeclReason] = useState("");
  const [customReason, setCustomReason] = useState("");

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
        .select("guardian_id, guardians(id, full_name, phone, email)")
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

  if (isLoading || !student) return (
    <AppLayout title="Aluno" breadcrumbs={[{ label: "Alunos", href: "/admin/alunos" }, { label: "Detalhes" }]}>
      <div className="text-center py-12 text-muted-foreground">Carregando...</div>
    </AppLayout>
  );

  const mapped = statusMap[student.status || "ativo"] || statusMap.ativo;

  return (
    <AppLayout title={student.full_name} breadcrumbs={[{ label: "Alunos", href: "/admin/alunos" }, { label: student.full_name }]}>
      <div className="flex items-center justify-between mb-6 max-[640px]:flex-col max-[640px]:gap-4 max-[640px]:items-start">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center">
            <i className="ri-user-line text-2xl text-secondary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">{student.full_name}</h1>
            <p className="text-sm text-muted-foreground">{(student as any).classes?.name || "Sem turma"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge {...mapped} />
          <Link to={`/admin/alunos/${id}/editar`} className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] border border-border text-sm font-bold text-muted-foreground hover:bg-accent transition-colors">
            <i className="ri-pencil-line" /> Editar
          </Link>
        </div>
      </div>

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

      {activeTab === "pessoal" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
            <h4 className="text-sm font-bold text-primary mb-4">Informações Pessoais</h4>
            <InfoRow label="Nome Completo" value={student.full_name} />
            <InfoRow label="Data de Nascimento" value={student.birth_date || "—"} />
            <InfoRow label="Status" value={mapped.label} />
          </div>
          <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
            <h4 className="text-sm font-bold text-primary mb-4">Dados Escolares</h4>
            <InfoRow label="Turma" value={(student as any).classes?.name || "—"} />
            <InfoRow label="Série" value={(student as any).classes?.grade || "—"} />
            <InfoRow label="Turno" value={(student as any).classes?.shift || "—"} />
          </div>
        </div>
      )}

      {activeTab === "responsaveis" && (
        <div className="space-y-4">
          {guardiansList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nenhum responsável vinculado.</div>
          ) : guardiansList.map((g: any) => (
            <div key={g.id} className="bg-card border border-border/60 rounded-xl p-5 certus-shadow flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <i className="ri-user-line text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold text-primary">{g.full_name}</div>
                  <div className="text-xs text-muted-foreground">{g.phone || "—"} · {g.email || "—"}</div>
                </div>
              </div>
              <Link to={`/admin/responsaveis/${g.id}`} className="text-xs font-bold text-secondary hover:underline">Ver perfil</Link>
            </div>
          ))}
        </div>
      )}

      {activeTab === "notas" && (
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
                    <td className="px-4 py-3 font-medium text-primary">{(g as any).teacher_assignments?.subjects?.name || "—"}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{g.term || "—"}</td>
                    <td className={cn("px-4 py-3 text-center font-bold", (g.grade_value ?? 0) < 7 ? "text-destructive" : "text-secondary")}>{g.grade_value ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "documentos" && (
        <div className="space-y-6">
          {/* Generate official documents */}
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

          {/* Generate declaration with reason */}
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
                    <option key={r} value={r}>{r}</option>
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
    </AppLayout>
  );
};

export default StudentsDetail;

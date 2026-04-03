import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { toast } from "sonner";

const docTemplates = [
  { id: "1", nome: "Declaração de Matrícula", icon: "ri-file-text-line" },
  { id: "2", nome: "Histórico Escolar", icon: "ri-file-list-3-line" },
  { id: "3", nome: "Boletim", icon: "ri-bar-chart-box-line" },
  { id: "4", nome: "Declaração de Frequência", icon: "ri-calendar-check-line" },
  { id: "5", nome: "Transferência", icon: "ri-swap-line" },
  { id: "6", nome: "Atestado de Vaga", icon: "ri-checkbox-circle-line" },
];

const history = [
  { doc: "Declaração de Matrícula", aluno: "Ana Clara Silva", data: "01/04/2024", status: "active" },
  { doc: "Boletim", aluno: "Pedro H. Costa", data: "28/03/2024", status: "active" },
  { doc: "Histórico Escolar", aluno: "Maria F. Souza", data: "25/03/2024", status: "warning" },
  { doc: "Transferência", aluno: "Lucas G. Lima", data: "20/03/2024", status: "active" },
];

const OfficialDocuments = () => {
  const [tab, setTab] = useState<"generate" | "history">("generate");

  return (
    <AppLayout title="Documentos Oficiais" breadcrumbs={[{ label: "Docs Oficiais" }]}>
      <PageHeader title="Documentos Oficiais" description="Gere e consulte documentos oficiais" />

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("generate")} className={`px-3.5 py-2 rounded-full text-xs font-bold transition-colors border ${tab === "generate" ? "bg-secondary border-secondary text-secondary-foreground" : "bg-card border-border/60 text-muted hover:bg-accent"}`}>
          <i className="ri-add-line mr-1" /> Gerar Documento
        </button>
        <button onClick={() => setTab("history")} className={`px-3.5 py-2 rounded-full text-xs font-bold transition-colors border ${tab === "history" ? "bg-secondary border-secondary text-secondary-foreground" : "bg-card border-border/60 text-muted hover:bg-accent"}`}>
          <i className="ri-history-line mr-1" /> Histórico
        </button>
      </div>

      {tab === "generate" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docTemplates.map((d) => (
            <button key={d.id} onClick={() => toast.success(`${d.nome} gerado!`)} className="bg-card border border-border/60 rounded-xl p-5 certus-shadow hover:border-secondary/40 transition-all text-left group">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-3 group-hover:bg-secondary/15 transition-colors">
                <i className={`${d.icon} text-lg text-primary group-hover:text-secondary transition-colors`} />
              </div>
              <div className="text-sm font-bold text-primary">{d.nome}</div>
              <div className="text-xs text-muted mt-1">Clique para gerar</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-xl certus-shadow">
          {history.map((h, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-border/20 last:border-0">
              <div>
                <div className="text-sm font-bold text-primary">{h.doc}</div>
                <div className="text-xs text-muted">{h.aluno} · {h.data}</div>
              </div>
              <StatusBadge status={h.status} label={h.status === "active" ? "Emitido" : "Processando"} />
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default OfficialDocuments;

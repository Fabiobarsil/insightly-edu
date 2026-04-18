import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { toast } from "sonner";

const history = [
  { doc: "Declaração de Matrícula", aluno: "Ana Clara Silva", data: "01/04/2024", status: "active" },
  { doc: "Boletim", aluno: "Pedro H. Costa", data: "28/03/2024", status: "active" },
  { doc: "Histórico Escolar", aluno: "Maria F. Souza", data: "25/03/2024", status: "warning" },
  { doc: "Transferência", aluno: "Lucas G. Lima", data: "20/03/2024", status: "active" },
];

const OfficialDocuments = () => {
  const [tab, setTab] = useState<"generate" | "history">("generate");

  const { data: templates = [] } = useQuery({
    queryKey: ["document-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_templates")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const handleGenerateDocument = (template: any) => {
    console.log("Gerar documento:", template);
    toast.success(`${template.name} selecionado`);
  };

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
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {templates.map((tpl: any) => (
              <div
                key={tpl.id}
                onClick={() => handleGenerateDocument(tpl)}
                className="cursor-pointer border border-border/60 rounded-xl p-4 hover:bg-accent/30 transition bg-card certus-shadow"
              >
                <div className="flex items-center gap-2">
                  <i className="ri-file-text-line text-lg text-secondary" />
                  <div>
                    <div className="text-sm font-medium text-primary">{tpl.name}</div>
                    <div className="text-xs text-muted-foreground">{tpl.type}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {templates.length === 0 && (
            <div className="text-center text-muted-foreground mt-6">
              Nenhum template cadastrado
            </div>
          )}
        </>
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

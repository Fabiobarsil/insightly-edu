import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormField from "@/components/shared/FormField";
import StatusBadge from "@/components/shared/StatusBadge";
import { toast } from "sonner";

const templates = [
  { id: "1", nome: "Reunião de Pais", preview: "Prezados responsáveis, convidamos para a reunião..." },
  { id: "2", nome: "Aviso de Falta", preview: "Informamos que o(a) aluno(a) apresentou faltas..." },
  { id: "3", nome: "Comunicado Geral", preview: "Comunicamos que a escola realizará..." },
];

const history = [
  { assunto: "Reunião de Pais - Abril", destinatarios: "5º Ano A", data: "01/04/2024", status: "active" },
  { assunto: "Aviso de Falta - Lucas Lima", destinatarios: "Roberto Lima", data: "28/03/2024", status: "active" },
  { assunto: "Festa Junina", destinatarios: "Todos", data: "25/03/2024", status: "active" },
  { assunto: "Alteração de Horário", destinatarios: "3º Ano B", data: "20/03/2024", status: "warning" },
];

const Communication = () => {
  const [tab, setTab] = useState<"send" | "history" | "templates">("send");

  return (
    <AppLayout title="Comunicação" breadcrumbs={[{ label: "Comunicação" }]}>
      <PageHeader title="Comunicação" description="Envie mensagens e gerencie comunicados" />

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { id: "send" as const, label: "Enviar Mensagem", icon: "ri-send-plane-line" },
          { id: "history" as const, label: "Histórico", icon: "ri-history-line" },
          { id: "templates" as const, label: "Modelos", icon: "ri-file-copy-line" },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-colors border ${tab === t.id ? "bg-secondary border-secondary text-secondary-foreground" : "bg-card border-border/60 text-muted hover:bg-accent"}`}>
            <i className={t.icon} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "send" && (
        <div className="bg-card border border-border/60 rounded-xl p-6 certus-shadow space-y-4">
          <FormField label="Destinatários" options={[
            { value: "all", label: "Todos os Responsáveis" },
            { value: "5A", label: "5º Ano A" },
            { value: "5B", label: "5º Ano B" },
            { value: "3A", label: "3º Ano A" },
          ]} />
          <FormField label="Assunto" placeholder="Assunto da mensagem" />
          <FormField label="Modelo" options={templates.map(t => ({ value: t.id, label: t.nome }))} />
          <FormField label="Mensagem" textarea placeholder="Digite sua mensagem..." />
          <div className="flex justify-end">
            <button onClick={() => toast.success("Mensagem enviada!")} className="px-5 py-2.5 rounded-[14px] bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/90 transition-colors">
              <i className="ri-send-plane-line mr-1" /> Enviar
            </button>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="bg-card border border-border/60 rounded-xl certus-shadow">
          {history.map((h, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-border/20 last:border-0">
              <div>
                <div className="text-sm font-bold text-primary">{h.assunto}</div>
                <div className="text-xs text-muted">Para: {h.destinatarios} · {h.data}</div>
              </div>
              <StatusBadge status={h.status} label={h.status === "active" ? "Enviado" : "Rascunho"} />
            </div>
          ))}
        </div>
      )}

      {tab === "templates" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
              <div className="text-sm font-bold text-primary mb-2">{t.nome}</div>
              <p className="text-xs text-muted line-clamp-2">{t.preview}</p>
              <button onClick={() => { setTab("send"); toast("Modelo carregado"); }} className="text-xs font-bold text-secondary mt-3 hover:underline">
                Usar modelo →
              </button>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Communication;

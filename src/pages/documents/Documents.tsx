import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Link } from "react-router-dom";

const docTypes = [
  { nome: "Certidão de Nascimento", obrigatorio: true, entregues: 820, pendentes: 27 },
  { nome: "Comprovante de Residência", obrigatorio: true, entregues: 790, pendentes: 57 },
  { nome: "Carteira de Vacinação", obrigatorio: true, entregues: 750, pendentes: 97 },
  { nome: "Foto 3x4", obrigatorio: false, entregues: 810, pendentes: 37 },
  { nome: "Histórico Escolar", obrigatorio: true, entregues: 700, pendentes: 147 },
  { nome: "Laudo Médico", obrigatorio: false, entregues: 45, pendentes: 0 },
];

const Documents = () => (
  <AppLayout title="Documentos" breadcrumbs={[{ label: "Documentos" }]}>
    <PageHeader title="Tipos de Documentos" description="Gerencie os documentos necessários para matrícula" />

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {[
        { label: "Total de Tipos", value: "6", icon: "ri-file-list-3-line", color: "text-primary" },
        { label: "Obrigatórios", value: "4", icon: "ri-alert-line", color: "text-warning-foreground" },
        { label: "Pendências Totais", value: "365", icon: "ri-error-warning-line", color: "text-destructive" },
      ].map((s, i) => (
        <div key={i} className="bg-card border border-border/60 rounded-xl p-4 certus-shadow flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <i className={`${s.icon} text-lg ${s.color}`} />
          </div>
          <div>
            <div className="text-lg font-bold text-primary">{s.value}</div>
            <div className="text-xs text-muted">{s.label}</div>
          </div>
        </div>
      ))}
    </div>

    <div className="bg-card border border-border/60 rounded-xl certus-shadow">
      {docTypes.map((d, i) => (
        <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-border/20 last:border-0 hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-3">
            <i className="ri-file-text-line text-lg text-muted" />
            <div>
              <div className="text-sm font-bold text-primary">{d.nome}</div>
              <div className="text-xs text-muted">{d.entregues} entregues · {d.pendentes} pendentes</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={d.obrigatorio ? "warning" : "info"} label={d.obrigatorio ? "Obrigatório" : "Opcional"} />
            {d.pendentes > 0 && <span className="text-xs font-bold text-destructive">{d.pendentes} pendentes</span>}
          </div>
        </div>
      ))}
    </div>
  </AppLayout>
);

export default Documents;

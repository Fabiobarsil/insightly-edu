import { useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import StatusBadge from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "pessoal", label: "Dados Pessoais", icon: "ri-user-line" },
  { id: "responsaveis", label: "Responsáveis", icon: "ri-parent-line" },
  { id: "documentos", label: "Documentos", icon: "ri-file-text-line" },
  { id: "notas", label: "Notas", icon: "ri-bar-chart-box-line" },
  { id: "frequencia", label: "Frequência", icon: "ri-calendar-check-line" },
  { id: "observacoes", label: "Observações", icon: "ri-chat-3-line" },
];

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between py-2.5 border-b border-border/20 last:border-0">
    <span className="text-xs font-bold text-muted">{label}</span>
    <span className="text-sm text-primary font-medium">{value}</span>
  </div>
);

const PersonalTab = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
      <h4 className="text-sm font-bold text-primary mb-4">Informações Pessoais</h4>
      <InfoRow label="Nome Completo" value="Ana Clara Silva" />
      <InfoRow label="Data de Nascimento" value="15/03/2014" />
      <InfoRow label="CPF" value="123.456.789-00" />
      <InfoRow label="RG" value="12.345.678-9" />
      <InfoRow label="Gênero" value="Feminino" />
      <InfoRow label="Naturalidade" value="São Paulo - SP" />
    </div>
    <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
      <h4 className="text-sm font-bold text-primary mb-4">Dados Escolares</h4>
      <InfoRow label="Matrícula" value="2024001" />
      <InfoRow label="Turma" value="5º Ano A" />
      <InfoRow label="Turno" value="Matutino" />
      <InfoRow label="Data de Matrícula" value="01/02/2024" />
      <InfoRow label="Status" value="Ativo" />
    </div>
    <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow lg:col-span-2">
      <h4 className="text-sm font-bold text-primary mb-4">Endereço</h4>
      <InfoRow label="Rua" value="Rua das Flores, 123" />
      <InfoRow label="Bairro" value="Centro" />
      <InfoRow label="Cidade" value="São Paulo - SP" />
      <InfoRow label="CEP" value="01001-000" />
    </div>
  </div>
);

const GuardiansTab = () => (
  <div className="space-y-4">
    {[
      { nome: "Carlos Silva", parentesco: "Pai", tel: "(11) 98765-4321", email: "carlos@email.com" },
      { nome: "Maria Silva", parentesco: "Mãe", tel: "(11) 91234-5678", email: "maria@email.com" },
    ].map((g, i) => (
      <div key={i} className="bg-card border border-border/60 rounded-xl p-5 certus-shadow flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
            <i className="ri-user-line text-primary" />
          </div>
          <div>
            <div className="text-sm font-bold text-primary">{g.nome}</div>
            <div className="text-xs text-muted">{g.parentesco} · {g.tel} · {g.email}</div>
          </div>
        </div>
        <Link to={`/responsaveis/${i + 1}`} className="text-xs font-bold text-secondary hover:underline">Ver perfil</Link>
      </div>
    ))}
  </div>
);

const DocumentsTab = () => (
  <div className="bg-card border border-border/60 rounded-xl certus-shadow">
    {[
      { doc: "Certidão de Nascimento", status: "active", data: "01/02/2024" },
      { doc: "Comprovante de Residência", status: "active", data: "01/02/2024" },
      { doc: "Carteira de Vacinação", status: "warning", data: "Pendente" },
      { doc: "Foto 3x4", status: "active", data: "01/02/2024" },
      { doc: "Histórico Escolar", status: "critical", data: "Não entregue" },
    ].map((d, i) => (
      <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-border/20 last:border-0">
        <div className="flex items-center gap-3">
          <i className="ri-file-text-line text-muted" />
          <span className="text-sm text-primary font-medium">{d.doc}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">{d.data}</span>
          <StatusBadge status={d.status} label={d.status === "active" ? "Entregue" : d.status === "warning" ? "Pendente" : "Não entregue"} />
        </div>
      </div>
    ))}
  </div>
);

const GradesTab = () => (
  <div className="bg-card border border-border/60 rounded-xl certus-shadow overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border/40">
          <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">Disciplina</th>
          <th className="text-center px-4 py-3 text-xs font-bold text-muted uppercase">1º Bi</th>
          <th className="text-center px-4 py-3 text-xs font-bold text-muted uppercase">2º Bi</th>
          <th className="text-center px-4 py-3 text-xs font-bold text-muted uppercase">3º Bi</th>
          <th className="text-center px-4 py-3 text-xs font-bold text-muted uppercase">4º Bi</th>
          <th className="text-center px-4 py-3 text-xs font-bold text-muted uppercase">Média</th>
        </tr>
      </thead>
      <tbody>
        {[
          { disc: "Português", notas: [8.5, 7.0, 9.0, "-"], media: "8.2" },
          { disc: "Matemática", notas: [6.5, 7.5, 8.0, "-"], media: "7.3" },
          { disc: "Ciências", notas: [9.0, 8.5, 7.5, "-"], media: "8.3" },
          { disc: "História", notas: [7.0, 6.0, 8.5, "-"], media: "7.2" },
          { disc: "Geografia", notas: [8.0, 8.0, 9.0, "-"], media: "8.3" },
        ].map((r, i) => (
          <tr key={i} className="border-b border-border/20 last:border-0">
            <td className="px-4 py-3 font-medium text-primary">{r.disc}</td>
            {r.notas.map((n, j) => (
              <td key={j} className={cn("px-4 py-3 text-center", typeof n === "number" && n < 7 ? "text-destructive font-bold" : "")}>{n}</td>
            ))}
            <td className="px-4 py-3 text-center font-bold text-primary">{r.media}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const AttendanceTab = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[
        { label: "Frequência Geral", value: "96%", icon: "ri-check-double-line", color: "text-secondary" },
        { label: "Faltas no Mês", value: "2", icon: "ri-close-line", color: "text-destructive" },
        { label: "Aulas Ministradas", value: "145", icon: "ri-book-line", color: "text-primary" },
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
      {["01/04 - Presente", "31/03 - Presente", "28/03 - Falta", "27/03 - Presente", "26/03 - Presente", "25/03 - Falta"].map((entry, i) => (
        <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-border/20 last:border-0">
          <span className="text-sm text-primary">{entry.split(" - ")[0]}</span>
          <StatusBadge status={entry.includes("Falta") ? "critical" : "active"} label={entry.split(" - ")[1]} />
        </div>
      ))}
    </div>
  </div>
);

const NotesTab = () => (
  <div className="space-y-4">
    {[
      { date: "28/03/2024", author: "Profa. Maria", text: "Aluna apresentou excelente desempenho na prova de Ciências." },
      { date: "15/03/2024", author: "Coord. João", text: "Reunião com responsáveis sobre adaptação curricular." },
      { date: "01/03/2024", author: "Profa. Ana", text: "Participação ativa nas atividades de grupo." },
    ].map((n, i) => (
      <div key={i} className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-muted">{n.date} · {n.author}</span>
        </div>
        <p className="text-sm text-foreground">{n.text}</p>
      </div>
    ))}
  </div>
);

const tabComponents: Record<string, React.FC> = {
  pessoal: PersonalTab,
  responsaveis: GuardiansTab,
  documentos: DocumentsTab,
  notas: GradesTab,
  frequencia: AttendanceTab,
  observacoes: NotesTab,
};

const StudentsDetail = () => {
  const [activeTab, setActiveTab] = useState("pessoal");
  const TabContent = tabComponents[activeTab];

  return (
    <AppLayout title="Ana Clara Silva" breadcrumbs={[{ label: "Alunos", href: "/alunos" }, { label: "Ana Clara Silva" }]}>
      <div className="flex items-center justify-between mb-6 max-[640px]:flex-col max-[640px]:gap-4 max-[640px]:items-start">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center">
            <i className="ri-user-line text-2xl text-secondary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">Ana Clara Silva</h1>
            <p className="text-sm text-muted">5º Ano A · Matrícula: 2024001</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status="active" label="Ativo" />
          <Link to="/alunos/1/editar" className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] border border-border text-sm font-bold text-muted hover:bg-accent transition-colors">
            <i className="ri-pencil-line" /> Editar
          </Link>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-colors border",
              activeTab === tab.id
                ? "bg-secondary border-secondary text-secondary-foreground"
                : "bg-card border-border/60 text-muted hover:bg-accent"
            )}
          >
            <i className={tab.icon} /> {tab.label}
          </button>
        ))}
      </div>

      <TabContent />
    </AppLayout>
  );
};

export default StudentsDetail;

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormCard from "@/components/shared/FormCard";
import FormField from "@/components/shared/FormField";
import StatusBadge from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "escola", label: "Dados da Escola", icon: "ri-building-line" },
  { id: "assinaturas", label: "Assinaturas", icon: "ri-quill-pen-line" },
  { id: "usuarios", label: "Usuários e Papéis", icon: "ri-shield-user-line" },
];

const users = [
  { nome: "Admin Principal", email: "admin@certus.edu.br", papel: "Administrador", status: "active" },
  { nome: "Maria Oliveira", email: "maria@certus.edu.br", papel: "Professor", status: "active" },
  { nome: "João Santos", email: "joao@certus.edu.br", papel: "Professor", status: "active" },
  { nome: "Ana Coord.", email: "ana@certus.edu.br", papel: "Coordenador", status: "active" },
  { nome: "Carlos Sec.", email: "carlos@certus.edu.br", papel: "Secretário", status: "inactive" },
];

const Settings = () => {
  const [tab, setTab] = useState("escola");

  return (
    <AppLayout title="Configurações" breadcrumbs={[{ label: "Configurações" }]}>
      <PageHeader title="Configurações" description="Configure o sistema escolar" />

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-colors border",
            tab === t.id ? "bg-secondary border-secondary text-secondary-foreground" : "bg-card border-border/60 text-muted hover:bg-accent"
          )}>
            <i className={t.icon} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "escola" && (
        <div className="space-y-6">
          <FormCard title="Informações da Escola">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Nome da Escola" value="Certus Edu" />
              <FormField label="CNPJ" value="12.345.678/0001-00" />
              <FormField label="Telefone" value="(11) 3456-7890" />
              <FormField label="E-mail" value="contato@certus.edu.br" />
              <FormField label="Endereço" value="Rua da Educação, 100" />
              <FormField label="Cidade/UF" value="São Paulo - SP" />
            </div>
          </FormCard>
          <FormCard title="Ano Letivo">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Ano Letivo Atual" value="2024" />
              <FormField label="Início das Aulas" type="date" value="2024-02-05" />
              <FormField label="Término das Aulas" type="date" value="2024-12-13" />
              <FormField label="Bimestres" options={[
                { value: "4", label: "4 Bimestres" },
                { value: "3", label: "3 Trimestres" },
              ]} />
            </div>
          </FormCard>
        </div>
      )}

      {tab === "assinaturas" && (
        <div className="space-y-4">
          {["Diretor(a)", "Coordenador(a)", "Secretário(a)"].map((cargo, i) => (
            <div key={i} className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
              <h4 className="text-sm font-bold text-primary mb-4">{cargo}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Nome" placeholder={`Nome do(a) ${cargo}`} />
                <FormField label="Registro" placeholder="Número do registro" />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "usuarios" && (
        <div className="bg-card border border-border/60 rounded-xl certus-shadow">
          <div className="p-4 border-b border-border/40 flex items-center justify-between">
            <span className="text-sm font-bold text-primary">Usuários do Sistema</span>
            <button className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-bold">
              <i className="ri-add-line mr-1" /> Novo Usuário
            </button>
          </div>
          {users.map((u, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-border/20 last:border-0 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-primary">
                  {u.nome.split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <div className="text-sm font-bold text-primary">{u.nome}</div>
                  <div className="text-xs text-muted">{u.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted bg-accent px-2.5 py-1 rounded-full">{u.papel}</span>
                <StatusBadge status={u.status} label={u.status === "active" ? "Ativo" : "Inativo"} />
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Settings;

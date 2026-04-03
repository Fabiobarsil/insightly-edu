import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";

const GuardiansDetail = () => (
  <AppLayout title="Carlos Silva" breadcrumbs={[{ label: "Responsáveis", href: "/responsaveis" }, { label: "Carlos Silva" }]}>
    <PageHeader title="Carlos Silva" description="Pai" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
        <h4 className="text-sm font-bold text-primary mb-4">Informações de Contato</h4>
        {[
          ["Telefone", "(11) 98765-4321"],
          ["E-mail", "carlos@email.com"],
          ["CPF", "987.654.321-00"],
          ["Endereço", "Rua das Flores, 123 - Centro, São Paulo/SP"],
        ].map(([l, v], i) => (
          <div key={i} className="flex justify-between py-2.5 border-b border-border/20 last:border-0">
            <span className="text-xs font-bold text-muted">{l}</span>
            <span className="text-sm text-primary font-medium">{v}</span>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
        <h4 className="text-sm font-bold text-primary mb-4">Alunos Vinculados</h4>
        <div className="space-y-3">
          {[{ nome: "Ana Clara Silva", turma: "5º Ano A", id: "1" }].map((a) => (
            <Link key={a.id} to={`/alunos/${a.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
              <div className="w-9 h-9 rounded-full bg-secondary/15 flex items-center justify-center">
                <i className="ri-user-line text-secondary" />
              </div>
              <div>
                <div className="text-sm font-bold text-primary">{a.nome}</div>
                <div className="text-xs text-muted">{a.turma}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  </AppLayout>
);

export default GuardiansDetail;

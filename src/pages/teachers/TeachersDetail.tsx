import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";

const TeachersDetail = () => (
  <AppLayout title="Profa. Maria Oliveira" breadcrumbs={[{ label: "Professores", href: "/professores" }, { label: "Profa. Maria Oliveira" }]}>
    <div className="flex items-center gap-4 mb-6">
      <div className="w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center">
        <i className="ri-user-star-line text-2xl text-secondary" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-primary">Profa. Maria Oliveira</h1>
        <p className="text-sm text-muted">Português, Redação</p>
      </div>
      <StatusBadge status="active" label="Ativo" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
        <h4 className="text-sm font-bold text-primary mb-4">Informações</h4>
        {[["E-mail", "maria@escola.edu.br"], ["Telefone", "(11) 98765-1234"], ["Formação", "Letras - USP"], ["Admissão", "01/03/2020"]].map(([l, v], i) => (
          <div key={i} className="flex justify-between py-2.5 border-b border-border/20 last:border-0">
            <span className="text-xs font-bold text-muted">{l}</span>
            <span className="text-sm text-primary font-medium">{v}</span>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
        <h4 className="text-sm font-bold text-primary mb-4">Turmas Atribuídas</h4>
        {["5º Ano A - Português", "5º Ano B - Português", "6º Ano A - Redação"].map((t, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/20 last:border-0">
            <i className="ri-book-open-line text-muted" />
            <span className="text-sm text-primary">{t}</span>
          </div>
        ))}
      </div>
    </div>
  </AppLayout>
);

export default TeachersDetail;

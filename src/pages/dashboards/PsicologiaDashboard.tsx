import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";

/**
 * Dashboard do Psicólogo — placeholder mínimo.
 *
 * O acesso é controlado pelo role `psicologo` em account_members. Filtros por
 * aluno/turma/série e registro de atendimento serão implementados em rodada
 * futura (a estrutura de dados ainda precisa de tabela própria).
 */
const PsicologiaDashboard = () => {
  return (
    <AppLayout title="Psicologia" breadcrumbs={[{ label: "Psicologia" }]}>
      <PageHeader
        title="Psicologia"
        description="Acompanhamento socioemocional dos alunos. Use a busca para acessar o prontuário."
      />
      <div className="bg-card border border-border/60 rounded-xl p-12 text-center certus-shadow">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-accent flex items-center justify-center mb-4">
          <i className="ri-mental-health-line text-2xl text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">Bem-vindo(a) à área de Psicologia</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Em breve você poderá filtrar alunos por turma e série, visualizar o prontuário e registrar atendimentos
          diretamente por aqui.
        </p>
      </div>
    </AppLayout>
  );
};

export default PsicologiaDashboard;

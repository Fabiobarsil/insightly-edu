const actions = [
  { icon: "ri-user-add-line", label: "Adicionar Aluno" },
  { icon: "ri-calendar-check-line", label: "Registrar Frequência" },
  { icon: "ri-pencil-ruler-line", label: "Lançar Notas" },
  { icon: "ri-file-list-3-line", label: "Solicitar Documentos" },
  { icon: "ri-file-chart-line", label: "Gerar Relatório" },
];

const QuickActions = () => (
  <div className="bg-card border border-border/60 rounded-xl p-6 certus-shadow">
    <h3 className="text-sm font-bold text-primary mb-4">Ações Rápidas</h3>
    <div className="flex flex-wrap gap-3">
      {actions.map((a) => (
        <button
          key={a.label}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] border border-border text-sm font-semibold text-primary hover:border-secondary hover:text-secondary transition-colors"
        >
          <i className={`${a.icon} text-base`} />
          {a.label}
        </button>
      ))}
    </div>
  </div>
);

export default QuickActions;

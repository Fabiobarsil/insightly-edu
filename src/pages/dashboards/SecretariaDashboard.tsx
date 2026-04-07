import RoleLayout from "@/components/layout/RoleLayout";

const SecretariaDashboard = () => (
  <RoleLayout title="Secretaria">
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-foreground">Painel da Secretaria</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Alunos Ativos", value: "—", icon: "ri-group-line" },
          { label: "Documentos Pendentes", value: "—", icon: "ri-file-text-line" },
          { label: "Turmas", value: "—", icon: "ri-book-open-line" },
        ].map((card) => (
          <div key={card.label} className="bg-card border border-border/60 rounded-xl p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <i className={`${card.icon} text-primary text-lg`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="text-lg font-bold text-foreground">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border/60 rounded-xl p-6">
        <p className="text-sm text-muted-foreground">Funcionalidades da secretaria serão implementadas em breve.</p>
      </div>
    </div>
  </RoleLayout>
);

export default SecretariaDashboard;

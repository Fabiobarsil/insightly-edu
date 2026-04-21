import { useState, useCallback } from "react";
import RoleLayout from "@/components/layout/RoleLayout";
import OperationalMetrics from "@/components/admin-dashboard/OperationalMetrics";
import SecretaryWorkQueue from "@/components/admin-dashboard/SecretaryWorkQueue";
import SecretarySmartAlerts from "@/components/admin-dashboard/SecretarySmartAlerts";
import QuickActionsPanel from "@/components/admin-dashboard/QuickActionsPanel";
import QuickOverview from "@/components/admin-dashboard/QuickOverview";
import AdminAgenda from "@/components/admin-dashboard/AdminAgenda";

const AdminDashboard = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const handleRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <RoleLayout title="Secretaria Digital">
      <div className="flex flex-col gap-6" key={refreshKey}>
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Secretaria Digital</h2>
          <p className="text-sm text-muted-foreground">
            Painel operacional — o que precisa ser resolvido agora
          </p>
        </div>

        {/* Layout em 2 colunas: conteúdo principal + painel lateral */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Coluna principal — operação */}
          <div className="flex flex-col gap-6 min-w-0">
            {/* BLOCO 1 — Cards Operacionais */}
            <OperationalMetrics />

            {/* BLOCO 2 — Fila de Trabalho (Prioridades de Hoje) */}
            <SecretaryWorkQueue
              externalModalOpen={modalOpen}
              onExternalModalChange={setModalOpen}
            />

            {/* BLOCO 3 — Saúde da Secretaria (gráficos analíticos) */}
            <QuickOverview />
          </div>

          {/* Coluna lateral — ações + alertas + agenda + dica */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-4 self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto pr-1" id="agenda-section">
            <QuickActionsPanel onNewRequest={() => setModalOpen(true)} />
            <SecretarySmartAlerts />
            <AdminAgenda />
            <div className="bg-muted/30 border border-border/40 rounded-xl p-3">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1">Dica do dia</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                💧 Pausas curtas aumentam o foco. Se possível, beba água e respire por 1 minuto.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </RoleLayout>
  );
};

export default AdminDashboard;

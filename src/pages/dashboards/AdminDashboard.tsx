import { useState, useCallback } from "react";
import RoleLayout from "@/components/layout/RoleLayout";
import OperationalMetrics from "@/components/admin-dashboard/OperationalMetrics";
import SecretaryWorkQueue from "@/components/admin-dashboard/SecretaryWorkQueue";
import SecretarySmartAlerts from "@/components/admin-dashboard/SecretarySmartAlerts";
import QuickActionsPanel from "@/components/admin-dashboard/QuickActionsPanel";
import QuickOverview from "@/components/admin-dashboard/QuickOverview";
import AdminAgenda from "@/components/admin-dashboard/AdminAgenda";
import SecretaryHealthSummary from "@/components/admin-dashboard/SecretaryHealthSummary";

const AdminDashboard = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const handleRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <RoleLayout title="Secretaria Digital">
      <div className="flex flex-col gap-6" key={refreshKey}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Secretaria Digital</h2>
            <SecretaryHealthSummary />
          </div>
          <p className="text-sm text-muted-foreground">
            Painel operacional — o que precisa ser resolvido agora
          </p>
        </div>

        {/* Layout em 2 colunas: conteúdo principal + painel lateral */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Coluna principal — operação */}
          <div className="flex flex-col gap-6 min-w-0">
            {/* BLOCO 1 — Cards Operacionais */}
            <OperationalMetrics />

            {/* BLOCO 2 — Fila de Trabalho (foco principal) */}
            <SecretaryWorkQueue
              externalModalOpen={modalOpen}
              onExternalModalChange={setModalOpen}
            />

            {/* BLOCO 3 — Alertas da Secretaria (compacto, full width) */}
            <SecretarySmartAlerts />

            {/* BLOCO 4 — Visão Rápida (secundário, gráficos compactos) */}
            <QuickOverview />
          </div>

          {/* Coluna lateral — cresce junto com a página, sem scroll interno */}
          <aside className="flex flex-col gap-4" id="agenda-section">
            <QuickActionsPanel onNewRequest={() => setModalOpen(true)} />
            <AdminAgenda />
            <div className="bg-muted/20 border border-border/30 rounded-lg px-3 py-2">
              <p className="text-[11px] text-muted-foreground leading-relaxed truncate">
                💧 Pausas curtas aumentam o foco — beba água e respire por 1 minuto.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </RoleLayout>
  );
};

export default AdminDashboard;

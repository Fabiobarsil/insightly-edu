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

        {/* Layout em 2 colunas: conteúdo principal + ações sticky */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Coluna principal */}
          <div className="flex flex-col gap-6 min-w-0">
            {/* BLOCO 1 — Cards Operacionais */}
            <OperationalMetrics />

            {/* Visão Rápida (amostragem) */}
            <QuickOverview />

            {/* BLOCO 2 — Fila de Trabalho */}
            <SecretaryWorkQueue
              externalModalOpen={modalOpen}
              onExternalModalChange={setModalOpen}
            />

            {/* BLOCO 4 — Alertas */}
            <div id="agenda-section">
              <SecretarySmartAlerts />
            </div>
          </div>

          {/* BLOCO 3 — Painel lateral: Ações + Agenda + Dica */}
          <div className="lg:sticky lg:top-4 self-start flex flex-col gap-4">
            <QuickActionsPanel onNewRequest={() => setModalOpen(true)} />
            <AdminAgenda />
            <div className="bg-muted/30 border border-border/40 rounded-xl p-3">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1">Dica do dia</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                💧 Pausas curtas aumentam o foco. Se possível, beba água e respire por 1 minuto.
              </p>
            </div>
          </div>
        </div>
      </div>
    </RoleLayout>
  );
};

export default AdminDashboard;

import RoleLayout from "@/components/layout/RoleLayout";
import SecretaryTopBar from "@/components/admin-dashboard/SecretaryTopBar";
import SecretaryCounters from "@/components/admin-dashboard/SecretaryCounters";
import SecretaryKanban from "@/components/admin-dashboard/SecretaryKanban";
import SecretarySmartAlerts from "@/components/admin-dashboard/SecretarySmartAlerts";
import UrgentDemands from "@/components/admin-dashboard/UrgentDemands";
import QuickActionsPanel from "@/components/admin-dashboard/QuickActionsPanel";
import AdminAgenda from "@/components/admin-dashboard/AdminAgenda";

const AdminDashboard = () => {
  return (
    <RoleLayout title="Secretaria Digital">
      <div className="flex flex-col gap-6">
        {/* Cabeçalho da página */}
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Secretaria Digital</h2>
          <p className="text-sm text-muted-foreground">
            Centro operacional — busque, acompanhe e resolva demandas
          </p>
        </div>

        {/* Barra de busca */}
        <SecretaryTopBar />

        {/* Layout em 2 colunas: operacional + painel lateral */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Coluna principal */}
          <div className="flex flex-col gap-6 min-w-0">
            {/* Contadores compactos (estilo mockup) */}
            <SecretaryCounters />

            {/* Kanban operacional */}
            <SecretaryKanban />

            {/* Demandas urgentes + Alertas */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <UrgentDemands />
              <SecretarySmartAlerts />
            </div>
          </div>

          {/* Coluna lateral — ações rápidas + agenda */}
          <aside className="flex flex-col gap-4" id="agenda-section">
            <QuickActionsPanel />
            <AdminAgenda />
          </aside>
        </div>
      </div>
    </RoleLayout>
  );
};

export default AdminDashboard;

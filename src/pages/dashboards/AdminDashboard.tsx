import RoleLayout from "@/components/layout/RoleLayout";
import SecretaryKanban from "@/components/admin-dashboard/SecretaryKanban";
import SecretarySmartAlerts from "@/components/admin-dashboard/SecretarySmartAlerts";
import QuickActionsPanel from "@/components/admin-dashboard/QuickActionsPanel";
import AdminAgenda from "@/components/admin-dashboard/AdminAgenda";

const AdminDashboard = () => {
  return (
    <RoleLayout title="Secretaria Digital">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Secretaria Digital</h2>
          <p className="text-sm text-muted-foreground">
            Centro operacional — acompanhe e resolva demandas em tempo real
          </p>
        </div>

        {/* Layout em 2 colunas: Kanban + painel lateral */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Coluna principal — Kanban operacional */}
          <div className="flex flex-col gap-6 min-w-0">
            <SecretaryKanban />
            <SecretarySmartAlerts />
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

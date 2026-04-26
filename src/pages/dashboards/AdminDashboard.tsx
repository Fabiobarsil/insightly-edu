import { useState } from "react";
import RoleLayout from "@/components/layout/RoleLayout";
import SecretaryQuickActionsBar from "@/components/admin-dashboard/SecretaryQuickActionsBar";
import SecretaryCounters from "@/components/admin-dashboard/SecretaryCounters";
import SecretaryAlertsBar from "@/components/admin-dashboard/SecretaryAlertsBar";
import SecretaryKanban from "@/components/admin-dashboard/SecretaryKanban";
import UrgentDemands from "@/components/admin-dashboard/UrgentDemands";
import AdminAgenda from "@/components/admin-dashboard/AdminAgenda";

const AdminDashboard = () => {
  const [context, setContext] = useState<string>("all");

  return (
    <RoleLayout title="Secretaria Digital">
      <div className="flex flex-col gap-6">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Secretaria Digital
          </h2>
          <p className="text-sm text-muted-foreground">
            Centro operacional — busque, acompanhe e resolva demandas
          </p>
        </div>

        {/* Barra horizontal de Ações Rápidas + Seletor de Contexto */}
        <SecretaryQuickActionsBar
          context={context}
          onContextChange={setContext}
        />

        {/* Indicadores compactos */}
        <SecretaryCounters />

        {/* Alertas críticos (linhas horizontais finas, máx. 3) */}
        <SecretaryAlertsBar />

        {/* Layout principal: Kanban + Agenda lateral */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="flex flex-col gap-6 min-w-0" id="kanban-section">
            <SecretaryKanban />
            <UrgentDemands />
          </div>

          <aside className="flex flex-col gap-4" id="agenda-section">
            <AdminAgenda />
          </aside>
        </div>
      </div>
    </RoleLayout>
  );
};

export default AdminDashboard;

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import RoleLayout from "@/components/layout/RoleLayout";
import SecretaryQuickActionsBar from "@/components/admin-dashboard/SecretaryQuickActionsBar";
import SecretaryCounters, { type CounterFilter } from "@/components/admin-dashboard/SecretaryCounters";
import SecretaryAlertsBar from "@/components/admin-dashboard/SecretaryAlertsBar";
import SecretaryKanban from "@/components/admin-dashboard/SecretaryKanban";
import AdminAgenda from "@/components/admin-dashboard/AdminAgenda";
import MomentoCertus from "@/components/admin-dashboard/MomentoCertus";
import PerformancePanel from "@/components/admin-dashboard/PerformancePanel";
import SecretaryActionsHistory from "@/components/admin-dashboard/SecretaryActionsHistory";
import RequestFormModal from "@/components/secretaria/RequestFormModal";

const AdminDashboard = () => {
  const [context, setContext] = useState<string>("all");
  const [filter, setFilter] = useState<CounterFilter>("all");
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const queryClient = useQueryClient();

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

        {/* Ações rápidas + contexto */}
        <SecretaryQuickActionsBar
          context={context}
          onContextChange={setContext}
          onNewRequest={() => setRequestModalOpen(true)}
        />

        {/* Indicadores clicáveis (filtram a fila) */}
        <SecretaryCounters active={filter} onChange={setFilter} />

        {/* Alertas críticos */}
        <SecretaryAlertsBar />

        {/* Fila operacional + Agenda lado a lado (~65% / 35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)] gap-6 items-start">
          <div className="min-w-0" id="kanban-section">
            <SecretaryKanban filter={filter} />
          </div>

          <aside className="min-w-0 flex flex-col gap-4" id="agenda-section">
            <AdminAgenda />
            <MomentoCertus />
          </aside>
        </div>

        {/* Panorama de performance (rodapé) */}
        <PerformancePanel />
      </div>

      {/* Modal de cadastro rápido */}
      <RequestFormModal
        open={requestModalOpen}
        onOpenChange={setRequestModalOpen}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["secretary-kanban"] });
          queryClient.invalidateQueries({ queryKey: ["secretary-counters"] });
          queryClient.invalidateQueries({ queryKey: ["secretary-alerts-bar"] });
          toast.success("Solicitação enviada para 'A Fazer'");
        }}
      />
    </RoleLayout>
  );
};

export default AdminDashboard;

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import RoleLayout from "@/components/layout/RoleLayout";
import SecretaryQuickActionsBar from "@/components/admin-dashboard/SecretaryQuickActionsBar";
import SecretaryCounters, { type CounterFilter } from "@/components/admin-dashboard/SecretaryCounters";
import CentralOperacional from "@/components/admin-dashboard/CentralOperacional";
import SecretaryKanban from "@/components/admin-dashboard/SecretaryKanban";
import AdminAgenda from "@/components/admin-dashboard/AdminAgenda";
import MomentoCertus from "@/components/admin-dashboard/MomentoCertus";
import PerformancePanel from "@/components/admin-dashboard/PerformancePanel";
import SecretaryActionsHistory from "@/components/admin-dashboard/SecretaryActionsHistory";
import RequestFormModal from "@/components/secretaria/RequestFormModal";
import AttendanceModal from "@/components/secretaria/AttendanceModal";
import { useSecretariaKanban } from "@/hooks/useSecretariaKanban";

const AdminDashboard = () => {
  const [context, setContext] = useState<string>("all");
  const [filter, setFilter] = useState<CounterFilter>("all");
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Reabrir modal Atender ao voltar da Ficha do Aluno (?attend=:request_id)
  const { requests } = useSecretariaKanban();
  const attendId = searchParams.get("attend");
  const [attendOpen, setAttendOpen] = useState(false);

  useEffect(() => {
    if (attendId && requests.length > 0) {
      setAttendOpen(true);
    }
  }, [attendId, requests.length]);

  const attendRequest = attendId ? requests.find((r) => r.id === attendId) ?? null : null;

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

        {/* Prioridades do Dia (alertas críticos) */}
        <SecretaryAlertsBar />

        {/* Fila Operacional — bloco principal, ocupa toda a largura */}
        <div id="kanban-section" className="min-w-0">
          <SecretaryKanban filter={filter} />
        </div>

        {/* Histórico de ações */}
        <SecretaryActionsHistory />

        {/* Áreas secundárias: Agenda + Momento Certus lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <AdminAgenda />
          <MomentoCertus />
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

      {/* Modal de atendimento reaberto via ?attend= */}
      <AttendanceModal
        open={attendOpen}
        onOpenChange={(v) => {
          setAttendOpen(v);
          if (!v) {
            const next = new URLSearchParams(searchParams);
            next.delete("attend");
            setSearchParams(next, { replace: true });
          }
        }}
        request={attendRequest}
      />
    </RoleLayout>
  );
};

export default AdminDashboard;

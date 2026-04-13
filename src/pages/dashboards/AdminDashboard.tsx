import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import RoleLayout from "@/components/layout/RoleLayout";
import DashboardHeader from "@/components/admin-dashboard/DashboardHeader";
import MetricCards, { type DashboardMetrics } from "@/components/admin-dashboard/MetricCards";
import QuickAccessCards from "@/components/admin-dashboard/QuickAccessCards";
import OperationalPriorities from "@/components/admin-dashboard/OperationalPriorities";
import SmartAlerts from "@/components/admin-dashboard/SmartAlerts";
import DashboardCharts from "@/components/admin-dashboard/DashboardCharts";
import QuickActions from "@/components/admin-dashboard/QuickActions";
import AdminRecentActivity from "@/components/admin-dashboard/AdminRecentActivity";
import AdminHealthScore from "@/components/admin-dashboard/AdminHealthScore";
import AdminAgenda from "@/components/admin-dashboard/AdminAgenda";
import RequestFormModal from "@/components/secretaria/RequestFormModal";
import PriorityModal from "@/components/secretaria/PriorityModal";
import { toast } from "sonner";

const MOCK_METRICS: DashboardMetrics = {
  activeStudents: 188,
  avgFrequency: 86,
  pendingStudents: 18,
  pendingDocuments: 8,
};

const AdminDashboard = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [classifyId, setClassifyId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const classifyMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: string }) => {
      const { error } = await supabase
        .from("secretary_requests")
        .update({ priority, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação classificada e adicionada à fila!");
      queryClient.invalidateQueries({ queryKey: ["secretary-requests"] });
      setClassifyId(null);
    },
  });

  return (
    <RoleLayout title="Secretaria Digital">
      <div className="flex flex-col gap-6" key={refreshKey}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Secretaria Digital</h2>
            <p className="text-sm text-muted-foreground mt-1">Centro de controle administrativo da escola</p>
          </div>
          <DashboardHeader
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            onDataRefresh={handleRefresh}
          />
        </div>

        <QuickAccessCards />
        <QuickActions onNewRequest={() => setModalOpen(true)} />
        <MetricCards metrics={MOCK_METRICS} />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3">
            <OperationalPriorities />
          </div>
          <div className="lg:col-span-2">
            <SmartAlerts />
          </div>
        </div>

        <DashboardCharts />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <AdminRecentActivity />
          <AdminHealthScore avgFrequency={86} avgGrade={7.1} pendingCount={18} />
          <AdminAgenda />
        </div>
      </div>

      <RequestFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(id) => setClassifyId(id)}
      />
      <PriorityModal
        open={!!classifyId}
        onConfirm={(priority) => classifyId && classifyMutation.mutate({ id: classifyId, priority })}
        onCancel={() => setClassifyId(null)}
      />
    </RoleLayout>
  );
};

export default AdminDashboard;

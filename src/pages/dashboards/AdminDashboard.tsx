import { useState, useCallback } from "react";
import RoleLayout from "@/components/layout/RoleLayout";
import DashboardHeader from "@/components/admin-dashboard/DashboardHeader";
import QuickAccessCards from "@/components/admin-dashboard/QuickAccessCards";
import QuickActions from "@/components/admin-dashboard/QuickActions";
import DashboardCharts from "@/components/admin-dashboard/DashboardCharts";
import AdminRecentActivity from "@/components/admin-dashboard/AdminRecentActivity";
import AdminHealthScore from "@/components/admin-dashboard/AdminHealthScore";
import AdminAgenda from "@/components/admin-dashboard/AdminAgenda";
import SecretaryWorkQueue from "@/components/admin-dashboard/SecretaryWorkQueue";

const AdminDashboard = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const handleRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

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

        {/* Secretary dynamic content: metrics, alerts, work queue, health chart */}
        <SecretaryWorkQueue
          externalModalOpen={modalOpen}
          onExternalModalChange={setModalOpen}
        />

        <DashboardCharts />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <AdminRecentActivity />
          <AdminHealthScore avgFrequency={86} avgGrade={7.1} pendingCount={18} />
          <div id="agenda-section"><AdminAgenda /></div>
        </div>
      </div>
    </RoleLayout>
  );
};

export default AdminDashboard;

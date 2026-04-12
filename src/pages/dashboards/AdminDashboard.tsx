import { useState, useCallback } from "react";
import RoleLayout from "@/components/layout/RoleLayout";
import DashboardHeader from "@/components/admin-dashboard/DashboardHeader";
import MetricCards, { type DashboardMetrics } from "@/components/admin-dashboard/MetricCards";
import OperationalPriorities from "@/components/admin-dashboard/OperationalPriorities";
import SmartAlerts from "@/components/admin-dashboard/SmartAlerts";
import DashboardCharts from "@/components/admin-dashboard/DashboardCharts";
import QuickActions from "@/components/admin-dashboard/QuickActions";
import AdminRecentActivity from "@/components/admin-dashboard/AdminRecentActivity";
import AdminHealthScore from "@/components/admin-dashboard/AdminHealthScore";
import AdminAgenda from "@/components/admin-dashboard/AdminAgenda";

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

  const handleRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <RoleLayout title="Dashboard">
      <div className="flex flex-col gap-6" key={refreshKey}>
        {/* 1. Header */}
        <DashboardHeader
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          onDataRefresh={handleRefresh}
        />

        {/* 2. Metric Cards */}
        <MetricCards metrics={MOCK_METRICS} />

        {/* 3. Operational: Priorities + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3">
            <OperationalPriorities />
          </div>
          <div className="lg:col-span-2">
            <SmartAlerts />
          </div>
        </div>

        {/* 4. Charts */}
        <DashboardCharts />

        {/* 5. Quick Actions */}
        <QuickActions />

        {/* 6. Bottom: Activity + Health + Agenda */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <AdminRecentActivity />
          <AdminHealthScore avgFrequency={86} avgGrade={7.1} pendingCount={18} />
          <AdminAgenda />
        </div>
      </div>
    </RoleLayout>
  );
};

export default AdminDashboard;

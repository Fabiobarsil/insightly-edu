import { useState, useCallback } from "react";
import RoleLayout from "@/components/layout/RoleLayout";
import DashboardHeader from "@/components/admin-dashboard/DashboardHeader";
import MetricCards, { type DashboardMetrics } from "@/components/admin-dashboard/MetricCards";
import DashboardCharts from "@/components/admin-dashboard/DashboardCharts";
import SmartAlerts from "@/components/admin-dashboard/SmartAlerts";
import StudentTable from "@/components/admin-dashboard/StudentTable";

const MOCK_METRICS: DashboardMetrics = {
  total: 188,
  approved: 152,
  failed: 18,
  pending: 18,
};

const AdminDashboard = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <RoleLayout title="Dashboard">
      <div className="flex flex-col gap-6" key={refreshKey}>
        <DashboardHeader
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          onDataRefresh={handleRefresh}
        />
        <MetricCards metrics={MOCK_METRICS} />
        <DashboardCharts />
        <SmartAlerts metrics={MOCK_METRICS} />
        <StudentTable />
      </div>
    </RoleLayout>
  );
};

export default AdminDashboard;

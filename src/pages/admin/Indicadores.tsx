import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import RoleLayout from "@/components/layout/RoleLayout";
import DashboardHeader from "@/components/admin-dashboard/DashboardHeader";
import TopMetricCards from "@/components/admin-dashboard/TopMetricCards";
import DashboardCharts from "@/components/admin-dashboard/DashboardCharts";
import AdminHealthScore from "@/components/admin-dashboard/AdminHealthScore";
import AdminRecentActivity from "@/components/admin-dashboard/AdminRecentActivity";

const Indicadores = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <RoleLayout title="Indicadores">
      <div className="flex flex-col gap-6" key={refreshKey}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Secretaria Digital
            </button>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Indicadores</h2>
            <p className="text-sm text-muted-foreground mt-1">Métricas, gráficos e histórico de atividades</p>
          </div>
          <DashboardHeader
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            onDataRefresh={handleRefresh}
          />
        </div>

        <TopMetricCards />
        <DashboardCharts />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AdminRecentActivity />
          <AdminHealthScore avgFrequency={86} avgGrade={7.1} pendingCount={18} />
        </div>
      </div>
    </RoleLayout>
  );
};

export default Indicadores;

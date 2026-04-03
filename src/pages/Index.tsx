import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import KpiCards from "@/components/dashboard/KpiCards";
import Priorities from "@/components/dashboard/Priorities";
import Alerts from "@/components/dashboard/Alerts";
import Charts from "@/components/dashboard/Charts";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import HealthScore from "@/components/dashboard/HealthScore";
import Agenda from "@/components/dashboard/Agenda";
import FilterBar from "@/components/dashboard/FilterBar";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import { DashboardFilterProvider, useDashboardFilter } from "@/contexts/DashboardFilterContext";

const DashboardContent = () => {
  const { isLoading } = useDashboardFilter();

  return (
    <div className="max-w-[1200px] p-8 max-[900px]:p-5 flex flex-col gap-8">
      <FilterBar />
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <KpiCards />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <Priorities />
            </div>
            <div className="lg:col-span-2">
              <Alerts />
            </div>
          </div>
          <Charts />
          <QuickActions />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivity />
            <HealthScore />
          </div>
        </>
      )}
    </div>
  );
};

const Index = () => (
  <div className="flex min-h-screen max-[900px]:flex-col">
    <Sidebar />
    <main className="ml-60 w-[calc(100%-240px)] min-h-screen max-[900px]:ml-0 max-[900px]:w-full">
      <Topbar />
      <DashboardFilterProvider>
        <DashboardContent />
      </DashboardFilterProvider>
    </main>
  </div>
);

export default Index;

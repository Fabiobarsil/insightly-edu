import { useEffect, useState } from "react";
import RoleLayout from "@/components/layout/RoleLayout";
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
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Student {
  id: string;
  full_name: string;
  status: string | null;
  birth_date: string | null;
}

const StudentsList = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchStudents = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("students").select("*");
      if (error) {
        setError(error.message);
      } else {
        setStudents(data || []);
      }
      setLoading(false);
    };
    fetchStudents();
  }, [user]);

  if (loading) return <div className="bg-card border border-border/60 rounded-xl p-6"><p className="text-muted-foreground text-sm">Carregando alunos...</p></div>;
  if (error) return <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6"><p className="text-destructive text-sm font-medium">Erro: {error}</p></div>;

  return (
    <div className="bg-card border border-border/60 rounded-xl">
      <div className="p-4 border-b border-border/40">
        <h2 className="text-base font-bold text-foreground">Alunos cadastrados ({students.length})</h2>
      </div>
      {students.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground text-sm">Nenhum aluno encontrado.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Nascimento</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-border/20 hover:bg-accent/40 transition-colors">
                  <td className="px-4 py-3 text-foreground font-medium">{s.full_name}</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{s.status || "—"}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{s.birth_date || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const DashboardContent = () => {
  const { isLoading } = useDashboardFilter();
  return (
    <div className="flex flex-col gap-8">
      <FilterBar />
      <StudentsList />
      {isLoading ? <DashboardSkeleton /> : (
        <>
          <KpiCards />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3"><Priorities /></div>
            <div className="lg:col-span-2"><Alerts /></div>
          </div>
          <Charts />
          <QuickActions />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RecentActivity />
            <HealthScore />
            <Agenda />
          </div>
        </>
      )}
    </div>
  );
};

const AdminDashboard = () => (
  <RoleLayout title="Administração">
    <DashboardFilterProvider>
      <DashboardContent />
    </DashboardFilterProvider>
  </RoleLayout>
);

export default AdminDashboard;

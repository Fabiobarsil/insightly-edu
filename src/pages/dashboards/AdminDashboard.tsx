import { useEffect, useState, useMemo } from "react";
import RoleLayout from "@/components/layout/RoleLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolId } from "@/hooks/useSchoolId";
import { Phone, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import KpiCards from "@/components/dashboard/KpiCards";
import Priorities from "@/components/dashboard/Priorities";
import Alerts from "@/components/dashboard/Alerts";
import RecentActivity from "@/components/dashboard/RecentActivity";
import HealthScore from "@/components/dashboard/HealthScore";
import Charts from "@/components/dashboard/Charts";
import Agenda from "@/components/dashboard/Agenda";

interface VwStudent {
  id: string | null;
  full_name: string | null;
  photo_url: string | null;
  media: number | null;
  status_nota: string | null;
  status_frequencia: string | null;
}

const BADGE_CLASSES: Record<string, string> = {
  "OK": "bg-secondary/15 text-secondary",
  "BAIXO DESEMPENHO": "bg-destructive/15 text-destructive",
  "CRITICO": "bg-destructive/15 text-destructive animate-pulse",
  "SEM NOTA": "bg-muted/15 text-muted-foreground",
  "REGULAR": "bg-warning/15 text-warning-foreground",
  "ATENCAO": "bg-warning/15 text-warning-foreground",
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const { schoolId } = useSchoolId();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<VwStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<VwStudent | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from("vw_student_performance").select("*");
      if (data) setStudents(data as VwStudent[]);
      setLoading(false);
    };
    load();
  }, [user, schoolId]);

  const medals = ["🥇", "🥈", "🥉"];

  const top10 = useMemo(
    () => [...students].filter(s => s.media != null).sort((a, b) => (b.media ?? 0) - (a.media ?? 0)).slice(0, 10),
    [students]
  );

  const whatsappLink = (name: string) =>
    `https://wa.me/?text=${encodeURIComponent(`Aluno ${name} em situação de atenção acadêmica. Favor entrar em contato com a escola.`)}`;

  if (loading) {
    return (
      <RoleLayout title="Dashboard">
        <div className="flex flex-col gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-card rounded-2xl animate-pulse border border-border/40" />
          ))}
        </div>
      </RoleLayout>
    );
  }

  return (
    <RoleLayout title="Dashboard">
      <div className="flex flex-col gap-6">
        {/* KPIs */}
        <KpiCards />

        {/* Prioridades + Alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3">
            <Priorities />
          </div>
          <div className="lg:col-span-2">
            <Alerts />
          </div>
        </div>

        {/* Gráficos */}
        <Charts />

        {/* Atividade Recente + Saúde da Escola + Agenda */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <RecentActivity />
          <HealthScore />
          <Agenda />
        </div>

        {/* TOP 10 */}
        <div className="bg-card border border-border/50 rounded-2xl certus-shadow">
          <div className="p-5 border-b border-border/40 flex items-center justify-between">
            <h3 className="text-sm font-bold text-primary">🏆 Top 10 — Melhor Desempenho</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">#</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Aluno</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Média</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Nota</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Frequência</th>
                  <th className="text-right px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {top10.map((s, i) => (
                  <tr
                    key={s.id}
                    className="border-b border-border/20 hover:bg-accent/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedStudent(s)}
                  >
                    <td className="px-5 py-3 text-lg">{i < 3 ? medals[i] : <span className="text-muted-foreground text-sm">{i + 1}</span>}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {s.photo_url ? (
                          <img src={s.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {(s.full_name ?? "?")[0]}
                          </div>
                        )}
                        <span className="font-medium text-foreground">{s.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-bold text-primary">{s.media?.toFixed(1) ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", BADGE_CLASSES[s.status_nota ?? ""] ?? "bg-muted/10 text-muted-foreground")}>
                        {s.status_nota ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", BADGE_CLASSES[s.status_frequencia ?? ""] ?? "bg-muted/10 text-muted-foreground")}>
                        {s.status_frequencia ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ChevronRight className="w-4 h-4 text-muted-foreground inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL PERFIL RÁPIDO */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary">Perfil do Aluno</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="flex flex-col items-center gap-4 py-4">
              {selectedStudent.photo_url ? (
                <img src={selectedStudent.photo_url} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-primary/10" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                  {(selectedStudent.full_name ?? "?")[0]}
                </div>
              )}
              <h3 className="text-lg font-bold text-foreground">{selectedStudent.full_name}</h3>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{selectedStudent.media?.toFixed(1) ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">Média</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {selectedStudent.status_nota && (
                  <span className={cn("text-xs font-bold px-3 py-1 rounded-full", BADGE_CLASSES[selectedStudent.status_nota] ?? "bg-muted/10 text-muted-foreground")}>
                    Nota: {selectedStudent.status_nota}
                  </span>
                )}
                {selectedStudent.status_frequencia && (
                  <span className={cn("text-xs font-bold px-3 py-1 rounded-full", BADGE_CLASSES[selectedStudent.status_frequencia] ?? "bg-muted/10 text-muted-foreground")}>
                    Freq: {selectedStudent.status_frequencia}
                  </span>
                )}
              </div>
              <a
                href={whatsappLink(selectedStudent.full_name ?? "")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-secondary/90 transition-colors mt-2"
              >
                <Phone className="w-4 h-4" /> Chamar no WhatsApp
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </RoleLayout>
  );
};

export default AdminDashboard;

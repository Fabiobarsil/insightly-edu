import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface KpiData {
  totalStudents: number;
  avgAttendance: number;
  studentsAtRisk: number;
  pendingDocs: number;
}

const KpiCards = () => {
  const [data, setData] = useState<KpiData>({ totalStudents: 0, avgAttendance: 0, studentsAtRisk: 0, pendingDocs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [studentsRes, perfRes, docsRes, attendanceRes] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("vw_student_performance").select("*"),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("status", "pendente"),
        supabase.from("attendance").select("status"),
      ]);

      const totalStudents = studentsRes.count ?? 0;
      const pendingDocs = docsRes.count ?? 0;

      const perf = perfRes.data ?? [];
      const studentsAtRisk = perf.filter(
        (s) => s.status_nota === "BAIXO DESEMPENHO" || s.status_frequencia === "CRITICO"
      ).length;

      const attData = attendanceRes.data ?? [];
      const present = attData.filter((a) => a.status === "presente").length;
      const avgAttendance = attData.length > 0 ? (present / attData.length) * 100 : 0;

      setData({ totalStudents, avgAttendance, studentsAtRisk, pendingDocs });
      setLoading(false);
    };
    fetch();
  }, []);

  const kpis = [
    {
      label: "Alunos Ativos",
      value: loading ? "..." : data.totalStudents.toLocaleString("pt-BR"),
      trend: loading ? "" : `${data.totalStudents > 0 ? "↑" : "—"}`,
      trendLabel: "este mês",
      icon: "ri-group-line",
      trendUp: true,
      accent: "bg-secondary/10 text-secondary",
    },
    {
      label: "Frequência Média",
      value: loading ? "..." : `${data.avgAttendance.toFixed(1)}%`,
      trend: loading ? "" : data.avgAttendance >= 90 ? "↑ Boa" : data.avgAttendance >= 75 ? "→ Regular" : "↓ Baixa",
      trendLabel: "geral",
      icon: "ri-calendar-check-line",
      trendUp: data.avgAttendance >= 75,
      accent: data.avgAttendance >= 90 ? "bg-secondary/10 text-secondary" : data.avgAttendance >= 75 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500",
    },
    {
      label: "Alunos em Risco",
      value: loading ? "..." : String(data.studentsAtRisk),
      trend: loading ? "" : data.studentsAtRisk > 0 ? `⚠ ${data.studentsAtRisk}` : "✓ Nenhum",
      trendLabel: "risco acadêmico",
      icon: "ri-alert-line",
      trendUp: data.studentsAtRisk === 0,
      accent: data.studentsAtRisk > 5 ? "bg-red-50 text-red-500" : data.studentsAtRisk > 0 ? "bg-amber-50 text-amber-600" : "bg-secondary/10 text-secondary",
    },
    {
      label: "Documentos Pendentes",
      value: loading ? "..." : String(data.pendingDocs),
      trend: loading ? "" : data.pendingDocs > 0 ? `${data.pendingDocs} pendentes` : "✓ Em dia",
      trendLabel: "aguardando",
      icon: "ri-file-warning-line",
      trendUp: data.pendingDocs === 0,
      accent: data.pendingDocs > 10 ? "bg-red-50 text-red-500" : data.pendingDocs > 0 ? "bg-amber-50 text-amber-600" : "bg-secondary/10 text-secondary",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {kpis.map((kpi) => (
        <button
          key={kpi.label}
          onClick={() => toast.info(`Navegando para: ${kpi.label}`)}
          className="bg-card border border-border/60 rounded-xl p-5 certus-shadow text-left transition-all duration-200 hover:shadow-lg hover:border-secondary/40 hover:-translate-y-0.5 cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-lg ${kpi.accent} transition-transform duration-200 group-hover:scale-110`}>
              <i className={kpi.icon} />
            </div>
            <span className={`text-xs font-semibold flex items-center gap-1 ${kpi.trendUp ? "text-secondary" : "text-destructive"}`}>
              {kpi.trend}
            </span>
          </div>
          <p className="text-2xl font-bold text-primary">{kpi.value}</p>
          <p className="text-xs text-muted mt-1">{kpi.label}</p>
          <p className="text-[11px] text-muted/60 mt-0.5">{kpi.trendLabel}</p>
        </button>
      ))}
    </div>
  );
};

export default KpiCards;

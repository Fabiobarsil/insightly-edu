import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { FileText, Activity, CheckCircle2, Heart } from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const TopMetricCards = () => {
  const { schoolId } = useSchoolId();

  const { data: requests = [] } = useQuery({
    queryKey: ["top-dashboard-metrics", schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secretary_requests")
        .select("status, created_at")
        .eq("school_id", schoolId!);
      if (error) {
        console.error("[ERROR][DASHBOARD_TOP]", error);
        throw error;
      }
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  const metrics = useMemo(() => {
    const total = requests.length;
    const ativos = requests.filter(
      (r) => r.status === "em andamento" || r.status === "em_andamento"
    ).length;
    const resolvidos = requests.filter(
      (r) => r.status === "concluido" || r.status === "resolvido"
    ).length;
    const satisfacao = total === 0 ? 0 : Math.round((resolvidos / total) * 100);

    // Sparkline: count per day last 7 days
    const now = new Date();
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }

    const countByDay: Record<string, number> = {};
    requests.forEach((r) => {
      const day = r.created_at?.slice(0, 10);
      if (day) countByDay[day] = (countByDay[day] || 0) + 1;
    });

    const resolvedByDay: Record<string, number> = {};
    requests
      .filter((r) => r.status === "concluido" || r.status === "resolvido")
      .forEach((r) => {
        const day = r.created_at?.slice(0, 10);
        if (day) resolvedByDay[day] = (resolvedByDay[day] || 0) + 1;
      });

    const activeByDay: Record<string, number> = {};
    requests
      .filter((r) => r.status === "em andamento" || r.status === "em_andamento")
      .forEach((r) => {
        const day = r.created_at?.slice(0, 10);
        if (day) activeByDay[day] = (activeByDay[day] || 0) + 1;
      });

    const totalSeries = days.map((d) => ({ day: d, value: countByDay[d] || 0 }));
    const activeSeries = days.map((d) => ({ day: d, value: activeByDay[d] || 0 }));
    const resolvedSeries = days.map((d) => ({ day: d, value: resolvedByDay[d] || 0 }));

    return { total, ativos, resolvidos, satisfacao, totalSeries, activeSeries, resolvedSeries };
  }, [requests]);

  const cards = [
    {
      title: "Total de Solicitações",
      value: metrics.total,
      icon: FileText,
      color: "#6366F1",
      gradient: "from-indigo-500/10 to-indigo-500/5",
      borderColor: "border-indigo-500/20",
      iconBg: "bg-indigo-500/15 text-indigo-600",
      series: metrics.totalSeries,
      chartColor: "#6366F1",
    },
    {
      title: "Atendimentos Ativos",
      value: metrics.ativos,
      icon: Activity,
      color: "#F59E0B",
      gradient: "from-amber-500/10 to-amber-500/5",
      borderColor: "border-amber-500/20",
      iconBg: "bg-amber-500/15 text-amber-600",
      series: metrics.activeSeries,
      chartColor: "#F59E0B",
    },
    {
      title: "Resolvidos",
      value: metrics.resolvidos,
      icon: CheckCircle2,
      color: "#22C55E",
      gradient: "from-emerald-500/10 to-emerald-500/5",
      borderColor: "border-emerald-500/20",
      iconBg: "bg-emerald-500/15 text-emerald-600",
      series: metrics.resolvedSeries,
      chartColor: "#22C55E",
    },
  ];

  // Gauge data for satisfaction
  const gaugeData = [
    { value: metrics.satisfacao, color: "#22C55E" },
    { value: 100 - metrics.satisfacao, color: "hsl(var(--muted))" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`relative bg-card rounded-2xl border ${card.borderColor} bg-gradient-to-br ${card.gradient} p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
              <card.icon className="h-4 w-4" />
            </div>
            <p className="text-xs font-medium text-muted-foreground">{card.title}</p>
          </div>
          <div className="flex items-end justify-between gap-2">
            <p className="text-3xl font-bold tracking-tight text-foreground">{card.value}</p>
            <div className="w-24 h-10 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={card.series}>
                  <defs>
                    <linearGradient id={`grad-${card.title}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={card.chartColor} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={card.chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={card.chartColor}
                    strokeWidth={2}
                    fill={`url(#grad-${card.title})`}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ))}

      {/* Satisfaction gauge card */}
      <div className="relative bg-card rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-rose-500/5 p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-500/15 text-rose-600">
            <Heart className="h-4 w-4" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">Satisfação</p>
        </div>
        <div className="flex items-end justify-between gap-2">
          <p className="text-3xl font-bold tracking-tight text-foreground">{metrics.satisfacao}%</p>
          <div className="w-12 h-12 shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={16}
                  outerRadius={22}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  {gaugeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopMetricCards;

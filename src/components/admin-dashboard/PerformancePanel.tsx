import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp, FileCheck2, CheckCircle2, Clock, Users } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = {
  open: "hsl(var(--primary))",
  done: "hsl(142 71% 45%)", // emerald-500
  pending: "hsl(38 92% 50%)", // amber-500
  ok: "hsl(142 71% 45%)",
};

const PerformancePanel = () => {
  const { schoolId } = useSchoolId();

  const { data } = useQuery({
    queryKey: ["secretary-performance", schoolId],
    queryFn: async () => {
      if (!schoolId) return null;

      const since = subDays(startOfDay(new Date()), 6).toISOString();

      const [reqsRes, docsRes, studentsRes] = await Promise.all([
        supabase
          .from("secretary_requests")
          .select("id, status, created_at, updated_at")
          .eq("school_id", schoolId)
          .gte("created_at", since),
        supabase
          .from("documents")
          .select("id, status")
          .eq("school_id", schoolId),
        supabase
          .from("students")
          .select("id", { count: "exact", head: true })
          .eq("school_id", schoolId)
          .eq("status", "ativo"),
      ]);

      // Build 7-day series
      const days = Array.from({ length: 7 }).map((_, i) => {
        const d = subDays(startOfDay(new Date()), 6 - i);
        return {
          key: format(d, "yyyy-MM-dd"),
          label: format(d, "EEE", { locale: ptBR }),
          abertas: 0,
          concluidas: 0,
        };
      });
      const map = new Map(days.map((d) => [d.key, d]));

      (reqsRes.data ?? []).forEach((r) => {
        const created = r.created_at ? format(new Date(r.created_at), "yyyy-MM-dd") : null;
        if (created && map.has(created)) {
          map.get(created)!.abertas += 1;
        }
        if (r.status === "concluido" && r.updated_at) {
          const upd = format(new Date(r.updated_at), "yyyy-MM-dd");
          if (map.has(upd)) {
            map.get(upd)!.concluidas += 1;
          }
        }
      });

      const docs = docsRes.data ?? [];
      const docOk = docs.filter((d) => d.status === "ok" || d.status === "entregue").length;
      const docPending = docs.filter((d) => d.status === "pendente").length;

      // Timeline metrics
      const totalDone = (reqsRes.data ?? []).filter((r) => r.status === "concluido").length;
      const respTimes = (reqsRes.data ?? [])
        .filter((r) => r.status === "concluido" && r.created_at && r.updated_at)
        .map((r) => new Date(r.updated_at!).getTime() - new Date(r.created_at!).getTime());
      const avgMs = respTimes.length
        ? respTimes.reduce((a, b) => a + b, 0) / respTimes.length
        : 0;
      const avgHours = avgMs / (1000 * 60 * 60);

      return {
        series: Array.from(map.values()),
        donut: [
          { name: "OK", value: docOk },
          { name: "Pendentes", value: docPending },
        ],
        milestones: {
          activeStudents: studentsRes.count ?? 0,
          completedWeek: totalDone,
          avgResponse:
            avgHours < 1
              ? `${Math.max(1, Math.round(avgMs / 60000))} min`
              : `${avgHours.toFixed(1)} h`,
          docOk,
          docPending,
        },
      };
    },
    enabled: !!schoolId,
  });

  const series = data?.series ?? [];
  const donut = data?.donut ?? [];
  const m = data?.milestones;

  return (
    <section className="bg-card border border-border/60 rounded-xl p-5 shadow-sm">
      <header className="mb-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Panorama de Performance
        </h3>
        <p className="text-xs text-muted-foreground">
          Visão dos últimos 7 dias — operação e saúde documental
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Linha: Solicitações abertas vs concluídas */}
        <div className="rounded-lg bg-muted/20 border border-border/40 p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Evolução de Solicitações
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 5, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                <Line
                  type="monotone"
                  dataKey="abertas"
                  name="Abertas"
                  stroke={COLORS.open}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="concluidas"
                  name="Concluídas"
                  stroke={COLORS.done}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut: Saúde documental */}
        <div className="rounded-lg bg-muted/20 border border-border/40 p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Saúde Documental
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donut.length && donut.some((d) => d.value > 0) ? donut : [{ name: "Sem dados", value: 1 }]}
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {(donut.length && donut.some((d) => d.value > 0) ? donut : [{ name: "Sem dados", value: 1 }]).map(
                    (entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.name === "OK"
                            ? COLORS.ok
                            : entry.name === "Pendentes"
                            ? COLORS.pending
                            : "hsl(var(--muted))"
                        }
                      />
                    )
                  )}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Timeline da semana */}
      <div className="mt-5 pt-5 border-t border-border/40">
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Marcos da Semana
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-start gap-2.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 p-3">
            <span className="w-7 h-7 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
              <Users className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground tabular-nums">
                {m?.activeStudents ?? 0}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Alunos ativos
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 p-3">
            <span className="w-7 h-7 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground tabular-nums">
                {m?.completedWeek ?? 0}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Concluídas (7d)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg bg-violet-50 dark:bg-violet-500/10 p-3">
            <span className="w-7 h-7 rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-300 flex items-center justify-center shrink-0">
              <Clock className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground tabular-nums">
                {m?.avgResponse ?? "—"}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Tempo médio resp.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 p-3">
            <span className="w-7 h-7 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
              <FileCheck2 className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground tabular-nums">
                {m?.docOk ?? 0}/{(m?.docOk ?? 0) + (m?.docPending ?? 0)}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Documentos ok
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PerformancePanel;

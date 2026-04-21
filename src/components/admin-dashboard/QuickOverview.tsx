import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { FileText, MessageSquare, GraduationCap, UserX, TrendingUp, BarChart3, Layers, Flame } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface KpiData {
  docsPending: number;
  docsResolved: number;
  requestsOpen: number;
  requestsDone: number;
  enrollmentsPending: number;
  studentsWithIssues: number;
}

interface TrendPoint {
  day: string;
  solicitacoes: number;
  documentos: number;
}

interface ClassBar {
  turma: string;
  abertas: number;
  concluidas: number;
}

interface HeatCell {
  turma: string;
  dia: string;
  value: number;
}

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex"];

const QuickOverview = () => {
  const { schoolId } = useSchoolId();
  const navigate = useNavigate();
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [byClass, setByClass] = useState<ClassBar[]>([]);
  const [heat, setHeat] = useState<HeatCell[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;

    const fetchAll = async () => {
      try {
        // KPIs
        const [docsP, docsR, reqOpen, reqDone, enrollP, studentsIssues] = await Promise.all([
          supabase.from("documents").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("status", "pendente"),
          supabase.from("documents").select("id", { count: "exact", head: true }).eq("school_id", schoolId).in("status", ["resolvido", "entregue", "aprovado"]),
          supabase.from("secretary_requests").select("id", { count: "exact", head: true }).eq("school_id", schoolId).in("status", ["aberto", "em_andamento"]),
          supabase.from("secretary_requests").select("id", { count: "exact", head: true }).eq("school_id", schoolId).in("status", ["concluido", "resolvido"]),
          supabase.from("student_enrollments").select("id", { count: "exact", head: true }).eq("school_id", schoolId).is("class_id", null),
          supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", schoolId).in("status", ["incompleto", "irregular"]),
        ]);

        setKpi({
          docsPending: docsP.count ?? 0,
          docsResolved: docsR.count ?? 0,
          requestsOpen: reqOpen.count ?? 0,
          requestsDone: reqDone.count ?? 0,
          enrollmentsPending: enrollP.count ?? 0,
          studentsWithIssues: studentsIssues.count ?? 0,
        });

        // Tendência (últimos 14 dias) — solicitações + documentos
        const since = new Date();
        since.setDate(since.getDate() - 13);
        const sinceIso = since.toISOString();

        const [reqRows, docRows] = await Promise.all([
          supabase.from("secretary_requests").select("created_at").eq("school_id", schoolId).gte("created_at", sinceIso),
          supabase.from("documents").select("created_at").eq("school_id", schoolId).gte("created_at", sinceIso),
        ]);

        const buckets: Record<string, { solicitacoes: number; documentos: number }> = {};
        for (let i = 0; i < 14; i++) {
          const d = new Date(since);
          d.setDate(since.getDate() + i);
          const key = d.toISOString().slice(5, 10); // MM-DD
          buckets[key] = { solicitacoes: 0, documentos: 0 };
        }
        (reqRows.data ?? []).forEach((r: any) => {
          const k = (r.created_at ?? "").slice(5, 10);
          if (buckets[k]) buckets[k].solicitacoes += 1;
        });
        (docRows.data ?? []).forEach((r: any) => {
          const k = (r.created_at ?? "").slice(5, 10);
          if (buckets[k]) buckets[k].documentos += 1;
        });
        setTrend(Object.entries(buckets).map(([day, v]) => ({ day, ...v })));

        // Comparação por turma — solicitações abertas vs concluídas
        const { data: reqs } = await supabase
          .from("secretary_requests")
          .select("status, class_id, classes(name)")
          .eq("school_id", schoolId)
          .not("class_id", "is", null);

        const classMap: Record<string, ClassBar> = {};
        (reqs ?? []).forEach((r: any) => {
          const name = r.classes?.name ?? "—";
          if (!classMap[name]) classMap[name] = { turma: name, abertas: 0, concluidas: 0 };
          if (["aberto", "em_andamento"].includes(r.status)) classMap[name].abertas += 1;
          if (["concluido", "resolvido"].includes(r.status)) classMap[name].concluidas += 1;
        });
        const bars = Object.values(classMap).slice(0, 6);
        setByClass(bars);
        setClasses(bars.map((b) => b.turma));

        // Heatmap — solicitações por turma x dia da semana (últimos 30 dias)
        const since30 = new Date();
        since30.setDate(since30.getDate() - 30);
        const { data: heatRows } = await supabase
          .from("secretary_requests")
          .select("created_at, class_id, classes(name)")
          .eq("school_id", schoolId)
          .gte("created_at", since30.toISOString())
          .not("class_id", "is", null);

        const cells: Record<string, number> = {};
        (heatRows ?? []).forEach((r: any) => {
          const name = r.classes?.name ?? "—";
          const d = new Date(r.created_at);
          const dow = d.getDay(); // 0..6
          if (dow === 0 || dow === 6) return;
          const dia = DAYS[dow - 1];
          const k = `${name}__${dia}`;
          cells[k] = (cells[k] ?? 0) + 1;
        });
        const heatList: HeatCell[] = [];
        bars.forEach((b) => {
          DAYS.forEach((d) => {
            heatList.push({ turma: b.turma, dia: d, value: cells[`${b.turma}__${d}`] ?? 0 });
          });
        });
        setHeat(heatList);
      } catch (err) {
        console.error("[QuickOverview] error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [schoolId]);

  if (!schoolId) return null;

  const kpiCards = [
    { icon: FileText, label: "Docs pendentes", value: kpi?.docsPending ?? 0, sub: `${kpi?.docsResolved ?? 0} resolvidos`, tone: "warning", action: () => navigate("/admin/documentos") },
    { icon: MessageSquare, label: "Solic. abertas", value: kpi?.requestsOpen ?? 0, sub: `${kpi?.requestsDone ?? 0} concluídas`, tone: "warning", action: () => navigate("/admin/dashboard") },
    { icon: GraduationCap, label: "Matrículas incompletas", value: kpi?.enrollmentsPending ?? 0, sub: "sem turma", tone: "info", action: () => navigate("/admin/alunos") },
    { icon: UserX, label: "Alunos c/ pendências", value: kpi?.studentsWithIssues ?? 0, sub: "irregulares", tone: "danger", action: () => navigate("/admin/alunos") },
  ];

  const toneText = (t: string) =>
    t === "warning" ? "text-amber-600 dark:text-amber-500"
    : t === "danger" ? "text-red-600 dark:text-red-500"
    : t === "success" ? "text-emerald-600 dark:text-emerald-500"
    : "text-primary";

  // Heatmap intensity
  const maxHeat = Math.max(1, ...heat.map((h) => h.value));
  const heatColor = (v: number) => {
    if (v === 0) return "hsl(var(--muted))";
    const alpha = 0.15 + (v / maxHeat) * 0.85;
    return `hsl(var(--primary) / ${alpha.toFixed(2)})`;
  };

  return (
    <Card className="p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Visão Rápida da Secretaria</h3>
        <p className="text-xs text-muted-foreground">KPIs, tendências e padrões operacionais</p>
      </div>

      {/* 1. KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {kpiCards.map((k, i) => {
          const Icon = k.icon;
          return (
            <button
              key={i}
              onClick={k.action}
              className="text-left rounded-lg border border-border bg-background hover:bg-accent/50 hover:border-primary/40 transition p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{k.label}</span>
              </div>
              <div className={`text-2xl font-bold tabular-nums ${toneText(k.tone)}`}>
                {loading ? "—" : k.value}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</div>
            </button>
          );
        })}
      </div>

      {/* 2 & 3. Linha + Barras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Tendência */}
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Tendência (14 dias)</h4>
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="solicitacoes" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="documentos" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Barras empilhadas — comparação por turma */}
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Solicitações por turma</h4>
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byClass} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="turma" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="abertas" stackId="a" fill="hsl(var(--primary))" />
                <Bar dataKey="concluidas" stackId="a" fill="hsl(var(--muted-foreground) / 0.5)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Heatmap */}
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Padrão semanal — solicitações por turma x dia</h4>
        </div>
        {classes.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">Sem dados suficientes nos últimos 30 dias.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="inline-grid gap-1" style={{ gridTemplateColumns: `100px repeat(${DAYS.length}, minmax(56px, 1fr))` }}>
              <div />
              {DAYS.map((d) => (
                <div key={d} className="text-[10px] font-medium text-muted-foreground text-center uppercase">{d}</div>
              ))}
              {classes.map((turma) => (
                <>
                  <div key={`label-${turma}`} className="text-xs text-foreground truncate pr-2 flex items-center">{turma}</div>
                  {DAYS.map((d) => {
                    const cell = heat.find((h) => h.turma === turma && h.dia === d);
                    const v = cell?.value ?? 0;
                    return (
                      <div
                        key={`${turma}-${d}`}
                        title={`${turma} · ${d}: ${v}`}
                        className="h-8 rounded flex items-center justify-center text-[11px] font-medium"
                        style={{
                          background: heatColor(v),
                          color: v > maxHeat * 0.5 ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                        }}
                      >
                        {v > 0 ? v : ""}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default QuickOverview;

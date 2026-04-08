import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import RoleLayout from "@/components/layout/RoleLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolId } from "@/hooks/useSchoolId";
import {
  Users, TrendingUp, AlertTriangle, Clock, FileQuestion,
  Medal, Phone, X, ChevronRight, FileText
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface VwStudent {
  id: string | null;
  full_name: string | null;
  photo_url: string | null;
  media: number | null;
  status_nota: string | null;
  status_frequencia: string | null;
}

interface PendingDoc {
  full_name: string;
  doc_name: string | null;
  due_date: string | null;
  status: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  "OK": "hsl(142, 71%, 45%)",
  "BAIXO DESEMPENHO": "hsl(0, 84%, 60%)",
  "SEM NOTA": "hsl(215, 16%, 47%)",
  "CRITICO": "hsl(0, 84%, 45%)",
  "REGULAR": "hsl(48, 96%, 53%)",
  "ATENCAO": "hsl(48, 96%, 53%)",
};

const BADGE_CLASSES: Record<string, string> = {
  "OK": "bg-secondary/15 text-secondary",
  "BAIXO DESEMPENHO": "bg-destructive/15 text-destructive",
  "CRITICO": "bg-destructive/15 text-destructive animate-pulse",
  "SEM NOTA": "bg-muted/15 text-muted-foreground",
  "REGULAR": "bg-warning/15 text-warning-foreground",
  "ATENCAO": "bg-warning/15 text-warning-foreground",
};

const formatDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const { schoolId } = useSchoolId();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<VwStudent[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [schoolName, setSchoolName] = useState("Escola");
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<VwStudent | null>(null);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);

      const [perfRes, schoolRes, countRes, docsRes] = await Promise.all([
        supabase.from("vw_student_performance").select("*"),
        schoolId
          ? supabase.from("schools").select("name").eq("id", schoolId).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase
          .from("documents")
          .select("student_id, name, due_date, status")
          .or("status.is.null,status.eq.pendente")
          .order("due_date", { ascending: true })
          .limit(20),
      ]);

      if (perfRes.data) setStudents(perfRes.data as VwStudent[]);
      if (schoolRes.data) setSchoolName(schoolRes.data.name);
      setTotalStudents(countRes.count ?? 0);

      // resolve student names for pending docs
      if (docsRes.data && docsRes.data.length > 0) {
        const studentIds = [...new Set(docsRes.data.map(d => d.student_id).filter(Boolean))];
        const { data: stuNames } = await supabase
          .from("students")
          .select("id, full_name")
          .in("id", studentIds as string[]);
        const nameMap = new Map((stuNames ?? []).map(s => [s.id, s.full_name]));
        setPendingDocs(
          docsRes.data.map(d => ({
            full_name: nameMap.get(d.student_id!) ?? "—",
            doc_name: d.name,
            due_date: d.due_date,
            status: d.status,
          }))
        );
      }

      setLoading(false);
    };

    load();
  }, [user, schoolId]);

  // KPIs
  const kpis = useMemo(() => {
    const avg = students.filter(s => s.media != null);
    const avgMedia = avg.length > 0 ? avg.reduce((a, s) => a + (s.media ?? 0), 0) / avg.length : 0;
    const risco = students.filter(s => s.status_nota === "BAIXO DESEMPENHO" || s.status_frequencia === "CRITICO").length;
    const freqCrit = students.filter(s => s.status_frequencia === "CRITICO").length;
    const semDados = students.filter(s => s.media == null).length;

    return [
      { label: "Total de Alunos", value: totalStudents, icon: Users, color: "text-primary", bg: "bg-primary/10" },
      { label: "Média Geral", value: avgMedia.toFixed(1), icon: TrendingUp, color: "text-secondary", bg: "bg-secondary/10" },
      { label: "Alunos em Risco", value: risco, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
      { label: "Frequência Crítica", value: freqCrit, icon: Clock, color: "text-warning-foreground", bg: "bg-warning/10" },
      { label: "Sem Dados", value: semDados, icon: FileQuestion, color: "text-muted-foreground", bg: "bg-muted/10" },
    ];
  }, [students, totalStudents]);

  // Alerts
  const alertStudents = useMemo(
    () => students.filter(s => s.status_nota === "BAIXO DESEMPENHO" || s.status_frequencia === "CRITICO"),
    [students]
  );

  // Chart data
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(s => {
      const key = s.status_nota ?? "SEM NOTA";
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: STATUS_COLORS[name] ?? "hsl(215, 16%, 47%)",
    }));
  }, [students]);

  const freqChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(s => {
      const key = s.status_frequencia ?? "SEM DADOS";
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: STATUS_COLORS[name] ?? "hsl(215, 16%, 47%)",
    }));
  }, [students]);

  // Top 10
  const top10 = useMemo(
    () => [...students].filter(s => s.media != null).sort((a, b) => (b.media ?? 0) - (a.media ?? 0)).slice(0, 10),
    [students]
  );

  const medals = ["🥇", "🥈", "🥉"];

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
      <div className="flex flex-col gap-8">
        {/* HEADER */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">{schoolName}</h1>
            <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <Link
            to="/admin/alunos/novo"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            <i className="ri-add-line" /> Novo Aluno
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-card border border-border/50 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", k.bg)}>
                  <k.icon className={cn("w-5 h-5", k.color)} />
                </div>
              </div>
              <p className={cn("text-3xl font-bold", k.color)}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
            </div>
          ))}
        </div>

        {/* ALERTAS */}
        {alertStudents.length > 0 && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h2 className="text-base font-bold text-destructive">Alunos em Situação Crítica ({alertStudents.length})</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {alertStudents.slice(0, 9).map((s) => (
                <div
                  key={s.id}
                  className="bg-card border border-border/40 rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedStudent(s)}
                >
                  {s.photo_url ? (
                    <img src={s.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground text-sm font-bold">
                      {(s.full_name ?? "?")[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{s.full_name}</p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {s.status_nota && (
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", BADGE_CLASSES[s.status_nota] ?? "bg-muted/10 text-muted-foreground")}>
                          {s.status_nota}
                        </span>
                      )}
                      {s.status_frequencia && s.status_frequencia !== s.status_nota && (
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", BADGE_CLASSES[s.status_frequencia] ?? "bg-muted/10 text-muted-foreground")}>
                          {s.status_frequencia}
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={whatsappLink(s.full_name ?? "")}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center hover:bg-secondary/20 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-secondary" />
                  </a>
                </div>
              ))}
            </div>
            {alertStudents.length > 9 && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                + {alertStudents.length - 9} alunos em situação crítica
              </p>
            )}
          </div>
        )}

        {/* GRÁFICOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-foreground mb-4">Distribuição por Desempenho</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(214, 32%, 91%)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-foreground mb-4">Distribuição por Frequência</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={freqChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(214, 32%, 91%)", fontSize: 12 }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {freqChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP 10 */}
        <div className="bg-card border border-border/50 rounded-2xl">
          <div className="p-5 border-b border-border/40 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">🏆 Top 10 — Melhor Desempenho</h3>
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

        {/* DOCUMENTOS PENDENTES */}
        {pendingDocs.length > 0 && (
          <div className="bg-card border border-border/50 rounded-2xl">
            <div className="p-5 border-b border-border/40 flex items-center gap-2">
              <FileText className="w-4 h-4 text-warning-foreground" />
              <h3 className="text-sm font-bold text-foreground">Documentos Pendentes ({pendingDocs.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Aluno</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Documento</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Prazo</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDocs.map((d, i) => (
                    <tr key={i} className="border-b border-border/20 hover:bg-accent/40 transition-colors">
                      <td className="px-5 py-3 font-medium text-foreground">{d.full_name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{d.doc_name ?? "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(d.due_date)}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-warning/15 text-warning-foreground">
                          Pendente
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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

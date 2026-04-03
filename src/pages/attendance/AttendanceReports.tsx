import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const dataByClass = [
  { turma: "1ºA", frequencia: 94 }, { turma: "2ºA", frequencia: 89 },
  { turma: "3ºA", frequencia: 91 }, { turma: "3ºB", frequencia: 72 },
  { turma: "4ºA", frequencia: 87 }, { turma: "5ºA", frequencia: 96 },
  { turma: "5ºB", frequencia: 78 }, { turma: "6ºA", frequencia: 83 },
];

const dataByMonth = [
  { mes: "Fev", frequencia: 93 }, { mes: "Mar", frequencia: 89 },
  { mes: "Abr", frequencia: 87 }, { mes: "Mai", frequencia: 91 },
  { mes: "Jun", frequencia: 85 }, { mes: "Jul", frequencia: 88 },
];

const AttendanceReports = () => (
  <AppLayout title="Relatórios de Frequência" breadcrumbs={[{ label: "Frequência", href: "/frequencia" }, { label: "Relatórios" }]}>
    <PageHeader title="Relatórios de Frequência" description="Análises e indicadores de presença" />

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {[
        { label: "Frequência Média", value: "87%", icon: "ri-check-double-line", color: "text-secondary" },
        { label: "Alunos Críticos", value: "23", icon: "ri-alert-line", color: "text-destructive" },
        { label: "Aulas Registradas", value: "1.248", icon: "ri-calendar-line", color: "text-primary" },
      ].map((s, i) => (
        <div key={i} className="bg-card border border-border/60 rounded-xl p-4 certus-shadow flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <i className={`${s.icon} text-lg ${s.color}`} />
          </div>
          <div>
            <div className="text-lg font-bold text-primary">{s.value}</div>
            <div className="text-xs text-muted">{s.label}</div>
          </div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
        <h4 className="text-sm font-bold text-primary mb-4">Frequência por Turma</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dataByClass}><CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" /><XAxis dataKey="turma" fontSize={11} /><YAxis domain={[60, 100]} fontSize={11} /><Tooltip /><Bar dataKey="frequencia" fill="hsl(142 71% 45%)" radius={[6,6,0,0]} /></BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
        <h4 className="text-sm font-bold text-primary mb-4">Evolução Mensal</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dataByMonth}><CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" /><XAxis dataKey="mes" fontSize={11} /><YAxis domain={[80, 100]} fontSize={11} /><Tooltip /><Bar dataKey="frequencia" fill="hsl(222 84% 11%)" radius={[6,6,0,0]} /></BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </AppLayout>
);

export default AttendanceReports;

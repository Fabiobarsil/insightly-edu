import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

const distributionData = [
  { serie: "1º Ano", alunos: 42 },
  { serie: "2º Ano", alunos: 38 },
  { serie: "3º Ano", alunos: 35 },
  { serie: "4º Ano", alunos: 40 },
  { serie: "5º Ano", alunos: 33 },
];

const approvalData = [
  { serie: "1º Ano", taxa: 92 },
  { serie: "2º Ano", taxa: 87 },
  { serie: "3º Ano", taxa: 78 },
  { serie: "4º Ano", taxa: 85 },
  { serie: "5º Ano", taxa: 90 },
];

const tooltipStyle = {
  contentStyle: {
    borderRadius: "12px",
    border: "1px solid hsl(var(--border))",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    fontSize: "13px",
    backgroundColor: "hsl(var(--card))",
  },
};

const DashboardCharts = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
    {/* Distribution */}
    <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
      <h3 className="text-sm font-bold text-foreground mb-5">
        Distribuição de Alunos por Série
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={distributionData} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="serie" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="alunos" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Approval Rate */}
    <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
      <h3 className="text-sm font-bold text-foreground mb-5">
        Taxa de Aprovação por Série
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={approvalData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="serie" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} unit="%" />
          <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, "Taxa"]} />
          <Line
            type="monotone"
            dataKey="taxa"
            stroke="hsl(var(--secondary))"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "hsl(var(--secondary))" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default DashboardCharts;

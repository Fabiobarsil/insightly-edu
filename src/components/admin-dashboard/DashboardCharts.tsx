import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { toast } from "sonner";

const frequencyData = [
  { turma: "1ºA", freq: 92 },
  { turma: "2ºB", freq: 87 },
  { turma: "3ºA", freq: 78 },
  { turma: "4ºC", freq: 85 },
  { turma: "5ºB", freq: 90 },
];

const gradeData = [
  { turma: "1ºA", media: 7.8 },
  { turma: "2ºB", media: 6.5 },
  { turma: "3ºA", media: 5.9 },
  { turma: "4ºC", media: 7.2 },
  { turma: "5ºB", media: 8.1 },
];

const distributionData = [
  { name: "Aprovados", value: 152, color: "hsl(var(--secondary))" },
  { name: "Reprovados", value: 18, color: "hsl(var(--destructive))" },
  { name: "Pendentes", value: 18, color: "hsl(var(--warning))" },
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

const DashboardCharts = () => {
  const navigate = useNavigate();

  const handleBarClick = (data: any) => {
    if (data?.turma) {
      toast.info(`Abrindo turma ${data.turma}`);
      navigate("/admin/turmas");
    }
  };

  const handleLineClick = (data: any) => {
    if (data?.turma) {
      toast.info(`Detalhes de notas: ${data.turma}`);
      navigate("/admin/turmas");
    }
  };

  const handlePieClick = (data: any) => {
    if (data?.name === "Aprovados") {
      navigate("/admin/alunos?status=ativo");
    } else if (data?.name === "Reprovados") {
      navigate("/admin/alunos?status=inativo");
    } else if (data?.name === "Pendentes") {
      navigate("/admin/alunos?status=incompleto");
    }
    toast.info(`Filtro: ${data?.name}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Frequency by class */}
      <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-5">Frequência por Turma (%)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={frequencyData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="turma" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} unit="%" />
            <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, "Frequência"]} />
            <Bar dataKey="freq" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} cursor="pointer" onClick={handleBarClick} />
          </BarChart>
        </ResponsiveContainer>
        <button
          onClick={() => navigate("/admin/frequencia")}
          className="w-full mt-3 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-accent transition-colors"
        >
          Ver relatório completo
        </button>
      </div>

      {/* Average grades by class */}
      <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-5">Média de Notas por Turma</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={gradeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="turma" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={[0, 10]} />
            <Tooltip {...tooltipStyle} formatter={(v: number) => [v.toFixed(1), "Média"]} />
            <Line
              type="monotone"
              dataKey="media"
              stroke="hsl(var(--secondary))"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "hsl(var(--secondary))", cursor: "pointer" }}
              activeDot={{ r: 6, cursor: "pointer", onClick: (_: any, payload: any) => handleLineClick(payload?.payload) }}
            />
          </LineChart>
        </ResponsiveContainer>
        <button
          onClick={() => navigate("/admin/notas")}
          className="w-full mt-3 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-accent transition-colors"
        >
          Ver detalhamento de notas
        </button>
      </div>

      {/* Distribution pie */}
      <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-5">Distribuição Geral</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={distributionData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              strokeWidth={0}
              cursor="pointer"
              onClick={handlePieClick}
            >
              {distributionData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2">
          {distributionData.map((d) => (
            <button
              key={d.name}
              onClick={() => handlePieClick(d)}
              className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-[11px] text-muted-foreground font-medium">{d.name} ({d.value})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;

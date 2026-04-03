import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { toast } from "sonner";
import { useState } from "react";

const attendanceData = [
  { turma: "1ºA", valor: 96 },
  { turma: "2ºA", valor: 91 },
  { turma: "3ºB", valor: 87 },
  { turma: "4ºC", valor: 94 },
  { turma: "5ºC", valor: 82 },
  { turma: "6ºD", valor: 93 },
];

const gradesData = [
  { turma: "1ºA", valor: 7.8 },
  { turma: "2ºA", valor: 6.9 },
  { turma: "3ºB", valor: 7.2 },
  { turma: "4ºC", valor: 8.1 },
  { turma: "5ºC", valor: 4.8 },
  { turma: "6ºD", valor: 6.5 },
];

const CustomTooltip = ({ active, payload, label, suffix = "" }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/60 rounded-[12px] px-4 py-3 certus-shadow">
      <p className="text-xs font-bold text-primary mb-1">Turma {label}</p>
      <p className="text-sm text-foreground">
        Valor: <span className="font-bold">{payload[0].value}{suffix}</span>
      </p>
      <p className="text-[11px] text-muted mt-1">Clique para ver detalhes</p>
    </div>
  );
};

const ChartCard = ({ title, data, baseColor, warnThreshold, suffix = "" }: {
  title: string;
  data: typeof attendanceData;
  baseColor: string;
  warnThreshold?: number;
  suffix?: string;
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="bg-card border border-border/60 rounded-xl p-6 certus-shadow">
      <h3 className="text-sm font-bold text-primary mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" vertical={false} />
          <XAxis dataKey="turma" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip suffix={suffix} />} cursor={{ fill: "hsl(214,32%,91%,0.3)" }} />
          <Bar
            dataKey="valor"
            radius={[6, 6, 0, 0]}
            cursor="pointer"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            onClick={(entry) => toast.info(`Detalhes da turma ${entry.turma}: ${entry.valor}${suffix}`)}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={warnThreshold && entry.valor < warnThreshold ? "#EF4444" : baseColor}
                opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const Charts = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
    <ChartCard title="Frequência por Turma (%)" data={attendanceData} baseColor="#22C55E" warnThreshold={85} suffix="%" />
    <ChartCard title="Média de Notas por Turma" data={gradesData} baseColor="#3B82F6" warnThreshold={5.0} />
  </div>
);

export default Charts;

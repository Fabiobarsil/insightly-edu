import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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

const ChartCard = ({ title, data, color, suffix = "" }: { title: string; data: typeof attendanceData; color: string; suffix?: string }) => (
  <div className="bg-card border border-border/60 rounded-xl p-6 certus-shadow">
    <h3 className="text-sm font-bold text-primary mb-4">{title}</h3>
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" vertical={false} />
        <XAxis dataKey="turma" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 13 }}
          formatter={(value: number) => [`${value}${suffix}`, ""]}
        />
        <Bar dataKey="valor" fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const Charts = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
    <ChartCard title="Frequência por Turma (%)" data={attendanceData} color="#22C55E" suffix="%" />
    <ChartCard title="Média de Notas por Turma" data={gradesData} color="#3B82F6" />
  </div>
);

export default Charts;

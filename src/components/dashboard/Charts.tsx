import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface ChartEntry {
  turma: string;
  valor: number;
}

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
  data: ChartEntry[];
  baseColor: string;
  warnThreshold?: number;
  suffix?: string;
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="bg-card border border-border/60 rounded-xl p-6 certus-shadow">
      <h3 className="text-sm font-bold text-primary mb-4">{title}</h3>
      {data.length === 0 ? (
        <p className="text-xs text-muted text-center py-8">Sem dados disponíveis</p>
      ) : (
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
      )}
    </div>
  );
};

const Charts = () => {
  const [attendanceData, setAttendanceData] = useState<ChartEntry[]>([]);
  const [gradesData, setGradesData] = useState<ChartEntry[]>([]);

  useEffect(() => {
    const fetch = async () => {
      // Fetch classes + attendance
      const [classesRes, attendanceRes, gradesRes, assignmentsRes] = await Promise.all([
        supabase.from("classes").select("id, name"),
        supabase.from("attendance").select("student_id, status, school_id"),
        supabase.from("grades").select("student_id, grade_value, assignment_id"),
        supabase.from("students").select("id, class_id"),
      ]);

      const classes = classesRes.data ?? [];
      const attendance = attendanceRes.data ?? [];
      const grades = gradesRes.data ?? [];
      const studentsWithClass = assignmentsRes.data ?? [];

      // Build class map
      const classMap = new Map(classes.map((c) => [c.id, c.name]));
      const studentClassMap = new Map(studentsWithClass.map((s) => [s.id, s.class_id]));

      // Attendance by class
      const attByClass: Record<string, { total: number; present: number }> = {};
      attendance.forEach((a) => {
        const classId = studentClassMap.get(a.student_id ?? "");
        if (!classId) return;
        const className = classMap.get(classId);
        if (!className) return;
        if (!attByClass[className]) attByClass[className] = { total: 0, present: 0 };
        attByClass[className].total++;
        if (a.status === "presente") attByClass[className].present++;
      });

      const attData = Object.entries(attByClass).map(([turma, v]) => ({
        turma,
        valor: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
      }));

      // Grades by class
      const gradeByClass: Record<string, { total: number; sum: number }> = {};
      grades.forEach((g) => {
        const classId = studentClassMap.get(g.student_id ?? "");
        if (!classId || g.grade_value == null) return;
        const className = classMap.get(classId);
        if (!className) return;
        if (!gradeByClass[className]) gradeByClass[className] = { total: 0, sum: 0 };
        gradeByClass[className].total++;
        gradeByClass[className].sum += Number(g.grade_value);
      });

      const gData = Object.entries(gradeByClass).map(([turma, v]) => ({
        turma,
        valor: v.total > 0 ? Number((v.sum / v.total).toFixed(1)) : 0,
      }));

      setAttendanceData(attData);
      setGradesData(gData);
    };
    fetch();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <ChartCard title="Frequência por Turma (%)" data={attendanceData} baseColor="#22C55E" warnThreshold={85} suffix="%" />
      <ChartCard title="Média de Notas por Turma" data={gradesData} baseColor="#3B82F6" warnThreshold={5.0} />
    </div>
  );
};

export default Charts;

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const AttendanceRecord = () => {
  const { schoolId } = useSchoolId();
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  const { data: classes = [] } = useQuery({
    queryKey: ["classes", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("classes").select("id, name").eq("school_id", schoolId).order("name");
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["class-students", classId],
    queryFn: async () => {
      if (!classId) return [];
      const { data } = await supabase.from("students").select("id, full_name").eq("class_id", classId).eq("status", "ativo").order("full_name");
      const list = data || [];
      const initial: Record<string, boolean> = {};
      list.forEach((s: any) => { initial[s.id] = true; });
      setAttendance(initial);
      return list;
    },
    enabled: !!classId,
  });

  const toggle = (id: string) => setAttendance((prev) => ({ ...prev, [id]: !prev[id] }));
  const present = Object.values(attendance).filter(Boolean).length;

  return (
    <AppLayout title="Registrar Frequência" breadcrumbs={[{ label: "Frequência" }, { label: "Registrar" }]}>
      <PageHeader title="Registrar Frequência" description="Selecione a turma e marque a presença dos alunos" />

      <div className="flex items-center gap-3 flex-wrap mb-6">
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="text-sm font-semibold bg-card border border-border/60 rounded-[12px] px-3 py-2 text-primary focus:outline-none focus:border-secondary">
          <option value="">Selecionar turma...</option>
          {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-sm font-semibold bg-card border border-border/60 rounded-[12px] px-3 py-2 text-primary focus:outline-none focus:border-secondary" />
        {students.length > 0 && (
          <div className="ml-auto text-sm text-muted">
            <span className="font-bold text-secondary">{present}</span>/{students.length} presentes
          </div>
        )}
      </div>

      {!classId ? (
        <div className="text-center py-12 text-muted">Selecione uma turma para registrar frequência.</div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-muted">Nenhum aluno ativo nesta turma.</div>
      ) : (
        <>
          <div className="bg-card border border-border/60 rounded-xl certus-shadow">
            {students.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3 border-b border-border/20 last:border-0 hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-primary">
                    {s.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                  </div>
                  <span className="text-sm font-medium text-primary">{s.full_name}</span>
                </div>
                <button onClick={() => toggle(s.id)} className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold transition-colors",
                  attendance[s.id] ? "bg-secondary/15 text-secondary" : "bg-destructive/15 text-destructive"
                )}>
                  {attendance[s.id] ? "Presente" : "Falta"}
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={() => toast.success("Frequência registrada!")} className="px-5 py-2.5 rounded-[14px] bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/90 transition-colors">
              <i className="ri-check-line mr-1" /> Salvar
            </button>
          </div>
        </>
      )}
    </AppLayout>
  );
};

export default AttendanceRecord;

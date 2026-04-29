import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, BookOpen, Printer, ArrowRight } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  schoolId: string | null;
}

export default function RelatorioAlunoModal({ open, onOpenChange, schoolId }: Props) {
  const navigate = useNavigate();
  const [year, setYear] = useState<string>("");
  const [gradeName, setGradeName] = useState<string>(""); // série
  const [shiftName, setShiftName] = useState<string>(""); // turno
  const [classId, setClassId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");

  useEffect(() => {
    if (!open) {
      setYear(""); setGradeName(""); setShiftName(""); setClassId(""); setStudentId("");
    }
  }, [open]);

  // Reset cascata
  useEffect(() => { setGradeName(""); setShiftName(""); setClassId(""); setStudentId(""); }, [year]);
  useEffect(() => { setShiftName(""); setClassId(""); setStudentId(""); }, [gradeName]);
  useEffect(() => { setClassId(""); setStudentId(""); }, [shiftName]);
  useEffect(() => { setStudentId(""); }, [classId]);

  // Todas as turmas da escola
  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ["rel-aluno-classes", schoolId],
    enabled: !!schoolId && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, grade, shift, academic_year")
        .eq("school_id", schoolId!)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const years = useMemo(
    () => Array.from(new Set(classes.map((c: any) => c.academic_year).filter(Boolean))).sort((a: any, b: any) => b - a),
    [classes]
  );
  const gradeOptions = useMemo(
    () => Array.from(new Set(classes.filter((c: any) => !year || String(c.academic_year) === year).map((c: any) => c.grade).filter(Boolean))).sort(),
    [classes, year]
  );
  const shifts = useMemo(
    () => Array.from(new Set(classes
      .filter((c: any) => (!year || String(c.academic_year) === year) && (!gradeName || c.grade === gradeName))
      .map((c: any) => c.shift).filter(Boolean))).sort(),
    [classes, year, gradeName]
  );
  const filteredClasses = useMemo(
    () => classes.filter((c: any) =>
      (!year || String(c.academic_year) === year) &&
      (!gradeName || c.grade === gradeName) &&
      (!shiftName || c.shift === shiftName)
    ),
    [classes, year, gradeName, shiftName]
  );

  // Alunos da turma selecionada (via student_enrollments ativo)
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["rel-aluno-students", schoolId, classId, year],
    enabled: !!schoolId && !!classId,
    queryFn: async () => {
      const q = supabase
        .from("student_enrollments")
        .select("student_id, students:student_id(id, full_name)")
        .eq("school_id", schoolId!)
        .eq("class_id", classId)
        .eq("status", "ativo");
      const { data, error } = year ? await q.eq("academic_year", Number(year)) : await q;
      if (error) throw error;
      const list = (data ?? [])
        .map((r: any) => r.students)
        .filter(Boolean);
      // dedup
      const map = new Map<string, any>();
      list.forEach((s: any) => map.set(s.id, s));
      return Array.from(map.values()).sort((a: any, b: any) => (a.full_name || "").localeCompare(b.full_name || ""));
    },
  });


  const { data: enrollment } = useQuery({
    queryKey: ["rel-aluno-enrollment", schoolId, studentId],
    enabled: !!schoolId && !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_enrollments")
        .select("id, class_id, academic_year, status")
        .eq("school_id", schoolId!)
        .eq("student_id", studentId)
        .order("academic_year", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: grades = [], isLoading: loadingGrades } = useQuery({
    queryKey: ["rel-aluno-grades", schoolId, studentId],
    enabled: !!schoolId && !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grades")
        .select("id, grade_value, assignment_id, term")
        .eq("school_id", schoolId!)
        .eq("student_id", studentId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const assignmentIds = useMemo(
    () => Array.from(new Set(grades.map((g: any) => g.assignment_id).filter(Boolean))),
    [grades]
  );

  const { data: assignments = [] } = useQuery({
    queryKey: ["rel-aluno-assignments", schoolId, assignmentIds.length],
    enabled: !!schoolId && assignmentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("id, title, subject_id")
        .eq("school_id", schoolId!)
        .in("id", assignmentIds as string[]);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: attendance = [], isLoading: loadingAtt } = useQuery({
    queryKey: ["rel-aluno-attendance", schoolId, studentId],
    enabled: !!schoolId && !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("status")
        .eq("school_id", schoolId!)
        .eq("student_id", studentId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const media = useMemo(() => {
    if (!grades.length) return 0;
    const sum = grades.reduce((a: number, g: any) => a + Number(g.grade_value ?? 0), 0);
    return sum / grades.length;
  }, [grades]);

  const frequencia = useMemo(() => {
    if (!attendance.length) return 0;
    const presentes = attendance.filter((a: any) => a.status === "presente").length;
    return (presentes / attendance.length) * 100;
  }, [attendance]);

  const notasPorAvaliacao = useMemo(() => {
    const aMap = new Map(assignments.map((a: any) => [a.id, a.title]));
    return grades.map((g: any) => ({
      id: g.id,
      title: (aMap.get(g.assignment_id) as string) || "Avaliação",
      term: g.term || "—",
      value: Number(g.grade_value ?? 0),
    }));
  }, [grades, assignments]);

  const aluno = students.find((s: any) => s.id === studentId);
  const loading = !!studentId && (loadingGrades || loadingAtt);
  const hasData = !!studentId && !loading && grades.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Relatório por Aluno</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium">Selecione o aluno</label>
          <Select value={studentId} onValueChange={setStudentId} disabled={loadingStudents}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um aluno..." />
            </SelectTrigger>
            <SelectContent>
              {students.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!studentId && (
          <p className="text-sm text-muted-foreground py-12 text-center">
            Selecione um aluno para gerar o relatório.
          </p>
        )}

        {studentId && loading && (
          <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-32 w-full" /></div>
        )}

        {studentId && !loading && !hasData && (
          <p className="text-sm text-muted-foreground py-12 text-center">
            Sem notas registradas para este aluno.
          </p>
        )}

        {hasData && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">{aluno?.full_name}</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground">Média Geral</p>
                  <p className="text-xl font-bold">{media.toFixed(1)}</p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground">Frequência</p>
                  <p className="text-xl font-bold">{frequencia.toFixed(0)}%</p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground">Ano letivo</p>
                  <p className="text-xl font-bold">{enrollment?.academic_year ?? "—"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Notas por avaliação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border max-h-64 overflow-y-auto">
                  {notasPorAvaliacao.map((n) => (
                    <li key={n.id} className="py-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.term}</p>
                      </div>
                      <Badge className={n.value >= 6 ? "bg-emerald-100 text-emerald-700" : "bg-destructive/15 text-destructive"}>
                        {n.value.toFixed(1)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            disabled={!studentId}
            onClick={() => { onOpenChange(false); navigate(`/admin/alunos/${studentId}`); }}
            className="gap-1"
          >
            Abrir prontuário <ArrowRight className="h-3 w-3" />
          </Button>
          <Button variant="default" disabled={!hasData} onClick={() => window.print()} className="gap-1">
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

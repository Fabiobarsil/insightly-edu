import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, GraduationCap, AlertTriangle, Trophy, Printer } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  schoolId: string | null;
}

export default function RelatorioGeralModal({ open, onOpenChange, schoolId }: Props) {
  const enabled = !!schoolId && open;

  const { data: students = [], isLoading: l1 } = useQuery({
    queryKey: ["rel-geral-students", schoolId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, status")
        .eq("school_id", schoolId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: classes = [], isLoading: l2 } = useQuery({
    queryKey: ["rel-geral-classes", schoolId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name")
        .eq("school_id", schoolId!)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: classAvg = [], isLoading: l3 } = useQuery({
    queryKey: ["rel-geral-class-avg", schoolId],
    enabled,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("v_class_avg")
        .select("class_id, avg_grade")
        .eq("school_id", schoolId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: atRisk = [], isLoading: l4 } = useQuery({
    queryKey: ["rel-geral-at-risk", schoolId],
    enabled,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("v_students_at_risk")
        .select("student_id, full_name, avg_grade, class_id")
        .eq("school_id", schoolId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const loading = l1 || l2 || l3 || l4;

  const totalAlunos = students.filter((s: any) => s.status === "ativo").length || students.length;
  const mediaGeral = useMemo(() => {
    if (!classAvg.length) return 0;
    const valid = classAvg.filter((c: any) => c.avg_grade != null);
    if (!valid.length) return 0;
    return valid.reduce((a: number, c: any) => a + Number(c.avg_grade), 0) / valid.length;
  }, [classAvg]);
  const totalRisco = atRisk.length;
  const pctRisco = totalAlunos ? (totalRisco / totalAlunos) * 100 : 0;

  const ranking = useMemo(() => {
    const cMap = new Map(classes.map((c: any) => [c.id, c.name]));
    return classAvg
      .map((r: any) => ({
        id: r.class_id,
        name: (cMap.get(r.class_id) as string) || "Turma",
        media: Number(r.avg_grade ?? 0),
      }))
      .sort((a, b) => b.media - a.media);
  }, [classAvg, classes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Relatório Geral da Escola</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Total de Alunos</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{totalAlunos}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Média Geral</CardTitle>
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{mediaGeral.toFixed(1)}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">% em Risco</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pctRisco.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">{totalRisco} aluno(s)</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4" /> Ranking de Turmas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ranking.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3 text-center">Sem dados de notas.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {ranking.map((t, i) => (
                      <li key={t.id} className="py-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}º</span>
                          <span className="text-sm font-medium">{t.name}</span>
                        </div>
                        <Badge className={t.media >= 6 ? "bg-emerald-100 text-emerald-700" : "bg-destructive/15 text-destructive"}>
                          {t.media.toFixed(1)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" /> Alunos em Risco
                </CardTitle>
              </CardHeader>
              <CardContent>
                {atRisk.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3 text-center">Nenhum aluno em risco. 🎉</p>
                ) : (
                  <ul className="divide-y divide-border max-h-64 overflow-y-auto">
                    {atRisk.map((a: any) => (
                      <li key={a.student_id} className="py-2 flex items-center justify-between">
                        <span className="text-sm">{a.full_name || "Aluno"}</span>
                        <Badge className="bg-destructive/15 text-destructive">
                          {Number(a.avg_grade ?? 0).toFixed(1)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="default" disabled={loading} onClick={() => window.print()} className="gap-1">
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { Trophy, TrendingDown, Users, GraduationCap, AlertTriangle, ArrowRight, FileDown, Printer, Eye } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  schoolId: string | null;
}

export default function RelatorioTurmaModal({ open, onOpenChange, schoolId }: Props) {
  const navigate = useNavigate();
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  useEffect(() => {
    if (!open) setSelectedClassId("");
  }, [open]);

  // Turmas
  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ["rel-turma-classes", schoolId],
    enabled: !!schoolId && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name")
        .eq("school_id", schoolId!)
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // 1) Média da turma — view v_class_avg
  const { data: classAvgRow, isLoading: loadingClassAvg } = useQuery({
    queryKey: ["rel-turma-v-class-avg", schoolId, selectedClassId],
    enabled: !!schoolId && !!selectedClassId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("v_class_avg")
        .select("avg_grade")
        .eq("school_id", schoolId!)
        .eq("class_id", selectedClassId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // 2) Top alunos — view v_top_students
  const { data: topStudents = [], isLoading: loadingTop } = useQuery({
    queryKey: ["rel-turma-v-top-students", schoolId, selectedClassId],
    enabled: !!schoolId && !!selectedClassId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("v_top_students")
        .select("student_id, full_name, avg_grade")
        .eq("school_id", schoolId!)
        .eq("class_id", selectedClassId)
        .order("avg_grade", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // 3) Alunos em risco — view v_students_at_risk
  const { data: atRisk = [], isLoading: loadingRisk } = useQuery({
    queryKey: ["rel-turma-v-at-risk", schoolId, selectedClassId],
    enabled: !!schoolId && !!selectedClassId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("v_students_at_risk")
        .select("student_id, full_name, avg_grade")
        .eq("school_id", schoolId!)
        .eq("class_id", selectedClassId)
        .order("avg_grade", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // 4) Ranking de disciplinas — view v_subject_avg
  const { data: subjectRows = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ["rel-turma-v-subject-avg", schoolId, selectedClassId],
    enabled: !!schoolId && !!selectedClassId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("v_subject_avg")
        .select("assignment_id, avg_grade")
        .eq("school_id", schoolId!)
        .eq("class_id", selectedClassId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const assignmentIds = useMemo(
    () => subjectRows.map((s: any) => s.assignment_id).filter(Boolean),
    [subjectRows]
  );

  // Títulos das avaliações para o ranking
  const { data: assignments = [] } = useQuery({
    queryKey: ["rel-turma-assignment-titles", schoolId, assignmentIds.length],
    enabled: !!schoolId && assignmentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("id, title")
        .eq("school_id", schoolId!)
        .in("id", assignmentIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Indicadores
  const totalAlunos = useMemo(() => {
    const ids = new Set<string>();
    topStudents.forEach((s: any) => s.student_id && ids.add(s.student_id));
    atRisk.forEach((s: any) => s.student_id && ids.add(s.student_id));
    return ids.size;
  }, [topStudents, atRisk]);

  const mediaTurma = Number(classAvgRow?.avg_grade ?? 0);

  // Ranking disciplinas
  const rankingDisciplinas = useMemo(() => {
    const aMap = new Map(assignments.map((a: any) => [a.id, a.title || "Avaliação"]));
    return subjectRows
      .map((r: any) => ({
        id: r.assignment_id,
        title: (aMap.get(r.assignment_id) as string) || "Avaliação",
        media: Number(r.avg_grade ?? 0),
      }))
      .sort((a, b) => b.media - a.media);
  }, [subjectRows, assignments]);

  const melhorDisc = rankingDisciplinas[0];
  const piorDisc = rankingDisciplinas[rankingDisciplinas.length - 1];

  // Top 3 alunos
  const top3 = useMemo(
    () =>
      topStudents.slice(0, 3).map((s: any) => ({
        id: s.student_id,
        name: s.full_name || "Aluno",
        media: Number(s.avg_grade ?? 0),
      })),
    [topStudents]
  );

  // Alunos em atenção
  const atencao = useMemo(
    () =>
      atRisk.map((s: any) => ({
        id: s.student_id,
        name: s.full_name || "Aluno",
        media: Number(s.avg_grade ?? 0),
      })),
    [atRisk]
  );

  const loading =
    loadingClasses ||
    (!!selectedClassId && (loadingClassAvg || loadingTop || loadingRisk || loadingSubjects));
  const hasData =
    !!selectedClassId &&
    !loading &&
    (topStudents.length > 0 || atRisk.length > 0 || subjectRows.length > 0 || !!classAvgRow);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Relatório por Turma</DialogTitle>
        </DialogHeader>

        {/* Filtro */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Selecione a turma</label>
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha uma turma..." />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedClassId && (
          <p className="text-sm text-muted-foreground py-12 text-center">
            Selecione uma turma para ver o relatório.
          </p>
        )}

        {selectedClassId && loading && (
          <div className="space-y-3 py-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {selectedClassId && !loading && !hasData && (
          <p className="text-sm text-muted-foreground py-12 text-center">
            Sem notas registradas para esta turma.
          </p>
        )}

        {hasData && !loading && (
          <div className="space-y-4">
            {/* Indicadores */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Alunos
                  </CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalAlunos}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Média da Turma
                  </CardTitle>
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mediaTurma.toFixed(1)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Ranking disciplinas */}
            {(melhorDisc || piorDisc) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ranking de Disciplinas</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {melhorDisc && (
                    <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-emerald-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Melhor disciplina</p>
                        <p className="text-sm font-semibold truncate">{melhorDisc.title}</p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700">
                        {melhorDisc.media.toFixed(1)}
                      </Badge>
                    </div>
                  )}
                  {piorDisc && piorDisc.id !== melhorDisc?.id && (
                    <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 flex items-center gap-3">
                      <TrendingDown className="h-5 w-5 text-destructive" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Pior disciplina</p>
                        <p className="text-sm font-semibold truncate">{piorDisc.title}</p>
                      </div>
                      <Badge className="bg-destructive/15 text-destructive">
                        {piorDisc.media.toFixed(1)}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Top 3 alunos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alunos em Destaque</CardTitle>
              </CardHeader>
              <CardContent>
                {top3.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {top3.map((a, i) => (
                      <li key={a.id} className="py-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-muted-foreground w-5">
                            {i + 1}º
                          </span>
                          <span className="text-sm font-medium">{a.name}</span>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700">
                          {a.media.toFixed(1)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Atenção */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Alunos que precisam de atenção
                </CardTitle>
              </CardHeader>
              <CardContent>
                {atencao.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3 text-center">
                    Nenhum aluno com média abaixo de 6. 🎉
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {atencao.map((a) => (
                      <li
                        key={a.id}
                        className="py-2 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-sm font-medium truncate">{a.name}</span>
                          <Badge className="bg-amber-100 text-amber-700">⚠️ atenção</Badge>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="bg-destructive/15 text-destructive">
                            {a.media.toFixed(1)}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onOpenChange(false);
                              navigate(`/admin/alunos/${a.id}`);
                            }}
                            className="gap-1"
                          >
                            Abrir prontuário <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="gap-2 flex-wrap">
          <Button
            variant="outline"
            disabled={!hasData}
            onClick={() => toast.info("Visualização completa em breve")}
            className="gap-1"
          >
            <Eye className="h-4 w-4" /> Visualizar completo
          </Button>
          <Button
            variant="outline"
            disabled={!hasData}
            onClick={() => toast.info("Geração de PDF em breve")}
            className="gap-1"
          >
            <FileDown className="h-4 w-4" /> Gerar PDF
          </Button>
          <Button
            variant="outline"
            disabled={!hasData}
            onClick={() => toast.info("Download em breve")}
            className="gap-1"
          >
            <FileDown className="h-4 w-4" /> Baixar
          </Button>
          <Button
            variant="default"
            disabled={!hasData}
            onClick={() => window.print()}
            className="gap-1"
          >
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

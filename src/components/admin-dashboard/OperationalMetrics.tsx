import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { FileWarning, UserPlus, Inbox, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

type DrillType = "documents" | "enrollments" | "requests" | "students" | null;

const OperationalMetrics = () => {
  const { schoolId } = useSchoolId();
  const navigate = useNavigate();
  const [drill, setDrill] = useState<DrillType>(null);

  const { data: metrics } = useQuery({
    queryKey: ["operational-metrics", schoolId],
    queryFn: async () => {
      if (!schoolId) return null;

      const [docsRes, enrollRes, reqRes, studentsRes, guardiansRes] = await Promise.all([
        supabase
          .from("documents")
          .select("id, name, student_id, status, due_date, document_type")
          .eq("school_id", schoolId)
          .eq("status", "pendente"),
        supabase
          .from("student_enrollments")
          .select("id, student_id, class_id, academic_year, status, students(full_name)")
          .eq("school_id", schoolId)
          .or("class_id.is.null,status.eq.pendente"),
        supabase
          .from("secretary_requests")
          .select("id, student_name, request_type, priority, status, deadline")
          .eq("school_id", schoolId)
          .neq("status", "concluido"),
        supabase
          .from("students")
          .select("id, full_name, status, class_id")
          .eq("school_id", schoolId)
          .eq("status", "ativo"),
        supabase
          .from("student_guardians")
          .select("student_id")
          .eq("school_id", schoolId),
      ]);

      const guardianStudentIds = new Set((guardiansRes.data || []).map((g) => g.student_id));
      const studentsList = studentsRes.data || [];
      const studentsWithIssues = studentsList.filter(
        (s) => !s.class_id || !guardianStudentIds.has(s.id)
      );

      return {
        documents: docsRes.data || [],
        enrollments: enrollRes.data || [],
        requests: reqRes.data || [],
        studentsWithIssues,
      };
    },
    enabled: !!schoolId,
  });

  const cards = [
    {
      key: "documents" as const,
      title: "Documentos Pendentes",
      value: metrics?.documents.length ?? 0,
      icon: FileWarning,
      color: "border-l-amber-500",
      iconBg: "bg-amber-500/10 text-amber-600",
    },
    {
      key: "enrollments" as const,
      title: "Matrículas Pendentes",
      value: metrics?.enrollments.length ?? 0,
      icon: UserPlus,
      color: "border-l-blue-500",
      iconBg: "bg-blue-500/10 text-blue-600",
    },
    {
      key: "requests" as const,
      title: "Solicitações em Aberto",
      value: metrics?.requests.length ?? 0,
      icon: Inbox,
      color: "border-l-violet-500",
      iconBg: "bg-violet-500/10 text-violet-600",
    },
    {
      key: "students" as const,
      title: "Alunos com Pendências",
      value: metrics?.studentsWithIssues.length ?? 0,
      icon: AlertCircle,
      color: "border-l-destructive",
      iconBg: "bg-destructive/10 text-destructive",
    },
  ];

  const drillTitle: Record<NonNullable<DrillType>, string> = {
    documents: "Documentos Pendentes",
    enrollments: "Matrículas Pendentes",
    requests: "Solicitações em Aberto",
    students: "Alunos com Pendências",
  };

  const renderDrillContent = () => {
    if (!drill || !metrics) return null;
    switch (drill) {
      case "documents":
        return metrics.documents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nenhum documento pendente.</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {metrics.documents.map((d: any) => (
              <li key={d.id} className="py-3 flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium text-foreground">{d.name || d.document_type || "Documento"}</p>
                  {d.due_date && (
                    <p className="text-xs text-muted-foreground">Prazo: {format(new Date(d.due_date), "dd/MM/yyyy")}</p>
                  )}
                </div>
                <button
                  onClick={() => { setDrill(null); navigate("/admin/documentos"); }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Abrir
                </button>
              </li>
            ))}
          </ul>
        );
      case "enrollments":
        return metrics.enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma matrícula pendente.</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {metrics.enrollments.map((e: any) => {
              const student = Array.isArray(e.students) ? e.students[0] : e.students;
              return (
                <li key={e.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium text-foreground">{student?.full_name || "Aluno"}</p>
                    <p className="text-xs text-muted-foreground">
                      {!e.class_id ? "Sem turma atribuída" : `Status: ${e.status}`}
                    </p>
                  </div>
                  <button
                    onClick={() => { setDrill(null); navigate(`/secretaria/matricula/${e.student_id}`); }}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Resolver
                  </button>
                </li>
              );
            })}
          </ul>
        );
      case "requests":
        return metrics.requests.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma solicitação aberta.</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {metrics.requests.map((r: any) => (
              <li key={r.id} className="py-3 flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium text-foreground">{r.student_name || r.request_type}</p>
                  <p className="text-xs text-muted-foreground">{r.request_type} · Prioridade: {r.priority}</p>
                </div>
                <button
                  onClick={() => {
                    setDrill(null);
                    document.getElementById("priorities-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Atender
                </button>
              </li>
            ))}
          </ul>
        );
      case "students":
        return metrics.studentsWithIssues.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nenhum aluno com pendências.</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {metrics.studentsWithIssues.map((s: any) => (
              <li key={s.id} className="py-3 flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium text-foreground">{s.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {!s.class_id ? "Sem turma" : "Sem responsável cadastrado"}
                  </p>
                </div>
                <button
                  onClick={() => { setDrill(null); navigate(`/admin/alunos/${s.id}`); }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Ver ficha
                </button>
              </li>
            ))}
          </ul>
        );
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <button
            key={c.key}
            onClick={() => setDrill(c.key)}
            className={`bg-card border border-border/60 ${c.color} border-l-4 rounded-xl p-5 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{c.title}</p>
                <p className="text-3xl font-bold tracking-tight text-foreground">{c.value}</p>
                <p className="text-[11px] text-muted-foreground/80 mt-2 group-hover:text-primary transition-colors">
                  Clique para ver lista →
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.iconBg}`}>
                <c.icon className="h-5 w-5" />
              </div>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!drill} onOpenChange={(open) => !open && setDrill(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{drill ? drillTitle[drill] : ""}</DialogTitle>
          </DialogHeader>
          {renderDrillContent()}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OperationalMetrics;

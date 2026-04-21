import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { FileText, MessageSquare, GraduationCap, UserX, ArrowRight } from "lucide-react";

interface OverviewData {
  docsPending: number;
  docsResolved: number;
  requestsOpen: number;
  requestsDone: number;
  enrollmentsPending: number;
  studentsWithIssues: number;
}

const QuickOverview = () => {
  const { schoolId } = useSchoolId();
  const navigate = useNavigate();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;

    const fetchData = async () => {
      try {
        const [docsP, docsR, reqOpen, reqDone, enrollP, studentsIssues] = await Promise.all([
          supabase.from("documents").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("status", "pendente"),
          supabase.from("documents").select("id", { count: "exact", head: true }).eq("school_id", schoolId).in("status", ["resolvido", "entregue", "aprovado"]),
          supabase.from("secretary_requests").select("id", { count: "exact", head: true }).eq("school_id", schoolId).in("status", ["aberto", "em_andamento"]),
          supabase.from("secretary_requests").select("id", { count: "exact", head: true }).eq("school_id", schoolId).in("status", ["concluido", "resolvido"]),
          supabase.from("student_enrollments").select("id", { count: "exact", head: true }).eq("school_id", schoolId).is("class_id", null),
          supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", schoolId).in("status", ["incompleto", "irregular"]),
        ]);

        setData({
          docsPending: docsP.count ?? 0,
          docsResolved: docsR.count ?? 0,
          requestsOpen: reqOpen.count ?? 0,
          requestsDone: reqDone.count ?? 0,
          enrollmentsPending: enrollP.count ?? 0,
          studentsWithIssues: studentsIssues.count ?? 0,
        });
      } catch (err) {
        console.error("[QuickOverview] error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [schoolId]);

  if (!schoolId) return null;

  const items = [
    {
      icon: FileText,
      label: "Documentos",
      stats: [
        { value: data?.docsPending ?? 0, sublabel: "pendentes", tone: "warning" as const },
        { value: data?.docsResolved ?? 0, sublabel: "resolvidos", tone: "success" as const },
      ],
      action: () => navigate("/admin/documentos"),
    },
    {
      icon: MessageSquare,
      label: "Solicitações",
      stats: [
        { value: data?.requestsOpen ?? 0, sublabel: "abertas", tone: "warning" as const },
        { value: data?.requestsDone ?? 0, sublabel: "concluídas", tone: "success" as const },
      ],
      action: () => navigate("/admin/dashboard"),
    },
    {
      icon: GraduationCap,
      label: "Matrículas",
      stats: [
        { value: data?.enrollmentsPending ?? 0, sublabel: "incompletas", tone: "warning" as const },
      ],
      action: () => navigate("/admin/alunos"),
    },
    {
      icon: UserX,
      label: "Alunos",
      stats: [
        { value: data?.studentsWithIssues ?? 0, sublabel: "com pendências", tone: "danger" as const },
      ],
      action: () => navigate("/admin/alunos"),
    },
  ];

  const toneClass = (tone: "warning" | "success" | "danger") =>
    tone === "warning"
      ? "text-amber-600 dark:text-amber-500"
      : tone === "success"
      ? "text-emerald-600 dark:text-emerald-500"
      : "text-red-600 dark:text-red-500";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Visão Rápida da Secretaria</h3>
          <p className="text-xs text-muted-foreground">Indicadores de leitura rápida</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={i}
              onClick={item.action}
              className="group text-left rounded-lg border border-border bg-background hover:bg-accent/50 hover:border-primary/40 transition p-3 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">{item.label}</span>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
              </div>

              <div className="flex items-baseline gap-3 flex-wrap">
                {item.stats.map((s, idx) => (
                  <div key={idx} className="flex items-baseline gap-1">
                    <span className={`text-xl font-bold tabular-nums ${toneClass(s.tone)}`}>
                      {loading ? "—" : s.value}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{s.sublabel}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
};

export default QuickOverview;

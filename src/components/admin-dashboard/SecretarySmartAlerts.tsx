import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Alert {
  id: string;
  level: "critical" | "warning" | "info";
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
}

const LEVEL_STYLES = {
  critical: {
    border: "border-l-destructive",
    bg: "bg-destructive/5",
    iconBg: "bg-destructive/10 text-destructive",
    icon: AlertTriangle,
    badge: "bg-destructive/15 text-destructive",
    label: "Crítico",
  },
  warning: {
    border: "border-l-amber-500",
    bg: "bg-amber-500/5",
    iconBg: "bg-amber-500/10 text-amber-600",
    icon: AlertCircle,
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    label: "Atenção",
  },
  info: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-500/5",
    iconBg: "bg-emerald-500/10 text-emerald-600",
    icon: Info,
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    label: "Normal",
  },
};

const SecretarySmartAlerts = () => {
  const { schoolId } = useSchoolId();
  const navigate = useNavigate();

  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ["secretary-smart-alerts", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const list: Alert[] = [];

      // 1. Documentos com due_date vencido
      const today = new Date().toISOString().slice(0, 10);
      const { data: overdueDocs } = await supabase
        .from("documents")
        .select("id, name, due_date, student_id")
        .eq("school_id", schoolId)
        .eq("status", "pendente")
        .lt("due_date", today);

      if ((overdueDocs?.length ?? 0) > 0) {
        list.push({
          id: "overdue-docs",
          level: "critical",
          title: `${overdueDocs!.length} documento(s) com prazo vencido`,
          description: "Documentos pendentes ultrapassaram o prazo de entrega",
          actionLabel: "Ver documentos",
          action: () => navigate("/admin/documentos"),
        });
      }

      // 2. Solicitações urgentes/altas paradas há +3 dias
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const { data: stalledReqs } = await supabase
        .from("secretary_requests")
        .select("id, student_name, priority, created_at")
        .eq("school_id", schoolId)
        .in("priority", ["urgente", "alta"])
        .neq("status", "concluido")
        .lt("created_at", threeDaysAgo.toISOString());

      if ((stalledReqs?.length ?? 0) > 0) {
        list.push({
          id: "stalled-requests",
          level: "critical",
          title: `${stalledReqs!.length} solicitação(ões) urgente(s) parada(s)`,
          description: "Prioridade alta sem movimentação há mais de 3 dias",
          actionLabel: "Ir para fila",
          action: () => document.getElementById("priorities-section")?.scrollIntoView({ behavior: "smooth" }),
        });
      }

      // 3. Frequência baixa (<75%) — usando attendance
      const { data: attendance } = await supabase
        .from("attendance")
        .select("student_id, status")
        .eq("school_id", schoolId);

      if (attendance && attendance.length > 0) {
        const byStudent: Record<string, { total: number; presentes: number }> = {};
        attendance.forEach((a) => {
          if (!a.student_id) return;
          if (!byStudent[a.student_id]) byStudent[a.student_id] = { total: 0, presentes: 0 };
          byStudent[a.student_id].total++;
          if (a.status === "presente") byStudent[a.student_id].presentes++;
        });
        const lowFreq = Object.entries(byStudent).filter(
          ([, v]) => v.total >= 5 && (v.presentes / v.total) * 100 < 75
        );
        if (lowFreq.length > 0) {
          list.push({
            id: "low-freq",
            level: "warning",
            title: `${lowFreq.length} aluno(s) com frequência abaixo de 75%`,
            description: "Risco de reprovação por infrequência",
            actionLabel: "Ver coordenação",
            action: () => navigate("/admin/coordenacao"),
          });
        }
      }

      // 4. Alunos sem responsável cadastrado
      const { data: students } = await supabase
        .from("students")
        .select("id")
        .eq("school_id", schoolId)
        .eq("status", "ativo");
      const { data: guardianLinks } = await supabase
        .from("student_guardians")
        .select("student_id")
        .eq("school_id", schoolId);

      const linked = new Set((guardianLinks ?? []).map((g) => g.student_id));
      const noGuardian = (students ?? []).filter((s) => !linked.has(s.id));
      if (noGuardian.length > 0) {
        list.push({
          id: "no-guardian",
          level: "warning",
          title: `${noGuardian.length} aluno(s) sem responsável cadastrado`,
          description: "Cadastro incompleto — necessário para emissão de documentos",
          actionLabel: "Ver alunos",
          action: () => navigate("/admin/alunos"),
        });
      }

      return list;
    },
    enabled: !!schoolId,
  });

  return (
    <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">⚠️ Alertas da Secretaria</h3>
        <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
          {alerts.length} alerta(s)
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground">✓ Nenhum alerta no momento. Operação tranquila.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {alerts.map((a) => {
            const cfg = LEVEL_STYLES[a.level];
            const Icon = cfg.icon;
            return (
              <li
                key={a.id}
                className={`flex items-center gap-3 px-4 py-2.5 border-l-4 ${cfg.border} ${cfg.bg} transition-colors hover:bg-accent/30`}
              >
                <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs font-semibold text-foreground flex-1 min-w-0 truncate">
                  {a.title}
                </p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>
                  {cfg.label}
                </span>
                {a.action && (
                  <button
                    onClick={a.action}
                    className="text-[11px] font-semibold text-primary hover:underline shrink-0"
                  >
                    {a.actionLabel} →
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default SecretarySmartAlerts;

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import RoleLayout from "@/components/layout/RoleLayout";
import RequestFormModal from "@/components/secretaria/RequestFormModal";
import RequestsList from "@/components/secretaria/RequestsList";
import { Plus, AlertTriangle, FileText, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const SecretariaDashboard = () => {
  const { schoolId } = useSchoolId();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: students = [] } = useQuery({
    queryKey: ["students-count", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("students").select("id").eq("school_id", schoolId).eq("status", "ativo");
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes-count", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("classes").select("id").eq("school_id", schoolId);
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["secretary-requests", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("secretary_requests" as any)
        .select("id, status, priority")
        .eq("school_id", schoolId);
      return (data || []) as any[];
    },
    enabled: !!schoolId,
  });

  const openCount = requests.filter((r: any) => r.status === "aberto").length;
  const urgentCount = requests.filter((r: any) => r.priority === "urgente" && r.status !== "concluido").length;
  const pendingDocs = requests.filter((r: any) => ["aberto", "em andamento", "aguardando"].includes(r.status)).length;

  const metrics = [
    { label: "Alunos Ativos", value: students.length, icon: Users, accent: "bg-primary/10 text-primary" },
    { label: "Turmas", value: classes.length, icon: BookOpen, accent: "bg-secondary/15 text-secondary" },
    { label: "Solicitações Abertas", value: openCount, icon: FileText, accent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    { label: "Urgentes", value: urgentCount, icon: AlertTriangle, accent: urgentCount > 0 ? "bg-destructive/10 text-destructive" : "bg-muted/50 text-muted-foreground" },
  ];

  return (
    <RoleLayout title="Secretaria">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Painel da Secretaria</h2>
            <p className="text-sm text-muted-foreground">Gerencie solicitações, documentos e demandas administrativas</p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Solicitação
          </Button>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="bg-card border border-border/60 rounded-xl p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${m.accent}`}>
                <m.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-lg font-bold text-foreground">{m.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Alert banner */}
        {(urgentCount > 0 || pendingDocs > 0) && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div className="text-sm text-foreground">
              {urgentCount > 0 && <span className="font-semibold">{urgentCount} solicitação(ões) urgente(s). </span>}
              {pendingDocs > 0 && <span>{pendingDocs} demanda(s) pendente(s) no total.</span>}
            </div>
          </div>
        )}

        {/* Requests list */}
        <RequestsList />

        {/* Modal */}
        <RequestFormModal open={modalOpen} onOpenChange={setModalOpen} />
      </div>
    </RoleLayout>
  );
};

export default SecretariaDashboard;

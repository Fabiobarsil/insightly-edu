import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { supabase } from "@/integrations/supabase/client";

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between py-2.5 border-b border-border/20 last:border-0">
    <span className="text-xs font-bold text-muted">{label}</span>
    <span className="text-sm text-primary font-medium">{value}</span>
  </div>
);

const GuardiansDetail = () => {
  const { id } = useParams();

  const { data: guardian, isLoading } = useQuery({
    queryKey: ["guardian", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("guardians").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: linkedStudents = [] } = useQuery({
    queryKey: ["guardian-students", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_guardians")
        .select("student_id, students(id, full_name, classes(name))")
        .eq("guardian_id", id!);
      if (error) throw error;
      return (data || []).map((sg: any) => ({
        id: sg.students?.id,
        full_name: sg.students?.full_name || "—",
        class_name: sg.students?.classes?.name || "—",
      }));
    },
    enabled: !!id,
  });

  if (isLoading || !guardian) return (
    <AppLayout title="Responsável" breadcrumbs={[{ label: "Responsáveis", href: "/admin/responsaveis" }, { label: "Detalhes" }]}>
      <div className="text-center py-12 text-muted">Carregando...</div>
    </AppLayout>
  );

  return (
    <AppLayout title={guardian.full_name || "Responsável"} breadcrumbs={[{ label: "Responsáveis", href: "/admin/responsaveis" }, { label: guardian.full_name || "" }]}>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title={guardian.full_name || ""} description="Dados do responsável" />
        <Link to={`/admin/responsaveis/${id}/editar`} className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] border border-border text-sm font-bold text-muted hover:bg-accent transition-colors">
          <i className="ri-pencil-line" /> Editar
        </Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
          <h4 className="text-sm font-bold text-primary mb-4">Informações de Contato</h4>
          <InfoRow label="Telefone" value={guardian.phone || "—"} />
          <InfoRow label="E-mail" value={guardian.email || "—"} />
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
          <h4 className="text-sm font-bold text-primary mb-4">Alunos Vinculados</h4>
          {linkedStudents.length === 0 ? (
            <p className="text-sm text-muted">Nenhum aluno vinculado.</p>
          ) : (
            <div className="space-y-3">
              {linkedStudents.map((s: any) => (
                <Link key={s.id} to={`/admin/alunos/${s.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
                  <div className="w-9 h-9 rounded-full bg-secondary/15 flex items-center justify-center">
                    <i className="ri-user-line text-secondary" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-primary">{s.full_name}</div>
                    <div className="text-xs text-muted">{s.class_name}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default GuardiansDetail;

import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { supabase } from "@/lib/supabase";

const TeachersDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: teacher, isLoading } = useQuery({
    queryKey: ["teacher", id],
    queryFn: async () => {
      const { data } = await supabase.from("teachers").select("*").eq("id", id!).maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["teacher-assignments-detail", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("teacher_assignments")
        .select("id, classes:class_id (name, grade, shift), subjects:subject_id (name)")
        .eq("teacher_id", id!);
      return data ?? [];
    },
    enabled: !!id,
  });

  const t = teacher as any;

  if (isLoading) {
    return (
      <AppLayout title="Professor" breadcrumbs={[{ label: "Professores", href: "/admin/professores" }, { label: "..." }]}>
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      </AppLayout>
    );
  }

  if (!t) {
    return (
      <AppLayout title="Professor" breadcrumbs={[{ label: "Professores", href: "/admin/professores" }, { label: "Não encontrado" }]}>
        <div className="text-center py-12 text-muted-foreground">Professor não encontrado.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={t.full_name || "Professor"}
      breadcrumbs={[{ label: "Professores", href: "/admin/professores" }, { label: t.full_name || "Detalhe" }]}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center">
          <i className="ri-user-star-line text-2xl text-secondary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-primary">{t.full_name || "—"}</h1>
          <p className="text-sm text-muted-foreground">{t.email || "Sem e-mail"}</p>
        </div>
        <StatusBadge status={t.status === "active" ? "active" : "inactive"} label={t.status === "active" ? "Ativo" : "Inativo"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-primary">Informações</h4>
            <Link
              to={`/admin/professores/${id}/editar`}
              className="text-xs font-bold text-secondary hover:underline"
            >
              Editar
            </Link>
          </div>
          {[
            ["Nome", t.full_name || "—"],
            ["E-mail", t.email || "—"],
            ["Status", t.status === "active" ? "Ativo" : "Inativo"],
          ].map(([l, v], i) => (
            <div key={i} className="flex justify-between py-2.5 border-b border-border/20 last:border-0">
              <span className="text-xs font-bold text-muted-foreground">{l}</span>
              <span className="text-sm text-primary font-medium">{v}</span>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow">
          <h4 className="text-sm font-bold text-primary mb-4">
            Vínculos ({assignments.length})
          </h4>
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum vínculo cadastrado.</p>
          ) : (
            assignments.map((a: any, i: number) => {
              const cls = a.classes;
              const subj = a.subjects;
              const className = cls
                ? `${cls.name}${cls.grade ? ` - ${cls.grade}` : ""}${cls.shift ? ` (${cls.shift})` : ""}`
                : "Turma removida";
              const subjectName = subj?.name || "Disciplina removida";

              return (
                <div key={a.id || i} className="flex items-center gap-3 py-2.5 border-b border-border/20 last:border-0">
                  <i className="ri-book-open-line text-muted-foreground" />
                  <span className="text-sm text-primary">
                    {className} — {subjectName}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default TeachersDetail;

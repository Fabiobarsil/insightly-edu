import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { User, BookOpen, GraduationCap, Clock, MoreVertical, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeacherCard {
  id: string;
  full_name: string;
  email: string;
  status: string;
  photo_url: string | null;
  subjects: string[];
  classes: string[];
  shifts: string[];
}

const TeachersList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ["teachers-cards"],
    queryFn: async () => {
      // Fetch teachers
      const { data: teachersData, error } = await supabase
        .from("teachers")
        .select("id, full_name, email, status")
        .order("full_name");
      if (error) throw error;

      // Fetch assignments with classes and subjects
      const { data: assignments } = await supabase
        .from("teacher_assignments")
        .select("teacher_id, class_id, subject_id");

      const { data: classes } = await supabase
        .from("classes")
        .select("id, name, shift");

      const { data: subjects } = await supabase
        .from("subjects")
        .select("id, name");

      const classMap = new Map((classes ?? []).map((c) => [c.id, c]));
      const subjectMap = new Map((subjects ?? []).map((s) => [s.id, s]));

      return (teachersData ?? []).map((t): TeacherCard => {
        const teacherAssignments = (assignments ?? []).filter((a) => a.teacher_id === t.id);
        const teacherSubjects = [...new Set(
          teacherAssignments
            .map((a) => subjectMap.get(a.subject_id ?? "")?.name)
            .filter(Boolean)
        )] as string[];
        const teacherClasses = [...new Set(
          teacherAssignments
            .map((a) => classMap.get(a.class_id ?? "")?.name)
            .filter(Boolean)
        )] as string[];
        const teacherShifts = [...new Set(
          teacherAssignments
            .map((a) => classMap.get(a.class_id ?? "")?.shift)
            .filter(Boolean)
        )] as string[];

        return {
          id: t.id,
          full_name: t.full_name || "Sem nome",
          email: t.email || "",
          status: t.status || "active",
          photo_url: null,
          subjects: teacherSubjects,
          classes: teacherClasses,
          shifts: teacherShifts,
        };
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("teacher_assignments").delete().eq("teacher_id", id);
      const { error } = await supabase.from("teachers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers-cards"] });
      toast.success("Professor excluído com sucesso!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao excluir professor"),
  });

  return (
    <AppLayout title="Professores" breadcrumbs={[{ label: "Professores" }]}>
      <PageHeader
        title="Professores"
        description="Corpo docente da escola"
        action={{ label: "Novo Professor", icon: "ri-add-line", to: "/admin/professores/novo" }}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : teachers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum professor cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              onClick={() => navigate(`/admin/professores/${teacher.id}`)}
              className="group relative bg-card rounded-2xl border border-border/50 p-6 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
            >
              {/* Menu */}
              <div className="absolute top-4 right-4 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
                  >
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/admin/professores/${teacher.id}/editar`); }}>
                      <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Excluir este professor e todos os seus vínculos?")) {
                          deleteMutation.mutate(teacher.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Avatar + Name */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {teacher.photo_url ? (
                    <img src={teacher.photo_url} alt={teacher.full_name} className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <User className="h-7 w-7 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{teacher.full_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      teacher.status === "active"
                        ? "bg-secondary/10 text-secondary"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {teacher.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info rows */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    {teacher.subjects.length > 0 ? teacher.subjects.join(", ") : "Sem disciplinas"}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <GraduationCap className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    {teacher.classes.length > 0 ? teacher.classes.join(", ") : "Sem turmas"}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    {teacher.shifts.length > 0 ? teacher.shifts.join(", ") : "Sem turno definido"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default TeachersList;

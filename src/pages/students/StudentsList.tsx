import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";

const statusMap: Record<string, { status: string; label: string }> = {
  ativo: { status: "active", label: "Ativo" },
  incompleto: { status: "warning", label: "Incompleto" },
  irregular: { status: "warning", label: "Irregular" },
  transferido: { status: "inactive", label: "Transferido" },
  inativo: { status: "inactive", label: "Inativo" },
};

const StudentsList = () => {
  const { schoolId, isLoading: loadingSchool } = useSchoolId();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];

      const { data: enrollments, error: enrollError } = await supabase
        .from("student_enrollments")
        .select(
          `
          id,
          student_id,
          class_id,
          academic_year,
          status,
          created_at,
          students ( id, full_name, status, birth_date, photo_url ),
          classes ( id, name, grade, shift )
        `,
        )
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });

      if (enrollError) throw enrollError;

      const seen = new Set<string>();
      return (enrollments || [])
        .map((e: any) => {
          const student = Array.isArray(e.students) ? e.students[0] : e.students;
          const classData = Array.isArray(e.classes) ? e.classes[0] : e.classes;
          if (!student?.id || seen.has(student.id)) return null;

          seen.add(student.id);

          return {
            id: student.id,
            students: student,
            full_name: student.full_name,
            photo_url: student.photo_url,
            class_id: e.class_id,
            class_name: classData?.name || "—",
            grade: classData?.grade || "—",
            shift: classData?.shift || "—",
            birth_date: student.birth_date || "—",
            status: student.status || "ativo",
          };
        })
        .filter(Boolean) as any[];
    },
    enabled: !!schoolId,
  });

  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((s: any) => {
      if (s.class_id && s.class_name !== "—") map.set(s.class_id, s.class_name);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [students]);

  const gradeOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s: any) => {
      if (s.grade && s.grade !== "—") set.add(s.grade);
    });
    return Array.from(set).sort();
  }, [students]);

  const shiftOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s: any) => {
      if (s.shift && s.shift !== "—") set.add(s.shift);
    });
    return Array.from(set).sort();
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s: any) => {
      if (q && !s.full_name?.toLowerCase().includes(q)) return false;
      if (classFilter && s.class_id !== classFilter) return false;
      if (gradeFilter && s.grade !== gradeFilter) return false;
      if (shiftFilter && s.shift !== shiftFilter) return false;
      return true;
    });
  }, [students, search, classFilter, gradeFilter, shiftFilter]);

  const total = students.length;
  const ativos = students.filter((s: any) => s.status === "ativo").length;
  const loading = loadingSchool || isLoading;

  const clearFilters = () => {
    setSearch("");
    setClassFilter("");
    setGradeFilter("");
    setShiftFilter("");
  };
  const hasFilter = search || classFilter || gradeFilter || shiftFilter;

  return (
    <AppLayout title="Alunos" breadcrumbs={[{ label: "Alunos" }]}>
      <PageHeader
        title="Alunos"
        description="Consulta dos alunos matriculados. Novas matrículas, renovações e desativações são realizadas pela Secretaria."
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { icon: "ri-group-line", label: "Total de Alunos", value: String(total), color: "text-primary" },
          { icon: "ri-check-double-line", label: "Ativos", value: String(ativos), color: "text-secondary" },
          {
            icon: "ri-user-unfollow-line",
            label: "Inativos",
            value: String(total - ativos),
            color: "text-destructive",
          },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border/60 rounded-xl p-4 certus-shadow flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <i className={`${s.icon} text-lg ${s.color}`} />
            </div>
            <div>
              <div className="text-lg font-bold text-primary">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando alunos...</div>
      ) : !schoolId ? (
        <div className="text-center py-12 text-muted-foreground">Nenhuma escola vinculada ao usuário.</div>
      ) : (
        <div className="bg-card border border-border/60 rounded-xl certus-shadow">
          {/* Filtros */}
          <div className="p-4 border-b border-border/40 grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4 flex items-center gap-2 border border-border rounded-[12px] px-3 py-2 bg-background">
              <i className="ri-search-line text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
                placeholder="Buscar aluno por nome..."
              />
            </div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="md:col-span-3 border border-border rounded-[12px] px-3 py-2 bg-background text-sm outline-none"
            >
              <option value="">Todas as turmas</option>
              {classOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="md:col-span-2 border border-border rounded-[12px] px-3 py-2 bg-background text-sm outline-none"
            >
              <option value="">Todas as séries</option>
              {gradeOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="md:col-span-2 border border-border rounded-[12px] px-3 py-2 bg-background text-sm outline-none"
            >
              <option value="">Todos os turnos</option>
              {shiftOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {hasFilter && (
              <button
                onClick={clearFilters}
                className="md:col-span-1 border border-border rounded-[12px] px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-accent transition-colors"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Turma
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Série
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Turno
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      {hasFilter
                        ? "Nenhum aluno encontrado com os filtros aplicados."
                        : "Nenhum aluno cadastrado ainda."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((row: any) => {
                    const mapped = statusMap[row.status] || statusMap.ativo;
                    return (
                      <tr key={row.id} className="border-b border-border/20 hover:bg-accent/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {row.photo_url ? (
                              <img
                                src={row.photo_url}
                                alt={row.full_name}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                                <i className="ri-user-line text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium text-foreground">{row.full_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-foreground">{row.class_name}</td>
                        <td className="px-4 py-3 text-foreground">{row.grade}</td>
                        <td className="px-4 py-3 text-foreground">{row.shift}</td>
                        <td className="px-4 py-3">
                          <StatusBadge {...mapped} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/admin/alunos/${row.id}`}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors inline-flex"
                            title="Ver"
                          >
                            <i className="ri-eye-line" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-border/40 text-xs text-muted-foreground">
            Mostrando {filtered.length} de {total} registros
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default StudentsList;

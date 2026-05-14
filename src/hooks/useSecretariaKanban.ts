import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, isSameDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolContext } from "./useSchoolContext";
import { updateRequestStatus } from "@/lib/secretariaActions";

export type KanbanStatus = "aberto" | "em_andamento" | "concluido";
export type ComputedPriority = "alta" | "media" | "baixa";

export interface KanbanRequest {
  id: string;
  school_id: string;
  student_id: string | null;
  student_name: string | null;
  student_class: string | null;
  student_grade: string | null;
  title: string;
  type: string | null;
  status: KanbanStatus;
  priority: ComputedPriority;
  created_at: string;
  student_document_id: string | null;
  document_type: string | null;
  days_open: number;
}

const PRIORITY_ORDER: Record<string, number> = {
  alta: 3,
  media: 2,
  baixa: 1,
};

/**
 * Normaliza o status livre de `secretary_requests` em uma das 3 colunas do Kanban.
 * Tudo que não for "em_andamento"/"concluido"/"resolvido" cai em "aberto" (inclui
 * legados como "pendente"/null) — garantindo que TODA demanda apareça na fila.
 */
function normalizeStatus(s: string | null | undefined): KanbanStatus {
  const v = (s ?? "").toLowerCase();
  if (v === "em_andamento") return "em_andamento";
  if (v === "concluido" || v === "resolvido") return "concluido";
  return "aberto";
}

/**
 * Normaliza a prioridade do banco (urgente/alta/media/baixa) para os 3 níveis
 * do Kanban. "urgente" colapsa em "alta".
 */
function normalizePriority(p: string | null | undefined): ComputedPriority {
  const v = (p ?? "").toLowerCase();
  if (v === "urgente" || v === "alta") return "alta";
  if (v === "baixa") return "baixa";
  return "media";
}

/**
 * Hook do Kanban da Secretaria Digital.
 * - Lê de `secretary_requests` (tabela canônica onde TODA demanda é gravada).
 * - Enriquece com nome do aluno, turma/série.
 * - Mantém na coluna "Concluído" apenas itens concluídos no dia atual; os
 *   demais saem da fila e ficam disponíveis no histórico.
 */
export function useSecretariaKanban() {
  const { schoolId, loading: schoolLoading } = useSchoolContext();
  const queryClient = useQueryClient();
  const queryKey = ["secretaria-kanban", schoolId];

  const {
    data: requests = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    enabled: !!schoolId,
    queryFn: async (): Promise<KanbanRequest[]> => {
      if (!schoolId) return [];

      const { data, error } = await supabase
        .from("secretary_requests")
        .select(
          "id, school_id, student_id, student_name, class_id, request_type, description, status, priority, created_at, updated_at"
        )
        .eq("school_id", schoolId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const rawRows = (data || []) as any[];

      // Busca nome + turma do aluno em uma única query
      const studentIds = Array.from(
        new Set(rawRows.map((r) => r.student_id).filter(Boolean))
      ) as string[];
      const studentMap: Record<string, { full_name: string; class_id: string | null }> = {};
      if (studentIds.length > 0) {
        const { data: students } = await supabase
          .from("students")
          .select("id, full_name, class_id")
          .in("id", studentIds);
        (students || []).forEach((s: any) => {
          studentMap[s.id] = { full_name: s.full_name, class_id: s.class_id };
        });
      }

      // Busca nome da turma + série
      const classIds = Array.from(
        new Set([
          ...rawRows.map((r) => r.class_id).filter(Boolean),
          ...Object.values(studentMap).map((s) => s.class_id).filter(Boolean),
        ])
      ) as string[];
      const classMap: Record<string, { name: string; grade: string | null }> = {};
      if (classIds.length > 0) {
        const { data: classes } = await supabase
          .from("classes")
          .select("id, name, grade")
          .in("id", classIds);
        (classes || []).forEach((c: any) => {
          classMap[c.id] = { name: c.name, grade: c.grade ?? null };
        });
      }

      const rows: KanbanRequest[] = rawRows.map((r) => {
        const student = r.student_id ? studentMap[r.student_id] : null;
        const klassId = r.class_id ?? student?.class_id ?? null;
        const klass = klassId ? classMap[klassId] : null;
        const days = Math.max(0, differenceInCalendarDays(new Date(), new Date(r.created_at)));
        const title =
          (r.description && String(r.description).trim()) ||
          r.request_type ||
          "Solicitação";
        return {
          id: r.id,
          school_id: r.school_id,
          student_id: r.student_id,
          student_name: student?.full_name ?? r.student_name ?? null,
          student_class: klass?.name ?? null,
          student_grade: klass?.grade ?? null,
          title,
          type: r.request_type ?? null,
          status: normalizeStatus(r.status),
          priority: normalizePriority(r.priority),
          created_at: r.created_at,
          student_document_id: null,
          document_type: null,
          days_open: days,
          // anexamos updated_at para o filtro de "concluído hoje"
          // (não exposto no tipo público porque é interno)
          _updated_at: r.updated_at ?? r.created_at,
        } as KanbanRequest & { _updated_at: string };
      });

      // Concluídos: só permanecem na fila se foram resolvidos hoje (via updated_at).
      const today = new Date();
      const finalRows = rows.filter((r) => {
        if (r.status !== "concluido") return true;
        const updated = (r as KanbanRequest & { _updated_at?: string })._updated_at ?? r.created_at;
        return isSameDay(new Date(updated), today);
      });

      // Ordenação: prioridade desc, depois mais antigos primeiro
      finalRows.sort((a, b) => {
        const pa = PRIORITY_ORDER[a.priority] ?? 0;
        const pb = PRIORITY_ORDER[b.priority] ?? 0;
        if (pb !== pa) return pb - pa;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      return finalRows;
    },
  });

  const mutation = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: KanbanStatus;
      notes?: string | null;
    }) => {
      if (!schoolId) throw new Error("schoolId ausente");
      const current = (queryClient.getQueryData<KanbanRequest[]>(queryKey) || requests).find(
        (r) => r.id === id
      );
      if (!current) throw new Error("Demanda não encontrada");
      await updateRequestStatus(
        {
          id: current.id,
          school_id: current.school_id,
          student_id: current.student_id,
          status: current.status,
        },
        status,
        notes ?? null
      );
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<KanbanRequest[]>(queryKey);
      queryClient.setQueryData<KanbanRequest[]>(queryKey, (old) =>
        (old || []).map((r) => (r.id === id ? { ...r, status } : r))
      );
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      console.error("[useSecretariaKanban] update falhou:", err);
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["secretary-counters"] });
      queryClient.invalidateQueries({ queryKey: ["secretary-alerts-bar"] });
      queryClient.invalidateQueries({ queryKey: ["secretary-actions-history"] });
      queryClient.invalidateQueries({ queryKey: ["secretary-requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-cards"] });
    },
  });

  const updateStatus = useCallback(
    (id: string, status: KanbanStatus, notes?: string | null) =>
      mutation.mutateAsync({ id, status, notes }),
    [mutation]
  );

  return {
    requests,
    loading: schoolLoading || (!!schoolId && isLoading),
    error: error as Error | null,
    updateStatus,
  };
}

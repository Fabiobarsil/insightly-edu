import { useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolContext } from "./useSchoolContext";
import { updateRequestStatus } from "@/lib/secretariaActions";

export type KanbanStatus = "pendente" | "em_andamento" | "concluido";
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
  request_status: KanbanStatus;
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
 * Normaliza o `request_status` vindo da view `secretaria_demands` para uma
 * das 3 colunas oficiais do Kanban: pendente | em_andamento | concluido.
 */
function normalizeStatus(s: string | null | undefined): KanbanStatus {
  const v = (s ?? "").toLowerCase();
  if (v === "em_andamento") return "em_andamento";
  if (v === "concluido" || v === "resolvido") return "concluido";
  return "pendente";
}

function normalizePriority(p: string | null | undefined): ComputedPriority {
  const v = (p ?? "").toLowerCase();
  if (v === "urgente" || v === "alta") return "alta";
  if (v === "baixa") return "baixa";
  return "media";
}

/**
 * Hook do Kanban da Secretaria Digital.
 * - Lê da view `secretaria_demands` (campo `request_status`).
 * - Enriquece com prioridade/tipo de `secretaria_requests` e dados do aluno.
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
        .from("secretaria_demands" as any)
        .select(
          "id, school_id, student_id, title, request_status, document_type, created_at"
        )
        .eq("school_id", schoolId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      const rawRows = (data || []) as any[];
      if (rawRows.length === 0) return [];

      // Enriquecimento: prioridade/tipo de secretaria_requests
      const ids = rawRows.map((r) => r.id);
      const extrasMap: Record<string, { priority: string | null; type: string | null; student_document_id: string | null }> = {};
      const { data: extras } = await supabase
        .from("secretaria_requests" as any)
        .select("id, priority, type, student_document_id")
        .in("id", ids);
      (extras || []).forEach((e: any) => {
        extrasMap[e.id] = {
          priority: e.priority ?? null,
          type: e.type ?? null,
          student_document_id: e.student_document_id ?? null,
        };
      });

      // Dados do aluno
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

      // Turmas
      const classIds = Array.from(
        new Set(Object.values(studentMap).map((s) => s.class_id).filter(Boolean))
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
        const klassId = student?.class_id ?? null;
        const klass = klassId ? classMap[klassId] : null;
        const days = Math.max(0, differenceInCalendarDays(new Date(), new Date(r.created_at)));
        const extra = extrasMap[r.id] || { priority: null, type: null, student_document_id: null };
        return {
          id: r.id,
          school_id: r.school_id,
          student_id: r.student_id,
          student_name: student?.full_name ?? null,
          student_class: klass?.name ?? null,
          student_grade: klass?.grade ?? null,
          title: r.title || extra.type || "Solicitação",
          type: extra.type,
          request_status: normalizeStatus(r.request_status),
          priority: normalizePriority(extra.priority),
          created_at: r.created_at,
          student_document_id: extra.student_document_id,
          document_type: r.document_type ?? null,
          days_open: days,
        };
      });

      rows.sort((a, b) => {
        const pa = PRIORITY_ORDER[a.priority] ?? 0;
        const pb = PRIORITY_ORDER[b.priority] ?? 0;
        if (pb !== pa) return pb - pa;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      return rows;
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
          status: current.request_status,
        },
        status,
        notes ?? null
      );
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<KanbanRequest[]>(queryKey);
      queryClient.setQueryData<KanbanRequest[]>(queryKey, (old) =>
        (old || []).map((r) => (r.id === id ? { ...r, request_status: status } : r))
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

  // Realtime: invalida o kanban quando secretaria_requests ou student_documents mudam
  useEffect(() => {
    if (!schoolId) return;
    const channel = supabase
      .channel(`secretaria-kanban-${schoolId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "secretaria_requests", filter: `school_id=eq.${schoolId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["secretaria-kanban", schoolId] });
          queryClient.invalidateQueries({ queryKey: ["secretary-counters"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "student_documents", filter: `school_id=eq.${schoolId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["secretaria-kanban", schoolId] });
          queryClient.invalidateQueries({ queryKey: ["secretary-counters"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [schoolId, queryClient]);

  return {
    requests,
    loading: schoolLoading || (!!schoolId && isLoading),
    error: error as Error | null,
    updateStatus,
  };
}

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolContext } from "./useSchoolContext";
import { updateRequestStatus } from "@/lib/secretariaActions";

export type KanbanStatus = "aberto" | "em_andamento" | "concluido";

export interface KanbanRequest {
  id: string;
  school_id: string;
  student_id: string | null;
  student_name: string | null;
  title: string;
  type: string | null;
  status: KanbanStatus;
  priority: "alta" | "media" | "baixa" | string;
  created_at: string;
}

const PRIORITY_ORDER: Record<string, number> = {
  alta: 3,
  urgente: 4,
  media: 2,
  baixa: 1,
};

/**
 * Hook do Kanban da Secretaria Digital.
 * - Lê de `secretaria_requests` filtrando por school_id.
 * - Faz join com students(full_name) para exibir o nome do aluno.
 * - Ordena por prioridade (desc) e created_at (asc).
 * - Atualiza status com optimistic update + rollback em caso de erro.
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
        .from("secretaria_requests")
        .select("id, school_id, student_id, title, type, status, priority, created_at")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const rawRows = (data || []) as any[];

      // Busca nomes de alunos em uma única query (evita dependência de FK declarada)
      const studentIds = Array.from(
        new Set(rawRows.map((r) => r.student_id).filter(Boolean))
      ) as string[];
      let nameMap: Record<string, string> = {};
      if (studentIds.length > 0) {
        const { data: students } = await supabase
          .from("students")
          .select("id, full_name")
          .in("id", studentIds);
        (students || []).forEach((s: any) => {
          nameMap[s.id] = s.full_name;
        });
      }

      const rows: KanbanRequest[] = rawRows.map((r) => ({
        id: r.id,
        school_id: r.school_id,
        student_id: r.student_id,
        student_name: r.student_id ? nameMap[r.student_id] ?? null : null,
        title: r.title,
        type: r.type,
        status: (r.status ?? "aberto") as KanbanStatus,
        priority: r.priority ?? "media",
        created_at: r.created_at,
      }));

      // priority desc, created_at asc
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
    mutationFn: async ({ id, status }: { id: string; status: KanbanStatus }) => {
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
        status
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
    },
  });

  const updateStatus = useCallback(
    (id: string, status: KanbanStatus) => mutation.mutateAsync({ id, status }),
    [mutation]
  );

  return {
    requests,
    loading: schoolLoading || (!!schoolId && isLoading),
    error: error as Error | null,
    updateStatus,
  };
}

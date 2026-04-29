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
 * Documentos considerados obrigatórios para fins de priorização automática.
 * Se a demanda for de um destes documentos pendentes, ela é marcada como ALTA.
 */
const MANDATORY_DOC_TYPES = new Set([
  "certidao_nascimento",
  "rg",
  "cpf",
  "comprovante_residencia",
  "historico_escolar",
  "foto_3x4",
]);

/**
 * Calcula a prioridade da demanda automaticamente, conforme regra do produto:
 * - alta:  aberta há > 3 dias OU documento obrigatório pendente
 * - media: aberta há 1 a 3 dias
 * - baixa: aberta hoje
 */
function computePriority(
  createdAt: string,
  documentType: string | null,
  type: string | null
): ComputedPriority {
  const days = Math.max(0, differenceInCalendarDays(new Date(), new Date(createdAt)));
  const isMandatoryDoc =
    !!documentType &&
    MANDATORY_DOC_TYPES.has(documentType) &&
    (type ?? "").toLowerCase().includes("document");
  if (days > 3 || isMandatoryDoc) return "alta";
  if (days >= 1) return "media";
  return "baixa";
}

/**
 * Hook do Kanban da Secretaria Digital.
 * - Lê de `secretaria_requests` filtrando por school_id.
 * - Enriquece com nome do aluno, turma/série e tipo de documento.
 * - Calcula prioridade automaticamente (regra única do produto).
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
        .from("secretaria_requests")
        .select("id, school_id, student_id, student_document_id, title, type, status, priority, created_at")
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

      // Busca document_type para enriquecer demandas de documento
      const docIds = Array.from(
        new Set(rawRows.map((r) => r.student_document_id).filter(Boolean))
      ) as string[];
      const docTypeMap: Record<string, string> = {};
      if (docIds.length > 0) {
        const { data: docs } = await supabase
          .from("student_documents")
          .select("id, document_type")
          .in("id", docIds);
        (docs || []).forEach((d: any) => {
          docTypeMap[d.id] = d.document_type;
        });
      }

      const rows: KanbanRequest[] = rawRows.map((r) => {
        const docType = r.student_document_id ? docTypeMap[r.student_document_id] ?? null : null;
        const student = r.student_id ? studentMap[r.student_id] : null;
        const klass = student?.class_id ? classMap[student.class_id] : null;
        const days = Math.max(0, differenceInCalendarDays(new Date(), new Date(r.created_at)));
        return {
          id: r.id,
          school_id: r.school_id,
          student_id: r.student_id,
          student_name: student?.full_name ?? null,
          student_class: klass?.name ?? null,
          student_grade: klass?.grade ?? null,
          title: r.title,
          type: r.type,
          status: (r.status ?? "aberto") as KanbanStatus,
          priority: computePriority(r.created_at, docType, r.type),
          created_at: r.created_at,
          student_document_id: r.student_document_id ?? null,
          document_type: docType,
          days_open: days,
        };
      });

      // Concluídos antigos (não hoje) saem da fila → ficam só no histórico
      const today = new Date();
      const filtered = rows.filter((r) => {
        if (r.status !== "concluido") return true;
        return isSameDay(new Date(r.created_at), today) || isSameDay(new Date(r.created_at), today)
          ? true
          : false;
      });

      // Para concluídos: usar created_at como proxy de "concluído hoje" não é ideal.
      // Como `secretaria_requests` não tem updated_at, usamos a tabela de ações para
      // descobrir quando foi concluído. Buscamos a última ação 'concluiu' por request.
      const concluidoIds = rows.filter((r) => r.status === "concluido").map((r) => r.id);
      const concludedTodaySet = new Set<string>();
      if (concluidoIds.length > 0) {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const { data: acts } = await supabase
          .from("secretaria_actions")
          .select("request_id, created_at, to_status")
          .in("request_id", concluidoIds)
          .eq("to_status", "concluido")
          .gte("created_at", startOfToday.toISOString());
        (acts || []).forEach((a: any) => {
          if (a.request_id) concludedTodaySet.add(a.request_id);
        });
      }

      const finalRows = rows.filter((r) => {
        if (r.status !== "concluido") return true;
        return concludedTodaySet.has(r.id);
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

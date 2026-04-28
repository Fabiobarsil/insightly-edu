import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolContext } from "./useSchoolContext";

export interface SecretariaDashboardData {
  alunos: number;
  documentosPendentes: number;
  fila: number;
  alertas: number;
  loading: boolean;
}

/**
 * Hook que entrega as contagens reais para os cards da Secretaria Digital.
 * - Não retorna listas, apenas contagens (head: true, count: "exact").
 * - Não executa queries sem schoolId resolvido.
 *
 * Observação sobre o schema real do projeto:
 *  - A tabela é `secretary_requests` (não `secretaria_requests`).
 *  - `student_documents.status` é boolean → pendente = false.
 *  - Prioridade crítica em `secretary_requests` é "urgente".
 */
export function useSecretariaDashboard(): SecretariaDashboardData {
  const { schoolId, loading: schoolLoading } = useSchoolContext();

  const { data, isLoading } = useQuery({
    queryKey: ["secretaria-dashboard", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      if (!schoolId) {
        return { alunos: 0, documentosPendentes: 0, fila: 0, alertas: 0 };
      }

      const [alunosRes, documentosRes, filaRes, alertasRes] = await Promise.all([
        // 1. Alunos ativos
        supabase
          .from("students")
          .select("id", { count: "exact", head: true })
          .eq("school_id", schoolId)
          .eq("status", "ativo"),

        // 2. Documentos pendentes (status boolean: false = pendente)
        supabase
          .from("student_documents")
          .select("id", { count: "exact", head: true })
          .eq("school_id", schoolId)
          .neq("status", "aprovado"),

        // 3. Fila operacional (aberto + em_andamento + pendente)
        supabase
          .from("secretary_requests")
          .select("id", { count: "exact", head: true })
          .eq("school_id", schoolId)
          .in("status", ["aberto", "em_andamento", "pendente"]),

        // 4. Alertas críticos (prioridade urgente, ainda não concluídos)
        supabase
          .from("secretary_requests")
          .select("id", { count: "exact", head: true })
          .eq("school_id", schoolId)
          .eq("priority", "urgente")
          .neq("status", "concluido"),
      ]);

      return {
        alunos: alunosRes.count ?? 0,
        documentosPendentes: documentosRes.count ?? 0,
        fila: filaRes.count ?? 0,
        alertas: alertasRes.count ?? 0,
      };
    },
  });

  return {
    alunos: data?.alunos ?? 0,
    documentosPendentes: data?.documentosPendentes ?? 0,
    fila: data?.fila ?? 0,
    alertas: data?.alertas ?? 0,
    loading: schoolLoading || (!!schoolId && isLoading),
  };
}

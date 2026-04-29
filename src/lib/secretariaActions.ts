import { supabase } from "@/integrations/supabase/client";

export type RequestStatus = "aberto" | "em_andamento" | "concluido" | string;

export interface SecretariaRequestRef {
  id: string;
  school_id: string;
  student_id: string | null;
  status: RequestStatus;
}

/**
 * Mapeia transição de status -> action_type registrado em secretaria_actions.
 * Retorna null para transições não mapeadas (não registra ação).
 */
export const mapActionType = (
  from: RequestStatus,
  to: RequestStatus
): string | null => {
  if (from === to) return null;
  if (from === "aberto" && to === "em_andamento") return "iniciou";
  if (from === "em_andamento" && to === "concluido") return "concluiu";
  if (from === "em_andamento" && to === "aberto") return "retornou";
  if (from === "aberto" && to === "concluido") return "concluiu";
  if (from === "concluido" && to === "aberto") return "reabriu";
  if (from === "concluido" && to === "em_andamento") return "reabriu";
  return "alterou";
};

/**
 * Atualiza o status de uma demanda em `secretaria_requests` e registra
 * automaticamente a ação em `secretaria_actions`.
 *
 * - Não duplica lógica: este é o único ponto de mudança de status.
 * - Se o registro de ação falhar, apenas loga (não desfaz o update).
 */
export async function updateRequestStatus(
  request: SecretariaRequestRef,
  newStatus: RequestStatus,
  notes: string | null = null
): Promise<void> {
  const fromStatus = request.status;

  // PASSO 1: update do status
  const { error: updateError } = await supabase
    .from("secretaria_requests")
    .update({ status: newStatus })
    .eq("id", request.id);
  if (updateError) throw updateError;

  // PASSO 2: registro da ação (best-effort)
  const actionType = mapActionType(fromStatus, newStatus);
  if (!actionType && !notes) return;

  const { data: auth } = await supabase.auth.getUser();
  const performedBy = auth?.user?.id ?? null;

  const { error: actionError } = await supabase
    .from("secretaria_actions")
    .insert({
      school_id: request.school_id,
      request_id: request.id,
      student_id: request.student_id,
      action_type: actionType ?? "observacao",
      from_status: fromStatus,
      to_status: newStatus,
      performed_by: performedBy,
      notes: notes && notes.trim() ? notes.trim() : null,
    });

  if (actionError) {
    console.error("[secretariaActions] falha ao registrar ação:", actionError);
  }
}

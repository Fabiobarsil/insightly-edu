import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Ações reconhecidas pela função SQL has_permission(action text).
 * Use estes nomes para manter consistência com o backend.
 */
export type PermissionAction =
  | "student.create"
  | "student.update"
  | "student.delete"
  | "student.view"
  | "document.create"
  | "document.update"
  | "document.view"
  | "user.create"
  | "user.update"
  | "grades.create"
  | "grades.update"
  | "attendance.create"
  | "attendance.update"
  | "pedagogical.view"
  | "pedagogical.update"
  | "psychology.view"
  | "psychology.update"
  | "dashboard.view"
  | "reports.view";

/**
 * Consulta a função has_permission() no Supabase.
 * Retorna false (e não lança) em caso de erro de rede.
 */
export const checkPermission = async (action: PermissionAction): Promise<boolean> => {
  const { data, error } = await supabase.rpc("has_permission", { action });
  if (error) {
    console.error("[checkPermission] erro:", error);
    return false;
  }
  return Boolean(data);
};

/**
 * Valida a permissão antes de executar uma ação.
 * Em caso negativo, exibe toast padrão e retorna false.
 *
 * Uso típico:
 *   if (!(await ensurePermission("student.create"))) return;
 *   // ... prossegue com a ação
 */
export const ensurePermission = async (action: PermissionAction): Promise<boolean> => {
  const ok = await checkPermission(action);
  if (!ok) {
    toast.error("Você não tem permissão para essa ação");
  }
  return ok;
};

import { usePermission } from "@/hooks/usePermission";
import { useUserAccess } from "@/hooks/useUserAccess";

/**
 * Permissões de gestão de alunos. Agora delega para `has_permission` no
 * banco (via usePermission), centralizando a regra no backend.
 *
 * - canCreate → student.create
 * - canEdit   → student.update
 * - canDelete → owner exclusivo (não há ação `student.delete` no has_permission)
 */
export const useStudentPermissions = () => {
  const { access, loading: accessLoading } = useUserAccess();
  const role = access?.role?.toLowerCase() ?? null;

  const create = usePermission("student.create");
  const update = usePermission("student.update");

  return {
    role,
    loading: accessLoading || create.loading || update.loading,
    canCreate: create.allowed,
    canEdit: update.allowed,
    canDelete: role === "owner",
  };
};

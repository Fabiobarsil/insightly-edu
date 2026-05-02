import { useUserAccess } from "@/hooks/useUserAccess";

/**
 * Permissões de gestão de alunos baseadas na role retornada por get_user_access().
 *
 * Regras:
 * - Criar aluno:  secretaria, owner
 * - Editar aluno: secretaria, owner
 * - Excluir aluno: owner
 * - Professor: nenhuma ação de gestão
 * - Coordenador: somente visualizar
 */
export const useStudentPermissions = () => {
  const { access, loading } = useUserAccess();
  const role = access?.role?.toLowerCase() ?? null;

  const canCreate = role === "owner" || role === "secretaria";
  const canEdit = role === "owner" || role === "secretaria";
  const canDelete = role === "owner";

  return { role, loading, canCreate, canEdit, canDelete };
};

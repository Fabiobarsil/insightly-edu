import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserAccess } from "@/hooks/useUserAccess";
import { isFullAccessRole } from "@/lib/roles";

/**
 * Protege rotas validando:
 * 1. Sessão ativa (caso contrário → /login)
 * 2. Acesso via get_user_access() OU role do AuthContext (fallback)
 * 3. A role autorizada bate com o `dashboardRole`, com o role efetivo
 *    em `account_members`, ou é uma role FULL ACCESS
 *    (owner / diretor / coordenador / secretaria / admin / administracao)
 */
export default function RoleRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { dashboardRole, role, loading: authLoading, session } = useAuth();
  const { access, loading: accessLoading } = useUserAccess();

  const loading = authLoading || accessLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const accessRole = access?.role?.toLowerCase() ?? null;
  const authRole = role?.toLowerCase() ?? null;

  // Sem fonte de role alguma → /sem-acesso
  if (!accessRole && !dashboardRole && !authRole) {
    return <Navigate to="/sem-acesso" replace />;
  }

  // Roles FULL ACCESS (owner, diretor, coordenador, secretaria, admin,
  // administracao) podem entrar em QUALQUER rota do sistema.
  // Verifica em todas as fontes possíveis (account_members, profiles,
  // school_memberships) para não bloquear usuário válido.
  const hasFullAccess =
    isFullAccessRole(accessRole) ||
    isFullAccessRole(authRole) ||
    dashboardRole === "admin" ||
    dashboardRole === "secretaria";

  const isAllowed =
    hasFullAccess ||
    (dashboardRole && allowedRoles.includes(dashboardRole)) ||
    (accessRole && allowedRoles.includes(accessRole)) ||
    (authRole && allowedRoles.includes(authRole));

  if (!isAllowed) {
    return <Navigate to="/sem-acesso" replace />;
  }

  return <>{children}</>;
}

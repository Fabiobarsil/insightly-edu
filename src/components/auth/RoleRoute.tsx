import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserAccess } from "@/hooks/useUserAccess";
import { isFullAccessRole } from "@/lib/roles";

/**
 * Protege rotas validando:
 * 1. Sessão ativa (caso contrário → /login)
 * 2. Role identificada via AuthContext (account_members → profiles → school_memberships)
 *    ou, como reforço, via get_user_access().
 * 3. Roles FULL ACCESS (owner / diretor / coordenador / secretaria / admin / administracao)
 *    têm passe livre em qualquer rota do sistema.
 *
 * IMPORTANTE: NUNCA bloqueia o usuário enquanto o AuthContext já tem uma role
 * válida. O `useUserAccess` é apenas um reforço — falhas dele não devem
 * derrubar o acesso de quem já está autenticado com role conhecida.
 */
export default function RoleRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { dashboardRole, role, loading: authLoading, session } = useAuth();
  const { access } = useUserAccess(); // não bloqueia loading do RoleRoute

  // Apenas o auth principal trava o render. O useUserAccess roda em paralelo
  // mas não deve segurar a tela — evita loops de loading se a RPC falhar.
  if (authLoading) {
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

  // Sem nenhuma fonte de role → /sem-acesso
  if (!authRole && !accessRole && !dashboardRole) {
    return <Navigate to="/sem-acesso" replace />;
  }

  // FULL ACCESS: owner, diretor, coordenador, secretaria, admin, administracao
  const hasFullAccess =
    isFullAccessRole(authRole) ||
    isFullAccessRole(accessRole) ||
    dashboardRole === "admin" ||
    dashboardRole === "secretaria" ||
    dashboardRole === "superadmin";

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

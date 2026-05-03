import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserAccess } from "@/hooks/useUserAccess";

/**
 * Protege rotas validando:
 * 1. Sessão ativa (caso contrário → /login)
 * 2. Acesso via get_user_access() OU role do AuthContext (fallback)
 * 3. A role autorizada bate com o `dashboardRole` OU com o role efetivo
 *    em `account_members` (caso contrário → /sem-acesso)
 */
export default function RoleRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { dashboardRole, loading: authLoading, session } = useAuth();
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

  // Sem fonte de role alguma → /sem-acesso
  if (!accessRole && !dashboardRole) {
    return <Navigate to="/sem-acesso" replace />;
  }

  // Roles administrativos têm acesso FULL ao sistema (equivalentes a "admin").
  const FULL_ACCESS_ROLES = ["owner", "admin", "diretor", "coordenador", "administracao", "secretaria"];
  const hasFullAccess =
    (accessRole && FULL_ACCESS_ROLES.includes(accessRole)) ||
    (dashboardRole === "admin") ||
    (dashboardRole === "secretaria");

  // Aceita match por dashboardRole (legado) OU pelo role oficial em account_members.
  // Roles full-access passam em qualquer rota (admin, secretaria, etc).
  const isAllowed =
    (dashboardRole && allowedRoles.includes(dashboardRole)) ||
    (accessRole && allowedRoles.includes(accessRole)) ||
    (hasFullAccess && (allowedRoles.includes("admin") || allowedRoles.includes("secretaria")));

  if (!isAllowed) {
    return <Navigate to="/sem-acesso" replace />;
  }

  return <>{children}</>;
}

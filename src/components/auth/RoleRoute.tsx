import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserAccess } from "@/hooks/useUserAccess";

/**
 * Protege rotas validando:
 * 1. Sessão ativa (caso contrário → /login)
 * 2. Acesso via get_user_access() OU role do AuthContext (fallback)
 * 3. Role pertence a allowedRoles (caso contrário → /sem-acesso)
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

  // Sem sessão → login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Sem acesso de fonte alguma → /sem-acesso
  if (!access && !dashboardRole) {
    return <Navigate to="/sem-acesso" replace />;
  }

  // Valida se a role atual está autorizada
  const effectiveRole = dashboardRole;
  if (!effectiveRole || !allowedRoles.includes(effectiveRole)) {
    return <Navigate to="/sem-acesso" replace />;
  }

  return <>{children}</>;
}

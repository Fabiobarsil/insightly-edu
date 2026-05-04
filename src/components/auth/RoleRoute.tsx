import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Protege rotas validando:
 * 1. Carregando sessão  → loader
 * 2. Sem sessão         → /login
 * 3. Sem role           → /sem-acesso
 * 4. Role FULL ACCESS   → libera qualquer rota
 *    (owner, admin, diretor, coordenador, secretaria, administracao, superadmin)
 * 5. Role na lista permitida → libera rota
 *
 * IMPORTANTE: este componente NUNCA chama get_user_access() nem qualquer outra
 * RPC — depende apenas do AuthContext, que já consulta account_members /
 * profiles / school_memberships uma única vez no boot. Isso evita bloqueios
 * indevidos por falhas de rede ou por RPC retornando 401.
 */

const FULL_ACCESS_ROLES = [
  "owner",
  "admin",
  "diretor",
  "coordenador",
  "secretaria",
  "administracao",
  "superadmin",
];

export default function RoleRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { session, loading, role, dashboardRole } = useAuth();

  // 1. Carregando → loader (NUNCA redireciona durante loading)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // 2. Sem sessão → /login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const effectiveRole = (role ?? dashboardRole ?? "").toLowerCase();

  // 3. Sem role identificada → /sem-acesso
  if (!effectiveRole) {
    return <Navigate to="/sem-acesso" replace />;
  }

  // 4. FULL ACCESS → libera qualquer rota
  if (FULL_ACCESS_ROLES.includes(effectiveRole)) {
    return <>{children}</>;
  }

  // 5. Role permitida explicitamente
  const allowed = allowedRoles.map((r) => r.toLowerCase());
  if (
    allowed.includes(effectiveRole) ||
    (dashboardRole && allowed.includes(dashboardRole.toLowerCase()))
  ) {
    return <>{children}</>;
  }

  return <Navigate to="/sem-acesso" replace />;
}

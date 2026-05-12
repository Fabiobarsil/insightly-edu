import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const FULL_ACCESS_ROLES = ["owner", "admin", "diretor", "coordenador", "secretaria", "administracao", "superadmin"];

export default function RoleRoute({ children, allowedRoles }) {
  const { session, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
      </div>
    );
  }

  const effectiveRole = role.toLowerCase();

  if (FULL_ACCESS_ROLES.includes(effectiveRole)) {
    return <>{children}</>;
  }

  const allowed = (allowedRoles || []).map((r: string) => r.toLowerCase());

  if (allowed.includes(effectiveRole)) {
    return <>{children}</>;
  }

  return <Navigate to="/sem-acesso" replace />;
}

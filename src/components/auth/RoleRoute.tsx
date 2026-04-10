import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/AuthContext";

export default function RoleRoute({ children, allowedRoles }) {
  const { dashboardRole, loading } = useAuth();

  if (loading) return null;

  if (!dashboardRole || !allowedRoles.includes(dashboardRole)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

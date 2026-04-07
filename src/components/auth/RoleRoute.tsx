import { Navigate } from "react-router-dom";
import { useAuth, DashboardRole, getDashboardPath } from "@/contexts/AuthContext";

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: DashboardRole[];
}

const RoleRoute = ({ children, allowedRoles }: RoleRouteProps) => {
  const { session, loading, dashboardRole } = useAuth();

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

  if (!dashboardRole || !allowedRoles.includes(dashboardRole)) {
    // Redirect to their own dashboard
    const path = dashboardRole ? getDashboardPath(dashboardRole) : "/login";
    return <Navigate to={path} replace />;
  }

  return <>{children}</>;
};

export default RoleRoute;

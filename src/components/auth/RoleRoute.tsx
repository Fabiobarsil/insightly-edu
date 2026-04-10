import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function RoleRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { dashboardRole, loading } = useAuth();

  console.log("ROLE ROUTE:", { dashboardRole, loading });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!dashboardRole || !allowedRoles.includes(dashboardRole)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

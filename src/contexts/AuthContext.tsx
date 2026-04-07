import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "owner" | "admin" | "secretaria" | "coordenador" | "professor" | "auxiliar";

export type DashboardRole = "superadmin" | "admin" | "secretaria" | "professor";

const roleToDashboard: Record<AppRole, DashboardRole> = {
  owner: "superadmin",
  admin: "admin",
  coordenador: "admin",
  secretaria: "secretaria",
  auxiliar: "secretaria",
  professor: "professor",
};

export const getDashboardPath = (role: DashboardRole) => {
  const paths: Record<DashboardRole, string> = {
    superadmin: "/superadmin/dashboard",
    admin: "/admin/dashboard",
    secretaria: "/secretaria/dashboard",
    professor: "/professor/dashboard",
  };
  return paths[role];
};

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: AppRole | null;
  dashboardRole: DashboardRole | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  role: null,
  dashboardRole: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);

  const fetchRole = async (userId: string) => {
    // 1. Check profiles.role for superadmin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profile?.role === "superadmin") {
      setRole("owner"); // owner maps to superadmin dashboard
      return;
    }

    // 2. Fallback to school_memberships
    const { data, error } = await supabase
      .from("school_memberships")
      .select("role")
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (error) {
      console.error("Erro ao buscar role:", error);
      setRole(null);
    } else {
      setRole(data.role as AppRole);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          await fetchRole(session.user.id);
        } else {
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await fetchRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  const dashboardRole = role ? roleToDashboard[role] : null;

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, role, dashboardRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

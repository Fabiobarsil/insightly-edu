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
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    console.log("[AuthContext] profile lookup for userId:", userId, "result:", profile, "error:", profileError);

    if (profile?.role === "superadmin") {
      console.log("[AuthContext] superadmin detected, setting role to owner");
      setRole("owner");
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
      return;
    }

    setRole(data.role as AppRole);
  };

  useEffect(() => {
    let isMounted = true;

    const syncAuthState = async (nextSession: Session | null) => {
      if (!isMounted) return;

      setSession(nextSession);

      if (!nextSession?.user) {
        setRole(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      await fetchRole(nextSession.user.id);

      if (isMounted) {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncAuthState(nextSession);
    });

    void supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      void syncAuthState(currentSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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

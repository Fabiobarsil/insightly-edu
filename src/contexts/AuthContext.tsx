import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
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
  const isMounted = useRef(true);

  const fetchRole = async (userId: string) => {
    try {
      // 1. Check profiles.role for superadmin
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      console.log("[AuthContext] profile lookup:", userId, profile, profileError);

      if (profile?.role === "superadmin") {
        if (isMounted.current) setRole("owner");
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
        if (isMounted.current) setRole(null);
      } else {
        if (isMounted.current) setRole(data.role as AppRole);
      }
    } catch (err) {
      console.error("fetchRole exception:", err);
      if (isMounted.current) setRole(null);
    }
  };

  useEffect(() => {
    isMounted.current = true;

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!isMounted.current) return;
      setSession(currentSession);

      if (currentSession?.user) {
        fetchRole(currentSession.user.id).then(() => {
          if (isMounted.current) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen to auth changes - DO NOT await inside the callback to avoid lock deadlocks
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted.current) return;
      setSession(nextSession);

      if (nextSession?.user) {
        // Use setTimeout to break out of the auth lock before making DB queries
        setTimeout(() => {
          if (!isMounted.current) return;
          fetchRole(nextSession.user.id).then(() => {
            if (isMounted.current) setLoading(false);
          });
        }, 0);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted.current = false;
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

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
  const mountedRef = useRef(true);

  // Standalone function that fetches role - called OUTSIDE of auth lock
  const fetchRole = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      console.log("[Auth] profile for", userId, ":", profile);

      if (!mountedRef.current) return;

      if (profile?.role === "superadmin") {
        setRole("owner");
        return;
      }

      const { data: membership } = await supabase
        .from("school_memberships")
        .select("role")
        .eq("user_id", userId)
        .limit(1)
        .single();

      console.log("[Auth] membership for", userId, ":", membership);

      if (!mountedRef.current) return;
      setRole(membership?.role ? (membership.role as AppRole) : null);
    } catch (err) {
      console.error("[Auth] fetchRole error:", err);
      if (mountedRef.current) setRole(null);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    // 1. Restore session from storage
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mountedRef.current) return;
      console.log("[Auth] getSession:", s?.user?.id ?? "no session");
      setSession(s);

      if (s?.user) {
        fetchRole(s.user.id).finally(() => {
          if (mountedRef.current) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    // IMPORTANT: Do NOT await anything inside this callback - it holds an internal lock.
    // Use .then() to defer DB queries outside the lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        console.log("[Auth] onAuthStateChange:", _event, nextSession?.user?.id);

        if (!mountedRef.current) return;
        setSession(nextSession);

        if (nextSession?.user) {
          const userId = nextSession.user.id;
          // Use .then() - this returns immediately, releasing the auth lock
          // The fetchRole promise runs after the callback returns
          Promise.resolve().then(() => {
            if (!mountedRef.current) return;
            fetchRole(userId).finally(() => {
              if (mountedRef.current) setLoading(false);
            });
          });
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mountedRef.current = false;
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

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "superadmin"
  | "owner"
  | "admin"
  | "secretaria"
  | "coordenador"
  | "diretor"
  | "professor"
  | "psicologo"
  | "auxiliar";

export type DashboardRole = "superadmin" | "admin" | "secretaria" | "professor" | "psicologo";

const roleToDashboard: Record<AppRole, DashboardRole> = {
  superadmin: "superadmin",
  owner: "admin",
  admin: "admin",
  diretor: "admin",
  coordenador: "admin",
  secretaria: "secretaria",
  auxiliar: "secretaria",
  professor: "professor",
  psicologo: "psicologo",
};

export const getDashboardPath = (role: DashboardRole) => {
  const paths: Record<DashboardRole, string> = {
    superadmin: "/superadmin/dashboard",
    admin: "/admin/dashboard",
    secretaria: "/admin/dashboard",
    professor: "/professor/dashboard",
    psicologo: "/psicologia/dashboard",
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
      // 1) Superadmin global vem de profiles.role (visão SaaS, fora da escola)
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();

      if (!mountedRef.current) return;

      if (profile?.role === "superadmin") {
        setRole("superadmin"); // visão SaaS global
        return;
      }

      // 2) Fonte oficial da escola: account_members (alimenta get_user_access())
      const { data: accountMember } = await supabase
        .from("account_members")
        .select("role")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (!mountedRef.current) return;

      if (accountMember?.role) {
        const r = accountMember.role.toLowerCase();
        const known = ["owner", "admin", "secretaria", "coordenador", "diretor", "professor", "psicologo", "auxiliar"];
        if (known.includes(r)) {
          setRole(r as AppRole);
          return;
        }
      }

      // 3) Fallback legado: school_memberships.role
      const { data: membership } = await supabase
        .from("school_memberships")
        .select("role")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (!mountedRef.current) return;
      setRole(membership?.role ? (membership.role as AppRole) : null);
    } catch (err) {
      console.error("[Auth] fetchRole error:", err);
      if (mountedRef.current) setRole(null);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    // 1. Restore session from storage - ALWAYS call setLoading(false)
    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        if (!mountedRef.current) return;

        console.log("[Auth] SESSION:", s);
        console.log("[Auth] USER:", s?.user ?? null);
        setSession(s);

        if (s?.user) {
          fetchRole(s.user.id).finally(() => {
            if (mountedRef.current) {
              console.log("[Auth] LOADING FINALIZADO (com sessão)");
              setLoading(false);
            }
          });
        } else {
          console.log("[Auth] LOADING FINALIZADO (sem sessão)");
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("[Auth] getSession error:", err);
        if (mountedRef.current) {
          setSession(null);
          setLoading(false);
          console.log("[Auth] LOADING FINALIZADO (erro getSession)");
        }
      });

    // 2. Listen for auth changes
    // IMPORTANT: Do NOT await anything inside this callback - it holds an internal lock.
    // Use .then() to defer DB queries outside the lock.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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
        console.log("Nenhum role encontrado — criando fallback");

        setRole("owner"); // 👈 TEMPORÁRIO pra destravar
        setLoading(false);
      }
    });

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

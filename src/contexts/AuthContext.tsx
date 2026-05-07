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

  const fetchRole = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_superadmin, status")
        .eq("id", userId)
        .maybeSingle();

      if (!mountedRef.current) return;

      const known = [
        "superadmin",
        "owner",
        "admin",
        "secretaria",
        "coordenador",
        "diretor",
        "professor",
        "psicologo",
        "auxiliar",
      ];

      // 🔥 SUPERADMIN
      if (profile?.is_superadmin || profile?.role?.toLowerCase() === "superadmin") {
        console.log("[Auth] SUPERADMIN DETECTADO");
        setRole("superadmin");
        return;
      }

      if (profile?.role) {
        const r = profile.role.toLowerCase();
        if (known.includes(r)) {
          setRole(r as AppRole);
          return;
        }
      }

      // 🔹 account_members
      const { data: accountMember, error: accountMemberError } = await supabase
        .from("account_members")
        .select("role")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (!mountedRef.current) return;

      if (accountMemberError) {
        console.warn("[Auth] erro ao buscar account_members:", accountMemberError);
      }

      if (accountMember?.role) {
        const r = accountMember.role.toLowerCase();
        if (known.includes(r)) {
          setRole(r as AppRole);
          return;
        }
      }

      // 🔹 school_memberships (compat)
      const { data: membership } = await supabase
        .from("school_memberships")
        .select("role")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (!mountedRef.current) return;

      if (membership?.role) {
        const r = (membership.role as string).toLowerCase();
        if (known.includes(r)) {
          setRole(r as AppRole);
          return;
        }
      }

      console.warn("[Auth] usuário autenticado, mas sem permissão no sistema");
      setRole(null);
    } catch (err) {
      console.error("[Auth] fetchRole error:", err);
      if (mountedRef.current) setRole(null);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        if (!mountedRef.current) return;

        setSession(s);

        if (s?.user) {
          fetchRole(s.user.id).finally(() => {
            if (mountedRef.current) setLoading(false);
          });
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        if (mountedRef.current) {
          setSession(null);
          setLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mountedRef.current) return;

      setSession(nextSession);

      if (nextSession?.user) {
        const userId = nextSession.user.id;
        setLoading(true);

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
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        role,
        dashboardRole,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

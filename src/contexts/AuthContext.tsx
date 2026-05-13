import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "superadmin"
  | "owner"
  | "admin"
  | "administracao"
  | "secretaria"
  | "coordenador"
  | "diretor"
  | "professor"
  | "psicologo"
  | "auxiliar";

export type DashboardRole = "superadmin" | "admin" | "secretaria" | "professor" | "psicologo";
export type AccessStatus = "pending" | "active" | "rejected" | "suspended";

const KNOWN_ROLES: AppRole[] = [
  "superadmin", "owner", "admin", "administracao", "secretaria",
  "coordenador", "diretor", "professor", "psicologo", "auxiliar",
];

const roleToDashboard: Record<AppRole, DashboardRole> = {
  superadmin: "superadmin",
  owner: "admin",
  admin: "admin",
  administracao: "admin",
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

const normalizeRole = (value: string | null | undefined): AppRole | null => {
  if (!value) return null;
  const v = value.toLowerCase().trim() as AppRole;
  return KNOWN_ROLES.includes(v) ? v : null;
};

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: AppRole | null;
  dashboardRole: DashboardRole | null;
  schoolId: string | null;
  status: AccessStatus | null;
  refreshAccess: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  role: null,
  dashboardRole: null,
  schoolId: null,
  status: null,
  refreshAccess: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const TIMEOUT_MS = 8000;
const withTimeout = async <T,>(p: PromiseLike<T>, label: string): Promise<T> => {
  let t: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(p),
      new Promise<T>((_, reject) => {
        t = setTimeout(() => reject(new Error(`[Auth] timeout em ${label}`)), TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (t) clearTimeout(t);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [status, setStatus] = useState<AccessStatus | null>(null);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const fetchAccessFor = async (userId: string, requestId: number) => {
    try {
      const { data, error } = await withTimeout(supabase.rpc("get_my_access"), "get_my_access");
      if (!mountedRef.current || requestIdRef.current !== requestId) return;

      if (error) {
        console.warn("[Auth] get_my_access erro:", error);
        setRole(null);
        setSchoolId(null);
        setStatus(null);
        return;
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        setRole(null);
        setSchoolId(null);
        setStatus(null);
        return;
      }

      setRole(normalizeRole(row.role));
      setSchoolId((row.school_id as string | null) ?? null);
      setStatus(((row.status as AccessStatus | null) ?? null));
    } catch (err) {
      console.error("[Auth] erro ao carregar acesso:", err);
      if (mountedRef.current && requestIdRef.current === requestId) {
        setRole(null);
        setSchoolId(null);
        setStatus(null);
      }
    } finally {
      if (mountedRef.current && requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  const refreshAccess = async () => {
    if (!session?.user) return;
    requestIdRef.current += 1;
    await fetchAccessFor(session.user.id, requestIdRef.current);
  };

  useEffect(() => {
    mountedRef.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mountedRef.current) return;
      if (event === "INITIAL_SESSION") return;

      requestIdRef.current += 1;
      const reqId = requestIdRef.current;

      setSession(nextSession);
      setRole(null);
      setSchoolId(null);
      setStatus(null);

      if (event === "SIGNED_OUT" || !nextSession?.user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      // Defer to break out of supabase callback
      setTimeout(() => {
        if (mountedRef.current && requestIdRef.current === reqId) {
          void fetchAccessFor(nextSession.user.id, reqId);
        }
      }, 0);
    });

    (async () => {
      try {
        setLoading(true);
        const { data: { session: s } } = await withTimeout(supabase.auth.getSession(), "getSession");
        if (!mountedRef.current) return;
        setSession(s);
        if (s?.user) {
          requestIdRef.current += 1;
          await fetchAccessFor(s.user.id, requestIdRef.current);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("[Auth] init error:", err);
        if (mountedRef.current) {
          setSession(null);
          setRole(null);
          setSchoolId(null);
          setStatus(null);
          setLoading(false);
        }
      }
    })();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearLocal = () => {
    if (typeof window === "undefined") return;
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("sb-") || k.includes("supabase.auth"))) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn("[Auth] clearLocal:", e);
    }
  };

  const signOut = async () => {
    requestIdRef.current += 1;
    setSession(null);
    setRole(null);
    setSchoolId(null);
    setStatus(null);
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch (e) {
      console.warn("[Auth] signOut:", e);
    }
    clearLocal();
    setLoading(false);
  };

  // Só considera dashboardRole quando o status estiver ativo
  const dashboardRole = role && status === "active" ? roleToDashboard[role] : null;

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        role: status === "active" ? role : null,
        dashboardRole,
        schoolId,
        status,
        refreshAccess,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";
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

const KNOWN_ROLES: AppRole[] = [
  "superadmin",
  "owner",
  "admin",
  "administracao",
  "secretaria",
  "coordenador",
  "diretor",
  "professor",
  "psicologo",
  "auxiliar",
];

const AUTH_TIMEOUT_MS = 10000;
const AUTH_CALLBACK_PATHS = new Set(["/aceitar-convite", "/reset-password"]);
type AuthOtpType = "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email";
const OTP_TYPES: AuthOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

const normalizeRole = (value?: string | null): AppRole | null => {
  if (!value) return null;
  const role = value.toLowerCase() as AppRole;
  return KNOWN_ROLES.includes(role) ? role : null;
};

const normalizeOtpType = (value: string | null): AuthOtpType | null => {
  if (!value) return null;
  return OTP_TYPES.includes(value as AuthOtpType) ? (value as AuthOtpType) : null;
};

const withTimeout = async <T,>(promise: Promise<T>, label: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} excedeu o tempo limite`)), AUTH_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const getUrlParams = () => {
  const url = new URL(window.location.href);
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  return {
    url,
    hashParams: new URLSearchParams(hash),
    queryParams: url.searchParams,
  };
};

const hasAuthParams = () => {
  if (typeof window === "undefined") return false;
  const { hashParams, queryParams } = getUrlParams();
  return (
    queryParams.has("code") ||
    queryParams.has("token_hash") ||
    queryParams.has("type") ||
    queryParams.has("error") ||
    queryParams.has("error_description") ||
    hashParams.has("access_token") ||
    hashParams.has("refresh_token") ||
    hashParams.has("type") ||
    hashParams.has("error") ||
    hashParams.has("error_description")
  );
};

const cleanAuthParamsFromUrl = () => {
  if (typeof window === "undefined" || !hasAuthParams()) return;

  const { url } = getUrlParams();
  const authQueryParams = [
    "code",
    "token_hash",
    "type",
    "error",
    "error_code",
    "error_description",
    "access_token",
    "refresh_token",
    "expires_in",
    "expires_at",
    "token_type",
  ];

  authQueryParams.forEach((param) => url.searchParams.delete(param));
  const nextSearch = url.searchParams.toString();
  const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
  window.history.replaceState(null, "", nextUrl);
};

const processAuthCallbackFromUrl = async () => {
  if (typeof window === "undefined" || !hasAuthParams()) return;

  const pathname = window.location.pathname;
  if (AUTH_CALLBACK_PATHS.has(pathname)) return;

  const { hashParams, queryParams } = getUrlParams();
  const errorDescription = hashParams.get("error_description") || queryParams.get("error_description");
  const errorCode = hashParams.get("error") || queryParams.get("error");

  if (errorDescription || errorCode) {
    console.error("[Auth] callback retornou erro:", errorCode, errorDescription);
    cleanAuthParamsFromUrl();
    return;
  }

  const code = queryParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) console.error("[Auth] exchangeCodeForSession error:", error);
  }

  const tokenHash = queryParams.get("token_hash");
  const otpType = normalizeOtpType(queryParams.get("type"));
  if (tokenHash && otpType) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });
    if (error) console.error("[Auth] verifyOtp error:", error);
  }

  await new Promise((resolve) => setTimeout(resolve, 0));
  cleanAuthParamsFromUrl();
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
  const roleRequestRef = useRef(0);
  const sessionUserIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  const resolveRole = useCallback(async (userId: string): Promise<AppRole | null> => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, is_superadmin, status")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.warn("[Auth] erro ao buscar profiles:", profileError);
      }

      if (profile?.is_superadmin || normalizeRole(profile?.role) === "superadmin") {
        console.log("[Auth] SUPERADMIN DETECTADO");
        return "superadmin";
      }

      const profileRole = normalizeRole(profile?.role);
      if (profileRole) return profileRole;

      // Fonte correta para usuários operacionais (professor, secretaria, etc.).
      // A RPC é SECURITY DEFINER e evita que a RLS de account_members bloqueie
      // a leitura da própria role, o que enviava usuários válidos para /sem-acesso.
      const { data: userAccess, error: userAccessError } = await supabase.rpc("get_user_access");

      if (userAccessError) {
        console.warn("[Auth] erro ao buscar get_user_access:", userAccessError);
      }

      const accessRow = Array.isArray(userAccess) ? userAccess[0] : userAccess;
      const accessRole = normalizeRole(accessRow?.role ?? null);
      if (accessRole) return accessRole;

      const { data: accountMember, error: accountMemberError } = await supabase
        .from("account_members")
        .select("role")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (accountMemberError) {
        console.warn("[Auth] erro ao buscar account_members:", accountMemberError);
      }

      const accountRole = normalizeRole(accountMember?.role);
      if (accountRole) return accountRole;

      const { data: membership, error: membershipError } = await supabase
        .from("school_memberships")
        .select("role")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (membershipError) {
        console.warn("[Auth] erro ao buscar school_memberships:", membershipError);
      }

      const membershipRole = normalizeRole(membership?.role as string | null);
      if (membershipRole) return membershipRole;

      console.warn("[Auth] usuário autenticado, mas sem permissão no sistema");
      return null;
    } catch (err) {
      console.error("[Auth] resolveRole error:", err);
      return null;
    }
  }, []);

  const loadRoleForUser = useCallback(
    async (userId: string, requestId: number) => {
      try {
        console.log("[Auth] resolvendo role para SESSION USER ID:", userId, "req:", requestId);
        const nextRole = await withTimeout(resolveRole(userId), "[Auth] carregamento de permissões");
        if (mountedRef.current && roleRequestRef.current === requestId) {
          console.log("[Auth] ROLE RESOLVIDA:", nextRole, "para AUTH USER ID:", userId);
          setRole(nextRole);
        } else {
          console.log("[Auth] descartando role (request stale)", { requestId, current: roleRequestRef.current });
        }
      } catch (err) {
        console.error("[Auth] falha ao carregar permissões:", err);
        if (mountedRef.current && roleRequestRef.current === requestId) {
          setRole(null);
        }
      } finally {
        if (mountedRef.current && roleRequestRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    [resolveRole],
  );

  useEffect(() => {
    mountedRef.current = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mountedRef.current) return;

      console.log("[Auth] onAuthStateChange:", event);

      // evita loop no INITIAL_SESSION
      if (event === "INITIAL_SESSION") {
        return;
      }

      roleRequestRef.current += 1;
      const requestId = roleRequestRef.current;

      sessionUserIdRef.current = nextSession?.user?.id ?? null;

      setSession(nextSession);
      setRole(null);

      if (event === "SIGNED_OUT" || !nextSession?.user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      setTimeout(() => {
        if (mountedRef.current && roleRequestRef.current === requestId) {
          void loadRoleForUser(nextSession.user.id, requestId);
        }
      }, 0);
    });

    const initializeAuth = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.log("[AUTH SESSION]", session?.user?.id);

        setSession(session);

        if (session?.user) {
          const nextRole = await resolveRole(session.user.id);
          setRole(nextRole);
        }
      } catch (err) {
        console.error("[AUTH ERROR]", err);

        setSession(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    void initializeAuth();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [loadRoleForUser]);

  const clearSupabaseStorage = () => {
    if (typeof window === "undefined") return;
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("sb-") || k.includes("supabase.auth"))) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && (k.startsWith("sb-") || k.includes("supabase.auth"))) sessionStorage.removeItem(k);
      }
    } catch (err) {
      console.warn("[Auth] erro limpando storage:", err);
    }
  };

  const signOut = async () => {
    roleRequestRef.current += 1;
    sessionUserIdRef.current = null;
    setSession(null);
    setRole(null);
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch (err) {
      console.warn("[Auth] signOut error:", err);
    }
    clearSupabaseStorage();
    setLoading(false);
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

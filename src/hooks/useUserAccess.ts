import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserAccess {
  role: string | null;
  department: string | null;
}

/**
 * Hook que consulta a função SQL get_user_access() para validar
 * o acesso do usuário autenticado. Retorna null quando não há acesso.
 */
export const useUserAccess = () => {
  const { session, loading: authLoading } = useAuth();
  const [access, setAccess] = useState<UserAccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (authLoading) return;

      if (!session?.user) {
        if (active) {
          setAccess(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const { data, error } = await supabase.rpc("get_user_access");

      if (!active) return;

      if (error) {
        console.error("[useUserAccess] erro:", error);
        setAccess(null);
      } else {
        const row = Array.isArray(data) ? data[0] : data;
        setAccess(row?.role ? { role: row.role, department: row.department ?? null } : null);
      }
      setLoading(false);
    };

    run();
    return () => {
      active = false;
    };
  }, [session, authLoading]);

  return { access, loading: authLoading || loading };
};

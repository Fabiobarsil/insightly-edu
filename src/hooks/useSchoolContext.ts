import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook que resolve o school_id do usuário autenticado a partir da tabela `profiles`.
 * Usa .maybeSingle() para evitar erros quando o profile ainda não existe.
 */
export function useSchoolContext() {
  const { user, loading: authLoading } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (authLoading) {
      setLoading(true);
      return () => {
        mounted = false;
      };
    }

    if (!user) {
      setSchoolId(null);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    const resolve = async () => {
      setLoading(true);
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("school_id")
          .eq("id", user.id)
          .maybeSingle();

        if (mounted) {
          setSchoolId(profile?.school_id ?? null);
          setLoading(false);
        }
      } catch (err) {
        console.error("[useSchoolContext] erro:", err);
        if (mounted) {
          setSchoolId(null);
          setLoading(false);
        }
      }
    };

    resolve();

    return () => {
      mounted = false;
    };
  }, [authLoading, user?.id]);

  return { schoolId, loading };
}

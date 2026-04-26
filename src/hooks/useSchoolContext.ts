import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook que resolve o school_id do usuário autenticado a partir da tabela `profiles`.
 * Usa .maybeSingle() para evitar erros quando o profile ainda não existe.
 */
export function useSchoolContext() {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const resolve = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          if (mounted) {
            setSchoolId(null);
            setLoading(false);
          }
          return;
        }

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
  }, []);

  return { schoolId, loading };
}

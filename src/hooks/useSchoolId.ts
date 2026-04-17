import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSchoolId() {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchSchoolId = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("[useSchoolId] auth error:", authError);
          if (mounted) {
            setSchoolId(null);
            setLoading(false);
          }
          return;
        }

        if (!user) {
          console.log("[useSchoolId] no authenticated user");
          if (mounted) {
            setSchoolId(null);
            setLoading(false);
          }
          return;
        }

        console.log("AUTH USER:", user.id);

        // 1ª tentativa: ler school_id direto do profile
        let { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("school_id")
          .eq("id", user.id)
          .maybeSingle();

        console.log("PROFILE:", profile);

        if (profileError) {
          console.error("[useSchoolId] profile error:", profileError);
        }

        // Se não tem school_id, chama RPC que faz fallback no servidor
        if (!profile?.school_id) {
          console.log("[useSchoolId] school_id ausente, chamando ensure_user_school...");
          const { error: rpcError } = await supabase.rpc("ensure_user_school" as any);
          if (rpcError) {
            console.error("[useSchoolId] ensure_user_school error:", rpcError);
          }

          const { data: refreshed } = await supabase
            .from("profiles")
            .select("school_id")
            .eq("id", user.id)
            .maybeSingle();
          profile = refreshed;
          console.log("PROFILE (after ensure):", profile);
        }

        const resolved = profile?.school_id ?? null;
        console.log("SCHOOL_ID:", resolved);

        if (mounted) {
          setSchoolId(resolved);
          setLoading(false);
        }
      } catch (err) {
        console.error("[useSchoolId] unexpected error:", err);
        if (mounted) {
          setSchoolId(null);
          setLoading(false);
        }
      }
    };

    fetchSchoolId();

    return () => {
      mounted = false;
    };
  }, []);

  return { schoolId, loading, isLoading: loading };
}

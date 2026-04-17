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

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("school_id")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("[useSchoolId] profile error:", profileError);
          if (mounted) {
            setSchoolId(null);
            setLoading(false);
          }
          return;
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

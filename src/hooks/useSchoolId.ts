import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSchoolId() {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchoolId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .single();
      setSchoolId(data?.school_id ?? null);
      setLoading(false);
    };
    fetchSchoolId();
  }, []);

  return { schoolId, loading, isLoading: loading };
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSchoolId = () => {
  const { data: schoolId, isLoading } = useQuery({
    queryKey: ["current-school-id"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: membership } = await supabase
        .from("school_memberships")
        .select("school_id")
        .eq("user_id", user.id)
        .eq("status", "ativo")
        .maybeSingle();

      return membership?.school_id ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });

  return { schoolId: schoolId ?? null, isLoading };
};

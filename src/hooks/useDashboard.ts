import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DashboardData = {
  pendentes: number;
  resolvidos: number;
  urgentes: number;
  da_coordenacao: number;
};

export function useDashboard(schoolId: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["v_dashboard_main", schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data, error } = await supabase
        .from("v_dashboard_main")
        .select("*")
        .eq("school_id", schoolId)
        .maybeSingle();

      if (error) throw error;

      return {
        pendentes: data?.pendentes ?? 0,
        resolvidos: data?.resolvidos ?? 0,
        urgentes: data?.urgentes ?? 0,
        da_coordenacao: data?.da_coordenacao ?? 0,
      } as DashboardData;
    },
    enabled: !!schoolId,
    staleTime: 1000 * 30,
  });

  return {
    data: data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}

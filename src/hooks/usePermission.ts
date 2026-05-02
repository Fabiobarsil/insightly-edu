import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { PermissionAction } from "@/lib/permissions";

/**
 * Consulta `has_permission(action)` no Supabase, com cache por sessão (React Query).
 *
 * - Sem chamadas duplicadas: cada (userId, action) é cacheado.
 * - Fallback seguro: enquanto carrega, retorna `allowed = true`
 *   para não esconder conteúdo que ainda não foi avaliado (evita "flash").
 *   Para botões críticos, use `loading` para mostrar skeleton se preferir.
 */
export const usePermission = (action: PermissionAction) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["permission", userId, action],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 min
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_permission", { action });
      if (error) {
        console.error("[usePermission]", action, error);
        return false;
      }
      return Boolean(data);
    },
  });

  return {
    allowed: isLoading ? true : Boolean(data),
    loading: isLoading,
  };
};

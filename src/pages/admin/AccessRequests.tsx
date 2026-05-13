import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/contexts/AuthContext";

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Superadmin",
  owner: "Owner",
  admin: "Administrador",
  administracao: "Administração",
  secretaria: "Secretaria",
  coordenador: "Coordenador",
  diretor: "Diretor",
  professor: "Professor",
  psicologo: "Psicólogo",
  auxiliar: "Auxiliar",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  active: "Ativo",
  rejected: "Rejeitado",
  suspended: "Suspenso",
};

interface Row {
  id: string;
  user_id: string;
  school_id: string | null;
  role: AppRole;
  status: "pending" | "active" | "rejected" | "suspended";
  notes: string | null;
  created_at: string;
}

interface UserInfo {
  id: string;
  full_name: string | null;
}

export default function AccessRequests() {
  const qc = useQueryClient();
  const { schoolId } = useAuth();
  const [filter, setFilter] = useState<"pending" | "active" | "all">("pending");

  const { data: rows, isLoading } = useQuery({
    queryKey: ["user-roles", schoolId, filter],
    queryFn: async (): Promise<Row[]> => {
      let q = supabase
        .from("user_roles")
        .select("id, user_id, school_id, role, status, notes, created_at")
        .order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
  const { data: users } = useQuery({
    queryKey: ["user-roles-profiles", userIds.join(",")],
    queryFn: async (): Promise<Record<string, UserInfo>> => {
      if (userIds.length === 0) return {};
      const { data } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      const map: Record<string, UserInfo> = {};
      (data ?? []).forEach((u) => (map[u.id] = u as UserInfo));
      return map;
    },
    enabled: userIds.length > 0,
  });

  const mutate = useMutation({
    mutationFn: async ({ id, action, role }: { id: string; action: "approve" | "reject" | "suspend" | "reactivate" | "delete"; role?: AppRole }) => {
      if (action === "delete") {
        const { error } = await supabase.from("user_roles").delete().eq("id", id);
        if (error) throw error;
        return;
      }
      const status =
        action === "approve" ? "active" :
        action === "reject" ? "rejected" :
        action === "suspend" ? "suspended" : "active";
      const patch: Record<string, unknown> = { status };
      if (action === "approve") {
        patch.approved_at = new Date().toISOString();
        if (role) patch.role = role;
      }
      const { error } = await supabase.from("user_roles").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-roles"] });
      toast.success("Atualizado.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Solicitações de acesso</h2>
          <p className="text-sm text-muted-foreground">Aprove, rejeite ou suspenda usuários da sua escola.</p>
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          {(["pending", "active", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                filter === f ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              {f === "pending" ? "Pendentes" : f === "active" ? "Ativos" : "Todos"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>
        ) : (rows ?? []).length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma solicitação.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Pessoa</th>
                <th className="px-4 py-2 text-left">Função</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Data</th>
                <th className="px-4 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((r) => {
                const u = users?.[r.user_id];
                return (
                  <tr key={r.id} className="border-t border-border/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{u?.full_name || r.notes || "—"}</div>
                    </td>
                    <td className="px-4 py-3">{ROLE_LABEL[r.role] ?? r.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                          r.status === "active"
                            ? "bg-green-100 text-green-700"
                            : r.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : r.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {r.status === "pending" && (
                        <>
                          <button
                            onClick={() => mutate.mutate({ id: r.id, action: "approve" })}
                            className="px-3 py-1 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => mutate.mutate({ id: r.id, action: "reject" })}
                            className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                          >
                            Rejeitar
                          </button>
                        </>
                      )}
                      {r.status === "active" && r.role !== "owner" && (
                        <button
                          onClick={() => mutate.mutate({ id: r.id, action: "suspend" })}
                          className="px-3 py-1 rounded-lg border border-border text-xs font-semibold hover:bg-muted"
                        >
                          Suspender
                        </button>
                      )}
                      {(r.status === "suspended" || r.status === "rejected") && (
                        <button
                          onClick={() => mutate.mutate({ id: r.id, action: "reactivate" })}
                          className="px-3 py-1 rounded-lg border border-border text-xs font-semibold hover:bg-muted"
                        >
                          Reativar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

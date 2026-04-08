import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { toast } from "sonner";

const SubjectsList = () => {
  const { schoolId, isLoading: loadingSchool } = useSchoolId();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ["subjects", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase.from("subjects").select("id, name").eq("school_id", schoolId).order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!schoolId) throw new Error("Sem escola");
      if (!newName.trim()) throw new Error("Nome é obrigatório");
      const { error } = await supabase.from("subjects").insert({ name: newName.trim(), school_id: schoolId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects", schoolId] });
      setNewName("");
      toast.success("Disciplina criada!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingName.trim()) throw new Error("Nome é obrigatório");
      const { error } = await supabase.from("subjects").update({ name: editingName.trim() }).eq("id", editingId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects", schoolId] });
      setEditingId(null);
      toast.success("Disciplina atualizada!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects", schoolId] });
      toast.success("Disciplina excluída!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const loading = loadingSchool || isLoading;

  return (
    <AppLayout title="Disciplinas" breadcrumbs={[{ label: "Disciplinas" }]}>
      <PageHeader title="Disciplinas" description="Gerencie as disciplinas da escola" />

      <div className="bg-card border border-border/60 rounded-xl p-5 certus-shadow mb-6">
        <h4 className="text-sm font-bold text-primary mb-3">Nova Disciplina</h4>
        <div className="flex gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome da disciplina"
            className="flex-1 border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors"
            onKeyDown={(e) => e.key === "Enter" && createMutation.mutate()}
          />
          <button onClick={() => createMutation.mutate()} className="px-5 py-2.5 rounded-[14px] bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/90 transition-colors">
            <i className="ri-add-line mr-1" /> Adicionar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted">Carregando...</div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-12 text-muted">Nenhuma disciplina cadastrada.</div>
      ) : (
        <div className="bg-card border border-border/60 rounded-xl certus-shadow">
          {subjects.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3.5 border-b border-border/20 last:border-0 hover:bg-accent/30 transition-colors">
              {editingId === s.id ? (
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1 mr-3 border border-border rounded-[12px] px-3 py-2 text-sm bg-background focus:outline-none focus:border-secondary"
                  onKeyDown={(e) => e.key === "Enter" && updateMutation.mutate()}
                  autoFocus
                />
              ) : (
                <span className="text-sm font-medium text-primary">{s.name || "—"}</span>
              )}
              <div className="flex items-center gap-1">
                {editingId === s.id ? (
                  <>
                    <button onClick={() => updateMutation.mutate()} className="p-1.5 rounded-lg text-secondary hover:bg-accent transition-colors" title="Salvar">
                      <i className="ri-check-line" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg text-muted hover:bg-accent transition-colors" title="Cancelar">
                      <i className="ri-close-line" />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditingId(s.id); setEditingName(s.name || ""); }} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-accent transition-colors" title="Editar">
                      <i className="ri-pencil-line" />
                    </button>
                    <button onClick={() => { if (confirm("Excluir esta disciplina?")) deleteMutation.mutate(s.id); }} className="p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-accent transition-colors" title="Excluir">
                      <i className="ri-delete-bin-line" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default SubjectsList;

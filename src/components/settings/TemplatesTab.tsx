import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "whatsapp", label: "WhatsApp", icon: "ri-whatsapp-line", color: "text-green-600" },
  { id: "email", label: "Email", icon: "ri-mail-line", color: "text-blue-600" },
  { id: "declaracoes", label: "Declarações", icon: "ri-file-text-line", color: "text-amber-600" },
  { id: "notificacoes", label: "Notificações", icon: "ri-notification-3-line", color: "text-purple-600" },
];

interface Template {
  id: string;
  category: string;
  title: string;
  content: string;
}

interface Props {
  schoolId: string | null;
}

const TemplatesTab = ({ schoolId }: Props) => {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("whatsapp");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState({ title: "", content: "" });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["message-templates", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from("message_templates")
        .select("id, category, title, content")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Template[];
    },
    enabled: !!schoolId,
  });

  const filtered = templates.filter((t) => t.category === selectedCategory);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", content: "" });
    setModalOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setForm({ title: t.title, content: t.content });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Título é obrigatório");
      if (!schoolId) throw new Error("Escola não encontrada");

      if (editing) {
        const { error } = await supabase
          .from("message_templates")
          .update({ title: form.title, content: form.content })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("message_templates")
          .insert({ school_id: schoolId, category: selectedCategory, title: form.title, content: form.content });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      toast.success(editing ? "Template atualizado!" : "Template criado!");
      setModalOpen(false);
    },
    onError: (err: any) => toast.error(err.message || "Erro ao salvar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("message_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      toast.success("Template removido!");
    },
    onError: () => toast.error("Erro ao remover"),
  });

  const catInfo = CATEGORIES.find((c) => c.id === selectedCategory)!;

  return (
    <div className="space-y-5">
      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors border",
              selectedCategory === c.id
                ? "bg-secondary border-secondary text-secondary-foreground"
                : "bg-card border-border/60 text-muted-foreground hover:bg-accent"
            )}
          >
            <i className={cn(c.icon, c.color)} /> {c.label}
          </button>
        ))}
      </div>

      {/* Templates list */}
      <div className="bg-card border border-border/60 rounded-xl certus-shadow">
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <span className="text-sm font-bold text-primary flex items-center gap-2">
            <i className={cn(catInfo.icon, catInfo.color)} /> Templates de {catInfo.label}
          </span>
          <button onClick={openCreate} className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-bold hover:opacity-90 transition-opacity">
            <i className="ri-add-line mr-1" /> Novo Template
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum template de {catInfo.label} cadastrado.
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map((t) => (
              <div key={t.id} className="p-4 flex items-start gap-4 hover:bg-accent/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{t.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.content || "Sem conteúdo"}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(t)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors" title="Editar">
                    <i className="ri-pencil-line" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(t.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Excluir">
                    <i className="ri-delete-bin-line" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 border-t border-border/40 text-xs text-muted-foreground">
          {filtered.length} template(s)
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className={cn(catInfo.icon, catInfo.color)} />
              {editing ? "Editar Template" : `Novo Template de ${catInfo.label}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">Título</label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Reunião de Pais"
                className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">Conteúdo</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                placeholder="Digite o conteúdo da mensagem... Use {{nome}}, {{turma}}, {{data}} como variáveis."
                rows={6}
                className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors resize-none"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Variáveis disponíveis: {"{{nome}}"}, {"{{turma}}"}, {"{{data}}"}, {"{{escola}}"}
              </p>
            </div>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full py-2.5 rounded-[12px] bg-secondary text-secondary-foreground text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saveMutation.isPending ? "Salvando..." : editing ? "Salvar Alterações" : "Criar Template"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplatesTab;

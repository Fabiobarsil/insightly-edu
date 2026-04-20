import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, User, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";

interface StudentSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StudentSearchModal = ({ open, onOpenChange }: StudentSearchModalProps) => {
  const navigate = useNavigate();
  const { schoolId } = useSchoolId();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students-search", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from("students")
        .select("id, full_name, photo_url, status, classes(name)")
        .eq("school_id", schoolId)
        .order("full_name", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId && open,
  });

  const filtered = useMemo(() => {
    if (!query.trim()) return students;
    const q = query.toLowerCase().trim();
    return students.filter((s: any) => s.full_name?.toLowerCase().includes(q));
  }, [students, query]);

  const selected = filtered.find((s: any) => s.id === selectedId);

  const reset = () => {
    setQuery("");
    setSelectedId(null);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleOpen = () => {
    if (!selectedId) return;
    handleClose();
    navigate(`/secretaria/matricula/${selectedId}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Buscar Aluno</DialogTitle>
          <DialogDescription>
            Pesquise pelo nome do aluno e abra o cadastro completo na Secretaria.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Digite o nome do aluno..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedId(null); }}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[280px] rounded-md border border-border/40">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {query ? "Nenhum aluno encontrado." : "Nenhum aluno cadastrado."}
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {filtered.map((s: any) => {
                const isSelected = selectedId === s.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      onDoubleClick={() => { setSelectedId(s.id); setTimeout(handleOpen, 0); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected ? "bg-primary/10" : "hover:bg-accent/50"
                      }`}
                    >
                      {s.photo_url ? (
                        <img src={s.photo_url} alt={s.full_name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{s.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {s.classes?.name || "Sem turma"}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        {selected && (
          <div className="rounded-md bg-accent/40 px-3 py-2 text-xs text-muted-foreground">
            Selecionado: <span className="font-medium text-foreground">{(selected as any).full_name}</span>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            <X className="h-4 w-4" /> Cancelar
          </Button>
          <Button type="button" onClick={handleOpen} disabled={!selectedId}>
            Abrir Cadastro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StudentSearchModal;

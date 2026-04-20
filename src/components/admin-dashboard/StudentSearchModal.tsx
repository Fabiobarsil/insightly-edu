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
  const [classFilter, setClassFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students-search", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from("students")
        .select("id, full_name, photo_url, status, class_id, created_at, classes(name, grade, shift)")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data || []).map((s: any) => {
        const cls = Array.isArray(s.classes) ? s.classes[0] : s.classes;
        return { ...s, _class_name: cls?.name || "", _grade: cls?.grade || "", _shift: cls?.shift || "" };
      });
    },
    enabled: !!schoolId && open,
  });

  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((s: any) => { if (s.class_id && s._class_name) map.set(s.class_id, s._class_name); });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [students]);

  const gradeOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s: any) => { if (s._grade) set.add(s._grade); });
    return Array.from(set).sort();
  }, [students]);

  const shiftOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s: any) => { if (s._shift) set.add(s._shift); });
    return Array.from(set).sort();
  }, [students]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return students.filter((s: any) => {
      if (q && !s.full_name?.toLowerCase().includes(q)) return false;
      if (classFilter && s.class_id !== classFilter) return false;
      if (gradeFilter && s._grade !== gradeFilter) return false;
      if (shiftFilter && s._shift !== shiftFilter) return false;
      return true;
    });
  }, [students, query, classFilter, gradeFilter, shiftFilter]);

  const selected = filtered.find((s: any) => s.id === selectedId);

  const reset = () => {
    setQuery("");
    setClassFilter("");
    setGradeFilter("");
    setShiftFilter("");
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buscar Aluno</DialogTitle>
          <DialogDescription>
            Pesquise por nome e refine por turma, série ou turno. Lista ordenada do mais recente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
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
          <div className="grid grid-cols-3 gap-2">
            <select
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setSelectedId(null); }}
              className="border border-border rounded-md px-2 py-2 bg-background text-sm outline-none"
            >
              <option value="">Todas as turmas</option>
              {classOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
            <select
              value={gradeFilter}
              onChange={(e) => { setGradeFilter(e.target.value); setSelectedId(null); }}
              className="border border-border rounded-md px-2 py-2 bg-background text-sm outline-none"
            >
              <option value="">Todas as séries</option>
              {gradeOptions.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select
              value={shiftFilter}
              onChange={(e) => { setShiftFilter(e.target.value); setSelectedId(null); }}
              className="border border-border rounded-md px-2 py-2 bg-background text-sm outline-none"
            >
              <option value="">Todos os turnos</option>
              {shiftOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <ScrollArea className="h-[280px] rounded-md border border-border/40">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {query || classFilter || gradeFilter || shiftFilter ? "Nenhum aluno encontrado." : "Nenhum aluno cadastrado."}
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
                          {s.classes?.grade ? ` · ${s.classes.grade}` : ""}
                          {s.classes?.shift ? ` · ${s.classes.shift}` : ""}
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

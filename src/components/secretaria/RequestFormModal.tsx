import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search } from "lucide-react";

const REQUEST_TYPES = [
  "Transferência",
  "Histórico Escolar",
  "Declaração",
  "Diploma",
  "Segunda via",
  "Outro",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (requestId: string) => void;
}

const RequestFormModal = ({ open, onOpenChange, onCreated }: Props) => {
  const { schoolId } = useSchoolId();
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; full_name: string; class_id: string | null } | null>(null);
  const [requestType, setRequestType] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: students = [] } = useQuery({
    queryKey: ["students-search", schoolId, search],
    queryFn: async () => {
      if (!schoolId || search.length < 2) return [];
      const { data } = await supabase
        .from("students")
        .select("id, full_name, class_id")
        .eq("school_id", schoolId)
        .ilike("full_name", `%${search}%`)
        .limit(10);
      return data || [];
    },
    enabled: !!schoolId && search.length >= 2,
  });

  const resetForm = () => {
    setSearch("");
    setSelectedStudent(null);
    setRequestType("");
    setDescription("");
    setDeadline("");
  };

  const handleSave = async () => {
    if (!schoolId || !requestType) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from("secretary_requests").insert({
        school_id: schoolId,
        student_id: selectedStudent?.id || null,
        student_name: selectedStudent?.full_name || null,
        class_id: selectedStudent?.class_id || null,
        request_type: requestType,
        description: description || null,
        deadline: deadline || null,
        priority: "media", // temporary, will be classified next
        status: "aberto",
        is_recurring: requestType === "Segunda via",
      }).select("id").single();
      if (error) throw error;
      resetForm();
      onOpenChange(false);
      onCreated(data.id);
    } catch {
      // error handled by caller
    } finally {
      setSaving(false);
    }
  };

  const selectStudent = (s: typeof students[0]) => {
    setSelectedStudent(s);
    setSearch(s.full_name);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Solicitação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Student search */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">🔍 Aluno</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar aluno..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedStudent(null); }}
                className="pl-9"
              />
            </div>
            {!selectedStudent && students.length > 0 && (
              <div className="border border-border rounded-lg mt-1 max-h-32 overflow-y-auto bg-popover">
                {students.map((s) => (
                  <button key={s.id} onClick={() => selectStudent(s)} className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors">
                    {s.full_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Request type */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">📂 Tipo de solicitação</label>
            <div className="flex flex-wrap gap-2">
              {REQUEST_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setRequestType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${requestType === t ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-accent"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">📝 Descrição</label>
            <Textarea placeholder="Descreva a solicitação..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">⏱ Prazo</label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          <Button className="w-full" onClick={handleSave} disabled={!requestType || saving}>
            {saving ? "Salvando..." : "Salvar e Classificar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestFormModal;

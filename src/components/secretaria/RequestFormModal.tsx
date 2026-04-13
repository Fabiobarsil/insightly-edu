import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search } from "lucide-react";

const REQUEST_TYPES = [
  "Transferência",
  "Histórico Escolar",
  "Declaração",
  "Diploma",
  "Segunda via",
  "Outro",
];

const STUDENT_STATUSES = [
  { value: "ativo", label: "Ativo" },
  { value: "transferido", label: "Transferido" },
  { value: "concluido", label: "Concluído" },
];

const PRIORITIES = [
  { value: "baixa", label: "Baixa", color: "bg-muted text-muted-foreground" },
  { value: "media", label: "Média", color: "bg-primary/10 text-primary" },
  { value: "alta", label: "Alta", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  { value: "urgente", label: "Urgente", color: "bg-destructive/10 text-destructive" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RequestFormModal = ({ open, onOpenChange }: Props) => {
  const { schoolId } = useSchoolId();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; full_name: string; class_id: string | null; status: string | null } | null>(null);
  const [requestType, setRequestType] = useState("");
  const [studentStatus, setStudentStatus] = useState("ativo");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("media");

  const { data: students = [] } = useQuery({
    queryKey: ["students-search", schoolId, search],
    queryFn: async () => {
      if (!schoolId || search.length < 2) return [];
      const { data } = await supabase
        .from("students")
        .select("id, full_name, class_id, status")
        .eq("school_id", schoolId)
        .ilike("full_name", `%${search}%`)
        .limit(10);
      return data || [];
    },
    enabled: !!schoolId && search.length >= 2,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes-list", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("classes").select("id, name").eq("school_id", schoolId);
      return data || [];
    },
    enabled: !!schoolId,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!schoolId || !requestType) throw new Error("Dados incompletos");
      const { error } = await supabase.from("secretary_requests" as any).insert({
        school_id: schoolId,
        student_id: selectedStudent?.id || null,
        student_name: selectedStudent?.full_name || null,
        class_id: selectedStudent?.class_id || null,
        student_status: studentStatus,
        request_type: requestType,
        description: description || null,
        deadline: deadline || null,
        priority,
        status: "aberto",
        is_recurring: requestType === "Segunda via",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["secretary-requests"] });
      resetForm();
      onOpenChange(false);
    },
    onError: () => toast.error("Erro ao criar solicitação"),
  });

  const resetForm = () => {
    setSearch("");
    setSelectedStudent(null);
    setRequestType("");
    setStudentStatus("ativo");
    setDescription("");
    setDeadline("");
    setPriority("media");
  };

  const selectStudent = (s: typeof students[0]) => {
    setSelectedStudent(s);
    setSearch(s.full_name);
    if (s.status) setStudentStatus(s.status);
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
                  <button
                    key={s.id}
                    onClick={() => selectStudent(s)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    {s.full_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Class (auto from student or manual) */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">🏫 Turma</label>
            <select
              value={selectedStudent?.class_id || ""}
              disabled={!!selectedStudent?.class_id}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background"
            >
              <option value="">Selecionar...</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Student status */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">📊 Situação do aluno</label>
            <div className="flex gap-2">
              {STUDENT_STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStudentStatus(s.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${studentStatus === s.value ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-accent"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
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
            {requestType === "Segunda via" && (
              <p className="text-xs text-orange-600 mt-1">⚡ Será marcada como recorrente para geração rápida.</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">📝 Descrição</label>
            <Textarea
              placeholder="Descreva a solicitação..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">⏱ Prazo</label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">🚨 Prioridade</label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${priority === p.value ? p.color + " ring-2 ring-offset-1 ring-primary/30" : "bg-muted/50 text-muted-foreground hover:bg-accent"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => mutation.mutate()}
            disabled={!requestType || mutation.isPending}
          >
            {mutation.isPending ? "Salvando..." : "Criar Solicitação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestFormModal;

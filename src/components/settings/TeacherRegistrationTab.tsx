import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Assignment {
  id: string;
  class_id: string;
  subject_id: string;
}

let tempId = 0;
const newId = () => `temp-${++tempId}`;

interface Props {
  schoolId: string | null;
}

const TeacherRegistrationTab = ({ schoolId }: Props) => {
  const queryClient = useQueryClient();
  const photoRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ full_name: "", email: "", status: "active" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const { data: classes = [] } = useQuery({
    queryKey: ["classes-for-teacher-admin", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("classes").select("id, name, grade, shift").eq("school_id", schoolId);
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects-for-teacher-admin", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("subjects").select("id, name").eq("school_id", schoolId);
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  const addAssignment = () => setAssignments((prev) => [...prev, { id: newId(), class_id: "", subject_id: "" }]);
  const updateAssignment = (id: string, field: "class_id" | "subject_id", value: string) =>
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  const removeAssignment = (id: string) => setAssignments((prev) => prev.filter((a) => a.id !== id));

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.full_name.trim()) throw new Error("Nome é obrigatório");
      if (!schoolId) throw new Error("Escola não encontrada");

      const { data: teacher, error: teacherError } = await supabase
        .from("teachers")
        .insert({ school_id: schoolId, full_name: form.full_name, email: form.email || null, status: form.status })
        .select()
        .maybeSingle();

      if (teacherError) throw teacherError;
      if (!teacher) throw new Error("Erro ao criar professor");

      // Upload photo if provided
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `teachers/${teacher.id}.${ext}`;
        await supabase.storage.from("avatars").upload(path, photoFile, { upsert: true });
      }

      // Insert assignments
      const validAssignments = assignments.filter((a) => a.class_id && a.subject_id);
      if (validAssignments.length > 0) {
        const rows = validAssignments.map((a) => ({
          teacher_id: teacher.id,
          class_id: a.class_id,
          subject_id: a.subject_id,
          school_id: schoolId,
        }));
        const { error } = await supabase.from("teacher_assignments").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Professor cadastrado com sucesso!");
      setForm({ full_name: "", email: "", status: "active" });
      setAssignments([]);
      setPhotoFile(null);
      setPhotoPreview(null);
    },
    onError: (err: any) => toast.error(err.message || "Erro ao cadastrar professor"),
  });

  // Derive unique shifts from assignments
  const selectedClassIds = assignments.map((a) => a.class_id).filter(Boolean);
  const linkedShifts = [...new Set(classes.filter((c) => selectedClassIds.includes(c.id)).map((c) => c.shift).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border/60 rounded-xl certus-shadow p-6">
        <h3 className="text-sm font-bold text-primary mb-5 flex items-center gap-2">
          <i className="ri-user-add-line" /> Cadastrar Novo Professor
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
          {/* Photo */}
          <div className="flex flex-col items-center gap-3">
            <div
              onClick={() => photoRef.current?.click()}
              className="w-28 h-28 rounded-2xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-secondary transition-colors overflow-hidden bg-accent/20"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <i className="ri-camera-line text-2xl" />
                  <p className="text-[10px] mt-1">Foto</p>
                </div>
              )}
            </div>
            <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
            <span className="text-[10px] text-muted-foreground">Opcional</span>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">Nome Completo *</label>
              <input value={form.full_name} onChange={set("full_name")} placeholder="Nome do professor" className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">E-mail</label>
              <input value={form.email} onChange={set("email")} type="email" placeholder="email@escola.edu.br" className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">Status</label>
              <select value={form.status} onChange={set("status")} className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors">
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
            {linkedShifts.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Turnos (automático)</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {linkedShifts.map((s) => (
                    <span key={s} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-accent text-primary">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assignments */}
        <div className="mt-6 pt-5 border-t border-border/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-primary">Vínculos (Turma × Disciplina)</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Matérias e turmas do professor</p>
            </div>
            <button type="button" onClick={addAssignment} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors">
              <i className="ri-add-line" /> Adicionar
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border/60 rounded-xl">
              Nenhum vínculo. Clique em "Adicionar".
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((a, idx) => (
                <div key={a.id} className="flex items-start gap-3 p-4 border border-border/40 rounded-xl bg-accent/20">
                  <span className="text-xs font-bold text-muted-foreground mt-2.5 min-w-[20px]">{idx + 1}.</span>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">Turma</label>
                      <select value={a.class_id} onChange={(e) => updateAssignment(a.id, "class_id", e.target.value)} className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors">
                        <option value="">Selecione...</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}{c.grade ? ` - ${c.grade}` : ""}{c.shift ? ` (${c.shift})` : ""}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">Disciplina</label>
                      <select value={a.subject_id} onChange={(e) => updateAssignment(a.id, "subject_id", e.target.value)} className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors">
                        <option value="">Selecione...</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>{s.name || "Sem nome"}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeAssignment(a.id)} className="mt-6 p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors" title="Remover">
                    <i className="ri-delete-bin-line" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="mt-6 flex justify-end">
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="px-6 py-2.5 rounded-[12px] bg-secondary text-secondary-foreground text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
            {mutation.isPending ? "Salvando..." : "Cadastrar Professor"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherRegistrationTab;

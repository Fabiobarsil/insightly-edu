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

const PROF_TABS = [
  { id: "professor", label: "Professores", icon: "ri-user-star-line" },
  { id: "psicologo", label: "Psicólogo", icon: "ri-mental-health-line" },
  { id: "coordenador", label: "Coordenação", icon: "ri-compass-3-line" },
  { id: "diretor", label: "Direção", icon: "ri-briefcase-line" },
  { id: "auxiliar", label: "Auxiliares", icon: "ri-team-line" },
] as const;

type ProfType = typeof PROF_TABS[number]["id"];

const TeacherRegistrationTab = ({ schoolId }: Props) => {
  const queryClient = useQueryClient();
  const photoRef = useRef<HTMLInputElement>(null);
  const [profType, setProfType] = useState<ProfType>("professor");
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

  const { data: people = [] } = useQuery({
    queryKey: ["teachers-by-type", schoolId, profType],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await (supabase as any)
        .from("teachers")
        .select("id, full_name, email, status, type_professional")
        .eq("school_id", schoolId)
        .eq("type_professional", profType)
        .order("full_name");
      return (data ?? []) as any[];
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
        .insert({
          school_id: schoolId,
          full_name: form.full_name,
          email: form.email || null,
          status: form.status,
          type_professional: profType,
        } as any)
        .select()
        .maybeSingle();

      if (teacherError) throw teacherError;
      if (!teacher) throw new Error("Erro ao criar registro");

      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `teachers/${teacher.id}.${ext}`;
        await supabase.storage.from("avatars").upload(path, photoFile, { upsert: true });
      }

      // Vínculos só fazem sentido para professor
      if (profType === "professor") {
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
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["teachers-by-type"] });
      toast.success("Registro cadastrado com sucesso!");
      setForm({ full_name: "", email: "", status: "active" });
      setAssignments([]);
      setPhotoFile(null);
      setPhotoPreview(null);
    },
    onError: (err: any) => toast.error(err.message || "Erro ao cadastrar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("teacher_assignments").delete().eq("teacher_id", id);
      const { error } = await supabase.from("teachers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers-by-type"] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Removido com sucesso!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao remover"),
  });

  // Derive unique shifts from assignments
  const selectedClassIds = assignments.map((a) => a.class_id).filter(Boolean);
  const linkedShifts = [...new Set(classes.filter((c) => selectedClassIds.includes(c.id)).map((c) => c.shift).filter(Boolean))];

  const currentTab = PROF_TABS.find((t) => t.id === profType)!;
  const showAssignments = profType === "professor";

  return (
    <div className="space-y-6">
      {/* Sub-abas internas */}
      <div className="flex gap-2 flex-wrap">
        {PROF_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setProfType(t.id)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-colors border",
              profType === t.id
                ? "bg-secondary border-secondary text-secondary-foreground"
                : "bg-card border-border/60 text-muted-foreground hover:bg-accent"
            )}
          >
            <i className={t.icon} /> {t.label}
          </button>
        ))}
      </div>

      {/* Lista do tipo selecionado */}
      <div className="bg-card border border-border/60 rounded-xl certus-shadow p-6">
        <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
          <i className={currentTab.icon} /> {currentTab.label} Cadastrados
        </h3>
        {people.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border/60 rounded-xl">
            Nenhum registro cadastrado.
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {people.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-bold text-primary">{p.full_name || "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground">{p.email || "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    p.status === "active" ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"
                  )}>
                    {p.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm("Excluir este registro?")) deleteMutation.mutate(p.id);
                    }}
                    className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                    title="Remover"
                  >
                    <i className="ri-delete-bin-line" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulário de cadastro */}
      <div className="bg-card border border-border/60 rounded-xl certus-shadow p-6">
        <h3 className="text-sm font-bold text-primary mb-5 flex items-center gap-2">
          <i className="ri-user-add-line" /> Cadastrar Novo {currentTab.label.replace(/s$/, "")}
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
              <input value={form.full_name} onChange={set("full_name")} placeholder="Nome completo" className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">E-mail</label>
              <input value={form.email} onChange={set("email")} type="email" placeholder="email@escola.edu.br" className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">Tipo Profissional</label>
              <input value={currentTab.label} disabled className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-accent/30 text-muted-foreground" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">Status</label>
              <select value={form.status} onChange={set("status")} className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors">
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
            {showAssignments && linkedShifts.length > 0 && (
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

        {/* Assignments — apenas para professor */}
        {showAssignments && (
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
        )}

        {/* Submit */}
        <div className="mt-6 flex justify-end">
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="px-6 py-2.5 rounded-[12px] bg-secondary text-secondary-foreground text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
            {mutation.isPending ? "Salvando..." : "Cadastrar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherRegistrationTab;

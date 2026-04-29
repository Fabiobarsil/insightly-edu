import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormCard from "@/components/shared/FormCard";
import FormField from "@/components/shared/FormField";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ClassesEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { schoolId } = useSchoolId();
  const { dashboardRole } = useAuth();
  const basePath = `/${dashboardRole || "admin"}/turmas`;

  const [form, setForm] = useState({
    name: "",
    grade_id: "",
    shift_id: "",
    academic_year: new Date().getFullYear(),
  });

  const [newGradeName, setNewGradeName] = useState("");
  const [newShiftName, setNewShiftName] = useState("");
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editGrade, setEditGrade] = useState<{ id: string; name: string } | null>(null);
  const [editShift, setEditShift] = useState<{ id: string; name: string } | null>(null);
  const [deleteGradeId, setDeleteGradeId] = useState<string | null>(null);
  const [deleteShiftId, setDeleteShiftId] = useState<string | null>(null);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // Load class
  const { data: classData, isLoading: loadingClass } = useQuery({
    queryKey: ["class", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, grade, grade_id, shift, shift_id, academic_year, school_id")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (classData) {
      setForm({
        name: classData.name || "",
        grade_id: classData.grade_id || "",
        shift_id: classData.shift_id || "",
        academic_year: classData.academic_year || new Date().getFullYear(),
      });
    }
  }, [classData]);

  // Fetch grades
  const { data: grades = [], isLoading: loadingGrades } = useQuery({
    queryKey: ["school-grades", schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_grades")
        .select("id, name")
        .eq("school_id", schoolId!)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  // Fetch shifts
  const { data: shifts = [], isLoading: loadingShifts } = useQuery({
    queryKey: ["school-shifts", schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_shifts")
        .select("id, name")
        .eq("school_id", schoolId!)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  // Fallback: if class has grade/shift text but no id, match by name once lists load
  useEffect(() => {
    if (!classData) return;
    if (!form.grade_id && classData.grade && grades.length > 0) {
      const match = grades.find((g) => g.name?.toLowerCase() === String(classData.grade).toLowerCase());
      if (match) setForm((prev) => ({ ...prev, grade_id: match.id }));
    }
  }, [classData, grades, form.grade_id]);

  useEffect(() => {
    if (!classData) return;
    if (!form.shift_id && classData.shift && shifts.length > 0) {
      const match = shifts.find((s) => s.name?.toLowerCase() === String(classData.shift).toLowerCase());
      if (match) setForm((prev) => ({ ...prev, shift_id: match.id }));
    }
  }, [classData, shifts, form.shift_id]);

  const createGrade = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("school_grades")
        .insert({ name, school_id: schoolId! })
        .select("id, name")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["school-grades"] });
      setForm((prev) => ({ ...prev, grade_id: data.id }));
      setNewGradeName("");
      setGradeModalOpen(false);
      toast.success("Série criada!");
    },
    onError: (err: any) => toast.error(err.message?.includes("duplicate") ? "Série já existe" : "Erro ao criar série"),
  });

  const createShift = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("school_shifts")
        .insert({ name, school_id: schoolId! })
        .select("id, name")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["school-shifts"] });
      setForm((prev) => ({ ...prev, shift_id: data.id }));
      setNewShiftName("");
      setShiftModalOpen(false);
      toast.success("Turno criado!");
    },
    onError: (err: any) => toast.error(err.message?.includes("duplicate") ? "Turno já existe" : "Erro ao criar turno"),
  });

  const updateGrade = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("school_grades").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-grades"] });
      setEditGrade(null);
      toast.success("Série atualizada!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar série"),
  });

  const deleteGrade = useMutation({
    mutationFn: async (gradeId: string) => {
      const { error } = await supabase.from("school_grades").delete().eq("id", gradeId);
      if (error) throw error;
    },
    onSuccess: (_d, gradeId) => {
      queryClient.invalidateQueries({ queryKey: ["school-grades"] });
      if (form.grade_id === gradeId) setForm((p) => ({ ...p, grade_id: "" }));
      setDeleteGradeId(null);
      toast.success("Série excluída!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao excluir série"),
  });

  const updateShift = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("school_shifts").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-shifts"] });
      setEditShift(null);
      toast.success("Turno atualizado!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar turno"),
  });

  const deleteShift = useMutation({
    mutationFn: async (shiftId: string) => {
      const { error } = await supabase.from("school_shifts").delete().eq("id", shiftId);
      if (error) throw error;
    },
    onSuccess: (_d, shiftId) => {
      queryClient.invalidateQueries({ queryKey: ["school-shifts"] });
      if (form.shift_id === shiftId) setForm((p) => ({ ...p, shift_id: "" }));
      setDeleteShiftId(null);
      toast.success("Turno excluído!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao excluir turno"),
  });

  // Update class
  const updateMutation = useMutation({
    mutationFn: async () => {
      const selectedGrade = grades.find((g) => g.id === form.grade_id);
      const selectedShift = shifts.find((s) => s.id === form.shift_id);

      const { error } = await supabase
        .from("classes")
        .update({
          name: form.name,
          grade_id: form.grade_id || null,
          grade: selectedGrade?.name || null,
          shift_id: form.shift_id || null,
          shift: selectedShift?.name || null,
          academic_year: Number(form.academic_year) || null,
        })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["class", id] });
      toast.success("Turma atualizada com sucesso!");
      navigate(basePath);
    },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar turma"),
  });

  // Delete class
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("classes").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Turma excluída!");
      navigate(basePath);
    },
    onError: (err: any) => toast.error(err.message || "Erro ao excluir turma"),
  });

  if (loadingClass) {
    return (
      <AppLayout title="Editar Turma" breadcrumbs={[{ label: "Turmas", href: basePath }, { label: "Editar" }]}>
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Editar Turma" breadcrumbs={[{ label: "Turmas", href: basePath }, { label: "Editar" }]}>
      <div className="flex items-center justify-between">
        <PageHeader title="Editar Turma" description="Atualize os dados da turma" />
        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)} className="gap-2">
          <Trash2 className="h-4 w-4" /> Excluir
        </Button>
      </div>

      <FormCard title="Dados da Turma" cancelTo={basePath} onSubmit={() => updateMutation.mutate()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nome da Turma" placeholder="5º Ano A" value={form.name} onChange={set("name")} />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-muted-foreground">Série</label>
              <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" onClick={() => setGradeModalOpen(true)}>
                <Plus className="h-3 w-3" /> Adicionar
              </Button>
            </div>
            <select
              value={form.grade_id}
              onChange={set("grade_id")}
              disabled={loadingGrades}
              className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors disabled:opacity-50"
            >
              <option value="">{loadingGrades ? "Carregando..." : "Selecionar..."}</option>
              {grades.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
            {grades.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {grades.map((g) => (
                  <div key={g.id} className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-md px-2 py-1 text-xs">
                    <span className="text-slate-700">{g.name}</span>
                    <button type="button" className="text-slate-500 hover:text-blue-600" onClick={() => setEditGrade({ id: g.id, name: g.name })} title="Editar">
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button type="button" className="text-slate-500 hover:text-red-600" onClick={() => setDeleteGradeId(g.id)} title="Excluir">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-muted-foreground">Turno</label>
              <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" onClick={() => setShiftModalOpen(true)}>
                <Plus className="h-3 w-3" /> Adicionar
              </Button>
            </div>
            <select
              value={form.shift_id}
              onChange={set("shift_id")}
              disabled={loadingShifts}
              className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors disabled:opacity-50"
            >
              <option value="">{loadingShifts ? "Carregando..." : "Selecionar..."}</option>
              {shifts.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          <FormField label="Ano Letivo" type="number" placeholder="2024" value={String(form.academic_year)} onChange={set("academic_year")} />
        </div>
      </FormCard>

      {/* Modal Nova Série */}
      <Dialog open={gradeModalOpen} onOpenChange={setGradeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Série</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Nome da Série</Label>
            <Input placeholder="Ex: 5º Ano" value={newGradeName} onChange={(e) => setNewGradeName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeModalOpen(false)}>Cancelar</Button>
            <Button disabled={!newGradeName.trim() || createGrade.isPending} onClick={() => createGrade.mutate(newGradeName.trim())}>
              {createGrade.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Novo Turno */}
      <Dialog open={shiftModalOpen} onOpenChange={setShiftModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Turno</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Nome do Turno</Label>
            <Input placeholder="Ex: Matutino" value={newShiftName} onChange={(e) => setNewShiftName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShiftModalOpen(false)}>Cancelar</Button>
            <Button disabled={!newShiftName.trim() || createShift.isPending} onClick={() => createShift.mutate(newShiftName.trim())}>
              {createShift.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir turma?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Alunos vinculados podem ser afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive hover:bg-destructive/90">
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default ClassesEdit;

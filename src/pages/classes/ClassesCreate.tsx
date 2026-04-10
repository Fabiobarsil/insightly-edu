import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormCard from "@/components/shared/FormCard";
import FormField from "@/components/shared/FormField";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ClassesCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { schoolId } = useSchoolId();

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

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

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

  // Create grade
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

  // Create shift
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

  // Save class
  const mutation = useMutation({
    mutationFn: async () => {
      if (!schoolId) throw new Error("Escola não encontrada");

      const selectedGrade = grades.find((g) => g.id === form.grade_id);
      const selectedShift = shifts.find((s) => s.id === form.shift_id);

      const { error } = await supabase.from("classes").insert({
        name: form.name,
        grade_id: form.grade_id || null,
        grade: selectedGrade?.name || null,
        shift_id: form.shift_id || null,
        shift: selectedShift?.name || null,
        academic_year: Number(form.academic_year) || null,
        school_id: schoolId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Turma criada com sucesso!");
      navigate("/admin/turmas");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao criar turma"),
  });

  const gradeOptions = grades.map((g) => ({ value: g.id, label: g.name }));
  const shiftOptions = shifts.map((s) => ({ value: s.id, label: s.name }));

  return (
    <AppLayout title="Nova Turma" breadcrumbs={[{ label: "Turmas", href: "/admin/turmas" }, { label: "Nova" }]}>
      <PageHeader title="Criar Turma" description="Configure a nova turma" />
      <FormCard title="Dados da Turma" cancelTo="/admin/turmas" onSubmit={() => mutation.mutate()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nome da Turma" placeholder="5º Ano A" value={form.name} onChange={set("name")} />

          {/* Série */}
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
              {gradeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Turno */}
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
              {shiftOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
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
    </AppLayout>
  );
};

export default ClassesCreate;

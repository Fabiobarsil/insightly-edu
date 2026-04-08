import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { FileDown, Eye } from "lucide-react";
import { toast } from "sonner";

interface DocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  docId: string;
}

const DocumentModal = ({ open, onOpenChange, title, docId }: DocumentModalProps) => {
  const { schoolId } = useSchoolId();
  const [selectedStudent, setSelectedStudent] = useState("");

  const { data: students = [] } = useQuery({
    queryKey: ["students-doc-modal", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("students")
        .select("id, full_name, class_id, classes(name)")
        .eq("school_id", schoolId)
        .eq("status", "ativo")
        .order("full_name");
      return data || [];
    },
    enabled: !!schoolId && open,
  });

  const handlePreview = () => {
    if (!selectedStudent) {
      toast.error("Selecione um aluno");
      return;
    }
    const student = students.find((s: any) => s.id === selectedStudent);
    toast.info(`Visualizando ${title} de ${(student as any)?.full_name}`);
  };

  const handleGeneratePDF = () => {
    if (!selectedStudent) {
      toast.error("Selecione um aluno");
      return;
    }
    const student = students.find((s: any) => s.id === selectedStudent);
    toast.success(`${title} gerado para ${(student as any)?.full_name}!`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSelectedStudent(""); }}>
      <DialogContent className="max-w-[600px] rounded-xl p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-primary">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">Aluno</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors"
            >
              <option value="">Selecionar aluno...</option>
              {students.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} {s.classes?.name ? `(${s.classes.name})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={handlePreview} disabled={!selectedStudent}>
              <Eye className="mr-2 h-4 w-4" /> Visualizar
            </Button>
            <Button onClick={handleGeneratePDF} disabled={!selectedStudent}>
              <FileDown className="mr-2 h-4 w-4" /> Gerar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentModal;

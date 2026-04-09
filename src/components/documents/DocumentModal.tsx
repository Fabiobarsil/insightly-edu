import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { FileDown, Eye } from "lucide-react";
import { toast } from "sonner";
import { getDocumentText } from "@/lib/documentTexts";
import { DocumentLayout } from "@/lib/documentLayout";
import html2pdf from "html2pdf.js";

interface DocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  docId: string;
}

const DocumentModal = ({ open, onOpenChange, title, docId }: DocumentModalProps) => {
  const { schoolId } = useSchoolId();
  const [selectedStudent, setSelectedStudent] = useState("");
  const [showPreview, setShowPreview] = useState(false);

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

  const { data: school } = useQuery({
    queryKey: ["school-doc-modal", schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data } = await supabase.from("schools").select("*").eq("id", schoolId).single();
      return data;
    },
    enabled: !!schoolId && open,
  });

  const student = students.find((s: any) => s.id === selectedStudent) as any;
  const documentText = student ? getDocumentText(docId, { student, school }) : "";

  const handlePreview = () => {
    if (!selectedStudent) {
      toast.error("Selecione um aluno");
      return;
    }
    setShowPreview(true);
  };

  const handleGeneratePDF = () => {
    const element = document.getElementById("doc-preview-content");
    if (!element) return;
    html2pdf().from(element).set({
      margin: 0,
      filename: `${docId}-${student?.full_name?.replace(/\s+/g, "-").toLowerCase() || "aluno"}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { orientation: "portrait", format: "a4" },
    }).save();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSelectedStudent(""); setShowPreview(false); } }}>
      <DialogContent className={`rounded-xl p-6 shadow-lg max-h-[90vh] overflow-auto ${showPreview ? "max-w-[900px] w-[95vw]" : "max-w-[600px]"}`}>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-primary">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">Aluno</label>
              <select
                value={selectedStudent}
                onChange={(e) => { setSelectedStudent(e.target.value); setShowPreview(false); }}
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
            <Button variant="outline" onClick={handlePreview} disabled={!selectedStudent}>
              <Eye className="mr-2 h-4 w-4" /> Visualizar
            </Button>
            <Button onClick={handleGeneratePDF} disabled={!showPreview}>
              <FileDown className="mr-2 h-4 w-4" /> Gerar PDF
            </Button>
          </div>

          {showPreview && student && (
            <div className="flex justify-center overflow-auto">
              <DocumentLayout
                type={docId}
                title={title}
                content={documentText}
                student={student}
                school={school}
                orientation="portrait"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentModal;

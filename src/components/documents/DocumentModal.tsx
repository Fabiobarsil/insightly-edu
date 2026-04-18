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

  // Histórico/Boletim: buscar notas agrupadas por disciplina
  const { data: historico = [] } = useQuery({
    queryKey: ["doc-historico", selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return [];
      const { data, error } = await supabase
        .from("v_historico_escolar")
        .select("disciplina, term, grade_value")
        .eq("student_id", selectedStudent);
      if (error) throw error;

      const map = new Map<string, { disciplina: string; b1: number | null; b2: number | null; b3: number | null; b4: number | null; notas: number[] }>();
      (data || []).forEach((row: any) => {
        const key = row.disciplina || "—";
        if (!map.has(key)) {
          map.set(key, { disciplina: key, b1: null, b2: null, b3: null, b4: null, notas: [] });
        }
        const entry = map.get(key)!;
        const val = row.grade_value != null ? Number(row.grade_value) : null;
        if (val != null) entry.notas.push(val);
        if (row.term === "1º Bimestre") entry.b1 = val;
        else if (row.term === "2º Bimestre") entry.b2 = val;
        else if (row.term === "3º Bimestre") entry.b3 = val;
        else if (row.term === "4º Bimestre") entry.b4 = val;
      });

      return Array.from(map.values())
        .map((r) => ({
          disciplina: r.disciplina,
          b1: r.b1,
          b2: r.b2,
          b3: r.b3,
          b4: r.b4,
          media_final: r.notas.length > 0 ? r.notas.reduce((a, b) => a + b, 0) / r.notas.length : null,
        }))
        .sort((a, b) => a.disciplina.localeCompare(b.disciplina));
    },
    enabled: !!selectedStudent && open && (docId === "historico" || docId === "boletim"),
  });

  const student = students.find((s: any) => s.id === selectedStudent) as any;
  const documentText = student ? getDocumentText(docId, { student, school }) : "";

  const renderGradesTable = () => {
    if (docId !== "historico" && docId !== "boletim") return null;
    if (!historico.length) {
      return (
        <p style={{ fontSize: 13, textAlign: "center", color: "#666", marginTop: 16 }}>
          Nenhum dado acadêmico disponível.
        </p>
      );
    }
    const th: React.CSSProperties = { border: "1px solid #0f2a44", padding: "6px 8px", fontSize: 12, background: "#f3f4f6", textAlign: "center" };
    const td: React.CSSProperties = { border: "1px solid #0f2a44", padding: "6px 8px", fontSize: 12, textAlign: "center", color: "#0f2a44" };
    const tdLeft: React.CSSProperties = { ...td, textAlign: "left" };
    return (
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Times New Roman', serif" }}>
        <thead>
          <tr>
            <th style={{ ...th, textAlign: "left" }}>Disciplina</th>
            <th style={th}>1º Bim</th>
            <th style={th}>2º Bim</th>
            <th style={th}>3º Bim</th>
            <th style={th}>4º Bim</th>
            <th style={th}>Média</th>
          </tr>
        </thead>
        <tbody>
          {historico.map((r: any, i: number) => (
            <tr key={i}>
              <td style={tdLeft}>{r.disciplina}</td>
              <td style={td}>{r.b1 != null ? Number(r.b1).toFixed(1) : "—"}</td>
              <td style={td}>{r.b2 != null ? Number(r.b2).toFixed(1) : "—"}</td>
              <td style={td}>{r.b3 != null ? Number(r.b3).toFixed(1) : "—"}</td>
              <td style={td}>{r.b4 != null ? Number(r.b4).toFixed(1) : "—"}</td>
              <td style={{ ...td, fontWeight: "bold" }}>
                {r.media_final != null ? Number(r.media_final).toFixed(1) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

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

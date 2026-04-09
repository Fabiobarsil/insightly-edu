import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { FileDown, Eye } from "lucide-react";
import { toast } from "sonner";
import { getDocumentText } from "@/lib/documentTexts";
import brasaoImg from "@/assets/brasao-republica.png";
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
      const { data } = await supabase
        .from("schools")
        .select("*")
        .eq("id", schoolId)
        .single();
      return data;
    },
    enabled: !!schoolId && open,
  });

  const student = students.find((s: any) => s.id === selectedStudent) as any;

  const today = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
          <DialogTitle className="text-lg font-bold text-primary">
            {title}
          </DialogTitle>
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
              <div
                id="doc-preview-content"
                style={{
                  width: "794px",
                  minHeight: "1123px",
                  background: "#fff",
                  border: "4px solid #0f2a44",
                  padding: "60px 50px",
                  position: "relative",
                  fontFamily: "'Times New Roman', serif",
                  color: "#0f2a44",
                }}
              >
                {/* Cabeçalho institucional */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                  <img src={brasaoImg} alt="Brasão" style={{ width: 56, height: 56, objectFit: "contain" }} />
                  <div style={{ flex: 1, textAlign: "center", padding: "0 16px" }}>
                    <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 2, margin: 0, color: "#666" }}>
                      República Federativa do Brasil
                    </p>
                    <p style={{ fontSize: 14, fontWeight: "bold", textTransform: "uppercase", margin: "4px 0", letterSpacing: 1 }}>
                      {school?.name || "Nome da Escola"}
                    </p>
                    {school?.address && <p style={{ fontSize: 9, margin: 0, color: "#666" }}>{school.address}</p>}
                    {school?.cnpj && <p style={{ fontSize: 9, margin: 0, color: "#666" }}>CNPJ: {school.cnpj}</p>}
                    {school?.mec_authorization_code && (
                      <p style={{ fontSize: 9, margin: 0, color: "#666" }}>Portaria: {school.mec_authorization_code}</p>
                    )}
                  </div>
                  {school?.logo_url ? (
                    <img src={school.logo_url} alt="Logo" style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 4 }} />
                  ) : (
                    <div style={{ width: 56, height: 56 }} />
                  )}
                </div>

                {/* Linha separadora */}
                <div style={{ height: 2, background: "#0f2a44", marginBottom: 40 }} />

                {/* Título do documento */}
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                  <h1 style={{
                    fontSize: 24, fontWeight: "bold", textTransform: "uppercase",
                    letterSpacing: 4, margin: 0, color: "#0f2a44",
                  }}>
                    {title}
                  </h1>
                  <div style={{
                    width: 80, height: 2, margin: "10px auto",
                    background: "#0f2a44",
                  }} />
                </div>

                {/* Corpo do documento */}
                <div style={{ padding: "0 30px", marginTop: 40 }}>
                  <p style={{ fontSize: 15, lineHeight: 2, textAlign: "justify", textIndent: "2em" }}>
                    {documentText}
                  </p>
                </div>

                {/* Rodapé */}
                <div style={{
                  position: "absolute", bottom: 80, left: 50, right: 50,
                  display: "flex", justifyContent: "space-between", alignItems: "flex-end",
                }}>
                  <p style={{ fontSize: 13, margin: 0 }}>
                    {school?.address?.split(",").pop()?.trim() || "Local"}, {today}
                  </p>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 240, borderTop: "1px solid #0f2a44", paddingTop: 6 }}>
                      <p style={{ fontSize: 13, fontWeight: "bold", margin: 0 }}>
                        {school?.director_name || "Diretor(a)"}
                      </p>
                      <p style={{ fontSize: 10, margin: 0, color: "#666" }}>
                        {school?.director_role || "Diretor(a)"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentModal;

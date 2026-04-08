import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { FileDown, Eye } from "lucide-react";
import brasaoImg from "@/assets/brasao-republica.png";
import html2pdf from "html2pdf.js";

interface CertificadoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CertificadoModal = ({ open, onOpenChange }: CertificadoModalProps) => {
  const { schoolId } = useSchoolId();
  const [selectedStudent, setSelectedStudent] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const { data: students = [] } = useQuery({
    queryKey: ["students-certificado", schoolId],
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
    queryKey: ["school-certificado", schoolId],
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

  const handlePreview = () => {
    if (!selectedStudent) return;
    setShowPreview(true);
  };

  const handleGerarPDF = () => {
    const element = document.getElementById("certificado-modal");
    if (!element) return;
    html2pdf().from(element).set({
      margin: 0,
      filename: `certificado-${student?.full_name?.replace(/\s+/g, "-").toLowerCase() || "aluno"}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { orientation: "landscape" },
    }).save();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setShowPreview(false); setSelectedStudent(""); } }}>
      <DialogContent className="max-w-[600px] rounded-xl p-6 shadow-lg max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-primary">
            Certificado de Conclusão
          </DialogTitle>
        </DialogHeader>

        {/* Seleção de aluno */}
        <div className="flex flex-wrap items-end gap-3 mb-4">
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
          <Button onClick={handleGerarPDF} disabled={!showPreview}>
            <FileDown className="mr-2 h-4 w-4" /> Gerar PDF
          </Button>
        </div>

        {/* Preview */}
        {showPreview && student && (
          <div className="flex justify-center overflow-auto">
            <div
              id="certificado-modal"
              style={{
                width: "1123px",
                height: "794px",
                background: "#fff",
                border: "8px solid #0f2a44",
                padding: "40px",
                position: "relative",
                fontFamily: "'Times New Roman', serif",
                color: "#0f2a44",
              }}
            >
              {/* Ornamento superior */}
              <div style={{
                position: "absolute", top: 16, left: 16, right: 16,
                height: 4, background: "linear-gradient(90deg, #c8a961, #e8d48b, #c8a961)",
                borderRadius: 2,
              }} />
              <div style={{
                position: "absolute", bottom: 16, left: 16, right: 16,
                height: 4, background: "linear-gradient(90deg, #c8a961, #e8d48b, #c8a961)",
                borderRadius: 2,
              }} />

              {/* Cabeçalho institucional */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, marginTop: 12 }}>
                <img src={brasaoImg} alt="Brasão" style={{ width: 64, height: 64, objectFit: "contain" }} />
                <div style={{ flex: 1, textAlign: "center", padding: "0 16px" }}>
                  <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 2, margin: 0, color: "#666" }}>
                    República Federativa do Brasil
                  </p>
                  <p style={{ fontSize: 13, fontWeight: "bold", textTransform: "uppercase", margin: "4px 0", letterSpacing: 1 }}>
                    {school?.name || "Nome da Escola"}
                  </p>
                  {school?.address && <p style={{ fontSize: 9, margin: 0, color: "#666" }}>{school.address}</p>}
                  {school?.cnpj && <p style={{ fontSize: 9, margin: 0, color: "#666" }}>CNPJ: {school.cnpj}</p>}
                  {school?.mec_authorization_code && (
                    <p style={{ fontSize: 9, margin: 0, color: "#666" }}>
                      Portaria: {school.mec_authorization_code}
                    </p>
                  )}
                </div>
                {school?.logo_url ? (
                  <img src={school.logo_url} alt="Logo" style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 4 }} />
                ) : (
                  <div style={{ width: 64, height: 64 }} />
                )}
              </div>

              {/* Título */}
              <div style={{ textAlign: "center", marginTop: 24 }}>
                <h1 style={{
                  fontSize: 32, fontWeight: "bold", textTransform: "uppercase",
                  letterSpacing: 6, margin: 0, color: "#0f2a44",
                }}>
                  Certificado de Conclusão
                </h1>
                <div style={{
                  width: 120, height: 3, margin: "10px auto",
                  background: "linear-gradient(90deg, #c8a961, #e8d48b, #c8a961)",
                  borderRadius: 2,
                }} />
              </div>

              {/* Corpo */}
              <div style={{ textAlign: "center", marginTop: 40, padding: "0 60px" }}>
                <p style={{ fontSize: 16, lineHeight: 2, margin: 0 }}>
                  Certificamos que o(a) aluno(a)
                </p>
                <p style={{
                  fontSize: 26, fontWeight: "bold", margin: "8px 0",
                  borderBottom: "2px solid #c8a961", display: "inline-block",
                  padding: "0 20px 4px",
                }}>
                  {student.full_name}
                </p>
                <p style={{ fontSize: 16, lineHeight: 2, margin: "12px 0 0" }}>
                  concluiu com êxito o curso{" "}
                  {student.classes?.name ? (
                    <strong>{student.classes.name}</strong>
                  ) : (
                    <strong>_______________</strong>
                  )}
                  {" "}nesta instituição de ensino.
                </p>
              </div>

              {/* Rodapé com data e assinatura */}
              <div style={{
                position: "absolute", bottom: 60, left: 80, right: 80,
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
                      Diretor(a)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CertificadoModal;

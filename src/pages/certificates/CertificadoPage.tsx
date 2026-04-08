import html2pdf from "html2pdf.js";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown } from "lucide-react";

export default function CertificadoPage() {
  const navigate = useNavigate();

  const gerarPDF = () => {
    const element = document.getElementById("certificado");
    html2pdf().from(element).set({
      margin: 0,
      filename: "certificado.pdf",
      html2canvas: { scale: 2 },
      jsPDF: { orientation: "landscape" }
    }).save();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f3f4f6",
      padding: 20
    }}>
      {/* BOTÕES */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 20
      }}>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button onClick={gerarPDF}>
          <FileDown className="mr-2 h-4 w-4" /> Gerar PDF
        </Button>
      </div>

      {/* PREVIEW */}
      <div style={{
        display: "flex",
        justifyContent: "center"
      }}>
        <div id="certificado" style={{
          width: "1123px",
          height: "794px",
          background: "#fff",
          border: "8px solid #0f2a44",
          padding: 40,
          position: "relative"
        }}>
          <h1 style={{ textAlign: "center" }}>
            CERTIFICADO DE CONCLUSÃO
          </h1>
          <p style={{ textAlign: "center" }}>
            Preview do certificado
          </p>
        </div>
      </div>
    </div>
  );
}

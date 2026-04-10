import html2pdf from "html2pdf.js";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown } from "lucide-react";

export default function CertificadoPage() {
  const navigate = useNavigate();

  const gerarPDF = () => {
    const element = document.getElementById("certificado");
    html2pdf()
      .from(element)
      .set({
        margin: 0,
        filename: "certificado.pdf",
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "landscape" },
      })
      .save();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        padding: 20,
      }}
    >
      {/* BOTÕES */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button onClick={gerarPDF}>
          <FileDown className="mr-2 h-4 w-4" /> Gerar PDF
        </Button>
      </div>

      {/* PREVIEW */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          id="certificado"
          style={{
            width: "1123px",
            height: "794px",
            background: "#fff",
            border: "8px solid #0f2a44",
            padding: 40,
            position: "relative",
          }}
        >
          <div style={{ position: "absolute", width: "60%", top: "30%", left: "20%", opacity: 0.05 }}>
            <img src="/logo-escola.png" style={{ width: "100%" }} />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "18% 64% 18%",
              alignItems: "center",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <img src="/logo-brasil.png" style={{ maxHeight: 80 }} />
            </div>

            <div style={{ textAlign: "center", fontSize: 12 }}>
              <p>REPÚBLICA FEDERATIVA DO BRASIL</p>
              <p>ESTADO DO RIO DE JANEIRO</p>
              <p>Rua da Escola, 123</p>
              <p>Dados legais da instituição</p>
            </div>

            <div style={{ textAlign: "center" }}>
              <img src="/logo-escola.png" style={{ maxHeight: 80 }} />
            </div>
          </div>

          <h1
            style={{
              textAlign: "center",
              marginTop: 30,
              fontSize: 42,
              letterSpacing: 4,
              fontWeight: "bold",
              color: "#0f2a44",
            }}
          >
            Certificado de Conclusão
          </h1>

          <div
            style={{
              marginTop: 30,
              textAlign: "justify",
              lineHeight: 1.8,
              fontSize: 18,
            }}
          >
            <p>
              O(a) Diretor(a) do <strong>ESCOLA TESTE</strong>, no uso de suas atribuições legais, conforme a Lei nº
              9.394/96, confere o presente Certificado de Conclusão do
              <strong> Ensino Médio</strong> ao(à) aluno(a)
              <strong> ALUNO TESTE</strong>, inscrito sob nº 12345, nascido(a) em 01/01/2000, natural de Rio de Janeiro
              - RJ.
            </p>
          </div>

          <div
            style={{
              marginTop: 40,
              textAlign: "right",
            }}
          >
            Rio de Janeiro, 09/04/2026
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 80,
              textAlign: "center",
            }}
          >
            <div>
              ___________________________
              <br />
              Diretor(a)
            </div>

            <div>
              ___________________________
              <br />
              Concluinte
            </div>

            <div>
              ___________________________
              <br />
              Secretário(a)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

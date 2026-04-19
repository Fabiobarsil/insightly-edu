import certificado from "@/assets/certificado-clean02.png";
import brasao from "@/assets/brasao-republica.png";
import logo from "@/assets/logo-certus.png";

interface CertificadoData {
  full_name?: string;
  cpf?: string;
  rg?: string;
  birth_date?: string;
  mother_name?: string;
  father_name?: string;
  school_name?: string;
  modality?: string;
  year?: string | number;
  director?: string;
  secretary?: string;
}

interface Props {
  data?: CertificadoData;
}

const fallback = (v?: string | number | null) =>
  v !== undefined && v !== null && String(v).trim() !== "" ? String(v) : "—";

const formatDate = (d?: string) => {
  if (!d) return "—";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString("pt-BR");
  } catch {
    return d;
  }
};

export default function CertificadoTemplate({ data }: Props) {
  // A4 landscape ratio matching template (2000x1414 ≈ 1.414)
  const W = 1100;
  const H = 778;

  return (
    <div
      id="certificado"
      style={{
        position: "relative",
        width: `${W}px`,
        height: `${H}px`,
        margin: "0 auto",
        background: "#fff",
        fontFamily: "'Times New Roman', serif",
        color: "#0f2a44",
        overflow: "hidden",
      }}
    >
      {/* FUNDO */}
      <img
        src={certificado}
        alt="Certificado"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      />

      {/* BRASÃO (ESQUERDA) */}
      <img
        src={brasao}
        alt="Brasão da República"
        style={{
          position: "absolute",
          top: "60px",
          left: "80px",
          width: "100px",
          height: "auto",
          zIndex: 2,
        }}
      />

      {/* LOGO (DIREITA - OPOSTO AO BRASÃO) */}
      <img
        src={logo}
        alt="Logo Certus"
        style={{
          position: "absolute",
          top: "60px",
          right: "80px",
          width: "90px",
          height: "auto",
          zIndex: 2,
        }}
      />

      {/* 🔥 CABEÇALHO */}
      <div
        style={{
          position: "absolute",
          top: "100px",
          left: 0,
          width: "100%",
          textAlign: "center",
          fontSize: "14px",
          zIndex: 2,
        }}
      >
        REPÚBLICA FEDERATIVA DO BRASIL
        <br />
        {fallback(data?.school_name)}
        <br />
        Portaria nº XXXXX / Autorização XXXXX
      </div>

      {/* 🔥 TÍTULO */}
      <div
        style={{
          position: "absolute",
          top: "200px",
          left: 0,
          width: "100%",
          textAlign: "center",
          fontSize: "60px",
          fontFamily: "Amoresa",
          letterSpacing: "2px",
          textTransform: "capitalize",
          zIndex: 2,
        }}
      >
        Certificado de Conclusão
      </div>
      {/* TEXTO PRINCIPAL */}
      <div
        style={{
          position: "absolute",
          top: "300px",
          left: "140px",
          right: "140px",
          textAlign: "justify",
          fontSize: "18px",
          lineHeight: 1.8,
          zIndex: 2,
          textIndent: "40px",
        }}
      >
        O(a) Diretor(a) do <strong>{fallback(data?.school_name)}</strong>, no uso de suas atribuições legais, certifica
        que <strong>{fallback(data?.full_name)}</strong>, inscrito no CPF <strong>{fallback(data?.cpf)}</strong>,
        portador do RG <strong>{fallback(data?.rg)}</strong>, filho(a) de <strong>{fallback(data?.mother_name)}</strong>{" "}
        e <strong>{fallback(data?.father_name)}</strong>, nascido(a) em <strong>{formatDate(data?.birth_date)}</strong>,
        concluiu o Ensino Médio na modalidade <strong>{fallback(data?.modality)}</strong> no ano de{" "}
        <strong>{fallback(data?.year)}</strong>.
      </div>

      {/* ASSINATURA DIRETOR */}
      <div
        style={{
          position: "absolute",
          bottom: "110px",
          left: "140px",
          width: "300px",
          textAlign: "center",
          zIndex: 2,
        }}
      >
        <div
          style={{
            borderTop: "1px solid #0f2a44",
            marginBottom: "6px",
          }}
        />
        <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>{fallback(data?.director)}</p>
        <p style={{ margin: 0, fontSize: "12px" }}>Diretor</p>
      </div>

      {/* ASSINATURA SECRETÁRIA */}
      <div
        style={{
          position: "absolute",
          bottom: "110px",
          right: "140px",
          width: "300px",
          textAlign: "center",
          zIndex: 2,
        }}
      >
        <div
          style={{
            borderTop: "1px solid #0f2a44",
            marginBottom: "6px",
          }}
        />
        <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>{fallback(data?.secretary)}</p>
        <p style={{ margin: 0, fontSize: "12px" }}>Secretária</p>
      </div>
    </div>
  );
}

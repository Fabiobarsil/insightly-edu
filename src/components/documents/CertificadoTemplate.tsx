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
  education_type?: string;
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
  const W = 1100;
  const H = 778;

  const modalidadeLabel = data?.education_type === "eja" ? "Educação de Jovens e Adultos (EJA)" : "Ensino Médio";

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

      {/* HEADER PROFISSIONAL */}
      <div
        style={{
          position: "absolute",
          top: "50px",
          left: "120px",
          right: "120px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 2,
        }}
      >
        {/* BRASÃO */}
        <img
          src={brasao}
          alt="Brasão"
          style={{
            width: "100px",
            transform: "translateX(110px)",
            marginTop: "10px",
          }}
        />

        {/* TEXTO CENTRAL */}
        <div
          style={{
            textAlign: "center",
            flex: 1,
            fontSize: "14px",
            lineHeight: 1.4,
          }}
        >
          <div style={{ fontWeight: "bold", letterSpacing: "1px" }}>REPÚBLICA FEDERATIVA DO BRASIL</div>
          <div>{fallback(data?.school_name)}</div>
          <div>Portaria nº XXXXX / Autorização XXXXX</div>
        </div>

        {/* LOGO */}
        <img
          src={logo}
          alt="Logo"
          style={{
            width: "80px",
            transform: "translateX(-110px)",
            marginTop: "10px",
          }}
        />
      </div>

      {/* TÍTULO */}
      <div
        style={{
          position: "absolute",
          top: "180px",
          left: 0,
          right: 0,
          width: "100%",
          textAlign: "center",
          fontSize: "64px",
          fontFamily: "Amoresa, serif",
          color: "#0f2a44",
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
        concluiu o <strong>{modalidadeLabel}</strong> no ano de <strong>{fallback(data?.year)}</strong>.
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
        <div style={{ borderTop: "1px solid #0f2a44", marginBottom: "6px" }} />
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
        <div style={{ borderTop: "1px solid #0f2a44", marginBottom: "6px" }} />
        <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>{fallback(data?.secretary)}</p>
        <p style={{ margin: 0, fontSize: "12px" }}>Secretária</p>
      </div>
    </div>
  );
}

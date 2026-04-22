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
  // Verso
  establishment?: string;
  registry_number?: string;
  registry_book?: string;
  registry_page?: string;
  workload_hours?: string | number;
  city?: string;
  state?: string;
  issue_date?: string;
  additional_skills?: string;
  notes?: string;
  subjects?: { name: string; hours?: string | number }[];
}

interface Props {
  data?: CertificadoData;
  isVerso?: boolean;
}

const W = 1123;
const H = 794;

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

const baseContainer: React.CSSProperties = {
  position: "relative",
  width: `${W}px`,
  height: `${H}px`,
  margin: 0,
  padding: 0,
  background: "#fff",
  fontFamily: "'Times New Roman', serif",
  color: "#0f2a44",
  overflow: "hidden",
  display: "block",
  boxSizing: "border-box",
};

function Frente({ data }: { data?: CertificadoData }) {
  const modalidadeLabel =
    data?.education_type === "eja" ? "Educação de Jovens e Adultos (EJA)" : data?.modality || "Ensino Médio";

  return (
    <div style={baseContainer}>
      {/* FUNDO */}
      <img
        src={certificado}
        alt="Certificado"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          zIndex: 0,
        }}
      />

      {/* HEADER */}
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
        <img
          src={brasao}
          alt="Brasão"
          style={{ width: "100px", transform: "translateX(110px)", marginTop: "10px" }}
        />
        <div style={{ textAlign: "center", flex: 1, fontSize: "14px", lineHeight: 1.4 }}>
          <div style={{ fontWeight: "bold", letterSpacing: "1px" }}>REPÚBLICA FEDERATIVA DO BRASIL</div>
          <div>{fallback(data?.school_name)}</div>
          <div>Portaria nº XXXXX / Autorização XXXXX</div>
        </div>
        <img
          src={logo}
          alt="Logo"
          style={{ width: "80px", transform: "translateX(-110px)", marginTop: "10px" }}
        />
      </div>

      {/* TÍTULO */}
      <div
        style={{
          position: "absolute",
          top: "280px",
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
          top: "400px",
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
        <p style={{ margin: 0, fontSize: "12px" }}>Diretor(a)</p>
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
        <p style={{ margin: 0, fontSize: "12px" }}>Secretário(a)</p>
      </div>
    </div>
  );
}

function Verso({ data }: { data?: CertificadoData }) {
  const subjects = data?.subjects && data.subjects.length > 0 ? data.subjects : [];

  const localeText =
    data?.city || data?.state
      ? `${fallback(data?.city)}${data?.state ? " - " + data.state : ""}, ${formatDate(data?.issue_date)}`
      : formatDate(data?.issue_date);

  return (
    <div
      style={{
        ...baseContainer,
        padding: "50px 70px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h2 style={{ textAlign: "center", fontSize: "22px", margin: "0 0 18px", letterSpacing: "1px" }}>
        REGISTRO DO CERTIFICADO
      </h2>

      {/* Tabela de disciplinas */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "13px",
          marginBottom: "18px",
        }}
      >
        <thead>
          <tr style={{ background: "#f1f5f9" }}>
            <th style={{ border: "1px solid #0f2a44", padding: "6px 10px", textAlign: "left" }}>Disciplina</th>
            <th style={{ border: "1px solid #0f2a44", padding: "6px 10px", width: "140px", textAlign: "center" }}>
              Carga Horária
            </th>
          </tr>
        </thead>
        <tbody>
          {subjects.length === 0 ? (
            <tr>
              <td style={{ border: "1px solid #0f2a44", padding: "6px 10px" }}>—</td>
              <td style={{ border: "1px solid #0f2a44", padding: "6px 10px", textAlign: "center" }}>—</td>
            </tr>
          ) : (
            subjects.map((s, i) => (
              <tr key={i}>
                <td style={{ border: "1px solid #0f2a44", padding: "6px 10px" }}>{fallback(s.name)}</td>
                <td style={{ border: "1px solid #0f2a44", padding: "6px 10px", textAlign: "center" }}>
                  {fallback(s.hours)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Detalhamento */}
      <div style={{ fontSize: "13px", lineHeight: 1.8, marginBottom: "16px" }}>
        <div>
          <strong>Estabelecimento:</strong> {fallback(data?.establishment || data?.school_name)}
        </div>
        <div>
          <strong>Carga Horária Total:</strong> {fallback(data?.workload_hours)} horas
        </div>
        {data?.additional_skills && (
          <div>
            <strong>Habilidades Adicionais:</strong> {data.additional_skills}
          </div>
        )}
        {data?.notes && (
          <div>
            <strong>Observações:</strong> {data.notes}
          </div>
        )}
      </div>

      {/* Bloco de Registro */}
      <div
        style={{
          border: "2px solid #0f2a44",
          padding: "14px 18px",
          fontSize: "13px",
          lineHeight: 1.8,
          marginBottom: "auto",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "6px" }}>REGISTRO</div>
        <div>
          Nº de Registro: <strong>{fallback(data?.registry_number)}</strong> · Livro:{" "}
          <strong>{fallback(data?.registry_book)}</strong> · Folha: <strong>{fallback(data?.registry_page)}</strong>
        </div>
        <div style={{ marginTop: "6px" }}>{localeText}</div>
      </div>

      {/* Assinaturas */}
      <div style={{ display: "flex", justifyContent: "space-around", marginTop: "60px" }}>
        <div style={{ width: "300px", textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #0f2a44", marginBottom: "6px" }} />
          <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>{fallback(data?.secretary)}</p>
          <p style={{ margin: 0, fontSize: "12px" }}>Secretário(a)</p>
        </div>
        <div style={{ width: "300px", textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #0f2a44", marginBottom: "6px" }} />
          <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>{fallback(data?.director)}</p>
          <p style={{ margin: 0, fontSize: "12px" }}>Diretor(a)</p>
        </div>
      </div>
    </div>
  );
}

export default function CertificadoTemplate({ data, isVerso = false }: Props) {
  return isVerso ? <Verso data={data} /> : <Frente data={data} />;
}

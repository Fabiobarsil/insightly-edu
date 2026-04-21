import certificado from "@/assets/certificado-clean02.png";
import brasao from "@/assets/brasao-republica.png";
import logo from "@/assets/logo-certus.png";

interface CertificadoData {
  // Aluno
  full_name?: string;
  cpf?: string;
  rg?: string;
  birth_date?: string;
  birth_city?: string;
  birth_state?: string;
  mother_name?: string;
  father_name?: string;

  // Escola / cabeçalho
  school_name?: string;
  school_address?: string;
  school_maintainer?: string;
  school_authorization?: string; // Portaria / Resolução
  state_uf_long?: string; // ex.: ESTADO DO RIO DE JANEIRO

  // Certificado
  modality?: string; // Curso (ex.: Ensino Médio)
  education_type?: string; // eja, regular...
  year?: string | number; // ano de conclusão
  workload_hours?: string | number;
  city?: string;
  state?: string;
  issue_date?: string;

  // Assinaturas
  director?: string;
  secretary?: string;

  // Verso - Registro
  establishment?: string;
  previous_course?: string;
  registry_number?: string;
  registry_book?: string;
  registry_page?: string;
  additional_skills?: string;
  notes?: string;

  // Disciplinas (verso)
  subjects?: { name: string; hours?: string | number }[];
}

interface Props {
  data?: CertificadoData;
}

const fallback = (v?: string | number | null, dash = "—") =>
  v !== undefined && v !== null && String(v).trim() !== "" ? String(v) : dash;

const blank = (v?: string | number | null) =>
  v !== undefined && v !== null && String(v).trim() !== "" ? String(v) : "______________";

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

const splitDate = (d?: string) => {
  if (!d) return { day: "____", month: "________", year: "______" };
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return { day: "____", month: "________", year: "______" };
    const day = String(date.getDate()).padStart(2, "0");
    const months = [
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ];
    return { day, month: months[date.getMonth()], year: String(date.getFullYear()) };
  } catch {
    return { day: "____", month: "________", year: "______" };
  }
};

export default function CertificadoTemplate({ data }: Props) {
  const W = 1123;
  const H = 794;

  const isEja = (data?.education_type || "").toLowerCase() === "eja";
  const modalidadeLabel = data?.modality || (isEja ? "ENSINO MÉDIO NA MODALIDADE DA EDUCAÇÃO DE JOVENS E ADULTOS" : "ENSINO MÉDIO");
  const birth = splitDate(data?.birth_date);

  // Verso - garante mínimo de linhas
  const subjects = data?.subjects && data.subjects.length > 0 ? data.subjects : [];
  const minRows = 10;
  const subjectRows = [...subjects];
  while (subjectRows.length < minRows) subjectRows.push({ name: "", hours: "" });

  return (
    <>
      {/* ============ FRENTE ============ */}
      <div
        id="certificado-frente"
        style={{
          position: "relative",
          width: `${W}px`,
          height: `${H}px`,
          margin: "0 auto",
          background: "#fff",
          fontFamily: "'Times New Roman', serif",
          color: "#0f2a44",
          overflow: "hidden",
          pageBreakInside: "avoid",
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

        {/* HEADER INSTITUCIONAL */}
        <div
          style={{
            position: "absolute",
            top: "60px",
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
            style={{
              width: "90px",
              transform: "translateX(80px)",
            }}
          />

          <div
            style={{
              textAlign: "center",
              flex: 1,
              fontSize: "13px",
              lineHeight: 1.45,
              padding: "0 20px",
            }}
          >
            <div style={{ fontWeight: "bold", fontSize: "15px" }}>REPÚBLICA FEDERATIVA DO BRASIL</div>
            {data?.state_uf_long && (
              <div style={{ fontWeight: "bold", fontSize: "14px" }}>{data.state_uf_long}</div>
            )}
            <div style={{ fontWeight: "bold", fontSize: "14px" }}>{fallback(data?.school_name)}</div>
            {data?.school_address && <div>{data.school_address}</div>}
            {data?.school_maintainer && <div>Entidade Mantenedora - {data.school_maintainer}</div>}
            {data?.school_authorization && <div>{data.school_authorization}</div>}
          </div>

          <img
            src={logo}
            alt="Logo"
            style={{
              width: "80px",
              transform: "translateX(-80px)",
            }}
          />
        </div>

        {/* TÍTULO */}
        <div
          style={{
            position: "absolute",
            top: "260px",
            left: 0,
            right: 0,
            width: "100%",
            textAlign: "center",
            fontSize: "60px",
            fontFamily: "Amoresa, 'Times New Roman', serif",
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
            top: "380px",
            left: "120px",
            right: "120px",
            textAlign: "justify",
            fontSize: "16px",
            lineHeight: 1.7,
            zIndex: 2,
            textIndent: "40px",
          }}
        >
          O(a) Diretor(a) do <strong>{fallback(data?.school_name)}</strong>, no uso de suas atribuições, disposto na
          LEI N 9394/96, bem como o cumprimento dos demais requisitos legais, confere o presente Certificado de
          Conclusão do <strong>{modalidadeLabel}</strong> ao(à) Aluno(a) <strong>{fallback(data?.full_name)}</strong>,
          inscrito no Cadastro de Identificação Civil sob o nº <strong>{blank(data?.cpf)}</strong>, Órgão Emissor{" "}
          <strong>{blank(data?.rg)}</strong>, Filho(a) de <strong>{blank(data?.mother_name)}</strong> e{" "}
          <strong>{blank(data?.father_name)}</strong>, nascido(a) no dia <strong>{birth.day}</strong> de{" "}
          <strong>{birth.month}</strong> de <strong>{birth.year}</strong>, natural de{" "}
          <strong>{blank(data?.birth_city)}</strong> - Estado de <strong>{blank(data?.birth_state)}</strong>, no ano
          letivo de <strong>{fallback(data?.year)}</strong>.
        </div>

        {/* CIDADE / DATA DE EMISSÃO */}
        <div
          style={{
            position: "absolute",
            bottom: "180px",
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: "15px",
            zIndex: 2,
          }}
        >
          {fallback(data?.city)}, {data?.issue_date ? formatDate(data.issue_date) : "____ de ____________ de ______"}.
        </div>

        {/* ASSINATURAS */}
        <div
          style={{
            position: "absolute",
            bottom: "90px",
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

        <div
          style={{
            position: "absolute",
            bottom: "90px",
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

      {/* ============ VERSO ============ */}
      <div
        id="certificado-verso"
        style={{
          position: "relative",
          width: `${W}px`,
          height: `${H}px`,
          margin: "0 auto",
          background: "#fff",
          fontFamily: "'Times New Roman', serif",
          color: "#0f2a44",
          overflow: "hidden",
          pageBreakInside: "avoid",
          padding: "30px",
          boxSizing: "border-box",
        }}
      >
        <table
          style={{
            width: "100%",
            height: "100%",
            borderCollapse: "collapse",
            border: "1px solid #0f2a44",
            fontSize: "12px",
            tableLayout: "fixed",
          }}
        >
          <tbody>
            {/* Cabeçalhos das colunas */}
            <tr>
              <td
                style={{
                  border: "1px solid #0f2a44",
                  padding: "8px",
                  verticalAlign: "top",
                  width: "22%",
                }}
              >
                <div style={{ fontWeight: "bold" }}>DISCIPLINA E CARGA HORÁRIA</div>
                <div style={{ marginTop: "8px" }}>CURSO: {blank(data?.modality)}</div>
              </td>
              <td
                style={{
                  border: "1px solid #0f2a44",
                  padding: "8px",
                  verticalAlign: "top",
                  width: "12%",
                  fontWeight: "bold",
                }}
              >
                TOTAL DE HORAS
              </td>
              <td
                style={{
                  border: "1px solid #0f2a44",
                  padding: "8px",
                  verticalAlign: "top",
                  width: "40%",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "10px" }}>{modalidadeLabel}</div>
                <div style={{ marginBottom: "10px" }}>
                  CURSO ANTERIOR E ANO DE CONCLUSÃO: {blank(data?.previous_course)}
                </div>
                <div style={{ marginBottom: "10px" }}>ESTABELECIMENTO: {blank(data?.establishment)}</div>
                <div style={{ marginBottom: "10px" }}>OUTRAS HABILIDADES: {fallback(data?.additional_skills, "")}</div>
                <div>OBSERVAÇÕES: {fallback(data?.notes, "")}</div>
              </td>
              <td
                style={{
                  border: "1px solid #0f2a44",
                  padding: "8px",
                  verticalAlign: "top",
                  width: "26%",
                  fontSize: "11px",
                  lineHeight: 1.5,
                }}
              >
                <div>
                  O presente documento foi registrado sob o nº <strong>{blank(data?.registry_number)}</strong> em fls{" "}
                  <strong>{blank(data?.registry_page)}</strong> nº <strong>{blank(data?.registry_book)}</strong> deste
                  estabelecimento, conforme listagem publicada no D.O. de ___/___/______
                </div>
                <div style={{ marginTop: "20px" }}>
                  {fallback(data?.city)}, {data?.issue_date ? formatDate(data.issue_date) : "____/____/______"}
                </div>
                <div style={{ marginTop: "60px", textAlign: "center" }}>
                  <div style={{ borderTop: "1px solid #0f2a44", marginBottom: "4px" }} />
                  <div>{fallback(data?.secretary)}</div>
                  <div style={{ fontSize: "10px" }}>SECRETÁRIO(A)</div>
                </div>
                <div style={{ marginTop: "40px", textAlign: "center" }}>
                  <div style={{ borderTop: "1px solid #0f2a44", marginBottom: "4px" }} />
                  <div style={{ fontSize: "10px" }}>ÓRGÃO DE FISCALIZAÇÃO PROFISSIONAL</div>
                </div>
              </td>
            </tr>

            {/* Linhas de disciplinas */}
            {subjectRows.map((s, i) => (
              <tr key={i}>
                <td
                  style={{
                    border: "1px solid #0f2a44",
                    padding: "4px 8px",
                    height: "22px",
                  }}
                >
                  {s.name}
                </td>
                <td
                  style={{
                    border: "1px solid #0f2a44",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  {s.hours || ""}
                </td>
                {i === 0 && (
                  <td
                    rowSpan={minRows}
                    style={{
                      border: "1px solid #0f2a44",
                      padding: "8px",
                      verticalAlign: "top",
                    }}
                  >
                    {/* Espaço reservado para conteúdo adicional do verso central */}
                  </td>
                )}
                {i === 0 && (
                  <td
                    rowSpan={minRows}
                    style={{
                      border: "1px solid #0f2a44",
                      padding: "8px",
                      verticalAlign: "top",
                    }}
                  >
                    {/* Espaço reservado para conteúdo adicional do verso direito */}
                  </td>
                )}
              </tr>
            ))}

            {/* Linha total */}
            <tr>
              <td
                style={{
                  border: "1px solid #0f2a44",
                  padding: "6px 8px",
                  fontWeight: "bold",
                  textAlign: "right",
                }}
              >
                TOTAL
              </td>
              <td
                style={{
                  border: "1px solid #0f2a44",
                  padding: "6px 8px",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                {fallback(data?.workload_hours, "")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

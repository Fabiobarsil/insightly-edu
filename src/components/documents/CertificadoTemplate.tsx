import certificado from "@/assets/certificado-clean02.png";
import brasao from "@/assets/brasao-republica.png";
import logo from "@/assets/logo-certus.png";

interface SubjectRow {
  name: string;
  workload?: number | string;
}

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
  course_name?: string;
  previous_course?: string;
  previous_year?: string | number;
  establishment?: string;
  total_workload?: string | number;
  additional_skills?: string;
  notes?: string;
  city?: string;
  registry_number?: string;
  registry_book?: string;
  registry_page?: string;
  issue_date?: string;
  subjects?: SubjectRow[];
}

interface Props {
  data?: CertificadoData;
}

const fallback = (v?: string | number | null) =>
  v !== undefined && v !== null && String(v).trim() !== "" ? String(v) : "—";

const blank = (v?: string | number | null) =>
  v !== undefined && v !== null && String(v).trim() !== "" ? String(v) : "";

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

const formatIssueParts = (d?: string) => {
  if (!d) return { dd: "", mm: "", yy: "" };
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return { dd: "", mm: "", yy: "" };
    return {
      dd: String(date.getDate()).padStart(2, "0"),
      mm: String(date.getMonth() + 1).padStart(2, "0"),
      yy: String(date.getFullYear()),
    };
  } catch {
    return { dd: "", mm: "", yy: "" };
  }
};

export default function CertificadoTemplate({ data }: Props) {
  const W = 1100;
  const H = 778;

  const modalidadeLabel =
    data?.education_type === "eja" ? "Educação de Jovens e Adultos (EJA)" : "Ensino Médio";

  const subjects = data?.subjects && data.subjects.length > 0 ? data.subjects : [];
  // Garante mínimo de 8 linhas para visual oficial
  const minRows = 8;
  const rows: SubjectRow[] = [...subjects];
  while (rows.length < minRows) rows.push({ name: "", workload: "" });

  const computedTotal = subjects.reduce((acc, s) => {
    const n = Number(s.workload);
    return acc + (isNaN(n) ? 0 : n);
  }, 0);
  const totalWorkload = data?.total_workload ?? (computedTotal || "");

  const issue = formatIssueParts(data?.issue_date);

  // Estilos compartilhados do verso
  const cellBorder = "1px solid #0f2a44";
  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "0.3px",
    color: "#0f2a44",
  };
  const valueStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#0f2a44",
    marginTop: "2px",
    minHeight: "18px",
  };

  return (
    <>
      {/* ============ FRENTE ============ */}
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
          <img
            src={brasao}
            alt="Brasão"
            style={{ width: "100px", transform: "translateX(110px)", marginTop: "10px" }}
          />
          <div style={{ textAlign: "center", flex: 1, fontSize: "14px", lineHeight: 1.4 }}>
            <div style={{ fontWeight: "bold", letterSpacing: "1px" }}>
              REPÚBLICA FEDERATIVA DO BRASIL
            </div>
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
          O(a) Diretor(a) do <strong>{fallback(data?.school_name)}</strong>, no uso de suas
          atribuições legais, certifica que <strong>{fallback(data?.full_name)}</strong>, inscrito
          no CPF <strong>{fallback(data?.cpf)}</strong>, portador do RG{" "}
          <strong>{fallback(data?.rg)}</strong>, filho(a) de{" "}
          <strong>{fallback(data?.mother_name)}</strong> e{" "}
          <strong>{fallback(data?.father_name)}</strong>, nascido(a) em{" "}
          <strong>{formatDate(data?.birth_date)}</strong>, concluiu o{" "}
          <strong>{modalidadeLabel}</strong> no ano de <strong>{fallback(data?.year)}</strong>.
        </div>

        {/* ASSINATURAS */}
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
          <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>
            {fallback(data?.director)}
          </p>
          <p style={{ margin: 0, fontSize: "12px" }}>Diretor</p>
        </div>
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
          <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>
            {fallback(data?.secretary)}
          </p>
          <p style={{ margin: 0, fontSize: "12px" }}>Secretária</p>
        </div>
      </div>

      {/* ============ VERSO ============ */}
      <div
        className="html2pdf__page-break"
        style={{ pageBreakBefore: "always", breakBefore: "page", height: 0 }}
      />
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
          padding: "30px",
          boxSizing: "border-box",
        }}
      >
        {/* MARCA D'ÁGUA (mesmo fundo, suave) */}
        <img
          src={certificado}
          alt=""
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.12,
            zIndex: 0,
          }}
        />

        {/* TABELA PRINCIPAL */}
        <table
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            height: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <tbody>
            <tr>
              {/* COL 1 — Disciplinas / Carga Horária */}
              <td
                style={{
                  border: cellBorder,
                  verticalAlign: "top",
                  padding: "8px",
                  width: "26%",
                }}
              >
                <div style={labelStyle}>DISCIPLINA E CARGA HORÁRIA</div>
                <div style={{ ...labelStyle, marginTop: "6px" }}>
                  CURSO:{" "}
                  <span style={{ fontWeight: "normal" }}>{blank(data?.course_name)}</span>
                </div>
                <table
                  style={{
                    width: "100%",
                    marginTop: "10px",
                    borderCollapse: "collapse",
                    fontSize: "11px",
                  }}
                >
                  <tbody>
                    {rows.map((s, i) => (
                      <tr key={i}>
                        <td
                          style={{
                            borderBottom: "1px dotted #0f2a44",
                            padding: "4px 2px",
                            height: "22px",
                          }}
                        >
                          {s.name}
                        </td>
                        <td
                          style={{
                            borderBottom: "1px dotted #0f2a44",
                            padding: "4px 2px",
                            width: "40px",
                            textAlign: "right",
                          }}
                        >
                          {s.workload ? `${s.workload}h` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>

              {/* COL 2 — Total de Horas */}
              <td
                style={{
                  border: cellBorder,
                  verticalAlign: "top",
                  padding: "8px",
                  width: "12%",
                }}
              >
                <div style={labelStyle}>TOTAL DE HORAS</div>
                <div
                  style={{
                    ...valueStyle,
                    marginTop: "12px",
                    fontSize: "20px",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  {totalWorkload ? `${totalWorkload}h` : ""}
                </div>
              </td>

              {/* COL 3 — Detalhamento (Ensino, Curso anterior, Estabelecimento, Habilidades, Observações) */}
              <td
                style={{
                  border: cellBorder,
                  verticalAlign: "top",
                  padding: 0,
                  width: "38%",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  <div style={{ borderBottom: cellBorder, padding: "8px" }}>
                    <div style={labelStyle}>{(modalidadeLabel || "ENSINO FUNDAMENTAL").toUpperCase()}</div>
                    <div style={valueStyle}>{blank(data?.school_name)}</div>
                  </div>
                  <div style={{ borderBottom: cellBorder, padding: "8px" }}>
                    <div style={labelStyle}>CURSO ANTERIOR E ANO DE CONCLUSÃO</div>
                    <div style={valueStyle}>
                      {[blank(data?.previous_course), blank(data?.previous_year)]
                        .filter(Boolean)
                        .join(" - ")}
                    </div>
                  </div>
                  <div style={{ borderBottom: cellBorder, padding: "8px" }}>
                    <div style={labelStyle}>ESTABELECIMENTO</div>
                    <div style={valueStyle}>
                      {blank(data?.establishment) || blank(data?.school_name)}
                    </div>
                  </div>
                  <div style={{ borderBottom: cellBorder, padding: "8px", flex: 1 }}>
                    <div style={labelStyle}>OUTRAS HABILIDADES:</div>
                    <div style={{ ...valueStyle, whiteSpace: "pre-wrap" }}>
                      {blank(data?.additional_skills)}
                    </div>
                  </div>
                  <div style={{ padding: "8px", flex: 1 }}>
                    <div style={labelStyle}>OBSERVAÇÕES:</div>
                    <div style={{ ...valueStyle, whiteSpace: "pre-wrap" }}>
                      {blank(data?.notes)}
                    </div>
                  </div>
                </div>
              </td>

              {/* COL 4 — Registro + Assinaturas */}
              <td
                style={{
                  border: cellBorder,
                  verticalAlign: "top",
                  padding: "8px",
                  width: "24%",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  <div>
                    <p
                      style={{
                        fontSize: "11px",
                        margin: 0,
                        textAlign: "justify",
                        lineHeight: 1.5,
                      }}
                    >
                      O presente documento foi registrado sob o nº{" "}
                      <u>{blank(data?.registry_number) || "______"}</u> em fls nº{" "}
                      <u>{blank(data?.registry_page) || "______"}</u> deste estabelecimento, conforme
                      listagem publicada no D.O. de{" "}
                      <u>{issue.dd || "__"}</u>/<u>{issue.mm || "__"}</u>/
                      <u>{issue.yy || "____"}</u>, fls{" "}
                      <u>{blank(data?.registry_book) || "______"}</u>
                    </p>
                    <p style={{ fontSize: "11px", margin: "10px 0 0 0" }}>
                      {blank(data?.city) || "__________"}{" "}
                      <u>{issue.dd || "__"}</u>/<u>{issue.mm || "__"}</u>/
                      <u>{issue.yy || "____"}</u>
                    </p>
                  </div>

                  <div style={{ marginTop: "auto", paddingTop: "20px" }}>
                    <div
                      style={{
                        borderTop: "1px solid #0f2a44",
                        margin: "0 10px",
                        textAlign: "center",
                        paddingTop: "2px",
                        fontSize: "11px",
                        fontWeight: "bold",
                      }}
                    >
                      {blank(data?.secretary)}
                      <div style={{ fontWeight: "normal" }}>SECRETÁRIO(A)</div>
                    </div>
                    <div
                      style={{
                        borderTop: "1px solid #0f2a44",
                        margin: "30px 10px 0 10px",
                        textAlign: "center",
                        paddingTop: "2px",
                        fontSize: "11px",
                        fontWeight: "bold",
                      }}
                    >
                      {blank(data?.director)}
                      <div style={{ fontWeight: "normal" }}>ÓRGÃO DE FISCALIZAÇÃO PROFISSIONAL</div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

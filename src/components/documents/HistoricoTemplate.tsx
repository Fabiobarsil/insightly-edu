interface HistoricoData {
  student_name?: string;
  birth_date?: string;
  school_name?: string;
  school_address?: string;
  school_cnpj?: string;
  school_authorization?: string;
  years?: number[];
  subjects?: Array<{
    name: string;
    year_1: number | null;
    year_2: number | null;
    year_3: number | null;
    year_4: number | null;
  }>;
  summary?: Array<{
    year: number;
    workload: number;
    frequency: number | null;
    result: string;
  }>;
  school_history?: Array<{
    year: number;
    school: string;
    city: string;
    state: string;
  }>;
  evaluation_criteria?: string;
  observation?: string;
}

interface Props {
  data: HistoricoData;
  id?: string;
}

const fmtDate = (d?: string) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return d;
  }
};

const fmtNum = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : Number(n).toFixed(1);

const todayStr = () =>
  new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

export function HistoricoTemplate({ data, id = "historico-preview-content" }: Props) {
  const years = data.years && data.years.length > 0 ? data.years : [null, null, null, null];
  const yearCols = [0, 1, 2, 3].map((i) => years[i] ?? "—");

  const baseTd: React.CSSProperties = {
    border: "1px solid #000",
    padding: "6px",
    fontSize: 12,
    textAlign: "center",
  };
  const baseTh: React.CSSProperties = { ...baseTd, background: "#eee", fontWeight: "bold" };

  return (
    <div
      id={id}
      style={{
        width: 794,
        minHeight: 1123,
        background: "#fff",
        padding: 40,
        fontFamily: "Arial, sans-serif",
        color: "#000",
      }}
    >
      {/* Cabeçalho */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <small style={{ fontSize: 11 }}>REPÚBLICA FEDERATIVA DO BRASIL</small>
        <h1 style={{ fontSize: 18, margin: "5px 0", textTransform: "uppercase" }}>
          {data.school_name || "—"}
        </h1>
        <small style={{ fontSize: 11 }}>{data.school_address || ""}</small>
        <br />
        <small style={{ fontSize: 11 }}>CNPJ: {data.school_cnpj || "—"}</small>
        <br />
        <small style={{ fontSize: 11 }}>
          Autorização: {data.school_authorization || "—"}
        </small>
      </div>

      {/* Título */}
      <div
        style={{
          textAlign: "center",
          margin: "30px 0",
          fontSize: 18,
          fontWeight: "bold",
          letterSpacing: 2,
        }}
      >
        HISTÓRICO ESCOLAR
      </div>

      {/* Texto inicial */}
      <div style={{ fontSize: 12, textAlign: "justify", marginBottom: 20 }}>
        Certificamos que o(a) aluno(a) <strong>{data.student_name || "—"}</strong>, nascido(a)
        em {fmtDate(data.birth_date)}, cursou nesta instituição as disciplinas previstas na
        grade curricular, obtendo os seguintes resultados:
      </div>

      {/* Tabela de disciplinas */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...baseTh, textAlign: "left" }}>Disciplina</th>
            {yearCols.map((y, i) => (
              <th key={i} style={baseTh}>
                {y}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.subjects && data.subjects.length > 0 ? (
            data.subjects.map((s, i) => (
              <tr key={i}>
                <td style={{ ...baseTd, textAlign: "left" }}>{s.name}</td>
                <td style={baseTd}>{fmtNum(s.year_1)}</td>
                <td style={baseTd}>{fmtNum(s.year_2)}</td>
                <td style={baseTd}>{fmtNum(s.year_3)}</td>
                <td style={baseTd}>{fmtNum(s.year_4)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td style={baseTd} colSpan={5}>
                Nenhuma disciplina registrada
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Resumo */}
      <div style={{ marginTop: 25 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={baseTh}>Ano</th>
              <th style={baseTh}>Carga Horária</th>
              <th style={baseTh}>Frequência</th>
              <th style={baseTh}>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {data.summary && data.summary.length > 0 ? (
              data.summary.map((r, i) => (
                <tr key={i}>
                  <td style={baseTd}>{r.year}</td>
                  <td style={baseTd}>{r.workload}h</td>
                  <td style={baseTd}>
                    {r.frequency != null ? `${Number(r.frequency).toFixed(1)}%` : "—"}
                  </td>
                  <td style={baseTd}>{r.result || "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={baseTd} colSpan={4}>
                  —
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Histórico de Escolaridade */}
      <div style={{ marginTop: 25 }}>
        <h4 style={{ fontSize: 13, margin: "0 0 6px" }}>Histórico de Escolaridade</h4>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={baseTh}>Ano</th>
              <th style={baseTh}>Estabelecimento</th>
              <th style={baseTh}>Cidade/UF</th>
            </tr>
          </thead>
          <tbody>
            {data.school_history && data.school_history.length > 0 ? (
              data.school_history.map((h, i) => (
                <tr key={i}>
                  <td style={baseTd}>{h.year}</td>
                  <td style={baseTd}>{h.school || "—"}</td>
                  <td style={baseTd}>
                    {(h.city || "—") + "/" + (h.state || "—")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={baseTd} colSpan={3}>
                  —
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Critério */}
      <div style={{ marginTop: 25, fontSize: 12, textAlign: "justify" }}>
        <strong>Critério de Avaliação:</strong>
        <br />
        {data.evaluation_criteria || "—"}
      </div>

      {/* Observação */}
      <div style={{ marginTop: 20, fontSize: 12, textAlign: "justify" }}>
        <strong>Observação:</strong>
        <br />
        {data.observation || "—"}
      </div>

      {/* Local e data */}
      <div style={{ marginTop: 30, fontSize: 12 }}>{todayStr()}</div>

      {/* Assinaturas */}
      <div style={{ marginTop: 50, display: "flex", justifyContent: "space-between" }}>
        <div style={{ width: "40%", textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #000", marginTop: 40 }} />
          <span style={{ fontSize: 12 }}>Diretor(a)</span>
        </div>
        <div style={{ width: "40%", textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #000", marginTop: 40 }} />
          <span style={{ fontSize: 12 }}>Secretário(a)</span>
        </div>
      </div>
    </div>
  );
}

export default HistoricoTemplate;

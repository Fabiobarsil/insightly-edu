import brasaoImg from "@/assets/brasao-republica.png";

export interface DocumentSchool {
  name: string;
  address?: string | null;
  cnpj?: string | null;
  mec_authorization_code?: string | null;
  director_name?: string | null;
  director_role?: string | null;
  logo_url?: string | null;
}

export interface DocumentStudent {
  full_name: string;
  classes?: { name: string } | null;
}

export type DocumentOrientation = "portrait" | "landscape";

export interface DocumentLayoutProps {
  type: string;
  title: string;
  content: string;
  student: DocumentStudent;
  school: DocumentSchool | null;
  orientation?: DocumentOrientation;
  id?: string;
  extraContent?: React.ReactNode;
}

const formatDate = (): string => {
  return new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getCity = (school: DocumentSchool | null): string => {
  if (!school?.address) return "Local";
  const parts = school.address.split(",");
  return parts[parts.length - 1]?.trim() || "Local";
};

/**
 * Returns inline-style based JSX for an official document layout.
 * Supports portrait (794x1123) and landscape (1123x794).
 */
export function DocumentLayout({
  type,
  title,
  content,
  student,
  school,
  orientation = "portrait",
  id = "doc-preview-content",
  extraContent,
}: DocumentLayoutProps) {
  const isLandscape = orientation === "landscape";
  const width = isLandscape ? 1123 : 794;
  const height = isLandscape ? 794 : 1123;
  const padding = isLandscape ? "40px" : "60px 50px";
  const today = formatDate();
  const city = getCity(school);

  return (
    <div
      id={id}
      style={{
        width: `${width}px`,
        minHeight: `${height}px`,
        background: "#fff",
        border: "4px solid #0f2a44",
        padding,
        position: "relative",
        fontFamily: "'Times New Roman', serif",
        color: "#0f2a44",
        overflow: "hidden",
      }}
    >
      {/* Marca d'água */}
      {school?.logo_url && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            opacity: 0.06,
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          <img
            src={school.logo_url}
            alt=""
            style={{
              width: isLandscape ? 320 : 280,
              height: isLandscape ? 320 : 280,
              objectFit: "contain",
            }}
          />
        </div>
      )}

      {/* Ornamento superior (apenas landscape/certificado) */}
      {isLandscape && (
        <>
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              right: 16,
              height: 4,
              background: "linear-gradient(90deg, #c8a961, #e8d48b, #c8a961)",
              borderRadius: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: 16,
              right: 16,
              height: 4,
              background: "linear-gradient(90deg, #c8a961, #e8d48b, #c8a961)",
              borderRadius: 2,
            }}
          />
        </>
      )}

      {/* Cabeçalho institucional */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: isLandscape ? 16 : 24,
          marginTop: isLandscape ? 12 : 0,
          position: "relative",
          zIndex: 1,
        }}
      >
        <img
          src={brasaoImg}
          alt="Brasão da República"
          style={{ height: 60, width: 56, objectFit: "contain" }}
        />
        <div style={{ flex: 1, textAlign: "center", padding: "0 16px" }}>
          <p
            style={{
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: 2,
              margin: 0,
              color: "#666",
            }}
          >
            República Federativa do Brasil
          </p>
          {school?.director_role && (
            <p
              style={{
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: 1,
                margin: "2px 0",
                color: "#666",
              }}
            >
              {school.director_role}
            </p>
          )}
          <p
            style={{
              fontSize: isLandscape ? 13 : 14,
              fontWeight: "bold",
              textTransform: "uppercase",
              margin: "4px 0",
              letterSpacing: 1,
            }}
          >
            {school?.name || "Nome da Escola"}
          </p>
          {school?.address && (
            <p style={{ fontSize: 9, margin: 0, color: "#666" }}>{school.address}</p>
          )}
          {school?.cnpj && (
            <p style={{ fontSize: 9, margin: 0, color: "#666" }}>CNPJ: {school.cnpj}</p>
          )}
          {school?.mec_authorization_code && (
            <p style={{ fontSize: 9, margin: 0, color: "#666" }}>
              Portaria: {school.mec_authorization_code}
            </p>
          )}
        </div>
        {school?.logo_url ? (
          <img
            src={school.logo_url}
            alt="Logo da Escola"
            style={{
              height: 60,
              width: 56,
              objectFit: "contain",
              borderRadius: 4,
            }}
          />
        ) : (
          <div style={{ height: 60, width: 60 }} />
        )}
      </div>

      {/* Linha separadora */}
      <div
        style={{
          height: 2,
          background: isLandscape
            ? "linear-gradient(90deg, #c8a961, #e8d48b, #c8a961)"
            : "#0f2a44",
          marginBottom: isLandscape ? 20 : 40,
          position: "relative",
          zIndex: 1,
        }}
      />

      {/* Título do documento */}
      <div style={{ textAlign: "center", marginBottom: isLandscape ? 20 : 40, position: "relative", zIndex: 1 }}>
        <h1
          style={{
            fontSize: isLandscape ? 32 : 24,
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: isLandscape ? 6 : 4,
            margin: 0,
            color: "#0f2a44",
          }}
        >
          {title}
        </h1>
        <div
          style={{
            width: isLandscape ? 120 : 80,
            height: isLandscape ? 3 : 2,
            margin: "10px auto",
            background: isLandscape
              ? "linear-gradient(90deg, #c8a961, #e8d48b, #c8a961)"
              : "#0f2a44",
            borderRadius: 2,
          }}
        />
      </div>

      {/* Corpo do documento */}
      <div
        style={{
          padding: isLandscape ? "0 60px" : "0 30px",
          marginTop: isLandscape ? 30 : 40,
          position: "relative",
          zIndex: 1,
        }}
      >
        {isLandscape && type === "certificado" ? (
          <>
            <p style={{ fontSize: 16, lineHeight: 2, margin: 0, textAlign: "center" }}>
              Certificamos que o(a) aluno(a)
            </p>
            <p
              style={{
                fontSize: 26,
                fontWeight: "bold",
                margin: "8px auto",
                borderBottom: "2px solid #c8a961",
                display: "inline-block",
                padding: "0 20px 4px",
                textAlign: "center",
                width: "auto",
              }}
            >
              {student.full_name}
            </p>
            <p style={{ fontSize: 16, lineHeight: 2, margin: "12px 0 0", textAlign: "center" }}>
              concluiu com êxito o curso{" "}
              {student.classes?.name ? (
                <strong>{student.classes.name}</strong>
              ) : (
                <strong>_______________</strong>
              )}
              {" "}nesta instituição de ensino.
            </p>
          </>
        ) : (
          <p
            style={{
              fontSize: 15,
              lineHeight: 2,
              textAlign: "justify",
              textIndent: "2em",
            }}
          >
            {content}
          </p>
        )}
      </div>

      {/* Rodapé: local, data e assinatura */}
      <div
        style={{
          position: "absolute",
          bottom: isLandscape ? 60 : 80,
          left: isLandscape ? 80 : 50,
          right: isLandscape ? 80 : 50,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          zIndex: 1,
        }}
      >
        <p style={{ fontSize: 13, margin: 0 }}>
          {city}, {today}
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
  );
}

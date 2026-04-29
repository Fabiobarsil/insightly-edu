import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface InternalPageHeaderProps {
  breadcrumbs?: { label: string; href?: string }[];
}

const ROOT_LABELS: Record<string, string> = {
  admin: "Secretaria",
  secretaria: "Secretaria",
  professor: "Professor",
  superadmin: "Superadmin",
};

const ROUTE_LABELS: Record<string, string> = {
  alunos: "Alunos",
  turmas: "Turmas",
  disciplinas: "Disciplinas",
  professores: "Professores",
  documentos: "Documentos",
  comunicacao: "Comunicação",
  coordenacao: "Coordenação",
  configuracoes: "Administração",
  frequencia: "Frequência",
  notas: "Notas",
};

const InternalPageHeader = ({ breadcrumbs }: InternalPageHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const rootSegment = segments[0] || "admin";
  const lastSegment = segments[segments.length - 1];
  const isDashboard = lastSegment === "dashboard";
  const isDirecao = lastSegment === "direcao";

  if (isDashboard || isDirecao) return null;

  // Página Indicadores acessada a partir da Direção
  const fromDirecao =
    rootSegment === "admin" && lastSegment === "indicadores";

  const rootLabel = fromDirecao
    ? "Direção"
    : ROOT_LABELS[rootSegment] || "Secretaria";
  const dashboardPath = fromDirecao
    ? "/admin/direcao"
    : rootSegment === "admin"
      ? "/admin/dashboard"
      : `/${rootSegment}/dashboard`;
  const backLabel = fromDirecao
    ? "Voltar para Direção"
    : "Voltar para Secretaria Digital";
  const fallbackLabel = ROUTE_LABELS[lastSegment] || lastSegment;
  const trail = breadcrumbs && breadcrumbs.length > 0 ? breadcrumbs : [{ label: fallbackLabel }];

  return (
    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href={dashboardPath}
              onClick={(e) => {
                e.preventDefault();
                navigate(dashboardPath);
              }}
              className="text-xs"
            >
              {rootLabel}
            </BreadcrumbLink>
          </BreadcrumbItem>

          {trail.map((item, index) => {
            const isLast = index === trail.length - 1;
            return (
              <BreadcrumbItem key={`${item.label}-${index}`}>
                <BreadcrumbSeparator />
                {isLast || !item.href ? (
                  <BreadcrumbPage className="text-xs">{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.href} className="text-xs">
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <button
        onClick={() => navigate(dashboardPath)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {backLabel}
      </button>
    </div>
  );
};

export default InternalPageHeader;

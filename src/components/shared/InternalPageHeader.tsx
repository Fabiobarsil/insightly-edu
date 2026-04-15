import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

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

const InternalPageHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on dashboard
  const segments = location.pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  if (lastSegment === "dashboard") return null;

  const pageLabel = ROUTE_LABELS[lastSegment] || lastSegment;

  return (
    <div className="flex items-center gap-4 mb-4">
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar para Dashboard
      </button>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="#"
              onClick={(e) => { e.preventDefault(); navigate("/admin/dashboard"); }}
              className="text-xs"
            >
              Secretaria
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-xs">{pageLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};

export default InternalPageHeader;

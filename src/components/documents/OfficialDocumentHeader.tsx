import brasaoImg from "@/assets/brasao-republica.png";

interface SchoolData {
  name: string;
  address?: string | null;
  cnpj?: string | null;
  mec_authorization_code?: string | null;
  director_name?: string | null;
  director_role?: string | null;
  logo_url?: string | null;
}

interface OfficialDocumentHeaderProps {
  school: SchoolData;
}

const OfficialDocumentHeader = ({ school }: OfficialDocumentHeaderProps) => {
  return (
    <div className="w-full border-b-2 border-primary pb-4 mb-6 print:mb-4">
      <div className="flex items-start justify-between gap-4">
        {/* Brasão da República */}
        <div className="flex-shrink-0" style={{ height: 60 }}>
          <img src={brasaoImg} alt="Brasão da República" className="h-[60px] w-auto object-contain" />
        </div>

        {/* Texto Central */}
        <div className="flex-1 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            República Federativa do Brasil
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
            Estado de São Paulo
          </p>
          <h1 className="text-sm font-bold text-primary uppercase tracking-wide">
            {school.name}
          </h1>
          {school.address && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{school.address}</p>
          )}
          {school.cnpj && (
            <p className="text-[10px] text-muted-foreground">CNPJ: {school.cnpj}</p>
          )}
          {school.mec_authorization_code && (
            <p className="text-[10px] text-muted-foreground">
              Portaria/Ato de Autorização: {school.mec_authorization_code}
            </p>
          )}
          {school.director_role && (
            <p className="text-[10px] text-muted-foreground">
              {school.director_role}
            </p>
          )}
        </div>

        {/* Logo da Escola */}
        <div className="flex-shrink-0" style={{ height: 60 }}>
          {school.logo_url ? (
            <img src={school.logo_url} alt="Logo da Escola" className="h-[60px] w-auto object-contain rounded" />
          ) : (
            <div className="h-[60px] w-[60px] rounded bg-accent flex items-center justify-center">
              <i className="ri-school-line text-xl text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfficialDocumentHeader;

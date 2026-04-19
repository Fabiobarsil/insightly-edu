import CertificadoTemplate from "@/components/documents/CertificadoTemplate";
import AppLayout from "@/components/layout/AppLayout";

export default function CertificadoPreview() {
  const mockData = {
    full_name: "Aluno Exemplo",
    cpf: "000.000.000-00",
    rg: "00.000.000-0",
    birth_date: "2000-01-01",
    mother_name: "Maria Exemplo",
    father_name: "João Exemplo",
    modality: "EJA",
    year: "2026",
    director: "Diretor da Escola",
    secretary: "Secretária Escolar",
    school_name: "Escola Modelo Certus",
  };

  return (
    <AppLayout title="Preview Certificado">
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold text-primary">
          Preview — Certificado de Conclusão
        </h1>
        <div className="flex justify-center overflow-auto bg-muted/30 p-6 rounded-lg">
          <CertificadoTemplate data={mockData} />
        </div>
      </div>
    </AppLayout>
  );
}

/**
 * Util centralizado para busca de endereço por CEP via ViaCEP.
 * Usar em todos os formulários (Aluno, Responsável, etc).
 */
export interface CepAddress {
  address: string;
  district: string;
  city: string;
  state: string;
}

export async function fetchAddressByCEP(cep: string): Promise<CepAddress | null> {
  const cleanCep = (cep || "").replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await response.json();
    if (data.erro) return null;
    return {
      address: data.logradouro || "",
      district: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
    };
  } catch (error) {
    console.error("Erro CEP:", error);
    return null;
  }
}

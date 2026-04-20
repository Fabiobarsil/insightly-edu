// Utilitários de formatação e máscaras para inputs

const LOWERCASE_WORDS = new Set(["de", "da", "do", "das", "dos", "e"]);

/**
 * Capitaliza nomes/textos preservando preposições/conjunções em minúsculo.
 * Ex.: "joão pedro da silva" → "João Pedro da Silva"
 */
export const toTitleCase = (value: string): string => {
  if (!value) return "";
  return value
    .toLowerCase()
    .split(/(\s+)/) // preserva espaços para não colapsar enquanto digita
    .map((part, idx) => {
      if (/^\s+$/.test(part)) return part;
      if (idx > 0 && LOWERCASE_WORDS.has(part)) return part;
      // capitaliza respeitando hífen (Maria-Clara) e apóstrofo (D'Ávila)
      return part.replace(/([^\s\-']+)/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
    })
    .join("");
};

/** Aplica máscara de CPF: 000.000.000-00 (apenas números, máx 11 dígitos) */
export const maskCPF = (value: string): string => {
  const digits = (value || "").replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
};

/** Aplica máscara de telefone brasileiro: (00) 0000-0000 ou (00) 00000-0000 */
export const maskPhone = (value: string): string => {
  const digits = (value || "").replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/^(\(\d{2}\)\s\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/^(\(\d{2}\)\s\d{5})(\d)/, "$1-$2");
};

/** RG: permite números e hífen, sem máscara rígida. Ex.: 10796702-8 */
export const formatRG = (value: string): string => {
  return (value || "").replace(/[^\dXx-]/g, "").toUpperCase().slice(0, 15);
};

/** Email: força lowercase e remove espaços */
export const formatEmail = (value: string): string => {
  return (value || "").toLowerCase().replace(/\s+/g, "");
};

/** Validação simples de email */
export const isValidEmail = (value: string): boolean => {
  if (!value) return true; // vazio = ok (validar obrigatoriedade fora)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

/** CEP: 00000-000 */
export const maskCEP = (value: string): string => {
  const digits = (value || "").replace(/\D/g, "").slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
};

export type MaskType = "name" | "cpf" | "phone" | "rg" | "email" | "cep";

export const applyMask = (mask: MaskType | undefined, value: string): string => {
  switch (mask) {
    case "name":
      return toTitleCase(value);
    case "cpf":
      return maskCPF(value);
    case "phone":
      return maskPhone(value);
    case "rg":
      return formatRG(value);
    case "email":
      return formatEmail(value);
    case "cep":
      return maskCEP(value);
    default:
      return value;
  }
};

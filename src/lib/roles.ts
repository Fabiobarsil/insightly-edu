/**
 * Roles consideradas FULL ACCESS no sistema.
 * Qualquer usuário com uma destas roles deve passar em qualquer rota
 * protegida (equivalente ao antigo `admin`).
 *
 * Centralizado aqui para evitar verificações dispersas como
 * `role === 'admin'` espalhadas pelo código.
 */
export const FULL_ACCESS_ROLES = [
  "owner",
  "admin",
  "diretor",
  "coordenador",
  "administracao",
  "secretaria",
] as const;

export type FullAccessRole = (typeof FULL_ACCESS_ROLES)[number];

/** Retorna true se a role recebida (string ou null) tem acesso total. */
export const isFullAccessRole = (role?: string | null): boolean => {
  if (!role) return false;
  return (FULL_ACCESS_ROLES as readonly string[]).includes(role.toLowerCase());
};

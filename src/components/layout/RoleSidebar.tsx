import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";
import { useAuth, DashboardRole } from "@/contexts/AuthContext";
import { useUserAccess } from "@/hooks/useUserAccess";
import logoCertus from "@/assets/logo-certus.png";

interface NavItem {
  icon: string;
  label: string;
  to: string;
  color?: string;
}

/**
 * Menus por role do `account_members` (fonte oficial via get_user_access()).
 * Cada lista é montada estaticamente — nada de filtro hardcoded espalhado.
 *
 * Mapeamento (spec):
 * - superadmin       → painel SaaS
 * - owner            → tudo da escola, exceto /assinaturas (SaaS-only)
 * - secretaria       → CORE operacional completo
 * - diretor          → estratégico (dashboard, indicadores, comunicação)
 * - coordenador      → coordenação + prontuário + intervenções
 * - professor        → sala dos professores (turmas, notas, frequência)
 * - psicologo        → psicologia + prontuário filtrado
 */
const menusByAccessRole: Record<string, NavItem[]> = {
  superadmin: [
    { icon: "ri-dashboard-3-line", label: "Dashboard", to: "/superadmin/dashboard" },
    { icon: "ri-building-2-line", label: "Escolas", to: "/superadmin/escolas" },
  ],
  owner: [
    { icon: "ri-home-smile-2-fill", label: "Secretaria", to: "/admin/dashboard", color: "text-emerald-400" },

    { icon: "ri-shield-star-fill", label: "Direção", to: "/admin/direcao", color: "text-amber-400" },

    { icon: "ri-compass-3-fill", label: "Coordenação", to: "/admin/coordenacao", color: "text-blue-400" },

    { icon: "ri-graduation-cap-fill", label: "Professores", to: "/admin/professores", color: "text-emerald-400" },

    { icon: "ri-mental-health-fill", label: "Psicologia", to: "/psicologia/dashboard", color: "text-purple-400" },

    { icon: "ri-chat-smile-3-fill", label: "Comunicação", to: "/admin/comunicacao", color: "text-cyan-400" },

    { icon: "ri-settings-4-fill", label: "Administração", to: "/admin/configuracoes", color: "text-violet-400" },

    { icon: "ri-file-text-fill", label: "Documentos", to: "/admin/documentos", color: "text-rose-400" },

    { icon: "ri-presentation-fill", label: "Sala dos Professores", to: "/professor/dashboard", color: "text-teal-400" },

    { icon: "ri-team-fill", label: "Alunos", to: "/admin/alunos", color: "text-sky-400" },

    { icon: "ri-book-2-fill", label: "Turmas", to: "/admin/turmas", color: "text-indigo-400" },

    { icon: "ri-booklet-fill", label: "Disciplinas", to: "/admin/disciplinas", color: "text-fuchsia-400" },
  ],
  // Menu COMPLETO para owner/diretor/coordenador/secretaria
  secretaria: [
    { icon: "ri-home-smile-2-fill", label: "Secretaria", to: "/admin/dashboard", color: "text-emerald-400" },
    { icon: "ri-team-fill", label: "Alunos", to: "/admin/alunos", color: "text-sky-400" },
    { icon: "ri-book-2-fill", label: "Turmas", to: "/admin/turmas", color: "text-indigo-400" },
    { icon: "ri-booklet-fill", label: "Disciplinas", to: "/admin/disciplinas", color: "text-fuchsia-400" },
    { icon: "ri-graduation-cap-fill", label: "Professores", to: "/admin/professores", color: "text-emerald-400" },
    { icon: "ri-presentation-fill", label: "Sala dos Professores", to: "/professor/dashboard", color: "text-teal-400" },
    { icon: "ri-mental-health-fill", label: "Psicologia", to: "/psicologia/dashboard", color: "text-purple-400" },
    { icon: "ri-compass-3-fill", label: "Coordenação", to: "/admin/coordenacao", color: "text-blue-400" },
    { icon: "ri-shield-star-fill", label: "Direção", to: "/admin/direcao", color: "text-amber-400" },
    { icon: "ri-file-text-fill", label: "Documentos", to: "/admin/documentos", color: "text-rose-400" },
    { icon: "ri-chat-smile-3-fill", label: "Comunicação", to: "/admin/comunicacao", color: "text-cyan-400" },
    { icon: "ri-settings-4-fill", label: "Administração", to: "/admin/configuracoes", color: "text-violet-400" },
  ],
  // Professor: APENAS Sala dos Professores
  professor: [
    { icon: "ri-presentation-fill", label: "Sala dos Professores", to: "/professor/dashboard", color: "text-teal-400" },
  ],
  // Psicologo: APENAS Psicologia
  psicologo: [
    { icon: "ri-mental-health-fill", label: "Psicologia", to: "/psicologia/dashboard", color: "text-purple-400" },
  ],
};

// Diretor e coordenador veem o menu completo (mesmo do owner/secretaria)
menusByAccessRole.diretor = [...menusByAccessRole.owner];
menusByAccessRole.coordenador = [...menusByAccessRole.owner];
menusByAccessRole.secretaria = [...menusByAccessRole.owner];
/**
 * Fallback: quando ainda não há registro em account_members, usa o menu
 * derivado do AuthContext (school_memberships/profiles) para não bloquear
 * usuários legados.
 */
const fallbackMenusByDashboardRole: Record<DashboardRole, NavItem[]> = {
  superadmin: menusByAccessRole.superadmin,
  admin: menusByAccessRole.owner,
  secretaria: menusByAccessRole.secretaria,
  professor: menusByAccessRole.professor,
  psicologo: menusByAccessRole.psicologo,
};

const RoleSidebar = () => {
  const { dashboardRole, signOut } = useAuth();
  const { access } = useUserAccess();

  const accessRole = access?.role?.toLowerCase() ?? null;
  const isSuperadmin = dashboardRole === "superadmin";
  const items: NavItem[] = isSuperadmin
    ? menusByAccessRole.superadmin
    : (accessRole && menusByAccessRole[accessRole]) ||
      (dashboardRole && fallbackMenusByDashboardRole[dashboardRole]) ||
      [];

  return (
    <aside className="fixed left-0 top-0 w-60 h-screen bg-sidebar flex flex-col z-10 max-[900px]:static max-[900px]:w-full max-[900px]:h-auto">
      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          <img src={logoCertus} alt="CertusEdu" className="h-8 w-auto rounded-[10px]" />
          <div>
            <h1 className="text-[15px] font-semibold text-sidebar-foreground leading-tight tracking-tight">CertusEdu</h1>
            <p className="text-[11px] text-sidebar-foreground/45">Gestão Escolar</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-scroll flex-1 min-h-0 px-3 pb-2 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.endsWith("/dashboard")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-[10px] text-sidebar-foreground/65 mb-0.5 transition-colors text-left text-[13px] font-medium hover:bg-sidebar-foreground/[0.06] hover:text-sidebar-foreground"
            activeClassName="bg-secondary/15 text-secondary"
          >
            <i className={cn(item.icon, "text-[17px]", item.color)} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 pt-2 flex flex-col gap-2">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-[10px] text-sidebar-foreground/65 hover:bg-destructive/15 hover:text-destructive transition-colors text-[13px] font-medium"
        >
          <i className="ri-logout-box-r-line text-[17px]" />
          Sair
        </button>
        <span className="text-[11px] text-sidebar-foreground/35 px-3">© 2026 CertusEdu</span>
      </div>
    </aside>
  );
};

export default RoleSidebar;

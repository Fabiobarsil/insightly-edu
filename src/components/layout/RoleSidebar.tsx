import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";
import { useAuth, DashboardRole } from "@/contexts/AuthContext";
import { useUserAccess } from "@/hooks/useUserAccess";
import logoCertus from "@/assets/logo-certus.png";

/**
 * Mapeamento de visibilidade por role retornada por get_user_access().
 * Usa substrings de `to` para casar itens dos menus existentes.
 * - owner: vê tudo
 * - sem role: não vê nada
 */
const visibilityByAccessRole: Record<string, string[] | "all"> = {
  owner: "all",
  diretor: ["/dashboard", "/direcao", "/indicadores", "/relatorios"],
  coordenador: ["/coordenacao", "/prontuario"],
  secretaria: ["/secretaria", "/alunos", "/documentos", "/usuarios", "/agenda", "/dashboard"],
  professor: ["/professor"],
  psicologo: ["/psicologia"],
};

interface NavItem {
  icon: string;
  label: string;
  to: string;
  color?: string;
}

const menusByRole: Record<DashboardRole, NavItem[]> = {
  superadmin: [
    { icon: "ri-dashboard-3-line", label: "Dashboard", to: "/superadmin/dashboard" },
    { icon: "ri-building-2-line", label: "Escolas", to: "/superadmin/escolas" },
    { icon: "ri-vip-crown-line", label: "Assinaturas", to: "/superadmin/assinaturas" },
    { icon: "ri-group-line", label: "Usuários", to: "/superadmin/usuarios" },
    { icon: "ri-file-list-3-line", label: "Logs", to: "/superadmin/logs" },
    { icon: "ri-settings-3-line", label: "Administração", to: "/superadmin/configuracoes" },
  ],
  admin: [
    { icon: "ri-home-smile-2-fill", label: "Secretaria", to: "/admin/dashboard", color: "text-emerald-400" },
    { icon: "ri-team-fill", label: "Alunos", to: "/admin/alunos", color: "text-sky-400" },
    { icon: "ri-book-2-fill", label: "Turmas", to: "/admin/turmas", color: "text-indigo-400" },
    { icon: "ri-booklet-fill", label: "Disciplinas", to: "/admin/disciplinas", color: "text-fuchsia-400" },
    { icon: "ri-graduation-cap-fill", label: "Professores", to: "/admin/professores", color: "text-emerald-400" },
    { icon: "ri-compass-3-fill", label: "Coordenação", to: "/admin/coordenacao", color: "text-blue-400" },
    { icon: "ri-shield-star-fill", label: "Direção", to: "/admin/direcao", color: "text-amber-400" },
    { icon: "ri-file-text-fill", label: "Documentos", to: "/admin/documentos", color: "text-rose-400" },
    { icon: "ri-chat-smile-3-fill", label: "Comunicação", to: "/admin/comunicacao", color: "text-cyan-400" },
    { icon: "ri-medal-2-fill", label: "Preview Certificado", to: "/admin/certificado-preview", color: "text-yellow-400" },
    { icon: "ri-settings-4-fill", label: "Administração", to: "/admin/configuracoes", color: "text-violet-400" },
  ],
  secretaria: [
    { icon: "ri-dashboard-3-line", label: "Dashboard", to: "/admin/dashboard" },
    { icon: "ri-group-line", label: "Alunos", to: "/secretaria/alunos" },
    { icon: "ri-book-open-line", label: "Turmas", to: "/secretaria/turmas" },
    { icon: "ri-booklet-line", label: "Disciplinas", to: "/secretaria/disciplinas" },
    { icon: "ri-user-star-line", label: "Professores", to: "/secretaria/professores" },
    { icon: "ri-file-text-line", label: "Documentos", to: "/secretaria/documentos" },
  ],
  professor: [
    { icon: "ri-dashboard-3-line", label: "Dashboard", to: "/professor/dashboard" },
    { icon: "ri-book-open-line", label: "Minhas Turmas", to: "/professor/turmas" },
    { icon: "ri-booklet-line", label: "Disciplinas", to: "/professor/disciplinas" },
    { icon: "ri-bar-chart-box-line", label: "Lançar Notas", to: "/professor/notas" },
    { icon: "ri-calendar-check-line", label: "Frequência", to: "/professor/frequencia" },
  ],
};

const RoleSidebar = () => {
  const { dashboardRole, signOut } = useAuth();
  const { access } = useUserAccess();

  const baseItems = dashboardRole ? menusByRole[dashboardRole] : [];

  // Filtra com base na role retornada por get_user_access().
  // Se não houver access definido, mantém comportamento atual (baseItems).
  const accessRole = access?.role?.toLowerCase();
  let items = baseItems;
  if (accessRole !== undefined) {
    const rule = visibilityByAccessRole[accessRole];
    if (!rule) {
      items = []; // role desconhecida → não mostra nada
    } else if (rule !== "all") {
      items = baseItems.filter((it) => rule.some((frag) => it.to.includes(frag)));
    }
  }

  return (
    <aside className="fixed left-0 top-0 w-60 h-screen bg-primary flex flex-col z-10 max-[900px]:static max-[900px]:w-full max-[900px]:h-auto">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={logoCertus} alt="CertusEdu" className="h-8 w-auto rounded-[10px]" />
          <div>
            <h1 className="text-[15px] font-bold text-sidebar-foreground leading-tight">CertusEdu</h1>
            <p className="text-[11px] text-sidebar-foreground/45">Gestão Escolar</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 px-[10px] overflow-hidden">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.endsWith("/dashboard")}
            className="w-full flex items-center gap-[10px] px-3 py-2 rounded-[12px] text-sidebar-foreground/55 mb-0.5 transition-all duration-200 text-left text-sm hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground/85"
            activeClassName="bg-secondary/15 text-secondary"
          >
            <i className={cn(item.icon, "text-lg", item.color)} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border flex flex-col gap-3">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-[12px] text-sidebar-foreground/55 hover:bg-destructive/15 hover:text-destructive transition-colors text-sm font-medium"
        >
          <i className="ri-logout-box-r-line text-lg" />
          Sair
        </button>
        <span className="text-[13px] text-sidebar-foreground/45">© 2026 CertusEdu</span>
      </div>
    </aside>
  );
};

export default RoleSidebar;

import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";
import { useAuth, DashboardRole } from "@/contexts/AuthContext";
import logoCertus from "@/assets/logo-certus.png";

interface NavItem {
  icon: string;
  label: string;
  to: string;
}

const menusByRole: Record<DashboardRole, NavItem[]> = {
  superadmin: [
    { icon: "ri-dashboard-3-line", label: "Dashboard", to: "/superadmin/dashboard" },
    { icon: "ri-building-2-line", label: "Escolas", to: "/superadmin/escolas" },
    { icon: "ri-vip-crown-line", label: "Assinaturas", to: "/superadmin/assinaturas" },
    { icon: "ri-group-line", label: "Usuários", to: "/superadmin/usuarios" },
    { icon: "ri-file-list-3-line", label: "Logs", to: "/superadmin/logs" },
    { icon: "ri-settings-3-line", label: "Configurações", to: "/superadmin/configuracoes" },
  ],
  admin: [
    { icon: "ri-dashboard-3-line", label: "Dashboard", to: "/admin/dashboard" },
    { icon: "ri-group-line", label: "Alunos", to: "/admin/alunos" },
    { icon: "ri-parent-line", label: "Responsáveis", to: "/admin/responsaveis" },
    { icon: "ri-book-open-line", label: "Turmas", to: "/admin/turmas" },
    { icon: "ri-booklet-line", label: "Disciplinas", to: "/admin/disciplinas" },
    { icon: "ri-user-star-line", label: "Professores", to: "/admin/professores" },
    { icon: "ri-team-line", label: "Usuários", to: "/admin/usuarios" },
    { icon: "ri-bar-chart-box-line", label: "Relatórios", to: "/admin/relatorios" },
    { icon: "ri-settings-3-line", label: "Configurações", to: "/admin/configuracoes" },
  ],
  secretaria: [
    { icon: "ri-dashboard-3-line", label: "Dashboard", to: "/secretaria/dashboard" },
    { icon: "ri-group-line", label: "Alunos", to: "/secretaria/alunos" },
    { icon: "ri-parent-line", label: "Responsáveis", to: "/secretaria/responsaveis" },
    { icon: "ri-book-open-line", label: "Turmas", to: "/secretaria/turmas" },
    { icon: "ri-booklet-line", label: "Disciplinas", to: "/secretaria/disciplinas" },
    { icon: "ri-user-star-line", label: "Professores", to: "/secretaria/professores" },
    { icon: "ri-file-text-line", label: "Documentos", to: "/secretaria/documentos" },
  ],
  professor: [
    { icon: "ri-book-open-line", label: "Minhas Turmas", to: "/professor/turmas" },
    { icon: "ri-booklet-line", label: "Minhas Disciplinas", to: "/professor/disciplinas" },
    { icon: "ri-bar-chart-box-line", label: "Lançar Notas", to: "/professor/notas" },
  ],
};

const RoleSidebar = () => {
  const { dashboardRole } = useAuth();
  const items = dashboardRole ? menusByRole[dashboardRole] : [];

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

      <nav className="flex-1 p-4 px-[10px] overflow-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.endsWith("/dashboard")}
            className="w-full flex items-center gap-[10px] px-3 py-[10px] rounded-[12px] text-sidebar-foreground/55 mb-1 transition-all duration-200 text-left text-sm hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground/85"
            activeClassName="bg-secondary/15 text-secondary"
          >
            <i className={cn(item.icon, "text-lg")} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border text-[13px] text-sidebar-foreground/45">
        © 2026 CertusEdu
      </div>
    </aside>
  );
};

export default RoleSidebar;

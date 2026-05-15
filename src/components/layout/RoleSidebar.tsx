import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";
import { useAuth, DashboardRole } from "@/contexts/AuthContext";
import { useUserAccess } from "@/hooks/useUserAccess";
import { useSidebar } from "./SidebarContext";
import { X } from "lucide-react";
import logoCertus from "@/assets/logo-certus.png";

interface NavItem {
  icon: string;
  label: string;
  to: string;
  color?: string;
}

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
  secretaria: [],
  professor: [
    { icon: "ri-presentation-fill", label: "Sala dos Professores", to: "/professor/dashboard", color: "text-teal-400" },
  ],
  psicologo: [
    { icon: "ri-mental-health-fill", label: "Psicologia", to: "/psicologia/dashboard", color: "text-purple-400" },
  ],
};

menusByAccessRole.diretor = [...menusByAccessRole.owner];
menusByAccessRole.coordenador = [...menusByAccessRole.owner];
menusByAccessRole.secretaria = [...menusByAccessRole.owner];

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
  const { open, setOpen } = useSidebar();

  const accessRole = access?.role?.toLowerCase() ?? null;
  const isSuperadmin = dashboardRole === "superadmin";
  const items: NavItem[] = isSuperadmin
    ? menusByAccessRole.superadmin
    : (accessRole && menusByAccessRole[accessRole]) ||
      (dashboardRole && fallbackMenusByDashboardRole[dashboardRole]) ||
      [];

  return (
    <>
      {/* Overlay (mobile/tablet) */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed left-0 top-0 w-60 h-screen bg-sidebar border-r border-border flex flex-col z-40 transition-transform duration-300 ease-out",
          "lg:translate-x-0",
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        )}
      >
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoCertus} alt="CertusEdu" className="h-8 w-auto rounded-[10px]" />
            <div>
              <h1 className="text-[15px] font-semibold text-sidebar-foreground leading-tight tracking-tight">CertusEdu</h1>
              <p className="text-[11px] text-sidebar-foreground/45">Gestão Escolar</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="lg:hidden p-1.5 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-foreground/10"
          >
            <X className="h-4 w-4" />
          </button>
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
    </>
  );
};

export default RoleSidebar;

import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";

const navItems = [
  {
    section: "GESTÃO",
    items: [
      { icon: "ri-building-4-line", label: "Secretaria", to: "/" },
      { icon: "ri-shield-star-line", label: "Direção", to: "/direcao" },
      { icon: "ri-team-line", label: "Coordenação", to: "/coordenacao" },
      { icon: "ri-mental-health-line", label: "Psicologia", to: "/psicologia" },
      { icon: "ri-notification-3-line", label: "Comunicação", to: "/comunicacao" },
      { icon: "ri-settings-3-line", label: "Administração", to: "/configuracoes" },
    ],
  },

  {
    section: "AMBIENTE PEDAGÓGICO",
    items: [{ icon: "ri-presentation-line", label: "Sala dos Professores", to: "/professor/dashboard" }],
  },

  {
    section: "CADASTROS ACADÊMICOS",
    items: [
      { icon: "ri-group-line", label: "Alunos", to: "/alunos" },
      { icon: "ri-book-open-line", label: "Turmas", to: "/turmas" },
      { icon: "ri-book-2-line", label: "Disciplinas", to: "/disciplinas" },
      { icon: "ri-user-star-line", label: "Professores", to: "/professores" },
      { icon: "ri-file-text-line", label: "Documentos", to: "/documentos" },
    ],
  },
];

const Sidebar = () => (
  <aside className="fixed left-0 top-0 w-60 h-screen bg-primary flex flex-col z-10 max-[900px]:static max-[900px]:w-full max-[900px]:h-auto">
    <div className="p-5 border-b border-sidebar-border">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-[10px] bg-secondary flex items-center justify-center">
          <i className="ri-graduation-cap-fill text-secondary-foreground text-sm" />
        </div>
        <div>
          <h1 className="text-[15px] font-bold text-sidebar-foreground leading-tight">Certus Edu</h1>
          <p className="text-[11px] text-sidebar-foreground/45">Gestão Escolar</p>
        </div>
      </div>
    </div>

    <nav className="flex-1 p-4 px-[10px] overflow-y-auto">
      {navItems.map((section) => (
        <div key={section.section} className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/30 px-3 mb-2">
            {section.section}
          </p>

          {section.items.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === "/"}
              className="w-full flex items-center gap-[10px] px-3 py-[10px] rounded-[12px] text-sidebar-foreground/55 mb-1 transition-all duration-200 text-left text-sm hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground/85"
              activeClassName="bg-secondary/15 text-secondary"
            >
              <i className={cn(item.icon, "text-lg")} />
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>

    <div className="p-4 border-t border-sidebar-border text-[12px] text-sidebar-foreground/45 leading-snug">© 2026 CertusEdu™ v1.0.0<br />Software proprietário do ecossistema Certus</div>
  </aside>
);

export default Sidebar;

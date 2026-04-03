import { cn } from "@/lib/utils";

const navItems = [
  { icon: "ri-dashboard-3-line", label: "Dashboard", active: true },
  { icon: "ri-group-line", label: "Alunos" },
  { icon: "ri-user-star-line", label: "Professores" },
  { icon: "ri-book-open-line", label: "Turmas" },
  { icon: "ri-calendar-check-line", label: "Frequência" },
  { icon: "ri-bar-chart-box-line", label: "Notas" },
  { icon: "ri-file-text-line", label: "Documentos" },
  { icon: "ri-notification-3-line", label: "Avisos" },
  { icon: "ri-settings-3-line", label: "Configurações" },
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

    <nav className="flex-1 p-4 px-[10px] overflow-auto">
      {navItems.map((item) => (
        <button
          key={item.label}
          className={cn(
            "w-full flex items-center gap-[10px] px-3 py-[10px] rounded-[12px] text-sidebar-foreground/55 mb-1 transition-all duration-200 text-left text-sm hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground/85",
            item.active && "bg-secondary/15 text-secondary"
          )}
        >
          <i className={cn(item.icon, "text-lg")} />
          {item.label}
        </button>
      ))}
    </nav>

    <div className="p-4 border-t border-sidebar-border text-[13px] text-sidebar-foreground/45">
      © 2024 Certus Edu
    </div>
  </aside>
);

export default Sidebar;

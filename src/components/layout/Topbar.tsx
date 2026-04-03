import { Link } from "react-router-dom";

interface TopbarProps {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

const Topbar = ({ title = "Dashboard", breadcrumbs }: TopbarProps) => (
  <header className="sticky top-0 bg-card border-b border-border/60 px-8 py-5 flex items-center justify-between z-[5] max-[900px]:px-5 max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-4">
    <div>
      <div className="text-xs text-muted flex items-center gap-2 mb-1.5 flex-wrap">
        <Link to="/" className="hover:text-foreground transition-colors">Certus Edu</Link>
        {breadcrumbs?.map((b, i) => (
          <span key={i} className="flex items-center gap-2">
            <i className="ri-arrow-right-s-line text-[10px]" />
            {b.href ? (
              <Link to={b.href} className="hover:text-foreground transition-colors">{b.label}</Link>
            ) : (
              <span className="text-foreground">{b.label}</span>
            )}
          </span>
        )) || (
          <>
            <i className="ri-arrow-right-s-line text-[10px]" />
            <span>{title}</span>
          </>
        )}
      </div>
      <h2 className="text-2xl font-bold text-primary">{title}</h2>
    </div>
    <div className="flex items-center gap-3">
      <span className="bg-accent text-muted text-xs px-3 py-2 rounded-full font-semibold">
        Ano Letivo 2024
      </span>
      <Link to="/alunos/novo" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-[12px] font-bold text-sm hover:bg-primary/90 transition-colors">
        <i className="ri-add-line" /> Novo Aluno
      </Link>
    </div>
  </header>
);

export default Topbar;

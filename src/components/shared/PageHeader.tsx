import { Link } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: { label: string; icon: string; to: string };
}

const PageHeader = ({ title, description, action }: PageHeaderProps) => (
  <div className="flex items-start justify-between mb-6 max-[640px]:flex-col max-[640px]:gap-3">
    <div>
      <h1 className="text-xl font-bold text-primary">{title}</h1>
      {description && <p className="text-sm text-muted mt-1">{description}</p>}
    </div>
    {action && (
      <Link
        to={action.to}
        className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-[14px] font-bold text-sm hover:bg-secondary/90 transition-colors"
      >
        <i className={action.icon} /> {action.label}
      </Link>
    )}
  </div>
);

export default PageHeader;

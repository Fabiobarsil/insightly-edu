import { Link } from "react-router-dom";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  actions?: (row: any) => { label: string; icon: string; to?: string; onClick?: () => void }[];
  searchPlaceholder?: string;
}

const DataTable = ({ columns, data, actions, searchPlaceholder = "Buscar..." }: DataTableProps) => (
  <div className="bg-card border border-border/60 rounded-xl certus-shadow">
    <div className="p-4 border-b border-border/40">
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 border border-border rounded-[12px] px-3 py-2 bg-background">
          <i className="ri-search-line text-muted" />
          <input className="flex-1 bg-transparent text-sm outline-none" placeholder={searchPlaceholder} />
        </div>
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40">
            {columns.map((col) => (
              <th key={col.key} className="text-left px-4 py-3 text-xs font-bold text-muted uppercase tracking-wider">
                {col.label}
              </th>
            ))}
            {actions && <th className="px-4 py-3 text-right text-xs font-bold text-muted uppercase tracking-wider">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b border-border/20 hover:bg-accent/40 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-foreground">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {actions && (
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {actions(row).map((action, i) =>
                      action.to ? (
                        <Link key={i} to={action.to} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-accent transition-colors" title={action.label}>
                          <i className={action.icon} />
                        </Link>
                      ) : (
                        <button key={i} onClick={action.onClick} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-accent transition-colors" title={action.label}>
                          <i className={action.icon} />
                        </button>
                      )
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="p-4 border-t border-border/40 flex items-center justify-between text-xs text-muted">
      <span>Mostrando {data.length} registros</span>
      <div className="flex gap-1">
        <button className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-bold">1</button>
        <button className="px-3 py-1.5 rounded-lg hover:bg-accent transition-colors">2</button>
        <button className="px-3 py-1.5 rounded-lg hover:bg-accent transition-colors">3</button>
      </div>
    </div>
  </div>
);

export default DataTable;

interface FormCardProps {
  title: string;
  children: React.ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
  cancelTo?: string;
}

import { Link } from "react-router-dom";
import { toast } from "sonner";

const FormCard = ({ title, children, onSubmit, submitLabel = "Salvar", cancelTo }: FormCardProps) => (
  <div className="bg-card border border-border/60 rounded-xl certus-shadow p-6">
    <h3 className="text-lg font-bold text-primary mb-6">{title}</h3>
    <div className="space-y-4">
      {children}
    </div>
    <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border/40">
      <button
        onClick={() => {
          onSubmit?.();
          toast.success("Registro salvo com sucesso!");
        }}
        className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-5 py-2.5 rounded-[14px] font-bold text-sm hover:bg-secondary/90 transition-colors"
      >
        <i className="ri-check-line" /> {submitLabel}
      </button>
      {cancelTo && (
        <Link to={cancelTo} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[14px] font-bold text-sm border border-border hover:bg-accent transition-colors text-muted">
          Cancelar
        </Link>
      )}
    </div>
  </div>
);

export default FormCard;

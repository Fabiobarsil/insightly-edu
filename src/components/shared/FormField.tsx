import { applyMask, MaskType } from "@/utils/formatters";

interface FormFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  options?: { value: string; label: string }[];
  textarea?: boolean;
  mask?: MaskType;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const FormField = ({ label, type = "text", placeholder, value, options, textarea, mask, onChange }: FormFieldProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (mask && onChange) {
      const masked = applyMask(mask, e.target.value);
      // entrega ao consumidor um event com valor já mascarado
      const cloned = { ...e, target: { ...e.target, value: masked } } as typeof e;
      onChange(cloned);
      return;
    }
    onChange?.(e);
  };

  return (
    <div>
      <label className="block text-xs font-bold text-muted-foreground mb-1.5">{label}</label>
      {options ? (
        <select value={value} defaultValue={value === undefined ? "" : undefined} onChange={onChange} className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors">
          <option value="">Selecionar...</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : textarea ? (
        <textarea value={value} placeholder={placeholder} rows={3} onChange={handleChange} className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors resize-none" />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          inputMode={mask === "cpf" || mask === "phone" || mask === "cep" ? "numeric" : undefined}
          autoCapitalize={mask === "email" ? "none" : undefined}
          autoCorrect={mask === "email" ? "off" : undefined}
          className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors"
        />
      )}
    </div>
  );
};

export default FormField;

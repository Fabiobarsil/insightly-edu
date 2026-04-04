interface FormFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  options?: { value: string; label: string }[];
  textarea?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const FormField = ({ label, type = "text", placeholder, value, options, textarea, onChange }: FormFieldProps) => (
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
      <textarea value={value} defaultValue={value === undefined ? undefined : undefined} placeholder={placeholder} rows={3} onChange={onChange} className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors resize-none" />
    ) : (
      <input type={type} value={value} defaultValue={value === undefined ? undefined : undefined} placeholder={placeholder} onChange={onChange} className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
    )}
  </div>
);

export default FormField;

interface FormFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  options?: { value: string; label: string }[];
  textarea?: boolean;
}

const FormField = ({ label, type = "text", placeholder, value, options, textarea }: FormFieldProps) => (
  <div>
    <label className="block text-xs font-bold text-muted-foreground mb-1.5">{label}</label>
    {options ? (
      <select defaultValue={value} className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors">
        <option value="">Selecionar...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    ) : textarea ? (
      <textarea defaultValue={value} placeholder={placeholder} rows={3} className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors resize-none" />
    ) : (
      <input type={type} defaultValue={value} placeholder={placeholder} className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
    )}
  </div>
);

export default FormField;

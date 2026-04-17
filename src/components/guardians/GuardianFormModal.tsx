import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const relationshipTypes = [
  { value: "pai", label: "Pai" },
  { value: "mae", label: "Mãe" },
  { value: "responsavel_legal", label: "Responsável Legal" },
  { value: "outro", label: "Outro" },
];

const genderOptions = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
];

const maritalOptions = [
  { value: "solteiro", label: "Solteiro(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "divorciado", label: "Divorciado(a)" },
  { value: "viuvo", label: "Viúvo(a)" },
  { value: "uniao_estavel", label: "União Estável" },
];

const incomeOptions = [
  { value: "ate_1sm", label: "Até 1 salário mínimo" },
  { value: "1_a_3sm", label: "1 a 3 salários mínimos" },
  { value: "3_a_5sm", label: "3 a 5 salários mínimos" },
  { value: "5_a_10sm", label: "5 a 10 salários mínimos" },
  { value: "acima_10sm", label: "Acima de 10 salários mínimos" },
];

const emptyForm = {
  full_name: "", cpf: "", rg: "", birth_date: "", gender: "", nationality: "", marital_status: "",
  relationship_type: "", relationship_description: "", is_financial: false, is_pedagogical: false, is_primary: false,
  phone: "", phone_secondary: "", email: "", email_secondary: "", whatsapp_enabled: true,
  zipcode: "", address: "", number: "", complement: "", district: "", city: "", state: "",
  profession: "", company: "", income_range: "", work_phone: "",
  can_pickup: false, can_receive_reports: true, can_authorize_image: false,
  notes: "",
};

const FieldInput = ({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) => (
  <div>
    <label className="block text-xs font-bold text-muted-foreground mb-1">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors" />
  </div>
);

const FieldSelect = ({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) => (
  <div>
    <label className="block text-xs font-bold text-muted-foreground mb-1">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors">
      <option value="">Selecionar...</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const FieldCheck = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded border-border text-secondary focus:ring-secondary" />
    <span className="text-sm text-primary">{label}</span>
  </label>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h5 className="text-xs font-bold text-secondary uppercase tracking-wider mt-5 mb-3 first:mt-0">{children}</h5>
);

interface GuardianFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string | null;
  /** If provided, links the guardian to this student after creation */
  studentId?: string;
  /** Called after successful creation with the new guardian's id and full_name */
  onCreated?: (guardian: { id: string; full_name: string }) => void;
  /** If provided, modal opens in edit mode for this guardian id */
  guardianId?: string | null;
}

export default function GuardianFormModal({ open, onOpenChange, schoolId, studentId, onCreated, guardianId }: GuardianFormModalProps) {
  const queryClient = useQueryClient();
  const [gf, setGf] = useState({ ...emptyForm });
  const isEdit = !!guardianId;

  const gSet = (key: string) => (val: string) => setGf((p) => ({ ...p, [key]: val }));
  const gCheck = (key: string) => (val: boolean) => setGf((p) => ({ ...p, [key]: val }));

  // Load guardian data when editing
  useEffect(() => {
    if (!open) return;
    if (!guardianId) {
      setGf({ ...emptyForm });
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("guardians")
        .select("*")
        .eq("id", guardianId)
        .maybeSingle();
      if (error) {
        toast.error("Erro ao carregar responsável");
        return;
      }
      if (data) {
        setGf({
          ...emptyForm,
          ...Object.fromEntries(
            Object.keys(emptyForm).map((k) => [k, (data as any)[k] ?? (typeof (emptyForm as any)[k] === "boolean" ? false : "")])
          ),
        } as typeof emptyForm);
      }
    })();
  }, [open, guardianId]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!schoolId) throw new Error("Sem escola vinculada");
      if (!gf.full_name.trim()) throw new Error("Nome é obrigatório");

      const payload = {
        full_name: gf.full_name.trim(),
        cpf: gf.cpf || null, rg: gf.rg || null, birth_date: gf.birth_date || null,
        gender: gf.gender || null, nationality: gf.nationality || null, marital_status: gf.marital_status || null,
        relationship_type: gf.relationship_type || null, relationship_description: gf.relationship_description || null,
        is_financial: gf.is_financial, is_pedagogical: gf.is_pedagogical, is_primary: gf.is_primary,
        phone: gf.phone || null, phone_secondary: gf.phone_secondary || null,
        email: gf.email || null, email_secondary: gf.email_secondary || null, whatsapp_enabled: gf.whatsapp_enabled,
        zipcode: gf.zipcode || null, address: gf.address || null, number: gf.number || null,
        complement: gf.complement || null, district: gf.district || null, city: gf.city || null, state: gf.state || null,
        profession: gf.profession || null, company: gf.company || null,
        income_range: gf.income_range || null, work_phone: gf.work_phone || null,
        can_pickup: gf.can_pickup, can_receive_reports: gf.can_receive_reports, can_authorize_image: gf.can_authorize_image,
        notes: gf.notes || null,
      };

      if (isEdit && guardianId) {
        const { data: guardian, error: uErr } = await supabase
          .from("guardians")
          .update(payload)
          .eq("id", guardianId)
          .select("id, full_name")
          .single();
        if (uErr) throw uErr;
        return guardian;
      }

      const { data: guardian, error: gErr } = await supabase
        .from("guardians")
        .insert({ ...payload, school_id: schoolId })
        .select("id, full_name")
        .single();
      if (gErr) throw gErr;

      if (studentId) {
        const { error: sgErr } = await supabase
          .from("student_guardians")
          .insert({ student_id: studentId, guardian_id: guardian.id, school_id: schoolId });
        if (sgErr) throw sgErr;
      }

      return guardian;
    },
    onSuccess: (guardian) => {
      queryClient.invalidateQueries({ queryKey: ["guardians", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["student-guardians"] });
      setGf({ ...emptyForm });
      onOpenChange(false);
      toast.success(isEdit ? "Responsável atualizado!" : "Responsável cadastrado!");
      if (!isEdit) onCreated?.(guardian);
    },
    onError: (err: any) => toast.error(err.message || "Erro ao salvar responsável"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Responsável" : "Novo Responsável"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 pt-2">
          <SectionTitle>Identificação</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FieldInput label="Nome Completo *" value={gf.full_name} onChange={gSet("full_name")} placeholder="Nome completo" />
            <FieldInput label="CPF" value={gf.cpf} onChange={gSet("cpf")} placeholder="000.000.000-00" />
            <FieldInput label="RG" value={gf.rg} onChange={gSet("rg")} placeholder="Número do RG" />
            <FieldInput label="Data de Nascimento" value={gf.birth_date} onChange={gSet("birth_date")} type="date" />
            <FieldSelect label="Sexo" value={gf.gender} onChange={gSet("gender")} options={genderOptions} />
            <FieldInput label="Nacionalidade" value={gf.nationality} onChange={gSet("nationality")} placeholder="Brasileiro(a)" />
            <FieldSelect label="Estado Civil" value={gf.marital_status} onChange={gSet("marital_status")} options={maritalOptions} />
          </div>

          <SectionTitle>Relação com o Aluno</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FieldSelect label="Tipo de Relação" value={gf.relationship_type} onChange={gSet("relationship_type")} options={relationshipTypes} />
            <FieldInput label="Grau de Parentesco" value={gf.relationship_description} onChange={gSet("relationship_description")} placeholder="Ex: Avó materna" />
          </div>
          <div className="flex flex-wrap gap-4 mt-2">
            <FieldCheck label="Responsável financeiro" checked={gf.is_financial} onChange={gCheck("is_financial")} />
            <FieldCheck label="Responsável pedagógico" checked={gf.is_pedagogical} onChange={gCheck("is_pedagogical")} />
            <FieldCheck label="Responsável principal" checked={gf.is_primary} onChange={gCheck("is_primary")} />
          </div>

          <SectionTitle>Contato</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FieldInput label="Telefone Principal" value={gf.phone} onChange={gSet("phone")} placeholder="(00) 00000-0000" />
            <FieldInput label="Telefone Secundário" value={gf.phone_secondary} onChange={gSet("phone_secondary")} placeholder="(00) 00000-0000" />
            <FieldInput label="E-mail Principal" value={gf.email} onChange={gSet("email")} placeholder="email@exemplo.com" />
            <FieldInput label="E-mail Secundário" value={gf.email_secondary} onChange={gSet("email_secondary")} placeholder="email2@exemplo.com" />
          </div>
          <div className="mt-2">
            <FieldCheck label="WhatsApp habilitado" checked={gf.whatsapp_enabled} onChange={gCheck("whatsapp_enabled")} />
          </div>

          <SectionTitle>Endereço</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FieldInput label="CEP" value={gf.zipcode} onChange={gSet("zipcode")} placeholder="00000-000" />
            <div className="md:col-span-2">
              <FieldInput label="Endereço" value={gf.address} onChange={gSet("address")} placeholder="Rua, Avenida..." />
            </div>
            <FieldInput label="Número" value={gf.number} onChange={gSet("number")} placeholder="Nº" />
            <FieldInput label="Complemento" value={gf.complement} onChange={gSet("complement")} placeholder="Apto, Bloco..." />
            <FieldInput label="Bairro" value={gf.district} onChange={gSet("district")} placeholder="Bairro" />
            <FieldInput label="Cidade" value={gf.city} onChange={gSet("city")} placeholder="Cidade" />
            <FieldInput label="Estado" value={gf.state} onChange={gSet("state")} placeholder="UF" />
          </div>

          <SectionTitle>Dados Profissionais</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FieldInput label="Profissão" value={gf.profession} onChange={gSet("profession")} placeholder="Profissão" />
            <FieldInput label="Empresa" value={gf.company} onChange={gSet("company")} placeholder="Empresa" />
            <FieldSelect label="Faixa de Renda" value={gf.income_range} onChange={gSet("income_range")} options={incomeOptions} />
            <FieldInput label="Telefone Comercial" value={gf.work_phone} onChange={gSet("work_phone")} placeholder="(00) 0000-0000" />
          </div>

          <SectionTitle>Permissões</SectionTitle>
          <div className="flex flex-wrap gap-4">
            <FieldCheck label="Pode buscar o aluno" checked={gf.can_pickup} onChange={gCheck("can_pickup")} />
            <FieldCheck label="Pode receber relatórios" checked={gf.can_receive_reports} onChange={gCheck("can_receive_reports")} />
            <FieldCheck label="Pode autorizar uso de imagem" checked={gf.can_authorize_image} onChange={gCheck("can_authorize_image")} />
          </div>

          <SectionTitle>Observações</SectionTitle>
          <textarea value={gf.notes} onChange={(e) => setGf((p) => ({ ...p, notes: e.target.value }))} placeholder="Observações adicionais..." rows={3}
            className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors resize-none" />

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => onOpenChange(false)}
              className="px-4 py-2.5 rounded-[12px] border border-border text-sm font-medium text-muted-foreground hover:bg-accent transition-colors">
              Cancelar
            </button>
            <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/90 transition-colors disabled:opacity-50">
              <i className="ri-save-line" /> {mutation.isPending ? "Salvando..." : "Salvar Responsável"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import FormCard from "@/components/shared/FormCard";
import { toast } from "sonner";

interface SignaturesTabProps {
  schoolId: string | null;
}

type Cargo = "diretor" | "coordenador" | "secretario";

interface SigEntry {
  nome: string;
  registro: string;
}

type SigState = Record<Cargo, SigEntry>;

const cargos: { key: Cargo; label: string }[] = [
  { key: "diretor", label: "Diretor(a)" },
  { key: "coordenador", label: "Coordenador(a)" },
  { key: "secretario", label: "Secretário(a)" },
];

const TEMPLATE_TITLE = "__assinaturas__";
const TEMPLATE_CATEGORY = "assinaturas";

const emptyState: SigState = {
  diretor: { nome: "", registro: "" },
  coordenador: { nome: "", registro: "" },
  secretario: { nome: "", registro: "" },
};

const SignaturesTab = ({ schoolId }: SignaturesTabProps) => {
  const queryClient = useQueryClient();
  const [data, setData] = useState<SigState>(emptyState);

  const { data: existing } = useQuery({
    queryKey: ["signatures", schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data, error } = await supabase
        .from("message_templates")
        .select("id, content")
        .eq("school_id", schoolId)
        .eq("category", TEMPLATE_CATEGORY)
        .eq("title", TEMPLATE_TITLE)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!schoolId,
  });

  useEffect(() => {
    if (existing?.content) {
      try {
        const parsed = JSON.parse(existing.content) as Partial<SigState>;
        setData({
          diretor: { ...emptyState.diretor, ...(parsed.diretor || {}) },
          coordenador: { ...emptyState.coordenador, ...(parsed.coordenador || {}) },
          secretario: { ...emptyState.secretario, ...(parsed.secretario || {}) },
        });
      } catch {
        // mantém estado padrão se conteúdo inválido
      }
    }
  }, [existing]);

  const update = (cargo: Cargo, field: keyof SigEntry) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setData((prev) => ({ ...prev, [cargo]: { ...prev[cargo], [field]: e.target.value } }));

  const mutation = useMutation({
    mutationFn: async () => {
      if (!schoolId) throw new Error("Escola não encontrada");
      const payload = {
        school_id: schoolId,
        category: TEMPLATE_CATEGORY,
        title: TEMPLATE_TITLE,
        content: JSON.stringify(data),
      };
      if (existing?.id) {
        const { error } = await supabase
          .from("message_templates")
          .update({ content: payload.content })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("message_templates").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Assinaturas salvas!");
      queryClient.invalidateQueries({ queryKey: ["signatures", schoolId] });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao salvar assinaturas"),
  });

  return (
    <FormCard
      title="Assinaturas Institucionais"
      onSubmit={() => mutation.mutate()}
      submitLabel={mutation.isPending ? "Salvando..." : "Salvar Dados"}
    >
      <div className="space-y-4">
        {cargos.map(({ key, label }) => (
          <div key={key} className="bg-background border border-border/60 rounded-xl p-5">
            <h4 className="text-sm font-bold text-primary mb-4">{label}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Nome</label>
                <input
                  value={data[key].nome}
                  onChange={update(key, "nome")}
                  placeholder={`Nome do(a) ${label}`}
                  className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Registro</label>
                <input
                  value={data[key].registro}
                  onChange={update(key, "registro")}
                  placeholder="Número do registro"
                  className="w-full border border-border rounded-[12px] px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-secondary transition-colors"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </FormCard>
  );
};

export default SignaturesTab;

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import FormField from "@/components/shared/FormField";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { toast } from "sonner";

const Communication = () => {
  const { schoolId } = useSchoolId();
  const [destinatario, setDestinatario] = useState("");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");

  const { data: classes = [] } = useQuery({
    queryKey: ["classes", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("classes").select("id, name").eq("school_id", schoolId).order("name");
      return data || [];
    },
    enabled: !!schoolId,
  });

  const handleSend = () => {
    if (!assunto.trim() || !mensagem.trim()) {
      toast.error("Preencha assunto e mensagem.");
      return;
    }
    console.log("[Communication] Enviando:", { destinatario, assunto, mensagem });
    toast.success("Mensagem enviada com sucesso!");
    setAssunto("");
    setMensagem("");
  };

  return (
    <AppLayout title="Comunicação" breadcrumbs={[{ label: "Comunicação" }]}>
      <PageHeader title="Comunicação" description="Envie mensagens e comunicados" />
      <div className="bg-card border border-border/60 rounded-xl p-6 certus-shadow space-y-4">
        <FormField
          label="Destinatários"
          options={[
            { value: "all", label: "Todos os Responsáveis" },
            ...classes.map((c: any) => ({ value: c.id, label: c.name })),
          ]}
          value={destinatario}
          onChange={(e) => setDestinatario(e.target.value)}
        />
        <FormField label="Assunto" placeholder="Assunto da mensagem" value={assunto} onChange={(e) => setAssunto(e.target.value)} />
        <FormField label="Mensagem" textarea placeholder="Digite sua mensagem..." value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
        <div className="flex justify-end">
          <button onClick={handleSend} className="px-5 py-2.5 rounded-[14px] bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/90 transition-colors">
            <i className="ri-send-plane-line mr-1" /> Enviar
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Communication;

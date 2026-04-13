import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import RoleLayout from "@/components/layout/RoleLayout";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import { toast } from "sonner";
import { Mail, MessageCircle, FileText, ChevronRight, Send, Users, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const templates = [
  { id: "1", title: "Reunião de Pais", text: "Prezado(a) responsável, informamos que a reunião de pais e mestres será realizada no dia [DATA] às [HORA]. Contamos com sua presença." },
  { id: "2", title: "Alerta de Frequência", text: "Prezado(a) responsável, informamos que o(a) aluno(a) [NOME] apresenta frequência abaixo do mínimo exigido. Solicitamos atenção." },
  { id: "3", title: "Pendência Documental", text: "Prezado(a) responsável, há documentos pendentes para o(a) aluno(a) [NOME]. Por favor, regularize na secretaria." },
  { id: "4", title: "Boletim Disponível", text: "Prezado(a) responsável, o boletim do(a) aluno(a) [NOME] está disponível. Entre em contato com a secretaria para mais informações." },
  { id: "5", title: "Comunicado Geral", text: "Prezado(a) responsável, informamos que [MENSAGEM]. Atenciosamente, a direção." },
];

const Communication = () => {
  const { schoolId } = useSchoolId();
  const [destinatario, setDestinatario] = useState("all");
  const [mensagem, setMensagem] = useState("");
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const { data: guardians = [] } = useQuery({
    queryKey: ["comm-guardians", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("guardians")
        .select("id, full_name, phone, email")
        .eq("school_id", schoolId)
        .order("full_name");
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  const getTargetGuardians = () => {
    if (destinatario === "all") return guardians;
    return guardians.filter((g) => g.id === destinatario);
  };

  const handleEmail = () => {
    if (!mensagem.trim()) { toast.error("Digite uma mensagem."); return; }
    const targets = getTargetGuardians();
    if (targets.length === 0) { toast.error("Nenhum destinatário encontrado."); return; }
    // Future: integrate with email API
    console.log("[Email] Enviando para", targets.length, "responsáveis");
    toast.success(`E-mail preparado para ${targets.length} responsável(is).`);
  };

  const handleWhatsApp = () => {
    if (!mensagem.trim()) { toast.error("Digite uma mensagem."); return; }
    const targets = getTargetGuardians();
    const withPhone = targets.filter((g) => g.phone);
    if (withPhone.length === 0) { toast.error("Nenhum responsável com telefone cadastrado."); return; }

    if (withPhone.length === 1) {
      const phone = withPhone[0].phone!.replace(/\D/g, "");
      const url = `https://wa.me/55${phone}?text=${encodeURIComponent(mensagem)}`;
      window.open(url, "_blank");
      toast.success("WhatsApp aberto!");
    } else {
      // Open first contact, notify about others
      const phone = withPhone[0].phone!.replace(/\D/g, "");
      const url = `https://wa.me/55${phone}?text=${encodeURIComponent(mensagem)}`;
      window.open(url, "_blank");
      toast.success(`WhatsApp aberto para ${withPhone[0].full_name}. Total: ${withPhone.length} contatos.`);
    }
  };

  const selectTemplate = (text: string) => {
    setMensagem(text);
    setTemplatesOpen(false);
    toast.success("Template aplicado!");
  };

  return (
    <RoleLayout title="Comunicação">
      <div className="flex flex-col gap-6 max-w-2xl">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-foreground">Comunicação</h2>
          <p className="text-sm text-muted-foreground mt-1">Envie mensagens rápidas para responsáveis</p>
        </div>

        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-6 space-y-5">
            {/* Destinatário */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Destinatário
              </label>
              <Select value={destinatario} onValueChange={setDestinatario}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Responsáveis</SelectItem>
                  {guardians.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.full_name ?? "Sem nome"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mensagem */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Mensagem
                </label>
                <button
                  onClick={() => setTemplatesOpen(true)}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" />
                  Usar mensagem padrão
                </button>
              </div>
              <Textarea
                placeholder="Digite sua mensagem aqui..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="rounded-xl min-h-[140px] resize-none"
              />
              <p className="text-[10px] text-muted-foreground">{mensagem.length} caracteres</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleEmail}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
              >
                <Mail className="h-4 w-4" />
                Enviar E-mail
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-secondary text-secondary-foreground font-bold text-sm hover:bg-secondary/90 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Enviar WhatsApp
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Quick info */}
        <div className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3 border border-border/30">
          <User className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            {guardians.length} responsável(is) cadastrado(s) •{" "}
            {guardians.filter((g) => g.phone).length} com telefone •{" "}
            {guardians.filter((g) => g.email).length} com e-mail
          </p>
        </div>
      </div>

      {/* Templates modal */}
      <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Mensagens Padrão
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="flex flex-col gap-2 pr-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => selectTemplate(t.text)}
                  className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors text-left w-full"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{t.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{t.text}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </RoleLayout>
  );
};

export default Communication;

import { useState } from "react";
import { toast } from "sonner";
import { Mail, MessageCircle, FileText, Search, User, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";

interface Student {
  id: string;
  full_name: string;
  status: string | null;
  class_id: string | null;
}

interface Guardian {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean | null;
}

interface Props {
  students: Student[];
  selectedStudentId: string | null;
  onSelectStudent: (id: string | null) => void;
  guardian: Guardian | null;
  mensagem: string;
  setMensagem: (v: string) => void;
}

const CommunicationForm = ({ students, selectedStudentId, onSelectStudent, guardian, mensagem, setMensagem }: Props) => {
  const { schoolId } = useSchoolId();
  const [search, setSearch] = useState("");
  const [canal, setCanal] = useState<"whatsapp" | "email">("whatsapp");
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ["comm-templates", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("message_templates")
        .select("id, title, content")
        .eq("school_id", schoolId)
        .order("title");
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  const filteredStudents = students.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const handleSend = () => {
    if (!mensagem.trim()) { toast.error("Digite uma mensagem."); return; }
    if (!guardian) { toast.error("Nenhum responsável vinculado."); return; }

    if (canal === "whatsapp") {
      if (!guardian.phone) { toast.error("Responsável sem telefone cadastrado."); return; }
      const phone = guardian.phone.replace(/\D/g, "");
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(mensagem)}`, "_blank");
      toast.success("WhatsApp aberto!");
    } else {
      console.log("[Email] Enviando para", guardian.email);
      toast.success(`E-mail preparado para ${guardian.full_name}.`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Comunicação</h2>
        <p className="text-sm text-muted-foreground mt-1">Envie mensagens contextualizadas aos responsáveis</p>
      </div>

      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-6 space-y-5">
          {/* Student search */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              Aluno
            </label>
            {selectedStudent ? (
              <div className="flex items-center justify-between rounded-xl border border-border px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{selectedStudent.full_name}</span>
                </div>
                <button
                  onClick={() => { onSelectStudent(null); setSearch(""); }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Trocar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Buscar aluno pelo nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-xl"
                />
                {search.length >= 2 && (
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-background">
                    {filteredStudents.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-3">Nenhum aluno encontrado</p>
                    ) : (
                      filteredStudents.slice(0, 8).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => { onSelectStudent(s.id); setSearch(""); }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-accent/50 transition-colors"
                        >
                          {s.full_name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Guardian (auto) */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Responsável
            </label>
            <div className="rounded-xl border border-border px-4 py-2.5 bg-muted/20">
              {guardian ? (
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{guardian.full_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {guardian.phone ?? "Sem telefone"} • {guardian.email ?? "Sem e-mail"}
                    {guardian.is_primary && " • Principal"}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {selectedStudentId ? "Nenhum responsável vinculado" : "Selecione um aluno"}
                </span>
              )}
            </div>
          </div>

          {/* Channel */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Canal</label>
            <div className="flex gap-2">
              <button
                onClick={() => setCanal("whatsapp")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold border transition-colors ${
                  canal === "whatsapp"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent/30"
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </button>
              <button
                onClick={() => setCanal("email")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold border transition-colors ${
                  canal === "email"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent/30"
                }`}
              >
                <Mail className="h-4 w-4" />
                E-mail
              </button>
            </div>
          </div>

          {/* Message */}
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
                Templates
              </button>
            </div>
            <Textarea
              placeholder="Digite sua mensagem aqui..."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="rounded-xl min-h-[120px] resize-none"
            />
            <p className="text-[10px] text-muted-foreground">{mensagem.length} caracteres</p>
          </div>

          {/* Send */}
          <Button onClick={handleSend} className="w-full rounded-xl gap-2" size="lg">
            <Send className="h-4 w-4" />
            Enviar {canal === "whatsapp" ? "WhatsApp" : "E-mail"}
          </Button>
        </CardContent>
      </Card>

      {/* Templates dialog */}
      <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Templates
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="flex flex-col gap-2 pr-2">
              {templates.length === 0 && (
                <p className="text-sm text-muted-foreground p-4 text-center">Nenhum template cadastrado.</p>
              )}
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    let text = t.content;
                    if (selectedStudent) text = text.replace(/\[NOME\]/g, selectedStudent.full_name);
                    setMensagem(text);
                    setTemplatesOpen(false);
                    toast.success("Template aplicado!");
                  }}
                  className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors text-left w-full"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{t.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{t.content}</p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunicationForm;

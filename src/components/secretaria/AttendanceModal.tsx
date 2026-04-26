import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CheckCircle2,
  RotateCcw,
  User,
  Tag,
  Flag,
  Calendar,
  Loader2,
  FileText,
  IdCard,
} from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { KanbanRequest } from "@/hooks/useSecretariaKanban";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  request: KanbanRequest | null;
}

const PRIORITY_STYLES: Record<string, string> = {
  urgente: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  alta: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  media: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  baixa: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
};

const AttendanceModal = ({ open, onOpenChange, request }: Props) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [note, setNote] = useState("");

  const goTo = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["secretaria-kanban"] });
    queryClient.invalidateQueries({ queryKey: ["secretary-counters"] });
    queryClient.invalidateQueries({ queryKey: ["secretary-alerts-bar"] });
  };

  const updateMutation = useMutation({
    mutationFn: async (newStatus: "concluido" | "aberto") => {
      if (!request) throw new Error("Solicitação ausente");
      const { error } = await supabase
        .from("secretaria_requests")
        .update({ status: newStatus })
        .eq("id", request.id);
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      invalidateAll();
      if (newStatus === "concluido") {
        toast.success("Atendimento concluído");
      } else {
        toast.success("Demanda devolvida para a fila");
      }
      setNote("");
      onOpenChange(false);
    },
    onError: (err) => {
      console.error("[AttendanceModal] update falhou:", err);
      toast.error("Não foi possível atualizar a demanda");
    },
  });

  const isLoading = updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !isLoading && onOpenChange(v)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Atender Solicitação</DialogTitle>
          <DialogDescription>
            Conclua ou devolva a demanda para a fila de trabalho.
          </DialogDescription>
        </DialogHeader>

        {request && (
          <div className="flex flex-col gap-4">
            {/* Detalhes */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-base font-bold text-foreground leading-tight">
                  {request.title}
                </h4>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 capitalize text-[11px] font-semibold",
                    PRIORITY_STYLES[request.priority] ?? PRIORITY_STYLES.media
                  )}
                >
                  <Flag className="h-3 w-3 mr-1" />
                  {request.priority}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium text-foreground truncate">
                    {request.student_name ?? "Sem aluno vinculado"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Tag className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium text-foreground capitalize truncate">
                    {request.type ?? "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium text-foreground">
                    Criada em{" "}
                    {format(new Date(request.created_at), "dd 'de' MMMM 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Atalhos para o aluno */}
            {request.student_id && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => goTo(`/admin/alunos/${request.student_id}`)}
                  disabled={isLoading}
                  className="gap-1.5 justify-center h-9"
                >
                  <IdCard className="h-4 w-4" />
                  Cadastro do Aluno
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => goTo(`/admin/alunos/${request.student_id}/prontuario`)}
                  disabled={isLoading}
                  className="gap-1.5 justify-center h-9"
                >
                  <FileText className="h-4 w-4" />
                  Prontuário
                </Button>
              </div>
            )}

            {/* Observação */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="attendance-note" className="text-xs font-semibold">
                Observação (opcional)
              </Label>
              <Textarea
                id="attendance-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Registre o que foi feito neste atendimento..."
                className="min-h-[80px] text-sm resize-none"
                disabled={isLoading}
              />
              <p className="text-[11px] text-muted-foreground">
                As observações serão persistidas em uma próxima versão.
              </p>
            </div>

            {/* Ações */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => updateMutation.mutate("aberto")}
                disabled={isLoading}
                className="gap-1.5"
              >
                {isLoading && updateMutation.variables === "aberto" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Voltar para Fila
              </Button>
              <Button
                onClick={() => updateMutation.mutate("concluido")}
                disabled={isLoading}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-600/90 text-white"
              >
                {isLoading && updateMutation.variables === "concluido" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Concluir Atendimento
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceModal;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
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
  History,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { updateRequestStatus } from "@/lib/secretariaActions";
import { cn } from "@/lib/utils";
import type { KanbanRequest } from "@/hooks/useSecretariaKanban";
import { formatDocType } from "@/components/admin-dashboard/SecretaryKanban";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  request: KanbanRequest | null;
}

const PRIORITY_STYLES: Record<string, string> = {
  alta: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  media: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  baixa: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
};

const STATUS_LABEL: Record<string, string> = {
  pendente: "A Fazer",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
};

const ACTION_LABEL: Record<string, string> = {
  iniciou: "Iniciou atendimento",
  concluiu: "Concluiu",
  retornou: "Devolveu para fila",
  reabriu: "Reabriu",
  alterou: "Alterou status",
  observacao: "Registrou observação",
  documento_aprovado: "Documento aprovado",
};

const AttendanceModal = ({ open, onOpenChange, request }: Props) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [note, setNote] = useState("");

  // Limpa observação ao trocar de demanda
  useEffect(() => {
    setNote("");
  }, [request?.id]);

  // Últimos 5 atendimentos do aluno
  const { data: history = [] } = useQuery({
    queryKey: ["attendance-history", request?.student_id, open],
    enabled: !!request?.student_id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secretaria_actions")
        .select("id, action_type, from_status, to_status, notes, created_at")
        .eq("student_id", request!.student_id!)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  const goTo = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["secretaria-kanban"] });
    queryClient.invalidateQueries({ queryKey: ["secretary-counters"] });
    queryClient.invalidateQueries({ queryKey: ["secretary-alerts-bar"] });
    queryClient.invalidateQueries({ queryKey: ["secretary-actions-history"] });
    queryClient.invalidateQueries({ queryKey: ["attendance-history"] });
  };

  const updateMutation = useMutation({
    mutationFn: async (newStatus: "concluido" | "pendente") => {
      if (!request) throw new Error("Solicitação ausente");
      await updateRequestStatus(
        {
          id: request.id,
          school_id: request.school_id,
          student_id: request.student_id,
          status: request.request_status,
        },
        newStatus,
        note.trim() || null
      );
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

  const docLabel = request?.document_type ? formatDocType(request.document_type) : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !isLoading && onOpenChange(v)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atender Solicitação</DialogTitle>
          <DialogDescription>
            Ficha operacional do atendimento. Registre o que foi feito e finalize.
          </DialogDescription>
        </DialogHeader>

        {request && (
          <div className="flex flex-col gap-4">
            {/* Detalhes da demanda */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-foreground leading-tight">
                    {docLabel ? `Documento pendente — ${docLabel}` : request.title}
                  </h4>
                  {docLabel && (
                    <p className="text-xs text-muted-foreground mt-1">{request.title}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize text-[11px] font-semibold",
                      PRIORITY_STYLES[request.priority] ?? PRIORITY_STYLES.media
                    )}
                  >
                    <Flag className="h-3 w-3 mr-1" />
                    {request.priority}
                  </Badge>
                  <Badge variant="secondary" className="text-[11px] font-semibold">
                    {STATUS_LABEL[request.request_status] ?? request.request_status}
                  </Badge>
                </div>
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
                {(request.student_grade || request.student_class) && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-medium text-foreground truncate">
                      {[request.student_grade, request.student_class].filter(Boolean).join(" ")}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium text-foreground">
                    Aberta em{" "}
                    {format(new Date(request.created_at), "dd 'de' MMMM 'às' HH:mm", {
                      locale: ptBR,
                    })}
                    {" "}
                    <span className="text-muted-foreground">
                      ({formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: ptBR })})
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Atalhos para o aluno */}
            {request.student_id && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() =>
                    goTo(
                      `/secretaria/matricula/${request.student_id}?request_id=${request.id}&returnTo=attendance`
                    )
                  }
                  disabled={isLoading}
                  className="gap-1.5 justify-center h-9 bg-primary hover:bg-primary/90"
                >
                  <IdCard className="h-4 w-4" />
                  Ficha do Aluno
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
                Observação do atendimento
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
                A observação será registrada no histórico desta demanda.
              </p>
            </div>

            {/* Últimos 5 atendimentos do aluno */}
            {request.student_id && history.length > 0 && (
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                  <h5 className="text-xs font-bold text-foreground uppercase tracking-wide">
                    Últimos atendimentos do aluno
                  </h5>
                </div>
                <ScrollArea className="max-h-[180px]">
                  <ul className="flex flex-col gap-1.5">
                    {history.map((h: any) => (
                      <li
                        key={h.id}
                        className="flex items-start gap-2 text-xs bg-card border border-border/40 rounded-md px-2.5 py-1.5"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">
                            {ACTION_LABEL[h.action_type] ?? h.action_type}
                          </p>
                          {h.notes && (
                            <p className="text-muted-foreground italic mt-0.5 line-clamp-2">
                              "{h.notes}"
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                          {formatDistanceToNow(new Date(h.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}

            {/* Ações com hierarquia clara */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between pt-2 border-t border-border/40">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="gap-1.5"
              >
                Voltar para Fila
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => updateMutation.mutate("pendente")}
                  disabled={isLoading}
                  className="gap-1.5"
                >
                  {isLoading && updateMutation.variables === "pendente" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  Devolver
                </Button>
                <Button
                  onClick={() => updateMutation.mutate("concluido")}
                  disabled={isLoading}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
                >
                  {isLoading && updateMutation.variables === "concluido" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Finalizar Atendimento
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceModal;

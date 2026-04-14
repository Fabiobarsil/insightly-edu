import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, PlayCircle, User, FileText, MapPin, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const PRIORITY_MAP: Record<string, { label: string; class: string }> = {
  baixa: { label: "Baixa", class: "bg-muted text-muted-foreground" },
  media: { label: "Média", class: "bg-primary/10 text-primary" },
  alta: { label: "Alta", class: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  urgente: { label: "Urgente", class: "bg-destructive/10 text-destructive" },
};

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  aberto: { label: "Aberto", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  "em andamento": { label: "Em andamento", class: "bg-primary/10 text-primary" },
  concluido: { label: "Concluído", class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

interface AttendRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: {
    id: string;
    student_name: string | null;
    request_type: string;
    origin: string;
    priority: string;
    status: string;
    description: string | null;
    deadline: string | null;
    student_status: string;
    created_at: string;
  } | null;
}

const AttendRequestModal = ({ open, onOpenChange, request }: AttendRequestModalProps) => {
  const queryClient = useQueryClient();
  const [observation, setObservation] = useState("");

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!request) return;
      const desc = observation.trim()
        ? [request.description, `[Obs: ${observation.trim()}]`].filter(Boolean).join(" — ")
        : undefined;
      const { error } = await supabase
        .from("secretary_requests")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(desc ? { description: desc } : {}),
        })
        .eq("id", request.id);
      if (error) throw error;
    },
    onSuccess: (_, newStatus) => {
      toast.success(newStatus === "concluido" ? "Solicitação concluída!" : "Atendimento iniciado!");
      queryClient.invalidateQueries({ queryKey: ["secretary-requests"] });
      setObservation("");
      onOpenChange(false);
    },
    onError: () => toast.error("Erro ao atualizar solicitação."),
  });

  if (!request) return null;

  const pri = PRIORITY_MAP[request.priority] || PRIORITY_MAP.media;
  const st = STATUS_MAP[request.status] || STATUS_MAP.aberto;
  const canStart = request.status === "aberto";
  const canResolve = request.status === "aberto" || request.status === "em andamento";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Atender Solicitação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Info cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 bg-accent/40 rounded-lg p-3">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Aluno</p>
                <p className="text-sm font-medium text-foreground truncate">{request.student_name || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-accent/40 rounded-lg p-3">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Tipo</p>
                <p className="text-sm font-medium text-foreground truncate">{request.request_type}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-accent/40 rounded-lg p-3">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Origem</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {request.origin === "coordenacao" ? "Coordenação" : "Secretaria"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-accent/40 rounded-lg p-3">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Prazo</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {request.deadline ? format(new Date(request.deadline), "dd/MM/yyyy") : "Sem prazo"}
                </p>
              </div>
            </div>
          </div>

          {/* Status + Priority */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className={pri.class}>{pri.label}</Badge>
            <Badge variant="secondary" className={st.class}>{st.label}</Badge>
            {request.origin === "coordenacao" && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 text-[10px]">
                Coordenação
              </Badge>
            )}
          </div>

          {/* Description */}
          {request.description && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Descrição</p>
              <p className="text-sm text-foreground">{request.description}</p>
            </div>
          )}

          {/* Observation field */}
          {canResolve && (
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Observação (opcional)</label>
              <Textarea
                placeholder="Adicione uma observação sobre o atendimento..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                className="resize-none h-20"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {canStart && (
            <Button
              variant="outline"
              onClick={() => updateStatus.mutate("em andamento")}
              disabled={updateStatus.isPending}
              className="gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              Iniciar Atendimento
            </Button>
          )}
          {canResolve && (
            <Button
              onClick={() => updateStatus.mutate("concluido")}
              disabled={updateStatus.isPending}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Marcar como Resolvido
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AttendRequestModal;

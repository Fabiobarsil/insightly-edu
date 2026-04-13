import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const PRIORITIES = [
  { value: "baixa", label: "Baixa", class: "bg-muted text-muted-foreground" },
  { value: "media", label: "Média", class: "bg-primary/10 text-primary" },
  { value: "alta", label: "Alta", class: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  { value: "urgente", label: "Urgente", class: "bg-destructive/10 text-destructive" },
];

interface Props {
  open: boolean;
  onConfirm: (priority: string) => void;
  onCancel: () => void;
}

const PriorityModal = ({ open, onConfirm, onCancel }: Props) => {
  const [selected, setSelected] = useState("media");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Classificar Prioridade</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Defina a prioridade desta solicitação para a fila de trabalho.</p>
        <div className="flex flex-col gap-2 mt-2">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              onClick={() => setSelected(p.value)}
              className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${selected === p.value ? p.class + " ring-2 ring-offset-1 ring-primary/30" : "bg-muted/50 text-muted-foreground hover:bg-accent"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Button className="w-full mt-3" onClick={() => onConfirm(selected)}>
          Confirmar e Adicionar à Fila
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PriorityModal;

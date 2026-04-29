import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Clock, PlayCircle, CheckCircle2, ArrowRight, Check, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useSecretariaKanban,
  type KanbanRequest,
  type KanbanStatus,
} from "@/hooks/useSecretariaKanban";
import type { CounterFilter } from "./SecretaryCounters";

/** Resolve para onde clicar no card deve direcionar */
function resolveCardAction(item: KanbanRequest): string {
  const text = `${item.type ?? ""} ${item.title}`.toLowerCase();
  // Documento pendente / histórico / declaração → ficha do aluno (aba Documentos)
  if (item.student_id && (item.document_type || /document|histor|certif|declar/.test(text))) {
    return `/admin/alunos/${item.student_id}?tab=documentos`;
  }
  // Demanda vinculada a aluno → detalhes do aluno
  if (item.student_id) {
    return `/admin/alunos/${item.student_id}`;
  }
  // Sem aluno → fila completa da secretaria
  return "/admin/secretaria";
}


const COLUMNS = [
  {
    id: "aberto" as KanbanStatus,
    title: "A Fazer",
    icon: Clock,
    accent: "border-t-amber-500",
    iconClass: "bg-amber-500/10 text-amber-600",
    next: "em_andamento" as KanbanStatus,
  },
  {
    id: "em_andamento" as KanbanStatus,
    title: "Em Andamento",
    icon: PlayCircle,
    accent: "border-t-primary",
    iconClass: "bg-primary/10 text-primary",
    next: "concluido" as KanbanStatus,
  },
  {
    id: "concluido" as KanbanStatus,
    title: "Concluído",
    icon: CheckCircle2,
    accent: "border-t-emerald-500",
    iconClass: "bg-emerald-500/10 text-emerald-600",
    next: null as KanbanStatus | null,
  },
] as const;

const PRIORITY_BORDER: Record<string, string> = {
  urgente: "border-l-destructive",
  alta: "border-l-destructive",
  media: "border-l-amber-500",
  baixa: "border-l-muted-foreground/40",
};

const PRIORITY_DOT: Record<string, string> = {
  urgente: "bg-destructive",
  alta: "bg-destructive",
  media: "bg-amber-500",
  baixa: "bg-muted-foreground/50",
};

const PRIORITY_LABEL: Record<string, string> = {
  urgente: "Urgente",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

interface Props {
  filter?: CounterFilter;
}

const SecretaryKanban = ({ filter = "all" }: Props) => {
  const { requests, loading, updateStatus } = useSecretariaKanban();
  const [activeId, setActiveId] = useState<string | null>(null);
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const filtered = useMemo(() => {
    switch (filter) {
      case "alerts":
        return requests.filter(
          (r) => r.priority === "alta" && r.status !== "concluido"
        );
      case "queue":
        return requests.filter((r) => r.status !== "concluido");
      case "documents":
        return requests.filter((r) =>
          /document|histor|certif|declar/i.test(`${r.type ?? ""} ${r.title}`)
        );
      case "students":
      case "all":
      default:
        return requests;
    }
  }, [requests, filter]);

  const grouped: Record<KanbanStatus, KanbanRequest[]> = {
    aberto: [],
    em_andamento: [],
    concluido: [],
  };
  filtered.forEach((r) => {
    if (grouped[r.status]) grouped[r.status].push(r);
  });

  const filterLabel: Record<CounterFilter, string> = {
    all: "Todas as demandas",
    students: "Filtro: Alunos",
    documents: "Filtro: Documentos",
    queue: "Filtro: Fila ativa",
    alerts: "Filtro: Críticos",
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const id = String(active.id);
    const overId = String(over.id) as KanbanStatus;
    const item = requests.find((r) => r.id === id);
    if (!item || item.status === overId) return;
    if (!["aberto", "em_andamento", "concluido"].includes(overId)) return;

    try {
      await updateStatus(id, overId);
      toast.success(
        overId === "concluido" ? "Demanda concluída" : "Demanda atualizada"
      );
    } catch {
      toast.error("Não foi possível atualizar a demanda");
    }
  };

  const activeItem = activeId ? requests.find((r) => r.id === activeId) : null;

  return (
    <section className="bg-card border border-border/60 rounded-xl p-5 shadow-sm">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Fila operacional</h3>
          <p className="text-xs text-muted-foreground">{filterLabel[filter]}</p>
        </div>
        {loading && (
          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </header>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              items={grouped[col.id] || []}
              onCardClick={(item) => navigate(resolveCardAction(item))}
              onAdvance={async (item) => {
                if (!col.next) return;
                try {
                  await updateStatus(item.id, col.next);
                  toast.success(
                    col.next === "concluido" ? "Demanda concluída" : "Demanda atualizada"
                  );
                } catch {
                  toast.error("Não foi possível atualizar a demanda");
                }
              }}
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem ? <KanbanCardPreview item={activeItem} /> : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
};

/* ---------------- Column ---------------- */

interface ColumnProps {
  column: (typeof COLUMNS)[number];
  items: KanbanRequest[];
  onAdvance: (item: KanbanRequest) => void;
  onCardClick: (item: KanbanRequest) => void;
}

const KanbanColumn = ({ column, items, onAdvance, onCardClick }: ColumnProps) => {
  const Icon = column.icon;
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-muted/30 border border-border/50 border-t-4 rounded-lg flex flex-col min-h-[320px] transition-colors",
        column.accent,
        isOver && "bg-muted/60 ring-1 ring-primary/30"
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "w-7 h-7 rounded-md flex items-center justify-center",
              column.iconClass
            )}
          >
            <Icon className="w-4 h-4" />
          </span>
          <h4 className="text-sm font-semibold text-foreground">{column.title}</h4>
        </div>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {items.length}
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-2 p-3">
        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center px-2 py-8">
            <p className="text-xs text-muted-foreground/70">
              Nenhuma demanda nesta coluna
            </p>
          </div>
        ) : (
          items.map((item) => (
            <KanbanCard
              key={item.id}
              item={item}
              nextStatus={column.next}
              onAdvance={() => onAdvance(item)}
              onClickCard={() => onCardClick(item)}
            />
          ))
        )}
      </div>
    </div>
  );
};

/* ---------------- Card ---------------- */

interface CardProps {
  item: KanbanRequest;
  nextStatus: KanbanStatus | null;
  onAdvance: () => void;
  onClickCard: () => void;
}

const KanbanCard = ({ item, nextStatus, onAdvance, onClickCard }: CardProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
  });

  // Distingue clique de drag: registra posição no pointer down e só dispara
  // o clique se o movimento total foi menor que 4px (mesma activation distance).
  const downRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <article
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onPointerDownCapture={(e) => {
        downRef.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        const start = downRef.current;
        if (!start) return onClickCard();
        const dx = Math.abs(e.clientX - start.x);
        const dy = Math.abs(e.clientY - start.y);
        if (dx < 4 && dy < 4) onClickCard();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClickCard();
        }
      }}
      className={cn(
        "group/card relative bg-card border border-border/50 border-l-4 rounded-md px-3 py-2.5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30",
        PRIORITY_BORDER[item.priority] || "border-l-muted",
        isDragging && "opacity-40 cursor-grabbing"
      )}
    >
      <p className="text-sm font-medium text-foreground truncate pr-12">
        {item.title}
        {item.student_name ? ` — ${item.student_name}` : ""}
      </p>
      <div className="flex items-center justify-between mt-1.5 gap-2">
        <span className="text-[11px] text-muted-foreground truncate">
          {formatDistanceToNow(new Date(item.created_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              PRIORITY_DOT[item.priority] || "bg-muted-foreground/40"
            )}
          />
          {PRIORITY_LABEL[item.priority] || item.priority}
        </span>
      </div>

      {nextStatus && (
        <div className="absolute top-1.5 right-1.5 hidden group-hover/card:flex items-center gap-1 animate-in fade-in-0 duration-150">
          <button
            type="button"
            title={nextStatus === "concluido" ? "Concluir" : "Avançar"}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onAdvance();
            }}
            className={cn(
              "h-6 w-6 rounded-md flex items-center justify-center text-white transition-colors",
              nextStatus === "concluido"
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {nextStatus === "concluido" ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      )}
    </article>
  );
};

const KanbanCardPreview = ({ item }: { item: KanbanRequest }) => (
  <article
    className={cn(
      "bg-card border border-border border-l-4 rounded-md px-3 py-2.5 shadow-lg w-[260px]",
      PRIORITY_BORDER[item.priority] || "border-l-muted"
    )}
  >
    <p className="text-sm font-medium text-foreground truncate">
      {item.title}
      {item.student_name ? ` — ${item.student_name}` : ""}
    </p>
    <div className="flex items-center justify-between mt-1.5 gap-2">
      <span className="text-[11px] text-muted-foreground truncate">
        {formatDistanceToNow(new Date(item.created_at), {
          addSuffix: true,
          locale: ptBR,
        })}
      </span>
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
        {PRIORITY_LABEL[item.priority] || item.priority}
      </span>
    </div>
  </article>
);

export default SecretaryKanban;

import { useMemo, useRef, useState } from "react";
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
import {
  Clock,
  PlayCircle,
  CheckCircle2,
  ArrowRight,
  Check,
  Loader2,
  FileText,
  GraduationCap,
  Inbox,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useSecretariaKanban,
  type KanbanRequest,
  type KanbanStatus,
} from "@/hooks/useSecretariaKanban";
import AttendanceModal from "@/components/secretaria/AttendanceModal";
import type { CounterFilter } from "./SecretaryCounters";

const COLUMNS = [
  {
    id: "aberto" as KanbanStatus,
    title: "A Fazer",
    icon: Clock,
    accent: "bg-amber-500",
    iconClass: "bg-amber-50 text-amber-600",
    next: "em_andamento" as KanbanStatus,
  },
  {
    id: "em_andamento" as KanbanStatus,
    title: "Em Andamento",
    icon: PlayCircle,
    accent: "bg-blue-500",
    iconClass: "bg-blue-50 text-blue-600",
    next: "concluido" as KanbanStatus,
  },
  {
    id: "concluido" as KanbanStatus,
    title: "Concluído (hoje)",
    icon: CheckCircle2,
    accent: "bg-emerald-500",
    iconClass: "bg-emerald-50 text-emerald-600",
    next: null as KanbanStatus | null,
  },
] as const;

const PRIORITY_BORDER: Record<string, string> = {
  alta: "border-l-destructive",
  media: "border-l-amber-500",
  baixa: "border-l-emerald-500",
};

const PRIORITY_DOT: Record<string, string> = {
  alta: "bg-destructive",
  media: "bg-amber-500",
  baixa: "bg-emerald-500",
};

const PRIORITY_LABEL: Record<string, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

/** Formata o nome do documento ("rg" → "RG", "certidao_nascimento" → "Certidão de Nascimento") */
const DOC_LABELS: Record<string, string> = {
  rg: "RG",
  cpf: "CPF",
  certidao_nascimento: "Certidão de Nascimento",
  comprovante_residencia: "Comprovante de Residência",
  historico_escolar: "Histórico Escolar",
  foto_3x4: "Foto 3x4",
};
export const formatDocType = (t?: string | null) => {
  if (!t) return "";
  return DOC_LABELS[t] ?? t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

interface Props {
  filter?: CounterFilter;
}

const SecretaryKanban = ({ filter = "all" }: Props) => {
  const { requests, loading, updateStatus } = useSecretariaKanban();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<KanbanRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
    all: "Todas as demandas ativas",
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

  const openAttendance = (item: KanbanRequest) => {
    setSelected(item);
    setModalOpen(true);
  };

  const activeItem = activeId ? requests.find((r) => r.id === activeId) : null;

  return (
    <section className="bg-card border border-border/60 rounded-xl p-5 shadow-sm">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Fila Operacional</h3>
          <p className="text-xs text-muted-foreground">
            {filterLabel[filter]} • Clique em uma demanda para atender
          </p>
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
              onCardClick={openAttendance}
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

      <AttendanceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        request={selected}
      />
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
        "relative bg-card border border-border rounded-xl flex flex-col min-h-[420px] overflow-hidden transition-colors",
        isOver && "ring-2 ring-ring/30"
      )}
    >
      <span className={cn("absolute top-0 left-0 right-0 h-[3px]", column.accent)} />
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center",
              column.iconClass
            )}
          >
            <Icon className="w-3.5 h-3.5" />
          </span>
          <h4 className="text-[13px] font-semibold text-foreground">{column.title}</h4>
        </div>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {items.length}
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-2 px-3 pb-3">
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-8 gap-2">
            <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center">
              <Inbox className="w-4 h-4 text-muted-foreground/60" />
            </div>
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

const cardTitle = (item: KanbanRequest) => {
  // Se for documento, prioriza "Documento pendente — <tipo>"
  if (item.document_type) {
    return `Documento pendente — ${formatDocType(item.document_type)}`;
  }
  return item.title;
};

const KanbanCard = ({ item, nextStatus, onAdvance, onClickCard }: CardProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
  });

  const downRef = useRef<{ x: number; y: number } | null>(null);

  const turmaLabel = [item.student_grade, item.student_class].filter(Boolean).join(" ");

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
      {/* Linha 1: tipo + título do documento */}
      <p className="text-sm font-semibold text-foreground leading-snug pr-12 flex items-start gap-1.5">
        {item.document_type && (
          <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
        )}
        <span className="line-clamp-2">{cardTitle(item)}</span>
      </p>

      {/* Linha 2: aluno • turma */}
      {item.student_name && (
        <p className="text-[12px] text-foreground/80 mt-1 truncate flex items-center gap-1">
          <span className="font-medium truncate">{item.student_name}</span>
          {turmaLabel && (
            <>
              <span className="text-muted-foreground">•</span>
              <GraduationCap className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground truncate">{turmaLabel}</span>
            </>
          )}
        </p>
      )}

      {/* Linha 3: tempo • prioridade */}
      <div className="flex items-center justify-between mt-1.5 gap-2">
        <span className="text-[11px] text-muted-foreground truncate">
          Aberto{" "}
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
    <p className="text-sm font-semibold text-foreground truncate">
      {cardTitle(item)}
    </p>
    {item.student_name && (
      <p className="text-[12px] text-muted-foreground truncate">
        {item.student_name}
      </p>
    )}
    <div className="flex items-center justify-between mt-1.5 gap-2">
      <span className="text-[11px] text-muted-foreground truncate">
        Aberto{" "}
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

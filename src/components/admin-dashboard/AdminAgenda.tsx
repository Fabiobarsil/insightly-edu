import { useState } from "react";
import { CalendarDays, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type EventType = "aula" | "reuniao" | "outro";

interface AgendaItem {
  id: string;
  time: string;
  title: string;
  type: EventType;
}

const TYPE_STYLES: Record<EventType, string> = {
  aula: "border-l-secondary bg-secondary/5",
  reuniao: "border-l-warning bg-warning/5",
  outro: "border-l-muted-foreground bg-muted/30",
};

const TYPE_LABEL: Record<EventType, string> = {
  aula: "Aula",
  reuniao: "Reunião",
  outro: "Outro",
};

const TYPE_BADGE: Record<EventType, string> = {
  aula: "bg-secondary/15 text-secondary",
  reuniao: "bg-warning/15 text-warning-foreground",
  outro: "bg-muted text-muted-foreground",
};

const initialItems: AgendaItem[] = [
  { id: "1", time: "07:30", title: "Turma 6A — Português", type: "aula" },
  { id: "2", time: "09:00", title: "Reunião Pedagógica", type: "reuniao" },
  { id: "3", time: "10:30", title: "Turma 8B — Revisão", type: "aula" },
  { id: "4", time: "14:00", title: "Reunião com Responsável", type: "reuniao" },
];

const AdminAgenda = () => {
  const [items, setItems] = useState<AgendaItem[]>(initialItems);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ time: "", title: "", type: "aula" as EventType });

  const handleAdd = () => {
    if (!form.time || !form.title.trim()) { toast.error("Preencha horário e título"); return; }
    const newItem: AgendaItem = { id: Date.now().toString(), ...form };
    setItems((prev) => [...prev, newItem].sort((a, b) => a.time.localeCompare(b.time)));
    setForm({ time: "", title: "", type: "aula" });
    setAdding(false);
    toast.success("Item adicionado à agenda");
  };

  const handleEdit = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setForm({ time: item.time, title: item.title, type: item.type });
    setEditingId(id);
  };

  const handleSaveEdit = () => {
    if (!form.time || !form.title.trim()) { toast.error("Preencha horário e título"); return; }
    setItems((prev) => prev.map((i) => i.id === editingId ? { ...i, ...form } : i).sort((a, b) => a.time.localeCompare(b.time)));
    setEditingId(null);
    setForm({ time: "", title: "", type: "aula" });
    toast.success("Item atualizado");
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast("Item removido");
  };

  const isFormOpen = adding || editingId;

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Minha Agenda
        </h3>
        {!isFormOpen && (
          <button onClick={() => { setAdding(true); setForm({ time: "", title: "", type: "aula" }); }} className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </button>
        )}
      </div>

      {/* Inline form */}
      {isFormOpen && (
        <div className="flex flex-col gap-2 mb-3 p-3 rounded-xl border border-border/60 bg-muted/20">
          <div className="flex gap-2">
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-24 text-xs px-2 py-1.5 rounded-lg border border-border bg-background text-foreground" />
            <input type="text" placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-border bg-background text-foreground" />
          </div>
          <div className="flex items-center justify-between">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as EventType })} className="text-xs px-2 py-1.5 rounded-lg border border-border bg-background text-foreground">
              <option value="aula">Aula</option>
              <option value="reuniao">Reunião</option>
              <option value="outro">Outro</option>
            </select>
            <div className="flex gap-1.5">
              <button onClick={() => { setAdding(false); setEditingId(null); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
              <button onClick={editingId ? handleSaveEdit : handleAdd} className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"><Check className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 flex-1 overflow-y-auto max-h-[300px] pr-1">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">Nenhum evento na agenda</p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 border-l-[3px] transition-all hover:shadow-sm group",
              TYPE_STYLES[item.type]
            )}
          >
            <span className="text-xs font-mono font-semibold text-muted-foreground whitespace-nowrap w-10">{item.time}</span>
            <p className="flex-1 text-sm font-medium text-foreground truncate">{item.title}</p>
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap", TYPE_BADGE[item.type])}>
              {TYPE_LABEL[item.type]}
            </span>
            <div className="hidden group-hover:flex items-center gap-0.5 animate-in fade-in-0 duration-200">
              <button onClick={() => handleEdit(item.id)} className="p-1 rounded hover:bg-muted text-muted-foreground"><Pencil className="h-3 w-3" /></button>
              <button onClick={() => handleRemove(item.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAgenda;

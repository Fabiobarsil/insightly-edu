import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";

const DAYS = [
  { label: "Seg", date: 31 },
  { label: "Ter", date: 1 },
  { label: "Qua", date: 2 },
  { label: "Qui", date: 3 },
  { label: "Sex", date: 4 },
  { label: "Sáb", date: 5 },
  { label: "Dom", date: 6 },
];

type EventType = "class" | "meeting" | "neutral";

interface AgendaEvent {
  time: string;
  title: string;
  subtitle: string;
  type: EventType;
}

const EVENTS: AgendaEvent[] = [
  { time: "07:30", title: "Turma 6A — Português", subtitle: "Sala 12", type: "class" },
  { time: "09:00", title: "Reunião Pedagógica", subtitle: "Sala de Reuniões", type: "meeting" },
  { time: "10:30", title: "Turma 8B — Revisão", subtitle: "Sala 08", type: "class" },
  { time: "14:00", title: "Reunião com Responsável", subtitle: "Secretaria", type: "meeting" },
  { time: "15:30", title: "Turma 9A — Ciências", subtitle: "Lab 02", type: "class" },
];

const typeStyles: Record<EventType, string> = {
  class: "bg-green-50 border-l-4 border-l-green-500 text-green-800",
  meeting: "bg-yellow-50 border-l-4 border-l-yellow-500 text-yellow-800",
  neutral: "bg-muted border-l-4 border-l-muted-foreground/30 text-muted-foreground",
};

const typeBadge: Record<EventType, string> = {
  class: "bg-green-100 text-green-700",
  meeting: "bg-yellow-100 text-yellow-700",
  neutral: "bg-muted text-muted-foreground",
};

const Agenda = () => {
  const [activeDay, setActiveDay] = useState(2);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Minha Agenda
        </CardTitle>
        <button
          className="text-xs font-medium text-primary hover:underline transition-colors"
          onClick={() => toast.info("Abrindo agenda completa...")}
        >
          Ver tudo
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Selector */}
        <div className="flex items-center justify-between gap-1">
          {DAYS.map((day, i) => (
            <button
              key={i}
              onClick={() => setActiveDay(i)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs transition-all ${
                activeDay === i
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <span>{day.label}</span>
              <span className="text-[11px]">{day.date}</span>
            </button>
          ))}
        </div>

        {/* Event List */}
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {EVENTS.map((event, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-all hover:shadow-sm cursor-pointer ${typeStyles[event.type]}`}
              onClick={() => toast.info(`Detalhes: ${event.title}`)}
            >
              <span className="text-xs font-mono font-semibold mt-0.5 whitespace-nowrap opacity-70">
                {event.time}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight truncate">{event.title}</p>
                <p className="text-xs opacity-70 truncate">{event.subtitle}</p>
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${typeBadge[event.type]}`}>
                {event.type === "class" ? "Aula" : event.type === "meeting" ? "Reunião" : "Outro"}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom Button */}
        <Button
          variant="outline"
          className="w-full text-xs"
          onClick={() => toast.info("Exibindo todos os próximos eventos...")}
        >
          Todos os próximos eventos
        </Button>
      </CardContent>
    </Card>
  );
};

export default Agenda;

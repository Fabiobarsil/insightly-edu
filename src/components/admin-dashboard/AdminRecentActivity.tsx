import { UserPlus, PenLine, Upload, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  { icon: UserPlus, iconClass: "bg-secondary/10 text-secondary", text: "Aluno Pedro Silva adicionado à turma 3ºB", time: "Há 5 min" },
  { icon: PenLine, iconClass: "bg-primary/10 text-primary", text: "Notas de Matemática lançadas para 5ºC", time: "Há 12 min" },
  { icon: Upload, iconClass: "bg-purple-500/10 text-purple-600", text: "Documento RG enviado por Ana Clara — 2ºA", time: "Há 30 min" },
  { icon: Bell, iconClass: "bg-warning/10 text-warning-foreground", text: "Notificação enviada aos responsáveis do 1ºD", time: "Há 1h" },
];

const AdminRecentActivity = () => (
  <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-sm h-full">
    <h3 className="text-sm font-bold text-foreground mb-4">Atividade Recente</h3>
    <div className="flex flex-col gap-2.5">
      {activities.map((a, i) => (
        <div key={i} className="flex items-center gap-3 p-2 -mx-1 rounded-xl hover:bg-accent/40 transition-colors cursor-default">
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", a.iconClass)}>
            <a.icon className="h-3.5 w-3.5" />
          </div>
          <p className="text-sm text-foreground flex-1 truncate">{a.text}</p>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">{a.time}</span>
        </div>
      ))}
    </div>
  </div>
);

export default AdminRecentActivity;

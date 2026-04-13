import { useNavigate } from "react-router-dom";
import { Calendar, Search, FileText, Users, ScrollText, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  onDataRefresh: () => void;
}

const PENDING_COUNT = 6; // mock

const DashboardHeader = ({ selectedYear, onYearChange }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const shortcuts = [
    { icon: Calendar, label: "Agenda", action: () => navigate("/admin/dashboard") },
    { icon: FileText, label: "Documentos", action: () => navigate("/admin/documentos") },
    { icon: Users, label: "Contatos", action: () => navigate("/admin/alunos") },
    { icon: ScrollText, label: "Declarações", action: () => navigate("/admin/documentos-oficiais") },
  ];

  const scrollToPriorities = () => {
    const el = document.getElementById("priorities-section");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Year selector */}
      <Select value={String(selectedYear)} onValueChange={(v) => onYearChange(Number(v))}>
        <SelectTrigger className="w-[120px] h-9 rounded-xl border-border/60 bg-card shadow-sm text-sm">
          <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Global search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar aluno, responsável..."
          className="pl-8 h-9 w-[220px] rounded-xl border-border/60 bg-card shadow-sm text-sm max-[640px]:w-[160px]"
        />
      </div>

      {/* Quick shortcuts */}
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-1">
          {shortcuts.map((s) => (
            <Tooltip key={s.label}>
              <TooltipTrigger asChild>
                <button
                  onClick={s.action}
                  className="h-9 w-9 rounded-xl border border-border/60 bg-card shadow-sm flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                >
                  <s.icon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">{s.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      {/* Pending indicator */}
      <button
        onClick={scrollToPriorities}
        className="h-9 px-3 rounded-xl border border-destructive/30 bg-destructive/5 flex items-center gap-1.5 text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Bell className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold">{PENDING_COUNT} pendências</span>
      </button>
    </div>
  );
};

export default DashboardHeader;
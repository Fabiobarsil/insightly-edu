import { useNavigate } from "react-router-dom";
import { Calendar, Bell, Send } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";

interface DashboardHeaderProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  onDataRefresh: () => void;
}

const DashboardHeader = (_props: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const { schoolId } = useSchoolId();

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pending-count", schoolId],
    queryFn: async () => {
      if (!schoolId) return 0;
      const { count } = await supabase
        .from("secretary_requests")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("status", "aberto");
      return count || 0;
    },
    enabled: !!schoolId,
  });

  const scrollToAgenda = () => {
    const el = document.getElementById("agenda-section");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToPriorities = () => {
    const el = document.getElementById("priorities-section");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const shortcuts = [
    { icon: Calendar, label: "Agenda", action: scrollToAgenda },
    { icon: Send, label: "Comunicação", action: () => navigate("/admin/comunicacao") },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2.5">
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
        <span className="text-xs font-semibold">{pendingCount} pendência{pendingCount !== 1 ? "s" : ""}</span>
      </button>
    </div>
  );
};

export default DashboardHeader;

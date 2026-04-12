import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface Props {
  avgFrequency: number;
  avgGrade: number;
  pendingCount: number;
}

const AdminHealthScore = ({ avgFrequency, avgGrade, pendingCount }: Props) => {
  const notaNorm = Math.min((avgGrade / 10) * 100, 100);
  const freqNorm = Math.min(avgFrequency, 100);
  const pendNorm = Math.max(100 - pendingCount * 3, 0);
  const percentage = Math.round(notaNorm * 0.5 + freqNorm * 0.3 + pendNorm * 0.2);

  const label = percentage >= 80 ? "Bom" : percentage >= 60 ? "Regular" : "Atenção";
  const color = percentage >= 80 ? "hsl(var(--secondary))" : percentage >= 60 ? "hsl(var(--warning))" : "hsl(var(--destructive))";

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-bold text-foreground">Saúde da Escola</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px] text-xs">
            Score = (Notas × 0.5) + (Frequência × 0.3) + (Pendências × 0.2)
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-5 flex-1">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${percentage}, 100`} strokeLinecap="round" className="transition-all duration-700 ease-out" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">{percentage}</span>
        </div>
        <div>
          <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full mb-2" style={{ backgroundColor: `${color}20`, color }}>{label}</span>
          <p className="text-xs text-muted-foreground">Frequência, desempenho e pendências.</p>
          <div className="flex gap-3 mt-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <span className="text-[11px] text-muted-foreground">Freq: {avgFrequency}%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[11px] text-muted-foreground">Notas: {avgGrade.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHealthScore;

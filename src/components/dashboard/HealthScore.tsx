import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const HealthScore = () => {
  const score = "Bom";
  const percentage = 78;

  return (
    <div className="bg-card border border-border/60 rounded-xl p-6 certus-shadow">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-bold text-primary">Saúde da Escola</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-muted hover:text-primary transition-colors">
              <i className="ri-question-line text-xs" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px] text-xs">
            Baseado em frequência, desempenho acadêmico e pendências administrativas.
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-center gap-5">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="hsl(214,32%,91%)"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#22C55E"
              strokeWidth="3"
              strokeDasharray={`${percentage}, 100`}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-primary">
            {percentage}
          </span>
        </div>
        <div>
          <span className="inline-block bg-secondary/10 text-secondary text-xs font-bold px-3 py-1 rounded-full mb-2">
            {score}
          </span>
          <p className="text-xs text-muted">
            Frequência, desempenho e pendências administrativas.
          </p>
          <div className="flex gap-3 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <span className="text-[11px] text-muted">Frequência: 94%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[11px] text-muted">Notas: 6.9</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthScore;

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const HealthScore = () => {
  const [avgFreq, setAvgFreq] = useState(0);
  const [avgNota, setAvgNota] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [attRes, perfRes] = await Promise.all([
        supabase.from("attendance").select("status"),
        supabase.from("vw_student_performance").select("media"),
      ]);

      const att = attRes.data ?? [];
      const present = att.filter((a) => a.status === "presente").length;
      const freq = att.length > 0 ? (present / att.length) * 100 : 0;

      const perf = perfRes.data ?? [];
      const withMedia = perf.filter((s) => s.media != null);
      const nota = withMedia.length > 0 ? withMedia.reduce((a, s) => a + (s.media ?? 0), 0) / withMedia.length : 0;

      setAvgFreq(freq);
      setAvgNota(nota);
      setLoading(false);
    };
    fetch();
  }, []);

  // score = (nota * 0.7) + (frequência * 0.3)  — normalized to 0-100
  const notaNorm = Math.min((avgNota / 10) * 100, 100);
  const freqNorm = Math.min(avgFreq, 100);
  const percentage = loading ? 0 : Math.round(notaNorm * 0.7 + freqNorm * 0.3);
  const score = percentage >= 80 ? "Bom" : percentage >= 60 ? "Regular" : "Atenção";
  const scoreColor = percentage >= 80 ? "#22C55E" : percentage >= 60 ? "#F59E0B" : "#EF4444";

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
            Score = (Nota × 0.7) + (Frequência × 0.3). Baseado em dados reais.
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
              stroke={scoreColor}
              strokeWidth="3"
              strokeDasharray={`${percentage}, 100`}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-primary">
            {loading ? "..." : percentage}
          </span>
        </div>
        <div>
          <span
            className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-2"
            style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}
          >
            {score}
          </span>
          <p className="text-xs text-muted">
            Frequência, desempenho e pendências administrativas.
          </p>
          <div className="flex gap-3 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <span className="text-[11px] text-muted">Frequência: {loading ? "..." : `${avgFreq.toFixed(0)}%`}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[11px] text-muted">Notas: {loading ? "..." : avgNota.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthScore;

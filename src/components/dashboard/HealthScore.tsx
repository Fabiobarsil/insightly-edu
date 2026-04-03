const HealthScore = () => {
  const score = "Bom";
  const percentage = 78;

  return (
    <div className="bg-card border border-border/60 rounded-xl p-6 certus-shadow">
      <h3 className="text-sm font-bold text-primary mb-4">Saúde da Escola</h3>
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
            Baseado em frequência, desempenho acadêmico e pendências administrativas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HealthScore;

const Topbar = () => (
  <header className="sticky top-0 bg-card border-b border-border/60 px-8 py-5 flex items-center justify-between z-[5] max-[900px]:px-5 max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-4">
    <div>
      <div className="text-xs text-muted flex items-center gap-2 mb-1.5 flex-wrap">
        <span>Certus Edu</span>
        <i className="ri-arrow-right-s-line text-[10px]" />
        <span>Dashboard</span>
      </div>
      <h2 className="text-2xl font-bold text-primary">Dashboard</h2>
    </div>
    <div className="flex items-center gap-3">
      <span className="bg-accent text-muted text-xs px-3 py-2 rounded-full font-semibold">
        Ano Letivo 2024
      </span>
      <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-[12px] font-bold text-sm">
        <i className="ri-add-line" />
        Novo Aluno
      </button>
    </div>
  </header>
);

export default Topbar;

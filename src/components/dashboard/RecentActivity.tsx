const activities = [
  { icon: "ri-user-add-line", iconClass: "bg-secondary/10 text-secondary", text: "Aluno Pedro Silva adicionado à turma 3ºB", time: "Há 5 min", timeAgo: 5 },
  { icon: "ri-pencil-ruler-line", iconClass: "bg-blue-50 text-blue-600", text: "Notas de Matemática lançadas para 5ºC", time: "Há 12 min", timeAgo: 12 },
  { icon: "ri-upload-2-line", iconClass: "bg-purple-50 text-purple-600", text: "Documento RG enviado por Ana Clara — 2ºA", time: "Há 30 min", timeAgo: 30 },
  { icon: "ri-notification-3-line", iconClass: "bg-amber-50 text-amber-600", text: "Notificação enviada aos responsáveis do 1ºD", time: "Há 1h", timeAgo: 60 },
];

const RecentActivity = () => (
  <div className="bg-card border border-border/60 rounded-xl p-6 certus-shadow">
    <h3 className="text-sm font-bold text-primary mb-4">Atividade Recente</h3>
    <div className="flex flex-col gap-3">
      {activities.map((a, i) => (
        <div key={i} className="flex items-center gap-3 p-2 -mx-2 rounded-[10px] hover:bg-accent/50 transition-colors duration-200 cursor-default">
          <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center text-sm shrink-0 ${a.iconClass}`}>
            <i className={a.icon} />
          </div>
          <p className="text-sm text-foreground flex-1">{a.text}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            <i className="ri-time-line text-[11px] text-muted/60" />
            <span className="text-[11px] text-muted whitespace-nowrap">{a.time}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default RecentActivity;

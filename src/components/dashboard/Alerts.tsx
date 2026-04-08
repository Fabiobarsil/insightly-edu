import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface AlertData {
  criticalCount: number;
  criticalStudents: Array<{ full_name: string | null; id: string | null }>;
  pendingDocsCount: number;
  lowPerfCount: number;
}

const Alerts = () => {
  const [data, setData] = useState<AlertData>({ criticalCount: 0, criticalStudents: [], pendingDocsCount: 0, lowPerfCount: 0 });

  useEffect(() => {
    const fetch = async () => {
      const [perfRes, docsRes] = await Promise.all([
        supabase.from("vw_student_performance").select("*"),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("status", "pendente"),
      ]);

      const perf = perfRes.data ?? [];
      const critical = perf.filter((s) => s.status_frequencia === "CRITICO");
      const lowPerf = perf.filter((s) => s.status_nota === "BAIXO DESEMPENHO");

      setData({
        criticalCount: critical.length,
        criticalStudents: critical.slice(0, 3),
        pendingDocsCount: docsRes.count ?? 0,
        lowPerfCount: lowPerf.length,
      });
    };
    fetch();
  }, []);

  const alerts = [
    {
      icon: "ri-error-warning-line",
      iconClass: "bg-red-50 text-red-500",
      title: "Frequência Crítica",
      desc: `${data.criticalCount} aluno(s) com frequência abaixo de 75%.`,
      severity: "Crítico",
      severityClass: "bg-red-50 text-red-600",
      details: data.criticalStudents.map((s) => s.full_name).join(", ") || "Nenhum",
      whatsappMsg: "frequência crítica",
    },
    {
      icon: "ri-file-damage-line",
      iconClass: "bg-amber-50 text-amber-600",
      title: "Documentos Pendentes",
      desc: `${data.pendingDocsCount} documento(s) aguardando envio ou aprovação.`,
      severity: "Atenção",
      severityClass: "bg-amber-50 text-amber-700",
      details: "",
      whatsappMsg: "documentos pendentes",
    },
    {
      icon: "ri-line-chart-line",
      iconClass: "bg-blue-50 text-blue-600",
      title: "Desempenho em Queda",
      desc: `${data.lowPerfCount} aluno(s) com baixo desempenho acadêmico.`,
      severity: data.lowPerfCount > 0 ? "Monitorar" : "OK",
      severityClass: data.lowPerfCount > 0 ? "bg-blue-50 text-blue-700" : "bg-secondary/10 text-secondary",
      details: "",
      whatsappMsg: "baixo desempenho acadêmico",
    },
  ];

  const handleWhatsApp = (alertTitle: string, msg: string) => {
    const text = encodeURIComponent(`Olá, identificamos situação de ${msg} na escola. Por favor entre em contato.`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-base font-bold text-primary">Alertas</h3>
      {alerts.map((alert, i) => (
        <div key={i} className="bg-card border border-border/60 rounded-xl p-5 certus-shadow transition-all duration-200 hover:shadow-md hover:border-border">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-lg shrink-0 ${alert.iconClass}`}>
              <i className={alert.icon} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold text-primary">{alert.title}</p>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${alert.severityClass}`}>
                  {alert.severity}
                </span>
              </div>
              <p className="text-xs text-muted mb-1.5">{alert.desc}</p>
              {alert.details && (
                <p className="text-[11px] text-muted/80 mb-1.5 truncate">
                  {alert.details}
                </p>
              )}
              <button
                onClick={() => handleWhatsApp(alert.title, alert.whatsappMsg)}
                className="text-[11px] font-semibold flex items-center gap-1 text-secondary hover:text-secondary/80 transition-colors"
              >
                <i className="ri-whatsapp-line" />
                Avisar Responsável
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Alerts;

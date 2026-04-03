import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const students = [
  "Ana Clara Silva", "Pedro Henrique Costa", "Maria Fernanda Souza", "Lucas Gabriel Lima",
  "Isabela Martins", "João Victor Santos", "Sofia Oliveira", "Gabriel Rodrigues",
  "Laura Pereira", "Matheus Almeida", "Valentina Dias", "Enzo Barbosa",
];

const AttendanceRecord = () => {
  const [attendance, setAttendance] = useState<Record<string, boolean>>(
    Object.fromEntries(students.map((s) => [s, Math.random() > 0.15]))
  );

  const toggle = (name: string) => {
    setAttendance((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const present = Object.values(attendance).filter(Boolean).length;

  return (
    <AppLayout title="Registrar Frequência" breadcrumbs={[{ label: "Frequência", href: "/frequencia" }, { label: "Registrar" }]}>
      <PageHeader title="Registrar Frequência" description="Marque a presença dos alunos" />

      <div className="flex items-center gap-3 flex-wrap mb-6">
        <select className="text-sm font-semibold bg-card border border-border/60 rounded-[12px] px-3 py-2 text-primary focus:outline-none focus:border-secondary">
          <option>5º Ano A</option><option>5º Ano B</option><option>3º Ano A</option>
        </select>
        <input type="date" defaultValue="2024-04-01" className="text-sm font-semibold bg-card border border-border/60 rounded-[12px] px-3 py-2 text-primary focus:outline-none focus:border-secondary" />
        <div className="ml-auto text-sm text-muted">
          <span className="font-bold text-secondary">{present}</span>/{students.length} presentes
        </div>
      </div>

      <div className="bg-card border border-border/60 rounded-xl certus-shadow">
        {students.map((s, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-border/20 last:border-0 hover:bg-accent/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-primary">
                {s.split(" ").map(n => n[0]).slice(0, 2).join("")}
              </div>
              <span className="text-sm font-medium text-primary">{s}</span>
            </div>
            <button onClick={() => toggle(s)} className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-colors",
              attendance[s] ? "bg-secondary/15 text-secondary" : "bg-destructive/15 text-destructive"
            )}>
              {attendance[s] ? "Presente" : "Falta"}
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-4 gap-3">
        <Link to="/frequencia/consulta" className="px-4 py-2.5 rounded-[14px] border border-border text-sm font-bold text-muted hover:bg-accent transition-colors">Consultar</Link>
        <button onClick={() => toast.success("Frequência registrada!")} className="px-5 py-2.5 rounded-[14px] bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/90 transition-colors">
          <i className="ri-check-line mr-1" /> Salvar
        </button>
      </div>
    </AppLayout>
  );
};

export default AttendanceRecord;

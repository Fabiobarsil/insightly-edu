import { useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const students = [
  "Ana Clara Silva", "Pedro Henrique Costa", "Maria Fernanda Souza", "Lucas Gabriel Lima",
  "Isabela Martins", "João Victor Santos", "Sofia Oliveira", "Gabriel Rodrigues",
  "Laura Pereira", "Matheus Almeida", "Valentina Dias", "Enzo Barbosa",
];

const subjects = [
  { value: "port", label: "Português" }, { value: "mat", label: "Matemática" },
  { value: "cien", label: "Ciências" }, { value: "hist", label: "História" },
];

const bimestres = [
  { value: "1", label: "1º Bimestre" }, { value: "2", label: "2º Bimestre" },
  { value: "3", label: "3º Bimestre" }, { value: "4", label: "4º Bimestre" },
];

const GradeEntry = () => {
  const [serie, setSerie] = useState("5");
  const [turma, setTurma] = useState("A");
  const [disciplina, setDisciplina] = useState("port");
  const [bimestre, setBimestre] = useState("1");

  return (
    <AppLayout title="Lançar Notas" breadcrumbs={[{ label: "Notas", href: "/notas" }, { label: "Lançar" }]}>
      <PageHeader title="Lançamento de Notas" description="Selecione a turma e disciplina para lançar as notas" />

      <div className="flex items-center gap-3 flex-wrap mb-6">
        <select value={turma} onChange={(e) => setTurma(e.target.value)} className="text-sm font-semibold bg-card border border-border/60 rounded-[12px] px-3 py-2 text-primary focus:outline-none focus:border-secondary transition-colors">
          <option value="5A">5º Ano A</option>
          <option value="5B">5º Ano B</option>
          <option value="3A">3º Ano A</option>
        </select>
        <select value={disciplina} onChange={(e) => setDisciplina(e.target.value)} className="text-sm font-semibold bg-card border border-border/60 rounded-[12px] px-3 py-2 text-primary focus:outline-none focus:border-secondary transition-colors">
          {subjects.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={bimestre} onChange={(e) => setBimestre(e.target.value)} className="text-sm font-semibold bg-card border border-border/60 rounded-[12px] px-3 py-2 text-primary focus:outline-none focus:border-secondary transition-colors">
          {bimestres.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
      </div>

      <div className="bg-card border border-border/60 rounded-xl certus-shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">Aluno</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-muted uppercase">Prova</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-muted uppercase">Trabalho</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-muted uppercase">Participação</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-muted uppercase">Média</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => {
              const p = (7 + Math.random() * 3).toFixed(1);
              const t = (6 + Math.random() * 4).toFixed(1);
              const part = (7 + Math.random() * 3).toFixed(1);
              const avg = ((+p + +t + +part) / 3).toFixed(1);
              return (
                <tr key={i} className="border-b border-border/20 last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-primary">{s}</td>
                  <td className="px-4 py-2 text-center"><input defaultValue={p} className="w-16 text-center border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-secondary" /></td>
                  <td className="px-4 py-2 text-center"><input defaultValue={t} className="w-16 text-center border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-secondary" /></td>
                  <td className="px-4 py-2 text-center"><input defaultValue={part} className="w-16 text-center border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-secondary" /></td>
                  <td className={cn("px-4 py-3 text-center font-bold", +avg < 7 ? "text-destructive" : "text-secondary")}>{avg}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4 gap-3">
        <Link to="/notas/historico" className="px-4 py-2.5 rounded-[14px] border border-border text-sm font-bold text-muted hover:bg-accent transition-colors">
          Ver Histórico
        </Link>
        <button onClick={() => toast.success("Notas salvas com sucesso!")} className="px-5 py-2.5 rounded-[14px] bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/90 transition-colors">
          <i className="ri-check-line mr-1" /> Salvar Notas
        </button>
      </div>
    </AppLayout>
  );
};

export default GradeEntry;

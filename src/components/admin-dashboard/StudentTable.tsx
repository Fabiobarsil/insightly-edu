import { cn } from "@/lib/utils";

interface StudentRow {
  name: string;
  grade: string;
  status: "aprovado" | "reprovado" | "pendente";
}

const BADGE: Record<string, string> = {
  aprovado: "bg-secondary/15 text-secondary",
  reprovado: "bg-destructive/15 text-destructive",
  pendente: "bg-warning/15 text-warning-foreground",
};

const LABEL: Record<string, string> = {
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  pendente: "Pendente",
};

const mockStudents: StudentRow[] = [
  { name: "Ana Beatriz Silva", grade: "3º Ano", status: "aprovado" },
  { name: "Carlos Eduardo Souza", grade: "5º Ano", status: "aprovado" },
  { name: "Mariana Oliveira", grade: "2º Ano", status: "reprovado" },
  { name: "Lucas Ferreira", grade: "4º Ano", status: "pendente" },
  { name: "Juliana Costa", grade: "1º Ano", status: "aprovado" },
  { name: "Pedro Henrique Lima", grade: "3º Ano", status: "reprovado" },
  { name: "Beatriz Santos", grade: "5º Ano", status: "aprovado" },
  { name: "Gabriel Almeida", grade: "2º Ano", status: "pendente" },
];

const StudentTable = () => (
  <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-border/40">
      <h3 className="text-sm font-bold text-foreground">Alunos</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/30">
            <th className="text-left px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome</th>
            <th className="text-left px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Série</th>
            <th className="text-left px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Situação</th>
          </tr>
        </thead>
        <tbody>
          {mockStudents.map((s, i) => (
            <tr
              key={i}
              className="border-b border-border/20 transition-colors hover:bg-accent/40"
            >
              <td className="px-6 py-3.5 font-medium text-foreground">{s.name}</td>
              <td className="px-6 py-3.5 text-muted-foreground">{s.grade}</td>
              <td className="px-6 py-3.5">
                <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", BADGE[s.status])}>
                  {LABEL[s.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default StudentTable;

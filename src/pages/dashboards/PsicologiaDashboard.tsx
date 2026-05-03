import { useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const avisos = [
  { id: 1, titulo: "Reunião pedagógica", data: "05/05" , texto: "Alinhamento sobre acompanhamento socioemocional do 4º ano." },
  { id: 2, titulo: "Workshop pais e responsáveis", data: "12/05", texto: "Tema: ansiedade infantil no ambiente escolar." },
  { id: 3, titulo: "Triagem trimestral", data: "20/05", texto: "Iniciar avaliação dos alunos sinalizados pelos professores." },
];

const alunosMock = [
  { id: "1", nome: "Ana Beatriz Souza", turma: "4º A", serie: "4º ano" },
  { id: "2", nome: "Carlos Eduardo Lima", turma: "5º B", serie: "5º ano" },
  { id: "3", nome: "Júlia Mendes", turma: "3º A", serie: "3º ano" },
  { id: "4", nome: "Pedro Henrique Alves", turma: "4º A", serie: "4º ano" },
  { id: "5", nome: "Sofia Ribeiro", turma: "2º B", serie: "2º ano" },
];

const PsicologiaDashboard = () => {
  const [busca, setBusca] = useState("");
  const [turma, setTurma] = useState("todas");
  const [serie, setSerie] = useState("todas");

  const turmas = useMemo(() => Array.from(new Set(alunosMock.map(a => a.turma))), []);
  const series = useMemo(() => Array.from(new Set(alunosMock.map(a => a.serie))), []);

  const alunosFiltrados = alunosMock.filter(a => {
    const matchNome = a.nome.toLowerCase().includes(busca.toLowerCase());
    const matchTurma = turma === "todas" || a.turma === turma;
    const matchSerie = serie === "todas" || a.serie === serie;
    return matchNome && matchTurma && matchSerie;
  });

  return (
    <AppLayout title="Psicologia Infantil" breadcrumbs={[{ label: "Psicologia" }]}>
      <PageHeader
        title="Psicologia Infantil"
        description="Acompanhamento socioemocional e prontuário dos alunos."
      />

      {/* Quadro de Avisos */}
      <section className="bg-card border border-border/60 rounded-xl p-6 certus-shadow mb-6">
        <h2 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
          <i className="ri-megaphone-line text-base" /> Quadro de Avisos
        </h2>
        <ul className="divide-y divide-border/60">
          {avisos.map(a => (
            <li key={a.id} className="py-3 flex items-start gap-3">
              <span className="text-xs font-semibold text-secondary min-w-[44px]">{a.data}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{a.titulo}</p>
                <p className="text-sm text-muted-foreground">{a.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Busca de Alunos */}
      <section className="bg-card border border-border/60 rounded-xl p-6 certus-shadow mb-6">
        <h2 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
          <i className="ri-search-line text-base" /> Buscar Alunos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <Select value={turma} onValueChange={setTurma}>
            <SelectTrigger><SelectValue placeholder="Turma" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as turmas</SelectItem>
              {turmas.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={serie} onValueChange={setSerie}>
            <SelectTrigger><SelectValue placeholder="Série" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as séries</SelectItem>
              {series.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Lista de alunos */}
      <section className="bg-card border border-border/60 rounded-xl p-6 certus-shadow">
        <h2 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
          <i className="ri-team-line text-base" /> Alunos
        </h2>
        {alunosFiltrados.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nenhum aluno encontrado.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {alunosFiltrados.map(a => (
              <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{a.nome}</p>
                  <p className="text-xs text-muted-foreground">{a.turma} · {a.serie}</p>
                </div>
                <Button variant="outline" size="sm">
                  <i className="ri-folder-open-line mr-1" /> Abrir Prontuário
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppLayout>
  );
};

export default PsicologiaDashboard;

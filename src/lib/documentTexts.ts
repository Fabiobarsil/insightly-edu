export interface DocumentTextParams {
  student: { full_name: string; classes?: { name: string } | null };
  school?: { name: string } | null;
}

const currentYear = new Date().getFullYear();

export function getDocumentText(
  type: string,
  { student }: DocumentTextParams
): string {
  const nome = student.full_name;
  const turma = student.classes?.name ?? "—";
  const ano = String(currentYear);

  const texts: Record<string, string> = {
    matricula: `Declaramos, para os devidos fins, que o(a) aluno(a) ${nome}, encontra-se devidamente matriculado(a) nesta instituição de ensino, no ano letivo de ${ano}, cursando a turma ${turma}. A presente declaração é expedida a pedido do interessado para fins que se fizerem necessários.`,
    historico: `Certificamos que o(a) aluno(a) ${nome} cursou nesta instituição as disciplinas previstas na grade curricular, obtendo as médias e frequência conforme registros acadêmicos oficiais.`,
    boletim: `Apresentamos o desempenho escolar do(a) aluno(a) ${nome}, contendo notas e frequência por disciplina, conforme registros acadêmicos.`,
    transferencia: `Declaramos que o(a) aluno(a) ${nome} esteve regularmente matriculado(a) nesta instituição, estando apto(a) à transferência para outra unidade de ensino.`,
    frequencia: `Declaramos que o(a) aluno(a) ${nome} possui frequência regular nas atividades escolares.`,
    vaga: `Declaramos que há vaga disponível nesta instituição para matrícula do(a) aluno(a) ${nome}, na turma ${turma}.`,
  };

  return texts[type] ?? "";
}

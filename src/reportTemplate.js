export const reportTemplate = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório do Aluno</title>
<style>
body {
  font-family: Arial;
  padding: 40px;
  color: #2c2c2c;
}
.header {
  display: flex;
  border-bottom: 2px solid #1e3a5f;
  margin-bottom: 20px;
}
.logo {
  width: 80px;
  margin-right: 20px;
}
.title {
  text-align: center;
  font-size: 22px;
  margin: 20px 0;
}
.card {
  display: inline-block;
  width: 30%;
  padding: 10px;
  background: #f5f7fa;
  text-align: center;
}
.status-critical { color: red; }
.status-warning { color: orange; }
.status-good { color: green; }
</style>
</head>
<body>
<div class="header">
  <img src="{{school_logo}}" class="logo">
  <div>
    <strong>{{school_name}}</strong><br>
    CNPJ: {{school_cnpj}}<br>
    {{school_address}}<br>
    {{school_contact}}
  </div>
</div>
<h2 class="title">Relatório de Evolução do Aluno</h2>
<p><strong>Aluno:</strong> {{student_name}}</p>
<p><strong>Turma:</strong> {{class_name}}</p>
<div>
  <div class="card">Média<br><strong>{{avg}}</strong></div>
  <div class="card">Frequência<br><strong>{{freq}}%</strong></div>
  <div class="card">Status<br><strong class="{{status_class}}">{{status}}</strong></div>
</div>
<h3>Diagnóstico</h3>
<p>{{diagnosis}}</p>
<h3>Intervenções</h3>
{{interventions_list}}
<h3>Conclusão</h3>
<p>{{conclusion}}</p>
<p>Documento gerado em {{date}}</p>
</body>
</html>
`;
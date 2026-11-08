import { CoreState, displayDay, localDay } from './domain';
export function academyStudents(state: CoreState) {
  return state.students
    .filter((s) => !s.archivedOn)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}
const escape = (x: string) =>
  x.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
export function academyReportHtml(state: CoreState, date = localDay()) {
  const students = academyStudents(state);
  const weekly = students.reduce((sum, s) => sum + s.frequency, 0);
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>CORE - Relação de alunos para academia</title><style>
    @page{size:A4;margin:18mm 17mm}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#202020;margin:0;line-height:1.5}header{border-bottom:3px solid #a20100;padding-bottom:16px;margin-bottom:22px}.brand{font-weight:800;font-size:32px;color:#a20100;letter-spacing:-1px}.tag{font-size:10px;color:#666}h1{font-size:21px;margin:20px 0 7px}p{margin:5px 0}.meta{color:#555}.summary{background:#f3f3f3;padding:14px 16px;margin:20px 0;border-radius:8px}.summary span{display:inline-block;min-width:44%;vertical-align:top}.summary b{font-size:20px;display:block;color:#a20100}.summary small{font-size:11px}table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}th{background:#efefef;font-size:11px;text-transform:uppercase;letter-spacing:.4px}td,th{text-align:left;padding:10px 12px;border-bottom:1px solid #ddd;overflow-wrap:anywhere}tr{break-inside:avoid}th:first-child,td:first-child{width:10%;color:#666}th:last-child,td:last-child{width:28%;text-align:center}footer{margin-top:22px;color:#666;font-size:10px;break-inside:avoid}.empty{padding:20px 0;color:#555}
    </style></head><body><header><div class="brand">Core</div><div class="tag">Gestão para Personal Trainers</div><h1>Relação de alunos</h1><p><strong>${escape(state.profile.name || 'Personal Trainer')}</strong>${state.profile.cref ? ` | CREF ${escape(state.profile.cref)}` : ''}</p><p class="meta">Alunos ativos em ${displayDay(date)}</p></header>
    <div class="summary"><span><b>${students.length}</b><small>aluno${students.length === 1 ? '' : 's'} ativo${students.length === 1 ? '' : 's'}</small></span><span><b>${weekly}</b><small>atendimentos previstos por semana</small></span></div>
    ${students.length ? `<table><thead><tr><th>Nº</th><th>Aluno</th><th>Frequência semanal</th></tr></thead><tbody>${students.map((s, i) => `<tr><td>${i + 1}</td><td>${escape(s.name)}</td><td>${s.frequency}x por semana</td></tr>`).join('')}</tbody></table>` : '<p class="empty">Nenhum aluno ativo cadastrado.</p>'}
    <footer><p>Frequência informada pelo profissional conforme o atendimento contratado. Esta relação não é um registro de presenças.</p><p>Gerado pelo CORE em ${displayDay(date)}.</p></footer></body></html>`;
}

import { test, expect, Page } from '@playwright/test';

async function openCore(page: Page) {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Personal de teste');
  await page.getByRole('textbox', { name: 'CREF (opcional)', exact: true }).fill('12345-G/SC');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Editar meu perfil', exact: true })).toBeVisible();
}
async function addStudent(page: Page, name = 'Aluno de teste offline') {
  await page.getByRole('button', { name: 'Cadastrar aluno', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nome', exact: true }).fill(name);
  await page.getByRole('textbox', { name: 'Telefone com DDD', exact: true }).fill('11999990000');
  await page.getByRole('textbox', { name: 'Mensalidade (R$)', exact: true }).fill('400,00');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cadastrar aluno', exact: true })).toBeVisible();
}
const nav = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true }).last().click();

test('cadastro curto, controles de mais/menos e cabeçalho fixo em tela pequena', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openCore(page);
  await page.getByRole('button', { name: 'Cadastrar aluno', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Horário de início', exact: true })).toHaveCount(
    0,
  );
  await page.getByRole('button', { name: 'Aumentar vezes por semana', exact: true }).click();
  await expect(page.getByLabel('Vezes por semana: 4x', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Diminuir vezes por semana', exact: true }).click();
  await page.getByRole('button', { name: 'Diminuir dia do vencimento', exact: true }).click();
  await expect(page.getByLabel('Dia do vencimento: 4', { exact: true })).toBeVisible();
  const before = await page.getByTestId('sheet-header').boundingBox();
  await page.getByRole('button', { name: 'Mais dados (opcional)', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Observações (opcional)', exact: true })
    .fill('Teste de texto opcional');
  await page.getByTestId('sheet-scroll').evaluate((el) => (el.scrollTop = el.scrollHeight));
  const after = await page.getByTestId('sheet-header').boundingBox();
  expect(after?.y).toBe(before?.y);
  await expect(page.getByRole('button', { name: 'Salvar', exact: true })).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Cancelar edição', exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.screenshot({ path: testInfo.outputPath('cadastro-320.png') });
});

test('expediente com dois turnos, horários fixos separados e vagas sem conflitos', async ({
  page,
}, testInfo) => {
  await openCore(page);
  await addStudent(page);
  await nav(page, 'Ajustes');
  await page.getByRole('button', { name: 'Meus horários de trabalho', exact: true }).click();
  await page.getByRole('button', { name: 'Adicionar período', exact: true }).click();
  await page.getByRole('textbox', { name: 'Início do período', exact: true }).fill('15:00');
  await page.getByRole('textbox', { name: 'Fim do período', exact: true }).fill('20:00');
  await page.getByRole('button', { name: 'Adicionar período', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await nav(page, 'Alunos');
  await page
    .getByRole('button', { name: 'Abrir aluno Aluno de teste offline', exact: true })
    .click();
  await page.getByRole('button', { name: 'Organizar dias e horários', exact: true }).click();
  await page.getByRole('button', { name: 'Adicionar horário fixo', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await nav(page, 'Agenda');
  // A recurring Monday starts from today; navigate to the next Monday in the UI.
  const steps = await page.evaluate(() => (8 - new Date().getDay()) % 7);
  for (let i = 0; i < steps; i++)
    await page.getByRole('button', { name: 'Próximo dia', exact: true }).click();
  await expect(page.getByText('08:00', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Horários livres', exact: true }).click();
  await expect(page.getByText('06:00 às 08:00', { exact: true })).toBeVisible();
  await expect(page.getByText('09:00 às 11:00', { exact: true })).toBeVisible();
  await expect(page.getByText('15:00 às 20:00', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('vagas.png') });
  await page.getByRole('button', { name: 'Agendar às 09:00', exact: true }).click();
  await page.getByRole('button', { name: 'Aluno de teste offline', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByText('10:00 às 11:00', { exact: true })).toBeVisible();
  await page.reload();
  await nav(page, 'Ajustes');
  await page.getByRole('button', { name: 'Meus horários de trabalho', exact: true }).click();
  await expect(page.getByText('15:00 às 20:00', { exact: true })).toHaveCount(5);
});

test('relatório para academia mostra alunos e frequência sem mensalidade ou telefone', async ({
  page,
}) => {
  await openCore(page);
  await addStudent(page, 'Ana de teste');
  await addStudent(page, 'Bruno de teste');
  await nav(page, 'Relatórios');
  const popup = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Gerar PDF para academia', exact: true }).click();
  const report = await popup;
  await expect(report.getByText('Ana de teste', { exact: true })).toBeVisible();
  await expect(report.getByText('Bruno de teste', { exact: true })).toBeVisible();
  await expect(report.getByText('3x por semana', { exact: true })).toHaveCount(2);
  const text = await report.locator('body').innerText();
  expect(text).not.toContain('400,00');
  expect(text).not.toContain('99999');
  expect(text).toContain('Personal de teste');
});
test('cadastro, financeiro, pagamento e reabertura sem rede', async ({
  page,
  context,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openCore(page);
  await page.getByRole('button', { name: 'Cadastrar aluno', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Aluno de teste offline');
  await page.getByRole('textbox', { name: 'Telefone com DDD', exact: true }).fill('11999990000');
  await page.getByRole('textbox', { name: 'Mensalidade (R$)', exact: true }).fill('400,00');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByText(/Previsto no mês:.*1 aluno ativo/)).toBeVisible();
  await page.getByRole('button', { name: 'Financeiro', exact: true }).last().click();
  await page.getByRole('button', { name: 'Registrar pagamento', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByText('Pago', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Financeiro', exact: true }).last().click();
  await expect(page.getByText('Pago', { exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Desfazer pagamento', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Registrar pagamento', exact: true }),
  ).toBeVisible();
  await context.setOffline(false);
  await page.getByRole('button', { name: 'Alunos', exact: true }).click();
  await page
    .getByRole('button', { name: 'Abrir aluno Aluno de teste offline', exact: true })
    .click();
  await expect(page.getByText('(11) 99999-0000', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar aos alunos', exact: true }).click();
  await page.getByRole('button', { name: 'Agenda', exact: true }).click();
  await page.getByRole('button', { name: 'Agendar aula', exact: true }).click();
  await page.getByRole('button', { name: 'Aluno de teste offline', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByText('Agendada', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Agendar aula', exact: true }).click();
  await page.getByRole('button', { name: 'Aluno de teste offline', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(
    page.getByText('Este horário coincide com outro atendimento. Escolha um horário livre.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar edição', exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath('agenda.png') });
  expect(errors).toEqual([]);
});
test('backup exporta, restaura, preserva cópia anterior e rejeita dados inválidos', async ({
  page,
}) => {
  await openCore(page);
  await page.getByRole('button', { name: 'Ajustes', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar backup', exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^core-backup-/);
  const path = await file.path();
  const picker = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Restaurar backup', exact: true }).click();
  await (await picker).setFiles(path!);
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Fechar aviso', exact: true })).toContainText(
    'Backup restaurado neste aparelho.',
  );
  const recovery = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Exportar cópia anterior à restauração', exact: true })
    .click();
  expect((await recovery).suggestedFilename()).toMatch(/^core-antes-restauracao/);
  const invalid = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Restaurar backup', exact: true }).click();
  await (
    await invalid
  ).setFiles({ name: 'invalido.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  await expect(page.getByRole('button', { name: 'Fechar aviso', exact: true })).toContainText(
    'Este arquivo não é um backup do CORE offline.',
  );
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('core-personal-offline-v1')!).version,
    ),
  ).toBe(1);
});

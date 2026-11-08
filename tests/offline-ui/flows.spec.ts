import { test, expect } from '@playwright/test';
test('cadastro, financeiro, pagamento e reabertura sem rede', async ({
  page,
  context,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Novo aluno', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Aluno de teste offline');
  await page.getByRole('textbox', { name: 'Telefone com DDD', exact: true }).fill('11999990000');
  await page.getByRole('textbox', { name: 'Mensalidade (R$)', exact: true }).fill('400,00');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByText('1 aluno ativo', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Financeiro', exact: true }).click();
  await page.getByRole('button', { name: 'Registrar pagamento', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByText('Pago', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Financeiro', exact: true }).click();
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
  await page.getByRole('button', { name: 'Novo horário', exact: true }).click();
  await page.getByRole('button', { name: 'Aluno de teste offline', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByText('Agendado', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Novo horário', exact: true }).click();
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
  await page.goto('/');
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

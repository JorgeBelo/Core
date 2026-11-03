import { test, expect } from '@playwright/test';
import { fixture, login } from './fixtures';
test('access is gated and login validates missing fields', async ({ page }) => {
  await fixture(page);
  await page.goto('/students/new');
  await expect(page.getByRole('button', { name: 'Entrar no Core', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Entrar no Core', exact: true }).click();
  await expect(page.getByText('Informe seu e-mail e sua senha.')).toBeVisible();
});

for (const failure of [false, true]) {
  test(`password recovery closes the verified session (update failure: ${failure})`, async ({
    page,
  }) => {
    await fixture(page, { recoveryFailure: failure });
    await page.goto('/recover');
    await page
      .getByRole('textbox', { name: 'E-mail', exact: true })
      .fill('profissional@example.test');
    await page.getByRole('button', { name: 'Enviar código', exact: true }).click();
    await expect(
      page.getByText('Se a conta existir, enviaremos um código.', { exact: false }),
    ).toBeVisible();
    await page.getByRole('textbox', { name: 'Código do e-mail', exact: true }).fill('123456');
    await page
      .getByRole('textbox', { name: 'Nova senha', exact: true })
      .fill('new-password-for-tests');
    const logout = page.waitForRequest((r) => r.url().includes('/auth/v1/logout'));
    await page.getByRole('button', { name: 'Atualizar senha', exact: true }).click();
    await logout;
    await expect(
      page.getByText(
        failure
          ? 'Não foi possível concluir. Verifique o código, sua conexão ou solicite um novo envio.'
          : 'Senha atualizada. Volte para entrar.',
        { exact: true },
      ),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Voltar para entrar', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Entrar no Core', exact: true })).toBeVisible();
  });
}
test('professional creates, searches, edits and inactivates a student', async ({ page }) => {
  await fixture(page);
  await login(page);
  await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible();
  await page.getByRole('button', { name: 'Cadastrar aluno', exact: false }).click();
  await page.getByRole('button', { name: 'Salvar aluno', exact: true }).click();
  await expect(page.getByText('Revise os campos destacados antes de salvar.')).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Nome completo *', exact: true })
    .fill('Aluno funcional de teste');
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('aluno@example.test');
  await page.getByRole('button', { name: 'Salvar aluno', exact: true }).click();
  await expect(page.getByText('Cadastro salvo com sucesso.')).toBeVisible();
  await expect(page.getByText('Aluno funcional de teste', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Buscar aluno', exact: true }).fill('funcional');
  await expect(page.getByText('1 aluno(s) encontrado(s)')).toBeVisible();
  await page.getByRole('button', { name: 'Ver cadastro', exact: true }).click();
  await page.getByRole('radio', { name: 'Inativo', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(page.getByText('Presencial · Inativo')).toBeVisible();
  await page.getByRole('link', { name: 'Início', exact: true }).click();
  await expect(page.getByText('Aluno funcional de teste', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Minha conta', exact: true }).click();
  await page.getByRole('button', { name: 'Sair da conta', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Entrar no Core', exact: true })).toBeVisible();
});
test('student sees own registration and no professional navigation', async ({ page }) => {
  await fixture(page, { role: 'student' });
  await login(page);
  await expect(page.getByRole('heading', { name: 'Meu cadastro' })).toBeVisible();
  await expect(page.getByText('Aluno de teste', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Financeiro', exact: true })).toHaveCount(0);
});
test('unlinked user is blocked from workspace', async ({ page }) => {
  await fixture(page, { role: 'unlinked' });
  await login(page);
  await expect(page.getByRole('heading', { name: 'Acesso em preparação' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cadastrar aluno', exact: false })).toHaveCount(0);
});
test('network failure displays explicit error and retry', async ({ page }) => {
  await fixture(page, { failure: true });
  await login(page);
  await expect(page.getByText('Não foi possível concluir.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tentar novamente', exact: true })).toBeVisible();
});
test('responsive navigation and planned modules remain honest', async ({ page }, info) => {
  await fixture(page);
  await login(page);
  await page.getByRole('link', { name: 'Agenda', exact: true }).click();
  await expect(
    page.getByText('Etapa planejada · Fase 4. Este módulo ainda não está disponível.'),
  ).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    width: window.innerWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
  if (info.project.name === 'desktop') {
    await page.getByRole('button', { name: 'Recolher menu', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Expandir menu', exact: true })).toBeVisible();
  }
});

test('professional builds an exercise and explicitly approves a program', async ({
  page,
}, info) => {
  await fixture(page);
  await login(page);
  await page.getByRole('button', { name: 'Cadastrar aluno', exact: false }).click();
  await page
    .getByRole('textbox', { name: 'Nome completo *', exact: true })
    .fill('Aluno para treino de teste');
  await page.getByRole('button', { name: 'Salvar aluno', exact: true }).click();
  await expect(page.getByText('Cadastro salvo com sucesso.')).toBeVisible();
  await page.getByRole('link', { name: 'Treinos', exact: true }).click();
  await page.getByRole('button', { name: 'Biblioteca de exercícios', exact: true }).click();
  await page.getByRole('button', { name: 'Novo exercício', exact: false }).click();
  await page
    .getByRole('textbox', { name: 'Nome *', exact: true })
    .fill('Exercício autoral de teste');
  await page.getByRole('textbox', { name: 'Grupo muscular *', exact: true }).fill('Quadríceps');
  await page
    .getByRole('textbox', { name: 'Tags separadas por vírgula', exact: true })
    .fill('força, iniciante');
  await page.getByRole('button', { name: 'Salvar exercício', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Exercício autoral de teste', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Voltar para treinos', exact: true }).click();
  await page.getByRole('button', { name: 'Criar programa', exact: false }).click();
  await page
    .getByRole('textbox', { name: 'Nome do programa *', exact: true })
    .fill('Programa funcional de teste');
  await page.getByRole('button', { name: 'Escolher aluno', exact: true }).click();
  await page.getByRole('button', { name: 'Selecionar', exact: true }).click();
  await page.getByRole('button', { name: 'Adicionar exercício', exact: false }).click();
  await page.getByRole('button', { name: 'Selecionar', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  await expect(page.getByText('Rascunho salvo. Ainda não foi liberado ao aluno.')).toBeVisible();
  await page.getByRole('button', { name: 'Revisar e liberar ao aluno', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Aprovar esta prescrição?', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Aprovar e disponibilizar', exact: true }).click();
  await expect(
    page.getByText('Versão aprovada e liberada ao aluno.', { exact: true }),
  ).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    width: window.innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
  await page.screenshot({
    path: `work/qa-program-fixture-${info.project.name}.png`,
    fullPage: true,
  });
});

test('student executes an approved workout and sees actual performance history', async ({
  page,
}, info) => {
  await fixture(page, { role: 'student', trained: true });
  await login(page);
  await page.getByRole('tab', { name: 'Meu treino', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar Treino A', exact: true }).click();
  await page.getByRole('textbox', { name: 'Repetições — série 1', exact: true }).fill('12');
  await page.getByRole('textbox', { name: 'Carga em kg — série 1', exact: true }).fill('20');
  await page.getByRole('button', { name: 'Marcar série concluída', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Como foi o treino?', exact: true })
    .fill('Feedback de execução de teste');
  await page.getByRole('button', { name: 'Finalizar e enviar sessão', exact: true }).click();
  await expect(page.getByText('Sessão registrada com sucesso.', { exact: false })).toBeVisible();
  await page.getByRole('tab', { name: 'Evolução', exact: true }).click();
  await expect(page.getByText('12 rep. × 20 kg', { exact: true })).toBeVisible();
  await page.screenshot({
    path: `work/qa-execution-fixture-${info.project.name}.png`,
    fullPage: true,
  });
});

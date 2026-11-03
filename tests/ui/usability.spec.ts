import { test, expect } from '@playwright/test';
import { fixture, login } from './fixtures';
test('dashboard gives direct access to daily actions and has no horizontal overflow', async ({
  page,
}, info) => {
  await fixture(page);
  await login(page);
  await expect(page.getByRole('button', { name: 'Criar treino', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Meus alunos', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Financeiro', exact: true })).toBeVisible();
  await expect(page.getByText('O acompanhamento começa com conexão.', { exact: true })).toHaveCount(
    0,
  );
  await page.screenshot({
    path: `work/qa-dashboard-simple-${info.project.name}.png`,
    fullPage: true,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Criar treino', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Para quem é o treino?', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Séries', exact: true })).toHaveCount(0);
});

test('visual editor adds multiple exercises, separates workouts and keeps approval explicit', async ({
  page,
}, info) => {
  const state = await fixture(page);
  state.students.push({
    id: '30000000-0000-4000-8000-000000000001',
    professional_id: '20000000-0000-4000-8000-000000000001',
    full_name: 'Aluno visual de teste',
    email: '',
    status: 'active',
    weekly_frequency: 3,
    monthly_fee_cents: 35000,
  });
  for (let i = 1; i <= 3; i++)
    state.exercises.push({
      id: `40000000-0000-4000-8000-00000000000${i}`,
      name: ['Agachamento de teste', 'Remada de teste', 'Prancha de teste'][i - 1],
      muscle_group: ['Pernas', 'Costas', 'Abdômen'][i - 1],
      equipment: 'Equipamento de teste',
      archived: false,
      favorite: i === 3,
      instructions: '',
      video_url: '',
    });
  await login(page);
  await page.getByRole('button', { name: 'Criar treino', exact: true }).click();
  await page.getByRole('button', { name: 'Escolher aluno', exact: true }).click();
  await page.getByRole('button', { name: 'Selecionar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Escolher aluno', exact: true })).toBeHidden();
  await expect(page.getByRole('textbox', { name: 'Nome do programa *', exact: true })).toHaveValue(
    'Treino de Aluno',
  );
  await expect(page.getByRole('radio', { name: '3×', exact: true })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.getByRole('radio', { name: 'Divisão AB', exact: true }).click();
  await page.getByRole('button', { name: 'Montar exercícios →', exact: true }).click();
  await page.getByRole('button', { name: 'Adicionar exercícios', exact: false }).click();
  await page.getByRole('checkbox', { name: 'Agachamento de teste', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Remada de teste', exact: true }).click();
  await page.getByRole('button', { name: 'Adicionar 2 exercícios', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('textbox', { name: 'Séries', exact: true })).toHaveCount(1);
  await expect(page.getByRole('textbox', { name: 'RPE (opcional)', exact: true })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Repetições', exact: true }).fill('12');
  await page.getByRole('button', { name: 'Descer Agachamento de teste', exact: true }).click();
  await page.getByRole('tab', { name: 'Editar Treino B', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Ajustar Agachamento de teste', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Adicionar exercícios', exact: false }).click();
  await page.getByRole('radio', { name: '★ Favoritos', exact: true }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Agachamento de teste', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Prancha de teste', exact: true }).click();
  await page.getByRole('button', { name: 'Adicionar 1 exercício', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.getByRole('tab', { name: 'Editar Treino A', exact: true }).click();
  await page.screenshot({ path: `work/qa-editor-simple-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Revisar treino →', exact: true }).click();
  expect(state.programs).toHaveLength(0);
  await page.getByRole('button', { name: 'Salvar e liberar ao aluno', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Liberar este treino?', exact: true }),
  ).toBeVisible();
  expect(state.programs).toHaveLength(1);
  expect(state.versions).toHaveLength(0);
  await page.getByRole('button', { name: 'Confirmar e liberar', exact: true }).click();
  await expect(
    page.getByText('Versão aprovada e liberada ao aluno.', { exact: true }),
  ).toBeVisible();
  expect(state.versions).toHaveLength(1);
  expect(state.programs[0].draft_days[0].exercises[0].exercise_id).toBe(state.exercises[1].id);
  expect(state.programs[0].draft_days[0].exercises[1].repetitions).toBe('12');
  expect(state.programs[0].draft_days[1].exercises).toHaveLength(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('a missing exercise can be created inside the picker without losing the draft', async ({
  page,
}) => {
  const state = await fixture(page);
  state.students.push({
    id: '30000000-0000-4000-8000-000000000001',
    professional_id: '20000000-0000-4000-8000-000000000001',
    full_name: 'Aluno de teste',
    status: 'active',
    email: '',
  });
  await login(page);
  await page.getByRole('button', { name: 'Criar treino', exact: true }).click();
  await page.getByRole('button', { name: 'Escolher aluno', exact: true }).click();
  await page.getByRole('button', { name: 'Selecionar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Escolher aluno', exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Montar exercícios →', exact: true }).click();
  await page.getByRole('button', { name: 'Adicionar exercícios', exact: false }).click();
  await page.getByRole('button', { name: 'Cadastrar exercício', exact: false }).click();
  await page
    .getByRole('textbox', { name: 'Nome do novo exercício *', exact: true })
    .fill('Agachamento criado no editor');
  await page
    .getByRole('textbox', { name: 'Grupo muscular do novo exercício *', exact: true })
    .fill('Quadríceps');
  await page.getByRole('button', { name: 'Salvar exercício', exact: true }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Agachamento criado no editor', exact: true }),
  ).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Adicionar 1 exercício', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  await expect(
    page.getByText('Rascunho salvo. Ainda não foi liberado ao aluno.', { exact: true }),
  ).toBeVisible();
  expect(state.programs[0].name).toBe('Treino de Aluno');
  expect(state.programs[0].draft_days[0].exercises).toHaveLength(1);
});

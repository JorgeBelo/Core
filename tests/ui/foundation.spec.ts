import { test, expect, type Page } from '@playwright/test';
const pid = '20000000-0000-4000-8000-000000000001';
const uid = '10000000-0000-4000-8000-000000000001';
// Explicit UI fixtures only. Actual permissions are tested separately in database.test.ts.
async function fixture(
  page: Page,
  {
    role = 'professional',
    failure = false,
    recoveryFailure = false,
    trained = false,
  }: {
    role?: 'professional' | 'student' | 'unlinked';
    failure?: boolean;
    recoveryFailure?: boolean;
    trained?: boolean;
  } = {},
) {
  const students: any[] = [];
  const exercises: any[] = [];
  const programs: any[] = [];
  const versions: any[] = [];
  const sessions: any[] = [];
  if (role === 'student')
    students.push({
      id: '30000000-0000-4000-8000-000000000001',
      professional_id: pid,
      user_id: uid,
      full_name: 'Aluno de teste',
      email: 'aluno@example.test',
      goal: 'Objetivo de teste',
      status: 'active',
    });
  if (trained) {
    exercises.push({
      id: '40000000-0000-4000-8000-000000000001',
      name: 'Exercício de teste',
      muscle_group: 'Grupo de teste',
      equipment: '',
      instructions: 'Instrução de teste',
      video_url: '',
    });
    versions.push({
      id: '60000000-0000-4000-8000-000000000001',
      program_id: '70000000-0000-4000-8000-000000000001',
      student_id: students[0]?.id,
      revision: 1,
      published_at: new Date().toISOString(),
      snapshot: {
        name: 'Programa aprovado de teste',
        frequency: 3,
        duration_weeks: 8,
        notes: '',
        days: [
          {
            name: 'Treino A',
            exercises: [
              {
                ...exercises[0],
                exercise_id: exercises[0].id,
                sets: 1,
                repetitions: '10',
                rest_seconds: 60,
                load_kg: null,
                rpe: null,
                rir: null,
                tempo: '',
                notes: '',
              },
            ],
          },
        ],
      },
    });
  }
  await page.route('http://127.0.0.1:54329/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      method = req.method();
    if (method === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': '*',
        },
      });
      return;
    }
    let body: any = {};
    const headers: Record<string, string> = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'content-range',
      'Content-Type': 'application/json',
    };
    if (url.pathname === '/auth/v1/token' || url.pathname === '/auth/v1/verify')
      body = {
        access_token: 'ui-test-token',
        refresh_token: 'ui-test-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: uid,
          aud: 'authenticated',
          email: 'profissional@example.test',
          role: 'authenticated',
          app_metadata: { provider: 'email' },
          user_metadata: {},
          created_at: new Date().toISOString(),
        },
      };
    else if (url.pathname === '/auth/v1/logout') body = {};
    else if (url.pathname === '/auth/v1/user') {
      if (recoveryFailure) {
        await route.fulfill({
          status: 422,
          headers,
          body: JSON.stringify({ message: 'Explicit password update test failure' }),
        });
        return;
      }
      body = {
        id: uid,
        aud: 'authenticated',
        email: 'profissional@example.test',
        role: 'authenticated',
        app_metadata: {},
        user_metadata: {},
      };
    } else if (url.pathname.includes('/professionals'))
      body =
        role === 'professional'
          ? [{ id: pid, user_id: uid, display_name: 'Profissional de teste' }]
          : [];
    else if (url.pathname.includes('/rpc/publish_program')) {
      const input = req.postDataJSON();
      const p = programs.find((v) => v.id === input.p_program_id);
      const version = {
        id: '60000000-0000-4000-8000-000000000001',
        program_id: p.id,
        student_id: p.student_id,
        revision: 1,
        published_at: new Date().toISOString(),
        snapshot: {
          name: p.name,
          frequency: p.frequency,
          duration_weeks: p.duration_weeks,
          notes: p.notes,
          days: p.draft_days.map((d: any) => ({
            ...d,
            exercises: d.exercises.map((e: any) => ({
              ...exercises.find((x) => x.id === e.exercise_id),
              ...e,
            })),
          })),
        },
      };
      versions.push(version);
      body = version.id;
    } else if (url.pathname.includes('/rpc/record_training_session')) {
      const input = req.postDataJSON();
      const row = {
        id: '80000000-0000-4000-8000-000000000001',
        version_id: input.p_version_id,
        workout_index: input.p_workout_index,
        results: input.p_results,
        feedback: input.p_feedback,
        duration_minutes: input.p_duration_minutes,
        performed_at: new Date().toISOString(),
      };
      sessions.push(row);
      body = row.id;
    } else if (
      ['/exercises', '/training_programs', '/program_versions', '/training_sessions'].some((path) =>
        url.pathname.endsWith(path),
      )
    ) {
      const collection = url.pathname.endsWith('/exercises')
        ? exercises
        : url.pathname.endsWith('/training_programs')
          ? programs
          : url.pathname.endsWith('/program_versions')
            ? versions
            : sessions;
      if (method === 'POST') {
        const row = {
          ...req.postDataJSON(),
          id: url.pathname.endsWith('/exercises')
            ? '40000000-0000-4000-8000-000000000001'
            : '70000000-0000-4000-8000-000000000001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        collection.push(row);
        body = [row];
      } else if (method === 'PATCH') {
        const row = collection.find((v) => 'eq.' + v.id === url.searchParams.get('id'));
        if (row) Object.assign(row, req.postDataJSON(), { updated_at: new Date().toISOString() });
        body = row ? [row] : [];
      } else {
        body = [...collection];
        const id = url.searchParams.get('id');
        if (id) body = body.filter((v: any) => 'eq.' + v.id === id);
        headers['content-range'] = `0-${Math.max(0, body.length - 1)}/${body.length}`;
      }
      if (req.headers().accept?.includes('vnd.pgrst.object+json')) body = body[0] ?? null;
    } else if (url.pathname.includes('/students')) {
      if (failure) {
        await route.fulfill({
          status: 500,
          headers,
          body: JSON.stringify({ message: 'Explicit test failure' }),
        });
        return;
      }
      if (method === 'POST') {
        const input = req.postDataJSON();
        const row = {
          ...input,
          id: '30000000-0000-4000-8000-000000000010',
          user_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        students.push(row);
        body = [row];
      } else if (method === 'PATCH') {
        const row = students.find((s) => 'eq.' + s.id === url.searchParams.get('id'));
        if (row) {
          Object.assign(row, req.postDataJSON(), { updated_at: new Date().toISOString() });
        }
        body = row ? [row] : [];
      } else {
        body = [...students];
        const id = url.searchParams.get('id');
        if (id) body = body.filter((s: any) => 'eq.' + s.id === id);
        const status = url.searchParams.get('status');
        if (status) body = body.filter((s: any) => 'eq.' + s.status === status);
        const search = url.searchParams.get('full_name');
        if (search)
          body = body.filter((s: any) =>
            s.full_name
              .toLowerCase()
              .includes(search.replace('ilike.%', '').replace(/%$/, '').toLowerCase()),
          );
        headers['content-range'] = `0-${Math.max(0, body.length - 1)}/${body.length}`;
      }
      if (req.headers().accept?.includes('vnd.pgrst.object+json')) body = body[0] ?? null;
    }
    await route.fulfill({
      status: 200,
      headers,
      body: method === 'HEAD' ? '' : JSON.stringify(body),
    });
  });
}
async function login(page: Page) {
  await page.goto('/home');
  await page
    .getByRole('textbox', { name: 'E-mail', exact: true })
    .fill('profissional@example.test');
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('password-for-tests-only');
  await page.getByRole('button', { name: 'Entrar no Core', exact: true }).click();
}
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

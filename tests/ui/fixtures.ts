import type { Page } from '@playwright/test';
const pid = '20000000-0000-4000-8000-000000000001';
const uid = '10000000-0000-4000-8000-000000000001';
// Explicit UI fixtures only. Actual permissions are tested separately in database.test.ts.
export async function fixture(
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
  return { students, exercises, programs, versions, sessions };
}
export async function login(page: Page) {
  await page.goto('/home');
  await page
    .getByRole('textbox', { name: 'E-mail', exact: true })
    .fill('profissional@example.test');
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('password-for-tests-only');
  await page.getByRole('button', { name: 'Entrar no Core', exact: true }).click();
}

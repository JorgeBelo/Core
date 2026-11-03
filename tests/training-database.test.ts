import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { prescribe, type ProgramSnapshot } from '../packages/domain/src/index';
const owner = '10000000-0000-4000-8000-000000000001',
  other = '10000000-0000-4000-8000-000000000002',
  student = '10000000-0000-4000-8000-000000000003';
const tenant = '20000000-0000-4000-8000-000000000001',
  tenant2 = '20000000-0000-4000-8000-000000000002',
  sid = '30000000-0000-4000-8000-000000000001';
const eid = '40000000-0000-4000-8000-000000000001',
  eid2 = '40000000-0000-4000-8000-000000000002';
let db: PGlite, program: { id: string; updated_at: string }, versionId: string;
const draft = [{ name: 'Treino A', exercises: [prescribe(eid)] }];
const results = [
  { exercise_id: eid, sets: [{ repetitions: 12, load_kg: 20, effort: 6, completed: true }] },
];
async function asUser<T = Record<string, unknown>>(
  uid: string,
  sql: string,
  params: unknown[] = [],
) {
  await db.exec('begin;set local role authenticated;');
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [uid]);
    const result = await db.query<T>(sql, params);
    await db.exec('commit');
    return result.rows;
  } catch (e) {
    await db.exec('rollback');
    throw e;
  }
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth,public to authenticated;grant execute on function auth.uid() to authenticated;insert into auth.users values('${owner}'),('${other}'),('${student}');`,
  );
  for (const file of [
    '20261103165452_core_foundation.sql',
    '20261103165912_core_training.sql',
    '20261103165510_legacy_security_hardening.sql',
  ])
    await db.exec(
      await readFile(new URL('../supabase/migrations/' + file, import.meta.url), 'utf8'),
    );
  await db.query(
    'insert into public.professionals(id,user_id,display_name) values($1,$2,$3),($4,$5,$6)',
    [tenant, owner, 'Profissional de teste', tenant2, other, 'Outro profissional de teste'],
  );
  await db.query(
    'insert into public.students(id,professional_id,user_id,full_name) values($1,$2,$3,$4)',
    [sid, tenant, student, 'Aluno de teste'],
  );
  await db.query(
    'insert into public.exercises(id,professional_id,name,muscle_group,instructions) values($1,$2,$3,$4,$5),($6,$7,$8,$9,$10)',
    [
      eid,
      tenant,
      'Exercício de teste',
      'Grupo de teste',
      'Instrução original',
      eid2,
      tenant2,
      'Exercício de outro tenant',
      'Grupo de teste',
      'Privado',
    ],
  );
});
afterAll(async () => await db?.close());
describe.sequential('Training prescription, explicit approval and immutable execution', () => {
  it('creates a private draft and validates tenant relationships', async () => {
    const rows = await asUser<{ id: string; updated_at: string }>(
      owner,
      'insert into public.training_programs(professional_id,student_id,name,draft_days) values($1,$2,$3,$4) returning id,updated_at::text',
      [tenant, sid, 'Programa de teste', JSON.stringify(draft)],
    );
    program = rows[0];
    expect(await asUser(student, 'select * from public.training_programs')).toHaveLength(0);
    expect(await asUser(student, 'select * from public.program_versions')).toHaveLength(0);
    await expect(
      asUser(
        other,
        'insert into public.training_programs(professional_id,student_id,name) values($1,$2,$3)',
        [tenant2, sid, 'Outro programa'],
      ),
    ).rejects.toThrow(/foreign key/i);
  });
  it('denies automatic publication, student approval and foreign trainer approval', async () => {
    await expect(
      asUser(
        owner,
        "insert into public.program_versions(program_id,professional_id,student_id,revision,snapshot,approved_by) values($1,$2,$3,1,'{}',$4)",
        [program.id, tenant, sid, owner],
      ),
    ).rejects.toThrow(/permission denied/i);
    for (const actor of [student, other])
      await expect(
        asUser(actor, 'select public.publish_program($1,$2)', [program.id, program.updated_at]),
      ).rejects.toThrow(/not accessible/i);
  });
  it('publishes only after explicit owner approval', async () => {
    const rows = await asUser<{ id: string }>(owner, 'select public.publish_program($1,$2) as id', [
      program.id,
      program.updated_at,
    ]);
    versionId = rows[0].id;
    const published = await asUser<{
      snapshot: ProgramSnapshot;
      approved_by: string;
      revision: number;
    }>(student, 'select snapshot,approved_by,revision from public.program_versions');
    expect(published).toHaveLength(1);
    expect(published[0].approved_by).toBe(owner);
    expect(published[0].snapshot.days[0].exercises[0].instructions).toBe('Instrução original');
  });
  it('keeps approved exercise details immutable when the library or draft changes', async () => {
    await asUser(owner, "update public.exercises set instructions='Instrução nova' where id=$1", [
      eid,
    ]);
    await asUser(
      owner,
      "update public.training_programs set name='Programa alterado' where id=$1",
      [program.id],
    );
    const rows = await asUser<{ snapshot: ProgramSnapshot }>(
      student,
      'select snapshot from public.program_versions where id=$1',
      [versionId],
    );
    expect(rows[0].snapshot.name).toBe('Programa de teste');
    expect(rows[0].snapshot.days[0].exercises[0].instructions).toBe('Instrução original');
    await expect(
      asUser(owner, "update public.program_versions set snapshot='{}' where id=$1", [versionId]),
    ).rejects.toThrow(/permission denied/i);
  });
  it('rejects approving an outdated draft', async () => {
    await expect(
      asUser(owner, 'select public.publish_program($1,$2)', [program.id, program.updated_at]),
    ).rejects.toThrow(/Draft changed/i);
  });
  it('records actual performance separately from prescribed values', async () => {
    const rows = await asUser<{ id: string }>(
      student,
      'select public.record_training_session($1,0,$2,$3,45,$4) as id',
      [
        versionId,
        JSON.stringify(results),
        'Feedback de teste',
        '50000000-0000-4000-8000-000000000001',
      ],
    );
    expect(rows[0].id).toBeTruthy();
    const saved = await asUser<{ results: typeof results }>(
      owner,
      'select results from public.training_sessions',
    );
    expect(saved[0].results[0].sets[0].load_kg).toBe(20);
  });
  it('retries an identical completion without duplicating it', async () => {
    const args = [
      versionId,
      JSON.stringify(results),
      'Feedback de teste',
      '50000000-0000-4000-8000-000000000001',
    ];
    await asUser(student, 'select public.record_training_session($1,0,$2,$3,45,$4)', args);
    expect(await asUser(student, 'select id from public.training_sessions')).toHaveLength(1);
  });
  it('rejects reusing an idempotency key with a different payload', async () => {
    await expect(
      asUser(student, 'select public.record_training_session($1,0,$2,$3,45,$4)', [
        versionId,
        JSON.stringify(results),
        'Alterado',
        '50000000-0000-4000-8000-000000000001',
      ]),
    ).rejects.toThrow(/unique constraint/i);
  });
  it('rejects unprescribed exercises, negative loads and empty completion', async () => {
    for (const value of [
      [{ ...results[0], exercise_id: eid2 }],
      [{ exercise_id: eid, sets: [{ ...results[0].sets[0], load_kg: -1 }] }],
      [{ exercise_id: eid, sets: [{ ...results[0].sets[0], completed: false }] }],
    ])
      await expect(
        asUser(student, "select public.record_training_session($1,0,$2,'',null,$3)", [
          versionId,
          JSON.stringify(value),
          crypto.randomUUID(),
        ]),
      ).rejects.toThrow();
  });
  it('denies trainer impersonation and cross-tenant session access', async () => {
    await expect(
      asUser(owner, "select public.record_training_session($1,0,$2,'',null,$3)", [
        versionId,
        JSON.stringify(results),
        crypto.randomUUID(),
      ]),
    ).rejects.toThrow(/not accessible/i);
    expect(await asUser(other, 'select * from public.training_sessions')).toHaveLength(0);
    expect(await asUser(other, 'select * from public.program_versions')).toHaveLength(0);
  });
  it('revokes student access after inactivation while retaining history for trainer', async () => {
    await asUser(owner, "update public.students set status='inactive' where id=$1", [sid]);
    expect(await asUser(student, 'select * from public.program_versions')).toHaveLength(0);
    expect(await asUser(student, 'select * from public.training_sessions')).toHaveLength(0);
    expect(await asUser(owner, 'select * from public.training_sessions')).toHaveLength(1);
    await asUser(owner, "update public.students set status='active' where id=$1", [sid]);
  });
  it('rejects cross-tenant exercises in a prescription', async () => {
    const rows = await asUser<{ id: string; updated_at: string }>(
      owner,
      'insert into public.training_programs(professional_id,student_id,name,draft_days) values($1,$2,$3,$4) returning id,updated_at::text',
      [
        tenant,
        sid,
        'Tentativa de exercício estrangeiro',
        JSON.stringify([{ name: 'A', exercises: [prescribe(eid2)] }]),
      ],
    );
    await expect(
      asUser(owner, 'select public.publish_program($1,$2)', [rows[0].id, rows[0].updated_at]),
    ).rejects.toThrow(/Exercise not accessible/i);
  });
  it('rejects duplicate exercises and invalid numeric prescription parameters', async () => {
    for (const exercises of [[prescribe(eid), prescribe(eid)], [{ ...prescribe(eid), sets: -1 }]]) {
      const rows = await asUser<{ id: string; updated_at: string }>(
        owner,
        'insert into public.training_programs(professional_id,student_id,name,draft_days) values($1,$2,$3,$4) returning id,updated_at::text',
        [tenant, sid, 'Programa inválido de teste', JSON.stringify([{ name: 'A', exercises }])],
      );
      await expect(
        asUser(owner, 'select public.publish_program($1,$2)', [rows[0].id, rows[0].updated_at]),
      ).rejects.toThrow();
    }
  });
  it('audits approval and completion without personal payload copies', async () => {
    const rows = await asUser<{ action: string }>(
      owner,
      "select action from public.audit_events where entity_type in('program_version','training_session')",
    );
    expect(rows.map((v) => v.action).sort()).toEqual(['approve', 'finish']);
  });
});

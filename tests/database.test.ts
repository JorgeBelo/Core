import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
const owner = '10000000-0000-4000-8000-000000000001';
const other = '10000000-0000-4000-8000-000000000002';
const studentUser = '10000000-0000-4000-8000-000000000003';
const unlinked = '10000000-0000-4000-8000-000000000004';
const tenant = '20000000-0000-4000-8000-000000000001';
const tenant2 = '20000000-0000-4000-8000-000000000002';
const sid = '30000000-0000-4000-8000-000000000001';
let db: PGlite;
async function asUser<T = Record<string, unknown>>(
  user: string,
  sql: string,
  params: unknown[] = [],
) {
  await db.exec('begin;set local role authenticated;');
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [user]);
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
  await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,public to authenticated;grant execute on function auth.uid() to authenticated;
    insert into auth.users values('${owner}'),('${other}'),('${studentUser}'),('${unlinked}');`);
  await db.exec(
    await readFile(
      new URL('../supabase/migrations/20261103165452_core_foundation.sql', import.meta.url),
      'utf8',
    ),
  );
  await db.query(
    'insert into public.professionals(id,user_id,display_name) values($1,$2,$3),($4,$5,$6)',
    [tenant, owner, 'Profissional Teste A', tenant2, other, 'Profissional Teste B'],
  );
  await db.query(
    'insert into public.students(id,professional_id,user_id,full_name) values($1,$2,$3,$4)',
    [sid, tenant, studentUser, 'Aluno isolado de teste'],
  );
  await db.query(
    'insert into public.student_notes(student_id,professional_id,content) values($1,$2,$3)',
    [sid, tenant, 'Nota profissional privada de teste'],
  );
});
afterAll(async () => {
  await db?.close();
});
describe.sequential('Actual PostgreSQL migration and RLS (Supabase Auth identity shim)', () => {
  it('owner can create, read, edit and inactivate persistent students', async () => {
    const rows = await asUser<{ id: string; updated_at: string }>(
      owner,
      'insert into public.students(professional_id,full_name,email) values($1,$2,$3) returning id,updated_at',
      [tenant, 'Cadastro teste', 'TESTE@example.test'],
    );
    expect(rows).toHaveLength(1);
    const changed = await asUser<{ status: string; updated_at: string }>(
      owner,
      "update public.students set status='inactive' where id=$1 returning status,updated_at",
      [rows[0].id],
    );
    expect(changed[0].status).toBe('inactive');
    expect(changed[0].updated_at).not.toEqual(rows[0].updated_at);
    expect(
      await asUser(owner, 'select * from public.students where id=$1', [rows[0].id]),
    ).toHaveLength(1);
  });
  it('another professional cannot read or mutate another tenant', async () => {
    expect(await asUser(other, 'select * from public.students where id=$1', [sid])).toHaveLength(0);
    expect(
      await asUser(
        other,
        "update public.students set full_name='Ataque teste' where id=$1 returning id",
        [sid],
      ),
    ).toHaveLength(0);
    await expect(
      asUser(other, 'insert into public.students(professional_id,full_name) values($1,$2)', [
        tenant,
        'Ataque teste',
      ]),
    ).rejects.toThrow(/row.level security/i);
  });
  it('cannot reassign tenant, login identity, role or timestamps', async () => {
    for (const statement of [
      'update public.students set professional_id=$1 where id=$2',
      'update public.students set user_id=$1 where id=$2',
    ])
      await expect(asUser(owner, statement, [other, sid])).rejects.toThrow(/permission denied/i);
    await expect(
      asUser(
        owner,
        "insert into public.professionals(user_id,display_name) values($1,'Elevação teste')",
        [unlinked],
      ),
    ).rejects.toThrow(/permission denied/i);
    await expect(
      asUser(owner, 'update public.students set created_at=now() where id=$1', [sid]),
    ).rejects.toThrow(/permission denied/i);
  });
  it('student can read only own active registration, with no private notes or audit', async () => {
    const rows = await asUser<{ id: string }>(studentUser, 'select id from public.students');
    expect(rows.map((r) => r.id)).toEqual([sid]);
    expect(await asUser(studentUser, 'select * from public.student_notes')).toHaveLength(0);
    expect(await asUser(studentUser, 'select * from public.audit_events')).toHaveLength(0);
    expect(await asUser(studentUser, 'select * from public.professionals')).toHaveLength(0);
    expect(
      await asUser(
        studentUser,
        "update public.students set full_name='Alteração teste' where id=$1 returning id",
        [sid],
      ),
    ).toHaveLength(0);
  });
  it('unlinked identity sees nothing', async () => {
    expect(await asUser(unlinked, 'select * from public.students')).toHaveLength(0);
  });
  it('inactive students lose student-side access', async () => {
    await asUser(owner, "update public.students set status='inactive' where id=$1", [sid]);
    expect(await asUser(studentUser, 'select * from public.students')).toHaveLength(0);
    await asUser(owner, "update public.students set status='active' where id=$1", [sid]);
  });
  it('denies anonymous access', async () => {
    await db.exec('begin;set local role anon;');
    try {
      await expect(db.query('select * from public.students')).rejects.toThrow(/permission denied/i);
    } finally {
      await db.exec('rollback');
    }
  });
  it('enforces duplicate email uniqueness inside each tenant', async () => {
    await expect(
      asUser(
        owner,
        'insert into public.students(professional_id,full_name,email) values($1,$2,$3)',
        [tenant, 'Duplicado teste', 'teste@example.test'],
      ),
    ).rejects.toThrow(/duplicate key/i);
    expect(
      await asUser(
        other,
        'insert into public.students(professional_id,full_name,email) values($1,$2,$3) returning id',
        [tenant2, 'Outro cadastro teste', 'teste@example.test'],
      ),
    ).toHaveLength(1);
  });
  it('records audit metadata without copying personal fields', async () => {
    const rows = await asUser<{ actor_id: string; action: string }>(
      owner,
      "select actor_id,action from public.audit_events where action='update'",
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.actor_id === owner)).toBe(true);
    await expect(asUser(owner, 'delete from public.audit_events')).rejects.toThrow(
      /permission denied/i,
    );
  });
  it('prevents cross-tenant private note relationships', async () => {
    const rows = await asUser<{ id: string }>(
      owner,
      'select id from public.students where id<>$1',
      [sid],
    );
    await expect(
      asUser(
        other,
        'insert into public.student_notes(student_id,professional_id,content) values($1,$2,$3)',
        [rows[0].id, tenant2, 'Tentativa teste'],
      ),
    ).rejects.toThrow(/foreign key/i);
  });
  it('prevents hard deletion and stale concurrent updates', async () => {
    await expect(asUser(owner, 'delete from public.students where id=$1', [sid])).rejects.toThrow(
      /permission denied/i,
    );
    const before = await asUser<{ updated_at: string }>(
      owner,
      'select updated_at::text from public.students where id=$1',
      [sid],
    );
    await asUser(owner, "update public.students set goal='Objetivo alterado' where id=$1", [sid]);
    expect(
      await asUser(
        owner,
        "update public.students set goal='Desatualizado' where id=$1 and updated_at=$2 returning id",
        [sid, before[0].updated_at],
      ),
    ).toHaveLength(0);
  });
  it('keeps dashboard counts consistent with saved records', async () => {
    const rows = await asUser<{ active: number; inactive: number }>(
      owner,
      "select count(*) filter(where status='active')::int active,count(*) filter(where status='inactive')::int inactive from public.students",
    );
    expect(rows[0]).toEqual({ active: 1, inactive: 1 });
  });
});

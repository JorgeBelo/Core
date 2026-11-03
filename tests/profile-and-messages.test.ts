import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import {
  professionalProfileSchema,
  renderMessage,
  birthdayTemplateKey,
  defaultMessageTemplates,
  messageTemplatesSchema,
  whatsAppLink,
  businessDate,
} from '../packages/domain/src/index';
describe('Professional profile and message preparation', () => {
  it('accepts blank optional CREF and trims supplied CREF', () => {
    expect(
      professionalProfileSchema.parse({ display_name: 'Personal de teste', cref: '' }).cref,
    ).toBe('');
    expect(
      professionalProfileSchema.parse({ display_name: 'Personal de teste', cref: ' 123456-G/SP ' })
        .cref,
    ).toBe('123456-G/SP');
  });
  it('personalizes all supported fields without recursively expanding names', () => {
    expect(
      renderMessage('{nome}: {valor} em {vencimento}. {personal}', {
        nome: 'Ana {valor}',
        valor: 'R$ 350,00',
        vencimento: '03/11/2026',
        personal: 'Jorge',
      }),
    ).toBe('Ana {valor}: R$ 350,00 em 03/11/2026. Jorge');
  });
  it('uses feminine, masculine and neutral birthday templates', () => {
    expect(
      renderMessage(defaultMessageTemplates[birthdayTemplateKey('female')], {
        nome: 'Ana',
        personal: 'Personal',
      }),
    ).toContain('querida');
    expect(defaultMessageTemplates[birthdayTemplateKey('male')]).toContain('querido');
    expect(birthdayTemplateKey('unspecified')).toBe('birthday_neutral');
  });
  it('validates templates and rejects unexpected fields', () => {
    expect(messageTemplatesSchema.safeParse(defaultMessageTemplates).success).toBe(true);
    expect(
      messageTemplatesSchema.safeParse({
        ...defaultMessageTemplates,
        due: 'Olá, {senha} - aviso de pagamento',
      }).success,
    ).toBe(false);
  });
  it('normalizes Brazilian numbers and encodes message text without sending it', () => {
    expect(whatsAppLink('(11) 99999-0000', 'Olá, Ana!')).toBe(
      'https://wa.me/5511999990000?text=Ol%C3%A1%2C%20Ana!',
    );
    expect(whatsAppLink('+351 912 345 678', 'Olá')).toContain('351912345678?');
    expect(whatsAppLink('inválido', 'Olá')).toBeNull();
  });
  it('uses the São Paulo date across UTC midnight', () => {
    expect(businessDate(new Date('2026-11-04T01:00:00Z'))).toBe('2026-11-03');
  });
});
let db: PGlite;
const owner = '10000000-0000-4000-8000-000000000001',
  other = '10000000-0000-4000-8000-000000000002',
  tenant = '20000000-0000-4000-8000-000000000001';
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated;grant execute on function auth.uid() to authenticated;insert into auth.users values('${owner}'),('${other}');`,
  );
  const dir = new URL('../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort())
    await db.exec(await readFile(new URL(file, dir), 'utf8'));
  await db.query('insert into public.professionals(id,user_id,display_name) values($1,$2,$3)', [
    tenant,
    owner,
    'Personal de teste',
  ]);
});
afterAll(async () => await db?.close());
async function asUser(user: string, sql: string, params: unknown[] = []) {
  await db.exec('begin;set local role authenticated');
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [user]);
    const result = await db.query<any>(sql, params);
    await db.exec('commit');
    return result.rows;
  } catch (e) {
    await db.exec('rollback');
    throw e;
  }
}
it('restricts optional professional registration and templates to the owner, retaining audit and timestamp', async () => {
  const before = (
    await db.query<any>('select updated_at from public.professionals where id=$1', [tenant])
  ).rows[0].updated_at;
  const changed = await asUser(
    owner,
    "update public.professionals set cref='123456-G/SP',display_name='Personal atualizado' where id=$1 returning cref,updated_at",
    [tenant],
  );
  expect(changed[0].cref).toBe('123456-G/SP');
  expect(new Date(changed[0].updated_at).getTime()).toBeGreaterThan(new Date(before).getTime());
  expect(
    await asUser(other, "update public.professionals set cref='ATAQUE' where id=$1 returning id", [
      tenant,
    ]),
  ).toHaveLength(0);
  await expect(
    asUser(owner, 'update public.professionals set user_id=$1 where id=$2', [other, tenant]),
  ).rejects.toThrow(/permission denied/);
  await expect(
    asUser(owner, "update public.professionals set message_templates='{}' where id=$1", [tenant]),
  ).rejects.toThrow(/check constraint/);
  await asUser(owner, "update public.professionals set cref='' where id=$1", [tenant]);
  expect(
    (
      await asUser(owner, 'select count(*)::int n from public.audit_events where entity_type=$1', [
        'professional',
      ])
    )[0].n,
  ).toBe(2);
});
it('stores gender and opt-in with safe defaults and blocks student self-modification', async () => {
  const s = (
    await asUser(
      owner,
      "insert into public.students(professional_id,full_name) values($1,'Aluna de teste') returning *",
      [tenant],
    )
  )[0];
  expect(s.gender).toBe('unspecified');
  expect(s.whatsapp_opt_in).toBe(false);
  await asUser(
    owner,
    "update public.students set gender='female',whatsapp_opt_in=true where id=$1",
    [s.id],
  );
  await expect(
    asUser(owner, "update public.students set gender='inválido' where id=$1", [s.id]),
  ).rejects.toThrow(/check constraint/);
  await db.query('update public.students set user_id=$1 where id=$2', [other, s.id]);
  expect(
    await asUser(
      other,
      'update public.students set whatsapp_opt_in=true where id=$1 returning id',
      [s.id],
    ),
  ).toHaveLength(0);
});

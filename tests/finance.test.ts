import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import { parseBRL, formatBRL, entrySchema } from '../packages/domain/src/index';
describe('Integer money and finance validation', () => {
  it.each([
    ['0,10', 10],
    ['300', 30000],
    ['1.234,56', 123456],
    ['R$ 25,5', 2550],
    ['0001,01', 101],
  ])('parses %s into cents', (text, value) => {
    expect(parseBRL(text)).toBe(value);
  });
  it.each([
    '-1,00',
    '0',
    '1,234',
    '1.23',
    'NaN',
    'Infinity',
    '2e3',
    '1,2,3',
    '1.000.000.000.000,00',
  ])('rejects invalid money %s', (v) => {
    expect(() => parseBRL(v)).toThrow();
  });
  it('formats large and negative totals without floating-point arithmetic', () => {
    expect(formatBRL('9007199254740993')).toBe('R$ 90.071.992.547.409,93');
    expect(formatBRL(-501)).toBe('-R$ 5,01');
  });
  it('rejects invalid dates and student-linked operational expenses', () => {
    expect(
      entrySchema.safeParse({
        direction: 'payable',
        student_id: crypto.randomUUID(),
        description: 'Despesa teste',
        amount_cents: 100,
        category: 'Outros',
        due_date: '2026-02-30',
        competence_date: '2026-11-03',
      }).success,
    ).toBe(false);
  });
});
const owner = '10000000-0000-4000-8000-000000000001',
  other = '10000000-0000-4000-8000-000000000002',
  student = '10000000-0000-4000-8000-000000000003';
const tenant = '20000000-0000-4000-8000-000000000001',
  tenant2 = '20000000-0000-4000-8000-000000000002',
  sid = '30000000-0000-4000-8000-000000000001';
let db: PGlite, today: string;
async function asUser<T = Record<string, any>>(uid: string, sql: string, params: unknown[] = []) {
  await db.exec('begin;set local role authenticated;');
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [uid]);
    const rows = await db.query<T>(sql, params);
    await db.exec('commit');
    return rows.rows;
  } catch (e) {
    await db.exec('rollback');
    throw e;
  }
}
async function entry(direction = 'receivable', amount = 10000, date = today, competence = date) {
  const rows = await asUser(
    owner,
    'insert into public.finance_entries(professional_id,student_id,direction,description,amount_cents,category,due_date,competence_date) values($1,$2,$3,$4,$5,$6,$7,$8) returning id',
    [
      tenant,
      direction === 'receivable' ? sid : null,
      direction,
      'Conta de teste',
      amount,
      'Categoria de teste',
      date,
      competence,
    ],
  );
  return rows[0].id as string;
}
async function pay(id: string, amount: number, key = crypto.randomUUID(), date = today) {
  return (
    await asUser(
      owner,
      "select public.confirm_finance_payment($1,$2,$3,'pix','Registro de teste',$4) as id",
      [id, amount, date, key],
    )
  )[0].id as string;
}
async function balance(id: string) {
  return (await asUser(owner, 'select * from public.finance_balances where id=$1', [id]))[0];
}
async function report(from: string, to: string) {
  return (await asUser(owner, 'select public.finance_report($1,$2) as report', [from, to]))[0]
    .report;
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth,public to authenticated;grant execute on function auth.uid() to authenticated;insert into auth.users values('${owner}'),('${other}'),('${student}');`,
  );
  const dir = new URL('../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(dir)).filter((v) => v.endsWith('.sql')).sort())
    await db.exec(await readFile(new URL(file, dir), 'utf8'));
  await db.query(
    'insert into public.professionals(id,user_id,display_name) values($1,$2,$3),($4,$5,$6)',
    [tenant, owner, 'Profissional teste', tenant2, other, 'Outro profissional teste'],
  );
  await db.query(
    'insert into public.students(id,professional_id,user_id,full_name) values($1,$2,$3,$4)',
    [sid, tenant, student, 'Aluno teste'],
  );
  today = (
    await db.query<{ date: string }>(
      "select to_char((current_timestamp at time zone 'America/Sao_Paulo')::date,'YYYY-MM-DD') as date",
    )
  ).rows[0].date;
});
afterAll(async () => await db?.close());
describe.sequential('Financial ledger, RLS and real PostgreSQL calculations', () => {
  it('does not confirm receipt because a bill is overdue', async () => {
    const id = await entry('receivable', 10000, '2020-01-01');
    const b = await balance(id);
    expect(b.status).toBe('overdue');
    expect(Number(b.settled_cents)).toBe(0);
    expect(Number(b.balance_cents)).toBe(10000);
  });
  it('records partial receipt and settles only the remaining balance', async () => {
    const id = await entry();
    await pay(id, 4000);
    expect((await balance(id)).status).toBe('partial');
    expect(Number((await balance(id)).balance_cents)).toBe(6000);
    await pay(id, 6000);
    expect((await balance(id)).status).toBe('paid');
    expect(Number((await balance(id)).balance_cents)).toBe(0);
    await expect(pay(id, 1)).rejects.toThrow(/supera o saldo/i);
  });
  it('replays identical confirmation without duplication and rejects key reuse', async () => {
    const id = await entry();
    const key = crypto.randomUUID();
    const first = await pay(id, 1000, key);
    expect(await pay(id, 1000, key)).toBe(first);
    expect(Number((await balance(id)).settled_cents)).toBe(1000);
    await expect(pay(id, 2000, key)).rejects.toThrow(/Chave de pagamento/i);
  });
  it('rejects two stale attempts that would overpay the same entry', async () => {
    const id = await entry();
    await pay(id, 7000);
    await expect(pay(id, 7000)).rejects.toThrow(/supera o saldo/i);
    expect(Number((await balance(id)).settled_cents)).toBe(7000);
  });
  it('rejects zero, negative and future confirmations', async () => {
    const id = await entry();
    for (const value of [0, -1]) await expect(pay(id, value)).rejects.toThrow(/inválidos/i);
    await expect(pay(id, 1, crypto.randomUUID(), '2099-01-01')).rejects.toThrow(/inválidos/i);
  });
  it('reverses a receipt with an immutable counter-entry and blocks double reversal', async () => {
    const id = await entry();
    const payment = await pay(id, 10000);
    const key = crypto.randomUUID();
    const sql = 'select public.reverse_finance_payment($1,$2,$3,$4) as id';
    const args = [payment, today, 'Correção de teste', key];
    const reversed = (await asUser(owner, sql, args))[0].id;
    expect((await asUser(owner, sql, args))[0].id).toBe(reversed);
    expect(Number((await balance(id)).settled_cents)).toBe(0);
    await expect(
      asUser(owner, sql, [payment, today, 'Nova tentativa', crypto.randomUUID()]),
    ).rejects.toThrow(/já estornado/i);
    const facts = await asUser(
      owner,
      'select amount_cents from public.finance_payments where entry_id=$1 order by amount_cents',
      [id],
    );
    expect(facts.map((v) => Number(v.amount_cents))).toEqual([-10000, 10000]);
  });
  it('applies discounts and fees without rewriting the original obligation', async () => {
    const id = await entry();
    await asUser(
      owner,
      "select public.adjust_finance_entry($1,'discount',1000,'Desconto negociado',$2)",
      [id, crypto.randomUUID()],
    );
    await asUser(
      owner,
      "select public.adjust_finance_entry($1,'interest',500,'Juros informados',$2)",
      [id, crypto.randomUUID()],
    );
    const b = await balance(id);
    expect(Number(b.amount_cents)).toBe(10000);
    expect(Number(b.total_cents)).toBe(9500);
    await pay(id, 9000);
    await expect(
      asUser(
        owner,
        "select public.adjust_finance_entry($1,'discount',1000,'Desconto inválido',$2)",
        [id, crypto.randomUUID()],
      ),
    ).rejects.toThrow(/saldo inválido/i);
  });
  it('blocks payments while disputed and records the reason', async () => {
    const id = await entry();
    await asUser(
      owner,
      "select public.set_finance_entry_state($1,'dispute','Contestado em teste')",
      [id],
    );
    expect((await balance(id)).status).toBe('disputed');
    await expect(pay(id, 10)).rejects.toThrow(/contestação/i);
    expect(
      (
        await asUser(
          owner,
          "select reason from public.finance_events where entry_id=$1 and action='dispute'",
          [id],
        )
      )[0].reason,
    ).toBe('Contestado em teste');
    await asUser(
      owner,
      "select public.set_finance_entry_state($1,'resolve','Conferido em teste')",
      [id],
    );
    await pay(id, 10000);
    expect((await balance(id)).status).toBe('paid');
  });
  it('requires reversal before cancellation and preserves cancelled obligations', async () => {
    const id = await entry();
    await pay(id, 100);
    await expect(
      asUser(owner, "select public.set_finance_entry_state($1,'cancel','Cancelamento teste')", [
        id,
      ]),
    ).rejects.toThrow(/Estorne/i);
    const empty = await entry();
    await asUser(owner, "select public.set_finance_entry_state($1,'cancel','Cancelamento teste')", [
      empty,
    ]);
    expect((await balance(empty)).status).toBe('cancelled');
    await expect(pay(empty, 100)).rejects.toThrow(/cancelamento/i);
  });
  it('keeps operational expense payments separate from incoming revenue', async () => {
    const id = await entry('payable', 7000, '2021-01-10');
    await pay(id, 2000, crypto.randomUUID(), '2021-01-10');
    const r = await report('2021-01-01', '2021-01-31');
    expect(r.received_cents).toBe('0');
    expect(r.paid_cents).toBe('2000');
    expect(r.cash_result_cents).toBe('-2000');
    expect(r.expense_cents).toBe('7000');
  });
  it('separates accrual revenue from the month cash was actually received', async () => {
    const id = await entry('receivable', 30000, '2022-01-05', '2022-01-01');
    await pay(id, 10000, crypto.randomUUID(), '2022-02-01');
    const jan = await report('2022-01-01', '2022-01-31'),
      feb = await report('2022-02-01', '2022-02-28');
    expect(jan.revenue_cents).toBe('30000');
    expect(jan.received_cents).toBe('0');
    expect(feb.revenue_cents).toBe('0');
    expect(feb.received_cents).toBe('10000');
    expect(jan.monthly[0].forecast_receivable_cents).toBe('20000');
  });
  it('stores a revision when due date or description changes', async () => {
    const id = await entry();
    await asUser(
      owner,
      "update public.finance_entries set description='Descrição revisada' where id=$1",
      [id],
    );
    const events = await asUser(
      owner,
      "select previous_values,current_values from public.finance_events where entry_id=$1 and action='edit'",
      [id],
    );
    expect(events[0].previous_values.description).toBe('Conta de teste');
    expect(events[0].current_values.description).toBe('Descrição revisada');
  });
  it('prevents arbitrary ledger edits, deletion, amount changes and tenant reassignment', async () => {
    const id = await entry();
    await pay(id, 100);
    for (const sql of [
      'update public.finance_payments set amount_cents=999',
      'delete from public.finance_entries',
      'update public.finance_entries set amount_cents=999',
      'update public.finance_entries set professional_id=null',
      "insert into public.finance_adjustments(professional_id,entry_id,kind,amount_cents,reason,idempotency_key,actor_id) select professional_id,id,'fee',100,'Teste',gen_random_uuid(),auth.uid() from public.finance_entries limit 1",
    ])
      await expect(asUser(owner, sql)).rejects.toThrow(/permission denied/i);
  });
  it('denies another professional and protects relationships across tenants', async () => {
    const id = await entry();
    expect(
      await asUser(other, 'select * from public.finance_balances where id=$1', [id]),
    ).toHaveLength(0);
    await expect(
      asUser(other, "select public.confirm_finance_payment($1,100,$2,'pix','',$3)", [
        id,
        today,
        crypto.randomUUID(),
      ]),
    ).rejects.toThrow(/não acessível/i);
    await expect(
      asUser(
        other,
        "insert into public.finance_entries(professional_id,student_id,direction,description,amount_cents,category,due_date,competence_date) values($1,$2,'receivable','Teste cruzado',100,'Outros',$3,$3)",
        [tenant2, sid, today],
      ),
    ).rejects.toThrow(/foreign key/i);
  });
  it('limits the student to their own receivables and prevents administrative operations', async () => {
    const expense = await entry('payable');
    const own = await entry();
    expect(
      await asUser(student, 'select * from public.finance_balances where id=$1', [expense]),
    ).toHaveLength(0);
    expect(
      await asUser(student, 'select * from public.finance_balances where id=$1', [own]),
    ).toHaveLength(1);
    await expect(asUser(student, 'select public.finance_report($1,$1)', [today])).rejects.toThrow(
      /profissional obrigatório/i,
    );
    expect(
      await asUser(
        student,
        "update public.finance_entries set description='Tentativa' where id=$1 returning id",
        [own],
      ),
    ).toHaveLength(0);
    await expect(
      asUser(student, "select public.confirm_finance_payment($1,100,$2,'pix','',$3)", [
        own,
        today,
        crypto.randomUUID(),
      ]),
    ).rejects.toThrow(/profissional obrigatório/i);
    expect(await asUser(student, 'select * from public.finance_events')).toHaveLength(0);
  });
  it('creates a contract and anchored installments without confirming them', async () => {
    const plan = (
      await asUser(
        owner,
        "insert into public.commercial_plans(professional_id,name,amount_cents,modality,terms) values($1,'Plano teste',30000,'Online','Condições originais') returning id",
        [tenant],
      )
    )[0].id;
    const key = crypto.randomUUID();
    const args = [plan, sid, '2027-01-01', '2027-12-31', '2027-01-31', 3, 1, key];
    const sql = 'select public.create_commercial_contract($1,$2,$3,$4,$5,$6,$7,$8) as id';
    const contract = (await asUser(owner, sql, args))[0].id;
    expect((await asUser(owner, sql, args))[0].id).toBe(contract);
    const bills = await asUser(
      owner,
      'select due_date::text,settled_cents from public.finance_balances where contract_id=$1 order by installment_number',
      [contract],
    );
    expect(bills.map((v) => v.due_date)).toEqual(['2027-01-31', '2027-02-28', '2027-03-31']);
    expect(bills.every((v) => Number(v.settled_cents) === 0)).toBe(true);
    await asUser(
      owner,
      "update public.commercial_plans set amount_cents=40000,terms='Condições novas' where id=$1",
      [plan],
    );
    const snapshot = (
      await asUser(student, 'select snapshot from public.commercial_contracts where id=$1', [
        contract,
      ])
    )[0].snapshot;
    expect(snapshot.amount_cents).toBe(30000);
    expect(snapshot.terms).toBe('Condições originais');
    await asUser(owner, "select public.cancel_commercial_contract($1,'Cancelado em teste',true)", [
      contract,
    ]);
    expect(
      (
        await asUser(owner, 'select status from public.finance_balances where contract_id=$1', [
          contract,
        ])
      ).every((v) => v.status === 'cancelled'),
    ).toBe(true);
  });
  it('generates recurring expenses explicitly, preserving the anchor and preventing duplicate generation', async () => {
    const id = (
      await asUser(
        owner,
        "insert into public.finance_recurrences(professional_id,direction,description,amount_cents,category,first_due_date,interval_months) values($1,'payable','Software de teste',9900,'Software','2027-01-31',1) returning id",
        [tenant],
      )
    )[0].id;
    expect(
      (
        await asUser(owner, "select public.generate_finance_recurrence($1,'2027-03-31') as count", [
          id,
        ])
      )[0].count,
    ).toBe(3);
    expect(
      (
        await asUser(owner, "select public.generate_finance_recurrence($1,'2027-03-31') as count", [
          id,
        ])
      )[0].count,
    ).toBe(0);
    const dates = await asUser(
      owner,
      'select due_date::text from public.finance_entries where recurrence_id=$1 order by occurrence_index',
      [id],
    );
    expect(dates.map((v) => v.due_date)).toEqual(['2027-01-31', '2027-02-28', '2027-03-31']);
    await asUser(owner, 'update public.finance_recurrences set active=false where id=$1', [id]);
    await expect(
      asUser(owner, "select public.generate_finance_recurrence($1,'2027-04-30')", [id]),
    ).rejects.toThrow(/pausada/i);
  });
  it('revokes student financial access when inactivated while preserving the ledger', async () => {
    const id = await entry();
    await pay(id, 100);
    await asUser(owner, "update public.students set status='inactive' where id=$1", [sid]);
    expect(await asUser(student, 'select * from public.finance_balances')).toHaveLength(0);
    expect(await asUser(student, 'select * from public.finance_payments')).toHaveLength(0);
    expect(
      await asUser(owner, 'select * from public.finance_payments where entry_id=$1', [id]),
    ).toHaveLength(1);
  });
  it('stores monthly fee and weekly attendance without creating financial entries or payments', async () => {
    const before = await db.query(
      'select (select count(*) from public.finance_entries)::int entries,(select count(*) from public.finance_payments)::int payments',
    );
    const created = await asUser(
      owner,
      'insert into public.students(professional_id,full_name,monthly_fee_cents,weekly_frequency) values($1,$2,35000,3) returning id,monthly_fee_cents,weekly_frequency',
      [tenant, 'Aluno com mensalidade de teste'],
    );
    expect(Number(created[0].monthly_fee_cents)).toBe(35000);
    expect(created[0].weekly_frequency).toBe(3);
    const after = await db.query(
      'select (select count(*) from public.finance_entries)::int entries,(select count(*) from public.finance_payments)::int payments',
    );
    expect(after.rows).toEqual(before.rows);
    expect(
      await asUser(other, 'select * from public.students where id=$1', [created[0].id]),
    ).toHaveLength(0);
    await expect(
      asUser(owner, 'update public.students set weekly_frequency=8 where id=$1', [created[0].id]),
    ).rejects.toThrow(/check constraint/);
    await expect(
      asUser(owner, 'update public.students set monthly_fee_cents=-1 where id=$1', [created[0].id]),
    ).rejects.toThrow(/check constraint/);
    const feeStudent = crypto.randomUUID();
    await db.query('insert into auth.users(id) values($1)', [feeStudent]);
    await db.query('update public.students set user_id=$1 where id=$2', [
      feeStudent,
      created[0].id,
    ]);
    expect(
      (
        await asUser(
          feeStudent,
          'select monthly_fee_cents,weekly_frequency from public.students where id=$1',
          [created[0].id],
        )
      )[0].weekly_frequency,
    ).toBe(3);
    expect(
      await asUser(
        feeStudent,
        'update public.students set monthly_fee_cents=100 where id=$1 returning id',
        [created[0].id],
      ),
    ).toHaveLength(0);
  });
});

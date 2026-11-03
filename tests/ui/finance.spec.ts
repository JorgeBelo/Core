import { test, expect, type Page } from '@playwright/test';
import { fixture, login } from './fixtures';
async function financialFixture(page: Page) {
  const base = await fixture(page);
  base.students.push({
    id: '30000000-0000-4000-8000-000000000020',
    professional_id: '20000000-0000-4000-8000-000000000001',
    full_name: 'Aluno financeiro de teste',
    status: 'active',
    email: '',
  });
  const entries: any[] = [],
    payments: any[] = [],
    adjustments: any[] = [],
    plans: any[] = [],
    contracts: any[] = [],
    recurrences: any[] = [],
    events: any[] = [];
  let sequence = 1;
  const id = () => `90000000-0000-4000-8000-${String(sequence++).padStart(12, '0')}`;
  const now = () => new Date().toISOString();
  const balance = (e: any) => {
    const settled = payments
      .filter((p) => p.entry_id === e.id)
      .reduce((n, p) => n + p.amount_cents, 0);
    const adjustment = adjustments
      .filter((a) => a.entry_id === e.id)
      .reduce((n, a) => n + a.amount_cents, 0);
    const total = e.amount_cents + adjustment;
    return {
      ...e,
      adjustment_cents: adjustment,
      total_cents: total,
      settled_cents: settled,
      balance_cents: total - settled,
      status: e.cancelled_at
        ? 'cancelled'
        : e.disputed
          ? 'disputed'
          : settled >= total
            ? 'paid'
            : settled
              ? 'partial'
              : 'upcoming',
    };
  };
  await page.route('http://127.0.0.1:54329/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      method = req.method();
    const resource = url.pathname.split('/').at(-1)!;
    const tables: Record<string, any[]> = {
      finance_entries: entries,
      finance_payments: payments,
      finance_adjustments: adjustments,
      finance_events: events,
      commercial_plans: plans,
      commercial_contracts: contracts,
      finance_recurrences: recurrences,
    };
    const handled =
      resource === 'finance_balances' ||
      resource === 'finance_report' ||
      resource in tables ||
      [
        'confirm_finance_payment',
        'reverse_finance_payment',
        'adjust_finance_entry',
        'set_finance_entry_state',
        'create_commercial_contract',
        'cancel_commercial_contract',
        'generate_finance_recurrence',
      ].includes(resource);
    if (!handled) {
      await route.fallback();
      return;
    }
    const headers: Record<string, string> = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Expose-Headers': 'content-range',
      'Content-Type': 'application/json',
    };
    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers });
      return;
    }
    let body: any = {};
    if (resource === 'finance_report') {
      const input = req.postDataJSON();
      const received = payments
          .filter((p) => entries.find((e) => e.id === p.entry_id)?.direction === 'receivable')
          .reduce((n, p) => n + p.amount_cents, 0),
        paid = payments
          .filter((p) => entries.find((e) => e.id === p.entry_id)?.direction === 'payable')
          .reduce((n, p) => n + p.amount_cents, 0);
      const open = (direction: string) =>
        entries
          .filter((e) => e.direction === direction && !e.cancelled_at)
          .reduce((n, e) => n + balance(e).balance_cents, 0);
      body = {
        from: input.p_from,
        to: input.p_to,
        received_cents: String(received),
        paid_cents: String(paid),
        cash_result_cents: String(received - paid),
        revenue_cents: String(
          entries
            .filter((e) => e.direction === 'receivable')
            .reduce((n, e) => n + e.amount_cents, 0),
        ),
        expense_cents: String(
          entries.filter((e) => e.direction === 'payable').reduce((n, e) => n + e.amount_cents, 0),
        ),
        accrual_result_cents: '0',
        receivable_cents: String(open('receivable')),
        payable_cents: String(open('payable')),
        overdue_cents: '0',
        monthly: [],
        by_category: [],
        by_student: [],
      };
    } else if (resource === 'confirm_finance_payment') {
      const v = req.postDataJSON();
      const p = {
        id: id(),
        entry_id: v.p_entry_id,
        amount_cents: v.p_amount_cents,
        effective_date: v.p_effective_date,
        method: v.p_method,
        note: v.p_note,
        reverses_id: null,
        idempotency_key: v.p_key,
        created_at: now(),
      };
      payments.push(p);
      body = p.id;
    } else if (resource === 'reverse_finance_payment') {
      const v = req.postDataJSON();
      const original = payments.find((p) => p.id === v.p_payment_id);
      const p = {
        ...original,
        id: id(),
        amount_cents: -original.amount_cents,
        reverses_id: original.id,
        effective_date: v.p_effective_date,
        note: v.p_reason,
        created_at: now(),
      };
      payments.push(p);
      body = p.id;
    } else if (resource === 'adjust_finance_entry') {
      const v = req.postDataJSON();
      const a = {
        id: id(),
        entry_id: v.p_entry_id,
        kind: v.p_kind,
        amount_cents: v.p_kind === 'discount' ? -v.p_amount_cents : v.p_amount_cents,
        reason: v.p_reason,
        created_at: now(),
      };
      adjustments.push(a);
      body = a.id;
    } else if (resource === 'set_finance_entry_state') {
      const v = req.postDataJSON(),
        e = entries.find((x) => x.id === v.p_entry_id);
      if (v.p_action === 'cancel') e.cancelled_at = now();
      else e.disputed = v.p_action === 'dispute';
      events.push({
        id: id(),
        entry_id: e.id,
        action: v.p_action,
        reason: v.p_reason,
        created_at: now(),
      });
      body = null;
    } else if (resource === 'create_commercial_contract') {
      const v = req.postDataJSON();
      const plan = plans.find((p) => p.id === v.p_plan_id);
      const c = {
        id: id(),
        plan_id: plan.id,
        student_id: v.p_student_id,
        snapshot: { ...plan },
        starts_on: v.p_starts_on,
        ends_on: v.p_ends_on,
        first_due_date: v.p_first_due_date,
        installments: v.p_installments,
        interval_months: v.p_interval_months,
        cancelled_at: null,
        created_at: now(),
      };
      contracts.push(c);
      for (let i = 0; i < c.installments; i++)
        entries.push({
          id: id(),
          professional_id: plan.professional_id,
          student_id: c.student_id,
          direction: 'receivable',
          description: `${plan.name} · ${i + 1}/${c.installments}`,
          amount_cents: plan.amount_cents,
          category: plan.modality,
          due_date: c.first_due_date,
          competence_date: c.starts_on,
          contract_id: c.id,
          installment_number: i + 1,
          cancelled_at: null,
          disputed: false,
          updated_at: now(),
        });
      body = c.id;
    } else if (resource === 'generate_finance_recurrence') {
      const v = req.postDataJSON(),
        r = recurrences.find((x) => x.id === v.p_recurrence_id);
      if (!r.generated_count) {
        entries.push({
          ...r,
          id: id(),
          due_date: r.first_due_date,
          competence_date: r.first_due_date,
          recurrence_id: r.id,
          cancelled_at: null,
          disputed: false,
        });
        r.generated_count = 1;
        body = 1;
      } else body = 0;
    } else if (resource === 'cancel_commercial_contract') {
      const v = req.postDataJSON();
      contracts.find((c) => c.id === v.p_contract_id).cancelled_at = now();
      body = null;
    } else {
      const collection = tables[resource] ?? [];
      if (method === 'POST') {
        const row = {
          ...req.postDataJSON(),
          id: id(),
          active: true,
          generated_count: 0,
          cancelled_at: null,
          disputed: false,
          created_at: now(),
          updated_at: now(),
        };
        collection.push(row);
        body = [row];
      } else if (method === 'PATCH') {
        const row = collection.find((v) => 'eq.' + v.id === url.searchParams.get('id'));
        if (row) Object.assign(row, req.postDataJSON(), { updated_at: now() });
        body = row ? [row] : [];
      } else {
        body = resource === 'finance_balances' ? entries.map(balance) : [...collection];
        if (url.searchParams.get('order')?.includes('created_at.desc')) body.reverse();
        for (const key of [
          'id',
          'entry_id',
          'direction',
          'status',
          'contract_id',
          'professional_id',
          'client_key',
        ]) {
          const value = url.searchParams.get(key);
          if (value?.startsWith('eq.'))
            body = body.filter((x: any) => String(x[key]) === value.slice(3));
        }
        headers['content-range'] = `0-${Math.max(0, body.length - 1)}/${body.length}`;
      }
      if (req.headers().accept?.includes('vnd.pgrst.object+json')) body = body[0] ?? null;
    }
    await route.fulfill({ status: 200, headers, body: JSON.stringify(body) });
  });
  return { entries, payments, plans, contracts };
}
async function newEntry(page: Page, kind: 'receivable' | 'payable', name: string, amount: string) {
  await page.getByRole('link', { name: 'Financeiro', exact: true }).click();
  await page
    .getByRole('button', { name: kind === 'receivable' ? 'A receber' : 'A pagar', exact: true })
    .click();
  await page
    .getByRole('button', {
      name: kind === 'receivable' ? 'Nova cobrança prevista' : 'Nova despesa prevista',
      exact: false,
    })
    .click();
  await page.getByRole('textbox', { name: 'Descrição *', exact: true }).fill(name);
  await page.getByRole('textbox', { name: 'Valor original em reais *', exact: true }).fill(amount);
  await page.getByRole('button', { name: 'Criar conta prevista', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Saldo em aberto:', exact: false })).toBeVisible();
}
test('receivable is confirmed partially, settled and reversed with explicit manual actions', async ({
  page,
}, info) => {
  const state = await financialFixture(page);
  await login(page);
  await newEntry(page, 'receivable', 'Consultoria UI de teste', '300,00');
  await page.getByRole('button', { name: 'Registrar recebimento', exact: true }).click();
  await page.getByRole('textbox', { name: 'Valor em reais *', exact: true }).fill('100,00');
  await page.getByRole('button', { name: 'Confirmar recebimento', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Saldo em aberto: R$ 200,00', exact: true }),
  ).toBeVisible();
  expect(state.payments[0].amount_cents).toBe(10000);
  await page.getByRole('button', { name: 'Registrar recebimento', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar recebimento', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Saldo em aberto: R$ 0,00', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Estornar este registro', exact: true }).first().click();
  await page
    .getByRole('textbox', { name: 'Justificativa *', exact: true })
    .fill('Correção UI de teste');
  await page.getByRole('button', { name: 'Registrar estorno integral', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Saldo em aberto: R$ 200,00', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page
    .getByRole('heading', { name: 'Saldo em aberto: R$ 200,00', exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `work/qa-finance-fixture-${info.project.name}.png`,
    fullPage: true,
  });
});
test('operational expense appears as a manual outgoing payment', async ({ page }) => {
  const state = await financialFixture(page);
  await login(page);
  await newEntry(page, 'payable', 'Software UI de teste', '99,90');
  await page.getByRole('button', { name: 'Registrar pagamento', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar pagamento', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Saldo em aberto: R$ 0,00', exact: true }),
  ).toBeVisible();
  expect(state.payments[0].amount_cents).toBe(9990);
  await page.getByRole('button', { name: 'Visão geral', exact: true }).click();
  await expect(page.getByText('Desembolsos líquidos', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '-R$ 99,90', exact: true })).toBeVisible();
});
test('plan and contract generate forecast installments without recording a payment', async ({
  page,
}) => {
  const state = await financialFixture(page);
  await login(page);
  await page.getByRole('link', { name: 'Financeiro', exact: true }).click();
  await page.getByRole('button', { name: 'Planos', exact: true }).click();
  await page.getByRole('button', { name: 'Novo plano', exact: false }).click();
  await page
    .getByRole('textbox', { name: 'Nome do plano *', exact: true })
    .fill('Plano UI de teste');
  await page
    .getByRole('textbox', { name: 'Valor por cobrança em reais *', exact: true })
    .fill('300,00');
  await page.getByRole('button', { name: 'Salvar plano', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Plano UI de teste', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Contratos', exact: true }).click();
  await page.getByRole('button', { name: 'Novo contrato', exact: false }).click();
  await page
    .getByRole('button', { name: 'Plano UI de teste · R$ 300,00 por parcela', exact: true })
    .click();
  await page.getByRole('button', { name: 'Selecionar aluno do contrato', exact: true }).click();
  await page.getByRole('button', { name: 'Selecionar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Escolher aluno', exact: true })).toBeHidden();
  await page
    .getByRole('textbox', { name: 'Fim da vigência (AAAA-MM-DD)', exact: true })
    .fill('2027-12-31');
  await expect(
    page.getByRole('textbox', { name: 'Fim da vigência (AAAA-MM-DD)', exact: true }),
  ).toHaveValue('2027-12-31');
  await page.getByRole('textbox', { name: 'Quantidade de parcelas', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Quantidade de parcelas', exact: true })
    .press('ControlOrMeta+A');
  await page
    .getByRole('textbox', { name: 'Quantidade de parcelas', exact: true })
    .pressSequentially('3');
  await expect(
    page.getByRole('textbox', { name: 'Quantidade de parcelas', exact: true }),
  ).toHaveValue('3');
  await page.getByRole('textbox', { name: 'Quantidade de parcelas', exact: true }).press('Tab');
  await page.getByRole('button', { name: 'Revisar contrato', exact: true }).click();
  await expect(page.getByText('Total contratado: R$ 900,00', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'Confirmar contrato e gerar parcelas', exact: true })
    .click();
  await expect(
    page.getByText('Contrato e parcelas previstos registrados. Nenhum pagamento foi confirmado.', {
      exact: true,
    }),
  ).toBeVisible();
  expect(state.entries).toHaveLength(3);
  expect(state.payments).toHaveLength(0);
});
test('recurrence generation is explicit and may be paused', async ({ page }) => {
  await financialFixture(page);
  await login(page);
  await page.getByRole('link', { name: 'Financeiro', exact: true }).click();
  await page.getByRole('button', { name: 'Recorrências', exact: true }).click();
  await page.getByRole('button', { name: 'Nova recorrência', exact: false }).click();
  await page
    .getByRole('textbox', { name: 'Descrição da recorrência', exact: true })
    .fill('Academia UI de teste');
  await page
    .getByRole('textbox', { name: 'Valor por ocorrência em reais', exact: true })
    .fill('250,00');
  await page.getByRole('button', { name: 'Salvar recorrência', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Academia UI de teste', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Gerar contas previstas', exact: true }).click();
  await expect(
    page.getByText('1 conta(s) prevista(s) gerada(s), sem confirmar pagamentos.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Pausar recorrência', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Gerar contas previstas', exact: true }),
  ).toBeDisabled();
});

import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import { fixture, login } from './fixtures';
import { businessDate } from '../../packages/domain/src/messages';
test('professional saves an optional CREF and may clear it later', async ({ page }) => {
  const state = await fixture(page);
  await login(page);
  await page.getByRole('link', { name: 'Minha conta', exact: true }).click();
  await page.getByRole('textbox', { name: 'CREF (opcional)', exact: true }).fill('123456-G/SP');
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click();
  await expect(page.getByText('Perfil salvo.', { exact: true })).toBeVisible();
  expect(state.professional.cref).toBe('123456-G/SP');
  await expect(page.getByRole('textbox', { name: 'CREF (opcional)', exact: true })).toHaveValue(
    '123456-G/SP',
  );
  await page.getByRole('textbox', { name: 'CREF (opcional)', exact: true }).fill('');
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'CREF (opcional)', exact: true })).toHaveValue('');
  await expect.poll(() => state.professional.cref).toBe('');
});
test('PDF exports the complete portfolio across API pages, independently of the visible search', async ({
  page,
}, info) => {
  const state = await fixture(page);
  for (let i = 1; i <= 205; i++)
    state.students.push({
      id: `30000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      professional_id: state.professional.id,
      full_name: `Aluno PDF ${String(i).padStart(3, '0')}`,
      status: 'active',
      modality: 'in_person',
      phone: '(11) 99999-0000',
      email: `aluno${i}@example.test`,
      weekly_frequency: 3,
      monthly_fee_cents: null,
    });
  let pages = 0;
  page.on('request', (r) => {
    if (r.url().includes('/students?') && new URL(r.url()).searchParams.get('limit') === '200')
      pages++;
  });
  await login(page);
  await page.getByRole('link', { name: 'Alunos', exact: true }).click();
  await page.getByRole('textbox', { name: 'Buscar aluno', exact: true }).fill('001');
  await expect(page.getByText('1 aluno(s) encontrado(s)', { exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar todos em PDF', exact: true }).click();
  const file = await download;
  await file.saveAs(`work/pdf-qa/download-${info.project.name}.pdf`);
  const pdf = await PDFDocument.load(await readFile(await file.path()));
  expect(pdf.getPageCount()).toBeGreaterThan(1);
  expect(file.suggestedFilename()).toMatch(/^core-alunos-.*\.pdf$/);
  expect(pages).toBe(2);
});
test('WhatsApp birthday text is personalized and only opens a conversation with explicit consent', async ({
  page,
}) => {
  const state = await fixture(page),
    date = businessDate();
  state.students.push(
    {
      id: '30000000-0000-4000-8000-000000000001',
      professional_id: state.professional.id,
      full_name: 'Ana de teste',
      status: 'active',
      birth_date: '1990-' + date.slice(5),
      phone: '(11) 99999-0000',
      email: '',
      gender: 'female',
      whatsapp_opt_in: true,
    },
    {
      id: '30000000-0000-4000-8000-000000000002',
      professional_id: state.professional.id,
      full_name: 'Pedro de teste',
      status: 'active',
      birth_date: '1990-' + date.slice(5),
      phone: '(11) 99999-0001',
      email: '',
      gender: 'male',
      whatsapp_opt_in: false,
    },
  );
  await page.addInitScript(() => {
    (window as any).openedWhatsApp = [];
    window.open = ((url: string) => {
      (window as any).openedWhatsApp.push(String(url));
      return null;
    }) as typeof window.open;
  });
  await login(page);
  await page.getByRole('button', { name: 'Mensagens', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Envio automático: não conectado', exact: true }),
  ).toBeVisible();
  await page.getByRole('radio', { name: 'Aniversários', exact: true }).click();
  await expect(
    page.getByText('Parabéns, Ana! Que você se sinta muito querida', { exact: false }),
  ).toBeVisible();
  const buttons = page.getByRole('button', { name: 'Abrir no WhatsApp', exact: true });
  await expect(buttons).toHaveCount(2);
  await expect(buttons.nth(1)).toBeDisabled();
  await buttons.first().click();
  const urls = await page.evaluate(() => (window as any).openedWhatsApp as string[]);
  expect(urls).toHaveLength(1);
  expect(urls[0]).toContain('https://wa.me/5511999990000');
  expect(decodeURIComponent(urls[0])).toContain('Parabéns, Ana!');
  await expect(
    page.getByText('Conversa aberta. Confira a mensagem e confirme o envio no WhatsApp.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('radio', { name: 'Modelos', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Aviso de vencimento', exact: true })
    .fill('Olá, {nome}! Seu pagamento de {valor} vence em {vencimento}. {personal}');
  await page.getByRole('button', { name: 'Salvar modelos', exact: true }).click();
  await expect(page.getByText('Modelos salvos.', { exact: true })).toBeVisible();
});

test('payment reminders use today and the outstanding balance, excluding settled and disputed charges', async ({
  page,
}) => {
  const state = await fixture(page),
    today = businessDate();
  const sid = '30000000-0000-4000-8000-000000000001';
  state.students.push({
    id: sid,
    professional_id: state.professional.id,
    full_name: 'Ana de teste',
    status: 'active',
    phone: '(11) 99999-0000',
    whatsapp_opt_in: true,
    email: '',
    birth_date: '',
    gender: 'female',
  });
  const base = {
    professional_id: state.professional.id,
    student_id: sid,
    direction: 'receivable',
    due_date: today,
    cancelled_at: null,
    disputed: false,
    balance_cents: 20000,
  };
  const rows = [
    { ...base, id: '1', description: 'Mensalidade parcial' },
    { ...base, id: '2', description: 'Cobrança quitada', balance_cents: 0 },
    { ...base, id: '3', description: 'Cobrança contestada', disputed: true },
    { ...base, id: '4', description: 'Vencimento futuro', due_date: '2099-01-01' },
  ];
  await page.route('http://127.0.0.1:54329/rest/v1/finance_balances?*', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fallback();
      return;
    }
    const params = new URL(route.request().url()).searchParams;
    const filtered = rows.filter((row) =>
      [...params].every(([key, value]) => {
        if (!(key in row)) return true;
        const actual = row[key as keyof typeof row];
        if (value.startsWith('eq.')) return String(actual) === value.slice(3);
        if (value.startsWith('gt.')) return Number(actual) > Number(value.slice(3));
        if (value === 'is.null') return actual === null;
        return true;
      }),
    );
    await route.fulfill({
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify(filtered),
    });
  });
  await login(page);
  await page.getByRole('button', { name: 'Mensagens', exact: true }).click();
  await expect(
    page.getByText('Olá, Ana! Lembrete: o pagamento de R$ 200,00 vence hoje', { exact: false }),
  ).toBeVisible();
  await expect(page.getByText('Cobrança quitada', { exact: false })).toHaveCount(0);
  await expect(page.getByText('Cobrança contestada', { exact: false })).toHaveCount(0);
  await expect(page.getByText('Vencimento futuro', { exact: false })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Abrir no WhatsApp', exact: true })).toHaveCount(1);
});

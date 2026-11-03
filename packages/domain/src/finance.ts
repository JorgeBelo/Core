import { z } from 'zod';
export const MAX_CENTS = 1_000_000_000_000;
export function parseBRL(value: string): number {
  const text = value.replace(/^\s*R\$\s*/, '').trim();
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(text))
    throw new Error('Use um valor em reais, como 300,00.');
  const [whole, fraction = ''] = text.replace(/\./g, '').split(',');
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (cents < 1n || cents > BigInt(MAX_CENTS))
    throw new Error('Informe um valor positivo dentro do limite permitido.');
  return Number(cents);
}
export function formatBRL(value: string | number | bigint): string {
  const cents = BigInt(value);
  const absolute = cents < 0n ? -cents : cents;
  return `${cents < 0n ? '-' : ''}R$ ${new Intl.NumberFormat('pt-BR').format(absolute / 100n)},${String(absolute % 100n).padStart(2, '0')}`;
}
export function centsInput(value: number): string {
  return `${Math.floor(value / 100)},${String(value % 100).padStart(2, '0')}`;
}
export const financeDate = z
  .string()
  .refine(
    (v) =>
      /^\d{4}-\d{2}-\d{2}$/.test(v) &&
      !Number.isNaN(Date.parse(v)) &&
      new Date(v + 'T12:00:00Z').toISOString().slice(0, 10) === v,
    'Use uma data válida no formato AAAA-MM-DD.',
  );
const cents = z.number().int().min(1).max(MAX_CENTS);
export const entrySchema = z
  .object({
    direction: z.enum(['receivable', 'payable']),
    student_id: z.uuid().nullable(),
    description: z.string().trim().min(3).max(200),
    amount_cents: cents,
    category: z.string().trim().min(2).max(80),
    due_date: financeDate,
    competence_date: financeDate,
  })
  .refine(
    (v) => v.direction === 'receivable' || v.student_id === null,
    'Despesas operacionais não devem ser vinculadas ao aluno.',
  );
export type EntryInput = z.infer<typeof entrySchema>;
export type FinanceStatus = 'upcoming' | 'overdue' | 'partial' | 'paid' | 'cancelled' | 'disputed';
export const statusLabels: Record<FinanceStatus, string> = {
  upcoming: 'A vencer',
  overdue: 'Vencido',
  partial: 'Parcial',
  paid: 'Liquidado',
  cancelled: 'Cancelado',
  disputed: 'Em contestação',
};
export const paymentMethods = {
  pix: 'PIX manual',
  cash: 'Dinheiro',
  card: 'Cartão (registro manual)',
  transfer: 'Transferência',
  other: 'Outro',
};
export type FinanceEntry = EntryInput & {
  id: string;
  professional_id: string;
  contract_id: string | null;
  installment_number: number | null;
  recurrence_id: string | null;
  status: FinanceStatus;
  total_cents: number;
  settled_cents: number;
  balance_cents: number;
  adjustment_cents: number;
  cancelled_at: string | null;
  disputed: boolean;
  updated_at: string;
  student_name?: string;
};
export const planSchema = z.object({
  name: z.string().trim().min(3).max(160),
  amount_cents: cents,
  modality: z.string().trim().min(2).max(80),
  frequency: z.number().int().min(1).max(7).nullable(),
  duration_months: z.number().int().min(1).max(120),
  terms: z.string().trim().max(10000),
  cancellation_notice_hours: z.number().int().min(0).max(8760),
  makeups_per_month: z.number().int().min(0).max(100),
  makeup_expiry_days: z.number().int().min(1).max(730),
  active: z.boolean(),
});
export type PlanInput = z.infer<typeof planSchema>;
export type CommercialPlan = PlanInput & {
  id: string;
  professional_id: string;
  created_at: string;
  updated_at: string;
};
export const contractSchema = z
  .object({
    plan_id: z.uuid(),
    student_id: z.uuid(),
    starts_on: financeDate,
    ends_on: financeDate,
    first_due_date: financeDate,
    installments: z.number().int().min(1).max(120),
    interval_months: z.number().int().min(1).max(12),
  })
  .refine(
    (v) => v.ends_on >= v.starts_on,
    'O fim do contrato deve ser posterior ou igual ao início.',
  );
export type ContractInput = z.infer<typeof contractSchema>;
export type CommercialContract = ContractInput & {
  id: string;
  professional_id: string;
  snapshot: PlanInput;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  student_name?: string;
};
export const recurrenceSchema = z
  .object({
    direction: z.enum(['receivable', 'payable']),
    student_id: z.uuid().nullable(),
    description: z.string().trim().min(3).max(200),
    amount_cents: cents,
    category: z.string().trim().min(2).max(80),
    first_due_date: financeDate,
    interval_months: z.number().int().min(1).max(12),
    ends_on: financeDate.nullable(),
  })
  .refine(
    (v) => v.direction === 'receivable' || v.student_id === null,
    'Despesas não devem ser vinculadas ao aluno.',
  )
  .refine(
    (v) => !v.ends_on || v.ends_on >= v.first_due_date,
    'O fim da recorrência não pode ser anterior ao início.',
  );
export type RecurrenceInput = z.infer<typeof recurrenceSchema>;
export type FinanceRecurrence = RecurrenceInput & {
  id: string;
  professional_id: string;
  generated_count: number;
  active: boolean;
  updated_at: string;
};
export type FinancePayment = {
  id: string;
  entry_id: string;
  amount_cents: number;
  effective_date: string;
  method: keyof typeof paymentMethods;
  note: string;
  reverses_id: string | null;
  created_at: string;
};
export type FinanceAdjustment = {
  id: string;
  kind: 'discount' | 'fee' | 'interest';
  amount_cents: number;
  reason: string;
  created_at: string;
};
export type FinanceEvent = {
  id: string;
  action: string;
  reason: string;
  previous_values: Record<string, unknown> | null;
  current_values: Record<string, unknown> | null;
  created_at: string;
};
export type FinanceReport = {
  from: string;
  to: string;
  received_cents: string;
  paid_cents: string;
  cash_result_cents: string;
  revenue_cents: string;
  expense_cents: string;
  accrual_result_cents: string;
  receivable_cents: string;
  payable_cents: string;
  overdue_cents: string;
  monthly: {
    month: string;
    received_cents: string;
    paid_cents: string;
    forecast_receivable_cents: string;
    forecast_payable_cents: string;
  }[];
  by_category: { direction: 'receivable' | 'payable'; category: string; amount_cents: string }[];
  by_student: { student_name: string; amount_cents: string }[];
};

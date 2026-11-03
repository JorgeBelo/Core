import type { SupabaseClient } from '@supabase/supabase-js';
import {
  entrySchema,
  planSchema,
  contractSchema,
  recurrenceSchema,
  type EntryInput,
  type FinanceEntry,
  type PlanInput,
  type CommercialPlan,
  type ContractInput,
  type CommercialContract,
  type FinanceRecurrence,
  type RecurrenceInput,
  type FinancePayment,
  type FinanceAdjustment,
  type FinanceEvent,
  type FinanceReport,
  type FinanceStatus,
  type paymentMethods,
} from '@core/domain';
export function readableFinanceError(error: unknown): string {
  const e = error as { code?: string; message?: string };
  if (
    e?.code === '22023' &&
    /^(Dados|Condições|O valor|Estorne|Pagamento|Recorrência|Resolva|Conta|Plano|Cancelamento|Ajuste|O ajuste|Ação|Período)/.test(
      e.message ?? '',
    )
  )
    return e.message!;
  if (e?.code === '23505')
    return 'Esta operação já foi registrada com outros dados. Atualize a tela antes de tentar novamente.';
  if (e?.code === '42501') return 'Seu perfil não tem acesso a esta operação financeira.';
  if (e?.message?.startsWith('Este cadastro')) return e.message;
  return 'Não foi possível concluir a operação financeira. Confira a conexão, atualize os dados e tente novamente.';
}
export function createFinanceRepository(client: SupabaseClient) {
  async function names(ids: string[]) {
    if (!ids.length) return {};
    const { data, error } = await client
      .from('students')
      .select('id,full_name')
      .in('id', [...new Set(ids)]);
    if (error) throw error;
    return Object.fromEntries((data ?? []).map((s) => [s.id, s.full_name]));
  }
  return {
    async dueToday(professionalId: string, date: string) {
      const result: FinanceEntry[] = [];
      let cursor: string | undefined;
      for (;;) {
        let query = client
          .from('finance_balances')
          .select('*')
          .eq('professional_id', professionalId)
          .eq('direction', 'receivable')
          .eq('due_date', date)
          .is('cancelled_at', null)
          .eq('disputed', false)
          .gt('balance_cents', 0)
          .order('id')
          .limit(200);
        if (cursor) query = query.gt('id', cursor);
        const { data, error } = await query;
        if (error) throw error;
        const rows = (data ?? []) as FinanceEntry[];
        result.push(...rows);
        if (rows.length < 200) return result;
        const next = rows[rows.length - 1].id;
        if (next === cursor) throw new Error('Não foi possível carregar os vencimentos completos.');
        cursor = next;
      }
    },
    async studentEntries(studentId: string, page = 0) {
      const { data, count, error } = await client
        .from('finance_balances')
        .select('*', { count: 'exact' })
        .eq('student_id', studentId)
        .eq('direction', 'receivable')
        .order('due_date', { ascending: false })
        .order('id')
        .range(page * 20, page * 20 + 19);
      if (error) throw error;
      return { items: (data ?? []) as FinanceEntry[], count: count ?? 0 };
    },
    async entries(
      direction: 'receivable' | 'payable',
      page = 0,
      status: FinanceStatus | 'all' = 'all',
      search = '',
      contractId?: string,
    ) {
      let query = client
        .from('finance_balances')
        .select('*', { count: 'exact' })
        .eq('direction', direction)
        .order('due_date')
        .order('id')
        .range(page * 20, page * 20 + 19);
      if (status !== 'all') query = query.eq('status', status);
      if (contractId) query = query.eq('contract_id', contractId);
      const term = search
        .replace(/[%_\\(),.*]/g, '')
        .trim()
        .slice(0, 200);
      if (term) query = query.ilike('description', `%${term}%`);
      const { data, count, error } = await query;
      if (error) throw error;
      const students = await names(
        (data ?? []).flatMap((e) => (e.student_id ? [e.student_id] : [])),
      );
      return {
        items: (data ?? []).map((e) => ({
          ...e,
          student_name: students[e.student_id],
        })) as FinanceEntry[],
        count: count ?? 0,
      };
    },
    async entry(id: string): Promise<FinanceEntry> {
      const { data, error } = await client
        .from('finance_balances')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      const students = await names(data.student_id ? [data.student_id] : []);
      return { ...data, student_name: students[data.student_id] };
    },
    async saveEntry(
      input: EntryInput,
      professionalId: string,
      existing?: FinanceEntry,
      creationKey?: string,
    ) {
      const parsed = entrySchema.parse(input);
      const { description, category, due_date, competence_date } = parsed;
      const request = existing
        ? client
            .from('finance_entries')
            .update({ description, category, due_date, competence_date })
            .eq('id', existing.id)
            .eq('updated_at', existing.updated_at)
        : client.from('finance_entries').insert({
            ...parsed,
            professional_id: professionalId,
            client_key: creationKey ?? null,
          });
      const { data, error } = await request.select().maybeSingle();
      if (error?.code === '23505' && !existing && creationKey) {
        const retry = await client
          .from('finance_entries')
          .select('*')
          .eq('professional_id', professionalId)
          .eq('client_key', creationKey)
          .maybeSingle();
        if (
          !retry.error &&
          retry.data &&
          Object.entries(parsed).every(([key, value]) => retry.data[key] === value)
        )
          return retry.data;
      }
      if (error) throw error;
      if (!data)
        throw new Error('Este cadastro foi alterado em outra sessão. Recarregue antes de salvar.');
      return data;
    },
    async ledger(id: string, includeEvents = true) {
      const [p, a, e] = await Promise.all([
        client
          .from('finance_payments')
          .select('*')
          .eq('entry_id', id)
          .order('created_at', { ascending: false }),
        client
          .from('finance_adjustments')
          .select('*')
          .eq('entry_id', id)
          .order('created_at', { ascending: false }),
        includeEvents
          ? client
              .from('finance_events')
              .select('*')
              .eq('entry_id', id)
              .order('created_at', { ascending: false })
              .limit(50)
          : Promise.resolve({ data: [], error: null }),
      ]);
      for (const r of [p, a, e]) if (r.error) throw r.error;
      return {
        payments: (p.data ?? []) as FinancePayment[],
        adjustments: (a.data ?? []) as FinanceAdjustment[],
        events: (e.data ?? []) as FinanceEvent[],
      };
    },
    async payment(
      id: string,
      amount: number,
      date: string,
      method: keyof typeof paymentMethods,
      note: string,
      key: string,
    ) {
      const { data, error } = await client.rpc('confirm_finance_payment', {
        p_entry_id: id,
        p_amount_cents: amount,
        p_effective_date: date,
        p_method: method,
        p_note: note,
        p_key: key,
      });
      if (error) throw error;
      return data;
    },
    async reverse(id: string, date: string, reason: string, key: string) {
      const { data, error } = await client.rpc('reverse_finance_payment', {
        p_payment_id: id,
        p_effective_date: date,
        p_reason: reason,
        p_key: key,
      });
      if (error) throw error;
      return data;
    },
    async adjust(
      id: string,
      kind: 'discount' | 'fee' | 'interest',
      amount: number,
      reason: string,
      key: string,
    ) {
      const { data, error } = await client.rpc('adjust_finance_entry', {
        p_entry_id: id,
        p_kind: kind,
        p_amount_cents: amount,
        p_reason: reason,
        p_key: key,
      });
      if (error) throw error;
      return data;
    },
    async state(id: string, action: 'cancel' | 'dispute' | 'resolve', reason: string) {
      const { error } = await client.rpc('set_finance_entry_state', {
        p_entry_id: id,
        p_action: action,
        p_reason: reason,
      });
      if (error) throw error;
    },
    async plans(page = 0) {
      const { data, count, error } = await client
        .from('commercial_plans')
        .select('*', { count: 'exact' })
        .order('name')
        .order('id')
        .range(page * 20, page * 20 + 19);
      if (error) throw error;
      return { items: (data ?? []) as CommercialPlan[], count: count ?? 0 };
    },
    async savePlan(input: PlanInput, professionalId: string, existing?: CommercialPlan) {
      const values = planSchema.parse(input);
      const request = existing
        ? client
            .from('commercial_plans')
            .update(values)
            .eq('id', existing.id)
            .eq('updated_at', existing.updated_at)
        : client.from('commercial_plans').insert({ ...values, professional_id: professionalId });
      const { data, error } = await request.select().maybeSingle();
      if (error) throw error;
      if (!data)
        throw new Error('Este cadastro foi alterado em outra sessão. Recarregue antes de salvar.');
      return data as CommercialPlan;
    },
    async contracts(page = 0) {
      const { data, count, error } = await client
        .from('commercial_contracts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * 20, page * 20 + 19);
      if (error) throw error;
      const students = await names((data ?? []).map((c) => c.student_id));
      return {
        items: (data ?? []).map((c) => ({
          ...c,
          student_name: students[c.student_id],
        })) as CommercialContract[],
        count: count ?? 0,
      };
    },
    async createContract(input: ContractInput, key: string) {
      const v = contractSchema.parse(input);
      const { data, error } = await client.rpc('create_commercial_contract', {
        p_plan_id: v.plan_id,
        p_student_id: v.student_id,
        p_starts_on: v.starts_on,
        p_ends_on: v.ends_on,
        p_first_due_date: v.first_due_date,
        p_installments: v.installments,
        p_interval_months: v.interval_months,
        p_key: key,
      });
      if (error) throw error;
      return data;
    },
    async cancelContract(id: string, reason: string, cancelUnpaid: boolean) {
      const { error } = await client.rpc('cancel_commercial_contract', {
        p_contract_id: id,
        p_reason: reason,
        p_cancel_unpaid: cancelUnpaid,
      });
      if (error) throw error;
    },
    async recurrences(page = 0) {
      const { data, count, error } = await client
        .from('finance_recurrences')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * 20, page * 20 + 19);
      if (error) throw error;
      return { items: (data ?? []) as FinanceRecurrence[], count: count ?? 0 };
    },
    async createRecurrence(input: RecurrenceInput, professionalId: string) {
      const { error } = await client
        .from('finance_recurrences')
        .insert({ ...recurrenceSchema.parse(input), professional_id: professionalId });
      if (error) throw error;
    },
    async pauseRecurrence(id: string, active: boolean) {
      const { error } = await client.from('finance_recurrences').update({ active }).eq('id', id);
      if (error) throw error;
    },
    async generate(id: string, until: string) {
      const { data, error } = await client.rpc('generate_finance_recurrence', {
        p_recurrence_id: id,
        p_until: until,
      });
      if (error) throw error;
      return data as number;
    },
    async report(from: string, to: string): Promise<FinanceReport> {
      const { data, error } = await client.rpc('finance_report', { p_from: from, p_to: to });
      if (error) throw error;
      return data;
    },
  };
}

import { supabase } from '../lib/supabaseClient';

export interface MensalidadeRow {
  id: string;
  personal_id: string;
  aluno_id: string;
  due_date: string;
  amount: number;
  status: 'pago' | 'pendente' | 'atrasado';
  paid_date: string | null;
  payment_method?: string | null;
  created_at: string;
  updated_at: string;
}

/** Primeiro dia do mês em YYYY-MM-DD (data local, sem fuso) */
export function getFirstDayOfMonth(year: number, month: number): string {
  const m = String(month).padStart(2, '0');
  return `${year}-${m}-01`;
}

/** Último dia do mês em YYYY-MM-DD (data local; month 1-12) */
export function getLastDayOfMonth(year: number, month: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  const m = String(month).padStart(2, '0');
  const d = String(lastDay).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/** Verifica se o aluno está ativo no mês (considera data_inativacao e data_reativacao). */
export function isAlunoAtivoNoMes(aluno: { data_inativacao?: string | null; data_reativacao?: string | null }, year: number, month: number): boolean {
  const lastDay = getLastDayOfMonth(year, month);
  const inativacao = aluno.data_inativacao ? String(aluno.data_inativacao).trim().slice(0, 10) : '';
  const reativacao = aluno.data_reativacao ? String(aluno.data_reativacao).trim().slice(0, 10) : '';
  const inativoNesteMes = inativacao.length >= 10 && inativacao <= lastDay;
  const reativadoAteEsteMes = reativacao.length >= 10 && reativacao <= lastDay;
  if (!inativoNesteMes) return true;
  return !!reativadoAteEsteMes;
}

/** Garante que todos os alunos que estavam ativos naquele mês tenham mensalidade. Cria as que faltam com status pendente. */
export async function ensureMensalidadesForMonth(
  personalId: string,
  year: number,
  month: number
): Promise<void> {
  const dueDate = getFirstDayOfMonth(year, month);
  const lastDay = getLastDayOfMonth(year, month);

  const { data: todosAlunos, error: alunosError } = await supabase
    .from('alunos')
    .select('id, monthly_fee, data_inativacao, data_reativacao')
    .eq('personal_id', personalId);

  if (alunosError) throw alunosError;
  const alunos = (todosAlunos || []).filter((a: any) => isAlunoAtivoNoMes(a, year, month));
  if (!alunos.length) return;

  const { data: existentes, error: existError } = await supabase
    .from('mensalidades')
    .select('aluno_id')
    .eq('personal_id', personalId)
    .eq('due_date', dueDate);

  if (existError) throw existError;
  const idsExistentes = new Set((existentes || []).map((r: any) => r.aluno_id));

  const toInsert = alunos
    .filter((a: any) => !idsExistentes.has(a.id))
    .map((a: any) => ({
      personal_id: personalId,
      aluno_id: a.id,
      due_date: dueDate,
      amount: typeof a.monthly_fee === 'number' ? a.monthly_fee : parseFloat(String(a.monthly_fee)) || 0,
      status: 'pendente',
      paid_date: null,
    }));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from('mensalidades').insert(toInsert);
    if (insertError) throw insertError;
  }
}

/** Busca mensalidades do mês (due_date = primeiro dia do mês) */
export async function getMensalidadesForMonth(
  personalId: string,
  year: number,
  month: number
): Promise<MensalidadeRow[]> {
  const dueDate = getFirstDayOfMonth(year, month);
  const { data, error } = await supabase
    .from('mensalidades')
    .select('*')
    .eq('personal_id', personalId)
    .eq('due_date', dueDate)
    .order('aluno_id');

  if (error) throw error;
  return (data || []) as MensalidadeRow[];
}

/** Atualiza status e paid_date de uma mensalidade */
export async function updateMensalidadeStatus(
  id: string,
  status: 'pago' | 'pendente' | 'atrasado',
  paidDate?: string | null
): Promise<void> {
  const payload: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === 'pago') payload.paid_date = paidDate || new Date().toISOString().slice(0, 10);
  else payload.paid_date = null;

  const { error } = await supabase.from('mensalidades').update(payload).eq('id', id);
  if (error) throw error;
}

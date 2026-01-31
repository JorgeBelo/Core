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

/** Garante que todos os alunos tenham mensalidade no mês. Cria as que faltam com status pendente. */
export async function ensureMensalidadesForMonth(
  personalId: string,
  year: number,
  month: number
): Promise<void> {
  const dueDate = getFirstDayOfMonth(year, month);

  const { data: todosAlunos, error: alunosError } = await supabase
    .from('alunos')
    .select('id, monthly_fee')
    .eq('personal_id', personalId);

  if (alunosError) throw alunosError;
  const alunos = todosAlunos || [];
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

/** Item do histórico: mensalidade paga com nome do aluno para exibição */
export interface HistoricoRecebimentoItem {
  id: string;
  aluno_id: string;
  due_date: string;
  amount: number;
  paid_date: string | null;
  aluno_nome: string;
}

/**
 * Busca todo o histórico de recebimentos (mensalidades pagas) do personal,
 * ordenado do mais recente ao mais antigo (por data em que foi marcado como pago).
 * Usado na aba "Histórico de Entrada" e como fonte para o dashboard.
 */
export async function getHistoricoRecebimentos(personalId: string): Promise<HistoricoRecebimentoItem[]> {
  const { data: mensalidades, error: msgError } = await supabase
    .from('mensalidades')
    .select('id, aluno_id, due_date, amount, paid_date')
    .eq('personal_id', personalId)
    .eq('status', 'pago')
    .order('paid_date', { ascending: false, nullFirst: true })
    .order('due_date', { ascending: false });

  if (msgError) throw msgError;
  const lista = mensalidades || [];
  if (lista.length === 0) return [];

  const alunoIds = [...new Set(lista.map((m: any) => m.aluno_id))];
  const { data: alunos, error: alunosError } = await supabase
    .from('alunos')
    .select('id, nome, name')
    .in('id', alunoIds);

  if (alunosError) throw alunosError;
  const mapaAlunos = new Map((alunos || []).map((a: any) => [a.id, a.nome || a.name || 'Aluno']));

  return lista.map((m: any) => ({
    id: m.id,
    aluno_id: m.aluno_id,
    due_date: m.due_date,
    amount: typeof m.amount === 'number' ? m.amount : parseFloat(String(m.amount)) || 0,
    paid_date: m.paid_date || null,
    aluno_nome: mapaAlunos.get(m.aluno_id) || 'Aluno',
  }));
}

/** Item de pagamento pendente de meses anteriores */
export interface PagamentoPendenteItem {
  id: string;
  aluno_id: string;
  due_date: string;
  amount: number;
  aluno_nome: string;
}

/**
 * Busca mensalidades pendentes de meses ANTERIORES ao mês atual.
 * Usado na aba "Pagamentos Pendentes" para acertar dívidas passadas.
 */
export async function getPagamentosPendentes(personalId: string): Promise<PagamentoPendenteItem[]> {
  const hoje = new Date();
  const primeiroDiaMesAtual = getFirstDayOfMonth(hoje.getFullYear(), hoje.getMonth() + 1);

  const { data: mensalidades, error: msgError } = await supabase
    .from('mensalidades')
    .select('id, aluno_id, due_date, amount')
    .eq('personal_id', personalId)
    .neq('status', 'pago')
    .lt('due_date', primeiroDiaMesAtual)
    .order('due_date', { ascending: true });

  if (msgError) throw msgError;
  const lista = mensalidades || [];
  if (lista.length === 0) return [];

  const alunoIds = [...new Set(lista.map((m: any) => m.aluno_id))];
  const { data: alunos, error: alunosError } = await supabase
    .from('alunos')
    .select('id, nome, name')
    .in('id', alunoIds);

  if (alunosError) throw alunosError;
  const mapaAlunos = new Map((alunos || []).map((a: any) => [a.id, a.nome || a.name || 'Aluno']));

  return lista.map((m: any) => ({
    id: m.id,
    aluno_id: m.aluno_id,
    due_date: m.due_date,
    amount: typeof m.amount === 'number' ? m.amount : parseFloat(String(m.amount)) || 0,
    aluno_nome: mapaAlunos.get(m.aluno_id) || 'Aluno',
  }));
}

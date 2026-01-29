import { supabase } from '../lib/supabaseClient';
import { getFirstDayOfMonth, getLastDayOfMonth } from './mensalidadesService';

export interface PeriodoInativo {
  id: string;
  aluno_id: string;
  personal_id: string;
  data_inicio: string;
  data_fim: string | null;
  created_at: string;
}

/** Busca todos os períodos de inatividade dos alunos do personal */
export async function getPeriodosInativos(personalId: string): Promise<PeriodoInativo[]> {
  const { data, error } = await supabase
    .from('aluno_inativo_periodos')
    .select('*')
    .eq('personal_id', personalId)
    .order('data_inicio', { ascending: true });

  if (error) throw error;
  return (data || []) as PeriodoInativo[];
}

/** Verifica se um período cobre um mês (firstDay e lastDay em YYYY-MM-DD) */
export function periodoCobreMes(
  periodo: PeriodoInativo,
  firstDay: string,
  lastDay: string
): boolean {
  if (periodo.data_inicio > lastDay) return false;
  if (periodo.data_fim != null && periodo.data_fim < firstDay) return false;
  return true;
}

/** Retorna o set de aluno_id que estão inativos no mês (algum período cobre o mês) */
export async function getAlunoIdsInativosNoMes(
  personalId: string,
  year: number,
  month: number
): Promise<Set<string>> {
  const firstDay = getFirstDayOfMonth(year, month);
  const lastDay = getLastDayOfMonth(year, month);
  const periodos = await getPeriodosInativos(personalId);
  const ids = new Set<string>();
  for (const p of periodos) {
    if (periodoCobreMes(p, firstDay, lastDay)) ids.add(p.aluno_id);
  }
  return ids;
}

/** Registra novo período de inatividade (data_inicio = primeiro dia do mês, data_fim = null) */
export async function criarPeriodoInativo(
  alunoId: string,
  personalId: string,
  dataInicio: string
): Promise<PeriodoInativo> {
  const { data, error } = await supabase
    .from('aluno_inativo_periodos')
    .insert({ aluno_id: alunoId, personal_id: personalId, data_inicio: dataInicio, data_fim: null })
    .select()
    .single();

  if (error) throw error;
  return data as PeriodoInativo;
}

/** Encerra o período atual de inatividade (data_fim = último dia do mês anterior) */
export async function encerrarPeriodoInativo(
  alunoId: string,
  dataFim: string
): Promise<void> {
  const { error } = await supabase
    .from('aluno_inativo_periodos')
    .update({ data_fim: dataFim })
    .eq('aluno_id', alunoId)
    .is('data_fim', null);

  if (error) throw error;
}

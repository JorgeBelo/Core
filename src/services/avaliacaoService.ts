import { supabase } from '../lib/supabaseClient';
import type { 
  AvaliacaoFisica, 
  NovaAvaliacaoInput, 
  ResultadosCalculados,
  ComparacaoAvaliacoes,
  EvolucaoAluno
} from '../types/avaliacao';

// ============================================
// FÓRMULAS E CÁLCULOS CIENTÍFICOS
// ============================================

/**
 * Calcula o IMC (Índice de Massa Corporal)
 * Fórmula: peso (kg) / (altura (m))²
 */
export function calcularIMC(peso: number, altura: number): number {
  const alturaMetros = altura / 100;
  return Number((peso / (alturaMetros * alturaMetros)).toFixed(2));
}

/**
 * Classifica o IMC segundo padrões da OMS
 */
export function classificarIMC(imc: number): string {
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc < 25) return 'Normal';
  if (imc < 30) return 'Sobrepeso';
  if (imc < 35) return 'Obesidade Grau I';
  if (imc < 40) return 'Obesidade Grau II';
  return 'Obesidade Grau III';
}

/**
 * Calcula a Densidade Corporal usando Jackson & Pollock (3 Dobras)
 * Homens: DC = 1.10938 - (0.0008267 × ΣDC) + (0.0000016 × ΣDC²) - (0.0002574 × idade)
 * Mulheres: DC = 1.0994921 - (0.0009929 × ΣDC) + (0.0000023 × ΣDC²) - (0.0001392 × idade)
 */
export function calcularDensidadeCorporal3Dobras(
  somaDobras: number,
  idade: number,
  sexo: 'M' | 'F'
): number {
  if (sexo === 'M') {
    const dc = 1.10938 - (0.0008267 * somaDobras) + (0.0000016 * somaDobras * somaDobras) - (0.0002574 * idade);
    return Number(dc.toFixed(4));
  } else {
    const dc = 1.0994921 - (0.0009929 * somaDobras) + (0.0000023 * somaDobras * somaDobras) - (0.0001392 * idade);
    return Number(dc.toFixed(4));
  }
}

/**
 * Calcula a Densidade Corporal usando Jackson & Pollock (7 Dobras)
 * Homens: DC = 1.112 - (0.00043499 × ΣDC) + (0.00000055 × ΣDC²) - (0.00028826 × idade)
 * Mulheres: DC = 1.097 - (0.00046971 × ΣDC) + (0.00000056 × ΣDC²) - (0.00012828 × idade)
 */
export function calcularDensidadeCorporal7Dobras(
  somaDobras: number,
  idade: number,
  sexo: 'M' | 'F'
): number {
  if (sexo === 'M') {
    const dc = 1.112 - (0.00043499 * somaDobras) + (0.00000055 * somaDobras * somaDobras) - (0.00028826 * idade);
    return Number(dc.toFixed(4));
  } else {
    const dc = 1.097 - (0.00046971 * somaDobras) + (0.00000056 * somaDobras * somaDobras) - (0.00012828 * idade);
    return Number(dc.toFixed(4));
  }
}

/**
 * Calcula o Percentual de Gordura pela Fórmula de Siri
 * %G = ((4.95 / DC) - 4.50) × 100
 */
export function calcularPercentualGorduraSiri(densidadeCorporal: number): number {
  const percentual = ((4.95 / densidadeCorporal) - 4.50) * 100;
  return Number(percentual.toFixed(2));
}

/**
 * Classifica o Percentual de Gordura
 */
export function classificarPercentualGordura(percentual: number, sexo: 'M' | 'F'): string {
  if (sexo === 'M') {
    if (percentual < 6) return 'Essencial';
    if (percentual < 14) return 'Atleta';
    if (percentual < 18) return 'Fitness';
    if (percentual < 25) return 'Aceitável';
    return 'Obesidade';
  } else {
    if (percentual < 14) return 'Essencial';
    if (percentual < 21) return 'Atleta';
    if (percentual < 25) return 'Fitness';
    if (percentual < 32) return 'Aceitável';
    return 'Obesidade';
  }
}

/**
 * Calcula Massa Gorda em kg
 */
export function calcularMassaGorda(peso: number, percentualGordura: number): number {
  return Number((peso * (percentualGordura / 100)).toFixed(2));
}

/**
 * Calcula Massa Magra em kg
 */
export function calcularMassaMagra(peso: number, massaGorda: number): number {
  return Number((peso - massaGorda).toFixed(2));
}

/**
 * Calcula Peso Ideal pela Fórmula de Devine
 * Homens: 50 + 2.3 × (altura em polegadas - 60)
 * Mulheres: 45.5 + 2.3 × (altura em polegadas - 60)
 */
export function calcularPesoIdeal(altura: number, sexo: 'M' | 'F'): number {
  const polegadas = altura / 2.54;
  if (sexo === 'M') {
    return Number((50 + 2.3 * (polegadas - 60)).toFixed(2));
  } else {
    return Number((45.5 + 2.3 * (polegadas - 60)).toFixed(2));
  }
}

/**
 * Calcula Relação Cintura/Quadril (RCQ)
 */
export function calcularRCQ(cintura: number, quadril: number): number {
  return Number((cintura / quadril).toFixed(2));
}

/**
 * Calcula todos os resultados de uma avaliação
 */
export function calcularResultados(input: NovaAvaliacaoInput, sexo: 'M' | 'F', idade: number): ResultadosCalculados {
  const imc = calcularIMC(input.peso, input.altura);
  const classificacao_imc = classificarIMC(imc);
  
  let densidade_corporal: number | undefined;
  let percentual_gordura: number;
  
  // Calcula % gordura baseado no protocolo
  if (input.protocolo === '3dobras' && input.dobra_peitoral && input.dobra_abdominal && input.dobra_coxa) {
    const soma = input.dobra_peitoral + input.dobra_abdominal + input.dobra_coxa;
    densidade_corporal = calcularDensidadeCorporal3Dobras(soma, idade, sexo);
    percentual_gordura = calcularPercentualGorduraSiri(densidade_corporal);
  } else if (input.protocolo === '7dobras') {
    const soma = (input.dobra_peitoral || 0) + (input.dobra_abdominal || 0) + (input.dobra_coxa || 0) +
                 (input.dobra_axilar_media || 0) + (input.dobra_triceps || 0) + 
                 (input.dobra_subescapular || 0) + (input.dobra_suprailiaca || 0);
    densidade_corporal = calcularDensidadeCorporal7Dobras(soma, idade, sexo);
    percentual_gordura = calcularPercentualGorduraSiri(densidade_corporal);
  } else if (input.protocolo === 'bioimpedancia' && input.percentual_gordura_bioimpedancia) {
    percentual_gordura = input.percentual_gordura_bioimpedancia;
  } else {
    // Fallback: estima baseado no IMC
    percentual_gordura = sexo === 'M' ? imc * 1.2 : imc * 1.48;
  }
  
  const massa_gorda_kg = calcularMassaGorda(input.peso, percentual_gordura);
  const massa_magra_kg = calcularMassaMagra(input.peso, massa_gorda_kg);
  const peso_ideal_kg = calcularPesoIdeal(input.altura, sexo);
  const classificacao_gordura = classificarPercentualGordura(percentual_gordura, sexo);
  
  let rcq: number | undefined;
  if (input.perimetro_cintura && input.perimetro_quadril) {
    rcq = calcularRCQ(input.perimetro_cintura, input.perimetro_quadril);
  }
  
  return {
    imc,
    densidade_corporal,
    percentual_gordura,
    massa_gorda_kg,
    massa_magra_kg,
    peso_ideal_kg,
    rcq,
    classificacao_imc,
    classificacao_gordura
  };
}

// ============================================
// CRUD DE AVALIAÇÕES
// ============================================

/**
 * Cria uma nova avaliação física
 */
export async function criarAvaliacao(input: NovaAvaliacaoInput, sexo: 'M' | 'F', idade: number): Promise<AvaliacaoFisica> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  
  // Calcula todos os resultados
  const resultados = calcularResultados(input, sexo, idade);
  
  // Monta o objeto completo
  const avaliacaoCompleta = {
    personal_id: user.id,
    ...input,
    sexo,
    idade,
    ...resultados
  };
  
  const { data, error } = await supabase
    .from('avaliacoes_fisicas')
    .insert([avaliacaoCompleta])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Lista todas as avaliações do personal
 */
export async function listarAvaliacoes(): Promise<AvaliacaoFisica[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  
  const { data, error } = await supabase
    .from('avaliacoes_fisicas')
    .select('*')
    .eq('personal_id', user.id)
    .order('data_avaliacao', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

/**
 * Lista avaliações de um aluno específico
 */
export async function listarAvaliacoesAluno(alunoId: string): Promise<AvaliacaoFisica[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  
  const { data, error } = await supabase
    .from('avaliacoes_fisicas')
    .select('*')
    .eq('personal_id', user.id)
    .eq('aluno_id', alunoId)
    .order('data_avaliacao', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

/**
 * Busca uma avaliação específica
 */
export async function buscarAvaliacao(id: string): Promise<AvaliacaoFisica | null> {
  const { data, error } = await supabase
    .from('avaliacoes_fisicas')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Atualiza uma avaliação
 */
export async function atualizarAvaliacao(id: string, input: Partial<NovaAvaliacaoInput>): Promise<AvaliacaoFisica> {
  const { data, error } = await supabase
    .from('avaliacoes_fisicas')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Deleta uma avaliação
 */
export async function deletarAvaliacao(id: string): Promise<void> {
  const { error } = await supabase
    .from('avaliacoes_fisicas')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

/**
 * Compara duas avaliações
 */
export async function compararAvaliacoes(idAnterior: string, idAtual: string): Promise<ComparacaoAvaliacoes> {
  const anterior = await buscarAvaliacao(idAnterior);
  const atual = await buscarAvaliacao(idAtual);
  
  if (!anterior || !atual) {
    throw new Error('Avaliações não encontradas');
  }
  
  const diferencas = {
    peso: Number((atual.peso - anterior.peso).toFixed(2)),
    percentual_gordura: Number((atual.percentual_gordura - anterior.percentual_gordura).toFixed(2)),
    massa_gorda_kg: Number((atual.massa_gorda_kg - anterior.massa_gorda_kg).toFixed(2)),
    massa_magra_kg: Number((atual.massa_magra_kg - anterior.massa_magra_kg).toFixed(2)),
    imc: Number((atual.imc - anterior.imc).toFixed(2))
  };
  
  const percentuais = {
    peso: Number(((diferencas.peso / anterior.peso) * 100).toFixed(2)),
    percentual_gordura: Number(((diferencas.percentual_gordura / anterior.percentual_gordura) * 100).toFixed(2)),
    massa_gorda_kg: Number(((diferencas.massa_gorda_kg / anterior.massa_gorda_kg) * 100).toFixed(2)),
    massa_magra_kg: Number(((diferencas.massa_magra_kg / anterior.massa_magra_kg) * 100).toFixed(2))
  };
  
  return {
    anterior,
    atual,
    diferencas,
    percentuais
  };
}

/**
 * Busca evolução completa de um aluno
 */
export async function buscarEvolucaoAluno(alunoId: string, alunoNome: string): Promise<EvolucaoAluno | null> {
  const avaliacoes = await listarAvaliacoesAluno(alunoId);
  
  if (avaliacoes.length === 0) return null;
  
  const primeira = avaliacoes[avaliacoes.length - 1];
  const ultima = avaliacoes[0];
  
  const dataInicio = new Date(primeira.data_avaliacao);
  const dataFim = new Date(ultima.data_avaliacao);
  const periodo_dias = Math.floor((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    aluno_id: alunoId,
    aluno_nome: alunoNome,
    avaliacoes,
    primeira_avaliacao: primeira,
    ultima_avaliacao: ultima,
    total_avaliacoes: avaliacoes.length,
    periodo_dias
  };
}

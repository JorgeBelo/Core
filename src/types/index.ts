// Tipos TypeScript para o sistema Core

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  // Registro profissional do personal (ex: CREF)
  cref?: string;
  created_at: string;
  updated_at: string;
}

export interface Aluno {
  id: string;
  personal_id: string;
  nome: string; // Nome da coluna no banco
  name?: string; // Compatibilidade
  whatsapp?: string;
  monthly_fee: number;
  payment_day: number; // Dia do mês para pagamento (1-31)
  payment_status: 'pago' | 'pendente' | 'atrasado';
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Aula {
  id: string;
  aluno_id: string;
  personal_id: string;
  date: string;
  time: string;
  status: 'realizada' | 'falta' | 'reposicao';
  is_reposition: boolean;
  notes?: string;
  created_at: string;
}

export interface Mensalidade {
  id: string;
  aluno_id: string;
  personal_id: string;
  due_date: string;
  amount: number;
  status: 'pago' | 'pendente' | 'atrasado';
  paid_date?: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  personal_id: string;
  type: 'aniversario' | 'vencimento' | 'atraso' | 'aula';
  title: string;
  message: string;
  related_id?: string;
  read: boolean;
  created_at: string;
}

export interface Agenda {
  id: string;
  personal_id: string;
  aluno_id?: string;
  date: string;
  time: string;
  duration: number;
  status: 'agendado' | 'livre' | 'cancelado';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  total_alunos_ativos: number;
  mensalidades_pagas_mes: number;
  faturamento_mes: number;
  mensalidades_atrasadas: number;
  mensalidades_proximas_vencimento: number;
}

export interface Treino {
  id: string;
  personal_id: string;
  name: string;
  category: 'hipertrofia' | 'cardio' | 'funcional' | 'emagrecimento' | 'forca' | 'outros';
  exercises: Exercicio[];
  created_at: string;
  updated_at: string;
}

export interface Exercicio {
  id: string;
  name: string;
  sets?: number;
  reps?: string;
  weight?: number;
  rest?: number;
  notes?: string;
}

// Conta a Pagar/Receber
export interface ContaFinanceira {
  id: string;
  personal_id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  categoria: string;
  tipo: 'pagar' | 'receber';
  parcelada: boolean;
  numero_parcelas?: number;
  parcela_atual?: number;
  conta_original_id?: string; // ID da conta original se for parcela
  conta_fixa: boolean; // Conta recorrente mensal (ex: aluguel, assinatura)
  pago: boolean;
  data_pagamento?: string;
  created_at: string;
  updated_at: string;
}

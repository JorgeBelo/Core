// Tipos TypeScript para o sistema Core

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  // Registro profissional do personal (ex: CREF)
  cref?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  /** Dias que atende (0=Segunda .. 6=Domingo). Se vazio/null, agenda usa todos os dias. */
  agenda_working_days?: number[] | null;
  /** Horário de início da grade (ex: "06:00"). Se não definido, 06:00. */
  agenda_hora_inicio?: string | null;
  /** Horário de fim da grade (ex: "22:00"). Se não definido, 23:00. */
  agenda_hora_fim?: string | null;
}

export interface Aluno {
  id: string;
  personal_id: string;
  nome: string; // Nome da coluna no banco
  name?: string; // Compatibilidade
  whatsapp?: string;
  // Data de nascimento (YYYY-MM-DD)
  birth_date?: string;
  monthly_fee: number;
   // Quantas vezes treina na semana (1-7)
  frequency_per_week?: number;
  payment_day: number; // Dia do mês para pagamento (1-31)
  payment_status: 'pago' | 'pendente' | 'atrasado';
  active: boolean;
  /** Data a partir da qual o aluno ficou inativo (null = ativo). Meses anteriores constam como ativo no histórico. */
  data_inativacao?: string | null;
  /** Data a partir da qual o aluno volta a ser ativo (ex.: reativar "a partir de março"). Null = ainda inativo. */
  data_reativacao?: string | null;
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

// Tipos para o sistema de Avaliação Física

export type ProtocoloAvaliacao = '3dobras' | '7dobras' | 'bioimpedancia' | 'perimetros';

export interface AvaliacaoFisica {
  id: string;
  personal_id: string;
  aluno_id: string;
  
  // Dados básicos
  data_avaliacao: string; // ISO date
  protocolo: ProtocoloAvaliacao;
  
  // Antropometria básica
  peso: number; // kg
  altura: number; // cm
  idade?: number;
  sexo?: 'M' | 'F';
  
  // Dobras cutâneas (mm) - 3 dobras
  dobra_peitoral?: number;
  dobra_abdominal?: number;
  dobra_coxa?: number;
  
  // Dobras cutâneas (mm) - 7 dobras (adiciona mais 4)
  dobra_axilar_media?: number;
  dobra_triceps?: number;
  dobra_subescapular?: number;
  dobra_suprailiaca?: number;
  
  // Bioimpedância
  percentual_gordura_bioimpedancia?: number;
  percentual_massa_magra_bioimpedancia?: number;
  agua_corporal?: number;
  
  // Perímetros (cm)
  perimetro_pescoco?: number;
  perimetro_ombro?: number;
  perimetro_torax?: number;
  perimetro_cintura?: number;
  perimetro_abdomen?: number;
  perimetro_quadril?: number;
  perimetro_braco_direito?: number;
  perimetro_braco_esquerdo?: number;
  perimetro_antebraco_direito?: number;
  perimetro_antebraco_esquerdo?: number;
  perimetro_coxa_direita?: number;
  perimetro_coxa_esquerda?: number;
  perimetro_panturrilha_direita?: number;
  perimetro_panturrilha_esquerda?: number;
  
  // Resultados calculados
  imc: number;
  densidade_corporal?: number;
  percentual_gordura: number;
  massa_gorda_kg: number;
  massa_magra_kg: number;
  peso_ideal_kg?: number;
  rcq?: number; // relação cintura/quadril
  
  // Classificações
  classificacao_imc?: string;
  classificacao_gordura?: string;
  
  // Observações
  observacoes?: string;
  
  // Metadados
  created_at: string;
  updated_at: string;
}

// Dados para criar nova avaliação
export interface NovaAvaliacaoInput {
  aluno_id: string;
  data_avaliacao: string;
  protocolo: ProtocoloAvaliacao;
  peso: number;
  altura: number;
  
  // Campos opcionais dependendo do protocolo
  dobra_peitoral?: number;
  dobra_abdominal?: number;
  dobra_coxa?: number;
  dobra_axilar_media?: number;
  dobra_triceps?: number;
  dobra_subescapular?: number;
  dobra_suprailiaca?: number;
  
  percentual_gordura_bioimpedancia?: number;
  percentual_massa_magra_bioimpedancia?: number;
  agua_corporal?: number;
  
  perimetro_pescoco?: number;
  perimetro_ombro?: number;
  perimetro_torax?: number;
  perimetro_cintura?: number;
  perimetro_abdomen?: number;
  perimetro_quadril?: number;
  perimetro_braco_direito?: number;
  perimetro_braco_esquerdo?: number;
  perimetro_antebraco_direito?: number;
  perimetro_antebraco_esquerdo?: number;
  perimetro_coxa_direita?: number;
  perimetro_coxa_esquerda?: number;
  perimetro_panturrilha_direita?: number;
  perimetro_panturrilha_esquerda?: number;
  
  observacoes?: string;
}

// Resultado dos cálculos
export interface ResultadosCalculados {
  imc: number;
  densidade_corporal?: number;
  percentual_gordura: number;
  massa_gorda_kg: number;
  massa_magra_kg: number;
  peso_ideal_kg: number;
  rcq?: number;
  classificacao_imc: string;
  classificacao_gordura: string;
}

// Para comparação de avaliações
export interface ComparacaoAvaliacoes {
  anterior: AvaliacaoFisica;
  atual: AvaliacaoFisica;
  diferencas: {
    peso: number;
    percentual_gordura: number;
    massa_gorda_kg: number;
    massa_magra_kg: number;
    imc: number;
  };
  percentuais: {
    peso: number;
    percentual_gordura: number;
    massa_gorda_kg: number;
    massa_magra_kg: number;
  };
}

// Para histórico de evolução
export interface EvolucaoAluno {
  aluno_id: string;
  aluno_nome: string;
  avaliacoes: AvaliacaoFisica[];
  primeira_avaliacao: AvaliacaoFisica;
  ultima_avaliacao: AvaliacaoFisica;
  total_avaliacoes: number;
  periodo_dias: number;
}

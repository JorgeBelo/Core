-- ============================================
-- TABELA: avaliacoes_fisicas
-- Sistema de Avaliação Física para Personal Trainers
-- ============================================

-- Criar tabela de avaliações físicas
CREATE TABLE IF NOT EXISTS avaliacoes_fisicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  
  -- Dados básicos
  data_avaliacao DATE NOT NULL DEFAULT CURRENT_DATE,
  protocolo VARCHAR(50) NOT NULL, -- '3dobras', '7dobras', 'bioimpedancia', 'perimetros'
  
  -- Antropometria básica
  peso DECIMAL(5,2) NOT NULL, -- kg
  altura DECIMAL(5,2) NOT NULL, -- cm
  idade INTEGER, -- calculado do cadastro do aluno
  sexo VARCHAR(1), -- 'M' ou 'F' (do cadastro do aluno)
  
  -- Dobras cutâneas (mm) - protocolo 3 dobras
  dobra_peitoral DECIMAL(5,2),
  dobra_abdominal DECIMAL(5,2),
  dobra_coxa DECIMAL(5,2),
  
  -- Dobras cutâneas (mm) - protocolo 7 dobras (adiciona mais 4)
  dobra_axilar_media DECIMAL(5,2),
  dobra_triceps DECIMAL(5,2),
  dobra_subescapular DECIMAL(5,2),
  dobra_suprailiaca DECIMAL(5,2),
  
  -- Bioimpedância
  percentual_gordura_bioimpedancia DECIMAL(5,2),
  percentual_massa_magra_bioimpedancia DECIMAL(5,2),
  agua_corporal DECIMAL(5,2),
  
  -- Perímetros (cm)
  perimetro_pescoco DECIMAL(5,2),
  perimetro_ombro DECIMAL(5,2),
  perimetro_torax DECIMAL(5,2),
  perimetro_cintura DECIMAL(5,2),
  perimetro_abdomen DECIMAL(5,2),
  perimetro_quadril DECIMAL(5,2),
  perimetro_braco_direito DECIMAL(5,2),
  perimetro_braco_esquerdo DECIMAL(5,2),
  perimetro_antebraco_direito DECIMAL(5,2),
  perimetro_antebraco_esquerdo DECIMAL(5,2),
  perimetro_coxa_direita DECIMAL(5,2),
  perimetro_coxa_esquerda DECIMAL(5,2),
  perimetro_panturrilha_direita DECIMAL(5,2),
  perimetro_panturrilha_esquerda DECIMAL(5,2),
  
  -- Resultados calculados
  imc DECIMAL(5,2) NOT NULL,
  densidade_corporal DECIMAL(6,4),
  percentual_gordura DECIMAL(5,2) NOT NULL,
  massa_gorda_kg DECIMAL(5,2) NOT NULL,
  massa_magra_kg DECIMAL(5,2) NOT NULL,
  peso_ideal_kg DECIMAL(5,2),
  rcq DECIMAL(4,2), -- relação cintura/quadril
  
  -- Classificações (geradas automaticamente)
  classificacao_imc VARCHAR(50),
  classificacao_gordura VARCHAR(50),
  
  -- Observações
  observacoes TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_avaliacoes_personal ON avaliacoes_fisicas(personal_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_aluno ON avaliacoes_fisicas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_data ON avaliacoes_fisicas(data_avaliacao DESC);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_protocolo ON avaliacoes_fisicas(protocolo);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_avaliacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_avaliacoes_updated_at
  BEFORE UPDATE ON avaliacoes_fisicas
  FOR EACH ROW
  EXECUTE FUNCTION update_avaliacoes_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE avaliacoes_fisicas ENABLE ROW LEVEL SECURITY;

-- Policy: Personal só vê suas próprias avaliações
CREATE POLICY "Personal vê suas avaliações"
  ON avaliacoes_fisicas
  FOR SELECT
  USING (auth.uid() = personal_id);

-- Policy: Personal pode inserir avaliações
CREATE POLICY "Personal cria avaliações"
  ON avaliacoes_fisicas
  FOR INSERT
  WITH CHECK (auth.uid() = personal_id);

-- Policy: Personal pode atualizar suas avaliações
CREATE POLICY "Personal atualiza suas avaliações"
  ON avaliacoes_fisicas
  FOR UPDATE
  USING (auth.uid() = personal_id)
  WITH CHECK (auth.uid() = personal_id);

-- Policy: Personal pode deletar suas avaliações
CREATE POLICY "Personal deleta suas avaliações"
  ON avaliacoes_fisicas
  FOR DELETE
  USING (auth.uid() = personal_id);

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE avaliacoes_fisicas IS 'Armazena avaliações físicas dos alunos com múltiplos protocolos';
COMMENT ON COLUMN avaliacoes_fisicas.protocolo IS 'Tipo de protocolo: 3dobras, 7dobras, bioimpedancia, perimetros';
COMMENT ON COLUMN avaliacoes_fisicas.densidade_corporal IS 'Calculado pela fórmula de Jackson & Pollock';
COMMENT ON COLUMN avaliacoes_fisicas.percentual_gordura IS 'Calculado pela fórmula de Siri ou direto da bioimpedância';
COMMENT ON COLUMN avaliacoes_fisicas.rcq IS 'Relação Cintura/Quadril - indicador de risco cardiovascular';

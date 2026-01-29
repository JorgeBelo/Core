-- Histórico de períodos de inatividade por aluno.
-- Permite múltiplos períodos: aluno inativo fev–ago, reativa em set, inativo de novo em nov, etc.

CREATE TABLE IF NOT EXISTS aluno_inativo_periodos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  personal_id UUID NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE aluno_inativo_periodos IS 'Períodos em que o aluno ficou inativo. data_fim NULL = ainda inativo nesse período.';
COMMENT ON COLUMN aluno_inativo_periodos.data_inicio IS 'Primeiro dia do mês em que ficou inativo.';
COMMENT ON COLUMN aluno_inativo_periodos.data_fim IS 'Último dia do mês em que estava inativo (NULL se ainda inativo).';

CREATE INDEX IF NOT EXISTS idx_aluno_inativo_periodos_aluno ON aluno_inativo_periodos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_aluno_inativo_periodos_personal ON aluno_inativo_periodos(personal_id);
CREATE INDEX IF NOT EXISTS idx_aluno_inativo_periodos_datas ON aluno_inativo_periodos(data_inicio, data_fim);

-- Migrar dados existentes: cada aluno com data_inativacao vira um período com data_fim = NULL
INSERT INTO aluno_inativo_periodos (aluno_id, personal_id, data_inicio, data_fim)
SELECT id, personal_id, data_inativacao, NULL
FROM alunos
WHERE data_inativacao IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM aluno_inativo_periodos p
    WHERE p.aluno_id = alunos.id AND p.data_fim IS NULL
  );

-- RLS: personal só acessa períodos dos seus alunos
ALTER TABLE aluno_inativo_periodos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Personal acessa períodos dos seus alunos"
  ON aluno_inativo_periodos FOR ALL
  USING (
    personal_id = auth.uid()
  )
  WITH CHECK (
    personal_id = auth.uid()
  );

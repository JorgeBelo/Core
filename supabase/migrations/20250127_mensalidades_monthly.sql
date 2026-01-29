-- Mensalidades: uma linha por aluno por mês (due_date = primeiro dia do mês)
-- Permite histórico mês a mês e novo mês iniciar com todos "pendente".

CREATE TABLE IF NOT EXISTS mensalidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personal_id UUID NOT NULL,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente', 'atrasado')),
  paid_date DATE,
  payment_method VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(aluno_id, due_date)
);

CREATE INDEX IF NOT EXISTS idx_mensalidades_personal_id ON mensalidades(personal_id);
CREATE INDEX IF NOT EXISTS idx_mensalidades_aluno_id ON mensalidades(aluno_id);
CREATE INDEX IF NOT EXISTS idx_mensalidades_due_date ON mensalidades(due_date);
CREATE INDEX IF NOT EXISTS idx_mensalidades_status ON mensalidades(status);

COMMENT ON COLUMN mensalidades.due_date IS 'Primeiro dia do mês de referência (ex: 2025-01-01 = janeiro/2025).';

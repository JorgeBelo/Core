-- Data em que o aluno foi inativado (null = ainda ativo).
-- Permite histórico: em meses anteriores a essa data o aluno aparece como ativo.

ALTER TABLE alunos
  ADD COLUMN IF NOT EXISTS data_inativacao DATE DEFAULT NULL;

COMMENT ON COLUMN alunos.data_inativacao IS 'Data a partir da qual o aluno ficou inativo (null = ativo). Em meses anteriores ele consta como ativo no histórico.';

-- Data a partir da qual o aluno volta a ser ativo (ex.: reativar "a partir de março").
-- Se preenchida, o aluno é considerado ativo em meses >= data_reativacao.

ALTER TABLE alunos
  ADD COLUMN IF NOT EXISTS data_reativacao DATE DEFAULT NULL;

COMMENT ON COLUMN alunos.data_reativacao IS 'Data a partir da qual o aluno volta a ser ativo (null = ainda inativo). Usado quando reativa "a partir de um mês".';

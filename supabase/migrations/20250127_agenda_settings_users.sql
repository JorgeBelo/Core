-- Personalização da Agenda: dias e horários de trabalho
-- Execute no SQL Editor do Supabase (Dashboard > SQL Editor) se as colunas ainda não existirem.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS agenda_working_days jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS agenda_hora_inicio text DEFAULT '06:00',
  ADD COLUMN IF NOT EXISTS agenda_hora_fim text DEFAULT '23:00';

COMMENT ON COLUMN users.agenda_working_days IS 'Dias que atende: [0,1,2,3,4,5,6] = Seg a Dom. NULL = todos os dias.';
COMMENT ON COLUMN users.agenda_hora_inicio IS 'Horário de início da grade da agenda (HH:mm).';
COMMENT ON COLUMN users.agenda_hora_fim IS 'Horário de fim da grade da agenda (HH:mm).';

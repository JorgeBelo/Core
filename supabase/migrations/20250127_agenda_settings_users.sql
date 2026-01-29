-- Personalização da Agenda: dias e horários de trabalho
-- Execute no SQL Editor do Supabase se as colunas ainda não existirem.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS agenda_working_days integer[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS agenda_hora_inicio text DEFAULT '06:00',
  ADD COLUMN IF NOT EXISTS agenda_hora_fim text DEFAULT '23:00';

COMMENT ON COLUMN users.agenda_working_days IS 'Dias que atende: 0=Segunda, 1=Terça, ..., 6=Domingo. NULL = todos os dias.';
COMMENT ON COLUMN users.agenda_hora_inicio IS 'Horário de início da grade da agenda (HH:mm).';
COMMENT ON COLUMN users.agenda_hora_fim IS 'Horário de fim da grade da agenda (HH:mm).';

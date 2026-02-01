-- ============================================
-- LIMPEZA DO BANCO DE DADOS - CORE
-- Remove tabelas/views de funcionalidades que foram retiradas do site
-- ============================================
--
-- ATENÇÃO: Faça BACKUP do banco antes de executar!
-- No Supabase: Project Settings → Database → Backups (ou use pg_dump)
--
-- O que este script remove (não é mais usado pelo site atual):
-- - aulas (página Aulas foi removida)
-- - mensalidades (módulo Financeiro foi removido)
-- - notifications (módulo Notificações foi removido)
-- - dashboard_summary (view que dependia de mensalidades)
-- - financeiro (tabela do módulo Financeiro removido)
-- - contas_financeiras (se existir - era do Financeiro)
-- - avaliacoes_fisicas (se existir - era do módulo Avaliação Física)
-- - agenda (apenas se você usa agenda_personal para a grade semanal)
--
-- O que NÃO é removido (ainda usado pelo site):
-- - users (perfil, login)
-- - alunos (gestão de alunos)
-- - agenda_personal (agenda semanal)
-- - Storage bucket "avatars"
-- ============================================

-- 1) View que depende de mensalidades (não usada)
DROP VIEW IF EXISTS dashboard_summary;

-- 2) Tabelas de funcionalidades removidas (ordem respeitando FKs quando houver)
DROP TABLE IF EXISTS mensalidades;
DROP TABLE IF EXISTS aulas;
DROP TABLE IF EXISTS notifications;

-- 3) Tabelas que podem ter sido criadas para módulos depois removidos
DROP TABLE IF EXISTS financeiro;
DROP TABLE IF EXISTS contas_financeiras;
DROP TABLE IF EXISTS avaliacoes_fisicas;

-- 4) Tabela "agenda" antiga – só remova se você usa "agenda_personal" para a grade semanal
--    (o site atual usa apenas agenda_personal)
--    Se você ainda usa a tabela "agenda" para algo, comente a linha abaixo.
DROP TABLE IF EXISTS agenda;

-- ============================================
-- Opcional: remover colunas não usadas
-- ============================================
-- Se quiser deixar a tabela alunos mais enxuta, você pode remover a coluna "sexo"
-- (era usada só pelo módulo Avaliação Física). Se não existir, o comando não faz mal.
-- ALTER TABLE alunos DROP COLUMN IF EXISTS sexo;

-- ============================================
-- Verificação (rode depois, se quiser)
-- ============================================
-- Listar tabelas que sobraram no schema public:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- ============================================
-- RLS (Row Level Security) + Trigger para novos usuários
-- Core - Gestão para Personal Trainers
-- ============================================
--
-- Execute este script no SQL Editor do Supabase.
-- Garante: isolamento de dados por usuário e criação de perfil no signup.
--
-- Tabelas tratadas:
-- - users (id = auth.uid())
-- - alunos (personal_id = auth.uid())
-- - agenda_personal (personal_id = auth.uid())
-- ============================================

-- --------------------------------------------
-- 1) Criar linha em public.users quando um usuário se cadastra (auth.users)
-- --------------------------------------------
-- A tabela public.users deve existir com colunas: id (UUID PK), name, email, phone, cref, avatar_url, created_at, updated_at, agenda_working_days, agenda_hora_inicio, agenda_hora_fim (conforme seu schema).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    name,
    email,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger: após INSERT em auth.users, cria linha em public.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- --------------------------------------------
-- 2) RLS na tabela USERS
-- --------------------------------------------
-- Coluna que identifica o dono: id (igual a auth.uid())

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_delete_own" ON public.users;
CREATE POLICY "users_delete_own"
  ON public.users FOR DELETE
  USING (auth.uid() = id);


-- --------------------------------------------
-- 3) RLS na tabela ALUNOS
-- --------------------------------------------
-- Coluna que identifica o dono: personal_id (igual a auth.uid())

ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alunos_select_own" ON public.alunos;
CREATE POLICY "alunos_select_own"
  ON public.alunos FOR SELECT
  USING (auth.uid() = personal_id);

DROP POLICY IF EXISTS "alunos_insert_own" ON public.alunos;
CREATE POLICY "alunos_insert_own"
  ON public.alunos FOR INSERT
  WITH CHECK (auth.uid() = personal_id);

DROP POLICY IF EXISTS "alunos_update_own" ON public.alunos;
CREATE POLICY "alunos_update_own"
  ON public.alunos FOR UPDATE
  USING (auth.uid() = personal_id)
  WITH CHECK (auth.uid() = personal_id);

DROP POLICY IF EXISTS "alunos_delete_own" ON public.alunos;
CREATE POLICY "alunos_delete_own"
  ON public.alunos FOR DELETE
  USING (auth.uid() = personal_id);


-- --------------------------------------------
-- 4) RLS na tabela AGENDA_PERSONAL
-- --------------------------------------------
-- Coluna que identifica o dono: personal_id (igual a auth.uid())

ALTER TABLE public.agenda_personal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agenda_personal_select_own" ON public.agenda_personal;
CREATE POLICY "agenda_personal_select_own"
  ON public.agenda_personal FOR SELECT
  USING (auth.uid() = personal_id);

DROP POLICY IF EXISTS "agenda_personal_insert_own" ON public.agenda_personal;
CREATE POLICY "agenda_personal_insert_own"
  ON public.agenda_personal FOR INSERT
  WITH CHECK (auth.uid() = personal_id);

DROP POLICY IF EXISTS "agenda_personal_update_own" ON public.agenda_personal;
CREATE POLICY "agenda_personal_update_own"
  ON public.agenda_personal FOR UPDATE
  USING (auth.uid() = personal_id)
  WITH CHECK (auth.uid() = personal_id);

DROP POLICY IF EXISTS "agenda_personal_delete_own" ON public.agenda_personal;
CREATE POLICY "agenda_personal_delete_own"
  ON public.agenda_personal FOR DELETE
  USING (auth.uid() = personal_id);


-- ============================================
-- Resumo das regras
-- ============================================
-- SELECT: usuário só vê linhas onde id (users) ou personal_id (alunos, agenda_personal) = auth.uid()
-- INSERT: usuário só pode inserir se id/personal_id for o dele
-- UPDATE/DELETE: somente se id/personal_id for o dele
--
-- Novo cadastro (signUp): ao inserir em auth.users, o trigger cria uma linha em public.users
-- com id, name (do metadata), email, created_at, updated_at. O restante (CREF, telefone, etc.)
-- o usuário preenche na página de Perfil.
-- ============================================

-- Harden legacy objects without changing or deleting their data.
-- Conditional so that a fresh development database also accepts this migration.
do $legacy$
declare function_name text; table_name text;
begin
  if to_regprocedure('public.delete_inactive_alunos()') is not null then
    execute 'revoke all on function public.delete_inactive_alunos() from public,anon,authenticated';
    -- Preserve legacy function behavior for trusted administration, but qualify its relation.
    execute $definition$create or replace function public.delete_inactive_alunos() returns void language plpgsql security definer set search_path='' as $body$
      begin delete from public.alunos where active=false and data_inativacao is not null and data_inativacao <= (current_date-interval '12 months'); end;
    $body$$definition$;
  end if;
  foreach function_name in array array['handle_new_user','update_updated_at_column','set_aluno_data_inativacao','update_avaliacoes_updated_at'] loop
    if to_regprocedure('public.'||function_name||'()') is not null then
      execute format('alter function public.%I() set search_path = %L',function_name,'');
      execute format('revoke all on function public.%I() from public,anon,authenticated',function_name);
    end if;
  end loop;
  foreach table_name in array array['users','alunos','agenda_personal'] loop
    if to_regclass('public.'||table_name) is not null then
      execute format('revoke all on table public.%I from anon',table_name);
    end if;
  end loop;
end;
$legacy$;

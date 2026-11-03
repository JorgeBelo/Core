-- Manual integration check on a configured Supabase database.
-- Uses existing Auth identities, disposable rows and a mandatory rollback.
begin;
do $check$
declare owner_user uuid; owner_tenant uuid; student_user uuid; fixture_student uuid; fixture_exercise uuid; fixture_program uuid; fixture_version uuid; fixture_session uuid; draft_time timestamptz; draft jsonb; performance jsonb; request_key uuid=gen_random_uuid(); actual integer;
begin
  select user_id,id into owner_user,owner_tenant from public.professionals order by created_at limit 1;
  if owner_user is null then raise exception 'Provision a professional before this check'; end if;
  select id into student_user from auth.users where id<>owner_user and not exists(select 1 from public.professionals p where p.user_id=auth.users.id) limit 1;
  if student_user is null then raise exception 'A second existing Auth identity is required for the rollback test'; end if;
  perform set_config('request.jwt.claim.sub',owner_user::text,true);
  execute 'set local role authenticated';
  insert into public.students(professional_id,full_name) values(owner_tenant,'TESTE TRANSACIONAL — NÃO PERSISTIR') returning id into fixture_student;
  insert into public.exercises(professional_id,name,muscle_group,instructions) values(owner_tenant,'Exercício de teste transacional','Grupo de teste','Instrução de teste') returning id into fixture_exercise;
  draft=jsonb_build_array(jsonb_build_object('name','Treino teste','exercises',jsonb_build_array(jsonb_build_object('exercise_id',fixture_exercise,'sets',1,'repetitions','10','rest_seconds',60,'load_kg',null,'rpe',null,'rir',null,'tempo','','notes',''))));
  insert into public.training_programs(professional_id,student_id,name,draft_days) values(owner_tenant,fixture_student,'Programa de teste transacional',draft) returning id,updated_at into fixture_program,draft_time;
  fixture_version=public.publish_program(fixture_program,draft_time);
  execute 'reset role';
  update public.students set user_id=student_user where id=fixture_student;
  perform set_config('request.jwt.claim.sub',student_user::text,true);
  execute 'set local role authenticated';
  select count(*) into actual from public.training_programs where id=fixture_program;
  if actual<>0 then raise exception 'Student saw a draft'; end if;
  select count(*) into actual from public.program_versions where id=fixture_version;
  if actual<>1 then raise exception 'Student did not see the approved version'; end if;
  performance=jsonb_build_array(jsonb_build_object('exercise_id',fixture_exercise,'sets',jsonb_build_array(jsonb_build_object('repetitions',10,'load_kg',5,'effort',6,'completed',true))));
  fixture_session=public.record_training_session(fixture_version,0,performance,'Feedback de teste',30,request_key);
  if public.record_training_session(fixture_version,0,performance,'Feedback de teste',30,request_key)<>fixture_session then raise exception 'Idempotency failed'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub',owner_user::text,true);
  execute 'set local role authenticated';
  select count(*) into actual from public.training_sessions where id=fixture_session;
  if actual<>1 then raise exception 'Professional cannot read execution'; end if;
  update public.students set status='inactive' where id=fixture_student;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub',student_user::text,true);
  execute 'set local role authenticated';
  select count(*) into actual from public.program_versions where id=fixture_version;
  if actual<>0 then raise exception 'Inactive student retained access'; end if;
  execute 'reset role';
end;
$check$;
rollback;
select 'PASS: cadastro → prescrição → aprovação → execução → histórico → inativação; todas as linhas de teste revertidas' as verification;

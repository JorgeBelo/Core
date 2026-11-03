create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id),
  name text not null check(char_length(trim(name)) between 3 and 160),
  muscle_group text not null check(char_length(trim(muscle_group)) between 2 and 80),
  equipment text not null default '' check(char_length(equipment)<=120),
  movement text not null default '' check(char_length(movement)<=120),
  complexity text not null default 'beginner' check(complexity in ('beginner','intermediate','advanced')),
  instructions text not null default '' check(char_length(instructions)<=5000),
  video_url text not null default '' check(video_url='' or (video_url like 'https://%' and char_length(video_url)<=2048)),
  tags text[] not null default '{}' check(cardinality(tags)<=20),
  favorite boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,professional_id)
);
create index exercises_tenant_name on public.exercises(professional_id,name,id);
create index exercises_tenant_group on public.exercises(professional_id,muscle_group);
create trigger exercise_timestamp before update on public.exercises for each row execute function private.touch_updated_at();

create table public.training_programs (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id),
  student_id uuid not null,
  name text not null check(char_length(trim(name)) between 3 and 160),
  duration_weeks integer not null default 8 check(duration_weeks between 1 and 104),
  frequency integer not null default 3 check(frequency between 1 and 7),
  notes text not null default '' check(char_length(notes)<=2000),
  draft_days jsonb not null default '[]' check(jsonb_typeof(draft_days)='array' and jsonb_array_length(draft_days)<=14 and octet_length(draft_days::text)<=250000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(student_id,professional_id) references public.students(id,professional_id),
  unique(id,professional_id,student_id)
);
create index programs_tenant_updated on public.training_programs(professional_id,updated_at desc);
create trigger program_timestamp before update on public.training_programs for each row execute function private.touch_updated_at();

-- Immutable publications. Only the explicit approval RPC can create a version.
create table public.program_versions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null,
  professional_id uuid not null,
  student_id uuid not null,
  revision integer not null check(revision>0),
  snapshot jsonb not null,
  approved_by uuid not null references auth.users(id),
  published_at timestamptz not null default now(),
  foreign key(program_id,professional_id,student_id) references public.training_programs(id,professional_id,student_id),
  unique(program_id,revision),
  unique(id,professional_id,student_id)
);
create index versions_student_date on public.program_versions(student_id,published_at desc);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null,
  student_id uuid not null,
  version_id uuid not null,
  workout_index integer not null check(workout_index between 0 and 13),
  results jsonb not null,
  feedback text not null default '' check(char_length(feedback)<=2000),
  duration_minutes integer check(duration_minutes between 1 and 1440),
  performed_at timestamptz not null default now(),
  idempotency_key uuid not null,
  foreign key(version_id,professional_id,student_id) references public.program_versions(id,professional_id,student_id),
  unique(student_id,idempotency_key)
);
create index sessions_student_date on public.training_sessions(student_id,performed_at desc);

alter table public.exercises enable row level security;
alter table public.training_programs enable row level security;
alter table public.program_versions enable row level security;
alter table public.training_sessions enable row level security;
revoke all on public.exercises,public.training_programs,public.program_versions,public.training_sessions from anon,authenticated;
grant select on public.exercises,public.training_programs,public.program_versions,public.training_sessions to authenticated;
grant insert(professional_id,name,muscle_group,equipment,movement,complexity,instructions,video_url,tags,favorite,archived),update(name,muscle_group,equipment,movement,complexity,instructions,video_url,tags,favorite,archived) on public.exercises to authenticated;
grant insert(professional_id,student_id,name,duration_weeks,frequency,notes,draft_days),update(name,duration_weeks,frequency,notes,draft_days) on public.training_programs to authenticated;
create policy exercises_read on public.exercises for select to authenticated using(professional_id=(select private.professional_id()));
create policy exercises_create on public.exercises for insert to authenticated with check(professional_id=(select private.professional_id()));
create policy exercises_update on public.exercises for update to authenticated using(professional_id=(select private.professional_id())) with check(professional_id=(select private.professional_id()));
create policy programs_read on public.training_programs for select to authenticated using(professional_id=(select private.professional_id()));
create policy programs_create on public.training_programs for insert to authenticated with check(professional_id=(select private.professional_id()));
create policy programs_update on public.training_programs for update to authenticated using(professional_id=(select private.professional_id())) with check(professional_id=(select private.professional_id()));
create policy versions_read on public.program_versions for select to authenticated using(
  professional_id=(select private.professional_id()) or student_id in(select id from public.students where user_id=(select auth.uid()) and status='active')
);
create policy sessions_read on public.training_sessions for select to authenticated using(
  professional_id=(select private.professional_id()) or student_id in(select id from public.students where user_id=(select auth.uid()) and status='active')
);

create function private.publish_program(p_program_id uuid,p_expected_updated_at timestamptz) returns uuid language plpgsql security definer set search_path='' as $$
declare p public.training_programs; d jsonb; e jsonb; ex public.exercises; published_days jsonb='[]'; published_exercises jsonb; version_id uuid; next_revision integer;
begin
  select * into p from public.training_programs where id=p_program_id and professional_id=private.professional_id() for update;
  if not found then raise exception 'Program not accessible' using errcode='42501'; end if;
  if p.updated_at is distinct from p_expected_updated_at then raise exception 'Draft changed; reload before approving' using errcode='40001'; end if;
  if not exists(select 1 from public.students where id=p.student_id and status='active') then raise exception 'Student inactive'; end if;
  if jsonb_array_length(p.draft_days) not between 1 and 14 then raise exception 'At least one workout is required'; end if;
  for d in select value from jsonb_array_elements(p.draft_days) loop
    if jsonb_typeof(d->'name') is distinct from 'string' or char_length(trim(d->>'name')) not between 1 and 80 or jsonb_typeof(d->'exercises') is distinct from 'array' then raise exception 'Invalid workout'; end if;
    if jsonb_array_length(d->'exercises') not between 1 and 100 then raise exception 'Each workout needs exercises'; end if;
    if (select count(*)<>count(distinct item->>'exercise_id') from jsonb_array_elements(d->'exercises') item) then raise exception 'Duplicate exercise in workout'; end if;
    published_exercises='[]';
    for e in select value from jsonb_array_elements(d->'exercises') loop
      select * into ex from public.exercises where id=(e->>'exercise_id')::uuid and professional_id=p.professional_id and not archived;
      if not found then raise exception 'Exercise not accessible' using errcode='42501'; end if;
      if jsonb_typeof(e->'sets') is distinct from 'number' or (e->>'sets')::numeric not between 1 and 20 or (e->>'sets')::numeric<>trunc((e->>'sets')::numeric) then raise exception 'Invalid sets'; end if;
      if jsonb_typeof(e->'rest_seconds') is distinct from 'number' or (e->>'rest_seconds')::numeric not between 0 and 1800 or (e->>'rest_seconds')::numeric<>trunc((e->>'rest_seconds')::numeric) then raise exception 'Invalid rest'; end if;
      if coalesce(e->>'load_kg','')<>'' and ((e->>'load_kg')::numeric not between 0 and 2000) then raise exception 'Invalid load'; end if;
      if coalesce(e->>'rpe','')<>'' and ((e->>'rpe')::numeric not between 1 and 10) then raise exception 'Invalid RPE'; end if;
      if coalesce(e->>'rir','')<>'' and ((e->>'rir')::numeric not between 0 and 10 or (e->>'rir')::numeric<>trunc((e->>'rir')::numeric)) then raise exception 'Invalid RIR'; end if;
      if char_length(coalesce(e->>'repetitions',''))>40 or char_length(coalesce(e->>'tempo',''))>40 or char_length(coalesce(e->>'notes',''))>1000 then raise exception 'Invalid prescription text'; end if;
      published_exercises=published_exercises||jsonb_build_array(jsonb_build_object(
        'exercise_id',ex.id,'name',ex.name,'muscle_group',ex.muscle_group,'equipment',ex.equipment,'instructions',ex.instructions,'video_url',ex.video_url,
        'sets',(e->>'sets')::integer,'repetitions',coalesce(e->>'repetitions',''),'load_kg',(e->>'load_kg')::numeric,'rest_seconds',(e->>'rest_seconds')::integer,
        'rpe',(e->>'rpe')::numeric,'rir',(e->>'rir')::integer,'tempo',coalesce(e->>'tempo',''),'notes',coalesce(e->>'notes','')
      ));
    end loop;
    published_days=published_days||jsonb_build_array(jsonb_build_object('name',d->>'name','exercises',published_exercises));
  end loop;
  select coalesce(max(revision),0)+1 into next_revision from public.program_versions where program_id=p.id;
  insert into public.program_versions(program_id,professional_id,student_id,revision,snapshot,approved_by)
  values(p.id,p.professional_id,p.student_id,next_revision,jsonb_build_object('name',p.name,'duration_weeks',p.duration_weeks,'frequency',p.frequency,'notes',p.notes,'days',published_days),auth.uid()) returning id into version_id;
  insert into public.audit_events(professional_id,actor_id,entity_id,entity_type,action) values(p.professional_id,auth.uid(),version_id,'program_version','approve');
  return version_id;
end;
$$;
revoke all on function private.publish_program(uuid,timestamptz) from public;
grant execute on function private.publish_program(uuid,timestamptz) to authenticated;
create function public.publish_program(p_program_id uuid,p_expected_updated_at timestamptz) returns uuid language sql security invoker set search_path='' as $$ select private.publish_program(p_program_id,p_expected_updated_at); $$;
revoke all on function public.publish_program(uuid,timestamptz) from public,anon;
grant execute on function public.publish_program(uuid,timestamptz) to authenticated;

create function private.record_training_session(p_version_id uuid,p_workout_index integer,p_results jsonb,p_feedback text,p_duration_minutes integer,p_idempotency_key uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare v public.program_versions; result_id uuid; entry jsonb; performed jsonb; workout jsonb; seen uuid[]='{}'; exercise_id uuid;
begin
  select pv.* into v from public.program_versions pv join public.students s on s.id=pv.student_id where pv.id=p_version_id and s.user_id=auth.uid() and s.status='active';
  if not found then raise exception 'Published program not accessible' using errcode='42501'; end if;
  if p_idempotency_key is null then raise exception 'Idempotency key required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v.student_id::text||p_idempotency_key::text,0));
  -- Same key may only replay the exact same payload.
  select id into result_id from public.training_sessions where student_id=v.student_id and idempotency_key=p_idempotency_key and version_id=v.id and workout_index=p_workout_index and results=p_results and feedback=p_feedback and duration_minutes is not distinct from p_duration_minutes;
  if found then return result_id; end if;
  if p_workout_index is null or p_workout_index<0 or p_workout_index>=jsonb_array_length(v.snapshot->'days') then raise exception 'Invalid workout index'; end if;
  workout=v.snapshot->'days'->p_workout_index;
  if p_feedback is null or char_length(p_feedback)>2000 or (p_duration_minutes is not null and p_duration_minutes not between 1 and 1440) then raise exception 'Invalid session metadata'; end if;
  if jsonb_typeof(p_results) is distinct from 'array' or jsonb_array_length(p_results) not between 1 and 100 or octet_length(p_results::text)>250000 then raise exception 'Invalid results'; end if;
  if not exists(select 1 from jsonb_array_elements(p_results) as result_items(item), jsonb_array_elements(result_items.item->'sets') as performed_items(item) where performed_items.item->>'completed'='true') then raise exception 'At least one completed set is required'; end if;
  for entry in select value from jsonb_array_elements(p_results) loop
    exercise_id=(entry->>'exercise_id')::uuid;
    if exercise_id is null or exercise_id=any(seen) or not exists(select 1 from jsonb_array_elements(workout->'exercises') item where item->>'exercise_id'=exercise_id::text) then raise exception 'Exercise outside prescription or duplicated'; end if;
    seen=array_append(seen,exercise_id);
    if jsonb_typeof(entry->'sets') is distinct from 'array' or jsonb_array_length(entry->'sets') not between 1 and 30 then raise exception 'Invalid performed sets'; end if;
    for performed in select value from jsonb_array_elements(entry->'sets') loop
      if jsonb_typeof(performed->'repetitions') is distinct from 'number' or (performed->>'repetitions')::numeric not between 0 and 1000 or (performed->>'repetitions')::numeric<>trunc((performed->>'repetitions')::numeric) then raise exception 'Invalid repetitions'; end if;
      if jsonb_typeof(performed->'load_kg') is distinct from 'number' or (performed->>'load_kg')::numeric not between 0 and 2000 then raise exception 'Invalid performed load'; end if;
      if coalesce(performed->>'effort','')<>'' and (performed->>'effort')::numeric not between 1 and 10 then raise exception 'Invalid effort'; end if;
      if jsonb_typeof(performed->'completed') is distinct from 'boolean' then raise exception 'Invalid completion state'; end if;
    end loop;
  end loop;
  insert into public.training_sessions(professional_id,student_id,version_id,workout_index,results,feedback,duration_minutes,idempotency_key)
  values(v.professional_id,v.student_id,v.id,p_workout_index,p_results,p_feedback,p_duration_minutes,p_idempotency_key) returning id into result_id;
  insert into public.audit_events(professional_id,actor_id,entity_id,entity_type,action) values(v.professional_id,auth.uid(),result_id,'training_session','finish');
  return result_id;
end;
$$;
revoke all on function private.record_training_session(uuid,integer,jsonb,text,integer,uuid) from public;
grant execute on function private.record_training_session(uuid,integer,jsonb,text,integer,uuid) to authenticated;
create function public.record_training_session(p_version_id uuid,p_workout_index integer,p_results jsonb,p_feedback text,p_duration_minutes integer,p_idempotency_key uuid) returns uuid language sql security invoker set search_path='' as $$ select private.record_training_session(p_version_id,p_workout_index,p_results,p_feedback,p_duration_minutes,p_idempotency_key); $$;
revoke all on function public.record_training_session(uuid,integer,jsonb,text,integer,uuid) from public,anon;
grant execute on function public.record_training_session(uuid,integer,jsonb,text,integer,uuid) to authenticated;

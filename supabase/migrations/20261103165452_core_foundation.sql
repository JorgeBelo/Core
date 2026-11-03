-- No automatic public enrollment. Auth users and professional/student links are
-- provisioned by an operator through the trusted admin environment.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete restrict,
  display_name text not null check (char_length(trim(display_name)) between 3 and 120),
  created_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null check (char_length(trim(full_name)) between 3 and 120),
  email text check (email is null or (char_length(email) <= 254 and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
  phone text not null default '' check (char_length(phone)<=30),
  birth_date date check (birth_date between date '1900-01-01' and current_date),
  goal text not null default '' check (char_length(goal)<=1000),
  experience text not null default 'beginner' check (experience in ('beginner','intermediate','advanced')),
  modality text not null default 'in_person' check (modality in ('in_person','online','hybrid')),
  status text not null default 'active' check (status in ('active','inactive')),
  start_date date not null default current_date,
  emergency_name text not null default '' check (char_length(emergency_name)<=120),
  emergency_phone text not null default '' check (char_length(emergency_phone)<=30),
  availability text not null default '' check (char_length(availability)<=500),
  preferences text not null default '' check (char_length(preferences)<=1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(professional_id, user_id)
);
create unique index students_email_per_professional on public.students(professional_id,lower(email)) where email is not null;
create index students_professional_name on public.students(professional_id,full_name,id);
create index students_auth_user on public.students(user_id) where user_id is not null;
create index students_professional_status on public.students(professional_id,status);
create index students_professional_start on public.students(professional_id,start_date);

-- Private notes are a different resource; never included in a student-facing row.
create table public.student_notes (
  student_id uuid primary key references public.students(id) on delete restrict,
  professional_id uuid not null references public.professionals(id),
  content text not null check(char_length(content)<=10000),
  updated_at timestamptz not null default now(),
  unique(student_id,professional_id)
);
alter table public.students add constraint students_id_professional_unique unique(id,professional_id);
alter table public.student_notes add constraint notes_same_tenant foreign key(student_id,professional_id) references public.students(id,professional_id);

create table public.audit_events (
  id bigint generated always as identity primary key,
  professional_id uuid not null references public.professionals(id),
  actor_id uuid,
  entity_id uuid not null,
  entity_type text not null,
  action text not null,
  occurred_at timestamptz not null default now()
);
create index audit_professional_date on public.audit_events(professional_id,occurred_at desc);

create function private.professional_id() returns uuid language sql stable security definer set search_path='' as $$
  select id from public.professionals where user_id = (select auth.uid());
$$;
revoke all on function private.professional_id() from public;
grant execute on function private.professional_id() to authenticated;

create function private.touch_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at = clock_timestamp(); return new; end;
$$;
create trigger student_timestamp before update on public.students for each row execute function private.touch_updated_at();
create trigger note_timestamp before update on public.student_notes for each row execute function private.touch_updated_at();

create function private.audit_student() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.audit_events(professional_id,actor_id,entity_id,entity_type,action)
  values(new.professional_id,auth.uid(),new.id,'student',lower(TG_OP));
  return new;
end;
$$;
revoke all on function private.audit_student() from public;
revoke all on function private.touch_updated_at() from public;
create trigger student_audit after insert or update on public.students for each row execute function private.audit_student();

alter table public.professionals enable row level security;
alter table public.students enable row level security;
alter table public.student_notes enable row level security;
alter table public.audit_events enable row level security;
revoke all on public.professionals, public.students, public.student_notes, public.audit_events from anon, authenticated;
grant select on public.professionals, public.students, public.student_notes, public.audit_events to authenticated;
grant insert(professional_id,full_name,email,phone,birth_date,goal,experience,modality,status,start_date,emergency_name,emergency_phone,availability,preferences) on public.students to authenticated;
grant update(full_name,email,phone,birth_date,goal,experience,modality,status,start_date,emergency_name,emergency_phone,availability,preferences) on public.students to authenticated;
grant insert(student_id,professional_id,content), update(content) on public.student_notes to authenticated;

create policy professional_read on public.professionals for select to authenticated using(user_id=(select auth.uid()));
create policy student_read on public.students for select to authenticated using(
  professional_id=(select private.professional_id()) or (user_id=(select auth.uid()) and status='active')
);
create policy student_create on public.students for insert to authenticated with check(professional_id=(select private.professional_id()) and user_id is null);
create policy student_update on public.students for update to authenticated using(professional_id=(select private.professional_id())) with check(professional_id=(select private.professional_id()));
create policy notes_read on public.student_notes for select to authenticated using(professional_id=(select private.professional_id()));
create policy notes_create on public.student_notes for insert to authenticated with check(professional_id=(select private.professional_id()));
create policy notes_update on public.student_notes for update to authenticated using(professional_id=(select private.professional_id())) with check(professional_id=(select private.professional_id()));
create policy audit_read on public.audit_events for select to authenticated using(professional_id=(select private.professional_id()));

-- No buckets or public photo endpoints until phase 4 implements restricted storage.

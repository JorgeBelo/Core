-- Money is stored in integer cents. No due-date operation confirms a payment.
create table public.commercial_plans (
 id uuid primary key default gen_random_uuid(), professional_id uuid not null references public.professionals(id),
 name text not null check(char_length(trim(name)) between 3 and 160), amount_cents bigint not null check(amount_cents between 1 and 1000000000000),
 modality text not null check(char_length(trim(modality)) between 2 and 80), frequency integer check(frequency between 1 and 7),
 duration_months integer not null default 1 check(duration_months between 1 and 120), terms text not null default '' check(char_length(terms)<=10000),
 cancellation_notice_hours integer not null default 24 check(cancellation_notice_hours between 0 and 8760),
 makeups_per_month integer not null default 2 check(makeups_per_month between 0 and 100),makeup_expiry_days integer not null default 30 check(makeup_expiry_days between 1 and 730),
 active boolean not null default true,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(id,professional_id)
);
create index plans_tenant_name on public.commercial_plans(professional_id,name,id);
create table public.commercial_contracts (
 id uuid primary key default gen_random_uuid(),professional_id uuid not null references public.professionals(id),student_id uuid not null,plan_id uuid not null,
 starts_on date not null,ends_on date not null check(ends_on>=starts_on),first_due_date date not null,
 installments integer not null check(installments between 1 and 120),interval_months integer not null check(interval_months between 1 and 12),
 snapshot jsonb not null,cancelled_at timestamptz,cancellation_reason text check(char_length(cancellation_reason)<=1000),
 idempotency_key uuid not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 foreign key(student_id,professional_id) references public.students(id,professional_id),foreign key(plan_id,professional_id) references public.commercial_plans(id,professional_id),
 unique(id,professional_id),unique(professional_id,idempotency_key)
);
create index contracts_tenant_student on public.commercial_contracts(professional_id,student_id,created_at desc);
create index contracts_plan on public.commercial_contracts(plan_id,professional_id);
create table public.finance_recurrences (
 id uuid primary key default gen_random_uuid(),professional_id uuid not null references public.professionals(id),student_id uuid,
 direction text not null check(direction in('receivable','payable')),description text not null check(char_length(trim(description)) between 3 and 200),
 amount_cents bigint not null check(amount_cents between 1 and 1000000000000),category text not null check(char_length(trim(category)) between 2 and 80),
 first_due_date date not null,interval_months integer not null check(interval_months between 1 and 12),ends_on date,
 generated_count integer not null default 0 check(generated_count between 0 and 1200),active boolean not null default true,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(direction='receivable' or student_id is null),check(ends_on is null or ends_on>=first_due_date),
 foreign key(student_id,professional_id) references public.students(id,professional_id),unique(id,professional_id)
);
create index recurrences_tenant_active on public.finance_recurrences(professional_id,active);
create index recurrences_student on public.finance_recurrences(student_id,professional_id);
create table public.finance_entries (
 id uuid primary key default gen_random_uuid(),professional_id uuid not null references public.professionals(id),student_id uuid,
 direction text not null check(direction in('receivable','payable')),description text not null check(char_length(trim(description)) between 3 and 200),
 amount_cents bigint not null check(amount_cents between 1 and 1000000000000),category text not null check(char_length(trim(category)) between 2 and 80),
 due_date date not null,competence_date date not null,contract_id uuid,installment_number integer,recurrence_id uuid,occurrence_index integer,client_key uuid,
 cancelled_at timestamptz,cancellation_reason text check(char_length(cancellation_reason)<=1000),disputed boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(direction='receivable' or student_id is null),
 foreign key(student_id,professional_id) references public.students(id,professional_id),
 foreign key(contract_id,professional_id) references public.commercial_contracts(id,professional_id),
 foreign key(recurrence_id,professional_id) references public.finance_recurrences(id,professional_id),
 unique(id,professional_id),unique(contract_id,installment_number),unique(recurrence_id,occurrence_index),unique(professional_id,client_key)
);
create index entries_tenant_due on public.finance_entries(professional_id,direction,due_date,id);
create index entries_tenant_competence on public.finance_entries(professional_id,competence_date);
create index entries_student on public.finance_entries(student_id,professional_id);
create index entries_contract on public.finance_entries(contract_id,professional_id);
create index entries_recurrence on public.finance_entries(recurrence_id,professional_id);
create table public.finance_payments (
 id uuid primary key default gen_random_uuid(),professional_id uuid not null references public.professionals(id),entry_id uuid not null,
 amount_cents bigint not null check(amount_cents<>0 and abs(amount_cents)<=1000000000000),effective_date date not null,
 method text not null check(method in('pix','cash','card','transfer','other')),note text not null default '' check(char_length(note)<=1000),
 reverses_id uuid unique references public.finance_payments(id),idempotency_key uuid not null,actor_id uuid not null references auth.users(id),created_at timestamptz not null default now(),
 check((reverses_id is null and amount_cents>0) or (reverses_id is not null and amount_cents<0)),
 foreign key(entry_id,professional_id) references public.finance_entries(id,professional_id),unique(professional_id,idempotency_key)
);
create index payments_entry on public.finance_payments(entry_id,professional_id);
create index payments_tenant_date on public.finance_payments(professional_id,effective_date,entry_id);
create table public.finance_adjustments (
 id uuid primary key default gen_random_uuid(),professional_id uuid not null references public.professionals(id),entry_id uuid not null,
 kind text not null check(kind in('discount','fee','interest')),amount_cents bigint not null check(amount_cents<>0 and abs(amount_cents)<=1000000000000),
 reason text not null check(char_length(trim(reason)) between 3 and 1000),idempotency_key uuid not null,
 actor_id uuid not null references auth.users(id),created_at timestamptz not null default now(),
 check((kind='discount' and amount_cents<0) or (kind in('fee','interest') and amount_cents>0)),
 foreign key(entry_id,professional_id) references public.finance_entries(id,professional_id),unique(professional_id,idempotency_key)
);
create index adjustments_entry on public.finance_adjustments(entry_id,professional_id);
create table public.finance_events (
 id uuid primary key default gen_random_uuid(),professional_id uuid not null references public.professionals(id),entry_id uuid not null,
 action text not null,reason text not null default '',previous_values jsonb,current_values jsonb,actor_id uuid,created_at timestamptz not null default now(),
 foreign key(entry_id,professional_id) references public.finance_entries(id,professional_id)
);
create index finance_events_entry on public.finance_events(entry_id,professional_id,created_at);

-- Explicit grants and policies. Published financial facts have no client mutation grants.
do $policies$
declare t text;
begin
 foreach t in array array['commercial_plans','commercial_contracts','finance_recurrences','finance_entries','finance_payments','finance_adjustments','finance_events'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('create policy owner_read on public.%I for select to authenticated using(professional_id=(select private.professional_id()))',t);
 end loop;
end;
$policies$;
grant insert(professional_id,name,amount_cents,modality,frequency,duration_months,terms,cancellation_notice_hours,makeups_per_month,makeup_expiry_days,active),update(name,amount_cents,modality,frequency,duration_months,terms,cancellation_notice_hours,makeups_per_month,makeup_expiry_days,active) on public.commercial_plans to authenticated;
create policy plans_insert on public.commercial_plans for insert to authenticated with check(professional_id=(select private.professional_id()));
create policy plans_update on public.commercial_plans for update to authenticated using(professional_id=(select private.professional_id())) with check(professional_id=(select private.professional_id()));
grant insert(professional_id,student_id,direction,description,amount_cents,category,due_date,competence_date,client_key),update(description,category,due_date,competence_date) on public.finance_entries to authenticated;
create policy entries_insert on public.finance_entries for insert to authenticated with check(professional_id=(select private.professional_id()));
create policy entries_update on public.finance_entries for update to authenticated using(professional_id=(select private.professional_id()) and cancelled_at is null) with check(professional_id=(select private.professional_id()));
grant insert(professional_id,student_id,direction,description,amount_cents,category,first_due_date,interval_months,ends_on),update(active) on public.finance_recurrences to authenticated;
create policy recurrences_insert on public.finance_recurrences for insert to authenticated with check(professional_id=(select private.professional_id()));
create policy recurrences_update on public.finance_recurrences for update to authenticated using(professional_id=(select private.professional_id())) with check(professional_id=(select private.professional_id()));
create policy student_contract_read on public.commercial_contracts for select to authenticated using(student_id in(select id from public.students where user_id=(select auth.uid()) and status='active'));
create policy student_entry_read on public.finance_entries for select to authenticated using(direction='receivable' and student_id in(select id from public.students where user_id=(select auth.uid()) and status='active'));
create policy student_payment_read on public.finance_payments for select to authenticated using(entry_id in(select id from public.finance_entries where direction='receivable' and student_id in(select id from public.students where user_id=(select auth.uid()) and status='active')));
create policy student_adjustment_read on public.finance_adjustments for select to authenticated using(entry_id in(select id from public.finance_entries where direction='receivable' and student_id in(select id from public.students where user_id=(select auth.uid()) and status='active')));

create function private.audit_finance() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.audit_events(professional_id,actor_id,entity_id,entity_type,action) values(new.professional_id,auth.uid(),new.id,TG_TABLE_NAME,lower(TG_OP));
 if TG_TABLE_NAME='finance_entries' and TG_OP='UPDATE' then
  insert into public.finance_events(professional_id,entry_id,action,previous_values,current_values,actor_id)
  values(new.professional_id,new.id,'edit',to_jsonb(old)-'professional_id'-'student_id',to_jsonb(new)-'professional_id'-'student_id',auth.uid());
 end if;
 return new;
end;
$$;
revoke all on function private.audit_finance() from public;
do $triggers$
declare t text;
begin
 foreach t in array array['commercial_plans','commercial_contracts','finance_recurrences','finance_entries'] loop
  execute format('create trigger touch_updated_at before update on public.%I for each row execute function private.touch_updated_at()',t);
 end loop;
 foreach t in array array['commercial_plans','commercial_contracts','finance_recurrences','finance_entries','finance_payments','finance_adjustments'] loop
  execute format('create trigger audit_finance after insert or update on public.%I for each row execute function private.audit_finance()',t);
 end loop;
end;
$triggers$;

create view public.finance_balances with(security_invoker=true) as
select e.*,coalesce(a.delta,0)::bigint as adjustment_cents,(e.amount_cents+coalesce(a.delta,0))::bigint as total_cents,
 coalesce(p.settled,0)::bigint as settled_cents,(e.amount_cents+coalesce(a.delta,0)-coalesce(p.settled,0))::bigint as balance_cents,
 case when e.cancelled_at is not null then 'cancelled' when e.disputed then 'disputed'
 when coalesce(p.settled,0)>=e.amount_cents+coalesce(a.delta,0) then 'paid' when coalesce(p.settled,0)>0 then 'partial'
 when e.due_date<(current_timestamp at time zone 'America/Sao_Paulo')::date then 'overdue' else 'upcoming' end as status
from public.finance_entries e
left join (select entry_id,sum(amount_cents) delta from public.finance_adjustments group by entry_id) a on a.entry_id=e.id
left join (select entry_id,sum(amount_cents) settled from public.finance_payments group by entry_id) p on p.entry_id=e.id;
revoke all on public.finance_balances from anon,authenticated;
grant select on public.finance_balances to authenticated;

-- Internal helpers are callable only by their owner; privileged writes derive tenant from Auth.
create function private.lock_finance_entry(p_id uuid) returns public.finance_entries language plpgsql security invoker set search_path='' as $$
declare e public.finance_entries;
begin select * into e from public.finance_entries where id=p_id and professional_id=private.professional_id() for update;
 if not found then raise exception 'Conta não acessível.' using errcode='42501'; end if; return e;
end;
$$;
create function private.finance_totals(p_id uuid) returns table(total bigint,settled bigint) language sql security invoker set search_path='' as $$
select (e.amount_cents+coalesce((select sum(a.amount_cents) from public.finance_adjustments a where a.entry_id=e.id),0))::bigint,
 coalesce((select sum(p.amount_cents) from public.finance_payments p where p.entry_id=e.id),0)::bigint from public.finance_entries e where e.id=p_id;
$$;
revoke all on function private.lock_finance_entry(uuid),private.finance_totals(uuid) from public;

create function private.confirm_finance_payment(p_entry_id uuid,p_amount_cents bigint,p_effective_date date,p_method text,p_note text,p_key uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare e public.finance_entries; prior public.finance_payments; total_due bigint; already_paid bigint; result_id uuid; tenant uuid=private.professional_id();
begin
 if tenant is null then raise exception 'Perfil profissional obrigatório.' using errcode='42501'; end if;
 if p_key is null or p_amount_cents is null or p_amount_cents not between 1 and 1000000000000 or p_effective_date is null or p_effective_date>(current_timestamp at time zone 'America/Sao_Paulo')::date or p_method is null or p_method not in('pix','cash','card','transfer','other') or p_note is null or char_length(p_note)>1000 then raise exception 'Dados de pagamento inválidos.' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(tenant::text||p_key::text,7));
 select * into prior from public.finance_payments where professional_id=tenant and idempotency_key=p_key;
 if found then
  if prior.entry_id=p_entry_id and prior.amount_cents=p_amount_cents and prior.effective_date=p_effective_date and prior.method=p_method and prior.note=p_note and prior.reverses_id is null then return prior.id; end if;
  raise exception 'Chave de pagamento já utilizada com outros dados.' using errcode='23505';
 end if;
 e=private.lock_finance_entry(p_entry_id);
 if e.cancelled_at is not null or e.disputed then raise exception 'Resolva a contestação ou o cancelamento antes de pagar.' using errcode='22023'; end if;
 select total,settled into total_due,already_paid from private.finance_totals(e.id);
 if p_amount_cents>total_due-already_paid then raise exception 'O valor supera o saldo da conta.' using errcode='22023'; end if;
 insert into public.finance_payments(professional_id,entry_id,amount_cents,effective_date,method,note,idempotency_key,actor_id)
 values(tenant,e.id,p_amount_cents,p_effective_date,p_method,p_note,p_key,auth.uid()) returning id into result_id;
 return result_id;
end;
$$;
create function private.reverse_finance_payment(p_payment_id uuid,p_effective_date date,p_reason text,p_key uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare original public.finance_payments;prior public.finance_payments;e public.finance_entries;result_id uuid;tenant uuid=private.professional_id();
begin
 if tenant is null then raise exception 'Perfil profissional obrigatório.' using errcode='42501'; end if;
 if p_key is null or p_reason is null or char_length(trim(p_reason)) not between 3 and 1000 or p_effective_date is null or p_effective_date>(current_timestamp at time zone 'America/Sao_Paulo')::date then raise exception 'Dados do estorno inválidos.' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(tenant::text||p_key::text,7));
 select * into prior from public.finance_payments where professional_id=tenant and idempotency_key=p_key;
 if found then
  if prior.reverses_id=p_payment_id and prior.effective_date=p_effective_date and prior.note=p_reason then return prior.id; end if;
  raise exception 'Chave de pagamento já utilizada com outros dados.' using errcode='23505';
 end if;
 select * into original from public.finance_payments where id=p_payment_id and professional_id=tenant;
 if not found then raise exception 'Pagamento não acessível.' using errcode='42501'; end if;
 e=private.lock_finance_entry(original.entry_id);
 if original.amount_cents<=0 or p_effective_date<original.effective_date or exists(select 1 from public.finance_payments where reverses_id=original.id) then raise exception 'Pagamento já estornado ou data inválida.' using errcode='22023'; end if;
 insert into public.finance_payments(professional_id,entry_id,amount_cents,effective_date,method,note,reverses_id,idempotency_key,actor_id)
 values(tenant,e.id,-original.amount_cents,p_effective_date,original.method,p_reason,original.id,p_key,auth.uid()) returning id into result_id;return result_id;
end;
$$;
create function private.adjust_finance_entry(p_entry_id uuid,p_kind text,p_amount_cents bigint,p_reason text,p_key uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare e public.finance_entries;prior public.finance_adjustments;total_due bigint;already_paid bigint;delta bigint;result_id uuid;tenant uuid=private.professional_id();
begin
 if tenant is null then raise exception 'Perfil profissional obrigatório.' using errcode='42501'; end if;
 if p_key is null or p_kind is null or p_kind not in('discount','fee','interest') or p_amount_cents is null or p_amount_cents not between 1 and 1000000000000 or p_reason is null or char_length(trim(p_reason)) not between 3 and 1000 then raise exception 'Ajuste inválido.' using errcode='22023'; end if;
 delta=case when p_kind='discount' then -p_amount_cents else p_amount_cents end;
 perform pg_advisory_xact_lock(hashtextextended(tenant::text||p_key::text,8));
 select * into prior from public.finance_adjustments where professional_id=tenant and idempotency_key=p_key;
 if found then
  if prior.entry_id=p_entry_id and prior.kind=p_kind and prior.amount_cents=delta and prior.reason=p_reason then return prior.id; end if;
  raise exception 'Chave de ajuste já utilizada com outros dados.' using errcode='23505';
 end if;
 e=private.lock_finance_entry(p_entry_id);
 if e.cancelled_at is not null then raise exception 'Conta cancelada.' using errcode='22023'; end if;
 select total,settled into total_due,already_paid from private.finance_totals(e.id);
 if total_due+delta not between 1 and 1000000000000 or total_due+delta<already_paid then raise exception 'O ajuste deixaria um saldo inválido. Estorne os pagamentos antes de reduzir esse valor.' using errcode='22023'; end if;
 insert into public.finance_adjustments(professional_id,entry_id,kind,amount_cents,reason,idempotency_key,actor_id)
 values(tenant,e.id,p_kind,delta,p_reason,p_key,auth.uid()) returning id into result_id;return result_id;
end;
$$;
create function private.set_finance_entry_state(p_entry_id uuid,p_action text,p_reason text) returns void language plpgsql security definer set search_path='' as $$
declare e public.finance_entries;total_due bigint;already_paid bigint;
begin
 e=private.lock_finance_entry(p_entry_id);
 if p_reason is null or char_length(trim(p_reason)) not between 3 and 1000 or p_action is null or p_action not in('cancel','dispute','resolve') then raise exception 'Ação ou justificativa inválida.' using errcode='22023'; end if;
 if e.cancelled_at is not null then raise exception 'Conta já cancelada.' using errcode='22023'; end if;
 if p_action='cancel' then
  select total,settled into total_due,already_paid from private.finance_totals(e.id);
  if already_paid<>0 then raise exception 'Estorne os pagamentos antes de cancelar a conta.' using errcode='22023'; end if;
  update public.finance_entries set cancelled_at=now(),cancellation_reason=p_reason,disputed=false where id=e.id;
 else update public.finance_entries set disputed=(p_action='dispute') where id=e.id;
 end if;
 insert into public.audit_events(professional_id,actor_id,entity_id,entity_type,action) values(e.professional_id,auth.uid(),e.id,'finance_entry',p_action);
 insert into public.finance_events(professional_id,entry_id,action,reason,actor_id) values(e.professional_id,e.id,p_action,p_reason,auth.uid());
end;
$$;

create function private.create_commercial_contract(p_plan_id uuid,p_student_id uuid,p_starts_on date,p_ends_on date,p_first_due_date date,p_installments integer,p_interval_months integer,p_key uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare plan public.commercial_plans;prior public.commercial_contracts;result_id uuid;tenant uuid=private.professional_id();i integer;
begin
 if tenant is null then raise exception 'Perfil profissional obrigatório.' using errcode='42501'; end if;
 if p_key is null or p_starts_on is null or p_ends_on is null or p_first_due_date is null or p_ends_on<p_starts_on or p_installments is null or p_installments not between 1 and 120 or p_interval_months is null or p_interval_months not between 1 and 12 then raise exception 'Condições contratuais inválidas.' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(tenant::text||p_key::text,9));
 select * into prior from public.commercial_contracts where professional_id=tenant and idempotency_key=p_key;
 if found then
  if prior.plan_id=p_plan_id and prior.student_id=p_student_id and prior.starts_on=p_starts_on and prior.ends_on=p_ends_on and prior.first_due_date=p_first_due_date and prior.installments=p_installments and prior.interval_months=p_interval_months then return prior.id;end if;
  raise exception 'Chave de contrato já utilizada com outros dados.' using errcode='23505';
 end if;
 select * into plan from public.commercial_plans where id=p_plan_id and professional_id=tenant and active;
 if not found or not exists(select 1 from public.students where id=p_student_id and professional_id=tenant and status='active') then raise exception 'Plano ou aluno não acessível.' using errcode='42501'; end if;
 insert into public.commercial_contracts(professional_id,student_id,plan_id,starts_on,ends_on,first_due_date,installments,interval_months,snapshot,idempotency_key)
 values(tenant,p_student_id,plan.id,p_starts_on,p_ends_on,p_first_due_date,p_installments,p_interval_months,to_jsonb(plan)-'professional_id',p_key) returning id into result_id;
 for i in 0..p_installments-1 loop
  insert into public.finance_entries(professional_id,student_id,direction,description,amount_cents,category,due_date,competence_date,contract_id,installment_number)
  values(tenant,p_student_id,'receivable',plan.name||' · '||(i+1)||'/'||p_installments,plan.amount_cents,plan.modality,(p_first_due_date+make_interval(months=>i*p_interval_months))::date,(p_starts_on+make_interval(months=>i*p_interval_months))::date,result_id,i+1);
 end loop;return result_id;
end;
$$;
create function private.cancel_commercial_contract(p_contract_id uuid,p_reason text,p_cancel_unpaid boolean) returns void language plpgsql security definer set search_path='' as $$
declare c public.commercial_contracts;e public.finance_entries;total_due bigint;already_paid bigint;
begin
 select * into c from public.commercial_contracts where id=p_contract_id and professional_id=private.professional_id() for update;
 if not found then raise exception 'Contrato não acessível.' using errcode='42501'; end if;
 if c.cancelled_at is not null or p_reason is null or char_length(trim(p_reason)) not between 3 and 1000 then raise exception 'Cancelamento inválido.' using errcode='22023'; end if;
 update public.commercial_contracts set cancelled_at=now(),cancellation_reason=p_reason where id=c.id;
 if p_cancel_unpaid then
  for e in select * from public.finance_entries where contract_id=c.id and cancelled_at is null order by id for update loop
   select total,settled into total_due,already_paid from private.finance_totals(e.id);
   if already_paid=0 then update public.finance_entries set cancelled_at=now(),cancellation_reason=p_reason,disputed=false where id=e.id;end if;
  end loop;
 end if;
end;
$$;
create function private.generate_finance_recurrence(p_recurrence_id uuid,p_until date) returns integer language plpgsql security definer set search_path='' as $$
declare r public.finance_recurrences;due date;i integer;generated integer=0;
begin
 select * into r from public.finance_recurrences where id=p_recurrence_id and professional_id=private.professional_id() for update;
 if not found then raise exception 'Recorrência não acessível.' using errcode='42501'; end if;
 if not r.active or p_until is null or p_until>(current_timestamp at time zone 'America/Sao_Paulo')::date+interval '2 years' then raise exception 'Recorrência pausada ou horizonte acima de dois anos.' using errcode='22023'; end if;
 i=r.generated_count;
 loop
  due=(r.first_due_date+make_interval(months=>i*r.interval_months))::date;
  exit when due>p_until or (r.ends_on is not null and due>r.ends_on) or generated>=60 or i>=1200;
  insert into public.finance_entries(professional_id,student_id,direction,description,amount_cents,category,due_date,competence_date,recurrence_id,occurrence_index)
  values(r.professional_id,r.student_id,r.direction,r.description,r.amount_cents,r.category,due,due,r.id,i);
  i=i+1;generated=generated+1;
 end loop;
 update public.finance_recurrences set generated_count=i where id=r.id;return generated;
end;
$$;

-- Exposed RPCs are invoker wrappers; definer code remains outside exposed schemas.
do $permissions$
declare signature text;
begin
 foreach signature in array array['confirm_finance_payment(uuid,bigint,date,text,text,uuid)','reverse_finance_payment(uuid,date,text,uuid)','adjust_finance_entry(uuid,text,bigint,text,uuid)','set_finance_entry_state(uuid,text,text)','create_commercial_contract(uuid,uuid,date,date,date,integer,integer,uuid)','cancel_commercial_contract(uuid,text,boolean)','generate_finance_recurrence(uuid,date)'] loop
  execute 'revoke all on function private.'||signature||' from public';
  execute 'grant execute on function private.'||signature||' to authenticated';
 end loop;
end;
$permissions$;
create function public.confirm_finance_payment(p_entry_id uuid,p_amount_cents bigint,p_effective_date date,p_method text,p_note text,p_key uuid) returns uuid language sql security invoker set search_path='' as $$select private.confirm_finance_payment(p_entry_id,p_amount_cents,p_effective_date,p_method,p_note,p_key);$$;
create function public.reverse_finance_payment(p_payment_id uuid,p_effective_date date,p_reason text,p_key uuid) returns uuid language sql security invoker set search_path='' as $$select private.reverse_finance_payment(p_payment_id,p_effective_date,p_reason,p_key);$$;
create function public.adjust_finance_entry(p_entry_id uuid,p_kind text,p_amount_cents bigint,p_reason text,p_key uuid) returns uuid language sql security invoker set search_path='' as $$select private.adjust_finance_entry(p_entry_id,p_kind,p_amount_cents,p_reason,p_key);$$;
create function public.set_finance_entry_state(p_entry_id uuid,p_action text,p_reason text) returns void language sql security invoker set search_path='' as $$select private.set_finance_entry_state(p_entry_id,p_action,p_reason);$$;
create function public.create_commercial_contract(p_plan_id uuid,p_student_id uuid,p_starts_on date,p_ends_on date,p_first_due_date date,p_installments integer,p_interval_months integer,p_key uuid) returns uuid language sql security invoker set search_path='' as $$select private.create_commercial_contract(p_plan_id,p_student_id,p_starts_on,p_ends_on,p_first_due_date,p_installments,p_interval_months,p_key);$$;
create function public.cancel_commercial_contract(p_contract_id uuid,p_reason text,p_cancel_unpaid boolean) returns void language sql security invoker set search_path='' as $$select private.cancel_commercial_contract(p_contract_id,p_reason,p_cancel_unpaid);$$;
create function public.generate_finance_recurrence(p_recurrence_id uuid,p_until date) returns integer language sql security invoker set search_path='' as $$select private.generate_finance_recurrence(p_recurrence_id,p_until);$$;

create function public.finance_report(p_from date,p_to date) returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if private.professional_id() is null then raise exception 'Perfil profissional obrigatório.' using errcode='42501';end if;
 if p_from is null or p_to is null or p_to<p_from or p_to-p_from>3660 then raise exception 'Período inválido.' using errcode='22023';end if;
 with balances as materialized(select * from public.finance_balances where professional_id=(select private.professional_id())),
 cash as materialized(select p.*,e.direction,e.category,e.student_id from public.finance_payments p join public.finance_entries e on e.id=p.entry_id where p.professional_id=(select private.professional_id()) and p.effective_date between p_from and p_to),
 cash_totals as(select coalesce(sum(amount_cents) filter(where direction='receivable'),0) received,coalesce(sum(amount_cents) filter(where direction='payable'),0) paid from cash),
 accrual as(select coalesce(sum(total_cents) filter(where direction='receivable' and competence_date between p_from and p_to and status<>'cancelled'),0) revenue,coalesce(sum(total_cents) filter(where direction='payable' and competence_date between p_from and p_to and status<>'cancelled'),0) expenses from balances),
 open_totals as(select coalesce(sum(balance_cents) filter(where direction='receivable' and status<>'cancelled'),0) receivable,coalesce(sum(balance_cents) filter(where direction='payable' and status<>'cancelled'),0) payable,coalesce(sum(balance_cents) filter(where direction='receivable' and status<>'cancelled' and due_date<(current_timestamp at time zone 'America/Sao_Paulo')::date),0) overdue from balances),
 months as(select m::date as period_month from generate_series(date_trunc('month',p_from::timestamp),date_trunc('month',p_to::timestamp),interval '1 month') m),
 monthly_cash as(select date_trunc('month',effective_date)::date as period_month,sum(amount_cents) filter(where direction='receivable') received,sum(amount_cents) filter(where direction='payable') paid from cash group by 1),
 monthly_open as(select date_trunc('month',due_date)::date as period_month,sum(balance_cents) filter(where direction='receivable') receivable,sum(balance_cents) filter(where direction='payable') payable from balances where due_date between p_from and p_to and status<>'cancelled' group by 1)
 select jsonb_build_object(
 'from',p_from,'to',p_to,'received_cents',c.received::text,'paid_cents',c.paid::text,'cash_result_cents',(c.received-c.paid)::text,
 'revenue_cents',a.revenue::text,'expense_cents',a.expenses::text,'accrual_result_cents',(a.revenue-a.expenses)::text,
 'receivable_cents',o.receivable::text,'payable_cents',o.payable::text,'overdue_cents',o.overdue::text,
 'monthly',coalesce((select jsonb_agg(jsonb_build_object('month',m.period_month,'received_cents',coalesce(mc.received,0)::text,'paid_cents',coalesce(mc.paid,0)::text,'forecast_receivable_cents',coalesce(mo.receivable,0)::text,'forecast_payable_cents',coalesce(mo.payable,0)::text) order by m.period_month) from months m left join monthly_cash mc using(period_month) left join monthly_open mo using(period_month)),'[]'),
 'by_category',coalesce((select jsonb_agg(jsonb_build_object('direction',direction,'category',category,'amount_cents',amount::text)) from(select direction,category,sum(amount_cents) amount from cash group by direction,category) grouped),'[]'),
 'by_student',coalesce((select jsonb_agg(jsonb_build_object('student_name',coalesce(s.full_name,'Receita sem aluno vinculado'),'amount_cents',grouped.amount::text)) from(select student_id,sum(amount_cents) amount from cash where direction='receivable' group by student_id) grouped left join public.students s on s.id=grouped.student_id),'[]')
 ) into result from cash_totals c cross join accrual a cross join open_totals o;
 return result;
end;
$$;
do $api_grants$
declare signature text;
begin
 foreach signature in array array['confirm_finance_payment(uuid,bigint,date,text,text,uuid)','reverse_finance_payment(uuid,date,text,uuid)','adjust_finance_entry(uuid,text,bigint,text,uuid)','set_finance_entry_state(uuid,text,text)','create_commercial_contract(uuid,uuid,date,date,date,integer,integer,uuid)','cancel_commercial_contract(uuid,text,boolean)','generate_finance_recurrence(uuid,date)','finance_report(date,date)'] loop
  execute 'revoke all on function public.'||signature||' from public,anon';
  execute 'grant execute on function public.'||signature||' to authenticated';
 end loop;
end;
$api_grants$;

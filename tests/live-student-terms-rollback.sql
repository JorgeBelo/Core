-- Validate monthly terms on the hosted database without leaving fixture data.
begin;
do $check$
declare owner_user uuid; tenant uuid; student_user uuid; fixture uuid; actual bigint;
begin
 select user_id,id into owner_user,tenant from public.professionals order by created_at limit 1;
 select id into student_user from auth.users where id<>owner_user and not exists(select 1 from public.professionals p where p.user_id=auth.users.id) limit 1;
 if owner_user is null or student_user is null then raise exception 'Two existing Auth identities are required';end if;
 perform set_config('request.jwt.claim.sub',owner_user::text,true);
 execute 'set local role authenticated';
 insert into public.students(professional_id,full_name,monthly_fee_cents,weekly_frequency) values(tenant,'TESTE MENSALIDADE TRANSACIONAL — NÃO PERSISTIR',35000,3) returning id into fixture;
 update public.students set monthly_fee_cents=40000,weekly_frequency=2 where id=fixture;
 select monthly_fee_cents into actual from public.students where id=fixture and weekly_frequency=2;
 if actual<>40000 or actual is null then raise exception 'Terms were not persisted';end if;
 select count(*) into actual from public.finance_entries where student_id=fixture;
 if actual<>0 then raise exception 'Terms created a financial obligation';end if;
 begin
  update public.students set weekly_frequency=8 where id=fixture;
  raise exception 'Invalid weekly frequency accepted';
 exception when check_violation then null;
 end;
 execute 'reset role';
 update public.students set user_id=student_user where id=fixture;
 perform set_config('request.jwt.claim.sub',student_user::text,true);
 execute 'set local role authenticated';
 select count(*) into actual from public.students where id=fixture and monthly_fee_cents=40000 and weekly_frequency=2;
 if actual<>1 then raise exception 'Student could not read own terms';end if;
 update public.students set monthly_fee_cents=1 where id=fixture;
 get diagnostics actual=row_count;
 if actual<>0 then raise exception 'Student changed own agreed price';end if;
 execute 'reset role';
 if has_column_privilege('anon','public.students','monthly_fee_cents','SELECT') then raise exception 'Anon can read terms';end if;
end;
$check$;
rollback;
select 'PASS: mensalidade e frequência persistidas, limites e RLS válidos, nenhuma cobrança automática, teste integralmente revertido' as verification;

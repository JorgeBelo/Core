-- Optional agreed terms. These fields do not create obligations or payments.
alter table public.students
 add column monthly_fee_cents bigint check(monthly_fee_cents between 1 and 1000000000000),
 add column weekly_frequency integer check(weekly_frequency between 1 and 7);
grant insert(monthly_fee_cents,weekly_frequency),update(monthly_fee_cents,weekly_frequency) on public.students to authenticated;
comment on column public.students.monthly_fee_cents is 'Current agreed monthly amount in integer cents; no automatic billing or payment confirmation.';
comment on column public.students.weekly_frequency is 'Agreed visits per week; not a count of completed appointments.';

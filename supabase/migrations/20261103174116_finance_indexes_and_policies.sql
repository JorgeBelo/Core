-- Cover referencing columns in FK order and preserve existing access predicates.
create index contracts_student_tenant on public.commercial_contracts(student_id,professional_id);
create index adjustments_actor on public.finance_adjustments(actor_id);
create index payments_actor on public.finance_payments(actor_id);
create index finance_events_tenant on public.finance_events(professional_id);
create index versions_approver on public.program_versions(approved_by);
create index versions_program_tenant_student on public.program_versions(program_id,professional_id,student_id);
create index notes_tenant on public.student_notes(professional_id);
create index programs_student_tenant on public.training_programs(student_id,professional_id);
create index sessions_version_tenant_student on public.training_sessions(version_id,professional_id,student_id);

drop policy student_contract_read on public.commercial_contracts;
alter policy owner_read on public.commercial_contracts using (
 professional_id=(select private.professional_id()) or student_id in(select id from public.students where user_id=(select auth.uid()) and status='active')
);
drop policy student_entry_read on public.finance_entries;
alter policy owner_read on public.finance_entries using (
 professional_id=(select private.professional_id()) or (direction='receivable' and student_id in(select id from public.students where user_id=(select auth.uid()) and status='active'))
);
drop policy student_payment_read on public.finance_payments;
alter policy owner_read on public.finance_payments using (
 professional_id=(select private.professional_id()) or entry_id in(select id from public.finance_entries where direction='receivable' and student_id in(select id from public.students where user_id=(select auth.uid()) and status='active'))
);
drop policy student_adjustment_read on public.finance_adjustments;
alter policy owner_read on public.finance_adjustments using (
 professional_id=(select private.professional_id()) or entry_id in(select id from public.finance_entries where direction='receivable' and student_id in(select id from public.students where user_id=(select auth.uid()) and status='active'))
);

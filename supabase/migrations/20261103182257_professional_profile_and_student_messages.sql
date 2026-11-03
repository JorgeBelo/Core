alter table public.professionals
 add column cref text not null default '' check(char_length(cref)<=40),
 add column updated_at timestamptz not null default now(),
 add column message_templates jsonb not null default '{"due":"Olá, {nome}! Lembrete: o pagamento de {valor} vence hoje ({vencimento}). Se já pagou, envie o comprovante para conferência. {personal}","birthday_female":"Parabéns, {nome}! Que você se sinta muito querida neste dia. Desejo alegria, saúde e boas conquistas. Feliz aniversário! {personal}","birthday_male":"Parabéns, {nome}! Que você se sinta muito querido neste dia. Desejo alegria, saúde e boas conquistas. Feliz aniversário! {personal}","birthday_neutral":"Parabéns, {nome}! Que seu dia seja repleto de carinho. Desejo alegria, saúde e boas conquistas. Feliz aniversário! {personal}"}'::jsonb,
 add constraint valid_message_templates check(coalesce(jsonb_typeof(message_templates)='object' and message_templates ?& array['due','birthday_female','birthday_male','birthday_neutral'] and jsonb_typeof(message_templates->'due')='string' and char_length(message_templates->>'due') between 10 and 2000 and jsonb_typeof(message_templates->'birthday_female')='string' and char_length(message_templates->>'birthday_female') between 10 and 2000 and jsonb_typeof(message_templates->'birthday_male')='string' and char_length(message_templates->>'birthday_male') between 10 and 2000 and jsonb_typeof(message_templates->'birthday_neutral')='string' and char_length(message_templates->>'birthday_neutral') between 10 and 2000,false));
grant update(display_name,cref,message_templates) on public.professionals to authenticated;
create policy professional_update on public.professionals for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create trigger professional_timestamp before update on public.professionals for each row execute function private.touch_updated_at();
create function private.audit_professional() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.audit_events(professional_id,actor_id,entity_id,entity_type,action) values(new.id,auth.uid(),new.id,'professional',lower(TG_OP));
 return new;
end;
$$;
revoke all on function private.audit_professional() from public;
create trigger professional_audit after update on public.professionals for each row execute function private.audit_professional();

alter table public.students
 add column gender text not null default 'unspecified' check(gender in('female','male','unspecified')),
 add column whatsapp_opt_in boolean not null default false;
grant insert(gender,whatsapp_opt_in),update(gender,whatsapp_opt_in) on public.students to authenticated;

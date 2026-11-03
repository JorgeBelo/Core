import type { SupabaseClient } from '@supabase/supabase-js';
export { createTrainingRepository } from './training';
export { createFinanceRepository, readableFinanceError } from './finance';
import {
  studentSchema,
  localDate,
  type StudentInput,
  type Student,
  type Professional,
  professionalProfileSchema,
  messageTemplatesSchema,
  defaultMessageTemplates,
  type MessageTemplates,
} from '@core/domain';
export function createRepository(client: SupabaseClient) {
  return {
    async professional(userId: string): Promise<Professional | null> {
      const { data, error } = await client
        .from('professionals')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data
        ? {
            ...data,
            cref: data.cref ?? '',
            updated_at: data.updated_at ?? data.created_at ?? '',
            message_templates: data.message_templates ?? defaultMessageTemplates,
          }
        : null;
    },
    async ownStudent(): Promise<Student | null> {
      const { data, error } = await client.from('students').select('*').limit(1).maybeSingle();
      if (error) throw error;
      return normalize(data);
    },
    async saveProfessional(
      input: { display_name: string; cref: string },
      existing: Professional,
    ): Promise<Professional> {
      const { data, error } = await client
        .from('professionals')
        .update(professionalProfileSchema.parse(input))
        .eq('id', existing.id)
        .eq('updated_at', existing.updated_at)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data)
        throw new Error('Este cadastro foi alterado em outra sessão. Recarregue antes de salvar.');
      return data;
    },
    async saveMessageTemplates(input: MessageTemplates, existing: Professional) {
      const { data, error } = await client
        .from('professionals')
        .update({ message_templates: messageTemplatesSchema.parse(input) })
        .eq('id', existing.id)
        .eq('updated_at', existing.updated_at)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data)
        throw new Error('Este cadastro foi alterado em outra sessão. Recarregue antes de salvar.');
      return data as Professional;
    },
    async allStudents(professionalId: string): Promise<Student[]> {
      const result: Student[] = [];
      let cursor: string | undefined;
      for (;;) {
        let q = client
          .from('students')
          .select('*')
          .eq('professional_id', professionalId)
          .order('id')
          .limit(200);
        if (cursor) q = q.gt('id', cursor);
        const { data, error } = await q;
        if (error) throw error;
        const rows = (data ?? []).map((v) => normalize(v)!);
        result.push(...rows);
        if (rows.length < 200) return result;
        const next = rows[rows.length - 1].id;
        if (next === cursor)
          throw new Error('Não foi possível carregar a lista completa de alunos.');
        cursor = next;
      }
    },
    async students(search: string, page: number): Promise<{ items: Student[]; count: number }> {
      let query = client
        .from('students')
        .select('*', { count: 'exact' })
        .order('full_name')
        .order('id')
        .range(page * 20, page * 20 + 19);
      const term = search
        .replace(/[%_\\(),.*]/g, '')
        .trim()
        .slice(0, 120);
      if (term) query = query.ilike('full_name', `%${term}%`);
      const { data, count, error } = await query;
      if (error) throw error;
      return { items: (data ?? []).map((v) => normalize(v)!), count: count ?? 0 };
    },
    async student(id: string): Promise<Student> {
      const { data, error } = await client.from('students').select('*').eq('id', id).single();
      if (error) throw error;
      return normalize(data)!;
    },
    async saveStudent(
      input: StudentInput,
      professionalId: string,
      existing?: Student,
    ): Promise<Student> {
      const values = studentSchema.parse(input);
      const payload = {
        ...values,
        email: values.email || null,
        birth_date: values.birth_date || null,
      };
      const query = existing
        ? client
            .from('students')
            .update(payload)
            .eq('id', existing.id)
            .eq('updated_at', existing.updated_at)
        : client.from('students').insert({ ...payload, professional_id: professionalId });
      const { data, error } = await query.select().maybeSingle();
      if (error) throw error;
      if (!data)
        throw new Error('Este cadastro foi alterado em outra sessão. Recarregue antes de salvar.');
      return normalize(data)!;
    },
    async dashboard(since: string) {
      const r = await Promise.all([
        client.from('students').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        client
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'inactive'),
        client
          .from('students')
          .select('id', { count: 'exact', head: true })
          .gte('start_date', since)
          .lte('start_date', localDate()),
        client.from('students').select('*').order('created_at', { ascending: false }).limit(4),
      ]);
      for (const result of r) if (result.error) throw result.error;
      return {
        active: r[0].count ?? 0,
        inactive: r[1].count ?? 0,
        recent: r[2].count ?? 0,
        latest: (r[3].data ?? []).map((v) => normalize(v)!),
      };
    },
  };
}
function normalize(data: any): Student | null {
  return data
    ? {
        ...data,
        email: data.email ?? '',
        birth_date: data.birth_date ?? '',
        monthly_fee_cents: data.monthly_fee_cents ?? null,
        weekly_frequency: data.weekly_frequency ?? null,
        gender: data.gender ?? 'unspecified',
        whatsapp_opt_in: data.whatsapp_opt_in ?? false,
      }
    : null;
}
export function readableError(error: unknown): string {
  const value = error as { message?: string; code?: string };
  if (value.code === '23505') return 'Já existe um aluno com esse e-mail neste profissional.';
  if (value.code === '42501') return 'Sua conta não tem permissão para esta operação.';
  if (value.code === '40001') return 'O rascunho mudou. Recarregue antes de aprovar.';
  if (/invalid login/i.test(value.message ?? '')) return 'E-mail ou senha incorretos.';
  if (/fetch|network/i.test(value.message ?? ''))
    return 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';
  if (value.code === 'PGRST116') return 'Cadastro indisponível ou sem permissão de acesso.';
  if (value.message?.startsWith('Este cadastro')) return value.message;
  return 'Não foi possível concluir. Tente novamente. Se persistir, verifique a configuração do servidor.';
}
